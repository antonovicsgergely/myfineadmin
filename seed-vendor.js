const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@myfine.hu' } });
  
  if (adminUser) {
    const vendor = await prisma.vendor.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        companyName: 'Test 1 Kft.',
        brandName: 'Test 1 gyártó',
        description: 'Ez a teszt gyártó.',
        brandStatus: 'PUBLISHED',
        unasPageId: '3631246'
      }
    });
    console.log('Test vendor created:', vendor.brandName);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
