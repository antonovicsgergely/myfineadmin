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
    subscriptionTier: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPackages(data);
        }
      })
      .catch((err) => console.error("Csomagok lekérése sikertelen", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPackage = (code: string) => {
    setFormData((prev) => ({ ...prev, subscriptionTier: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriptionTier) {
      setError("Kérlek, válassz egy tagsági csomagot a folytatáshoz!");
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
      setFormData({ name: "", email: "", password: "", companyName: "", subscriptionTier: "" });
      
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

  const [step, setStep] = useState(1);

  const handleNextStep = () => {
    if (!formData.name || !formData.companyName || !formData.email || !formData.password) {
      setError("Minden mező kitöltése kötelező az első lépésben!");
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4 py-12">
      <div className="w-full max-w-2xl p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full"></div>
        
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">
          Gyártói Regisztráció
        </h2>
        
        {/* Lépésjelző */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-surface border border-border text-foreground/50'}`}>1</div>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-surface border border-border text-foreground/50'}`}>2</div>
          </div>
        </div>

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
          
          {step === 1 && (
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
              
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all mt-8 text-lg"
              >
                Tovább a csomagválasztáshoz
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Csomagválasztó */}
              <div className="mb-4">
                <label className="block text-lg font-bold text-foreground mb-4 text-center">Válassz tagsági csomagot</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.length === 0 ? (
                    <div className="col-span-3 text-sm text-center text-gray-500 py-8">Csomagok betöltése...</div>
                  ) : (
                    packages.map((pkg) => (
                      <div 
                        key={pkg.code} 
                        onClick={() => handleSelectPackage(pkg.code)}
                        className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${formData.subscriptionTier === pkg.code ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-border/50 bg-background/50 hover:border-primary/50'}`}
                      >
                        <div className="font-bold text-lg text-foreground mb-1">{pkg.name}</div>
                        <div className="text-primary font-extrabold mb-2">{pkg.monthlyFee.toLocaleString("hu-HU")} Ft <span className="text-xs font-normal text-foreground/60">/ hó</span></div>
                        <div className="text-xs text-foreground/70 space-y-1">
                          <div>Jutalék: <span className="font-semibold">{pkg.commissionRate}%</span></div>
                          {pkg.activeProductLimit ? <div>Max. termék: <span className="font-semibold">{pkg.activeProductLimit}</span></div> : <div>Max. termék: <span className="font-semibold">Korlátlan</span></div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-1/3 bg-surface hover:bg-surface-hover border border-border text-foreground font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  Vissza
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.subscriptionTier}
                  className="w-2/3 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? "Folyamatban..." : "Regisztráció befejezése"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Már van fiókod?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Jelentkezz be
          </Link>
        </p>
      </div>
    </main>
  );
}
