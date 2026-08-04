import { getTenantSettings, listSections } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { BookingForm } from "@/components/booking/BookingForm";

export default async function PublicBookingPage() {
  // Will throw if no tenant resolved (custom domain / subdomain / SINGLE_TENANT_SLUG)
  await requireTenant();

  const [settings, sections] = await Promise.all([
    getTenantSettings(),
    listSections({ activeOnly: true }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branding header */}
      <header
        className="text-white py-10 px-4"
        style={{
          backgroundColor: settings.primaryColor,
          fontFamily: settings.fontFamily,
        }}
      >
        <div className="max-w-xl mx-auto text-center">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt={settings.name}
              className="h-14 mx-auto mb-4 bg-white/10 rounded-lg p-2"
            />
          ) : (
            <div
              className="h-14 w-14 mx-auto mb-4 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: settings.secondaryColor }}
            >
              {settings.name.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl font-bold">{settings.name}</h1>
          {settings.businessInfo?.address && (
            <p className="mt-2 opacity-90 text-sm">{settings.businessInfo.address}</p>
          )}
          {settings.businessInfo?.openingHours && (
            <p className="mt-1 opacity-80 text-sm">{settings.businessInfo.openingHours}</p>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Make a reservation</h2>
          <BookingForm
            sections={sections.map((s) => ({ id: s.id, name: s.name }))}
            minPartySize={settings.minPartySize}
            maxPartySize={settings.maxPartySize}
            primaryColor={settings.primaryColor}
          />
        </div>

        {(settings.businessInfo?.phone || settings.businessInfo?.email) && (
          <p className="text-center text-sm text-slate-500 mt-6">
            Questions?{" "}
            {settings.businessInfo.phone && (
              <a href={`tel:${settings.businessInfo.phone}`} className="underline">
                {settings.businessInfo.phone}
              </a>
            )}
            {settings.businessInfo.phone && settings.businessInfo.email && " · "}
            {settings.businessInfo.email && (
              <a href={`mailto:${settings.businessInfo.email}`} className="underline">
                {settings.businessInfo.email}
              </a>
            )}
          </p>
        )}
      </main>
    </div>
  );
}
