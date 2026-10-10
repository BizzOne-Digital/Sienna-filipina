"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn, formatMoney, slugify } from "@/lib/format";
import type { UploadFolder } from "@/lib/uploads/constants";
import { AdminImageField } from "./AdminImageField";
import { api } from "./api";
import { useConfirm } from "./Confirm";
import { useToast } from "./Toast";
import { useUploadTracker } from "./useUploadTracker";

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea" | "slug" | "email"; required?: boolean; help?: string; rows?: number; maxLength?: number; slugFrom?: string }
  | { name: string; label: string; type: "number"; help?: string; min?: number; max?: number; optional?: boolean }
  | { name: string; label: string; type: "money"; help?: string; optional?: boolean }
  | { name: string; label: string; type: "checkbox"; help?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "image"; folder: UploadFolder; help?: string }
  | { name: string; label: string; type: "images"; folder: UploadFolder; help?: string; max?: number }
  | { name: string; label: string; type: "variants"; help?: string };

export type FieldGroup = { title: string; fields: FieldDef[] };

export type ColumnDef = { label: string; render: (item: any) => React.ReactNode; className?: string };

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

type Props = {
  resource: string;
  singular: string;
  groups: FieldGroup[];
  columns: ColumnDef[];
  defaults: Record<string, any>;
  filters?: FilterDef[];
  /** Map an API item into form values (e.g. populated category -> id). */
  toForm?: (item: any) => Record<string, any>;
  emptyText: string;
};

const PAGE_SIZE = 15;

export function ResourceManager({ resource, singular, groups, columns, defaults, filters = [], toForm, emptyText }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const sp = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.name, sp.get(f.name) ?? ""]))
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, any> } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set("q", search);
    for (const [k, v] of Object.entries(filterValues)) if (v) params.set(k, v);
    try {
      const res = await api(`/api/admin/r/${resource}?${params}`);
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [resource, page, search, filterValues]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item: any) => {
    const label = item.name ?? item.title ?? singular;
    const ok = await confirm({
      title: `Delete ${singular.toLowerCase()}?`,
      message: `“${label}” will be permanently deleted. Images used only by this ${singular.toLowerCase()} are also removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/admin/r/${resource}/${item._id}`, { method: "DELETE" });
      toast.success(`${singular} deleted`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (editing) {
    return (
      <Editor
        resource={resource}
        singular={singular}
        groups={groups}
        id={editing.id}
        initial={editing.values}
        onClose={(saved) => {
          setEditing(null);
          if (saved) load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form
          role="search"
          className="relative min-w-[220px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q.trim());
          }}
        >
          <label htmlFor={`${resource}-q`} className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa" aria-hidden />
          <input id={`${resource}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field pl-9" type="search" />
        </form>
        {filters.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${resource}-f-${f.name}`} className="sr-only">{f.label}</label>
            <select
              id={`${resource}-f-${f.name}`}
              className="field w-auto"
              value={filterValues[f.name] ?? ""}
              onChange={(e) => {
                setPage(1);
                setFilterValues((v) => ({ ...v, [f.name]: e.target.value }));
              }}
            >
              <option value="">{f.label}: all</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ id: null, values: structuredClone(defaults) })}>
          <Plus className="h-4 w-4" aria-hidden /> New {singular.toLowerCase()}
        </button>
      </div>

      <div className="overflow-x-auto border border-line bg-[#fffdfa]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-cream/50 text-left text-xs text-cocoa">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={cn("px-4 py-3 font-medium", c.className)}>{c.label}</th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-cocoa"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></td></tr>
            ) : loadError ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-[#8a2f1f]">{loadError} <button className="ml-2 underline" onClick={load}>Retry</button></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-cocoa">{search ? "No results for that search." : emptyText}</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-cream/30">
                  {columns.map((c) => (
                    <td key={c.label} className={cn("px-4 py-3 align-middle", c.className)}>{c.render(item)}</td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing({ id: item._id, values: { ...structuredClone(defaults), ...(toForm ? toForm(item) : item) } })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden /> Edit
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm text-[#a3392b]" onClick={() => remove(item)} aria-label={`Delete ${item.name ?? item.title}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} total={total} onPage={setPage} />
    </div>
  );
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-cocoa">
      <span>{total} total</span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

function Editor({
  resource,
  singular,
  groups,
  id,
  initial,
  onClose,
}: {
  resource: string;
  singular: string;
  groups: FieldGroup[];
  id: string | null;
  initial: Record<string, any>;
  onClose: (saved: boolean) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const tracker = useUploadTracker();
  const [values, setValues] = useState<Record<string, any>>(initial);
  const [busyUploads, setBusyUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);

  const set = (name: string, v: any) => setValues((s) => ({ ...s, [name]: v }));
  const setImage = (name: string, url: string) => {
    tracker.track(url);
    set(name, url);
  };
  const busyChange = useCallback((b: boolean) => setBusyUploads((n) => Math.max(0, n + (b ? 1 : -1))), []);

  const fields = groups.flatMap((g) => g.fields);
  const payload = () => {
    const out: Record<string, any> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === "number") out[f.name] = v === "" || v == null ? (f.optional ? null : 0) : Number(v);
      else if (f.type === "money") out[f.name] = v === "" || v == null ? (f.optional ? null : 0) : Math.round(Number(v) * 100);
      else if (f.type === "variants")
        out[f.name] = (v ?? []).map((x: any) => ({
          ...(x._id ? { _id: x._id } : {}),
          name: x.name,
          sku: x.sku ?? "",
          priceCents: x.price === "" || x.price == null ? null : Math.round(Number(x.price) * 100),
          stock: Number(x.stock) || 0,
        }));
      else out[f.name] = v;
    }
    return out;
  };

  const cancel = async () => {
    if (dirty && !(await confirm({ title: "Discard changes?", message: "Your unsaved changes will be lost.", confirmLabel: "Discard", danger: true }))) return;
    tracker.finalize(initial);
    onClose(false);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
          const body = payload();
          await api(id ? `/api/admin/r/${resource}/${id}` : `/api/admin/r/${resource}`, { method: id ? "PUT" : "POST", json: body });
          tracker.finalize(body);
          toast.success(`${singular} saved`);
          onClose(true);
        } catch (err) {
          setError((err as Error).message);
          toast.error((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[2rem]">{id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}><X className="h-4 w-4" aria-hidden /> Close</button>
      </div>
      <div className="space-y-6">
        {groups.map((g) => (
          <fieldset key={g.title} className="border border-line bg-[#fffdfa] p-5 sm:p-6">
            <legend className="px-2 font-serif text-xl">{g.title}</legend>
            <div className="grid gap-5 md:grid-cols-2">
              {g.fields.map((f) => (
                <FieldInput key={f.name} field={f} value={values[f.name]} values={values} set={set} setImage={setImage} onBusyChange={busyChange} />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 border border-[#e5b9ad] bg-[#fbeee9] px-4 py-3 text-sm text-[#8a2f1f]">{error}</p>}
      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-line bg-[#f8f1ea]/95 py-4 backdrop-blur">
        <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || busyUploads > 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busyUploads > 0 ? "Waiting for upload…" : saving ? "Saving…" : `Save ${singular.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  field: f,
  value,
  values,
  set,
  setImage,
  onBusyChange,
}: {
  field: FieldDef;
  value: any;
  values: Record<string, any>;
  set: (n: string, v: any) => void;
  setImage: (n: string, url: string) => void;
  onBusyChange: (b: boolean) => void;
}) {
  const id = `f-${f.name}`;
  const wide = f.type === "textarea" || f.type === "images" || f.type === "variants";
  const help = f.help ? <p className="mt-1 text-xs text-cocoa">{f.help}</p> : null;

  switch (f.type) {
    case "checkbox":
      return (
        <div className="flex items-start gap-3 md:col-span-1">
          <input id={id} type="checkbox" className="mt-1 h-5 w-5 accent-[#9c5944]" checked={!!value} onChange={(e) => set(f.name, e.target.checked)} />
          <div>
            <label htmlFor={id} className="text-sm font-medium">{f.label}</label>
            {help}
          </div>
        </div>
      );
    case "image":
      return (
        <div className="md:col-span-2">
          <AdminImageField label={f.label} folder={f.folder} value={value ?? ""} onChange={(u) => setImage(f.name, u)} help={f.help} onBusyChange={onBusyChange} />
        </div>
      );
    case "images": {
      const list: string[] = value ?? [];
      const max = f.max ?? 8;
      return (
        <div className="md:col-span-2">
          <p className="field-label">{f.label}</p>
          {help}
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {list.map((url, i) => (
              <li key={`${url}-${i}`} className="border border-line p-3">
                <AdminImageField
                  compact
                  label={i === 0 ? "Main image" : `Image ${i + 1}`}
                  folder={f.folder}
                  value={url}
                  onBusyChange={onBusyChange}
                  onChange={(u) => {
                    if (u) setImage(f.name, u);
                    const next = [...list];
                    if (u) next[i] = u;
                    else next.splice(i, 1);
                    set(f.name, next);
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => {
                    const next = [...list];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    set(f.name, next);
                  }}>Move up</button>
                </div>
              </li>
            ))}
          </ul>
          {list.length < max && (
            <div className="mt-4 border border-dashed border-line p-3">
              <AdminImageField
                compact
                label="Add image"
                folder={f.folder}
                value=""
                onBusyChange={onBusyChange}
                onChange={(u) => {
                  if (!u) return;
                  setImage(f.name, u);
                  set(f.name, [...(values[f.name] ?? []), u]);
                }}
              />
            </div>
          )}
        </div>
      );
    }
    case "variants": {
      const list: any[] = value ?? [];
      const update = (i: number, patch: any) => set(f.name, list.map((v, j) => (j === i ? { ...v, ...patch } : v)));
      return (
        <div className="md:col-span-2">
          <p className="field-label">{f.label}</p>
          {help}
          {list.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs text-cocoa">
                  <tr><th className="pb-2 font-medium">Option name</th><th className="pb-2 font-medium">SKU</th><th className="pb-2 font-medium">Price ($, optional)</th><th className="pb-2 font-medium">Stock</th><th /></tr>
                </thead>
                <tbody>
                  {list.map((v, i) => (
                    <tr key={v._id ?? `new-${i}`}>
                      <td className="pr-2 pb-2"><input aria-label="Option name" required className="field" value={v.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="SKU" className="field" value={v.sku ?? ""} onChange={(e) => update(i, { sku: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Price" type="number" min={0} step="0.01" className="field" value={v.price ?? ""} onChange={(e) => update(i, { price: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Stock" type="number" min={0} step={1} required className="field" value={v.stock ?? 0} onChange={(e) => update(i, { stock: e.target.value })} /></td>
                      <td className="pb-2"><button type="button" className="btn btn-ghost btn-sm text-[#a3392b]" aria-label="Remove option" onClick={() => set(f.name, list.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => set(f.name, [...list, { name: "", sku: "", price: "", stock: 0 }])}>
            <Plus className="h-4 w-4" aria-hidden /> Add option
          </button>
        </div>
      );
    }
    case "select":
      return (
        <div>
          <label htmlFor={id} className="field-label">{f.label}</label>
          <select id={id} className="field" value={value ?? ""} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">— None —</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {help}
        </div>
      );
    case "number":
    case "money":
      return (
        <div>
          <label htmlFor={id} className="field-label">{f.label}</label>
          <input
            id={id}
            type="number"
            className="field"
            step={f.type === "money" ? "0.01" : "1"}
            min={f.type === "money" ? 0 : (f as any).min}
            max={(f as any).max}
            required={!(f as any).optional}
            value={value ?? ""}
            onChange={(e) => set(f.name, e.target.value)}
          />
          {help}
        </div>
      );
    case "textarea":
      return (
        <div className={wide ? "md:col-span-2" : ""}>
          <label htmlFor={id} className="field-label">{f.label}</label>
          <textarea id={id} className="field" rows={f.rows ?? 4} maxLength={f.maxLength} required={f.required} value={value ?? ""} onChange={(e) => set(f.name, e.target.value)} />
          {help}
        </div>
      );
    case "slug":
      return (
        <div>
          <label htmlFor={id} className="field-label">{f.label}</label>
          <div className="flex gap-2">
            <input id={id} className="field" value={value ?? ""} onChange={(e) => set(f.name, e.target.value.toLowerCase())} pattern="[a-z0-9-]*" />
            {f.slugFrom && (
              <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => set(f.name, slugify(values[f.slugFrom!] ?? ""))}>Generate</button>
            )}
          </div>
          <p className="mt-1 text-xs text-cocoa">{f.help ?? "Leave blank to generate from the name."}</p>
        </div>
      );
    default:
      return (
        <div>
          <label htmlFor={id} className="field-label">{f.label}{f.required && <span aria-hidden className="text-copper"> *</span>}</label>
          <input id={id} type={f.type === "email" ? "email" : "text"} className="field" required={f.required} maxLength={f.maxLength} value={value ?? ""} onChange={(e) => set(f.name, e.target.value)} />
          {help}
        </div>
      );
  }
}

/* Small shared cell renderers */
export const Thumb = ({ src }: { src?: string }) => (
  <div className="relative h-12 w-12 overflow-hidden border border-line bg-cream">
    <SafeImage src={src} alt="" fill sizes="48px" className="object-cover" />
  </div>
);
export const Badge = ({ on, yes, no }: { on: boolean; yes: string; no: string }) => (
  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs", on ? "bg-[#e7f1e6] text-[#2f5e2b]" : "bg-cream text-cocoa")}>{on ? yes : no}</span>
);
export const money = (c?: number | null) => (c == null ? "—" : formatMoney(c));
