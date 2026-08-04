"use client";

import { useState, useTransition } from "react";
import { createPublicReservationAction } from "@/app/book/actions";

type Section = {
  id: string;
  name: string;
  availableFrom: string | null;
  availableTo: string | null;
  daysOfWeek: number[];
};

type Labels = {
  title: string;
  name: string;
  email: string;
  phone: string;
  partySize: string;
  date: string;
  time: string;
  section: string;
  noPreference: string;
  notes: string;
  submit: string;
  successTitle: string;
  successBody: string;
  disclaimer: string;
};

type Props = {
  sections: Section[];
  minPartySize: number;
  maxPartySize: number;
  primaryColor: string;
  labels: Labels;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingForm({
  sections,
  minPartySize,
  maxPartySize,
  primaryColor,
  labels,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    guestName: string;
    date: string;
    time: string;
    partySize: number;
  } | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [sectionId, setSectionId] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createPublicReservationAction({
        guestName,
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,
        partySize,
        date,
        time,
        sectionId: sectionId || undefined,
        notes: notes || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setConfirmation({ guestName, date, time, partySize });
      setSuccess(true);
    });
  }

  if (success && confirmation) {
    return (
      <div className="text-center py-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl"
          style={{ backgroundColor: primaryColor }}
        >
          ✓
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{labels.successTitle}</h3>
        <p className="text-slate-600 mb-4">
          {labels.successBody
            .replace("{name}", confirmation.guestName)
            .replace("{partySize}", String(confirmation.partySize))
            .replace("{date}", confirmation.date)
            .replace("{time}", confirmation.time)}
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setConfirmation(null);
            setGuestName("");
            setGuestEmail("");
            setGuestPhone("");
            setNotes("");
          }}
          className="mt-6 text-sm underline text-slate-600"
        >
          {labels.title}
        </button>
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.id === sectionId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.name} *</label>
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.email}</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.phone}</label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.partySize} *</label>
          <select
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
          >
            {Array.from({ length: maxPartySize - minPartySize + 1 }, (_, i) => minPartySize + i).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.date} *</label>
          <input
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.time} *</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
          />
        </div>
      </div>

      {sections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.section}</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
          >
            <option value="">{labels.noPreference}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selectedSection && (selectedSection.availableFrom || selectedSection.daysOfWeek?.length < 7) && (
            <p className="text-xs text-slate-500 mt-1.5">
              {selectedSection.availableFrom && selectedSection.availableTo && (
                <span>
                  {selectedSection.availableFrom} – {selectedSection.availableTo}
                </span>
              )}
              {selectedSection.daysOfWeek?.length > 0 && selectedSection.daysOfWeek.length < 7 && (
                <span>
                  {selectedSection.availableFrom ? " · " : ""}
                  {selectedSection.daysOfWeek.map((d) => DAY_NAMES[d]).join(", ")}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{labels.notes}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-white font-medium py-3 rounded-lg transition disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {isPending ? "…" : labels.submit}
      </button>

      <p className="text-xs text-slate-400 text-center">{labels.disclaimer}</p>
    </form>
  );
}
