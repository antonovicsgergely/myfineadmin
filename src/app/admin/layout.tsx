"use client";

import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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

  const navItems = [
    { name: "Áttekintés", href: "/admin" },
    { name: "Gyártók", href: "/admin/vendors" },
    { name: "Összes Termék", href: "/admin/products" },
    { name: "Előfizetési Csomagok", href: "/admin/packages" },
    { name: "Márkaoldal Jóváhagyások", href: "/admin/approvals/brands" },
    { name: "Blog Jóváhagyások", href: "/admin/approvals/blogs" },
    { name: "Kategória Igénylések", href: "/admin/approvals/categories" },
    { name: "Termék Jóváhagyások", href: "/admin/approvals/products" },
    { name: "Rendelések", href: "/admin/orders" },
    { name: "Szinkronizáció", href: "/admin/sync" },
    { name: "Felhasználók", href: "/admin/users" },
    { name: "Rendszerbeállítások", href: "/admin/settings" },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col h-full z-20">
        <div className="p-6 border-b border-border">
          <Link href="/admin" className="block w-full">
            <img 
              src="/logo.svg" 
              alt="Myfine Logo" 
              className="h-20 w-auto object-contain"
            />
          </Link>
          <span className="text-primary text-xs font-semibold uppercase tracking-wider mt-2 block">Admin Panel</span>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-6 py-3 transition-all font-medium border-l-4 ${
                  isActive
                    ? "bg-blue-50 text-primary border-primary"
                    : "text-foreground/60 border-transparent hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate text-foreground">{session?.user?.name}</p>
            <p className="text-xs text-foreground/50 truncate">{session?.user?.email}</p>
          </div>
          <Link
            href="/dashboard"
            className="w-full block text-left px-4 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors mb-2"
          >
            Gyártói Portál (Teszt)
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-red-500 font-medium hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Kijelentkezés
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f8fafc]">
        <header className="h-16 bg-white border-b border-border flex items-center px-8 z-10 sticky top-0 justify-between shadow-sm">
          <h2 className="text-xl font-bold text-foreground">
            {navItems.find((item) => item.href === pathname)?.name || "Központi Irányítópult"}
          </h2>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
              Admin Fiók
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
