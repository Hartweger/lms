"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";

type Filter = "sve" | "na-cekanju" | "potvrdjene";

interface Props {
  initialOrders: Order[];
}

export default function NarudzbineClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<Filter>("sve");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const pendingCount = orders.filter((o) => o.payment_status === "pending").length;

  const filtered = orders.filter((o) => {
    if (filter === "na-cekanju") return o.payment_status === "pending";
    if (filter === "potvrdjene") return o.payment_status === "completed";
    return true;
  });

  async function confirmPayment(orderId: string) {
    setLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, payment_status: "completed", granted: true } : o
          )
        );
      }
    } finally {
      setLoading(null);
      setConfirmId(null);
    }
  }

  function formatPaymentMethod(method: string) {
    if (method === "paypal") return "PayPal";
    if (method === "swift") return "SWIFT";
    if (method === "ips") return "IPS / Prenos";
    if (method === "rate") return "Rate";
    return method;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Narudžbine</h1>
        <span className="text-sm text-gray-500">{orders.length} ukupno</span>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("sve")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "sve"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Sve
        </button>
        <button
          onClick={() => setFilter("na-cekanju")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === "na-cekanju"
              ? "bg-yellow-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Na čekanju
          {pendingCount > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === "na-cekanju"
                  ? "bg-white text-yellow-600"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("potvrdjene")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "potvrdjene"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Potvrđene
        </button>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">#</th>
                <th className="text-left px-6 py-3">Kupac</th>
                <th className="text-left px-6 py-3">Kurs</th>
                <th className="text-left px-6 py-3">Iznos</th>
                <th className="text-left px-6 py-3">Plaćanje</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Datum</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const courseTitle =
                  (order.items as { title: string }[])[0]?.title ?? "—";
                const isConfirming = confirmId === order.id;
                const isLoading = loading === order.id;
                const isPending = order.payment_status === "pending";

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.full_name || "—"}
                      </div>
                      <div className="text-gray-400 text-xs">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{courseTitle}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.total.toLocaleString("sr-RS")} RSD
                      </div>
                      {order.paypal_note && (
                        <div className="text-gray-400 text-xs truncate max-w-[120px]" title={order.paypal_note}>
                          {order.paypal_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatPaymentMethod(order.payment_method)}
                    </td>
                    <td className="px-6 py-4">
                      {isPending ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                          Na čekanju
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Potvrđena
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPending && (
                        isConfirming ? (
                          <span className="flex items-center justify-end gap-1">
                            <span className="text-xs text-gray-500">Sigurno?</span>
                            <button
                              onClick={() => confirmPayment(order.id)}
                              disabled={isLoading}
                              className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50"
                            >
                              {isLoading ? "..." : "Da"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Ne
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(order.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-medium hover:bg-green-100 transition-colors"
                          >
                            Potvrdi uplatu
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema narudžbina.
        </div>
      )}
    </div>
  );
}
