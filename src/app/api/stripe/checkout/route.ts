import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/stripe/checkout
 * Body: { plan: "STARTER" | "PROFESSIONAL", email, restaurantName, slug }
 *
 * Creates a Stripe Checkout Session in subscription mode.
 * On success the webhook will create the Tenant + Owner user.
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { plan, email, restaurantName, slug } = body as {
      plan: PlanKey;
      email: string;
      restaurantName: string;
      slug: string;
    };

    if (!plan || !email || !restaurantName || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["STARTER", "PROFESSIONAL"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = PLANS[plan].priceId;
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for ${plan} is not configured` },
        { status: 500 }
      );
    }

    // Normalize slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);

    if (cleanSlug.length < 2) {
      return NextResponse.json({ error: "Invalid restaurant slug" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json(
        { error: "This restaurant URL is already taken. Choose another." },
        { status: 409 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: {
        plan,
        restaurantName,
        slug: cleanSlug,
        ownerEmail: email.toLowerCase().trim(),
      },
      subscription_data: {
        metadata: {
          plan,
          slug: cleanSlug,
        },
        trial_period_days: 14, // optional free trial
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
