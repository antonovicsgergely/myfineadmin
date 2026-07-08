"use client";

import { useEffect, useState } from "react";

export default function ProductApprovalsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/approvals/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAction = async (productId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Biztosan ${action === "APPROVE" ? "elfogadod" : "elutasítod"}?`)) return;

    try {
      const res = await fetch("/api/admin/approvals/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action })
      });
      if (res.ok) {
        alert(action === "APPROVE" ? "Sikeresen elfogadva!" : "Elutasítva.");
        fetchProducts();
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
        <h1 className="text-3xl font-bold text-gray-900">Termék Jóváhagyások (Központi Ellenőrzés)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Jelenleg nincs elbírálásra váró termék.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Termék</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gyártó</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEF Állapot</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">EAN: {product.barcode || "-"} | Ár: {product.price} Ft</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.vendor?.brandName || product.vendor?.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.qualityStatus === "PENDING_APPROVAL" ? (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">Ellenőrzésre Vár</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">{product.qualityStatus}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleAction(product.id, "REJECT")}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md font-bold mr-2"
                    >
                      Elutasítás
                    </button>
                    <button 
                      onClick={() => handleAction(product.id, "APPROVE")}
                      className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md font-bold"
                    >
                      Jóváhagyás
                    </button>
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
