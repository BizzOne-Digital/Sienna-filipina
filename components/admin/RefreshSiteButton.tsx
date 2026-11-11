"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "./api";
import { useToast } from "./Toast";

/** Forces the public website to show the latest products and content right away. */
export function RefreshSiteButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api("/api/admin/revalidate", { method: "POST" });
          toast.success("Website refreshed. Latest changes are now live.");
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
      Refresh website
    </button>
  );
}
