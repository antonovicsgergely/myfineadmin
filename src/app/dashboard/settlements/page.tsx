import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) return null;

  const settlements = await prisma.settlement.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Elszámolások és Pénzügyek</h2>
      
      <div className="glass rounded-2xl overflow-hidden shadow-sm border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border text-sm text-foreground/70">
                <th className="px-6 py-4 font-medium">Időszak</th>
                <th className="px-6 py-4 font-medium">Nettó kifizetendő</th>
                <th className="px-6 py-4 font-medium">Státusz</th>
                <th className="px-6 py-4 font-medium text-right">Letöltés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">
                    {new Date(settlement.periodStart).toLocaleDateString('hu-HU')} - {new Date(settlement.periodEnd).toLocaleDateString('hu-HU')}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {settlement.amount.toLocaleString('hu-HU')} {settlement.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      settlement.status === 'PAID' ? 'bg-green-500/10 text-green-600' : 'bg-accent/10 text-accent'
                    }`}>
                      {settlement.status === 'PAID' ? 'Kifizetve' : 'Függőben'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline font-medium text-sm">
                      PDF Letöltés
                    </button>
                  </td>
                </tr>
              ))}
              
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/50">
                    Nincsenek még generált elszámolások.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
