"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedVendor]);

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/vendors");
      if (res.ok) {
        const data = await res.json();
        setAllVendors(data);
      }
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Hiba a termékek betöltésekor");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignVendor = async (productId: string, vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/vendor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      if (res.ok) {
        const vendor = allVendors.find(v => v.id === vendorId);
        setProducts(products.map(p => 
          p.id === productId ? { ...p, vendorId, qualityStatus: "APPROVED", vendor } : p
        ));
      } else {
        alert("Hiba a gyártó hozzárendelésekor.");
      }
    } catch (err) {
      alert("Hálózati hiba.");
    }
  };

  const vendors = Array.from(new Set(products.map(p => p.vendor?.brandName || p.vendor?.companyName).filter(Boolean)));

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    const productName = (product.name || "").toLowerCase();
    const vendorName = (product.vendor?.brandName || product.vendor?.companyName || "").toLowerCase();
    const matchesSearch = productName.includes(searchLower) || vendorName.includes(searchLower);
    
    let matchesVendor = true;
    if (selectedVendor === "UNASSIGNED") {
      matchesVendor = !product.vendorId;
    } else if (selectedVendor) {
      matchesVendor = vendorName === selectedVendor.toLowerCase();
    }

    return matchesSearch && matchesVendor;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Összes Termék Áttekintése</h1>
          <p className="text-gray-500 mt-1">Az összes gyártóhoz tartozó termék listája a rendszerben.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            placeholder="Keresés terméknév vagy gyártó alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <select 
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">Minden gyártó</option>
            <option value="UNASSIGNED" className="text-red-500 font-bold">⚠️ Kiosztatlan termékek</option>
            {vendors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Kép</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Terméknév & Gyártó</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Cikkszám / Vonalkód</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Ár (Ft)</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Állapot</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-500 tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.imageUrl ? (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 p-1">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <span className="text-gray-400 text-xs">Nincs</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{product.name}</div>
                    <div className="mt-1">
                      {product.vendorId ? (
                        <div className="text-xs text-primary font-semibold">
                          Gyártó: {product.vendor?.brandName || product.vendor?.companyName || "Ismeretlen"}
                        </div>
                      ) : (
                        <select 
                          className="text-xs px-2 py-1 border border-red-300 rounded bg-red-50 text-red-700 outline-none cursor-pointer hover:bg-red-100 transition-colors"
                          onChange={(e) => assignVendor(product.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>⚠️ Válassz gyártót...</option>
                          {allVendors.map(v => (
                            <option key={v.id} value={v.id}>{v.brandName || v.companyName}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="font-bold">{product.itemNumber || '-'}</div>
                    <div className="text-xs text-gray-400">{product.barcode || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={product.salePrice ? "line-through text-xs text-gray-400" : "font-bold text-gray-900"}>
                      {product.price?.toLocaleString('hu-HU')} Ft
                    </div>
                    {product.salePrice && (
                      <div className="font-bold text-red-600">{product.salePrice.toLocaleString('hu-HU')} Ft</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      product.qualityStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      product.qualityStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {product.qualityStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button 
                      onClick={() => alert('Termékszerkesztő fejlesztés alatt...')}
                      className="text-primary hover:text-blue-700 hover:underline text-sm font-bold"
                    >
                      Szerkesztés
                    </button>
                  </td>
                </tr>
              ))}
              
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nincs találat a keresési feltételeknek.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Összesen {filteredProducts.length} termék, {currentPage}. oldal / {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Előző
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Következő
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
