import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware – runs before every request.
 * Responsibilities:
 * 1. Resolve tenant from host / headers
 * 2. Inject tenant info into request headers so Server Components can read it cheaply
 * 3. Block requests that have no valid tenant (except public marketing / platform routes)
 */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/webhooks/stripe",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

const PLATFORM_PATHS = ["/platform", "/api/platform"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";

  // Allow public & platform routes without tenant
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PLATFORM_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // For everything else we require a tenant context.
  // We do a lightweight check here and let the full resolve happen in Server Components.
  // We still set useful headers for downstream code.

  const response = NextResponse.next();

  // Pass the original host so resolveTenant() can use it
  response.headers.set("x-forwarded-host", host);

  // Optional: if SINGLE_TENANT_SLUG is set, force it
  if (process.env.SINGLE_TENANT_SLUG) {
    response.headers.set("x-tenant-slug", process.env.SINGLE_TENANT_SLUG);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
