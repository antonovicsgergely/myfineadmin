"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Vendor = {
  id: string;
  companyName: string;
  status: string;
  commissionRate: number | null;
  createdAt: Date;
  user: {
    email: string | null;
    name: string | null;
  };
};

export default function VendorList({ initialVendors }: { initialVendors: any[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    setLoadingId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Hiba a mentés során");
      
      const updated = await res.json();
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, status: updated.status } : v));
      router.refresh();
    } catch (error) {
      alert("Hiba történt a státusz frissítésekor.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface/50 border-b border-border text-sm text-foreground/70">
            <th className="px-6 py-4 font-medium">Cégnév / Kapcsolattartó</th>
            <th className="px-6 py-4 font-medium">Email</th>
            <th className="px-6 py-4 font-medium">Státusz</th>
            <th className="px-6 py-4 font-medium">Regisztráció ideje</th>
            <th className="px-6 py-4 font-medium text-right">Műveletek</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 text-sm">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="hover:bg-surface/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-semibold text-foreground">{vendor.companyName}</div>
                <div className="text-foreground/60 text-xs">{vendor.user.name}</div>
              </td>
              <td className="px-6 py-4 text-foreground/80">{vendor.user.email}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vendor.status === 'APPROVED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  vendor.status === 'REJECTED' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                  vendor.status === 'SUSPENDED' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                  'bg-accent/20 text-accent dark:text-amber-400'
                }`}>
                  {vendor.status === 'APPROVED' ? 'Jóváhagyva' : 
                   vendor.status === 'REJECTED' ? 'Elutasítva' : 
                   vendor.status === 'SUSPENDED' ? 'Felfüggesztve' : 'Függőben'}
                </span>
              </td>
              <td className="px-6 py-4 text-foreground/60">
                {new Date(vendor.createdAt).toLocaleDateString('hu-HU')}
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {vendor.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(vendor.id, 'APPROVED')}
                    disabled={loadingId === vendor.id}
                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-medium text-xs disabled:opacity-50"
                  >
                    {vendor.status === 'SUSPENDED' ? 'Újraaktivál' : 'Jóváhagy'}
                  </button>
                )}
                {vendor.status === 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(vendor.id, 'SUSPENDED')}
                    disabled={loadingId === vendor.id}
                    className="px-3 py-1.5 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 rounded-lg transition-colors font-medium text-xs disabled:opacity-50"
                  >
                    Felfüggeszt
                  </button>
                )}
                {vendor.status !== 'REJECTED' && vendor.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleStatusChange(vendor.id, 'REJECTED')}
                    disabled={loadingId === vendor.id}
                    className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-medium text-xs disabled:opacity-50"
                  >
                    Elutasít
                  </button>
                )}
              </td>
            </tr>
          ))}
          
          {vendors.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                Nincsenek regisztrált gyártók.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
