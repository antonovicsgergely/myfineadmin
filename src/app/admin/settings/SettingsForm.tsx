"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({
  initialApiKey,
  initialPageId,
}: {
  initialApiKey: string;
  initialPageId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    unasApiKey: initialApiKey,
    unasPageId: initialPageId,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUnas = async () => {
    await saveSettings([
      { key: "UNAS_API_KEY", value: formData.unasApiKey },
      { key: "UNAS_MANUFAKTURAK_PAGE_ID", value: formData.unasPageId },
    ]);
  };

  const saveSettings = async (settings: { key: string; value: string }[]) => {
    setLoading(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) throw new Error("Hiba a mentés során");
      
      setSuccess("Beállítások sikeresen mentve!");
      router.refresh();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      alert("Hiba történt a mentés során.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm text-center">
          {success}
        </div>
      )}

      <div className="glass p-8 rounded-2xl shadow-sm border border-border/50 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Unas API Kapcsolat</h3>
        <p className="text-sm text-foreground/70 mb-6">
          Itt állíthatod be a központi Unas webáruház API hozzáférését.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">UNAS API Kulcs (API Key)</label>
            <input
              type="text"
              name="unasApiKey"
              value={formData.unasApiKey}
              onChange={handleChange}
              placeholder="Ide másold be az UNAS API kulcsot..."
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">UNAS "Manufaktúrák" Oldal ID (Plusz menük)</label>
            <input
              type="text"
              name="unasPageId"
              value={formData.unasPageId}
              onChange={handleChange}
              placeholder="Pl.: 74829"
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSaveUnas}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-6 rounded-lg shadow transition-all disabled:opacity-50 mt-2"
          >
            Mentés
          </button>
        </div>
      </div>
    </>
  );
}
