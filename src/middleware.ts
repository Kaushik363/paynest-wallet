// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow these through always
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("paynest_token")?.value;

  // Protect dashboard and wallet APIs
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/wallet") || pathname.startsWith("/api/transactions") || pathname.startsWith("/api/users")) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    // Token exists — allow through, API routes verify it themselves
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/auth/")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};