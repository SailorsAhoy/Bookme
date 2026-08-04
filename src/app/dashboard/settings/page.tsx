import { requireAdmin } from "@/lib/auth/session";
import { getTenantSettings, listSections } from "@/lib/db";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  await requireAdmin();

  const [settings, sections] = await Promise.all([
    getTenantSettings(),
    listSections({ includeInactiveTables: true }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <a href="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
            ← Dashboard
          </a>
          <h1 className="font-semibold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsClient settings={settings} sections={sections} />
      </main>
    </div>
  );
}
