"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignTableAction } from "@/app/dashboard/floor-plan/actions";

type Table = {
  id: string;
  label: string;
  capacity: number;
  sectionId: string;
  section: { id: string; name: string; slug: string };
  isOccupied: boolean;
  currentReservation: any | null;
  reservationCount: number;
  reservations: any[];
  shape: string;
};

type Section = {
  id: string;
  name: string;
  slug: string;
};

type Reservation = {
  id: string;
  guestName: string;
  partySize: number;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  tableId: string | null;
  sectionId: string | null;
  table?: { label: string } | null;
  section?: { name: string } | null;
};

type Props = {
  initialDate: string;
  initialSectionId: string;
  tables: Table[];
  sections: Section[];
  reservations: Reservation[];
};

export function FloorPlanClient({
  initialDate,
  initialSectionId,
  tables,
  sections,
  reservations,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeFilters(newDate: string, newSection: string) {
    const params = new URLSearchParams();
    if (newDate) params.set("date", newDate);
    if (newSection) params.set("section", newSection);
    router.push(`/dashboard/floor-plan?${params.toString()}`);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDate(v);
    changeFilters(v, sectionId);
  }

  function handleSectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setSectionId(v);
    changeFilters(date, v);
  }

  function handleTableClick(tableId: string) {
    if (!selectedReservationId) {
      setMessage({ type: "err", text: "Select a reservation from the list first, then click a table to assign it." });
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const result = await assignTableAction(selectedReservationId, tableId);
      if (result.error) {
        setMessage({ type: "err", text: result.error });
      } else {
        setMessage({ type: "ok", text: "Reservation assigned successfully" });
        setSelectedReservationId(null);
        router.refresh();
      }
    });
  }

  function handleUnassign(reservationId: string) {
    startTransition(async () => {
      setMessage(null);
      const result = await assignTableAction(reservationId, null);
      if (result.error) {
        setMessage({ type: "err", text: result.error });
      } else {
        setMessage({ type: "ok", text: "Reservation unassigned" });
        router.refresh();
      }
    });
  }

  const filteredTables = sectionId
    ? tables.filter((t) => t.sectionId === sectionId)
    : tables;

  // Group by section for display
  const bySection = filteredTables.reduce<Record<string, Table[]>>((acc, t) => {
    const key = t.section.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const unassigned = reservations.filter((r) => !r.tableId);
  const assigned = reservations.filter((r) => r.tableId);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
          <select
            value={sectionId}
            onChange={handleSectionChange}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm min-w-[160px]"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Occupied
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual floor plan */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(bySection).map(([sectionName, sectionTables]) => (
            <div key={sectionName} className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">{sectionName}</h2>
              <div className="flex flex-wrap gap-3">
                {sectionTables.map((table) => {
                  const isSelectedTarget = selectedReservationId !== null;
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableClick(table.id)}
                      disabled={isPending}
                      className={`
                        relative w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center
                        transition cursor-pointer select-none
                        ${
                          table.isOccupied
                            ? "bg-red-50 border-red-400 text-red-800"
                            : "bg-emerald-50 border-emerald-400 text-emerald-800"
                        }
                        ${isSelectedTarget ? "ring-2 ring-offset-2 ring-teal-500" : ""}
                        hover:scale-105 active:scale-95
                      `}
                      title={
                        table.currentReservation
                          ? `${table.currentReservation.guestName} (${table.currentReservation.partySize}p)`
                          : `Free · capacity ${table.capacity}`
                      }
                    >
                      <span className="font-bold text-lg">{table.label}</span>
                      <span className="text-xs opacity-80">{table.capacity} pax</span>
                      {table.reservationCount > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                          {table.reservationCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredTables.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
              No tables found for this filter.
            </div>
          )}
        </div>

        {/* Reservation list */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 mb-3">
              Unassigned ({unassigned.length})
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Click a reservation, then click a table to assign it.
            </p>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {unassigned.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() =>
                      setSelectedReservationId(
                        selectedReservationId === r.id ? null : r.id
                      )
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                      selectedReservationId === r.id
                        ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-medium">{r.guestName}</div>
                    <div className="text-xs text-slate-500">
                      {r.partySize} pax · {new Date(r.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {r.section ? ` · ${r.section.name}` : ""}
                    </div>
                  </button>
                </li>
              ))}
              {unassigned.length === 0 && (
                <li className="text-sm text-slate-400 py-2">All assigned</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 mb-3">
              Assigned ({assigned.length})
            </h2>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {assigned.map((r) => (
                <li
                  key={r.id}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex justify-between items-start gap-2"
                >
                  <div>
                    <div className="font-medium">{r.guestName}</div>
                    <div className="text-xs text-slate-500">
                      Table <strong>{r.table?.label}</strong> · {r.partySize} pax ·{" "}
                      {new Date(r.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnassign(r.id)}
                    disabled={isPending}
                    className="text-xs text-red-600 hover:underline shrink-0"
                  >
                    Unassign
                  </button>
                </li>
              ))}
              {assigned.length === 0 && (
                <li className="text-sm text-slate-400 py-2">None yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
