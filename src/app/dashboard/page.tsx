import { requireAuth } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  const settings = await getTenantSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" className="h-8 w-auto" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {settings.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-slate-900">{settings.name}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              {session.user.name || session.user.email} · {session.user.role}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-slate-600 hover:text-slate-900"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-500 mb-8">
          Welcome back. Tenant: <strong>{session.user.tenantSlug}</strong> ({session.user.tenantPlan})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/reservations"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 hover:shadow-sm transition"
          >
            <h2 className="font-semibold text-slate-900">Reservations</h2>
            <p className="text-sm text-slate-500 mt-1">View & manage bookings</p>
          </Link>

          <Link
            href="/dashboard/floor-plan"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 hover:shadow-sm transition"
          >
            <h2 className="font-semibold text-slate-900">Floor Plan</h2>
            <p className="text-sm text-slate-500 mt-1">Visual table map (red/green)</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 hover:shadow-sm transition"
          >
            <h2 className="font-semibold text-slate-900">Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Logo, colors, sections, tables</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
