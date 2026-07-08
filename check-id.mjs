import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendor.findUnique({ where: { id: "cmr4hwxrs0001v60gsjn0ussj" } });
  console.log("unasPageId:", vendor.unasPageId);
  console.log("brandStatus:", vendor.brandStatus);
}
main().finally(() => prisma.$disconnect());
