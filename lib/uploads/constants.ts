// Shared by the browser image field and the server routes.

export const UPLOAD_FOLDERS = ["products", "gallery", "pages", "misc"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB original image limit
/** Vercel Functions accept ~4.5 MB request bodies; leave room for multipart overhead. */
export const DIRECT_UPLOAD_MAX_BYTES = Math.floor(3.5 * 1024 * 1024);
export const CHUNK_SIZE = 1024 * 1024; // 1 MB

export const UPLOAD_URL_PREFIX = "/api/uploads/";
export const FILENAME_RE = /^\d{13}-[a-f0-9]{16}\.(jpg|png|webp|gif)$/;

export function isUploadFolder(v: unknown): v is UploadFolder {
  return typeof v === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(v);
}
