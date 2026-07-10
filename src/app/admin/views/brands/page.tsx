import prisma from "@/lib/prisma";
import BrandsViewClient from "./BrandsViewClient";

export const dynamic = "force-dynamic";

export default async function AdminViewsBrandsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gyártói Oldalak (Nézet)</h2>
        <p className="text-sm text-foreground/60 mt-1">Az összes beállított márkaoldal listája.</p>
      </div>

      <BrandsViewClient vendors={vendors} />
    </div>
  );
}
