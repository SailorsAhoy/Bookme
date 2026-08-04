import { getTenantDb, createTenantClient, requireTenant } from "./tenant";
import type { Prisma } from "@prisma/client";

/**
 * High-level data access helpers.
 * Every function is tenant-scoped by construction.
 * Never import raw `prisma` in application code for tenant data.
 */

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------
export async function listSections(opts?: { activeOnly?: boolean; includeInactiveTables?: boolean }) {
  const { db } = await getTenantDb();
  return db.section.findMany({
    where: opts?.activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      tables: {
        where: opts?.includeInactiveTables ? undefined : { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function createSection(data: {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}) {
  const { db } = await getTenantDb();
  return db.section.create({ data });
}

export async function updateSection(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
    availableFrom: Date | string | null;
    availableTo: Date | string | null;
    daysOfWeek: number[];
  }>
) {
  const { db } = await getTenantDb();
  // Convert "HH:mm" strings to Date for Prisma Time fields
  const payload: any = { ...data };
  if (typeof data.availableFrom === "string") {
    payload.availableFrom = data.availableFrom
      ? new Date(`1970-01-01T${data.availableFrom}:00Z`)
      : null;
  }
  if (typeof data.availableTo === "string") {
    payload.availableTo = data.availableTo
      ? new Date(`1970-01-01T${data.availableTo}:00Z`)
      : null;
  }
  return db.section.update({ where: { id }, data: payload });
}

// ------------------------------------------------------------
// Tables
// ------------------------------------------------------------
export async function listTables(sectionId?: string) {
  const { db } = await getTenantDb();
  return db.table.findMany({
    where: sectionId ? { sectionId, isActive: true } : { isActive: true },
    orderBy: [{ sectionId: "asc" }, { sortOrder: "asc" }],
    include: { section: true },
  });
}

export async function createTable(data: {
  sectionId: string;
  label: string;
  capacity: number;
  minCapacity?: number;
  posX?: number;
  posY?: number;
  shape?: "RECTANGLE" | "ROUND" | "SQUARE" | "CUSTOM";
  sortOrder?: number;
  notes?: string;
}) {
  const { db } = await getTenantDb();
  return db.table.create({ data });
}

export async function updateTable(
  id: string,
  data: Partial<{
    label: string;
    capacity: number;
    minCapacity: number;
    posX: number | null;
    posY: number | null;
    shape: "RECTANGLE" | "ROUND" | "SQUARE" | "CUSTOM";
    isActive: boolean;
    sortOrder: number;
    notes: string | null;
    sectionId: string;
  }>
) {
  const { db } = await getTenantDb();
  return db.table.update({ where: { id }, data });
}

export async function reorderTables(
  updates: { id: string; sortOrder: number; sectionId?: string }[]
) {
  const { db } = await getTenantDb();
  // Transactional update – still tenant-scoped because of the client extension
  return Promise.all(
    updates.map((u) =>
      db.table.update({
        where: { id: u.id },
        data: {
          sortOrder: u.sortOrder,
          ...(u.sectionId ? { sectionId: u.sectionId } : {}),
        },
      })
    )
  );
}

// ------------------------------------------------------------
// Reservations
// ------------------------------------------------------------
export async function listReservations(filters: {
  date?: Date;
  from?: Date;
  to?: Date;
  status?: string | string[];
  sectionId?: string;
  tableId?: string;
}) {
  const { db } = await getTenantDb();

  const where: Prisma.ReservationWhereInput = {};

  if (filters.date) {
    where.date = filters.date;
  }
  if (filters.from || filters.to) {
    where.startTime = {};
    if (filters.from) (where.startTime as any).gte = filters.from;
    if (filters.to) (where.startTime as any).lte = filters.to;
  }
  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status as any }
      : (filters.status as any);
  }
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.tableId) where.tableId = filters.tableId;

  return db.reservation.findMany({
    where,
    orderBy: [{ startTime: "asc" }],
    include: {
      table: true,
      section: true,
    },
  });
}

export async function createReservation(data: {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes?: number;
  sectionId?: string;
  tableId?: string;
  notes?: string;
  source?: string;
  status?: "PENDING" | "CONFIRMED";
}) {
  const { db } = await getTenantDb();
  return db.reservation.create({
    data: {
      ...data,
      status: data.status ?? "PENDING",
    },
    include: { table: true, section: true },
  });
}

export async function updateReservation(
  id: string,
  data: Partial<{
    guestName: string;
    guestEmail: string | null;
    guestPhone: string | null;
    partySize: number;
    date: Date;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    sectionId: string | null;
    tableId: string | null;
    status: "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    notes: string | null;
    internalNotes: string | null;
    cancellationReason: string | null;
  }>
) {
  const { db } = await getTenantDb();
  return db.reservation.update({
    where: { id },
    data,
    include: { table: true, section: true },
  });
}

/**
 * Re-assign a reservation to a different table (or unassign).
 * Used by the visual floor-plan drag/click UI.
 */
export async function assignReservationToTable(
  reservationId: string,
  tableId: string | null
) {
  const { db } = await getTenantDb();

  // Optional: basic capacity check
  if (tableId) {
    const [reservation, table] = await Promise.all([
      db.reservation.findUniqueOrThrow({ where: { id: reservationId } }),
      db.table.findUniqueOrThrow({ where: { id: tableId } }),
    ]);

    if (reservation.partySize > table.capacity) {
      throw new Error(
        `Party size (${reservation.partySize}) exceeds table capacity (${table.capacity})`
      );
    }
  }

  return db.reservation.update({
    where: { id: reservationId },
    data: {
      tableId,
      // If we assign a table we usually move to CONFIRMED
      ...(tableId ? { status: "CONFIRMED" } : {}),
    },
    include: { table: true, section: true },
  });
}

// ------------------------------------------------------------
// Dashboard helpers
// ------------------------------------------------------------
export async function getFloorPlan(date: Date, sectionId?: string) {
  const { db } = await getTenantDb();

  const tables = await db.table.findMany({
    where: {
      isActive: true,
      ...(sectionId ? { sectionId } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      section: true,
      reservations: {
        where: {
          date,
          status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  // Enrich with availability status for the day
  return tables.map((t) => ({
    ...t,
    isOccupied: t.reservations.length > 0,
    currentReservation: t.reservations[0] ?? null,
    reservationCount: t.reservations.length,
  }));
}

// ------------------------------------------------------------
// Tenant settings / branding
// ------------------------------------------------------------
export async function getTenantSettings() {
  const tenant = await requireTenant();
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    fontFamily: tenant.fontFamily,
    businessInfo: tenant.businessInfo,
    defaultLocale: tenant.defaultLocale,
    enabledLocales: tenant.enabledLocales,
    timezone: tenant.timezone,
    minPartySize: tenant.minPartySize,
    maxPartySize: tenant.maxPartySize,
  };
}

export async function updateTenantBranding(data: {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  businessInfo?: any;
  defaultLocale?: string;
  enabledLocales?: string[];
}) {
  // Branding lives on the Tenant model itself.
  // We use the platform client + explicit tenantId because Tenant is a global model.
  const tenant = await requireTenant();
  const { prisma } = await import("./prisma");

  return prisma.tenant.update({
    where: { id: tenant.id },
    data,
  });
}
