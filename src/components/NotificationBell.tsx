"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 30 másodpercenként frissítünk
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    
    // Ha kinyitjuk és van olvasatlan, akkor beállítjuk őket olvasottra a szerveren
    if (!isOpen && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "PUT" });
        setUnreadCount(0);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen} 
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative focus:outline-none"
      >
        {/* Harang Ikon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Olvasatlan jelvény */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Lenyíló ablak */}
      {isOpen && (
        <>
          {/* Teljes képernyős overlay kattintás figyelésére */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Értesítések</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Nincsenek értesítéseid.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 transition-colors hover:bg-gray-50 ${!notif.isRead && unreadCount > 0 ? "bg-blue-50/50" : ""}`}
                    >
                      <p className="text-sm font-bold text-gray-900 mb-1">{notif.title}</p>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(notif.createdAt).toLocaleDateString('hu-HU')} {new Date(notif.createdAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {notif.link && (
                          <Link 
                            href={notif.link} 
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Megtekintés
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
