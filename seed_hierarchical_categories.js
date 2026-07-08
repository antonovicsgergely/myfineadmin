const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHierarchicalCategories() {
  console.log("Seeding hierarchical categories (Dummy data because Excel file was not found)...");

  // Level 1
  const elelmiszer = await prisma.category.upsert({ where: { name: "Élelmiszer" }, update: {}, create: { name: "Élelmiszer" }});
  const italok = await prisma.category.upsert({ where: { name: "Italok" }, update: {}, create: { name: "Italok" }});

  // Level 2 (Élelmiszer)
  const edessegek = await prisma.category.upsert({ where: { name: "Édességek" }, update: { parentId: elelmiszer.id }, create: { name: "Édességek", parentId: elelmiszer.id }});
  const pekaruk = await prisma.category.upsert({ where: { name: "Pékáruk" }, update: { parentId: elelmiszer.id }, create: { name: "Pékáruk", parentId: elelmiszer.id }});
  const husok = await prisma.category.upsert({ where: { name: "Húsok és Felvágottak" }, update: { parentId: elelmiszer.id }, create: { name: "Húsok és Felvágottak", parentId: elelmiszer.id }});

  // Level 3 (Édességek)
  await prisma.category.upsert({ where: { name: "Kézműves Csokoládék" }, update: { parentId: edessegek.id }, create: { name: "Kézműves Csokoládék", parentId: edessegek.id }});
  await prisma.category.upsert({ where: { name: "Lekvárok" }, update: { parentId: edessegek.id }, create: { name: "Lekvárok", parentId: edessegek.id }});

  // Level 2 (Italok)
  await prisma.category.upsert({ where: { name: "Szörpök" }, update: { parentId: italok.id }, create: { name: "Szörpök", parentId: italok.id }});
  await prisma.category.upsert({ where: { name: "Kézműves Sörök" }, update: { parentId: italok.id }, create: { name: "Kézműves Sörök", parentId: italok.id }});

  console.log("Categories seeded!");
}

seedHierarchicalCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
