import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

/**
 * Stripe webhook handler.
 * Critical events:
 * - checkout.session.completed → create Tenant + Owner user
 * - customer.subscription.updated / deleted → update plan / status
 */
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }

      default:
        // Unhandled event type – ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const { plan, restaurantName, slug, ownerEmail } = meta;

  if (!plan || !restaurantName || !slug || !ownerEmail) {
    console.error("Missing metadata on checkout session", session.id);
    return;
  }

  // Idempotency: skip if tenant already exists for this slug
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.log(`Tenant ${slug} already exists – skipping creation`);
    return;
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  // Temporary password – owner should reset on first login (or we email a magic link later)
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: restaurantName,
      slug,
      status: "TRIAL",
      plan: plan as any,
      stripeCustomerId: customerId || null,
      stripeSubscriptionId: subscriptionId || null,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      primaryColor: "#0f766e",
      secondaryColor: "#134e4a",
      fontFamily: "Inter",
      defaultLocale: "en",
      enabledLocales: ["en", "es"],
      users: {
        create: {
          email: ownerEmail.toLowerCase().trim(),
          name: restaurantName + " Owner",
          passwordHash,
          role: "OWNER",
        },
      },
      sections: {
        create: {
          name: "Main",
          slug: "main",
          sortOrder: 1,
        },
      },
    },
  });

  const mainSection = await prisma.section.findFirst({
    where: { tenantId: tenant.id, slug: "main" },
  });
  if (mainSection) {
    await prisma.table.createMany({
      data: [
        { tenantId: tenant.id, sectionId: mainSection.id, label: "T1", capacity: 2, sortOrder: 1 },
        { tenantId: tenant.id, sectionId: mainSection.id, label: "T2", capacity: 4, sortOrder: 2 },
        { tenantId: tenant.id, sectionId: mainSection.id, label: "T3", capacity: 4, sortOrder: 3 },
        { tenantId: tenant.id, sectionId: mainSection.id, label: "T4", capacity: 6, sortOrder: 4 },
      ],
    });
  }

  console.log(`✅ Created tenant ${slug} (${tenant.id}) for ${ownerEmail}`);
  console.log(`   Temp password for first login: ${tempPassword}`);
  // TODO: send welcome email with temp password or magic link
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!tenant) return;

  const status = sub.status;
  let tenantStatus: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED" = "ACTIVE";
  if (status === "trialing") tenantStatus = "TRIAL";
  if (status === "past_due" || status === "unpaid") tenantStatus = "SUSPENDED";
  if (status === "canceled") tenantStatus = "CANCELLED";

  const planMeta = sub.metadata?.plan;
  const plan = (planMeta as any) || tenant.plan;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: tenantStatus,
      plan,
      stripeSubscriptionId: sub.id,
      subscriptionEndsAt: sub.cancel_at
        ? new Date(sub.cancel_at * 1000)
        : sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "CANCELLED",
      stripeSubscriptionId: null,
    },
  });
}
