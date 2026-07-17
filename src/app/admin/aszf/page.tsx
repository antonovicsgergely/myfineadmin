"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function AdminAszfPage() {
  const [aszfContent, setAszfContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/aszf")
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          setAszfContent(data.content);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Hiba az ÁSZF lekérdezésekor", err);
        setLoading(false);
      });
  }, []);

  const handleSaveAszf = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "ASZF_DOC", value: aszfContent }
          ]
        })
      });
      
      if (res.ok) {
        alert("ÁSZF sikeresen elmentve!");
      } else {
        alert("Hiba az ÁSZF mentése során!");
      }
    } catch (error) {
      alert("Hálózati hiba!");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-foreground/60 p-6">ÁSZF betöltése...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Általános Szerződési Feltételek (ÁSZF)</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Az itt megadott szöveget kell a gyártóknak kötelezően elfogadniuk a regisztráció során.
        </p>
      </div>

      <div className="glass p-6 rounded-2xl shadow-sm border border-border/50">
        <form onSubmit={handleSaveAszf} className="space-y-4">
          <div className="bg-white rounded-xl overflow-hidden border border-border">
            <JoditEditor
              value={aszfContent}
              config={{
                readonly: false,
                height: 500,
                placeholder: "Írd ide a teljes ÁSZF szövegét...",
              }}
              onBlur={(newContent) => setAszfContent(newContent)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-8 rounded-full shadow-md transition-all disabled:opacity-50"
            >
              {saving ? "Mentés..." : "ÁSZF Mentése"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
