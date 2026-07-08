"use client";

import { useState, useEffect, useCallback } from "react";

interface SyncLog {
  id: string;
  type: string;
  status: string;
  message: string;
  itemCount: number;
  createdAt: string;
}

interface SyncCard {
  key: string;
  icon: string;
  title: string;
  description: string;
  apiEndpoint: string;
}

const syncCards: SyncCard[] = [
  {
    key: "categories",
    icon: "📂",
    title: "Kategóriák",
    description: "UNAS webshop kategóriák szinkronizálása a helyi adatbázisba.",
    apiEndpoint: "/api/admin/sync/categories",
  },
  {
    key: "parameters",
    icon: "🔧",
    title: "Paraméterek / Szűrők",
    description: "Termékparaméterek és szűrők frissítése az UNAS-ból.",
    apiEndpoint: "/api/admin/sync/parameters",
  },
  {
    key: "products",
    icon: "📦",
    title: "Termékek",
    description: "Teljes termékkatalógus szinkronizálása az UNAS webshopból.",
    apiEndpoint: "/api/admin/sync/products",
  },
  {
    key: "orders",
    icon: "🛒",
    title: "Rendelések",
    description: "Új rendelések letöltése és állapotfrissítés az UNAS-ból.",
    apiEndpoint: "/api/admin/sync/orders",
  },
];

interface SyncState {
  loading: boolean;
  result: null | { success: boolean; message: string };
  lastSync: string | null;
}

export default function SyncDashboardPage() {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>(() => {
    const initial: Record<string, SyncState> = {};
    syncCards.forEach((card) => {
      initial[card.key] = { loading: false, result: null, lastSync: null };
    });
    return initial;
  });

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/admin/sync/logs");
      if (!res.ok) throw new Error("Hiba a naplók betöltésekor");
      const data = await res.json();
      setLogs(data);

      // Extract last sync times from logs
      const lastSyncs: Record<string, string> = {};
      const typeMap: Record<string, string> = {
        categories: "categories",
        parameters: "parameters",
        products: "products",
        orders: "orders",
      };
      for (const log of data) {
        const logType = (log.type || "").toLowerCase();
        for (const key of Object.keys(typeMap)) {
          if (logType.includes(key) && !lastSyncs[key] && log.status === "success") {
            lastSyncs[key] = log.createdAt;
          }
        }
      }

      setSyncStates((prev) => {
        const next = { ...prev };
        for (const [key, time] of Object.entries(lastSyncs)) {
          if (next[key]) {
            next[key] = { ...next[key], lastSync: time };
          }
        }
        return next;
      });
    } catch {
      // silently fail
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSync = async (card: SyncCard) => {
    setSyncStates((prev) => ({
      ...prev,
      [card.key]: { ...prev[card.key], loading: true, result: null },
    }));

    try {
      const res = await fetch(card.apiEndpoint, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Szinkronizálási hiba történt");
      }

      setSyncStates((prev) => ({
        ...prev,
        [card.key]: {
          ...prev[card.key],
          loading: false,
          result: { success: true, message: data.message || "Szinkronizálás sikeres!" },
          lastSync: new Date().toISOString(),
        },
      }));

      // Refresh logs after successful sync
      fetchLogs();
    } catch (err: any) {
      setSyncStates((prev) => ({
        ...prev,
        [card.key]: {
          ...prev[card.key],
          loading: false,
          result: { success: false, message: err.message || "Ismeretlen hiba" },
        },
      }));
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Még nem volt szinkronizálva";
    try {
      return new Date(dateStr).toLocaleString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const lower = (status || "").toLowerCase();
    if (lower === "success" || lower === "sikeres") {
      return "bg-green-100 text-green-700";
    }
    if (lower === "error" || lower === "hiba") {
      return "bg-red-100 text-red-700";
    }
    if (lower === "running" || lower === "folyamatban") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const lower = (status || "").toLowerCase();
    if (lower === "success") return "Sikeres";
    if (lower === "error") return "Hiba";
    if (lower === "running") return "Folyamatban";
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Szinkronizáció</h1>
        <p className="text-gray-500 mt-1">UNAS webshop szinkronizáció vezérlőpult</p>
      </div>

      {/* Sync action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {syncCards.map((card) => {
          const state = syncStates[card.key];
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{card.description}</p>
                <div className="text-xs text-gray-400 mb-4">
                  <span className="font-medium">Utolsó szinkron:</span>{" "}
                  {formatDate(state.lastSync)}
                </div>
              </div>

              {/* Result message */}
              {state.result && (
                <div
                  className={`text-sm rounded-lg px-3 py-2 mb-3 ${
                    state.result.success
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {state.result.success ? "✅ " : "❌ "}
                  {state.result.message}
                </div>
              )}

              <button
                onClick={() => handleSync(card)}
                disabled={state.loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  state.loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-blue-700 active:scale-[0.98]"
                }`}
              >
                {state.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-500"></div>
                    Szinkronizálás...
                  </>
                ) : (
                  "Szinkronizálás"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Sync logs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Szinkronizációs napló</h2>
          <p className="text-sm text-gray-500 mt-0.5">Legutóbbi szinkronizációs műveletek</p>
        </div>

        {logsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Még nincs szinkronizációs napló.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Típus</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Státusz</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Üzenet</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Elemek száma</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Időpont</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(log.status)}`}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {log.itemCount != null ? log.itemCount.toLocaleString("hu-HU") : "–"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
