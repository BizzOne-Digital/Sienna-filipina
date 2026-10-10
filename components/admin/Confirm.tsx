"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

type Options = { title: string; message: string; confirmLabel?: string; danger?: boolean };
type Pending = Options & { resolve: (ok: boolean) => void };

const ConfirmCtx = createContext<((o: Options) => Promise<boolean>) | null>(null);

/** Promise-based confirmation dialog for destructive actions. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const confirm = useCallback((o: Options) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);

  useEffect(() => {
    if (pending) ref.current?.showModal();
  }, [pending]);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    ref.current?.close();
    setPending(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        className="m-auto w-[min(92vw,440px)] border border-line bg-ivory p-0 text-espresso shadow-2xl backdrop:bg-espresso/40"
        aria-labelledby="confirm-title"
      >
        {pending && (
          <div className="p-6">
            <div className="flex gap-3">
              {pending.danger && <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[#a3392b]" aria-hidden />}
              <div>
                <h2 id="confirm-title" className="text-2xl">{pending.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-cocoa">{pending.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => close(false)} autoFocus>
                Cancel
              </button>
              <button type="button" className={`btn btn-sm ${pending.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)}>
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const c = useContext(ConfirmCtx);
  if (!c) throw new Error("useConfirm must be used inside ConfirmProvider");
  return c;
}
