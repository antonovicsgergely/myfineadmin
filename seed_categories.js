const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Élelmiszer",
    "Italok",
    "Szépségápolás",
    "Otthon és Kert",
    "Kézműves termékek",
    "Ruházat"
  ];

  const filters = [
    "Gluténmentes",
    "Laktózmentes",
    "Vegán",
    "Cukormentes",
    "Kézműves",
    "Bio"
  ];

  console.log("Seeding categories...");
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log("Seeding filters...");
  for (const name of filters) {
    await prisma.filter.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
