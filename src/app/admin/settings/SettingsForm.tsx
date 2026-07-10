"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageCropperModal from "@/components/ImageCropperModal";

export default function SettingsForm({
  initialApiKey,
  initialPageId,
  initialBlogPageId,
  user
}: {
  initialApiKey: string;
  initialPageId: string;
  initialBlogPageId: string;
  user: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    unasApiKey: initialApiKey,
    unasPageId: initialPageId,
    unasBlogPageId: initialBlogPageId,
  });

  const [userForm, setUserForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    image: user?.image || "",
  });
  
  // Crop state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChangeForCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 🔒 Előző object URL felszabadítása ha volt
    if (cropperImageSrc) {
      URL.revokeObjectURL(cropperImageSrc);
    }
    
    const url = URL.createObjectURL(file);
    setCropperImageSrc(url);
    setCropperOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    
    // 🔒 Object URL felszabadítása
    if (cropperImageSrc) {
      URL.revokeObjectURL(cropperImageSrc);
      setCropperImageSrc("");
    }
    
    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append("file", croppedBlob, "admin_profile.jpg");

    try {
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: uploadData
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserForm((prev) => ({ ...prev, image: data.url }));
        
        // Persist immediately
        await fetch("/api/admin/settings/account", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: userForm.name, 
            email: userForm.email,
            image: data.url
          }),
        });
        router.refresh();
        setSuccess("Profilkép sikeresen mentve!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Hiba történt a kép feltöltésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setUploadingImage(false);
  };

  const handleSaveUser = async () => {
    setLoading(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hiba a mentés során");
      }
      
      setSuccess("Személyes profil sikeresen mentve!");
      router.refresh();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUnas = async () => {
    await saveSettings([
      { key: "UNAS_API_KEY", value: formData.unasApiKey },
      { key: "UNAS_MANUFAKTURAK_PAGE_ID", value: formData.unasPageId },
      { key: "UNAS_BLOG_PAGE_ID", value: formData.unasBlogPageId },
    ]);
  };

  const saveSettings = async (settings: { key: string; value: string }[]) => {
    setLoading(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) throw new Error("Hiba a mentés során");
      
      setSuccess("Beállítások sikeresen mentve!");
      router.refresh();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      alert("Hiba történt a mentés során.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm text-center">
          {success}
        </div>
      )}

      {/* Személyes Profil */}
      <div className="glass p-8 rounded-2xl shadow-sm border border-border/50 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Személyes profil</h3>
        <p className="text-sm text-foreground/70 mb-6">
          Itt módosíthatod az adminisztrátori fiókod adatait és profilképét.
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-start mb-6">
          {/* Képfeltöltő */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-dashed border-border/50 bg-background/50 group">
              {userForm.image ? (
                <img src={userForm.image} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-foreground/40">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="text-xs">Nincs kép</span>
                </div>
              )}
            </div>
            
            <label className="cursor-pointer text-sm font-semibold text-primary hover:text-primary-hover transition-colors px-4 py-2 border border-primary/20 hover:border-primary/50 rounded-full bg-primary/5 hover:bg-primary/10">
              {uploadingImage ? "Feltöltés..." : "Kép kiválasztása"}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChangeForCrop} disabled={uploadingImage} />
            </label>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Teljes Név</label>
              <input
                type="text"
                name="name"
                value={userForm.name}
                onChange={handleUserChange}
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">E-mail cím</label>
              <input
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleUserChange}
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSaveUser}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50"
          >
            Mentés
          </button>
        </div>
      </div>

      <div className="glass p-8 rounded-2xl shadow-sm border border-border/50 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Unas API Kapcsolat</h3>
        <p className="text-sm text-foreground/70 mb-6">
          Itt állíthatod be a központi Unas webáruház API hozzáférését.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">UNAS API Kulcs (API Key)</label>
            <input
              type="text"
              name="unasApiKey"
              value={formData.unasApiKey}
              onChange={handleChange}
              placeholder="Ide másold be az UNAS API kulcsot..."
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">UNAS "Manufaktúrák" Oldal ID (Plusz menük)</label>
            <input
              type="text"
              name="unasPageId"
              value={formData.unasPageId}
              onChange={handleChange}
              placeholder="Pl.: 74829"
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">UNAS "Blog" Oldal ID (Plusz menük)</label>
            <input
              type="text"
              name="unasBlogPageId"
              value={formData.unasBlogPageId}
              onChange={handleChange}
              placeholder="Pl.: 74830"
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveUnas}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50"
          >
            Mentés
          </button>
        </div>
      </div>
      
      {cropperOpen && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
