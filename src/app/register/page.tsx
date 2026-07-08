"use client";

import { useState } from "react";
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
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full"></div>
        
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">Gyártói Regisztráció</h2>
        
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
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Kapcsolattartó neve</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
            <label className="block text-sm font-medium text-foreground/80 mb-2">Jelszó</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Regisztráció..." : "Regisztráció"}
          </button>
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
