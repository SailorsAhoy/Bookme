import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/stripe/portal
 * Opens the Stripe Customer Portal for the current tenant's owner.
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER (or platform admin) can manage billing
    if (session.user.role !== "OWNER" && session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Only the owner can manage billing" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found for this restaurant" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${origin}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
