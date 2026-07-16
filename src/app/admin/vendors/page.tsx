import prisma from "@/lib/prisma";
import VendorList from "./VendorList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: {
        select: { email: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Gyártók Kezelése</h2>
        <Link
          href="/admin/vendors/new"
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-semibold shadow transition-all flex items-center gap-2"
        >
          <span>+</span> Új gyártó kézi felvétele
        </Link>
      </div>

      <div className="glass p-6 rounded-2xl shadow-sm border border-border/50 bg-primary/5">
        <h3 className="text-lg font-bold text-primary mb-2">Gyártó Onboarding Útmutató</h3>
        <p className="text-sm text-foreground/80 mb-4">A rendszerbe kétféleképpen kerülhetnek be a gyártók:</p>
        <ul className="list-disc pl-5 text-sm text-foreground/70 space-y-2">
          <li><strong>Admin Hozzáadás:</strong> Te is felvehetsz manuálisan új gyártót az "Új Gyártó Hozzáadása" gombbal.</li>
          <li><strong>Nyilvános Regisztráció:</strong> A gyártó regisztrál a <Link href="/register" className="text-primary hover:underline">/register</Link> oldalon. Ekkor a fiókja azonnal "Aktív" (APPROVED) státuszba kerül és be tud lépni. Bármilyen új tartalmat (Márkaoldal, Termék, stb.) hoz létre a felületén, ahhoz külön engedély/jóváhagyás kell.</li>
        </ul>
      </div>
      
      <div className="glass rounded-2xl overflow-hidden shadow-sm border border-border/50">
        <VendorList initialVendors={vendors} />
      </div>
    </div>
  );
}
