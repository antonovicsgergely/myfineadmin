"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Érvénytelen vagy hiányzó visszaállítási link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError("A két jelszó nem egyezik meg!");
      return;
    }

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("A jelszavad sikeresen frissült! Most már bejelentkezhetsz.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Hiba történt a jelszó módosítása során.");
      }
    } catch (err) {
      setError("Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-bold text-foreground">Új jelszó megadása</h2>
        <p className="text-sm text-foreground/70 mt-2">
          Kérlek adj meg egy új, biztonságos jelszót a fiókodhoz.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center relative z-10">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-600 p-3 rounded-lg mb-6 text-sm text-center relative z-10">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Új jelszó</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            required
            disabled={!token || !!message}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Új jelszó megerősítése</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            required
            disabled={!token || !!message}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !token || !!message}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "Jelszó módosítása"
          )}
        </button>
      </form>

      <div className="mt-8 text-center relative z-10">
        <Link href="/login" className="text-sm text-primary hover:underline font-medium">
          Vissza a bejelentkezéshez
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
