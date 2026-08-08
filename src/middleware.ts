import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-App", "TAKA69");
  // light touch — real auth is enforced in API + admin layout
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("taka69_token");
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", "/admin");
      return NextResponse.redirect(url);
    }
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
