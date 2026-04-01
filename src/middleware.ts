import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // CVE-2025-29927 bypass engellemesi
    const headers = new Headers(req.headers);
    headers.delete("x-middleware-subrequest");
    return NextResponse.next({ request: { headers } });
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/stripe/webhook|_next/static|_next/image|favicon|public).*)",
  ],
};
