import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Coarse, cookie-existence-only gate. It cannot validate the JWT (that's
 * the backend's job) — it just avoids sending obviously logged-out users
 * to admin pages, and logged-in users back to /login. Real authorization
 * (profile + permission checks) happens in AuthProvider/AuthGate and on
 * every API call itself.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("accessToken");
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/" ) {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/login", request.url)
    );
  }

  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
