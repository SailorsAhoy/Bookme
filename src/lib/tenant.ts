import { headers } from "next/headers";
import { prisma } from "./prisma";
import type { Tenant, User } from "@prisma/client";

/**
 * Tenant context that is available throughout a request.
 * Always resolve tenant FIRST, then scope every query.
 */
export type TenantContext = {
  tenant: Tenant;
  user?: User | null;
  isPlatformAdmin: boolean;
};

/**
 * Resolve the current tenant from the request.
 *
 * Resolution order (SaaS-friendly):
 * 1. Custom domain (bookings.client.com)
 * 2. Subdomain (client.yoursaas.com)
 * 3. x-tenant-slug or x-tenant-id header (API / internal)
 * 4. SINGLE_TENANT_SLUG env var (one-off self-hosted installs)
 */
export async function resolveTenant(): Promise<Tenant | null> {
  const hdrs = await headers();
  const host = hdrs.get("host")?.toLowerCase().split(":")[0] ?? "";
  const tenantHeader = hdrs.get("x-tenant-slug") || hdrs.get("x-tenant-id");

  // 1. Explicit header (highest priority for API / testing)
  if (tenantHeader) {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantHeader }, { slug: tenantHeader }],
        status: { in: ["ACTIVE", "TRIAL"] },
      },
    });
    if (tenant) return tenant;
  }

  // 2. Custom domain
  if (host) {
    const byDomain = await prisma.tenant.findFirst({
      where: {
        customDomain: host,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
    });
    if (byDomain) return byDomain;
  }

  // 3. Subdomain (e.g. acme.yoursaas.com → slug = "acme")
  const rootDomain = process.env.ROOT_DOMAIN; // e.g. "yoursaas.com"
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const slug = host.replace(`.${rootDomain}`, "");
    if (slug && slug !== "www" && slug !== "app" && slug !== "admin") {
      const bySlug = await prisma.tenant.findFirst({
        where: {
          slug,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
      });
      if (bySlug) return bySlug;
    }
  }

  // 4. Single-tenant mode (one-off paid install)
  const singleSlug = process.env.SINGLE_TENANT_SLUG;
  if (singleSlug) {
    return prisma.tenant.findFirst({
      where: {
        slug: singleSlug,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
    });
  }

  return null;
}

/**
 * Hard requirement: every request that touches data MUST have a tenant.
 * Throws if none found → 404 / 403 at the edge.
 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await resolveTenant();
  if (!tenant) {
    throw new TenantNotFoundError();
  }
  return tenant;
}

/**
 * Creates a Prisma client extension that automatically injects
 * `tenantId` into every query. This is the core of tenant isolation.
 *
 * Usage:
 *   const db = createTenantClient(tenantId);
 *   await db.reservation.findMany(...) // already filtered
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Models that are global (no tenantId) – currently only Tenant itself
          const globalModels = ["Tenant"];
          if (globalModels.includes(model ?? "")) {
            return query(args);
          }

          // Inject tenantId into where / data for every operation
          const tenantFilter = { tenantId };

          if (operation === "create") {
            args.data = { ...args.data, ...tenantFilter };
          } else if (operation === "createMany") {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => ({ ...d, ...tenantFilter }));
            }
          } else if (
            ["findMany", "findFirst", "findUnique", "findFirstOrThrow", "findUniqueOrThrow", "count", "aggregate", "groupBy"].includes(operation)
          ) {
            args.where = { ...args.where, ...tenantFilter };
          } else if (["update", "updateMany", "delete", "deleteMany"].includes(operation)) {
            args.where = { ...args.where, ...tenantFilter };
          } else if (operation === "upsert") {
            args.where = { ...args.where, ...tenantFilter };
            args.create = { ...args.create, ...tenantFilter };
          }

          return query(args);
        },
      },
    },
  });
}

/**
 * Convenience helper used in Server Actions / Route Handlers.
 * Resolves tenant + returns a scoped Prisma client.
 */
export async function getTenantDb() {
  const tenant = await requireTenant();
  const db = createTenantClient(tenant.id);
  return { tenant, db };
}

/**
 * Platform-level client (only for SaaS owner / super-admin operations).
 * Never use this for normal restaurant data.
 */
export function getPlatformDb() {
  return prisma;
}

// ============================================================
// Errors
// ============================================================
export class TenantNotFoundError extends Error {
  constructor(message = "Tenant not found or inactive") {
    super(message);
    this.name = "TenantNotFoundError";
  }
}

export class TenantAccessDeniedError extends Error {
  constructor(message = "Access denied for this tenant") {
    super(message);
    this.name = "TenantAccessDeniedError";
  }
}

/**
 * Assert that a user belongs to the given tenant.
 * Platform admins are allowed to bypass (for support).
 */
export function assertUserBelongsToTenant(
  user: { tenantId: string; role: string },
  tenantId: string
) {
  if (user.role === "PLATFORM_ADMIN") return;
  if (user.tenantId !== tenantId) {
    throw new TenantAccessDeniedError();
  }
}
