import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast redirect for visitors without a session cookie. This is only a convenience:
 * every admin page and API route verifies the session against the database itself.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const hasCookie = req.cookies.has("__Host-sf_admin") || req.cookies.has("sf_admin");
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
