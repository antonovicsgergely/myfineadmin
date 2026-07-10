"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// @ts-ignore
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function AdminBlogForm({ post }: { post: any }) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  const [title, setTitle] = useState(post.title || post.draftTitle || "");
  const [content, setContent] = useState(post.content || post.draftContent || "");
  const [coverUrl, setCoverUrl] = useState(post.coverUrl || post.draftCoverUrl || "");
  const [shortDesc, setShortDesc] = useState(post.shortDescription || post.draftShortDescription || "");
  const [uploadingImage, setUploadingImage] = useState(false);

  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Using vendor upload endpoint since it just uploads to Supabase
      const res = await fetch("/api/vendor/upload", {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setCoverUrl(data.url);
      } else {
        alert("Hiba történt a kép feltöltésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setUploadingImage(false);
  };

  const handleSave = async (isPublish: boolean) => {
    if (!title || !content) {
      alert("A cím és a tartalom nem lehet üres!");
      return;
    }
    
    if (isPublish) {
      if (!confirm("Biztosan publikálod a bejegyzést? (Azonnal kikerül az UNAS-ba)")) return;
      setPublishing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: post.id === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          content,
          coverUrl,
          shortDescription: shortDesc,
          status: isPublish ? "PUBLISHED" : "DRAFT"
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(isPublish ? "Sikeresen publikálva!" : "Vázlat mentve!");
        if (post.id === "new") {
          router.push(`/admin/views/blogs/${data.id}`);
        } else {
          router.refresh();
        }
      } else {
        alert(data.error || data.message || "Hiba történt a mentés során!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    
    setLoading(false);
    setPublishing(false);
  };

  const handleToggleStatus = async (newStatus: "PUBLISHED" | "INACTIVE") => {
    if (!confirm(`Biztosan ${newStatus === "INACTIVE" ? "inaktiválod" : "publikálod újra"} a bejegyzést?`)) return;
    
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Státusz sikeresen módosítva!");
        router.refresh();
      } else {
        alert(data.error || data.message || "Hiba történt!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
    setStatusLoading(false);
  };

  const config = {
    readonly: false,
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
      <div className="glass rounded-2xl shadow-sm border border-border/50 overflow-hidden relative">
        <div className="p-6 border-b border-border/50 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-lg">Bejegyzés Szerkesztése</h2>
          {post.id !== "new" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 mr-2">Jelenlegi Státusz: <strong className="text-gray-900">{post.status}</strong></span>
              {post.status === "PUBLISHED" ? (
                <button 
                  type="button" 
                  onClick={() => handleToggleStatus("INACTIVE")}
                  disabled={statusLoading}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-red-200"
                >
                  {statusLoading ? "Folyamatban..." : "Inaktiválás (Elrejtés)"}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => handleToggleStatus("PUBLISHED")}
                  disabled={statusLoading}
                  className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-green-200"
                >
                  {statusLoading ? "Folyamatban..." : "Publikálás"}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Bejegyzés Címe *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ide írd a bejegyzés címét..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 space-y-2">
                <label className="text-sm font-bold text-gray-700">Borítókép</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors h-48 overflow-hidden">
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <div className="relative z-10 bg-white/90 p-2 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm mt-auto w-full">
                        <p className="text-xs font-bold text-gray-700 truncate mb-2">Kép feltöltve</p>
                        <label className="cursor-pointer text-xs bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary-hover inline-block w-full">
                          Módosítás
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400 mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-xs text-gray-500 mb-3 px-2">Ajánlott méret: 800x600px vagy nagyobb</p>
                      <label className="cursor-pointer text-xs font-bold bg-gray-100 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                        {uploadingImage ? "Feltöltés..." : "Kép kiválasztása"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700 flex justify-between">
                  <span>Rövid leírás (Bevezető)</span>
                  <span className="text-xs font-normal text-gray-500">{shortDesc?.length || 0} / 250 karakter</span>
                </label>
                <textarea 
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 h-48 resize-none"
                  placeholder="2-3 mondatos figyelemfelkeltő leírás..."
                  maxLength={250}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Tartalom</label>
              <JoditEditor
                value={content}
                config={config}
                onBlur={(newContent: string) => setContent(newContent)}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-gray-50 flex justify-end gap-3 mt-10">
          <button 
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading || publishing} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Mentés..." : "Vázlat Mentése"}
          </button>
          <button 
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading || publishing} 
            className="bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-8 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {publishing ? "Publikálás..." : "Mentés és Publikálás"}
          </button>
        </div>
      </div>
    </div>
  );
}
