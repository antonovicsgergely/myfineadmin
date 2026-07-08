import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-background via-surface to-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-sans flex flex-col glass p-12 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-primary/20 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div className="flex flex-col items-center justify-center mb-6">
          <img 
            src="/logo.svg" 
            alt="Myfine - Prémium Magyar Ízek" 
            className="h-32 w-auto object-contain mb-6"
          />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-center text-foreground">
            <span className="block text-primary mt-2 font-medium">Vendor Portal</span>
          </h1>
        </div>
        
        <p className="mt-4 text-lg text-foreground/70 max-w-2xl text-center mb-12">
          Kézműves manufaktúrák és prémium márkák back-office felülete. Kezeld termékeidet, kövesd rendeléseidet és elszámolásaidat egyszerűen.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/login"
            className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all hover:scale-105 active:scale-95 text-center"
          >
            Bejelentkezés
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-surface px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-border/50 transition-all hover:scale-105 active:scale-95 text-center"
          >
            Gyártói Regisztráció
          </Link>
        </div>
      </div>
    </main>
  );
}
