import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set – Stripe features will be disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    })
  : (null as unknown as Stripe);

export const PLANS = {
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER || "",
    priceDisplay: "€29/mo",
    features: ["1 restaurant", "Up to 20 tables", "Public booking page", "Email support"],
  },
  PROFESSIONAL: {
    name: "Professional",
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || "",
    priceDisplay: "€79/mo",
    features: [
      "1 restaurant",
      "Unlimited tables",
      "Custom domain",
      "Multi-language",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "",
    priceDisplay: "Custom",
    features: ["Multiple locations", "SSO", "Dedicated support", "SLA"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
