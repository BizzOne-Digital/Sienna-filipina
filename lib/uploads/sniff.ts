import type { AllowedMime } from "./constants";

export type DetectedImage = { mime: AllowedMime; ext: "jpg" | "png" | "webp" | "gif" };

/** Identifies the image format from its magic bytes; ignores the browser-supplied type. */
export function detectImage(buf: Uint8Array): DetectedImage | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.subarray(s, e));
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return { mime: "image/gif", ext: "gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}
