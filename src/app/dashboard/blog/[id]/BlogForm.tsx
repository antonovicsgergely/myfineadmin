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
  
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedContent, setSavedContent] = useState(initialContent);

  const [draftTitle, setDraftTitle] = useState(savedTitle);
  const [draftContent, setDraftContent] = useState(savedContent);
  const [showPreview, setShowPreview] = useState(false);

  const router = useRouter();
  
  const isPending = post.status === "PENDING_APPROVAL";
  const isDirty = draftTitle !== savedTitle || draftContent !== savedContent;

  const getStatusBadge = () => {
    switch(post.status) {
      case "PUBLISHED": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Éles / Publikálva</span>;
      case "PENDING_APPROVAL": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Jóváhagyásra vár</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Elutasítva</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Vázlat</span>;
    }
  };

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/vendor/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftTitle, draftContent })
      });
      if (res.ok) {
        alert("Vázlat mentve!");
        setSavedTitle(draftTitle);
        setSavedContent(draftContent);
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
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Formázd meg a bejegyzésed, szúrj be képeket!</p>
              <button 
                type="button" 
                onClick={handleOptimizeAI}
                disabled={optimizing || isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {optimizing ? "Optimalizálás..." : "AI Asszisztens"}
              </button>
            </div>
          </div>

          <div className="p-0 bg-white">
            <JoditEditor
              value={draftContent}
              config={config}
              onBlur={newContent => setDraftContent(newContent)}
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
              <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 shadow-lg">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
                  {draftTitle}
                </h1>
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
