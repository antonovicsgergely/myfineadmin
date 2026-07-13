"use client";

import { useEffect, useState } from "react";

export default function BlogApprovalsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/approvals/blogs");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAction = async (postId: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason) {
      alert("Kérlek adj meg egy indoklást az elutasításhoz!");
      return;
    }
    if (!confirm(`Biztosan ${action === "APPROVE" ? "elfogadod" : "elutasítod"}?`)) return;

    try {
      const res = await fetch("/api/admin/approvals/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action, rejectReason })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || (action === "APPROVE" ? "Sikeresen publikálva!" : "Elutasítva."));
        setPreviewPost(null);
        setIsRejecting(false);
        setRejectReason("");
        fetchPosts();
      } else {
        alert(data.error || data.message || "Hiba történt.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Blogposzt Jóváhagyások</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Jelenleg nincs elbírálásra váró blogbejegyzés.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cím</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gyártó</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{post.draftTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.vendor?.brandName || post.vendor?.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.updatedAt).toLocaleDateString("hu-HU")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setPreviewPost(post)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md font-bold"
                    >
                      Előnézet és Bírálat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header with Actions */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  Cím: {previewPost.draftTitle}
                </h2>
                <p className="text-sm text-gray-500">Szerző: {previewPost.vendor?.brandName || previewPost.vendor?.companyName}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewPost(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                  Bezárás
                </button>
                <button 
                  onClick={() => setIsRejecting(true)} 
                  className="px-4 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-bold"
                >
                  Elutasítás
                </button>
                <button 
                  onClick={() => handleAction(previewPost.id, "APPROVE")} 
                  className="px-6 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-sm"
                >
                  Publikálás Jóváhagyása
                </button>
              </div>
            </div>
            
            {/* Reject Form */}
            {isRejecting && (
              <div className="p-4 bg-red-50 border-b border-red-100">
                <label className="block text-sm font-bold text-red-800 mb-2">Elutasítás oka (A gyártó ezt fogja látni):</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 border border-red-300 rounded mb-2"
                  rows={2}
                ></textarea>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(previewPost.id, "REJECT")} className="bg-red-600 text-white px-4 py-1 rounded text-sm font-bold">Végleges Elutasítás</button>
                  <button onClick={() => setIsRejecting(false)} className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm">Mégse</button>
                </div>
              </div>
            )}

            {/* Modal Body - Render */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-lg">
                {/* Title */}
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
                  {previewPost.draftTitle}
                </h1>
                
                {/* Cover Image */}
                {previewPost.draftCoverUrl && (
                  <img 
                    src={previewPost.draftCoverUrl} 
                    alt="Cover" 
                    className="w-full max-h-[450px] object-cover rounded-xl mb-6" 
                  />
                )}
                
                {/* Short Description */}
                {previewPost.draftShortDescription && (
                  <div className="text-lg font-medium italic text-gray-700 mb-6">
                    {previewPost.draftShortDescription}
                  </div>
                )}

                {/* Author and Date */}
                <div className="text-sm text-gray-500 mb-8 pb-4 border-b border-gray-100">
                  Írta: <strong className="text-gray-700">{previewPost.vendor?.brandName || previewPost.vendor?.companyName}</strong> | {new Date(previewPost.updatedAt).toLocaleDateString("hu-HU")}
                </div>

                {/* Content */}
                {previewPost.draftContent ? (
                  <div 
                    className="prose prose-lg text-gray-800 max-w-none w-full"
                    dangerouslySetInnerHTML={{ __html: previewPost.draftContent }}
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
