"use client";

import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  HomeIcon, 
  UsersIcon, 
  ArchiveBoxIcon, 
  CheckBadgeIcon, 
  ShoppingCartIcon, 
  CreditCardIcon, 
  ArrowPathIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  TagIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navGroups = [
    {
      title: "FŐK",
      items: [
        { name: "Vezérlőpult", href: "/admin", icon: HomeIcon },
      ]
    },
    {
      title: "TERMELŐK & TERMÉKEK",
      items: [
        { name: "Gyártók", href: "/admin/vendors", icon: UsersIcon },
        { name: "Összes Termék", href: "/admin/products", icon: ArchiveBoxIcon },
      ]
    },
    {
      title: "JÓVÁHAGYÁSOK",
      items: [
        { name: "Márkaoldalak", href: "/admin/approvals/brands", icon: CheckBadgeIcon },
        { name: "Blog Bejegyzések", href: "/admin/approvals/blogs", icon: CheckBadgeIcon },
        { name: "Kategóriák", href: "/admin/approvals/categories", icon: CheckBadgeIcon },
        { name: "Termékek", href: "/admin/approvals/products", icon: CheckBadgeIcon },
      ]
    },
    {
      title: "ÉRTÉKESÍTÉS & PÉNZÜGY",
      items: [
        { name: "Rendelések", href: "/admin/orders", icon: ShoppingCartIcon },
        { name: "Előfizetési Csomagok", href: "/admin/packages", icon: CreditCardIcon },
      ]
    },
    {
      title: "TARTALMAK (NÉZET)",
      items: [
        { name: "Gyártói Oldalak", href: "/admin/views/brands", icon: DocumentTextIcon },
        { name: "Blog Bejegyzések", href: "/admin/views/blogs", icon: DocumentTextIcon },
        { name: "Kategóriák", href: "/admin/views/categories", icon: TagIcon },
        { name: "Szűrők", href: "/admin/views/filters", icon: AdjustmentsHorizontalIcon },
      ]
    },
    {
      title: "ADMINISZTRÁCIÓS FELÜLET",
      items: [
        { name: "Szinkronizáció", href: "/admin/sync", icon: ArrowPathIcon },
        { name: "Felhasználók", href: "/admin/users", icon: UsersIcon },
        { name: "ÁSZF", href: "/admin/aszf", icon: DocumentTextIcon },
        { name: "Általános beállítások", href: "/admin/settings", icon: Cog6ToothIcon },
      ]
    }
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-sm">
        <div className="p-6">
          <Link href="/admin" className="block w-full">
            <img 
              src="/logo.svg" 
              alt="Myfine Logo" 
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto pb-8">
          {navGroups.map((group, index) => (
            <div key={index}>
              <h3 className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white flex items-center px-8 z-10 sticky top-0 justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {navGroups.flatMap(g => g.items).find((item) => item.href === pathname)?.name || "Vezérlőpult"}
          </h2>
          <div className="flex items-center gap-4">
            
            <NotificationBell />
            
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-700 font-bold hover:bg-blue-100 bg-blue-50 rounded-xl transition-colors"
            >
              Gyártói Portál (Teszt)
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <div className="flex flex-col items-end justify-center">
               <span className="text-sm font-bold text-slate-700 leading-tight">{session?.user?.name || "Admin"}</span>
               <span className="text-[10px] text-slate-500 font-medium leading-tight">{session?.user?.email}</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden shadow-sm flex-shrink-0">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">AD</span>
              )}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors ml-2"
              title="Kijelentkezés"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            </button>

          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
