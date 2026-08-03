import { requireAuth } from "@/lib/auth/session";
import { getFloorPlan, listSections, listReservations } from "@/lib/db";
import { FloorPlanClient } from "@/components/floor-plan/FloorPlanClient";
import { format } from "date-fns";

type Props = {
  searchParams: Promise<{ date?: string; section?: string }>;
};

export default async function FloorPlanPage({ searchParams }: Props) {
  await requireAuth();

  const params = await searchParams;
  const dateStr = params.date || format(new Date(), "yyyy-MM-dd");
  const date = new Date(dateStr + "T12:00:00"); // noon to avoid TZ edge cases
  const sectionId = params.section || undefined;

  const [tables, sections, reservations] = await Promise.all([
    getFloorPlan(date, sectionId),
    listSections({ activeOnly: true }),
    listReservations({
      date,
      status: ["PENDING", "CONFIRMED", "SEATED"],
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
              ← Dashboard
            </a>
            <h1 className="font-semibold text-slate-900">Floor Plan</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FloorPlanClient
          initialDate={dateStr}
          initialSectionId={sectionId || ""}
          tables={tables}
          sections={sections}
          reservations={reservations}
        />
      </main>
    </div>
  );
}
