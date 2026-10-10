"use client";

import { useCallback, useRef } from "react";

/**
 * Remembers images uploaded during one editing session. When the session ends (save or cancel),
 * uploads that did not end up in the saved document are discarded server-side
 * (the server refuses to delete anything still referenced).
 */
export function useUploadTracker() {
  const uploaded = useRef(new Set<string>());

  const track = useCallback((url: string) => {
    if (url.startsWith("/api/uploads/")) uploaded.current.add(url);
  }, []);

  const finalize = useCallback((kept: unknown) => {
    const keep = JSON.stringify(kept ?? "");
    const orphans = [...uploaded.current].filter((u) => !keep.includes(u));
    uploaded.current.clear();
    for (const url of orphans) {
      fetch("/api/admin/uploads/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  return { track, finalize };
}
