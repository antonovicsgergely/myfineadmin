"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// @ts-ignore
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function BrandProfileForm({ vendor }: { vendor: any }) {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialDescription = vendor.draftDescription || vendor.description || "";
  const initialShortDescription = vendor.draftShortDescription || vendor.shortDescription || "";
  const initialCoverUrl = vendor.draftCoverUrl || vendor.coverUrl || "";
  const initialLogoUrl = vendor.draftLogoUrl || vendor.logoUrl || "";
  
  const [savedDescription, setSavedDescription] = useState(initialDescription);
  const [draftDescription, setDraftDescription] = useState(savedDescription);

  const [savedShortDescription, setSavedShortDescription] = useState(initialShortDescription);
  const [draftShortDescription, setDraftShortDescription] = useState(savedShortDescription);

  const [savedCoverUrl, setSavedCoverUrl] = useState(initialCoverUrl);
  const [draftCoverUrl, setDraftCoverUrl] = useState(savedCoverUrl);

  const [savedLogoUrl, setSavedLogoUrl] = useState(initialLogoUrl);
  const [draftLogoUrl, setDraftLogoUrl] = useState(savedLogoUrl);

  const [showPreview, setShowPreview] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const router = useRouter();
  
  const isPending = vendor.brandStatus === "PENDING_APPROVAL";
  const isDirty = draftDescription !== savedDescription || 
                  draftShortDescription !== savedShortDescription || 
                  draftCoverUrl !== savedCoverUrl || 
                  draftLogoUrl !== savedLogoUrl;

  const getStatusBadge = () => {
    switch(vendor.brandStatus) {
      case "PUBLISHED": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Éles / Publikálva</span>;
      case "PENDING_APPROVAL": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Jóváhagyásra vár</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Elutasítva</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Vázlat</span>;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "cover") setUploadingCover(true);
    else setUploadingLogo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (type === "cover") {
          setDraftCoverUrl(data.url);
        } else {
          setDraftLogoUrl(data.url);
        }
      } else {
        alert("Hiba történt a kép feltöltésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    
    if (type === "cover") setUploadingCover(false);
    else setUploadingLogo(false);
  };

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/vendor/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          draftDescription, 
          draftShortDescription, 
          draftLogoUrl, 
          draftCoverUrl 
        })
      });
      if (res.ok) {
        alert("Vázlat mentve!");
        setSavedDescription(draftDescription);
        setSavedShortDescription(draftShortDescription);
        setSavedCoverUrl(draftCoverUrl);
        setSavedLogoUrl(draftLogoUrl);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt a mentés során!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setLoading(false);
  };

  const handleDiscardChanges = () => {
    if (confirm("Biztosan elveted a nem mentett módosításokat?")) {
      setDraftDescription(savedDescription);
      setDraftShortDescription(savedShortDescription);
      setDraftCoverUrl(savedCoverUrl);
      setDraftLogoUrl(savedLogoUrl);
    }
  };

  const handleOptimizeAI = async () => {
    if (!draftDescription || draftDescription === "<p><br></p>") {
      alert("Kérlek először írj be egy alap történetet, amit az AI feljavíthat!");
      return;
    }
    
    setOptimizing(true);
    try {
      const res = await fetch("/api/vendor/brand/ai-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftDescription })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftDescription(data.optimizedText);
      } else {
        alert("Hiba történt az AI hívás során.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setOptimizing(false);
  };

  const handleSubmitApproval = async () => {
    if (isDirty) {
      alert("Kérlek előbb mentsd le a vázlatot a beküldés előtt!");
      return;
    }
    if (!confirm("Biztosan beküldöd publikálásra? Amíg el nem bírálják, nem fogod tudni módosítani a vázlatot.")) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/brand/submit", { method: "POST" });
      if (res.ok) {
        alert("Sikeresen beküldve jóváhagyásra!");
        router.refresh();
      } else {
        alert("Hiba történt a beküldés során.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setSubmitting(false);
  };

  const config = {
    readonly: isPending,
    height: 600,
    language: 'hu',
    uploader: {
      insertImageAsBase64URI: true
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    showXPathInStatusbar: false
  };

  return (
    <div className="space-y-6">
      
      {/* Status Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">Márkaoldal Státusz:</h3>
          {getStatusBadge()}
        </div>
        {vendor.brandStatus === "REJECTED" && vendor.brandRejectReason && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            <strong>Elutasítás oka:</strong> {vendor.brandRejectReason}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setShowPreview(true)}
            disabled={isDirty}
            className="bg-white hover:bg-gray-50 text-primary border border-primary/20 font-semibold py-2 px-6 rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={isDirty ? "Előbb mentsd le a vázlatot az előnézethez!" : ""}
          >
            Előnézet Megtekintése
          </button>
          {!isPending && (
            <button 
              type="button" 
              onClick={handleSubmitApproval}
              disabled={submitting || loading || optimizing || isDirty}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDirty ? "Előbb mentsd le a vázlatot a beküldéshez!" : ""}
            >
              {submitting ? "Beküldés..." : "Publikálásra Küldés"}
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl shadow-sm border border-border/50 overflow-hidden relative">
        {isPending && (
          <div className="bg-orange-50 border-b border-orange-200 p-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-orange-800">Jóváhagyás Folyamatban</p>
              <p className="text-xs text-orange-600">Amíg a központi adminisztrátorok el nem bírálják a módosításaidat, a szerkesztés átmenetileg zárolva van. A tartalmadat továbbra is láthatod, de nem módosíthatod.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveDraft}>
          {/* Toolbar area */}
          <div className="p-6 border-b border-border/50 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Márkaoldal Tartalom Szerkesztő</h2>
              <p className="text-sm text-gray-500">Formázd meg az oldalad, helyezz el képeket, és írd le a márka történetét!</p>
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={handleOptimizeAI}
                disabled={optimizing || isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                {optimizing ? "Optimalizálás..." : "AI Asszisztens"}
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border/50 bg-white">
            {/* Borítókép feltöltés */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Borítókép</label>
              <div className="flex items-start gap-4">
                <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                  {draftCoverUrl ? (
                    <img src={draftCoverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">Nincs borítókép feltöltve</span>
                  )}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">Feltöltés...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <label className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors text-center shadow-sm">
                    Kép kiválasztása
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "cover")}
                      disabled={isPending || uploadingCover}
                    />
                  </label>
                  {draftCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setDraftCoverUrl("")}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Kép törlése
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Logó feltöltés */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Logó / Kisebb kép</label>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative shrink-0">
                  {draftLogoUrl ? (
                    <img src={draftLogoUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center px-2">Nincs logó</span>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                      <span className="text-xs font-bold text-primary">Feltöltés...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full mt-4">
                  <label className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors text-center shadow-sm block">
                    Kép kiválasztása
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logo")}
                      disabled={isPending || uploadingLogo}
                    />
                  </label>
                  {draftLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setDraftLogoUrl("")}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 text-sm font-medium text-center block w-full"
                    >
                      Kép törlése
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-border/50 bg-white">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Rövid leírás (Listanézet az UNAS-ban)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Ez a pár mondatos szöveg fog megjelenni a "Manufaktúrák" oldalon a listában, a logód vagy borítóképed alatt. (Max. 300 karakter)
            </p>
            <textarea 
              value={draftShortDescription}
              onChange={(e) => setDraftShortDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-gray-800"
              rows={3}
              maxLength={300}
              placeholder="Pl.: Családi gazdaságunk generációk óta foglalkozik kézműves sajtok készítésével a Bükk szívében..."
              disabled={isPending}
            />
          </div>

          <div className="p-0 bg-white">
            <JoditEditor
              value={draftDescription}
              config={config}
              onBlur={newContent => setDraftDescription(newContent)}
            />
          </div>

          <div className="p-6 border-t border-border/50 bg-gray-50 flex justify-between items-center mt-10">
            <div className="text-sm text-gray-500">
              {isDirty ? (
                <span className="text-orange-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> Nem mentett módosítások
                </span>
              ) : (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Vázlat mentve
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {isDirty && (
                <button 
                  type="button" 
                  onClick={handleDiscardChanges}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  Módosítások Elvetése
                </button>
              )}
              <button 
                disabled={!isDirty || loading || optimizing} 
                type="submit" 
                className="bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-8 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Mentés..." : "Vázlat Mentése"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-gray-800">Előnézet (Vásárlói Nézet)</h2>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500">
                ✕
              </button>
            </div>
            
            {/* Modal Body - Simple Rich Text Render */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 space-y-8">
              
              {/* List View Preview */}
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Így fog megjelenni a listában (Kártya)</h3>
                <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm mx-auto border border-gray-200">
                  <div className="h-48 bg-gray-200 relative">
                    {(draftCoverUrl || draftLogoUrl) ? (
                      <img src={draftCoverUrl || draftLogoUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">Nincs kép</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{vendor.brandName || vendor.companyName}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {draftShortDescription || <span className="italic text-gray-400">Nincs megadva rövid leírás...</span>}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button className="text-sm font-bold text-primary w-full text-center">Olvass tovább &gt;</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Így fog megjelenni a teljes márkaoldal</h3>
                <div className="max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-lg">
                  <div className="myfine-brand-page" style={{fontFamily: 'inherit', maxWidth: '800px', margin: '0 auto'}}>
                    {draftCoverUrl && (
                      <div className="cover-image" style={{width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px', marginBottom: '20px'}}>
                        <img src={draftCoverUrl} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Cover" />
                      </div>
                    )}
                    <div className="brand-header" style={{display: 'flex', alignItems: 'center', marginBottom: '30px'}}>
                      {draftLogoUrl && (
                        <img src={draftLogoUrl} style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'contain', marginRight: '20px', border: '1px solid #eaeaea', background: '#fff'}} alt="Logo" />
                      )}
                      <h1 style={{margin: 0, fontSize: '2rem', color: '#333'}}>{vendor.brandName || vendor.companyName}</h1>
                    </div>
                    {draftDescription ? (
                      <div 
                        className="brand-description prose prose-lg text-gray-800 max-w-none w-full"
                        style={{lineHeight: '1.6', color: '#444', fontSize: '1.1rem', whiteSpace: 'pre-wrap'}}
                        dangerouslySetInnerHTML={{ __html: draftDescription }}
                      />
                    ) : (
                      <p className="text-gray-500 italic text-center">A márkaoldal még üres.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
