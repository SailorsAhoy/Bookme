"use client";

import { useState } from "react";
import { PLANS } from "@/lib/stripe";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    plan: "STARTER" as "STARTER" | "PROFESSIONAL",
    email: "",
    restaurantName: "",
    slug: "",
  });

  async function handleCheckout(plan: "STARTER" | "PROFESSIONAL") {
    setError("");
    if (!form.email || !form.restaurantName || !form.slug) {
      setError("Please fill in email, restaurant name and URL slug");
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Simple pricing</h1>
          <p className="text-slate-600">
            14-day free trial. No credit card required to start exploring.
            Cancel anytime.
          </p>
        </div>

        {/* Shared fields */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 max-w-lg mx-auto space-y-4">
          <h2 className="font-semibold text-slate-800">Your restaurant details</h2>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant name</label>
            <input
              value={form.restaurantName}
              onChange={(e) => {
                const name = e.target.value;
                setForm({
                  ...form,
                  restaurantName: name,
                  slug:
                    form.slug ||
                    name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, ""),
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="La Terraza"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL slug <span className="text-slate-400">(yoursaas.com/<strong>{form.slug || "…"}</strong>)</span>
            </label>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="la-terraza"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="owner@restaurant.com"
            />
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {(["STARTER", "PROFESSIONAL"] as const).map((key) => {
            const plan = PLANS[key];
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border p-6 flex flex-col ${
                  key === "PROFESSIONAL" ? "border-teal-500 shadow-md" : "border-slate-200"
                }`}
              >
                {key === "PROFESSIONAL" && (
                  <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {plan.priceDisplay}
                </p>
                <ul className="mt-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-teal-600 mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(key)}
                  disabled={!!loading}
                  className={`mt-6 w-full py-2.5 rounded-lg font-medium transition ${
                    key === "PROFESSIONAL"
                      ? "bg-teal-700 hover:bg-teal-800 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  } disabled:opacity-60`}
                >
                  {loading === key ? "Redirecting…" : "Start free trial"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          Prefer a one-time self-hosted license?{" "}
          <a href="mailto:sales@example.com" className="underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
