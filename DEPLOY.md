# Deploy your first client

Two ways to sell Bookme:

| Model | Best for | How it works |
|-------|----------|--------------|
| **One-off install** | Single restaurant, fixed fee | You deploy one isolated instance on a VPS. Client pays once. |
| **SaaS** | Recurring revenue | One multi-tenant app. Clients sign up via `/pricing` + Stripe. |

This guide focuses on **your first real client** with the **one-off model** (fastest to cash). SaaS steps are at the end.

---

## Part A — One-off install (recommended for client #1)

### 0. What you need

- A VPS (Hetzner, DigitalOcean, Linode, etc.) — 1 vCPU / 1–2 GB RAM is enough to start
- A domain (or subdomain) the client will use, e.g. `bookings.theirrestaurant.com`
- SSH access to the VPS
- This repo: `https://github.com/SailorsAhoy/Bookme`

### 1. Create the VPS and point DNS

1. Create an Ubuntu 22.04/24.04 server.
2. Point DNS:
   - **A record**: `bookings.clientdomain.com` → VPS IP  
   - (Optional) root domain if they want that instead.
3. Wait for DNS to propagate (often a few minutes).

### 2. Install Docker on the VPS

```bash
ssh root@YOUR_VPS_IP

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Optional: non-root user
# usermod -aG docker ubuntu
```

### 3. Clone the app

```bash
mkdir -p /opt/bookme && cd /opt/bookme
git clone https://github.com/SailorsAhoy/Bookme.git .
```

### 4. Configure environment

```bash
cp .env.example .env
nano .env
```

**Minimum required values for a one-off client:**

```env
# Database (matches docker-compose defaults — change password in production)
DATABASE_URL="postgresql://bookme:CHANGE_THIS_PASSWORD@db:5432/bookme?schema=public"

# Auth — generate a long random secret
NEXTAUTH_SECRET="paste-a-long-random-string-here"
NEXTAUTH_URL="https://bookings.clientdomain.com"

# ONE-OFF MODE: forces this single restaurant
SINGLE_TENANT_SLUG="client-restaurant"

# Leave ROOT_DOMAIN empty for one-off
# ROOT_DOMAIN=

# Stripe not required for pure one-off
# Email optional but recommended for confirmations later
EMAIL_FROM="Bookings <noreply@clientdomain.com>"
```

Generate a secret:

```bash
openssl rand -base64 32
```

**Important:** In `docker-compose.yml`, align the Postgres password with `DATABASE_URL`, or override via env.

Example override in `.env` used by compose (if you extend compose later):

```env
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
```

For the default `docker-compose.yml`, either:

- Keep `bookme_secret` in both places, or  
- Edit `docker-compose.yml` → `POSTGRES_PASSWORD` and matching `DATABASE_URL`.

### 5. Start the stack

```bash
cd /opt/bookme
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f app
```

### 6. Initialize the database

```bash
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

The seed creates demo tenants (`la-terraza`, `bella-vista`). For a real client you should either:

**Option A — Reuse seed then rename (quick demo)**  
Set `SINGLE_TENANT_SLUG=la-terraza`, log in as `owner@laterraza.cat` / `password123`, then change branding in Settings.

**Option B — Create a clean tenant (recommended for paid client)**

```bash
docker compose exec app npx tsx -e '
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();
(async () => {
  const slug = "client-restaurant"; // must match SINGLE_TENANT_SLUG
  const hash = await bcrypt.hash("ChangeMeNow123!", 10);
  const t = await p.tenant.create({
    data: {
      name: "Client Restaurant Name",
      slug,
      status: "ACTIVE",
      plan: "PROFESSIONAL",
      primaryColor: "#0f766e",
      secondaryColor: "#134e4a",
      fontFamily: "Inter",
      defaultLocale: "en",
      enabledLocales: ["en", "es"],
      users: {
        create: {
          email: "owner@clientdomain.com",
          name: "Owner",
          passwordHash: hash,
          role: "OWNER",
        },
      },
      sections: {
        create: { name: "Main", slug: "main", sortOrder: 1 },
      },
    },
  });
  const sec = await p.section.findFirst({ where: { tenantId: t.id } });
  await p.table.createMany({
    data: [
      { tenantId: t.id, sectionId: sec.id, label: "T1", capacity: 2, sortOrder: 1 },
      { tenantId: t.id, sectionId: sec.id, label: "T2", capacity: 4, sortOrder: 2 },
      { tenantId: t.id, sectionId: sec.id, label: "T3", capacity: 4, sortOrder: 3 },
      { tenantId: t.id, sectionId: sec.id, label: "T4", capacity: 6, sortOrder: 4 },
    ],
  });
  console.log("Created tenant", t.slug, "owner@clientdomain.com / ChangeMeNow123!");
  await p.\$disconnect();
})();
'
```

Set `SINGLE_TENANT_SLUG=client-restaurant` in `.env`, then:

```bash
docker compose up -d app
```

### 7. HTTPS with Caddy (simplest) or Nginx

**Caddy (automatic HTTPS):**

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# Config
cat > /etc/caddy/Caddyfile << 'EOF'
bookings.clientdomain.com {
    reverse_proxy localhost:3000
}
EOF

systemctl reload caddy
```

Update `NEXTAUTH_URL` to `https://bookings.clientdomain.com` and restart:

```bash
docker compose up -d app
```

### 8. Hand over to the client

Send them:

| Item | Value |
|------|--------|
| Staff login | `https://bookings.clientdomain.com/login` |
| Owner email | `owner@clientdomain.com` |
| Temp password | (what you set) — tell them to change it |
| Public booking page | `https://bookings.clientdomain.com/book` |

**Client checklist (first 15 minutes):**

1. Log in → **Settings**
2. Set logo, colors, fonts, business info
3. Create sections (Interior, Terrace, …) + tables
4. Set section availability (hours + days)
5. Share `/book` on Instagram / Google / website
6. Use **Floor Plan** and **Reservations** daily

### 9. What you charge (example)

- One-time license + setup: €500–€2,000  
- Optional monthly hosting/support: €30–€80  

You own the VPS; client does not get the source unless your contract says so.

---

## Part B — SaaS mode (many clients on one app)

### 1. One deployment, many tenants

On a single VPS / platform (Railway, Fly, Render, VPS):

```env
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://app.yoursaas.com
ROOT_DOMAIN=yoursaas.com

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...

# Do NOT set SINGLE_TENANT_SLUG in SaaS mode
```

### 2. Stripe setup

1. Create Products + recurring Prices in Stripe Dashboard.  
2. Copy Price IDs into env.  
3. Webhook endpoint: `https://app.yoursaas.com/api/webhooks/stripe`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.  
4. Customer Portal: enable in Stripe settings.

### 3. DNS for SaaS

- `app.yoursaas.com` → your app (marketing + `/pricing` + login)  
- `*.yoursaas.com` → same app (tenant subdomains, e.g. `la-terraza.yoursaas.com`)  
- Optional: custom domains per client → point to your app; set `customDomain` on the Tenant row.

### 4. Client self-serve flow

1. Client visits `/pricing`  
2. Enters name, slug, email → Stripe Checkout (14-day trial)  
3. Webhook creates tenant + owner + default tables  
4. Welcome email with temp password (if SMTP configured)  
5. Client logs in and configures branding / sections  

### 5. Hosting each SaaS client’s “install”

In true multi-tenant SaaS you **do not** spin a new VPS per client.  
One app process + one database; isolation is by `tenantId` (already implemented).

If a client insists on dedicated infrastructure, sell them the **one-off** path (Part A).

---

## Quick troubleshooting

| Problem | Check |
|---------|--------|
| Login fails / wrong restaurant | `SINGLE_TENANT_SLUG` matches tenant `slug`; `NEXTAUTH_URL` matches public URL |
| `/book` 404 / tenant error | Tenant status is `ACTIVE` or `TRIAL`; slug resolution works |
| Stripe webhook 400 | Webhook secret, raw body, HTTPS URL |
| Emails not sent | `SMTP_*` vars; otherwise check server logs for printed credentials |
| DB connection refused | `docker compose ps`; `DATABASE_URL` host is `db` inside Compose |

---

## Security checklist before go-live

- [ ] Strong `NEXTAUTH_SECRET`  
- [ ] Strong Postgres password  
- [ ] HTTPS only  
- [ ] Change default seed passwords  
- [ ] Firewall: only 22, 80, 443 public  
- [ ] Revoke any GitHub PATs shared during development  
- [ ] Backups: daily Postgres volume snapshot  

---

## Minimal “sold today” path

1. Buy a €5–10/mo VPS  
2. Docker + Compose + Caddy (steps 2–7)  
3. Create tenant with client’s name/email  
4. Send login + `/book` link  
5. Invoice one-time setup fee  

You can refine branding, SMTP, and custom domain after the first payment clears.
