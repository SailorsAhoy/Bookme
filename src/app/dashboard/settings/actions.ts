"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  updateTenantBranding,
  createSection,
  updateSection,
  createTable,
  updateTable,
} from "@/lib/db";
import { getTenantDb } from "@/lib/tenant";

export async function updateBrandingAction(data: {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  businessInfo?: any;
}) {
  try {
    await requireAdmin();
    await updateTenantBranding(data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to update branding" };
  }
}

export async function createSectionAction(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  try {
    await requireAdmin();
    await createSection(data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to create section" };
  }
}

export async function updateSectionAction(
  id: string,
  data: Partial<{ name: string; description: string | null; isActive: boolean; sortOrder: number }>
) {
  try {
    await requireAdmin();
    await updateSection(id, data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to update section" };
  }
}

export async function createTableAction(data: {
  sectionId: string;
  label: string;
  capacity: number;
  minCapacity?: number;
}) {
  try {
    await requireAdmin();
    await createTable(data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to create table" };
  }
}

export async function updateTableAction(
  id: string,
  data: Partial<{
    label: string;
    capacity: number;
    minCapacity: number;
    isActive: boolean;
    sortOrder: number;
    notes: string | null;
  }>
) {
  try {
    await requireAdmin();
    await updateTable(id, data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to update table" };
  }
}

export async function deleteTableAction(id: string) {
  try {
    await requireAdmin();
    const { db } = await getTenantDb();
    // Soft-delete preferred, but for now hard delete after unassigning
    await db.reservation.updateMany({
      where: { tableId: id },
      data: { tableId: null },
    });
    await db.table.delete({ where: { id } });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/floor-plan");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "Failed to delete table" };
  }
}
