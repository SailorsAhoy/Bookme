"use server";

import { createReservation } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

export async function createPublicReservationAction(data: {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize: number;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  sectionId?: string;
  notes?: string;
}) {
  try {
    await requireTenant();

    if (!data.guestName?.trim()) {
      return { error: "Name is required" };
    }
    if (!data.date || !data.time) {
      return { error: "Date and time are required" };
    }
    if (data.partySize < 1 || data.partySize > 50) {
      return { error: "Invalid party size" };
    }

    // Build start/end datetime
    const startTime = new Date(`${data.date}T${data.time}:00`);
    if (isNaN(startTime.getTime())) {
      return { error: "Invalid date or time" };
    }

    // Basic future check
    if (startTime.getTime() < Date.now() - 5 * 60 * 1000) {
      return { error: "Please choose a future date and time" };
    }

    const durationMinutes = 90;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // date field as pure date
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
