"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReservationStatusAction } from "@/app/dashboard/reservations/actions";

type Reservation = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  notes: string | null;
  tableId: string | null;
  sectionId: string | null;
  table?: { label: string } | null;
  section?: { name: string } | null;
};

type Section = { id: string; name: string };

type Props = {
  initialDate: string;
  reservations: Reservation[];
  sections: Section[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SEATED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  NO_SHOW: "bg-orange-100 text-orange-800 border-orange-200",
};

export function ReservationsClient({ initialDate, reservations }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function changeDate(newDate: string) {
    setDate(newDate);
    router.push(`/dashboard/reservations?date=${newDate}`);
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const result = await updateReservationStatusAction(id, status as any);
      if (result.error) setMessage(result.error);
      else {
        setMessage("Updated");
        router.refresh();
      }
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="text-sm text-slate-500">
          {reservations.length} reservation{reservations.length !== 1 ? "s" : ""}
        </div>
        {message && <div className="text-sm text-emerald-700 ml-auto">{message}</div>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Pax</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Table</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Section</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {new Date(r.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.guestName}</div>
                    <div className="text-xs text-slate-500">
                      {r.guestPhone || r.guestEmail || "—"}
                    </div>
                    {r.notes && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                        {r.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.partySize}</td>
                  <td className="px-4 py-3">
                    {r.table?.label ? (
                      <span className="font-medium">{r.table.label}</span>
                    ) : (
                      <span className="text-amber-600 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.section?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs border ${
                        STATUS_COLORS[r.status] || "bg-slate-100"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={isPending}
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="text-xs border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="SEATED">Seated</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No-show</option>
                    </select>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No reservations for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Tip: Use the Floor Plan to assign tables to unassigned reservations.
      </p>
    </div>
  );
}
