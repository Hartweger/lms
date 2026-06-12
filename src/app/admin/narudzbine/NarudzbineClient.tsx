"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";
import { orderTotals, orderFiscalStatus, canDeleteOrder, pendingPaymentState } from "@/lib/order-utils";

type Filter = "sve" | "na-cekanju" | "potvrdjene";

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface Props {
  initialOrders: Order[];
  courses: CourseOption[];
}

export default function NarudzbineClient({ initialOrders, courses }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<Filter>("sve");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPayment, setNewPayment] = useState("uplatnica");
  const [newMarkPaid, setNewMarkPaid] = useState(false);
  const [newFiscalize, setNewFiscalize] = useState(false);
  const [newSendEmail, setNewSendEmail] = useState(true);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [sendingPay, setSendingPay] = useState<string | null>(null);
  const [sentPay, setSentPay] = useState<string | null>(null);

  function handleCourseChange(courseId: string) {
    setNewCourseId(courseId);
    const course = courses.find((c) => c.id === courseId);
    if (course) setNewAmount(String(course.price));
  }

  async function createOrder() {
    setNewLoading(true);
    setNewError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          courseId: newCourseId,
          totalAmount: Number(newAmount),
          paymentMethod: newPayment,
          markAsPaid: newMarkPaid,
          fiscalize: newMarkPaid && newFiscalize,
          sendPaymentEmail: newSendEmail && !newMarkPaid,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNewError(json.error ?? "Greška pri kreiranju narudžbine.");
        return;
      }
      setOrders((prev) => [json.order, ...prev]);
      setShowNewForm(false);
      setNewEmail("");
      setNewCourseId("");
      setNewAmount("");
      setNewPayment("uplatnica");
      setNewMarkPaid(false);
      setNewFiscalize(false);
    } catch {
      setNewError("Greška na serveru.");
    } finally {
      setNewLoading(false);
    }
  }

  async function sendPayment(orderId: string) {
    setSendingPay(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-payment`, { method: "POST" });
      if (res.ok) { setSentPay(orderId); setTimeout(() => setSentPay((p) => (p === orderId ? null : p)), 3000); }
    } finally {
      setSendingPay(null);
    }
  }

  const pendingCount = orders.filter((o) => o.payment_status === "pending").length;
  const totals = orderTotals(orders);

  async function deleteOrder(orderId: string) {
    setDeleting(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setDeleting(null);
      setDeleteId(null);
    }
  }

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

  async function reFiscalize(orderId: string) {
    setLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fiscalize`, {
        method: "POST",
      });
      if (res.ok) {
        const { order: updated } = await res.json().catch(() => ({ order: null }));
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  fiscalized_at: updated?.fiscalized_at ?? o.fiscalized_at,
                  fiscal_pdf_url: updated?.fiscal_pdf_url ?? o.fiscal_pdf_url,
                  fiscal_referent_number:
                    updated?.fiscal_referent_number ?? o.fiscal_referent_number,
                }
              : o
          )
        );
      } else {
        const { error } = await res.json().catch(() => ({ error: String(res.status) }));
        alert(`Fiskalizacija nije uspela: ${error}`);
      }
    } finally {
      setLoading(null);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Narudžbine</h1>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <span className="text-gray-500">{orders.length} ukupno</span>
            <span className="text-green-600 font-medium">
              Potvrđeno: {totals.confirmed.toLocaleString("sr-RS")} RSD
            </span>
            <span className="text-yellow-600 font-medium">
              Na čekanju: {totals.pending.toLocaleString("sr-RS")} RSD
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-plava text-white hover:bg-plava-dark transition-colors"
          >
            + Nova narudžbina
          </button>
        </div>
      </div>

      {/* New order form */}
      {showNewForm && (
        <div className="bg-plava-light rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova narudžbina</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email kupca
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="korisnik@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurs
              </label>
              <select
                value={newCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              >
                <option value="">— Izaberi kurs —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.price.toLocaleString("sr-RS")} RSD)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iznos RSD
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Način plaćanja
              </label>
              <select
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              >
                <option value="uplatnica">Uplatnica</option>
                <option value="paypal">PayPal</option>
                <option value="kartica">Kartica</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newMarkPaid}
                onChange={(e) => setNewMarkPaid(e.target.checked)}
                className="rounded border-gray-300 text-plava focus:ring-plava"
              />
              <span className="text-sm text-gray-700">
                Označi odmah kao plaćeno (daje pristup kursu)
              </span>
            </label>
            {newMarkPaid && (
              <label className="flex items-center gap-2 cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={newFiscalize}
                  onChange={(e) => setNewFiscalize(e.target.checked)}
                  className="rounded border-gray-300 text-plava focus:ring-plava"
                />
                <span className="text-sm text-gray-700">
                  Fiskalizuj račun (ne čekiraj ako račun ide preko SEF-a)
                </span>
              </label>
            )}
            <label className={`flex items-center gap-2 ${newMarkPaid ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={newSendEmail && !newMarkPaid}
                disabled={newMarkPaid}
                onChange={(e) => setNewSendEmail(e.target.checked)}
                className="rounded border-gray-300 text-plava focus:ring-plava"
              />
              <span className="text-sm text-gray-700">
                Pošalji kupcu podatke za uplatu (mejl sa {newPayment === "kartica" ? "linkom za karticu" : newPayment === "paypal" ? "PayPal-om" : "uplatnicom i pozivom na broj"})
              </span>
            </label>
          </div>
          {newError && (
            <p className="mt-3 text-sm text-koral font-medium">{newError}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={createOrder}
              disabled={newLoading}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-plava text-white hover:bg-plava-dark transition-colors disabled:opacity-50"
            >
              {newLoading ? "Kreiranje..." : "Kreiraj narudžbinu"}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

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
                const cardState = isPending ? pendingPaymentState(order, Date.now()) : null;
                const isDeleting = deleteId === order.id;
                const isBeingDeleted = deleting === order.id;
                const fiscalState = orderFiscalStatus(order);

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
                    <td className="px-6 py-4 text-gray-700">
                      {courseTitle}
                      {order.professor_name && (
                        <div className="text-gray-400 text-xs mt-0.5">👩‍🏫 {order.professor_name}</div>
                      )}
                    </td>
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
                      {order.payment_status === "cancelled" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500" title="Neplaćena porudžbina — automatski otkazana posle 7 dana">
                          Otkazano
                        </span>
                      ) : isPending ? (
                        cardState === "declined" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600" title="Banka je odbila karticu — kupovina nije prošla">
                            Kartica odbijena
                          </span>
                        ) : cardState === "incomplete" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600" title="Kartica započeta ali nije završena — nije naplaćeno">
                            Nije završeno
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                            Na čekanju
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                            Potvrđena
                          </span>
                          <span
                            className={`text-xs ${order.granted ? "text-green-600" : "text-koral font-medium"}`}
                          >
                            {order.granted ? "pristup ✓" : "pristup ✗"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPending ? (
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
                        ) : isDeleting ? (
                          <span className="flex items-center justify-end gap-1">
                            <span className="text-xs text-gray-500">Obrisati?</span>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              disabled={isBeingDeleted}
                              className="text-xs text-koral font-medium hover:underline disabled:opacity-50"
                            >
                              {isBeingDeleted ? "..." : "Da"}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Ne
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => sendPayment(order.id)}
                              disabled={sendingPay === order.id}
                              title="Pošalji kupcu mejl sa podacima za uplatu"
                              className="text-xs px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium hover:bg-plava hover:text-white transition-colors disabled:opacity-50"
                            >
                              {sendingPay === order.id ? "..." : sentPay === order.id ? "✓ Poslato" : "Pošalji uplatu"}
                            </button>
                            <button
                              onClick={() => setConfirmId(order.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-medium hover:bg-green-100 transition-colors"
                            >
                              Potvrdi uplatu
                            </button>
                            <button
                              onClick={() => setDeleteId(order.id)}
                              className="text-xs text-gray-400 hover:text-koral hover:underline transition-colors"
                            >
                              Obriši
                            </button>
                          </span>
                        )
                      ) : (
                        fiscalState === "ok" && order.fiscal_pdf_url ? (
                          <a
                            href={order.fiscal_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium hover:bg-plava hover:text-white transition-colors"
                          >
                            Račun
                          </a>
                        ) : fiscalState === "missing" ? (
                          <button
                            onClick={() => reFiscalize(order.id)}
                            disabled={loading === order.id}
                            className="text-xs text-koral font-medium hover:underline disabled:opacity-50"
                            title="Narudžbina je potvrđena ali fiskalni račun nije izdat — klikni da fiskalizuješ"
                          >
                            {loading === order.id ? "Fiskalizujem…" : "⚠ Fiskalizuj"}
                          </button>
                        ) : null
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
