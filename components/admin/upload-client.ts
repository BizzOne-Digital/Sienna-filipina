"use client";

import {
  ALLOWED_MIME,
  DIRECT_UPLOAD_MAX_BYTES,
  MAX_UPLOAD_BYTES,
  type UploadFolder,
} from "@/lib/uploads/constants";
import { ApiError, api } from "./api";

export type UploadResponse = { success: true; url: string; filename: string; size: number; folder: UploadFolder };

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) return "Please choose a PNG, JPEG, WebP or GIF image.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return `Images must be 8 MB or smaller (this one is ${(file.size / 1048576).toFixed(1)} MB).`;
  return null;
}

/** XHR so we get upload progress for the direct flow. */
function directUpload(file: File, folder: UploadFolder, onProgress: (p: number) => void, signal: AbortSignal) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 401) window.location.href = "/admin/login";
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new ApiError(xhr.status, body.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));
    xhr.onabort = () => reject(new ApiError(0, "Upload cancelled"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.send(fd);
  });
}

/** Large files: ~1 MB chunks, each retried up to 3 times (the server treats retries idempotently). */
async function chunkedUpload(file: File, folder: UploadFolder, onProgress: (p: number) => void, signal: AbortSignal) {
  const init = await api<{ uploadId: string; chunkSize: number; totalChunks: number }>("/api/upload/chunked", {
    method: "POST",
    json: { folder, size: file.size, type: file.type, name: file.name },
  });
  const { uploadId, chunkSize, totalChunks } = init;
  try {
    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) throw new ApiError(0, "Upload cancelled");
      const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
      let attempt = 0;
      for (;;) {
        try {
          await api(`/api/upload/chunked/${uploadId}/${i}`, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "application/octet-stream" },
            signal,
          });
          break;
        } catch (e) {
          if (++attempt >= 3 || signal.aborted || (e instanceof ApiError && e.status >= 400 && e.status < 500)) throw e;
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
      onProgress((i + 1) / (totalChunks + 1));
    }
    const done = await api<UploadResponse>(`/api/upload/chunked/${uploadId}/complete`, { method: "POST", signal });
    onProgress(1);
    return done;
  } catch (e) {
    fetch(`/api/upload/chunked/${uploadId}`, { method: "DELETE" }).catch(() => {});
    throw e;
  }
}

/** Chooses the direct or chunked flow automatically based on size. */
export function uploadImage(file: File, folder: UploadFolder, onProgress: (p: number) => void, signal: AbortSignal) {
  return file.size <= DIRECT_UPLOAD_MAX_BYTES
    ? directUpload(file, folder, onProgress, signal)
    : chunkedUpload(file, folder, onProgress, signal);
}
