"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { api } from "./api";
import { Pager } from "./ResourceManager";
import { useToast } from "./Toast";

const STATUSES = [
  ["pending_payment", "Awaiting payment"],
  ["paid", "Paid"],
  ["processing", "Processing"],
  ["shipped", "Shipped"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

export function OrdersManager() {
  const sp = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: "15" });
    if (search) p.set("q", search);
    if (status) p.set("status", status);
    try {
      const r = await api(`/api/admin/r/orders?${p}`);
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

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <form role="search" className="relative min-w-[220px] flex-1" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
          <label htmlFor="orders-q" className="sr-only">Search orders</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa" aria-hidden />
          <input id="orders-q" type="search" className="field pl-9" placeholder="Order number, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <label htmlFor="orders-status" className="sr-only">Status</label>
        <select id="orders-status" className="field w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading" /></div>
      ) : items.length === 0 ? (
        <p className="border border-line bg-[#fffdfa] px-4 py-12 text-center text-sm text-cocoa">No orders found.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => (
            <li key={o._id} className="border border-line bg-[#fffdfa]">
              <button type="button" className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left text-sm" aria-expanded={open === o._id} onClick={() => setOpen(open === o._id ? null : o._id)}>
                <span className="font-medium text-copper">{o.orderNumber}</span>
                <span>{o.customer?.name}</span>
                <span className="text-cocoa">{formatDate(o.createdAt)}</span>
                <span className="tabular-nums">{formatMoney(o.totalCents)}</span>
                <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs">{STATUSES.find(([v]) => v === o.status)?.[1]}</span>
                {open === o._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === o._id && <OrderDetail order={o} onSaved={load} />}
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pages={pages} total={total} onPage={setPage} />
    </div>
  );
}

function OrderDetail({ order, onSaved }: { order: any; onSaved: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const a = order.shippingAddress ?? {};

  return (
    <div className="grid gap-6 border-t border-line p-4 text-sm md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-cocoa">Customer</h3>
          <p className="mt-1">{order.customer?.name}<br /><a className="text-copper" href={`mailto:${order.customer?.email}`}>{order.customer?.email}</a>{order.customer?.phone && <><br />{order.customer.phone}</>}</p>
        </div>
        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-cocoa">Deliver to</h3>
          <p className="mt-1 whitespace-pre-line">{[a.line1, a.line2, [a.city, a.state, a.postalCode].filter(Boolean).join(", "), a.country].filter(Boolean).join("\n")}</p>
        </div>
        {order.notes && <div><h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-cocoa">Customer notes</h3><p className="mt-1">{order.notes}</p></div>}
        <table className="w-full">
          <caption className="sr-only">Items</caption>
          <tbody className="divide-y divide-line">
            {order.items.map((it: any, i: number) => (
              <tr key={i}><td className="py-1.5">{it.name}{it.variantName ? ` (${it.variantName})` : ""} × {it.quantity}</td><td className="text-right tabular-nums">{it.isGift ? "Free" : formatMoney(it.lineCents)}</td></tr>
            ))}
            <tr className="font-medium"><td className="py-1.5">Total</td><td className="text-right tabular-nums">{formatMoney(order.totalCents)}</td></tr>
          </tbody>
        </table>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await api(`/api/admin/r/orders/${order._id}`, { method: "PUT", json: { status, paymentStatus, adminNotes } });
            toast.success("Order updated");
            onSaved();
          } catch (err) {
            toast.error((err as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <p className="border border-line bg-cream/50 p-3 text-xs leading-relaxed text-cocoa">
          Manual payment workflow: confirm details with the customer by email, mark the payment as <strong>paid</strong> only after you have received it, then move the order forward.
        </p>
        <div>
          <label htmlFor={`st-${order._id}`} className="field-label">Order status</label>
          <select id={`st-${order._id}`} className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`ps-${order._id}`} className="field-label">Payment</label>
          <select id={`ps-${order._id}`} className="field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid (received)</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label htmlFor={`an-${order._id}`} className="field-label">Internal notes</label>
          <textarea id={`an-${order._id}`} className="field" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} maxLength={2000} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save order</button>
      </form>
    </div>
  );
}
