"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { updateReservation } from "@/lib/db";

export async function updateReservationStatusAction(
  id: string,
  status: "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
) {
  try {
    await requireAuth();

    const data: any = { status };
    if (status === "CANCELLED") {
      data.cancelledAt = new Date();
    }
    if (status === "CONFIRMED") {
      data.confirmedAt = new Date();
    }

    await updateReservation(id, data);

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to update status" };
  }
}
