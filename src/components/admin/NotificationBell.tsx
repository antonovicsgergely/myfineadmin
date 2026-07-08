"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NotificationCounts = {
  totalCount: number;
  details: {
    pendingVendors: number;
    pendingBrands: number;
    pendingBlogs: number;
    pendingCategories: number;
    pendingProducts: number;
    unassignedProducts: number;
  };
};

export default function NotificationBell() {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const fetchCounts = async () => {
    try {
      const res = await fetch("/api/admin/notifications/counts");
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchCounts();
    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Kívülre kattintás kezelése (dropdown bezárása)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ha oldalt váltunk, csukjuk be a menüt
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const total = counts?.totalCount || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isOpen ? "bg-gray-100 text-primary" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge */}
        {total > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Értesítések & Teendők</h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {total} új
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {total === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Nincsenek új jóváhagyandó teendők. 😊
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(counts?.details?.pendingVendors ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/vendors" 
                    title="Új Gyártói Regisztráció"
                    count={counts!.details.pendingVendors}
                    icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    color="text-blue-500"
                    bg="bg-blue-50"
                  />
                )}
                {(counts?.details?.pendingBrands ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/approvals/brands" 
                    title="Márkaoldal Jóváhagyás"
                    count={counts!.details.pendingBrands}
                    icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    color="text-purple-500"
                    bg="bg-purple-50"
                  />
                )}
                {(counts?.details?.pendingBlogs ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/approvals/blogs" 
                    title="Blog Jóváhagyás"
                    count={counts!.details.pendingBlogs}
                    icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
                    color="text-green-500"
                    bg="bg-green-50"
                  />
                )}
                {(counts?.details?.pendingCategories ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/approvals/categories" 
                    title="Kategória Igénylés"
                    count={counts!.details.pendingCategories}
                    icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    color="text-yellow-600"
                    bg="bg-yellow-50"
                  />
                )}
                {(counts?.details?.pendingProducts ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/approvals/products" 
                    title="Termék Besorolás & Jóváhagyás"
                    count={counts!.details.pendingProducts}
                    icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    color="text-orange-500"
                    bg="bg-orange-50"
                  />
                )}
                {(counts?.details?.unassignedProducts ?? 0) > 0 && (
                  <NotificationItem 
                    href="/admin/products" 
                    title="Kiosztatlan Termékek (Nincs gyártó)"
                    count={counts!.details.unassignedProducts}
                    icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    color="text-red-500"
                    bg="bg-red-50"
                  />
                )}
              </ul>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
            <button 
              onClick={() => fetchCounts()} 
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center justify-center gap-1 w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Lista frissítése
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ href, title, count, icon, color, bg }: { href: string, title: string, count: number, icon: string, color: string, bg: string }) {
  return (
    <li>
      <Link href={href} className="flex items-start p-4 hover:bg-gray-50 transition-colors group">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-bold text-gray-900">{count} db</span> vár ellenőrzésre.
          </p>
        </div>
        <div className="ml-2 flex-shrink-0">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </li>
  );
}
