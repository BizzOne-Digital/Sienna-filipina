"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        setError("");
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j.error || "Sign in failed");
          window.location.href = "/admin";
        } catch (err) {
          setError((err as Error).message);
          setLoading(false);
        }
      }}
    >
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {error && <p role="alert" className="text-sm text-[#8a2f1f]">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Sign in
      </button>
    </form>
  );
}
