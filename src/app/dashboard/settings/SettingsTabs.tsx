"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsTabs({ vendor }: { vendor: any }) {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const router = useRouter();

  const tabs = [
    { id: "company", label: "Cégadatok és Pénzügyi Információk" },
    { id: "security", label: "Felhasználói Profil" },
    { id: "subscription", label: "Előfizetés" },
    { id: "notifications", label: "Értesítések" }
  ];

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch("/api/vendor/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert("Sikeresen mentve!");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setLoading(false);
  };

  const handleAccountSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch("/api/vendor/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert("Személyes profil sikeresen mentve!");
        setIsEditingAccount(false);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setLoading(false);
  };

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    if (data.newPassword !== data.confirmPassword) {
      alert("A két új jelszó nem egyezik!");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/vendor/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      });
      if (res.ok) {
        alert("Jelszó sikeresen megváltoztatva!");
        (e.target as HTMLFormElement).reset();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setLoading(false);
  };

  const handleSubscriptionSave = async (tier: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/settings/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier: tier })
      });
      if (res.ok) {
        alert("Előfizetési csomag sikeresen módosítva!");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setLoading(false);
  };

  return (
    <div className="glass rounded-2xl shadow-sm border border-border/50 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-foreground/60 hover:text-foreground hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        
        {/* TAB: Cégadatok */}
        {activeTab === "company" && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Cégadatok és Pénzügyi Információk</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Márkanév</label>
                <input name="brandName" defaultValue={vendor.brandName || ""} required className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Üzemeltető cégnév</label>
                <input name="companyName" defaultValue={vendor.companyName} required className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Adószám</label>
                <input name="taxNumber" defaultValue={vendor.taxNumber || ""} className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Cégjegyzékszám / EV szám</label>
                <input name="registrationNumber" defaultValue={vendor.registrationNumber || ""} className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Bankszámlaszám (Elszámoláshoz)</label>
                <input name="bankAccountNumber" defaultValue={vendor.bankAccountNumber || ""} placeholder="HU00 0000..." className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Irányítószám</label>
                <input name="zipCode" defaultValue={vendor.zipCode || ""} className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Település</label>
                <input name="city" defaultValue={vendor.city || ""} className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Utca, házszám</label>
              <input name="streetAddress" defaultValue={vendor.streetAddress || ""} className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={loading} type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all disabled:opacity-50">
                {loading ? "Mentés..." : "Cégadatok Mentése"}
              </button>
            </div>
          </form>
        )}

        {/* TAB: Jelszó / Profil */}
        {activeTab === "security" && (
          <div className="space-y-12">
            
            {/* Személyes Adatok Form */}
            <form onSubmit={handleAccountSave} className="space-y-6 max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Személyes Adatok</h3>
                {!isEditingAccount && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditingAccount(true)}
                    className="text-foreground/50 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Szerkesztés
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Teljes Név</label>
                <input 
                  name="name" 
                  defaultValue={vendor.user?.name || ""} 
                  required 
                  disabled={!isEditingAccount}
                  className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${isEditingAccount ? 'bg-background/50 border border-border focus:border-primary text-foreground' : 'bg-transparent border-transparent text-foreground/80 font-medium px-0 py-1'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">E-mail cím</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={vendor.user?.email || ""} 
                  required 
                  disabled={!isEditingAccount}
                  className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${isEditingAccount ? 'bg-background/50 border border-border focus:border-primary text-foreground' : 'bg-transparent border-transparent text-foreground/80 font-medium px-0 py-1'}`} 
                />
                {isEditingAccount && <p className="text-xs text-foreground/50 mt-2">Ezzel az e-mail címmel tudsz bejelentkezni a jövőben.</p>}
              </div>

              {isEditingAccount && (
                <div className="pt-4 flex items-center gap-4">
                  <button disabled={loading} type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all disabled:opacity-50">
                    {loading ? "Feldolgozás..." : "Adataim Mentése"}
                  </button>
                  <button type="button" onClick={() => setIsEditingAccount(false)} className="text-sm text-foreground/60 hover:text-foreground font-medium">
                    Mégse
                  </button>
                </div>
              )}
            </form>

            <hr className="border-border/50 max-w-lg" />

            {/* Jelszó Változtatás Form */}
            <form onSubmit={handlePasswordSave} className="space-y-6 max-w-lg">
              <h3 className="text-lg font-bold text-foreground mb-4">Jelszó Változtatása</h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Jelenlegi Jelszó</label>
                <input name="currentPassword" type="password" required className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Új Jelszó</label>
                <input name="newPassword" type="password" required className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Új Jelszó Megerősítése</label>
                <input name="confirmPassword" type="password" required className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary outline-none transition-all" />
              </div>

              <div className="pt-4">
                <button disabled={loading} type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all disabled:opacity-50">
                  {loading ? "Feldolgozás..." : "Jelszó Frissítése"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: Előfizetés */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Előfizetési Csomag Kezelése</h3>
            <p className="text-sm text-foreground/70 mb-6">Jelenlegi csomagod: <strong className="text-primary">{vendor.subscriptionTier}</strong></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* BASIC */}
              <div className={`border-2 rounded-2xl p-6 relative ${vendor.subscriptionTier === 'BASIC' ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                {vendor.subscriptionTier === 'BASIC' && <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">AKTÍV</div>}
                <h4 className="text-xl font-bold mb-2">Alap Csomag</h4>
                <p className="text-sm text-foreground/60 mb-6">Induló kézműveseknek és termelőknek, alap szinkronizációval.</p>
                {vendor.subscriptionTier !== 'BASIC' && (
                  <button onClick={() => handleSubscriptionSave("BASIC")} disabled={loading} className="w-full py-2.5 rounded-xl font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors">Váltás erre</button>
                )}
              </div>

              {/* PRO */}
              <div className={`border-2 rounded-2xl p-6 relative ${vendor.subscriptionTier === 'PRO' ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                {vendor.subscriptionTier === 'PRO' && <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">AKTÍV</div>}
                <h4 className="text-xl font-bold mb-2">Pro Csomag</h4>
                <p className="text-sm text-foreground/60 mb-6">Haladó funkciók, automatikus számlázás és prioritásos támogatás.</p>
                {vendor.subscriptionTier !== 'PRO' && (
                  <button onClick={() => handleSubscriptionSave("PRO")} disabled={loading} className="w-full py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary-hover shadow-md transition-colors">Váltás erre</button>
                )}
              </div>

              {/* PREMIUM */}
              <div className={`border-2 rounded-2xl p-6 relative ${vendor.subscriptionTier === 'PREMIUM' ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                {vendor.subscriptionTier === 'PREMIUM' && <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">AKTÍV</div>}
                <h4 className="text-xl font-bold mb-2">Prémium Csomag</h4>
                <p className="text-sm text-foreground/60 mb-6">Minden funkció korlátlanul, egyedi logisztikai árakkal.</p>
                {vendor.subscriptionTier !== 'PREMIUM' && (
                  <button onClick={() => handleSubscriptionSave("PREMIUM")} disabled={loading} className="w-full py-2.5 rounded-xl font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors">Váltás erre</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Értesítések */}
        {activeTab === "notifications" && (
          <form onSubmit={handleProfileSave} className="space-y-6 max-w-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">Értesítési Beállítások</h3>
            
            <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-background/50">
              <input type="hidden" name="emailNotifications" value="false" />
              <input 
                type="checkbox" 
                id="emailNotifications" 
                name="emailNotifications" 
                value="true"
                defaultChecked={vendor.emailNotifications} 
                className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary" 
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium text-foreground">
                Szeretnék e-mail értesítést kapni az új rendelésekről és az automatikus havi elszámolásokról.
              </label>
            </div>

            <div className="pt-4">
              <button disabled={loading} type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all disabled:opacity-50">
                {loading ? "Mentés..." : "Beállítások Mentése"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
