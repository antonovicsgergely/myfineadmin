import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendor.findFirst({
    where: { brandName: 'Terra Tuffola' }
  });

  if (!vendor) {
    console.log("Terra Tuffola vendor not found.");
    return;
  }

  const oldName = vendor.brandName;
  const newName = "Test 1 gyártó";

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { brandName: newName }
  });

  console.log(`Updated vendor ${vendor.id} from '${oldName}' to '${newName}'`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
