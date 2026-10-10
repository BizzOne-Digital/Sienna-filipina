"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Search, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/format";
import { api } from "./api";
import { useConfirm } from "./Confirm";
import { Pager } from "./ResourceManager";
import { useToast } from "./Toast";

const STATUSES = ["new", "read", "replied", "archived"] as const;

export function MessagesManager() {
  const sp = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) p.set("q", search);
    if (status) p.set("status", status);
    try {
      const r = await api(`/api/admin/r/messages?${p}`);
      setItems(r.items);
      setTotal(r.total);
      setPages(r.pages);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);
  useEffect(() => {
    load();
  }, [load]);

  const setMsgStatus = async (m: any, s: string) => {
    try {
      await api(`/api/admin/r/messages/${m._id}`, { method: "PUT", json: { status: s } });
      setItems((list) => list.map((x) => (x._id === m._id ? { ...x, status: s } : x)));
      setSelected((cur: any) => (cur?._id === m._id ? { ...cur, status: s } : cur));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <form role="search" className="relative min-w-[180px] flex-1" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
            <label htmlFor="msg-q" className="sr-only">Search messages</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa" aria-hidden />
            <input id="msg-q" type="search" className="field pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <label htmlFor="msg-status" className="sr-only">Status</label>
          <select id="msg-status" className="field w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></div>
        ) : items.length === 0 ? (
          <p className="border border-line bg-[#fffdfa] px-4 py-12 text-center text-sm text-cocoa">No messages.</p>
        ) : (
          <ul className="divide-y divide-line border border-line bg-[#fffdfa]">
            {items.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  className={cn("w-full px-4 py-3 text-left text-sm hover:bg-cream/40", selected?._id === m._id && "bg-cream/60")}
                  onClick={() => {
                    setSelected(m);
                    if (m.status === "new") setMsgStatus(m, "read");
                  }}
                >
                  <div className="flex justify-between gap-2">
                    <span className={cn(m.status === "new" && "font-semibold")}>{m.name}</span>
                    <span className="text-xs text-cocoa">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="truncate text-cocoa">{m.subject || m.message}</p>
                  {m.status === "new" && <span className="mt-1 inline-block rounded-full bg-copper px-2 text-[10px] text-white">NEW</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} pages={pages} total={total} onPage={setPage} />
      </div>

      <div className="h-fit border border-line bg-[#fffdfa] p-6 lg:sticky lg:top-6">
        {!selected ? (
          <p className="text-sm text-cocoa">Select a message to read it.</p>
        ) : (
          <div>
            <h2 className="text-2xl">{selected.subject || "(No subject)"}</h2>
            <p className="mt-2 text-sm">
              {selected.name} · <a href={`mailto:${selected.email}`} className="text-copper">{selected.email}</a>
              {selected.phone && ` · ${selected.phone}`}
            </p>
            <p className="text-xs text-cocoa">{new Date(selected.createdAt).toLocaleString()}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your message to Sienna Filipina"}`)}`} className="btn btn-primary btn-sm">
                <Mail className="h-4 w-4" aria-hidden /> Reply by email
              </a>
              <label htmlFor="msg-set" className="sr-only">Status</label>
              <select id="msg-set" className="field w-auto" value={selected.status} onChange={(e) => setMsgStatus(selected, e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm ml-auto text-[#a3392b]"
                onClick={async () => {
                  if (!(await confirm({ title: "Delete message?", message: "This message will be permanently deleted.", confirmLabel: "Delete", danger: true }))) return;
                  try {
                    await api(`/api/admin/r/messages/${selected._id}`, { method: "DELETE" });
                    toast.success("Message deleted");
                    setSelected(null);
                    load();
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
