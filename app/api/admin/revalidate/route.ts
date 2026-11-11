import { NextResponse } from "next/server";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { withAdmin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clears the storefront cache, e.g. after catalogue changes made by a script. */
export const POST = withAdmin(async () => {
  refreshStorefront();
  return NextResponse.json({ success: true });
});
