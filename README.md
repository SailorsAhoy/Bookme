# Restaurant Booking Platform

Multi-tenant restaurant table booking system.  
Sell as a **one-time self-hosted install** or run as a **SaaS** with Stripe billing.

## Tenant Isolation (Core Design)

Every piece of restaurant data is strictly isolated by `tenantId`.

### How isolation works

1. **Tenant resolution** (happens on every request)
   - Custom domain → `bookings.clientrestaurant.com`
   - Subdomain → `client.yoursaas.com`
   - Header → `x-tenant-slug` / `x-tenant-id` (API & testing)
   - Single-tenant mode → `SINGLE_TENANT_SLUG` env var (one-off installs)

2. **Automatic query scoping**
   ```ts
   const { tenant, db } = await getTenantDb();
   // db is a Prisma client extension that injects tenantId into EVERY query
   await db.reservation.findMany(...); // already filtered
   ```

3. **Never use raw `prisma` for tenant data**
   - Only the platform/SaaS owner uses `getPlatformDb()` / raw `prisma`
   - Application code always goes through `getTenantDb()` or the helpers in `src/lib/db.ts`

4. **Users belong to one tenant**
   - `@@unique([tenantId, email])` – same email can exist in different restaurants
   - Role `PLATFORM_ADMIN` is the only exception (SaaS support)

### Environment variables

```env
# Database
DATABASE_URL="postgresql://..."

# Multi-tenant SaaS
ROOT_DOMAIN="yoursaas.com"          # enables subdomain routing

# One-off self-hosted install
SINGLE_TENANT_SLUG="my-restaurant"  # forces a single tenant

# Stripe (SaaS only)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PROFESSIONAL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### Deployment modes

| Mode              | How tenant is resolved              | Typical use case          |
|-------------------|-------------------------------------|---------------------------|
| SaaS multi-tenant | subdomain or custom domain          | You host many restaurants |
| One-off install   | `SINGLE_TENANT_SLUG`                | Client pays once, self-hosts |
| Development       | `x-tenant-slug` header or single slug | Local testing             |

### Safety guarantees

- Prisma client extension rejects any operation that would leak data across tenants
- Middleware + `requireTenant()` ensure no request proceeds without a valid active tenant
- Cascade deletes: removing a tenant removes all its users, sections, tables, reservations
- File uploads (future) will be stored under `/uploads/{tenantId}/...`

## Getting started

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed   # creates a demo tenant
npm run dev
```

## Project structure

```
src/
  lib/
    tenant.ts     ← tenant resolution + Prisma extension (isolation core)
    db.ts         ← all business data access (always tenant-scoped)
    prisma.ts     ← raw client (platform use only)
  middleware.ts   ← early tenant context injection
prisma/
  schema.prisma   ← every model has tenantId
```

## Next steps in this codebase

- Auth (NextAuth + tenant-aware sessions)
- Visual floor-plan dashboard (red/green tables)
- Admin branding UI (logo, colors, fonts)
- Stripe subscription lifecycle
- Public booking widget
- Multi-language (next-intl)
```
