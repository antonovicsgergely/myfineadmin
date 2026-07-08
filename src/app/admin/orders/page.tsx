"use client";

import { useState, useEffect, Fragment } from "react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  manufacturer: string;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  shippingMethod: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Függőben", className: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Feldolgozás alatt", className: "bg-blue-100 text-blue-700" },
  shipped: { label: "Kiszállítva", className: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Kézbesítve", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Törölve", className: "bg-red-100 text-red-700" },
  refunded: { label: "Visszatérítve", className: "bg-orange-100 text-orange-700" },
  completed: { label: "Teljesítve", className: "bg-green-100 text-green-700" },
  new: { label: "Új", className: "bg-cyan-100 text-cyan-700" },
};

function getStatusInfo(status: string) {
  const lower = (status || "").toLowerCase();
  return statusConfig[lower] || { label: status, className: "bg-gray-100 text-gray-700" };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Hiba a rendelések betöltésekor");
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = (order.customerName || "").toLowerCase();
    const orderId = (order.orderId || "").toLowerCase();
    return customerName.includes(searchLower) || orderId.includes(searchLower);
  });

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr: string) => {
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

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString("hu-HU") + " Ft";
  };

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendelések</h1>
          <p className="text-gray-500 mt-1">UNAS webshopból szinkronizált rendelések</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
          Összesen: <span className="font-bold text-gray-900">{orders.length}</span> rendelés
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-center">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            placeholder="Keresés vásárlónév vagy rendelés ID alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider w-8"></th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Rendelés ID</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Vásárló</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Összeg (Ft)</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Fizetés</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Szállítás</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Státusz</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 tracking-wider">Dátum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const statusInfo = getStatusInfo(order.status);
                return (
                  <Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          ▶
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-primary">{order.orderId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.shippingMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>

                    {/* Expanded order items */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <tr>
                        <td colSpan={8} className="px-0 py-0">
                          <div className="bg-blue-50/50 border-y border-blue-100 px-10 py-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">
                              Rendelés tételei ({order.items.length} tétel)
                            </h4>
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-blue-200/50">
                                  <th className="pb-2 pr-4 font-bold text-gray-500">Termék</th>
                                  <th className="pb-2 pr-4 font-bold text-gray-500">Mennyiség</th>
                                  <th className="pb-2 pr-4 font-bold text-gray-500">Egységár</th>
                                  <th className="pb-2 pr-4 font-bold text-gray-500">Összesen</th>
                                  <th className="pb-2 font-bold text-gray-500">Gyártó</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100/50">
                                {order.items.map((item) => (
                                  <tr key={item.id} className="text-gray-700">
                                    <td className="py-2 pr-4 font-medium">{item.productName}</td>
                                    <td className="py-2 pr-4">{item.quantity} db</td>
                                    <td className="py-2 pr-4">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-2 pr-4 font-bold">
                                      {formatCurrency(item.totalPrice)}
                                    </td>
                                    <td className="py-2 text-primary font-semibold">
                                      {item.manufacturer || "–"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isExpanded && (!order.items || order.items.length === 0) && (
                      <tr>
                        <td colSpan={8} className="px-0 py-0">
                          <div className="bg-blue-50/50 border-y border-blue-100 px-10 py-6 text-center text-gray-500 text-sm">
                            Nincsenek tételek ehhez a rendeléshez.
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nincs találat a keresési feltételeknek.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
