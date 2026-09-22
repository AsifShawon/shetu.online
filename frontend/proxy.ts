import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_DASHBOARD_PREFIXES = ["/dashboard/student", "/dashboard/consultant", "/dashboard/agency", "/dashboard/admin"];
const AUTH_PATHS = ["/login", "/register", "/otp", "/forgot-password", "/reset-password"];
const ADMIN_LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isUserDashboard = USER_DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAdminDashboard = pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH;
  const isAuthPage = AUTH_PATHS.some((path) => pathname === path);

  // Check for the frontend auth marker cookie set by auth-provider on login.
  // Django's "sessionid" lives on 127.0.0.1:8000 (different origin) so it's
  // never visible here; we use our own lightweight "edu_auth" cookie instead.
  const hasSession = request.cookies.has("edu_auth");

  if (isUserDashboard && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminDashboard && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    // Already logged in — send to a sensible default (client-side dashboard redirect handles role)
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/admin/login",
    "/login",
    "/register",
    "/otp",
    "/forgot-password",
    "/reset-password"
  ]
};
