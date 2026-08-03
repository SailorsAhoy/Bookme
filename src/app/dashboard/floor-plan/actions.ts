"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { assignReservationToTable } from "@/lib/db";

export async function assignTableAction(
  reservationId: string,
  tableId: string | null
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAuth();

    await assignReservationToTable(reservationId, tableId);

    revalidatePath("/dashboard/floor-plan");
    revalidatePath("/dashboard/reservations");

    return { success: true };
  } catch (err: any) {
    console.error("assignTableAction error:", err);
    return { error: err.message || "Failed to assign table" };
  }
}
