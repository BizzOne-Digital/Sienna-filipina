"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => setStartedAt(Date.now()), []);

  if (status.kind === "sent") {
    return (
      <div className="border border-line bg-[#fffdfa] p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-copper" aria-hidden />
        <h2 className="mt-4 text-3xl">Thank you</h2>
        <p className="mt-2 text-sm text-cocoa">Your message has been received. We will reply to you by email.</p>
        <button type="button" className="btn btn-outline mt-6" onClick={() => setStatus({ kind: "idle" })}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate={false}
      className="space-y-5 border border-line bg-[#fffdfa] p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setStatus({ kind: "sending" });
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...Object.fromEntries(fd.entries()), startedAt }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || "Your message could not be sent.");
          form.reset();
          setStatus({ kind: "sent" });
        } catch (err) {
          setStatus({ kind: "error", message: (err as Error).message });
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">Name <span aria-hidden className="text-copper">*</span></label>
          <input id="c-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">Email <span aria-hidden className="text-copper">*</span></label>
          <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">Phone (optional)</label>
          <input id="c-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="c-subject" className="field-label">Subject</label>
          <input id="c-subject" name="subject" maxLength={160} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="c-message" className="field-label">Message <span aria-hidden className="text-copper">*</span></label>
        <textarea id="c-message" name="message" required minLength={10} maxLength={5000} rows={6} className="field" />
      </div>
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {status.kind === "error" && (
        <p role="alert" className="border border-[#e5b9ad] bg-[#fbeee9] px-4 py-3 text-sm text-[#8a2f1f]">
          {status.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status.kind === "sending"}>
        {status.kind === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {status.kind === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
