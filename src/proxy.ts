import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Ha admin útvonalat kér, és nem SUPERADMIN vagy ADMIN
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Ha gyártói útvonalat kér (dashboard), és a felhasználó nem VENDOR (és nem is admin)
    if (pathname.startsWith("/dashboard") && token?.role !== "VENDOR" && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
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
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
