"use client";

import { useEffect, useState } from "react";

export default function BrandApprovalsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVendor, setPreviewVendor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/approvals/brands");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAction = async (vendorId: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason) {
      alert("Kérlek adj meg egy indoklást az elutasításhoz!");
      return;
    }
    if (!confirm(`Biztosan ${action === "APPROVE" ? "elfogadod" : "elutasítod"}?`)) return;

    try {
      const res = await fetch("/api/admin/approvals/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, action, rejectReason })
      });
      if (res.ok) {
        alert(action === "APPROVE" ? "Sikeresen publikálva!" : "Elutasítva.");
        setPreviewVendor(null);
        setIsRejecting(false);
        setRejectReason("");
        fetchVendors();
      } else {
        alert("Hiba történt.");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Márkaoldal Jóváhagyások</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {vendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Jelenleg nincs elbírálásra váró márkaoldal.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gyártó</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vendor.brandName || vendor.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.user?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(vendor.updatedAt).toLocaleDateString("hu-HU")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setPreviewVendor(vendor)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
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
      {previewVendor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header with Actions */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-gray-800">
                Előnézet: {previewVendor.brandName || previewVendor.companyName}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setPreviewVendor(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                  Bezárás
                </button>
                <button 
                  onClick={() => setIsRejecting(true)} 
                  className="px-4 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-bold"
                >
                  Elutasítás
                </button>
                <button 
                  onClick={() => handleAction(previewVendor.id, "APPROVE")} 
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
                  <button onClick={() => handleAction(previewVendor.id, "REJECT")} className="bg-red-600 text-white px-4 py-1 rounded text-sm font-bold">Végleges Elutasítás</button>
                  <button onClick={() => setIsRejecting(false)} className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm">Mégse</button>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 space-y-8">
              
              {/* List View Preview */}
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Listanézet (Kártya) előnézete</h3>
                <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm mx-auto border border-gray-200">
                  <div className="h-48 bg-gray-200 relative">
                    {(previewVendor.draftCoverUrl || previewVendor.coverUrl || previewVendor.draftLogoUrl || previewVendor.logoUrl) ? (
                      <img src={previewVendor.draftCoverUrl || previewVendor.coverUrl || previewVendor.draftLogoUrl || previewVendor.logoUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">Nincs kép</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{previewVendor.brandName || previewVendor.companyName}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {previewVendor.draftShortDescription || <span className="italic text-gray-400">Nincs megadva rövid leírás...</span>}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button className="text-sm font-bold text-primary w-full text-center">Olvass tovább &gt;</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Page Preview */}
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Teljes Márkaoldal</h3>
                <div className="max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-lg">
                  {previewVendor.draftDescription ? (
                    <div 
                      className="prose prose-lg text-gray-800 max-w-none w-full"
                      dangerouslySetInnerHTML={{ __html: previewVendor.draftDescription }}
                    />
                  ) : (
                    <p className="text-gray-500 italic text-center">A márkaoldal még üres.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
