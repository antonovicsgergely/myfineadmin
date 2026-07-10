"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// @ts-ignore
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function BlogForm({ post }: { post: any }) {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialTitle = post.draftTitle || post.title || "";
  const initialContent = post.draftContent || post.content || "";
  const initialCoverUrl = post.draftCoverUrl || post.coverUrl || "";
  const initialShortDesc = post.draftShortDescription || post.shortDescription || "";
  
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [savedCoverUrl, setSavedCoverUrl] = useState(initialCoverUrl);
  const [savedShortDesc, setSavedShortDesc] = useState(initialShortDesc);

  const [draftTitle, setDraftTitle] = useState(savedTitle);
  const [draftContent, setDraftContent] = useState(savedContent);
  const [draftCoverUrl, setDraftCoverUrl] = useState(savedCoverUrl);
  const [draftShortDesc, setDraftShortDesc] = useState(savedShortDesc);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const router = useRouter();
  
  const isPending = post.status === "PENDING_APPROVAL";
  const isDirty = draftTitle !== savedTitle || draftContent !== savedContent || draftCoverUrl !== savedCoverUrl || draftShortDesc !== savedShortDesc;

  const getStatusBadge = () => {
    switch(post.status) {
      case "PUBLISHED": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Éles / Publikálva</span>;
      case "PENDING_APPROVAL": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Jóváhagyásra vár</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Elutasítva</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Vázlat</span>;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setDraftCoverUrl(data.url);
      } else {
        alert("Hiba történt a kép feltöltésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setUploadingImage(false);
  };

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/vendor/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          draftTitle, 
          draftContent,
          draftCoverUrl,
          draftShortDescription: draftShortDesc
        })
      });
      if (res.ok) {
        alert("Vázlat mentve!");
        setSavedTitle(draftTitle);
        setSavedContent(draftContent);
        setSavedCoverUrl(draftCoverUrl);
        setSavedShortDesc(draftShortDesc);
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
      setDraftTitle(savedTitle);
      setDraftContent(savedContent);
      setDraftCoverUrl(savedCoverUrl);
      setDraftShortDesc(savedShortDesc);
    }
  };

  const handleOptimizeAI = async () => {
    if (!draftContent || draftContent === "<p><br></p>") {
      alert("Kérlek először írj be egy alap bejegyzést, amit az AI feljavíthat!");
      return;
    }
    
    setOptimizing(true);
    try {
      const res = await fetch("/api/vendor/brand/ai-optimize", { // Reusing the same AI endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftContent })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftContent(data.optimizedText);
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
    if (!draftTitle || !draftContent) {
      alert("A cím és a tartalom nem lehet üres beküldéskor!");
      return;
    }
    if (!confirm("Biztosan beküldöd publikálásra? Amíg el nem bírálják, nem fogod tudni módosítani a vázlatot.")) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendor/blog/${post.id}/submit`, { method: "POST" });
      if (res.ok) {
        alert("Sikeresen beküldve jóváhagyásra!");
        router.push("/dashboard/blog");
      } else {
        const err = await res.json();
        alert(err.error || "Hiba történt a beküldés során.");
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
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">Státusz:</h3>
          {getStatusBadge()}
        </div>
        {post.status === "REJECTED" && post.rejectReason && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            <strong>Elutasítás oka:</strong> {post.rejectReason}
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
            Előnézet
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
              <p className="text-xs text-orange-600">Amíg a központi adminisztrátorok el nem bírálják a módosításaidat, a szerkesztés átmenetileg zárolva van.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveDraft}>
          <div className="p-6 border-b border-border/50 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Bejegyzés Címe</label>
              <input 
                type="text" 
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                disabled={isPending}
                className="w-full text-xl font-bold p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:bg-gray-100"
                placeholder="Írd ide a blogposztod címét..."
              />
            </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="col-span-1 space-y-2">
                <label className="text-sm font-bold text-gray-700">Borítókép</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors h-48 overflow-hidden">
                  {draftCoverUrl ? (
                    <>
                      <img src={draftCoverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <div className="relative z-10 bg-white/90 p-2 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm mt-auto w-full">
                        <p className="text-xs font-bold text-gray-700 truncate mb-2">Kép feltöltve</p>
                        {!isPending && (
                          <label className="cursor-pointer text-xs bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary-hover inline-block w-full">
                            Módosítás
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                          </label>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400 mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-xs text-gray-500 mb-3 px-2">Ajánlott méret: 800x600px vagy nagyobb</p>
                      {!isPending && (
                        <label className="cursor-pointer text-xs font-bold bg-gray-100 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                          {uploadingImage ? "Feltöltés..." : "Kép kiválasztása"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 flex justify-between">
                  <span>Rövid leírás (Bevezető)</span>
                  <span className="text-xs font-normal text-gray-500">{draftShortDesc?.length || 0} / 250 karakter</span>
                </label>
                <textarea 
                  value={draftShortDesc}
                  onChange={(e) => setDraftShortDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 h-48 resize-none"
                  placeholder="2-3 mondatos figyelemfelkeltő leírás, ami a listanézetekben fog megjelenni a kép mellett..."
                  disabled={isPending}
                  maxLength={250}
                />
              </div>
            </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-gray-700">Tartalom</label>
              {!isPending && (
                <button 
                  type="button" 
                  onClick={handleOptimizeAI}
                  disabled={optimizing}
                  className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                >
                  {optimizing ? "Optimalizálás folyamatban..." : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.5 1.5c-1.5 4.805-3.883 9.305-7.584 12.185a16.477 16.477 0 01-4.601 2.455c-.2.083-.418.015-.551-.157l-1.025-1.332a.75.75 0 01.127-1.01l1.45-1.16zm-5.462 8.017a.75.75 0 00-.549-1.39l-2.023.633a.75.75 0 00-.472 1.107l1.042 1.636a.75.75 0 001.39-.55l-.633-2.023 1.245-.39v.003l-.001.984zm11.75-8.257l.001-1.077c0-.414-.336-.75-.75-.75h-1.078c-.287.97-.66 1.905-1.11 2.793h1.86a.75.75 0 00.75-.75v-1.859c-.888.45-1.823.823-2.793 1.11v1.077c0 .414.336.75.75.75h1.078c.287-.97.66-1.905 1.11-2.793v-1.078c0-.414-.336-.75-.75-.75h-1.86c.888-.45 1.823-.823 2.793-1.11v1.859c0 .414.336.75.75.75h1.078c.287.97.66 1.905 1.11 2.793z" clipRule="evenodd" />
                      </svg>
                      AI Szövegjavítás
                    </>
                  )}
                </button>
              )}
            </div>
            <JoditEditor
              value={draftContent}
              config={config}
              onBlur={(newContent: string) => setDraftContent(newContent)}
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

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-gray-800">Előnézet</h2>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 shadow-lg mt-8 mb-8">
                {draftCoverUrl && (
                  <div className="w-full h-80 rounded-2xl overflow-hidden mb-8 shadow-sm">
                    <img src={draftCoverUrl} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
                  {draftTitle}
                </h1>

                {draftShortDesc && (
                  <div className="mb-8 p-6 bg-gray-50 border-l-4 border-primary rounded-r-xl">
                    <p className="text-xl font-medium text-gray-700 italic leading-relaxed">
                      {draftShortDesc}
                    </p>
                  </div>
                )}

                {draftContent ? (
                  <div 
                    className="prose prose-lg text-gray-800 max-w-none w-full"
                    dangerouslySetInnerHTML={{ __html: draftContent }}
                  />
                ) : (
                  <p className="text-gray-500 italic text-center">A bejegyzés még üres.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
