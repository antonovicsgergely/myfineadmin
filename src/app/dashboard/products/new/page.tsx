"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"MANUAL" | "EXCEL" | "FEED">("MANUAL");
  
  const [categories, setCategories] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryRequest, setCategoryRequest] = useState({ name: "", type: "CATEGORY" });

  // For hierarchical selection
  const [selectedCatPath, setSelectedCatPath] = useState<string[]>([]);
  const [currentCatLevel, setCurrentCatLevel] = useState<any[]>([]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    regionId: "",
    price: "",
    salePrice: "",
    weight: "",
    width: "",
    height: "",
    length: "",
    shortDescription: "",
    description: "",
    barcode: "",
    imageUrl: "",
    feedUrl: "",
    
    // Statuses
    statusActive: true,
    statusNotPurchasable: false,
    statusAdultOnly: false,
    statusHidden: false,
    statusGiftOnly: false,
    statusNew: false,
    statusInquiry: false,
    statusAutoExport: true,
    statusNoDirectDiscount: false,
    
    // Public Period
    publicFrom: "",
    publicTo: "",
    
    // Inventory
    useInventory: true,
    allowBackorder: false,
    lowStockThreshold: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/vendor/categories");
      const data = await res.json();
      setCategories(data.categories || []);
      setRegions(data.regions || []);
      setCurrentCatLevel(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>, levelIndex: number) => {
    const selectedId = e.target.value;
    const newPath = [...selectedCatPath.slice(0, levelIndex), selectedId];
    setSelectedCatPath(newPath);
    setFormData(prev => ({ ...prev, categoryId: selectedId }));
  };

  const getSubcategories = (path: string[]) => {
    let current = categories;
    const levels = [current];
    
    for (const id of path) {
      const found = current.find((c: any) => c.id === id);
      if (found && found.children && found.children.length > 0) {
        current = found.children;
        levels.push(current);
      } else {
        break;
      }
    }
    return levels;
  };

  const categoryLevels = getSubcategories(selectedCatPath);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert(data.error || "Hiba a feltöltés során.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imageUrl) return alert("Hiba: Kép feltöltése kötelező a Minőségi Szűrő (TEF) alapján!");
    if (!formData.barcode) return alert("Hiba: A vonalkód (EAN/GTIN) megadása kötelező!");
    if (!formData.shortDescription || formData.shortDescription.length < 10) return alert("Hiba: A Rövid leírás megadása kötelező (min. 10 karakter)!");
    if (!formData.categoryId) return alert("Hiba: Kérlek válassz egy kategóriát!");
    if (!formData.regionId) return alert("Hiba: Kérlek válassz egy régiót!");
    if (!formData.weight || !formData.width || !formData.height || !formData.length) return alert("Hiba: Szállítási adatok (Súly és Méretek) megadása kötelező!");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        weight: parseFloat(formData.weight),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        length: parseFloat(formData.length),
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : null,
        publicFrom: formData.publicFrom ? new Date(formData.publicFrom).toISOString() : null,
        publicTo: formData.publicTo ? new Date(formData.publicTo).toISOString() : null,
        uploadMethod: "MANUAL"
      };

      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Hiba a mentés során");
      }
      
      alert("Termék sikeresen beküldve! (TEF szűrőn átment)");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleRequestCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vendor/categories/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedName: categoryRequest.name, type: categoryRequest.type })
      });
      if (res.ok) {
        alert("Igénylés sikeresen beküldve az Adminnak!");
        setShowCategoryModal(false);
        setCategoryRequest({ name: "", type: "CATEGORY" });
      } else {
        alert("Hiba történt az igénylés során.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="text-foreground/50 hover:text-foreground transition-colors font-bold">
            &larr; Vissza
          </Link>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Termékfeltöltés</h2>
        </div>
        <button 
          onClick={() => setShowCategoryModal(true)}
          className="text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2 rounded-lg font-bold transition-colors"
        >
          Nem találsz jó kategóriát? Igényelj!
        </button>
      </div>
      
      <div className="flex gap-2 border-b border-border/50 pb-2">
        <button onClick={() => setActiveTab("MANUAL")} className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === "MANUAL" ? "bg-white border border-border/50 border-b-0 text-primary shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>Kézi Felvitel</button>
        <button onClick={() => setActiveTab("EXCEL")} className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === "EXCEL" ? "bg-white border border-border/50 border-b-0 text-primary shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>Excel Import</button>
        <button onClick={() => setActiveTab("FEED")} className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === "FEED" ? "bg-white border border-border/50 border-b-0 text-primary shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>Adatfeed (API)</button>
      </div>

      <div className="glass p-8 rounded-b-2xl rounded-tr-2xl shadow-md border border-border/50 bg-white">
        
        {activeTab === "MANUAL" && (
          <form onSubmit={handleSubmitManual} className="space-y-8">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
              <h4 className="font-bold text-blue-800 mb-1">TEF - Minőségi Követelmények</h4>
              <p className="text-sm text-blue-700">Minden feltöltött terméknek át kell esnie a Minőségi Szűrőn. A Kép, a Vonalkód, a pontos Szállítási méretek és a Részletes leírás kitöltése <strong>kötelező</strong>!</p>
            </div>

            {/* KATEGÓRIA VÁLASZTÓ (HIERARCHIKUS) ÉS RÉGIÓ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border border-gray-200 p-6 rounded-xl">
              <div>
                <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Kategória kiválasztása *</h4>
                <div className="flex flex-col gap-3">
                  {categoryLevels.map((levelOptions, index) => (
                    <select 
                      key={index}
                      value={selectedCatPath[index] || ""} 
                      onChange={(e) => handleCategoryChange(e, index)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none bg-white"
                    >
                      <option value="">Válassz kategóriát...</option>
                      {levelOptions.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Régió kiválasztása *</h4>
                <select 
                  name="regionId"
                  value={formData.regionId} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none bg-white"
                >
                  <option value="">Válassz régiót...</option>
                  {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* ALAPADATOK ÉS ÁRAK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Terméknév *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Vonalkód (EAN/GTIN) *</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} required placeholder="pl. 5991234567890" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alapár (Ft) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Akciós ár (Ft) - opcionális</label>
                <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Termékkép feltöltése *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                  {formData.imageUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={formData.imageUrl} alt="Preview" className="max-h-40 rounded-lg shadow-sm mb-4" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ""}))} className="text-red-500 font-bold text-sm">Kép törlése</button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      <p className="text-sm text-gray-600 font-medium">Húzd ide a képet, vagy kattints a feltöltéshez</p>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {isUploading && <p className="text-blue-500 mt-2 font-bold animate-pulse">Feltöltés folyamatban...</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LEÍRÁSOK */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rövid leírás *</label>
                <div className="bg-white">
                  <JoditEditor 
                    value={formData.shortDescription} 
                    config={{ readonly: false, height: 200, placeholder: "Rövid ismertető..." }}
                    onBlur={(newContent) => setFormData(prev => ({ ...prev, shortDescription: newContent }))} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Részletes leírás (Opcionális)</label>
                <div className="bg-white">
                  <JoditEditor 
                    value={formData.description} 
                    config={{ readonly: false, height: 350, placeholder: "Összetevők, használati útmutató..." }}
                    onBlur={(newContent) => setFormData(prev => ({ ...prev, description: newContent }))} 
                  />
                </div>
              </div>
            </div>

            {/* SZÁLLÍTÁSI ADATOK */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Szállítási Adatok (Kötelező)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Súly (kg) *</label><input type="number" name="weight" value={formData.weight} onChange={handleChange} required step="0.01" min="0" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary outline-none" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Szél. (cm) *</label><input type="number" name="width" value={formData.width} onChange={handleChange} required step="0.1" min="0" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary outline-none" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Mag. (cm) *</label><input type="number" name="height" value={formData.height} onChange={handleChange} required step="0.1" min="0" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary outline-none" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Hossz. (cm) *</label><input type="number" name="length" value={formData.length} onChange={handleChange} required step="0.1" min="0" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary outline-none" /></div>
              </div>
            </div>

            {/* TERMÉK STÁTUSZA ÉS RAKTÁRKEZELÉS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-800 text-white p-6 rounded-xl space-y-4">
                <h4 className="font-bold text-lg mb-2 border-b border-slate-700 pb-2">Termék státusza</h4>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusActive" checked={formData.statusActive} onChange={handleChange} className="w-4 h-4" /> Aktív (megjelenik az oldalon)</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusNotPurchasable" checked={formData.statusNotPurchasable} onChange={handleChange} className="w-4 h-4" /> Nem vásárolható (nincs kosár)</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusAdultOnly" checked={formData.statusAdultOnly} onChange={handleChange} className="w-4 h-4" /> Csak 18 éven felülieknek</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusHidden" checked={formData.statusHidden} onChange={handleChange} className="w-4 h-4" /> Nincs a listában, keresésben</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusGiftOnly" checked={formData.statusGiftOnly} onChange={handleChange} className="w-4 h-4" /> Csak ajándékként vehető meg</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusNew" checked={formData.statusNew} onChange={handleChange} className="w-4 h-4" /> Új (ÚJ felirattal)</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusInquiry" checked={formData.statusInquiry} onChange={handleChange} className="w-4 h-4" /> "Érdeklődjön" felirattal</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusAutoExport" checked={formData.statusAutoExport} onChange={handleChange} className="w-4 h-4" /> Megjelenjen automata exportban</label>
                <label className="flex items-center gap-3"><input type="checkbox" name="statusNoDirectDiscount" checked={formData.statusNoDirectDiscount} onChange={handleChange} className="w-4 h-4" /> Ne legyen közvetlen kedvezmény</label>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800 text-white p-6 rounded-xl space-y-4">
                  <h4 className="font-bold text-lg mb-2 border-b border-slate-700 pb-2">Publikus időszak</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1">Ettől:</label>
                      <input type="datetime-local" name="publicFrom" value={formData.publicFrom} onChange={handleChange} className="w-full text-black px-2 py-1 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Eddig:</label>
                      <input type="datetime-local" name="publicTo" value={formData.publicTo} onChange={handleChange} className="w-full text-black px-2 py-1 rounded" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Ha üresen hagyod, akkor 'Mindig' publikus.</p>
                </div>

                <div className="bg-slate-800 text-white p-6 rounded-xl space-y-4">
                  <h4 className="font-bold text-lg mb-2 border-b border-slate-700 pb-2">Raktárkezelés</h4>
                  <label className="flex items-center gap-3"><input type="checkbox" name="useInventory" checked={formData.useInventory} onChange={handleChange} className="w-4 h-4" /> Használja a raktárkezelést</label>
                  <label className="flex items-center gap-3"><input type="checkbox" name="allowBackorder" checked={formData.allowBackorder} onChange={handleChange} className="w-4 h-4" /> Vásárolható, ha nincs raktáron</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-32">Alacsony készlet:</span>
                    <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-20 text-black px-2 py-1 rounded" />
                    <span className="text-sm">db</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button type="button" onClick={() => setShowPreviewModal(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-8 rounded-xl shadow-sm transition-all text-lg">
                Előnézet
              </button>
              <button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all disabled:opacity-50 text-lg">
                {loading ? "Feldolgozás..." : "Termék Mentése"}
              </button>
            </div>
          </form>
        )}

        {/* EXCEL TAB... */}
        {activeTab === "EXCEL" && (
          <div className="text-center py-10">Tömeges import hamarosan...</div>
        )}

        {/* FEED TAB... */}
        {activeTab === "FEED" && (
          <div className="text-center py-10">Automatikus Feed szinkronizáció hamarosan...</div>
        )}

      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Új Kategória Igénylése</h3>
            <form onSubmit={handleRequestCategory}>
              <div className="mb-4">
                <input type="text" value={categoryRequest.name} onChange={e => setCategoryRequest({...categoryRequest, name: e.target.value})} required placeholder="pl. Kézműves Lekvárok" className="w-full p-3 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg font-bold">Mégse</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Beküldés</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-2xl p-8 shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold">Termék Előnézet</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-black font-bold text-xl">&times;</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden h-80">
                {formData.imageUrl ? <img src={formData.imageUrl} alt="Termékkép" className="object-cover w-full h-full" /> : <p className="text-gray-400">Nincs kép feltöltve</p>}
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-extrabold text-gray-900">{formData.name || "Névtelen Termék"}</h1>
                <div className="flex items-center gap-4">
                  {formData.salePrice ? (
                    <>
                      <span className="text-2xl font-bold text-red-500">{formData.salePrice} Ft</span>
                      <span className="text-lg text-gray-400 line-through">{formData.price} Ft</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">{formData.price || "0"} Ft</span>
                  )}
                </div>
                {formData.statusNew && <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">ÚJ TERMÉK</span>}
                <div className="prose prose-sm mt-4 text-gray-600" dangerouslySetInnerHTML={{ __html: formData.shortDescription || "<i>Nincs rövid leírás megadva.</i>" }} />
              </div>
            </div>
            
            <div className="mt-8 border-t pt-8">
              <h4 className="text-xl font-bold mb-4">Részletes Leírás</h4>
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: formData.description || "<i>Nincs részletes leírás megadva.</i>" }} />
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowPreviewModal(false)} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700">Bezárás és Vissza a Szerkesztéshez</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
