"use client";

import { useState, useEffect, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type WcOrder = {
  wc_order_id: number;
  status: string;
  currency: string;
  total: number;
  payment_method: string;
  payment_method_title: string;
  customer_email: string;
  customer_name: string;
  country: string;
  items: Array<{ name: string; quantity: number; total: string; product_id: number }>;
  date_created: string;
  date_completed: string | null;
};

type CustomerRow = {
  email: string;
  name: string;
  country: string;
  orderCount: number;
  totalSpent: number;
  avgOrder: number;
  firstPurchase: Date;
  lastPurchase: Date;
  courses: string[];
};

type SortKey = keyof Pick<
  CustomerRow,
  "name" | "country" | "orderCount" | "totalSpent" | "avgOrder" | "firstPurchase" | "lastPurchase"
>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("sr-Latn-RS") + " din";
}

function shortenCourseName(name: string): string {
  if (!name) return "-";
  // "Video kurs A1" → "Video A1"
  // "Grupni kurs A2.1" → "Grupni A2.1"
  // "Individualni kurs B1" → "Indiv. B1"
  let s = name
    .replace(/video\s+kurs/i, "Video")
    .replace(/grupni\s+kurs/i, "Grupni")
    .replace(/individualni\s+kurs/i, "Indiv.")
    .replace(/paket\s+kurseva/i, "Paket")
    .replace(/paket/i, "Paket");
  // Trim to ~20 chars max if still long
  if (s.length > 22) s = s.slice(0, 20) + "…";
  return s;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main component ───────────────────────────────────────────────────────────

export default function KupciDashboard({ orders }: { orders: WcOrder[] }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");
  const [sortAsc, setSortAsc] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(50);
  }, [search, sortKey, sortAsc]);

  // ── Build customer map ────────────────────────────────────────────────────

  const allCustomers = useMemo<CustomerRow[]>(() => {
    const map = new Map<string, CustomerRow>();

    // We process ALL orders for order count / course list
    // but revenue metrics only count completed orders with total > 0
    for (const order of orders) {
      const email = (order.customer_email ?? "").toLowerCase().trim();
      if (!email) continue;

      const isCompleted = order.status === "completed" && Number(order.total) > 0;
      const orderDate = new Date(order.date_created);

      if (!map.has(email)) {
        map.set(email, {
          email,
          name: order.customer_name || "-",
          country: order.country || "-",
          orderCount: 0,
          totalSpent: 0,
          avgOrder: 0,
          firstPurchase: orderDate,
          lastPurchase: orderDate,
          courses: [],
        });
      }

      const row = map.get(email)!;

      // Keep the most recent non-empty name
      if (!row.name || row.name === "-") {
        row.name = order.customer_name || "-";
      }

      // Track dates across ALL orders
      if (orderDate < row.firstPurchase) row.firstPurchase = orderDate;
      if (orderDate > row.lastPurchase) row.lastPurchase = orderDate;

      // Revenue metrics - only completed orders with total > 0
      if (isCompleted) {
        row.orderCount += 1;
        row.totalSpent += Number(order.total);
      }

      // Collect unique course names from all orders
      if (order.items) {
        for (const item of order.items) {
          const short = shortenCourseName(item.name ?? "");
          if (!row.courses.includes(short)) {
            row.courses.push(short);
          }
        }
      }
    }

    // Compute average order; keep only customers who have at least 1 completed order
    const result: CustomerRow[] = [];
    for (const row of map.values()) {
      if (row.orderCount === 0) continue; // skip zero-spend customers
      row.avgOrder = row.orderCount > 0 ? row.totalSpent / row.orderCount : 0;
      result.push(row);
    }

    return result;
  }, [orders]);

  // ── Stat cards ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalCustomers = allCustomers.length;
    const totalRevenue = allCustomers.reduce((s, c) => s + c.totalSpent, 0);
    const avgSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const repeated = allCustomers.filter((c) => c.orderCount >= 2).length;
    const repeatedPct =
      totalCustomers > 0 ? Math.round((repeated / totalCustomers) * 100) : 0;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // "Novi" = customers whose firstPurchase is this month
    const newThisMonth = allCustomers.filter(
      (c) => c.firstPurchase >= thisMonthStart
    ).length;

    return { totalCustomers, avgSpend, repeated, repeatedPct, newThisMonth };
  }, [allCustomers]);

  // ── Filter + sort ────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    let list = allCustomers;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.email.includes(q) ||
          (c.name ?? "").toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name ?? "").localeCompare(b.name ?? "", "sr");
          break;
        case "country":
          cmp = (a.country ?? "").localeCompare(b.country ?? "", "sr");
          break;
        case "orderCount":
          cmp = a.orderCount - b.orderCount;
          break;
        case "totalSpent":
          cmp = a.totalSpent - b.totalSpent;
          break;
        case "avgOrder":
          cmp = a.avgOrder - b.avgOrder;
          break;
        case "firstPurchase":
          cmp = a.firstPurchase.getTime() - b.firstPurchase.getTime();
          break;
        case "lastPurchase":
          cmp = a.lastPurchase.getTime() - b.lastPurchase.getTime();
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [allCustomers, search, sortKey, sortAsc]);

  const visible = sorted.slice(0, visibleCount);

  // ── Sort header helper ────────────────────────────────────────────────────

  function SortTh({
    label,
    col,
    right = false,
  }: {
    label: string;
    col: SortKey;
    right?: boolean;
  }) {
    const active = sortKey === col;
    return (
      <th
        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${
          right ? "text-right" : "text-left"
        } ${active ? "text-plava" : "text-gray-500"} hover:text-plava`}
        onClick={() => {
          if (active) {
            setSortAsc((prev) => !prev);
          } else {
            setSortKey(col);
            setSortAsc(false);
          }
        }}
      >
        {label}
        {active && (
          <span className="ml-1 opacity-60">{sortAsc ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Kupci</h1>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Ukupno kupaca</div>
          <div className="text-2xl font-bold text-plava">
            {stats.totalCustomers.toLocaleString("sr-Latn-RS")}
          </div>
          <div className="text-xs text-gray-400 mt-1">sa završenim narudžbinama</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Prosečna potrošnja</div>
          <div className="text-2xl font-bold text-plava">
            {fmt(Math.round(stats.avgSpend))}
          </div>
          <div className="text-xs text-gray-400 mt-1">po kupcu</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Ponovljeni kupci</div>
          <div className="text-2xl font-bold text-plava">{stats.repeatedPct}%</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.repeated.toLocaleString("sr-Latn-RS")} kupaca · 2+ kupovina
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Novi ovaj mesec</div>
          <div className="text-2xl font-bold text-plava">
            {stats.newThisMonth.toLocaleString("sr-Latn-RS")}
          </div>
          <div className="text-xs text-gray-400 mt-1">prva kupovina u maju</div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Pretraži po imenu ili emailu..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-plava/30 max-w-md"
        />
        <div className="text-xs text-gray-400">
          Prikazano:{" "}
          <span className="font-medium text-gray-600">
            {Math.min(visibleCount, sorted.length)}
          </span>{" "}
          od{" "}
          <span className="font-medium text-gray-600">{sorted.length}</span> kupaca
          {search && (
            <span>
              {" "}
              · pretraga: &ldquo;{search}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 w-10">
                  #
                </th>
                <SortTh label="Kupac" col="name" />
                <SortTh label="Zemlja" col="country" />
                <SortTh label="Narudžbine" col="orderCount" right />
                <SortTh label="Ukupno potrošeno" col="totalSpent" right />
                <SortTh label="Prosečna" col="avgOrder" right />
                <SortTh label="Prva kupovina" col="firstPurchase" />
                <SortTh label="Poslednja" col="lastPurchase" />
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Kursevi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((customer, idx) => (
                <tr key={customer.email} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 leading-tight">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {customer.country}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">
                    {customer.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {fmt(Math.round(customer.totalSpent))}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {fmt(Math.round(customer.avgOrder))}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {fmtDate(customer.firstPurchase)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {fmtDate(customer.lastPurchase)}
                  </td>
                  <td className="px-4 py-3">
                    <CoursePills courses={customer.courses} />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Nema kupaca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {visibleCount < sorted.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setVisibleCount((n) => n + 50)}
              className="px-5 py-2 rounded-lg bg-plava-light text-plava text-sm font-medium hover:bg-plava hover:text-white transition-colors"
            >
              Prikaži još (
              {Math.min(50, sorted.length - visibleCount)} od{" "}
              {sorted.length - visibleCount} preostalih)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Course pills sub-component ───────────────────────────────────────────────

function CoursePills({ courses }: { courses: string[] }) {
  const MAX = 3;
  const shown = courses.slice(0, MAX);
  const extra = courses.length - MAX;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((c) => (
        <span
          key={c}
          className="text-xs px-2 py-0.5 rounded-full bg-plava-light text-plava whitespace-nowrap"
        >
          {c}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">
          +{extra} više
        </span>
      )}
      {courses.length === 0 && (
        <span className="text-xs text-gray-400">-</span>
      )}
    </div>
  );
}
