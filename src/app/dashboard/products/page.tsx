import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) return null;

  const products = await prisma.productSync.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Saját Termékek</h2>
        <Link
          href="/dashboard/products/new"
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-semibold shadow transition-all flex items-center gap-2"
        >
          <span>+</span> Új termék hozzáadása
        </Link>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-sm border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border text-sm text-foreground/70">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">Cikkszám / Vonalkód</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">Név</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">Ár / Akciós</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">Módosítva</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">Minőségi Állapot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                    <div className="font-bold">{product.itemNumber || '-'}</div>
                    <div className="text-xs">{product.barcode || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{product.name}</div>
                    <div className="text-foreground/50 text-xs truncate max-w-xs">{product.shortDescription || product.description?.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                    <div className={product.salePrice ? "line-through text-xs" : "font-bold"}>{product.price.toLocaleString('hu-HU')} Ft</div>
                    {product.salePrice && <div className="font-bold text-red-500">{product.salePrice.toLocaleString('hu-HU')} Ft</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                    <div className="text-xs">Létrehozva: {new Date(product.createdAt).toLocaleDateString('hu-HU')}</div>
                    <div className="text-xs font-bold text-foreground">Frissítve: {new Date(product.updatedAt).toLocaleDateString('hu-HU')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      product.qualityStatus === 'APPROVED' ? 'bg-green-500/10 text-green-600' :
                      product.qualityStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {product.qualityStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">Szerkesztés</button>
                  </td>
                </tr>
              ))}
              
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-border">
                        🛍️
                      </div>
                      <p className="text-foreground/70 font-medium mb-1">Még nincsenek feltöltött termékeid.</p>
                      <p className="text-sm text-foreground/50 mb-4">Kezdd el a katalógusod felépítését egy új termék hozzáadásával!</p>
                    </div>
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
