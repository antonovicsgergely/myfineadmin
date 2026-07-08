"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VendorBlogList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/vendor/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateNew = async () => {
    try {
      const res = await fetch("/api/vendor/blog", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/blog/${data.id}`);
      } else {
        alert("Hiba történt a létrehozás során.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PUBLISHED": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Éles / Publikálva</span>;
      case "PENDING_APPROVAL": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Jóváhagyásra vár</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Elutasítva</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Vázlat</span>;
    }
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Blog Bejegyzések</h1>
        <button 
          onClick={handleCreateNew}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Új bejegyzés
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Még nem írtál egyetlen blogposztot sem. Kattints az "Új bejegyzés" gombra!
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cím</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Státusz</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utolsó Módosítás</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {post.status === "PUBLISHED" ? post.title : post.draftTitle || "Névtelen vázlat"}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(post.status)}
                    {post.status === "REJECTED" && (
                      <p className="text-xs text-red-500 mt-1 truncate max-w-xs">{post.rejectReason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(post.updatedAt).toLocaleDateString("hu-HU")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/blog/${post.id}`} className="text-primary hover:text-primary-hover font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors inline-block">
                      {post.status === "PENDING_APPROVAL" ? "Megtekintés" : "Szerkesztés"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
