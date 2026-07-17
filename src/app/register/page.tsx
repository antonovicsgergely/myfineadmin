"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [acceptAszf, setAcceptAszf] = useState(false);
  const [aszfContent, setAszfContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings/aszf")
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          setAszfContent(data.content);
        }
      })
      .catch(err => console.error("ÁSZF lekérése sikertelen", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName || !formData.email || !formData.password) {
      setError("Minden mező kitöltése kötelező!");
      return;
    }
    
    if (!acceptAszf) {
      setError("Kérlek, olvasd el és fogadd el az Általános Szerződési Feltételeket!");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Hiba történt a regisztráció során.");
      }

      setSuccess(data.message);
      setFormData({ name: "", email: "", password: "", companyName: "" });
      
      // Sikeres regisztráció után átirányítás a bejelentkezéshez rövid késleltetéssel
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4 py-12">
      <div className="w-full max-w-2xl p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full"></div>
        
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">
          Gyártói Regisztráció
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm text-center">
            {success} <br/> <span className="text-xs opacity-80">Átirányítás a bejelentkezéshez...</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative z-10" autoComplete="off">
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kapcsolattartó neve</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Cégnév / Márkanév</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="off"
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
                  autoComplete="new-email"
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Jelszó</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="flex items-start gap-3 mt-4 mb-2 bg-background/30 p-3 rounded-lg border border-border/50">
              <input
                type="checkbox"
                id="aszf"
                checked={acceptAszf}
                onChange={(e) => setAcceptAszf(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
              />
              <label htmlFor="aszf" className="text-sm text-foreground/80 leading-snug">
                Elolvastam és elfogadom az{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-primary hover:underline font-bold"
                >
                  Általános Szerződési Feltételeket
                </button>.
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !acceptAszf}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg"
            >
              {loading ? "Regisztráció folyamatban..." : "Regisztráció befejezése"}
            </button>
          </div>

        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Már van fiókod?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Jelentkezz be
          </Link>
        </p>
      </div>

      {/* ÁSZF Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface/50">
              <h3 className="text-xl font-bold text-foreground">Általános Szerződési Feltételek (ÁSZF)</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-accent/10 text-foreground/60 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-foreground/80 leading-relaxed">
              {aszfContent}
            </div>
            <div className="p-4 border-t border-border/50 bg-surface/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-background hover:bg-surface border border-border text-foreground rounded-lg font-medium transition-colors"
              >
                Mégse
              </button>
              <button 
                onClick={() => {
                  setAcceptAszf(true);
                  setIsModalOpen(false);
                }}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
              >
                Elfogadom
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
