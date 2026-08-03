import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with isolated tenants...\n");

  // Clean existing data (dev only)
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.section.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSetting.deleteMany();
  await prisma.tenant.deleteMany();

  // ----------------------------------------------------------
  // TENANT 1 – "La Terraza" (Spanish restaurant)
  // ----------------------------------------------------------
  const terraza = await prisma.tenant.create({
    data: {
      name: "La Terraza",
      slug: "la-terraza",
      status: "ACTIVE",
      plan: "PROFESSIONAL",
      primaryColor: "#0f766e",
      secondaryColor: "#134e4a",
      fontFamily: "Inter",
      defaultLocale: "es",
      enabledLocales: ["es", "en", "ca"],
      timezone: "Europe/Madrid",
      businessInfo: {
        address: "Carrer del Mar 12, Barcelona",
        phone: "+34 93 123 4567",
        email: "reservas@laterraza.cat",
        openingHours: "Tue-Sun 13:00-16:00 & 20:00-23:30",
      },
    },
  });

  const terrazaOwner = await prisma.user.create({
    data: {
      tenantId: terraza.id,
      email: "owner@laterraza.cat",
      name: "Maria Garcia",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  const inside = await prisma.section.create({
    data: {
      tenantId: terraza.id,
      name: "Interior",
      slug: "interior",
      sortOrder: 1,
    },
  });

  const terrace = await prisma.section.create({
    data: {
      tenantId: terraza.id,
      name: "Terraza",
      slug: "terraza",
      sortOrder: 2,
    },
  });

  // Tables for La Terraza
  const tablesTerraza = [
    { sectionId: inside.id, label: "I1", capacity: 2, sortOrder: 1 },
    { sectionId: inside.id, label: "I2", capacity: 4, sortOrder: 2 },
    { sectionId: inside.id, label: "I3", capacity: 6, sortOrder: 3 },
    { sectionId: terrace.id, label: "T1", capacity: 2, sortOrder: 1 },
    { sectionId: terrace.id, label: "T2", capacity: 4, sortOrder: 2 },
    { sectionId: terrace.id, label: "T3", capacity: 4, sortOrder: 3 },
    { sectionId: terrace.id, label: "T4", capacity: 8, sortOrder: 4 },
  ];

  for (const t of tablesTerraza) {
    await prisma.table.create({
      data: { tenantId: terraza.id, ...t },
    });
  }

  // ----------------------------------------------------------
  // TENANT 2 – "Bella Vista" (Italian restaurant) – completely isolated
  // ----------------------------------------------------------
  const bella = await prisma.tenant.create({
    data: {
      name: "Bella Vista",
      slug: "bella-vista",
      status: "ACTIVE",
      plan: "STARTER",
      primaryColor: "#b91c1c",
      secondaryColor: "#7f1d1d",
      fontFamily: "Playfair Display",
      defaultLocale: "it",
      enabledLocales: ["it", "en", "de"],
      timezone: "Europe/Rome",
      businessInfo: {
        address: "Via Roma 45, Milano",
        phone: "+39 02 987 6543",
        email: "prenotazioni@bellavista.it",
      },
    },
  });

  await prisma.user.create({
    data: {
      tenantId: bella.id,
      email: "owner@bellavista.it",
      name: "Marco Rossi",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  const sala = await prisma.section.create({
    data: {
      tenantId: bella.id,
      name: "Sala Principale",
      slug: "sala",
      sortOrder: 1,
    },
  });

  await prisma.table.createMany({
    data: [
      { tenantId: bella.id, sectionId: sala.id, label: "A1", capacity: 2, sortOrder: 1 },
      { tenantId: bella.id, sectionId: sala.id, label: "A2", capacity: 4, sortOrder: 2 },
      { tenantId: bella.id, sectionId: sala.id, label: "A3", capacity: 4, sortOrder: 3 },
      { tenantId: bella.id, sectionId: sala.id, label: "A4", capacity: 6, sortOrder: 4 },
    ],
  });

  // ----------------------------------------------------------
  // Proof of isolation
  // ----------------------------------------------------------
  const terrazaTables = await prisma.table.count({ where: { tenantId: terraza.id } });
  const bellaTables = await prisma.table.count({ where: { tenantId: bella.id } });
  const totalTables = await prisma.table.count();

  console.log("✅ Tenant isolation seed complete\n");
  console.log(`  La Terraza  (${terraza.slug}) → ${terrazaTables} tables`);
  console.log(`  Bella Vista (${bella.slug})  → ${bellaTables} tables`);
  console.log(`  Total tables in DB           → ${totalTables}`);
  console.log(`\n  Login examples:`);
  console.log(`    owner@laterraza.cat  / password123`);
  console.log(`    owner@bellavista.it  / password123`);
  console.log(`\n  To test isolation, set SINGLE_TENANT_SLUG=la-terraza or use subdomain.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
