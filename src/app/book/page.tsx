import { getTenantSettings, listSections } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { BookingForm } from "@/components/booking/BookingForm";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/getDictionary";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default async function PublicBookingPage() {
  await requireTenant();

  const [settings, sections] = await Promise.all([
    getTenantSettings(),
    listSections({ activeOnly: true }),
  ]);

  const locale = await getLocale(settings.defaultLocale);
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="text-white py-10 px-4 relative"
        style={{
          backgroundColor: settings.primaryColor,
          fontFamily: settings.fontFamily,
        }}
      >
        <div className="absolute top-4 right-4">
          <LocaleSwitcher
            current={locale}
            enabledLocales={settings.enabledLocales}
            className="text-sm border border-white/30 rounded-lg px-2 py-1.5 bg-white/10 text-white"
          />
        </div>
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
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {dict.booking.title}
          </h2>
          <BookingForm
            sections={sections.map((s) => ({
              id: s.id,
              name: s.name,
              availableFrom: s.availableFrom
                ? new Date(s.availableFrom as unknown as string).toISOString().slice(11, 16)
                : null,
              availableTo: s.availableTo
                ? new Date(s.availableTo as unknown as string).toISOString().slice(11, 16)
                : null,
              daysOfWeek: s.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
            }))}
            minPartySize={settings.minPartySize}
            maxPartySize={settings.maxPartySize}
            primaryColor={settings.primaryColor}
            labels={dict.booking}
          />
        </div>

        {(settings.businessInfo?.phone || settings.businessInfo?.email) && (
          <p className="text-center text-sm text-slate-500 mt-6">
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
