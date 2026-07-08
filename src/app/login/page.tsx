"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
        
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">Bejelentkezés</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
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
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground/80">Jelszó</label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Elfelejtetted a jelszavad?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Bejelentkezés..." : "Bejelentkezés"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Nincs még fiókod?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Regisztrálj itt
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-foreground/60">
          <Link href="/" className="hover:underline">
            Vissza a főoldalra
          </Link>
        </p>
      </div>
    </main>
  );
}
