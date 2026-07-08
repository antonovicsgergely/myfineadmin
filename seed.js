const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myfine.hu' },
    update: {},
    create: {
      email: 'admin@myfine.hu',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('Test Admin created:');
  console.log('Email: admin@myfine.hu');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
