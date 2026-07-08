import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { vendor: true }
  });

  for (const u of users) {
    console.log(`User ID: ${u.id} | Email: ${u.email} | Vendor: ${u.vendor ? u.vendor.brandName : 'None'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
