"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { UploadFolder } from "@/lib/uploads/constants";
import { useToast } from "./Toast";
import { uploadImage, validateImageFile } from "./upload-client";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  help?: string;
  /** Lets parent forms block saving while an upload is running. */
  onBusyChange?: (busy: boolean) => void;
  compact?: boolean;
};

/**
 * Uploads an image (direct or chunked) and reports the saved URL string via onChange.
 * The previous image is never deleted here: the server removes it only after the
 * content document has been saved with the new URL and nothing else uses the old one.
 */
export function AdminImageField({ label, value, onChange, folder, help, onBusyChange, compact }: Props) {
  const id = useId();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const busy = progress !== null;

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  // Release the temporary object URL whenever it changes or the field unmounts.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleFile(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setProgress(0);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await uploadImage(file, folder, setProgress, ctrl.signal);
      onChange(res.url);
      toast.success(`${label}: image uploaded. Remember to save.`);
    } catch (e) {
      if (!ctrl.signal.aborted) toast.error((e as Error).message || "Upload failed");
    } finally {
      setProgress(null);
      setPreview(null);
      abortRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shown = preview ?? value;
  const size = compact ? "h-24 w-24" : "h-36 w-48";

  return (
    <div>
      <span className="field-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`relative ${size} shrink-0 overflow-hidden border border-line bg-cream`}>
          {shown ? (
            preview ? (
              // Local blob preview while uploading; next/image cannot load blob: URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <SafeImage src={value} alt={`${label} preview`} fill sizes="200px" className="object-cover" />
            )
          ) : (
            <div className="grid h-full w-full place-items-center text-cocoa/60">
              <ImagePlus className="h-7 w-7" aria-hidden />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-ivory/75">
              <div className="text-center text-xs font-medium text-espresso">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-copper" aria-hidden />
                {Math.round((progress ?? 0) * 100)}%
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            aria-labelledby={`${id}-label`}
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {value ? <RefreshCw className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
            {value ? "Replace" : "Upload"}
          </button>
          {busy ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => abortRef.current?.abort()}>
              <X className="h-4 w-4" aria-hidden /> Cancel
            </button>
          ) : (
            value && (
              <button type="button" className="btn btn-ghost btn-sm text-[#a3392b]" onClick={() => onChange("")}>
                <Trash2 className="h-4 w-4" aria-hidden /> Remove
              </button>
            )
          )}
          <span className="sr-only" aria-live="polite">
            {busy ? `Uploading ${Math.round((progress ?? 0) * 100)} percent` : ""}
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-cocoa">{help ?? "PNG, JPEG, WebP or GIF, up to 8 MB."}</p>
    </div>
  );
}
