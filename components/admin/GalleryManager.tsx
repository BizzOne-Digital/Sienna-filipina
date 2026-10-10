"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, Search, Trash2, Upload } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { UPLOAD_FOLDERS } from "@/lib/uploads/constants";
import { api } from "./api";
import { useConfirm } from "./Confirm";
import { Pager } from "./ResourceManager";
import { useToast } from "./Toast";
import { uploadImage, validateImageFile } from "./upload-client";

export function GalleryManager() {
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (folder) p.set("folder", folder);
    if (search) p.set("q", search);
    try {
      const r = await api(`/api/admin/media?${p}`);
      setItems(r.items);
      setTotal(r.total);
      setPages(r.pages);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, folder, search, toast]);
  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(`${file.name}: ${problem}`);
        continue;
      }
      setUploading({ name: file.name, progress: 0 });
      try {
        await uploadImage(file, "gallery", (p) => setUploading({ name: file.name, progress: p }), new AbortController().signal);
        toast.success(`${file.name} uploaded`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
    setPage(1);
    load();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form role="search" className="relative min-w-[200px] flex-1" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
          <label htmlFor="g-q" className="sr-only">Search by original file name</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa" aria-hidden />
          <input id="g-q" type="search" className="field pl-9" placeholder="Search file names" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <label htmlFor="g-folder" className="sr-only">Folder</label>
        <select id="g-folder" className="field w-auto" value={folder} onChange={(e) => { setPage(1); setFolder(e.target.value); }}>
          <option value="">All folders</option>
          {UPLOAD_FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input ref={inputRef} id="g-file" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => e.target.files && uploadFiles(e.target.files)} disabled={!!uploading} />
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={!!uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
          {uploading ? `${uploading.name} ${Math.round(uploading.progress * 100)}%` : "Upload images"}
        </button>
      </div>
      <p className="mb-4 text-xs text-cocoa">
        Images are stored in MongoDB. Gallery uploads are kept until you delete them here. Images marked “Unused” are not referenced by any page, product, article or setting.
      </p>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></div>
      ) : items.length === 0 ? (
        <p className="border border-line bg-[#fffdfa] px-4 py-12 text-center text-sm text-cocoa">No uploaded images yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m._id} className="border border-line bg-[#fffdfa]">
              <div className="relative aspect-square bg-cream">
                <SafeImage src={m.url} alt={m.originalName || m.filename} fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] ${m.inUse ? "bg-[#e7f1e6] text-[#2f5e2b]" : "bg-espresso/80 text-white"}`}>
                  {m.inUse ? "In use" : "Unused"}
                </span>
              </div>
              <div className="space-y-1 p-3 text-xs">
                <p className="truncate font-medium" title={m.originalName}>{m.originalName || m.filename}</p>
                <p className="text-cocoa">{m.folder} · {(m.size / 1024).toFixed(0)} KB</p>
                <div className="flex gap-1 pt-1">
                  <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => navigator.clipboard.writeText(m.url).then(() => toast.success("Image URL copied"))} aria-label="Copy image URL">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2 text-[#a3392b]"
                    aria-label="Delete image"
                    onClick={async () => {
                      if (!(await confirm({ title: "Delete image?", message: "The image will be permanently removed. Images still used on the website cannot be deleted.", confirmLabel: "Delete", danger: true }))) return;
                      try {
                        await api(`/api/admin/media/${m._id}`, { method: "DELETE" });
                        toast.success("Image deleted");
                        load();
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pages={pages} total={total} onPage={setPage} />
    </div>
  );
}
