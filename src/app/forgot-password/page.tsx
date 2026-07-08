"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mockLink, setMockLink] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Ha az email cím regisztrálva van, elküldtük a visszaállítási linket.");
        if (data.mockLink) {
          setMockLink(data.mockLink);
        }
      } else {
        setError(data.error || "Hiba történt a kérés során.");
      }
    } catch (err) {
      setError("Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold text-foreground">Elfelejtett jelszó</h2>
          <p className="text-sm text-foreground/70 mt-2">
            Add meg a regisztrált email címedet, és küldünk egy linket a jelszavad visszaállításához.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center relative z-10">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-600 p-3 rounded-lg mb-6 text-sm text-center relative z-10 break-all">
            {message}
            {mockLink && (
              <div className="mt-4 pt-4 border-t border-green-500/30">
                <p className="font-bold mb-2">Fejlesztői teszt link (mivel nincs email küldő beállítva):</p>
                <a href={mockLink} className="text-primary hover:underline font-medium bg-background/50 p-2 rounded block">
                  {mockLink}
                </a>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Email cím</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
              placeholder="pelda@email.hu"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Visszaállító link küldése"
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <Link href="/login" className="text-sm text-primary hover:underline font-medium">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    </main>
  );
}
