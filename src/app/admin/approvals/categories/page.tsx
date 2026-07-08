"use client";

import { useEffect, useState } from "react";

export default function CategoryApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/approvals/categories");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason) {
      alert("Kérlek adj meg egy indoklást az elutasításhoz (pl. 'Használd a Lekvárok kategóriát')!");
      return;
    }
    if (!confirm(`Biztosan ${action === "APPROVE" ? "elfogadod és létrehozod" : "elutasítod"} ezt az igénylést?`)) return;

    try {
      const res = await fetch("/api/admin/approvals/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, rejectReason })
      });
      if (res.ok) {
        alert(action === "APPROVE" ? "Kategória/Szűrő sikeresen létrehozva!" : "Igénylés elutasítva.");
        setRejectingId(null);
        setRejectReason("");
        fetchRequests();
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
        <h1 className="text-3xl font-bold text-gray-900">Kategória és Szűrő Igénylések</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Jelenleg nincs elbírálásra váró kategória igénylés.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gyártó</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Típus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kért Név</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Státusz</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Műveletek</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{req.vendor?.brandName || req.vendor?.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-500">{req.type === "CATEGORY" ? "Kategória" : "Szűrő"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{req.requestedName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === "PENDING" && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">Várakozik</span>}
                    {req.status === "APPROVED" && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Elfogadva</span>}
                    {req.status === "REJECTED" && (
                      <div>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Elutasítva</span>
                        <p className="text-xs text-red-500 mt-1 max-w-xs truncate">{req.adminResponse}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {req.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        {rejectingId === req.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="Elutasítás oka..." 
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              className="border p-1 rounded text-sm w-40"
                            />
                            <button onClick={() => handleAction(req.id, "REJECT")} className="bg-red-600 text-white px-3 py-1 rounded">Mentés</button>
                            <button onClick={() => setRejectingId(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded">Mégse</button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => setRejectingId(req.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md font-bold"
                            >
                              Elutasítás
                            </button>
                            <button 
                              onClick={() => handleAction(req.id, "APPROVE")}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md font-bold"
                            >
                              Létrehozás
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
