"use client";

import { useState } from "react";
import { format } from "date-fns";

export default function BrandsViewClient({ vendors }: { vendors: any[] }) {
  const [previewVendor, setPreviewVendor] = useState<any | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cégnév</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Márkanév</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Létrehozva</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Márka Státusz</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">UNAS ID</th>
              <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Műveletek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Nincs még egyetlen márkaoldal sem beállítva.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{vendor.companyName}</div>
                    <div className="text-xs text-slate-500">{vendor.user.email}</div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900">
                    {vendor.brandName || "-"}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {format(new Date(vendor.createdAt), "yyyy. MM. dd. HH:mm")}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vendor.brandStatus === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      vendor.brandStatus === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                      vendor.brandStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {vendor.brandStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {vendor.unasPageId || "-"}
                  </td>
                  <td className="py-4 px-6 text-right text-sm font-medium">
                    <button 
                      onClick={() => setPreviewVendor(vendor)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                    >
                      Betekintés
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewVendor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg text-gray-800">
                Betekintés: {previewVendor.brandName || previewVendor.companyName}
              </h2>
              <button onClick={() => setPreviewVendor(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                Bezárás
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 space-y-8">
              {/* List View Preview */}
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Listanézet (Kártya)</h3>
                <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm mx-auto border border-gray-200">
                  <div className="h-48 bg-gray-200 relative">
                    {(previewVendor.coverUrl || previewVendor.draftCoverUrl || previewVendor.logoUrl || previewVendor.draftLogoUrl) ? (
                      <img src={previewVendor.coverUrl || previewVendor.draftCoverUrl || previewVendor.logoUrl || previewVendor.draftLogoUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">Nincs kép</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{previewVendor.brandName || previewVendor.companyName}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {previewVendor.shortDescription || previewVendor.draftShortDescription || <span className="italic text-gray-400">Nincs megadva rövid leírás...</span>}
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
                  {(previewVendor.description || previewVendor.draftDescription) ? (
                    <div 
                      className="prose prose-lg text-gray-800 max-w-none w-full"
                      dangerouslySetInnerHTML={{ __html: previewVendor.description || previewVendor.draftDescription }}
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
