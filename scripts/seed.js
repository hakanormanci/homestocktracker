const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  const email = "test@homestock.com";
  const username = "testuser";
  const password = "1234";

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    console.log("Kullanici zaten mevcut:", existing.username, "|", existing.email);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, isVerified: true },
  });

  const group = await prisma.group.create({
    data: {
      name: "Ev",
      createdById: user.id,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  // Ornek item'lar ekle
  const items = [
    { name: "Sut", quantity: "2 litre", priority: "HIGH", status: "OVER", description: "Yagli sut" },
    { name: "Ekmek", quantity: "1 adet", priority: "HIGH", status: "LOW", description: "" },
    { name: "Yumurta", quantity: "30'lu", priority: "MEDIUM", status: "OVER", description: "Organik" },
    { name: "Sabun", quantity: "2 paket", priority: "LOW", status: "OVER", description: "" },
    { name: "Makarna", quantity: "5 paket", priority: "MEDIUM", status: "LOW", description: "Boncuk makarna" },
  ];

  for (const item of items) {
    await prisma.item.create({
      data: {
        groupId: group.id,
        name: item.name,
        quantity: item.quantity,
        description: item.description || null,
        priority: item.priority,
        status: item.status,
        flag: "ACTIVE",
        addedById: user.id,
      },
    });
  }

  console.log("--- Test Kullanicisi Olusturuldu ---");
  console.log("Kullanici Adi:", username);
  console.log("E-posta      :", email);
  console.log("Sifre        :", password);
  console.log("Grup         :", group.name);
  console.log("Ornek Items  :", items.length + " adet eklendi");
  console.log("---");
  console.log("Dev server baslatmak icin: npm run dev");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});