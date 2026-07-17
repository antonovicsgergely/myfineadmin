import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SettingsTabs from "./SettingsTabs";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  let vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        userId: session.user.id,
        companyName: session.user.name || "Saját Márka",
        status: "APPROVED"
      },
      include: { user: true }
    });
  }

  const categories = await prisma.category.findMany();
  const currentPackage = await prisma.subscriptionPackage.findUnique({
    where: { code: vendor.subscriptionTier || "BASIC" }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Beállítások</h2>
        <p className="text-sm text-foreground/60 mt-1">Kezeld a cégadataidat, kondícióidat és a fiókod biztonságát.</p>
      </div>
      
      <SettingsTabs vendor={vendor} categories={categories} currentPackage={currentPackage} />
    </div>
  );
}
