"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [brandName, setBrandName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/vendor/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.brandName || data.companyName)) {
          setBrandName(data.brandName || data.companyName);
        }
      })
      .catch(console.error);
  }, []);

  const navItems = [
    { name: "Áttekintés", href: "/dashboard" },
    { name: "Termékek", href: "/dashboard/products" },
    { name: "Márkaoldal", href: "/dashboard/brand-profile" },
    { name: "Blog Bejegyzések", href: "/dashboard/blog" },
    { name: "Rendelések", href: "/dashboard/orders" },
    { name: "Pénzügyek", href: "/dashboard/settlements" },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col h-full z-20">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="block w-full">
            <img 
              src="/logo.svg" 
              alt="Myfine Logo" 
              className="h-20 w-auto object-contain"
            />
          </Link>
          <span className="text-primary text-xs font-semibold uppercase tracking-wider mt-2 block">
            {brandName ? `${brandName} Admin` : "Vendor Portal"}
          </span>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
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
          
          {/* Admin panel link */}
          {((session?.user as any)?.role === "SUPERADMIN" || (session?.user as any)?.role === "ADMIN") && (
            <Link
              href="/admin"
              className="w-full block text-left px-4 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors mb-2"
            >
              Központi Adminisztráció
            </Link>
          )}
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
            {navItems.find((item) => item.href === pathname)?.name || (pathname.startsWith("/dashboard/settings") ? "Beállítások" : "Irányítópult")}
          </h2>
          <div className="flex items-center gap-6">
            
            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            <Link href="/dashboard/settings" className="text-foreground/60 hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
              Aktív Fiók
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
