import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // ─── Oldalak védelme ───
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/dashboard") && token?.role !== "VENDOR" && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // ─── API route-ok védelme ───
    if (pathname.startsWith("/api/admin")) {
      if (token?.role !== "SUPERADMIN" && token?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/vendor/:path*"
  ],
};
