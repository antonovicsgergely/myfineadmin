import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-24 bg-background">
      <div className="text-center p-12 glass rounded-2xl max-w-lg">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Hozzáférés Megtagadva</h1>
        <p className="text-lg text-foreground mb-8">
          Nincs megfelelő jogosultságod az oldal megtekintéséhez, vagy a fiókod még adminisztrátori jóváhagyásra vár.
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow hover:bg-primary-hover transition-all"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </main>
  );
}
