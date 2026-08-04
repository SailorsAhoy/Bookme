# Bookme – Multi-tenant Restaurant Booking Platform

Sell as a **one-time self-hosted install** or run as **SaaS** with Stripe billing.

## Features (current)

| Feature | Status |
|---------|--------|
| Strong tenant isolation (`tenantId` on every model + auto-scoped Prisma client) | ✅ |
| Auth (NextAuth credentials, roles: OWNER / ADMIN / STAFF) | ✅ |
| Visual Floor Plan (red/green tables, date/section filters, click-to-assign) | ✅ |
| Admin Settings (logo, colors, fonts, business info) | ✅ |
| Sections & Tables CRUD | ✅ |
| Public booking page (`/book`) with branding | ✅ |
| Reservations list + status management | ✅ |
| Multi-language message files (en / es) | ✅ foundation |
| Docker + docker-compose (one-off ready) | ✅ |
| Stripe SaaS subscriptions | ⏳ next |

## Quick start (development)

```bash
cp .env.example .env
# Edit DATABASE_URL, NEXTAUTH_SECRET, SINGLE_TENANT_SLUG

npm install
npx prisma db push
npx prisma db seed          # creates two demo restaurants
npm run dev
```

Demo logins (after seed):
- `owner@laterraza.cat` / `password123`  (La Terraza)
- `owner@bellavista.it` / `password123`  (Bella Vista)

Set `SINGLE_TENANT_SLUG=la-terraza` (or `bella-vista`) in `.env` for local single-tenant mode.

## One-off install (Docker)

```bash
# 1. Clone & configure
cp .env.example .env
# Set SINGLE_TENANT_SLUG and a strong NEXTAUTH_SECRET

# 2. Start
docker compose up -d --build

# 3. Run migrations + seed (first time)
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

Point the client’s domain to the server (or use the VPS IP).  
Each paid client gets their own deployment (or you run multi-tenant SaaS mode with `ROOT_DOMAIN`).

## Tenant isolation

Every request resolves a tenant via:

1. `x-tenant-slug` / `x-tenant-id` header  
2. Custom domain  
3. Subdomain (`client.yoursaas.com`)  
4. `SINGLE_TENANT_SLUG` env (one-off installs)

All Prisma queries are automatically scoped by a client extension.  
Never use the raw `prisma` client for tenant data in application code.

## Project structure

```
src/
  lib/
    tenant.ts      ← resolution + Prisma extension (isolation core)
    db.ts          ← all business data access (always tenant-scoped)
    auth/          ← NextAuth + session helpers
  app/
    book/          ← public reservation form
    dashboard/     ← staff area (floor-plan, reservations, settings)
    (auth)/login/
prisma/
  schema.prisma
  seed.ts
messages/          ← i18n (en, es)
docker-compose.yml
Dockerfile
```

## Roadmap

- [ ] Full next-intl integration + locale switcher
- [ ] Stripe subscription lifecycle (create tenant on payment)
- [ ] Email / SMS confirmations
- [ ] Drag-and-drop table reordering on floor plan
- [ ] Opening hours & availability rules per section
- [ ] Guest-facing booking widget (embeddable)

## License

GPL-3.0 (see LICENSE)
