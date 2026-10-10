"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { SettingsDTO } from "@/lib/types";
import { AdminImageField } from "./AdminImageField";
import { api } from "./api";
import { useToast } from "./Toast";
import { useUploadTracker } from "./useUploadTracker";

export function SettingsForm() {
  const toast = useToast();
  const tracker = useUploadTracker();
  const [initial, setInitial] = useState<SettingsDTO | null>(null);
  const [s, setS] = useState<SettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const busyChange = useCallback((b: boolean) => setBusy((n) => Math.max(0, n + (b ? 1 : -1))), []);

  useEffect(() => {
    api("/api/admin/settings")
      .then((r) => {
        const keys: (keyof SettingsDTO)[] = [
          "siteName", "tagline", "logo", "announcement", "announcementEnabled", "email", "phone", "showPhone", "businessHours",
          "facebookUrl", "instagramUrl", "comboOfferText", "shippingNote", "seoTitle", "seoDescription",
        ];
        const v = Object.fromEntries(keys.map((k) => [k, r.settings[k]])) as SettingsDTO;
        v.businessHours = (v.businessHours ?? []).map((h) => ({ label: h.label, value: h.value }));
        setInitial(v);
        setS(v);
      })
      .catch((e) => setError(e.message));
  }, []);
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(initial), [s, initial]);

  if (error) return <p role="alert" className="text-sm text-[#8a2f1f]">{error}</p>;
  if (!s) return <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></div>;

  const set = <K extends keyof SettingsDTO>(k: K, v: SettingsDTO[K]) => setS({ ...s, [k]: v });
  const text = (k: keyof SettingsDTO, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, help?: string) => (
    <div>
      <label htmlFor={`s-${k}`} className="field-label">{label}</label>
      <input id={`s-${k}`} className="field" value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} {...props} />
      {help && <p className="mt-1 text-xs text-cocoa">{help}</p>}
    </div>
  );
  const check = (k: keyof SettingsDTO, label: string, help?: string) => (
    <div className="flex items-start gap-3">
      <input id={`s-${k}`} type="checkbox" className="mt-1 h-5 w-5 accent-[#9c5944]" checked={!!s[k]} onChange={(e) => set(k, e.target.checked as never)} />
      <div>
        <label htmlFor={`s-${k}`} className="text-sm font-medium">{label}</label>
        {help && <p className="text-xs text-cocoa">{help}</p>}
      </div>
    </div>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await api("/api/admin/settings", { method: "PUT", json: s });
          tracker.finalize(s);
          setInitial(s);
          toast.success("Settings saved. Changes are live.");
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6 md:grid-cols-2">
        <legend className="px-2 font-serif text-xl">Brand</legend>
        {text("siteName", "Site name", { required: true, maxLength: 80 })}
        {text("tagline", "Tagline", { maxLength: 80 })}
        <div className="md:col-span-2">
          <AdminImageField
            label="Logo"
            folder="misc"
            value={s.logo}
            onBusyChange={busyChange}
            onChange={(u) => {
              tracker.track(u);
              set("logo", u);
            }}
            help="Optional. Leave empty to use the official logo bundled with the site. Upload a transparent PNG or WebP for best results."
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6 md:grid-cols-2">
        <legend className="px-2 font-serif text-xl">Announcement bar</legend>
        <div className="md:col-span-2">{text("announcement", "Announcement text", { maxLength: 160 })}</div>
        {check("announcementEnabled", "Show announcement bar")}
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6 md:grid-cols-2">
        <legend className="px-2 font-serif text-xl">Contact</legend>
        {text("email", "Email", { type: "email", maxLength: 200 }, "Shown on the Contact page and footer.")}
        {text("phone", "Phone", { type: "tel", maxLength: 40 })}
        {check("showPhone", "Show phone number publicly")}
        <div className="md:col-span-2">
          <p className="field-label">Business hours</p>
          <p className="mb-3 text-xs text-cocoa">Hours are hidden until you add them.</p>
          <ul className="space-y-2">
            {s.businessHours.map((h, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label="Days" className="field" placeholder="e.g. Mon – Fri" value={h.label} required maxLength={40}
                  onChange={(e) => set("businessHours", s.businessHours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input aria-label="Hours" className="field" placeholder="e.g. 9:00 AM – 5:00 PM" value={h.value} required maxLength={60}
                  onChange={(e) => set("businessHours", s.businessHours.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" className="btn btn-ghost btn-sm text-[#a3392b]" aria-label="Remove row" onClick={() => set("businessHours", s.businessHours.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => set("businessHours", [...s.businessHours, { label: "", value: "" }])} disabled={s.businessHours.length >= 10}>
            <Plus className="h-4 w-4" aria-hidden /> Add hours
          </button>
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6 md:grid-cols-2">
        <legend className="px-2 font-serif text-xl">Social links</legend>
        {text("facebookUrl", "Facebook page URL", { type: "url", placeholder: "https://www.facebook.com/…" }, "Links stay hidden until a valid URL is saved.")}
        {text("instagramUrl", "Instagram profile URL", { type: "url", placeholder: "https://www.instagram.com/…" })}
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6">
        <legend className="px-2 font-serif text-xl">Offers & checkout</legend>
        <div>
          <label htmlFor="s-combo" className="field-label">Combo offer text</label>
          <textarea id="s-combo" className="field" rows={2} maxLength={300} value={s.comboOfferText} onChange={(e) => set("comboOfferText", e.target.value)} />
          <p className="mt-1 text-xs text-cocoa">Shown on combo product pages. The free gift at checkout is the published product with the slug “rice-soap”.</p>
        </div>
        <div>
          <label htmlFor="s-ship" className="field-label">Checkout delivery note</label>
          <textarea id="s-ship" className="field" rows={2} maxLength={500} value={s.shippingNote} onChange={(e) => set("shippingNote", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-[#fffdfa] p-5 sm:p-6">
        <legend className="px-2 font-serif text-xl">Default SEO</legend>
        {text("seoTitle", "Default SEO title", { maxLength: 120 })}
        <div>
          <label htmlFor="s-seod" className="field-label">Default SEO description</label>
          <textarea id="s-seod" className="field" rows={2} maxLength={300} value={s.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </div>
      </fieldset>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-[#f8f1ea]/95 py-4 backdrop-blur">
        <button type="button" className="btn btn-ghost" disabled={!dirty || saving} onClick={() => setS(initial)}>Reset</button>
        <button type="submit" className="btn btn-primary" disabled={!dirty || saving || busy > 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save settings
        </button>
      </div>
    </form>
  );
}
