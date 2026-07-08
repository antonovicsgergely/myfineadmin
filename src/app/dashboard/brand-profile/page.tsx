import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import BrandProfileForm from "./BrandProfileForm";

export const metadata = {
  title: "Márkaoldal | Myfine Vendor Portal",
};

export default async function BrandProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) return <div>A gyártói fiók nem található.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Márkaoldal</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Itt alakíthatod ki, hogy hogyan jelenjen meg a márkád a vásárlók számára. Töltsd fel a logódat, a borítóképedet és meséld el a történetedet!
        </p>
      </div>

      <BrandProfileForm vendor={vendor} />
    </div>
  );
}
