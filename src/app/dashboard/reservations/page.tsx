import { requireAuth } from "@/lib/auth/session";
import { listReservations, listSections } from "@/lib/db";
import { format } from "date-fns";
import { ReservationsClient } from "@/components/reservations/ReservationsClient";

type Props = {
  searchParams: Promise<{ date?: string; status?: string }>;
};

export default async function ReservationsPage({ searchParams }: Props) {
  await requireAuth();

  const params = await searchParams;
  const dateStr = params.date || format(new Date(), "yyyy-MM-dd");
  const date = new Date(dateStr + "T12:00:00");
  const statusFilter = params.status;

  const [reservations, sections] = await Promise.all([
    listReservations({
      date,
      status: statusFilter
        ? statusFilter.split(",")
        : ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"],
    }),
    listSections({ activeOnly: true }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <a href="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
            ← Dashboard
          </a>
          <h1 className="font-semibold text-slate-900">Reservations</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ReservationsClient
          initialDate={dateStr}
          reservations={reservations}
          sections={sections}
        />
      </main>
    </div>
  );
}
