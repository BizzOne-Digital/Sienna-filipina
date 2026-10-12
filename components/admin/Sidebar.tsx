"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Package,
  Receipt,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/blogs", label: "Blogs", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ adminName, children }: { adminName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-center border-b border-line">
        <Image src="/brand/logo-transparent.png" alt="Sienna Filipina" width={175} height={130} className="h-16 w-auto" />
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm transition-colors",
                active(href) ? "bg-copper text-white" : "text-espresso hover:bg-cream"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden /> {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-line p-3">
        <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center gap-3 px-3 text-sm text-cocoa hover:text-copper">
          <ExternalLink className="h-4 w-4" aria-hidden /> View website
        </a>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 px-3 text-sm text-cocoa hover:text-copper"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/admin/login";
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
        <p className="truncate px-3 pt-1 text-xs text-cocoa/70">Signed in as {adminName}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f8f1ea] text-espresso">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-ivory lg:block">{nav}</aside>
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-ivory px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center" aria-label="Open admin menu">
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-serif text-xl">Sienna Filipina Admin</span>
        <span className="w-11" />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ivory shadow-xl">
            <button type="button" className="absolute right-2 top-2 grid h-11 w-11 place-items-center" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

export function AdminPageTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[2.4rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-cocoa">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
