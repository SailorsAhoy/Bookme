"use server";

import { createReservation } from "@/lib/db";
import { requireTenant, getTenantDb } from "@/lib/tenant";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Extract HH:mm from a Prisma Time / Date value */
function extractHHMM(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    // "1970-01-01T12:00:00.000Z" or "12:00:00"
    const match = value.match(/T?(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  return null;
}

export async function createPublicReservationAction(data: {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize: number;
  date: string;
  time: string;
  sectionId?: string;
  notes?: string;
}) {
  try {
    await requireTenant();

    if (!data.guestName?.trim()) return { error: "Name is required" };
    if (!data.date || !data.time) return { error: "Date and time are required" };
    if (data.partySize < 1 || data.partySize > 50) return { error: "Invalid party size" };

    const startTime = new Date(`${data.date}T${data.time}:00`);
    if (isNaN(startTime.getTime())) return { error: "Invalid date or time" };
    if (startTime.getTime() < Date.now() - 5 * 60 * 1000) {
      return { error: "Please choose a future date and time" };
    }

    // Section availability rules
    if (data.sectionId) {
      const { db } = await getTenantDb();
      const section = await db.section.findUnique({ where: { id: data.sectionId } });
      if (!section || !section.isActive) {
        return { error: "Selected section is not available" };
      }

      const dayOfWeek = startTime.getDay(); // 0=Sun
      if (section.daysOfWeek?.length && !section.daysOfWeek.includes(dayOfWeek)) {
        return { error: "This section is not open on the selected day" };
      }

      const from = extractHHMM(section.availableFrom);
      const to = extractHHMM(section.availableTo);
      if (from && to) {
        const requested = timeToMinutes(data.time);
        if (requested < timeToMinutes(from) || requested > timeToMinutes(to)) {
          return {
            error: `This section is only available between ${from} and ${to}`,
          };
        }
      }
    }

    const durationMinutes = 90;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const dateOnly = new Date(data.date + "T12:00:00");

    await createReservation({
      guestName: data.guestName.trim(),
      guestEmail: data.guestEmail?.trim() || undefined,
      guestPhone: data.guestPhone?.trim() || undefined,
      partySize: data.partySize,
      date: dateOnly,
      startTime,
      endTime,
      durationMinutes,
      sectionId: data.sectionId || undefined,
      notes: data.notes?.trim() || undefined,
      source: "web",
      status: "PENDING",
    });

    return { success: true };
  } catch (err: any) {
    console.error("createPublicReservationAction:", err);
    return { error: err.message || "Could not create reservation. Please try again." };
  }
}
