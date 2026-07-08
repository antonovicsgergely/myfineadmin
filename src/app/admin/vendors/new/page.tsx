"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Hiba történt a rögzítés során.");
      }

      setSuccess("A gyártó sikeresen létrejött! Átirányítás...");
      setFormData({ companyName: "", email: "", password: "" });
      
      setTimeout(() => {
        router.push("/admin/vendors");
        router.refresh();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/vendors" className="text-foreground/50 hover:text-foreground transition-colors">
          &larr; Vissza a listához
        </Link>
        <h2 className="text-2xl font-bold text-foreground">Új Gyártó Kézi Felvétele</h2>
      </div>

      <div className="glass p-8 rounded-2xl shadow-sm border border-border/50">
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6">
          <p className="text-sm text-foreground/80 font-medium">ℹ️ Fontos Tudnivaló</p>
          <p className="text-xs text-foreground/70 mt-1">
            Az itt felvett gyártók azonnal <span className="font-bold text-primary">Jóváhagyva (APPROVED)</span> státuszba kerülnek, tehát azonnal be tudnak lépni a rendszerbe a megadott e-mail címmel és jelszóval. Kérjük, juttasd el nekik a megadott adatokat!
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Cégnév / Márkanév</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Email cím</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Ideiglenes Jelszó</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="pl. MyFine2026Gyarto!"
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
              minLength={6}
            />
          </div>
          
          <div className="pt-4 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Feldolgozás..." : "Gyártó Létrehozása"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
