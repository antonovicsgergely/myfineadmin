"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

interface CampaignItem {
  id: string;
  targetType: string;
  vendorId: string | null;
  categoryId: string | null;
  productId: string | null;
  discountType: string;
  discountValue: number;
  customCommissionRate: number | null;
  maxQuantity: number | null;
  soldQuantity: number;
  targetName: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  publicTitle: string | null;
  publicDescription: string | null;
  bannerImageUrl: string | null;
  bannerLink: string | null;
  thumbnailUrl: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  showOnHomeBanner: boolean;
  showInFeatured: boolean;
  showInMenu: boolean;
  hasDedicatedPage: boolean;
  socialMediaText: string | null;
  socialMediaImageUrl: string | null;
  blogPostId: string | null;
  items: any[];
  createdBy: { name: string | null; email: string | null } | null;
  createdAt: string;
}

interface Vendor { id: string; companyName: string; brandName: string | null; }
interface Category { id: string; name: string; parentId: string | null; children?: Category[]; }
interface Product { id: string; name: string; itemNumber: string | null; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Tervezet", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  ACTIVE: { label: "Aktív", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  PAUSED: { label: "Szüneteltetve", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  ENDED: { label: "Befejezett", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  ARCHIVED: { label: "Archivált", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Százalékos kedvezmény",
  FIXED_AMOUNT: "Fix összeg kedvezmény",
  FIXED_PRICE: "Fix akciós ár",
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemType, setAddItemType] = useState<"VENDOR" | "CATEGORY" | "PRODUCT">("VENDOR");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [campaignRes, itemsRes, vendorsRes, categoriesRes, productsRes] = await Promise.all([
        fetch(`/api/admin/campaigns/${id}`),
        fetch(`/api/admin/campaigns/${id}/items`),
        fetch("/api/admin/vendors/simple"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/products?limit=500"),
      ]);
      setCampaign(await campaignRes.json());
      setItems(await itemsRes.json());
      setVendors(await vendorsRes.json());
      const catData = await categoriesRes.json();
      setCategories(Array.isArray(catData) ? catData : []);
      const prodData = await productsRes.json();
      setProducts(Array.isArray(prodData) ? prodData : (prodData?.products || []));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSaveCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload: any = {};
    formData.forEach((value, key) => {
      if (key.startsWith("show") || key === "hasDedicatedPage") {
        payload[key] = value === "on";
      } else {
        payload[key] = value;
      }
    });
    // Ensure booleans are false if unchecked
    ["showOnHomeBanner", "showInFeatured", "showInMenu", "hasDedicatedPage"].forEach(key => {
      if (!(key in payload)) payload[key] = false;
    });

    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign(updated);
        setIsEditing(false);
        alert("Kampány sikeresen mentve!");
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
    setSaving(false);
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload: any = {};
    formData.forEach((value, key) => { payload[key] = value; });

    try {
      const res = await fetch(`/api/admin/campaigns/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddItem(false);
        (e.target as HTMLFormElement).reset();
        fetchAll();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
    setSaving(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Biztosan törlöd ezt a tételt?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/items?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) fetchAll();
      else alert("Hiba történt.");
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const msgs: Record<string, string> = {
      ACTIVE: "Biztosan élesíted?",
      PAUSED: "Biztosan szünetelteted?",
      ENDED: "Biztosan lezárod?",
      ARCHIVED: "Biztosan archiválod?",
    };
    if (!confirm(msgs[newStatus] || "Biztosan folytatod?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  // Flatten categories for select
  const flattenCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  };

  if (loading) return <div className="p-6 text-foreground/60">Betöltés...</div>;
  if (!campaign) return <div className="p-6 text-red-500">Kampány nem található.</div>;

  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
  const flatCats = flattenCategories(categories);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/admin/campaigns" className="text-sm text-primary hover:underline font-medium mb-2 inline-block">
            ← Vissza a kampányokhoz
          </Link>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{campaign.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-foreground/50">
              Létrehozva: {format(new Date(campaign.createdAt), 'yyyy. MM. dd. HH:mm', { locale: hu })}
              {campaign.createdBy && ` — ${campaign.createdBy.name || campaign.createdBy.email}`}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "DRAFT" && (
            <button onClick={() => handleStatusChange("ACTIVE")} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors">
              🚀 Élesítés
            </button>
          )}
          {campaign.status === "ACTIVE" && (
            <>
              <button onClick={() => handleStatusChange("PAUSED")} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                ⏸ Szüneteltetés
              </button>
              <button onClick={() => handleStatusChange("ENDED")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                ⏹ Lezárás
              </button>
            </>
          )}
          {campaign.status === "PAUSED" && (
            <>
              <button onClick={() => handleStatusChange("ACTIVE")} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                ▶ Folytatás
              </button>
              <button onClick={() => handleStatusChange("ENDED")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                ⏹ Lezárás
              </button>
            </>
          )}
        </div>
      </div>

      {/* Campaign Details Section */}
      <div className="glass p-6 rounded-2xl shadow-sm border border-border/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-foreground">Kampány Adatai</h3>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-200">
              Szerkesztés
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveCampaign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kampány Neve *</label>
                <input type="text" name="name" defaultValue={campaign.name} required className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">URL Slug *</label>
                <input type="text" name="slug" defaultValue={campaign.slug} required className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Belső Leírás</label>
              <textarea name="description" defaultValue={campaign.description || ""} rows={2} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kezdete</label>
                <input type="date" name="startDate" defaultValue={campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : ""} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Vége</label>
                <input type="date" name="endDate" defaultValue={campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : ""} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <h4 className="font-bold text-foreground mb-3">Megjelenés</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "showOnHomeBanner", label: "🖼️ Főoldali Banner", defaultChecked: campaign.showOnHomeBanner },
                  { name: "showInFeatured", label: "⭐ Kiemelt Ajánlatok", defaultChecked: campaign.showInFeatured },
                  { name: "showInMenu", label: "📋 Akciók Menü", defaultChecked: campaign.showInMenu },
                  { name: "hasDedicatedPage", label: "📄 Saját Oldal", defaultChecked: campaign.hasDedicatedPage },
                ].map(toggle => (
                  <label key={toggle.name} className="flex items-center gap-2 text-sm font-medium text-foreground/80 cursor-pointer bg-background p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name={toggle.name} defaultChecked={toggle.defaultChecked} className="w-4 h-4 rounded accent-primary" />
                    {toggle.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button disabled={saving} type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all disabled:opacity-50">
                Mentés
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all">
                Mégse
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Időszak</p>
                <p className="font-medium text-foreground">
                  {campaign.startDate ? format(new Date(campaign.startDate), 'yyyy. MM. dd.', { locale: hu }) : "Azonnal"} — {campaign.endDate ? format(new Date(campaign.endDate), 'yyyy. MM. dd.', { locale: hu }) : "Visszavonásig"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Tételek</p>
                <p className="font-bold text-lg text-primary">{items.length} db</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Slug</p>
                <p className="font-medium text-foreground text-sm">{campaign.slug}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Leírás</p>
                <p className="font-medium text-foreground text-sm">{campaign.description || "—"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {campaign.showOnHomeBanner && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">🖼️ Banner</span>}
              {campaign.showInFeatured && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">⭐ Kiemelt</span>}
              {campaign.showInMenu && <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">📋 Menü</span>}
              {campaign.hasDedicatedPage && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">📄 Oldal</span>}
            </div>
          </div>
        )}
      </div>

      {/* Campaign Items Section */}
      <div className="glass p-6 rounded-2xl shadow-sm border border-border/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-foreground">Akciós Tételek</h3>
          {!showAddItem && (
            <button onClick={() => setShowAddItem(true)} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-green-200">
              + Tétel Hozzáadása
            </button>
          )}
        </div>

        {/* Add Item Form */}
        {showAddItem && (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-200 mb-6">
            <h4 className="font-bold text-foreground mb-4">Új Tétel Hozzáadása</h4>
            <form onSubmit={handleAddItem} className="space-y-4">
              {/* Target Type Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Mire vonatkozik az akció?</label>
                <div className="flex gap-3">
                  {(["VENDOR", "CATEGORY", "PRODUCT"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddItemType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${addItemType === type ? "bg-primary text-white border-primary" : "bg-white text-foreground/70 border-border hover:bg-slate-50"}`}
                    >
                      {type === "VENDOR" ? "🏭 Gyártó" : type === "CATEGORY" ? "📂 Kategória" : "📦 Termék"}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="targetType" value={addItemType} />
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  {addItemType === "VENDOR" ? "Gyártó *" : addItemType === "CATEGORY" ? "Kategória *" : "Termék *"}
                </label>
                <select name="targetId" required className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm">
                  <option value="">Válassz...</option>
                  {addItemType === "VENDOR" && vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName}{v.brandName ? ` (${v.brandName})` : ""}</option>
                  ))}
                  {addItemType === "CATEGORY" && flatCats.map(c => (
                    <option key={c.id} value={c.id}>{"—".repeat(c.depth)} {c.name}</option>
                  ))}
                  {addItemType === "PRODUCT" && products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}{p.itemNumber ? ` (${p.itemNumber})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Discount Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Kedvezmény Típusa *</label>
                  <select name="discountType" required className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm">
                    <option value="PERCENTAGE">Százalékos (pl. 20%)</option>
                    <option value="FIXED_AMOUNT">Fix összeg (pl. 500 Ft)</option>
                    <option value="FIXED_PRICE">Fix akciós ár</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Kedvezmény Értéke *</label>
                  <input type="number" step="0.1" name="discountValue" required placeholder="pl. 20" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Egyedi Jutalék % (Opc.)</label>
                  <input type="number" step="0.1" name="customCommissionRate" placeholder="pl. 10" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                </div>
              </div>

              {/* Stock Limit */}
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Készlet Korlát (Opc.)</label>
                <input type="number" name="maxQuantity" placeholder="Korlátlan, ha üres" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                <p className="text-xs text-foreground/50 mt-1">Max. db akciós áron, utána visszaáll a normál ár.</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button disabled={saving} type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all disabled:opacity-50">
                  Hozzáadás
                </button>
                <button type="button" onClick={() => setShowAddItem(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all">
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Table */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Még nincsenek tételek. Adj hozzá gyártókat, kategóriákat vagy termékeket!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-foreground/50 font-semibold uppercase text-xs">Típus</th>
                  <th className="text-left py-3 px-2 text-foreground/50 font-semibold uppercase text-xs">Cél</th>
                  <th className="text-left py-3 px-2 text-foreground/50 font-semibold uppercase text-xs">Kedvezmény</th>
                  <th className="text-left py-3 px-2 text-foreground/50 font-semibold uppercase text-xs">Jutalék</th>
                  <th className="text-left py-3 px-2 text-foreground/50 font-semibold uppercase text-xs">Készlet</th>
                  <th className="text-right py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-slate-50/50">
                    <td className="py-3 px-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        item.targetType === "VENDOR" ? "bg-purple-50 text-purple-700" :
                        item.targetType === "CATEGORY" ? "bg-teal-50 text-teal-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {item.targetType === "VENDOR" ? "🏭 Gyártó" : item.targetType === "CATEGORY" ? "📂 Kategória" : "📦 Termék"}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium">{item.targetName}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-primary">
                        {item.discountType === "PERCENTAGE" ? `${item.discountValue}%` :
                         item.discountType === "FIXED_AMOUNT" ? `${item.discountValue.toLocaleString('hu-HU')} Ft` :
                         `${item.discountValue.toLocaleString('hu-HU')} Ft (fix)`}
                      </span>
                      <span className="block text-xs text-foreground/50">{DISCOUNT_TYPE_LABELS[item.discountType]}</span>
                    </td>
                    <td className="py-3 px-2">
                      {item.customCommissionRate !== null ? `${item.customCommissionRate}%` : "—"}
                    </td>
                    <td className="py-3 px-2">
                      {item.maxQuantity ? (
                        <span className={item.soldQuantity >= item.maxQuantity ? "text-red-600 font-bold" : ""}>
                          {item.soldQuantity}/{item.maxQuantity} db
                        </span>
                      ) : "Korlátlan"}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700 font-bold">
                        ✕ Törlés
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unas Sync Section */}
      {campaign.status === "ACTIVE" && (
        <div className="glass p-6 rounded-2xl shadow-sm border border-border/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-foreground">Unas Szinkronizáció</h3>
            <button
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                setSyncResult(null);
                try {
                  const res = await fetch(`/api/admin/campaigns/${id}/sync`, { method: "POST" });
                  const result = await res.json();
                  if (res.ok) {
                    setSyncResult(result);
                  } else {
                    alert(result.error || "Hiba történt a szinkronizáció során.");
                  }
                } catch (error) {
                  alert("Hálózati hiba!");
                }
                setSyncing(false);
              }}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {syncing ? "Szinkronizálás..." : "🔄 Akciós Árak Szinkronizálása"}
            </button>
          </div>
          <p className="text-sm text-foreground/60 mb-4">
            Az akciós árak beállítása az Unas webáruházban. A szinkronizáció automatikusan lefut élesítéskor és lezáráskor is.
          </p>
          {syncResult && (
            <div className={`p-4 rounded-xl border ${syncResult.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <p className="font-bold text-sm">
                ✅ {syncResult.synced} termék akciós ára beállítva
                {syncResult.failed > 0 && <span className="text-amber-700"> | ❌ {syncResult.failed} sikertelen</span>}
              </p>
              {syncResult.errors && syncResult.errors.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 list-disc pl-4">
                  {syncResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
