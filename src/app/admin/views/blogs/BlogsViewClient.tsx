"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function BlogsViewClient({ blogs }: { blogs: any[] }) {
  const [previewBlog, setPreviewBlog] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const router = useRouter();

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`Biztosan módosítod a bejegyzés státuszát erre: ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/admin/blogs/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`Hiba: ${errorData.error}`);
      }
    } catch (err) {
      alert("Hálózati hiba történt.");
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    if (activeTab === "ARCHIVED") {
      return blog.status === "ARCHIVED";
    }
    return blog.status !== "ARCHIVED";
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "ACTIVE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Aktív bejegyzések
        </button>
        <button
          onClick={() => setActiveTab("ARCHIVED")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "ARCHIVED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Archiváltak
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cím</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gyártó</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Létrehozva</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Státusz</th>
                <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nincs megjeleníthető bejegyzés.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{blog.title || blog.draftTitle || "-"}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      {blog.vendor ? (blog.vendor.brandName || blog.vendor.companyName) : "Rendszer (Myfine.hu)"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {format(new Date(blog.createdAt), "yyyy. MM. dd. HH:mm")}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        blog.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        blog.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        blog.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' :
                        blog.status === 'ARCHIVED' ? 'bg-slate-200 text-slate-700' :
                        blog.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-medium flex justify-end gap-2 flex-wrap max-w-xs ml-auto">
                      <button 
                        onClick={() => setPreviewBlog(blog)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                      >
                        Betekintés
                      </button>
                      
                      {blog.status !== "ARCHIVED" && (
                        <a 
                          href={`/admin/views/blogs/${blog.id}`}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                        >
                          Szerkesztés
                        </a>
                      )}

                      {blog.status !== "INACTIVE" && blog.status !== "ARCHIVED" && (
                        <button 
                          onClick={() => handleStatusChange(blog.id, "INACTIVE")}
                          className="text-orange-600 hover:text-orange-900 bg-orange-50 px-3 py-1 rounded-md"
                        >
                          Inaktívvá tétel
                        </button>
                      )}

                      {blog.status !== "ARCHIVED" && (
                        <button 
                          onClick={() => handleStatusChange(blog.id, "ARCHIVED")}
                          className="text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1 rounded-md"
                        >
                          Archiválás
                        </button>
                      )}

                      {(blog.status === "ARCHIVED" || blog.status === "INACTIVE") && (
                        <button 
                          onClick={() => handleStatusChange(blog.id, "DRAFT")}
                          className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md"
                        >
                          Visszaállítás vázlatba
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Preview Modal */}
        {previewBlog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">
                  Betekintés: {previewBlog.title || previewBlog.draftTitle || "Névtelen bejegyzés"}
                </h2>
                <button onClick={() => setPreviewBlog(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                  Bezárás
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
                <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 shadow-lg">
                  <h1 className="text-3xl font-bold mb-6 text-gray-900">{previewBlog.title || previewBlog.draftTitle}</h1>
                  <div className="mb-6 pb-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(previewBlog.vendor ? (previewBlog.vendor.brandName || previewBlog.vendor.companyName) : "Rendszer").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{previewBlog.vendor ? (previewBlog.vendor.brandName || previewBlog.vendor.companyName) : "Rendszer (Myfine.hu)"}</div>
                      <div className="text-xs text-gray-500">{format(new Date(previewBlog.createdAt), "yyyy. MM. dd.")}</div>
                    </div>
                  </div>
                  
                  {(previewBlog.content || previewBlog.draftContent) ? (
                    <div 
                      className="prose prose-lg text-gray-800 max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewBlog.content || previewBlog.draftContent }}
                    />
                  ) : (
                    <p className="text-gray-500 italic text-center py-10">A bejegyzés tartalma üres.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
