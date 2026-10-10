"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { PAGE_DEFS } from "@/lib/content/pages";
import { cn } from "@/lib/format";
import { AdminImageField } from "./AdminImageField";
import { api } from "./api";
import { useConfirm } from "./Confirm";
import { useToast } from "./Toast";
import { useUploadTracker } from "./useUploadTracker";

type Loaded = { data: Record<string, string>; seoTitle: string; seoDescription: string };

export function PagesEditor() {
  const [key, setKey] = useState(PAGE_DEFS[0].key);
  const confirm = useConfirm();
  const [dirty, setDirty] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Pages" className="lg:sticky lg:top-6 lg:h-fit">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {PAGE_DEFS.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                aria-current={key === p.key ? "page" : undefined}
                className={cn("min-h-11 w-full whitespace-nowrap px-3 text-left text-sm", key === p.key ? "bg-copper text-white" : "hover:bg-cream")}
                onClick={async () => {
                  if (p.key === key) return;
                  if (dirty && !(await confirm({ title: "Discard changes?", message: "You have unsaved changes on this page.", confirmLabel: "Discard", danger: true }))) return;
                  setDirty(false);
                  setKey(p.key);
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <PageForm key={key} pageKey={key} onDirty={setDirty} />
    </div>
  );
}

function PageForm({ pageKey, onDirty }: { pageKey: string; onDirty: (d: boolean) => void }) {
  const def = PAGE_DEFS.find((p) => p.key === pageKey)!;
  const toast = useToast();
  const tracker = useUploadTracker();
  const [initial, setInitial] = useState<Loaded | null>(null);
  const [values, setValues] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(0);
  const busyChange = useCallback((b: boolean) => setBusy((n) => Math.max(0, n + (b ? 1 : -1))), []);

  useEffect(() => {
    api<Loaded & { success: boolean }>(`/api/admin/pages/${pageKey}`)
      .then((r) => {
        const v = { data: r.data, seoTitle: r.seoTitle, seoDescription: r.seoDescription };
        setInitial(v);
        setValues(v);
      })
      .catch((e) => setError(e.message));
    return () => tracker.finalize(null); // leaving without saving discards fresh uploads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  if (error) return <p role="alert" className="text-sm text-[#8a2f1f]">{error}</p>;
  if (!values) return <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></div>;

  const setField = (name: string, v: string) => setValues((s) => (s ? { ...s, data: { ...s.data, [name]: v } } : s));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await api(`/api/admin/pages/${pageKey}`, { method: "PUT", json: values });
          tracker.finalize(values);
          setInitial(values);
          toast.success(`${def.label} saved. Changes are live.`);
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[2rem]">{def.label}</h2>
        <a href={def.path} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm text-copper">
          View page <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <div className="space-y-6">
        {def.sections.map((s) => (
          <fieldset key={s.title} className="border border-line bg-[#fffdfa] p-5 sm:p-6">
            <legend className="px-2 font-serif text-xl">{s.title}</legend>
            <div className="grid gap-5 md:grid-cols-2">
              {s.fields.map((f) => {
                const id = `pg-${f.name}`;
                const v = values.data[f.name] ?? "";
                if (f.type === "image")
                  return (
                    <div key={f.name} className="md:col-span-2">
                      <AdminImageField
                        label={f.label}
                        folder="pages"
                        value={v}
                        onBusyChange={busyChange}
                        onChange={(u) => {
                          tracker.track(u);
                          setField(f.name, u);
                        }}
                      />
                    </div>
                  );
                return (
                  <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                    <label htmlFor={id} className="field-label">{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea id={id} className="field" rows={4} value={v} onChange={(e) => setField(f.name, e.target.value)} maxLength={5000} />
                    ) : (
                      <input id={id} className="field" value={v} onChange={(e) => setField(f.name, e.target.value)} maxLength={300} />
                    )}
                    {f.help && <p className="mt-1 text-xs text-cocoa">{f.help}</p>}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
        <fieldset className="border border-line bg-[#fffdfa] p-5 sm:p-6">
          <legend className="px-2 font-serif text-xl">Search engine (SEO)</legend>
          <div className="grid gap-5">
            <div>
              <label htmlFor="pg-seoTitle" className="field-label">SEO title</label>
              <input id="pg-seoTitle" className="field" maxLength={120} value={values.seoTitle} onChange={(e) => setValues({ ...values, seoTitle: e.target.value })} />
            </div>
            <div>
              <label htmlFor="pg-seoDescription" className="field-label">SEO description</label>
              <textarea id="pg-seoDescription" className="field" rows={2} maxLength={300} value={values.seoDescription} onChange={(e) => setValues({ ...values, seoDescription: e.target.value })} />
            </div>
          </div>
        </fieldset>
      </div>
      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-line bg-[#f8f1ea]/95 py-4 backdrop-blur">
        <button type="button" className="btn btn-ghost" disabled={!dirty || saving} onClick={() => setValues(initial)}>Reset</button>
        <button type="submit" className="btn btn-primary" disabled={!dirty || saving || busy > 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy > 0 ? "Waiting for upload…" : "Save page"}
        </button>
      </div>
    </form>
  );
}
