import { PrismaClient } from '@prisma/client';

const uri = "postgresql://postgres:dFf68UHXzR5UyTAU@db.syilevvjcjbvrtxswzcbo.supabase.co:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: uri
    }
  }
});

async function main() {
  console.log("Testing connection...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connection successful!");
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
