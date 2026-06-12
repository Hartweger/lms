"use client";

import { useState } from "react";
import type { Coupon } from "@/lib/types";

interface Props {
  initialCoupons: Coupon[];
}

interface NewCouponForm {
  code: string;
  amount: string;
  max_uses: string;
  expires_at: string;
}

const emptyForm: NewCouponForm = {
  code: "",
  amount: "",
  max_uses: "",
  expires_at: "",
};

export default function KuponiClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCouponForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          amount: Number(form.amount),
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Greška pri kreiranju kupona.");
        return;
      }
      const { coupon } = await res.json();
      setCoupons((prev) => [coupon, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("sr-RS");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kuponi</h1>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white hover:bg-[#088BAD] transition-colors"
        >
          + Novi kupon
        </button>
      </div>

      {/* Creation form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-[#E8F7FC] rounded-xl p-5 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Novi kupon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Kod
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="npr. LETO2026"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Popust %
              </label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="npr. 20"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max korišćenja{" "}
                <span className="text-gray-400 font-normal">(opciono)</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_uses: e.target.value }))
                }
                placeholder="neograničeno"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Važi do{" "}
                <span className="text-gray-400 font-normal">(opciono)</span>
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] bg-white"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white hover:bg-[#088BAD] transition-colors disabled:opacity-50"
            >
              {creating ? "Kreiranje..." : "Kreiraj kupon"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors"
            >
              Otkaži
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {coupons.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Kod</th>
                <th className="text-left px-6 py-3">Popust</th>
                <th className="text-left px-6 py-3">Iskorišćeno</th>
                <th className="text-left px-6 py-3">Važi do</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((coupon) => {
                const isToggling = togglingId === coupon.id;
                const usageLabel =
                  coupon.max_uses != null
                    ? `${coupon.usage_count} / ${coupon.max_uses}`
                    : `${coupon.usage_count}`;

                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {coupon.amount}%
                    </td>
                    <td className="px-6 py-4 text-gray-600">{usageLabel}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(coupon.expires_at)}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Aktivan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Neaktivan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActive(coupon)}
                        disabled={isToggling}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          coupon.is_active
                            ? "bg-red-50 text-[#F78687] hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {isToggling
                          ? "..."
                          : coupon.is_active
                          ? "Deaktiviraj"
                          : "Aktiviraj"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema kupona.
        </div>
      )}
    </div>
  );
}
