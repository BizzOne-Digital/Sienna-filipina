import "server-only";
import { randomBytes } from "node:crypto";
import type { Model } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import {
  BlogPost,
  Category,
  PageContent,
  Product,
  SiteSettings,
  StoredUpload,
  TeamMember,
  Testimonial,
} from "@/models";
import {
  FILENAME_RE,
  MAX_UPLOAD_BYTES,
  UPLOAD_URL_PREFIX,
  isUploadFolder,
  type UploadFolder,
} from "./constants";
import { detectImage } from "./sniff";

export class UploadError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type UploadResult = { success: true; url: string; filename: string; size: number; folder: UploadFolder };

/** Validates bytes by signature and persists one StoredUpload document. */
export async function saveImage(opts: {
  data: Buffer;
  folder: UploadFolder;
  adminId: string;
  originalName?: string;
}): Promise<UploadResult> {
  const { data, folder } = opts;
  if (data.length === 0) throw new UploadError(400, "The file is empty");
  if (data.length > MAX_UPLOAD_BYTES) throw new UploadError(413, "Images must be 8 MB or smaller");
  const detected = detectImage(data);
  if (!detected) throw new UploadError(415, "Only PNG, JPEG, WebP and GIF images are allowed");

  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${detected.ext}`;
  await connectDB();
  await StoredUpload.create({
    folder,
    filename,
    mimeType: detected.mime,
    size: data.length,
    data,
    originalName: (opts.originalName ?? "").slice(0, 200),
    uploadedBy: opts.adminId,
  });
  return { success: true, url: `${UPLOAD_URL_PREFIX}${folder}/${filename}`, filename, size: data.length, folder };
}

/** Parses "/api/uploads/{folder}/{filename}" strictly; returns null for anything else. */
export function parseUploadUrl(url: unknown): { folder: UploadFolder; filename: string } | null {
  if (typeof url !== "string" || !url.startsWith(UPLOAD_URL_PREFIX)) return null;
  const rest = url.slice(UPLOAD_URL_PREFIX.length).split("?")[0];
  const parts = rest.split("/");
  if (parts.length !== 2) return null;
  const [folder, filename] = parts;
  if (!isUploadFolder(folder) || !isSafeFilename(filename)) return null;
  return { folder, filename };
}

export function isSafeFilename(name: string) {
  return (
    !!name &&
    !name.includes("..") &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("\0") &&
    FILENAME_RE.test(name)
  );
}

/** Every "/api/uploads/..." string found anywhere inside a value (used to maintain imageRefs). */
export function collectUploadUrls(value: unknown, out = new Set<string>()): string[] {
  if (typeof value === "string") {
    if (parseUploadUrl(value)) out.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUploadUrls(v, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (k !== "imageRefs") collectUploadUrls(v, out);
  }
  return [...out];
}

// Every content model keeps an indexed `imageRefs` array, so reference checks are cheap.
const REFERENCING_MODELS: Model<any>[] = [
  Product,
  Category,
  BlogPost,
  PageContent,
  TeamMember,
  Testimonial,
  SiteSettings,
];

export async function isUploadReferenced(url: string) {
  await connectDB();
  for (const m of REFERENCING_MODELS) {
    if (await m.exists({ imageRefs: url })) return true;
  }
  return false;
}

export async function findUploadUsage(url: string) {
  await connectDB();
  const usage: string[] = [];
  for (const m of REFERENCING_MODELS) {
    const n = await m.countDocuments({ imageRefs: url });
    if (n) usage.push(`${m.modelName} (${n})`);
  }
  return usage;
}

/** Deletes a stored upload by its URL. Never touches external URLs. */
export async function deleteUploadByUrl(url: string) {
  const parsed = parseUploadUrl(url);
  if (!parsed) return false;
  await connectDB();
  const res = await StoredUpload.deleteOne(parsed);
  return res.deletedCount === 1;
}

/**
 * Call only AFTER the content document has been saved. Deletes uploads that were referenced
 * before the save, are no longer referenced by the saved document, and are not used anywhere else.
 */
export async function cleanupReplacedUploads(previousRefs: string[], nextRefs: string[]) {
  const keep = new Set(nextRefs);
  for (const url of previousRefs) {
    if (keep.has(url)) continue;
    // Gallery images are curated library items; they are removed only from the Gallery screen.
    if (parseUploadUrl(url)?.folder === "gallery") continue;
    try {
      if (!(await isUploadReferenced(url))) await deleteUploadByUrl(url);
    } catch (e) {
      console.error("Upload cleanup failed", url, e);
    }
  }
}
