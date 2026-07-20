"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  showOnHomeBanner: boolean;
  showInFeatured: boolean;
  showInMenu: boolean;
  hasDedicatedPage: boolean;
  bannerImageUrl: string | null;
  thumbnailUrl: string | null;
  items: any[];
  createdBy: { name: string | null; email: string | null } | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Tervezet", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  ACTIVE: { label: "Aktív", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  PAUSED: { label: "Szüneteltetve", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  ENDED: { label: "Befejezett", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  ARCHIVED: { label: "Archivált", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

export default function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ADD_NEW" | "ARCHIVED">("ACTIVE");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload: any = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newCampaign = await res.json();
        alert("Kampány sikeresen létrehozva!");
        (e.target as HTMLFormElement).reset();
        fetchCampaigns();
        // Redirect to campaign detail page
        window.location.href = `/admin/campaigns/${newCampaign.id}`;
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const confirmMessages: Record<string, string> = {
      ACTIVE: "Biztosan élesíted a kampányt?",
      PAUSED: "Biztosan szünetelteted a kampányt?",
      ENDED: "Biztosan lezárod a kampányt? Az akciós árak visszaállnak.",
      ARCHIVED: "Biztosan archiválod a kampányt?",
    };
    if (!confirm(confirmMessages[newStatus] || "Biztosan folytatod?")) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt a tervezetet?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt.");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
  };

  const activeCampaigns = campaigns.filter(c => ["DRAFT", "ACTIVE", "PAUSED"].includes(c.status));
  const archivedCampaigns = campaigns.filter(c => ["ENDED", "ARCHIVED"].includes(c.status));

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderCampaignCard = (campaign: Campaign) => (
    <div key={campaign.id} className="glass p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-foreground">{campaign.name}</h3>
            {renderStatusBadge(campaign.status)}
          </div>
          {campaign.description && (
            <p className="text-sm text-foreground/60 mb-2">{campaign.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-foreground/50 mt-2">
            <span>📅 {campaign.startDate ? format(new Date(campaign.startDate), 'yyyy. MM. dd.', { locale: hu }) : "Azonnal"} — {campaign.endDate ? format(new Date(campaign.endDate), 'yyyy. MM. dd.', { locale: hu }) : "Visszavonásig"}</span>
            <span>📦 {campaign.items.length} tétel</span>
            {campaign.createdBy && <span>👤 {campaign.createdBy.name || campaign.createdBy.email}</span>}
          </div>
        </div>
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {campaign.showOnHomeBanner && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">🖼️ Banner</span>}
        {campaign.showInFeatured && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">⭐ Kiemelt</span>}
        {campaign.showInMenu && <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">📋 Menü</span>}
        {campaign.hasDedicatedPage && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">📄 Oldal</span>}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
        >
          Szerkesztés
        </Link>
        {campaign.status === "DRAFT" && (
          <>
            <button onClick={() => handleStatusChange(campaign.id, "ACTIVE")} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-green-200">
              Élesítés
            </button>
            <button onClick={() => handleDelete(campaign.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200">
              Törlés
            </button>
          </>
        )}
        {campaign.status === "ACTIVE" && (
          <>
            <button onClick={() => handleStatusChange(campaign.id, "PAUSED")} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-amber-200">
              Szüneteltetés
            </button>
            <button onClick={() => handleStatusChange(campaign.id, "ENDED")} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200">
              Lezárás
            </button>
          </>
        )}
        {campaign.status === "PAUSED" && (
          <>
            <button onClick={() => handleStatusChange(campaign.id, "ACTIVE")} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-green-200">
              Újra élesítés
            </button>
            <button onClick={() => handleStatusChange(campaign.id, "ENDED")} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200">
              Lezárás
            </button>
          </>
        )}
        {campaign.status === "ENDED" && (
          <button onClick={() => handleStatusChange(campaign.id, "ARCHIVED")} className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold px-3 py-1.5 rounded-lg transition-colors border border-gray-200">
            Archiválás
          </button>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-6 text-foreground/60">Betöltés...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Kampányszervező</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Hozz létre és kezelj akciós kampányokat egyedi árazással, időszakos kedvezményekkel és készletkorlátokkal.
        </p>
      </div>

      <div className="flex gap-4 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ACTIVE" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Aktív & Tervezett ({activeCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("ADD_NEW")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ADD_NEW" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Új Kampány
        </button>
        <button
          onClick={() => setActiveTab("ARCHIVED")}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${activeTab === "ARCHIVED" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"}`}
        >
          Archívum ({archivedCampaigns.length})
        </button>
      </div>

      {activeTab === "ACTIVE" && (
        <div className="space-y-6">
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-slate-500">Nincsenek aktív vagy tervezett kampányok.</p>
              <button onClick={() => setActiveTab("ADD_NEW")} className="mt-4 text-primary font-bold hover:underline">
                Új kampány létrehozása →
              </button>
            </div>
          ) : (
            activeCampaigns.map(renderCampaignCard)
          )}
        </div>
      )}

      {activeTab === "ARCHIVED" && (
        <div className="space-y-6 opacity-70">
          {archivedCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-slate-500">Az archívum üres.</p>
            </div>
          ) : (
            archivedCampaigns.map(renderCampaignCard)
          )}
        </div>
      )}

      {activeTab === "ADD_NEW" && (
        <div className="glass p-8 rounded-2xl shadow-sm border border-border/50">
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kampány Neve *</label>
                <input type="text" name="name" required placeholder="pl. Nyári Leárazás 2026" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Belső Leírás (Opcionális)</label>
                <input type="text" name="description" placeholder="Csak admin számára látható leírás" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kampány Kezdete (Opcionális)</label>
                <input type="date" name="startDate" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                <p className="text-xs text-foreground/50 mt-1">Ha üres, azonnal élesíthető.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kampány Vége (Opcionális)</label>
                <input type="date" name="endDate" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm" />
                <p className="text-xs text-foreground/50 mt-1">Ha üres, kézi lezárásig fut.</p>
              </div>
            </div>

            <div className="pt-6">
              <button disabled={saving} type="submit" className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-3 px-10 rounded-full shadow-md transition-all disabled:opacity-50">
                {saving ? "Mentés folyamatban..." : "Kampány Létrehozása"}
              </button>
              <p className="text-xs text-foreground/50 mt-2">A kampány tervezet (DRAFT) státuszban jön létre. A tételeket és részleteket a következő oldalon tudod beállítani.</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
