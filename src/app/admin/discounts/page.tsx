"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface Vendor {
  id: string;
  companyName: string;
  brandName: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface VendorDiscount {
  id: string;
  name: string;
  vendorId: string;
  vendor: Vendor;
  createdById: string | null;
  createdBy: User | null;
  discountedCommissionRate: number | null;
  discountedPromoCommissionRate: number | null;
  discountedMonthlyFee: number | null;
  discountedMarketingFee: number | null;
  discountedCardFee: number | null;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ADD_NEW" | "ARCHIVED">("ACTIVE");
  const [discounts, setDiscounts] = useState<VendorDiscount[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [discountsRes, vendorsRes] = await Promise.all([
        fetch("/api/admin/discounts"),
        fetch("/api/admin/vendors/simple")
      ]);
      const discountsData = await discountsRes.json();
      const vendorsData = await vendorsRes.json();
      setDiscounts(discountsData);
      setVendors(vendorsData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleCreateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Sikeresen hozzáadva!");
        (e.target as HTMLFormElement).reset();
        setActiveTab("ACTIVE");
        fetchData();
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
    setSaving(false);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Biztosan archiválod ezt a kedvezményt? A gyártónak a továbbiakban nem lesz érvényes.")) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}/archive`, { method: "POST" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Hiba történt az archiválás során.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  const activeDiscounts = discounts.filter(d => !d.isArchived);
  const archivedDiscounts = discounts.filter(d => d.isArchived);

  const renderDiscountCard = (d: VendorDiscount) => {
    const isExpired = d.endDate && new Date(d.endDate) < new Date();
    
    return (
      <div key={d.id} className={`glass p-6 rounded-2xl shadow-sm border ${isExpired && !d.isArchived ? 'border-red-300 bg-red-50/50' : 'border-border/50'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary mb-1">{d.name}</h3>
            <h4 className="text-md font-semibold text-foreground">{d.vendor.companyName} {d.vendor.brandName ? `(${d.vendor.brandName})` : ""}</h4>
            <div className="mt-2 text-xs text-foreground/50 space-y-1">
              <p>Rögzítve: <span className="font-medium text-foreground/70">{format(new Date(d.createdAt), 'yyyy. MM. dd. HH:mm', { locale: hu })}</span></p>
              {d.createdBy && (
                <p>Rögzítette: <span className="font-medium text-foreground/70">{d.createdBy.name || "Ismeretlen"} ({d.createdBy.email})</span></p>
              )}
            </div>
          </div>
          {!d.isArchived && (
            <button 
              onClick={() => handleArchive(d.id)}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200"
            >
              Archiválás
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 text-sm">
          <span className="font-medium text-slate-500">Érvényesség:</span>
          {d.startDate ? format(new Date(d.startDate), 'yyyy. MM. dd.', { locale: hu }) : "Azonnal"}
          <span className="text-slate-400">-</span>
          {d.endDate ? format(new Date(d.endDate), 'yyyy. MM. dd.', { locale: hu }) : "Visszavonásig"}
          {isExpired && !d.isArchived && <span className="text-red-500 font-bold ml-2">(Lejárt)</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-background/50 p-4 rounded-xl border border-border">
          {d.discountedCommissionRate !== null && (
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Jutalék</p>
              <p className="font-bold text-primary">{d.discountedCommissionRate}%</p>
            </div>
          )}
          {d.discountedPromoCommissionRate !== null && (
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Akciós Jutalék</p>
              <p className="font-bold text-primary">{d.discountedPromoCommissionRate}%</p>
            </div>
          )}
          {d.discountedMonthlyFee !== null && (
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Havidíj</p>
              <p className="font-bold text-primary">{d.discountedMonthlyFee.toLocaleString('hu-HU')} Ft</p>
            </div>
          )}
          {d.discountedMarketingFee !== null && (
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Marketing</p>
              <p className="font-bold text-primary">{d.discountedMarketingFee}%</p>
            </div>
          )}
          {d.discountedCardFee !== null && (
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Bankkártya</p>
              <p className="font-bold text-primary">{d.discountedCardFee}%</p>
            </div>
          )}
          
          {[d.discountedCommissionRate, d.discountedPromoCommissionRate, d.discountedMonthlyFee, d.discountedMarketingFee, d.discountedCardFee].every(val => val === null) && (
            <div className="col-span-full text-sm text-slate-500 italic">Nem lett megadva konkrét egyedi díj.</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6 text-foreground/60">Betöltés...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Gyártói Kedvezmények</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Itt egyedi árazást és kedvezményeket állíthatsz be az egyes gyártóknak a csomagok alap díjaihoz képest.
        </p>
      </div>

      <div className="flex gap-4 border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab("ACTIVE")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ACTIVE" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Aktív Kedvezmények ({activeDiscounts.length})
        </button>
        <button 
          onClick={() => setActiveTab("ADD_NEW")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ADD_NEW" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Új Hozzáadása
        </button>
        <button 
          onClick={() => setActiveTab("ARCHIVED")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ARCHIVED" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Archívum ({archivedDiscounts.length})
        </button>
      </div>

      {activeTab === "ACTIVE" && (
        <div className="space-y-6">
          {activeDiscounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-slate-500">Nincsenek aktív kedvezmények.</p>
            </div>
          ) : (
            activeDiscounts.map(renderDiscountCard)
          )}
        </div>
      )}

      {activeTab === "ARCHIVED" && (
        <div className="space-y-6 opacity-70">
          {archivedDiscounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-slate-500">Az archívum üres.</p>
            </div>
          ) : (
            archivedDiscounts.map(renderDiscountCard)
          )}
        </div>
      )}

      {activeTab === "ADD_NEW" && (
        <div className="glass p-8 rounded-2xl shadow-sm border border-border/50">
          <form onSubmit={handleCreateDiscount} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kedvezmény Neve *</label>
                <input type="text" name="name" required placeholder="pl. Tavaszi Akció 2026" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Gyártó Kiválasztása *</label>
                <select name="vendorId" required className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm">
                  <option value="">Válassz gyártót...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.companyName} {v.brandName ? `(${v.brandName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Érvényesség Kezdete (Opcionális)</label>
                <input type="date" name="startDate" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                <p className="text-xs text-foreground/50 mt-1">Ha üres, azonnal érvénybe lép.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Érvényesség Vége (Opcionális)</label>
                <input type="date" name="endDate" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                <p className="text-xs text-foreground/50 mt-1">Ha üres, visszavonásig érvényes.</p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6 mt-6">
              <h4 className="font-bold text-foreground mb-4">Egyedi Célértékek (Kedvezményes Díjak)</h4>
              <p className="text-sm text-foreground/60 mb-6">
                Írd be azt a konkrét számot, amit a gyártónak fizetnie kell az alap csomagdíj helyett. 
                Amelyik mezőt üresen hagyod, arra az alap csomag árazása vonatkozik majd.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Új Jutalék (%)</label>
                  <input type="number" step="0.1" name="discountedCommissionRate" placeholder="pl. 10" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Új Akciós Jutalék (%)</label>
                  <input type="number" step="0.1" name="discountedPromoCommissionRate" placeholder="pl. 5" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Új Havidíj (Ft)</label>
                  <input type="number" step="1" name="discountedMonthlyFee" placeholder="pl. 0" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Új Marketing Hozzájárulás (%)</label>
                  <input type="number" step="0.1" name="discountedMarketingFee" placeholder="pl. 1" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Új Bankkártyás Díj (%)</label>
                  <input type="number" step="0.1" name="discountedCardFee" placeholder="pl. 0.5" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button disabled={saving} type="submit" className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-3 px-10 rounded-full shadow-md transition-all disabled:opacity-50">
                {saving ? "Mentés folyamatban..." : "Kedvezmény Létrehozása"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
