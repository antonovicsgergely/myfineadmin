"use client";

import { useEffect, useState } from "react";

interface SubscriptionPackage {
  id: string;
  code: string;
  name: string;
  commissionRate: number;
  promoCommissionRate: number | null;
  monthlyFee: number;
  marketingFee: number;
  cardFee: number;
  activeProductLimit: number | null;
  description: string | null;
  isActive: boolean;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/packages");
      const data = await res.json();
      setPackages(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>, pkgId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      id: pkgId,
      name: formData.get("name"),
      commissionRate: parseFloat(formData.get("commissionRate") as string),
      promoCommissionRate: formData.get("promoCommissionRate") ? parseFloat(formData.get("promoCommissionRate") as string) : null,
      monthlyFee: parseFloat(formData.get("monthlyFee") as string),
      marketingFee: parseFloat(formData.get("marketingFee") as string),
      cardFee: parseFloat(formData.get("cardFee") as string),
      activeProductLimit: formData.get("activeProductLimit") ? parseInt(formData.get("activeProductLimit") as string, 10) : null,
      isActive: formData.get("isActive") === "true"
    };

    try {
      const res = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Sikeresen módosítva!");
        setEditingId(null);
        fetchPackages();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt!");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  if (loading) return <div className="text-foreground/60">Csomagok betöltése...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Előfizetési Csomagok</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Itt paraméterezheted a gyártók számára elérhető előfizetési konstrukciókat (jutalékok, havidíjak).
        </p>
      </div>

      <div className="grid gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="glass p-6 rounded-2xl shadow-sm border border-border/50">
            {editingId === pkg.id ? (
              <form onSubmit={(e) => handleSave(e, pkg.id)} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Csomag Szerkesztése: {pkg.code}</h3>
                  <button type="button" onClick={() => setEditingId(null)} className="text-sm text-foreground/60 hover:text-foreground">Mégse</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Csomag Neve</label>
                    <input name="name" defaultValue={pkg.name} required className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Státusz</label>
                    <select name="isActive" defaultValue={pkg.isActive ? "true" : "false"} className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none">
                      <option value="true">Aktív (Elérhető)</option>
                      <option value="false">Inaktív (Rejtett)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Jutalék (%)</label>
                    <input name="commissionRate" type="number" step="0.1" defaultValue={pkg.commissionRate} required className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Akciós Jutalék (%) (Opcionális)</label>
                    <input name="promoCommissionRate" type="number" step="0.1" defaultValue={pkg.promoCommissionRate || ""} className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Havidíj (Ft)</label>
                    <input name="monthlyFee" type="number" defaultValue={pkg.monthlyFee} required className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Marketing Hozzájárulás (%)</label>
                    <input name="marketingFee" type="number" step="0.1" defaultValue={pkg.marketingFee} required className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Bankkártyás Díj (%)</label>
                    <input name="cardFee" type="number" step="0.1" defaultValue={pkg.cardFee} required className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Aktív Termék Korlát (db)</label>
                    <input name="activeProductLimit" type="number" step="1" defaultValue={pkg.activeProductLimit || ""} placeholder="Üres = korlátlan" className="w-full px-4 py-2 rounded-xl bg-background/50 border border-border focus:border-primary outline-none" />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all">
                    Mentés
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {pkg.isActive ? "AKTÍV" : "INAKTÍV"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60">{pkg.description}</p>
                  </div>
                  <button onClick={() => setEditingId(pkg.id)} className="text-sm bg-background border border-border px-4 py-1.5 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                    Szerkesztés
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-background/50 rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Jutalék</p>
                    <p className="font-bold text-lg">{pkg.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Akciós Jutalék</p>
                    <p className="font-bold text-lg text-primary">{pkg.promoCommissionRate ? `${pkg.promoCommissionRate}%` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Havidíj</p>
                    <p className="font-bold text-lg">{pkg.monthlyFee.toLocaleString("hu-HU")} Ft</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Csomag Kód</p>
                    <p className="font-bold text-lg text-foreground/80">{pkg.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 p-4 bg-background/50 rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Marketing Hozzájárulás</p>
                    <p className="font-bold text-lg">{pkg.marketingFee}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Bankkártyás Díj</p>
                    <p className="font-bold text-lg">{pkg.cardFee}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Termék Korlát</p>
                    <p className="font-bold text-lg">{pkg.activeProductLimit ? `${pkg.activeProductLimit} db` : "Korlátlan"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
