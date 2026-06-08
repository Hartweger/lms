"use client";

import { useState, useEffect, useMemo } from "react";
import RevenueChart from "./RevenueChart";
import CategoryChart from "./CategoryChart";
import CountryChart from "./CountryChart";

// ── Types ───────────────────────────────────────────────────────────────────

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
  utm_source?: string | null;
};

// Normalizuje sirovi utm_source (instagram/ig/l.instagram.com…) u čist kanal.
function channelOf(src: string | null | undefined): string {
  const s = (src ?? "").toLowerCase();
  if (!s || s === "(none)") return "Nepoznato";
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("facebook") || s === "fb" || s === "m.facebook.com" || s.includes("fb.")) return "Facebook";
  if (s.includes("google") || s.includes("bing") || s.includes("yahoo") || s === "search") return "Google/pretraga";
  if (s.includes("youtube") || s === "yt") return "YouTube";
  if (s.includes("newsletter") || s.includes("mailerlite") || s.includes("email") || s.includes("mail") || s.includes("gm")) return "Newsletter/email";
  if (s.includes("tiktok")) return "TikTok";
  if (s === "(direct)" || s === "direct" || s === "typein") return "Direktno";
  return "Ostalo";
}

type Period =
  | "ovaj-mesec"
  | "prosli-mesec"
  | "poslednja-3"
  | "ova-godina"
  | "prosla-godina"
  | "sve-vreme"
  | "custom";

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("sr-Latn-RS") + " din";
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function categorize(name: string): string {
  if (/video/i.test(name)) return "Video kursevi";
  if (/grupni/i.test(name)) return "Grupni kursevi";
  if (/individualni/i.test(name)) return "Individualni kursevi";
  if (/paket/i.test(name)) return "Paketi";
  return "Ostalo";
}

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return { label: "Završeno", cls: "bg-plava-light text-plava" };
    case "pending":
      return { label: "Na čekanju", cls: "bg-yellow-50 text-yellow-600" };
    case "processing":
      return { label: "U obradi", cls: "bg-blue-50 text-blue-600" };
    case "refunded":
      return { label: "Refundirano", cls: "bg-purple-50 text-purple-600" };
    case "cancelled":
      return { label: "Otkazano", cls: "bg-gray-100 text-gray-500" };
    case "failed":
      return { label: "Neuspešno", cls: "bg-koral-light text-koral" };
    default:
      return { label: status, cls: "bg-gray-100 text-gray-500" };
  }
}

function PctBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-zelena" : "text-koral"}`}>
      {positive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

// Returns [start, end) for the selected period
function getPeriodRange(
  period: Period,
  customFrom: string,
  customTo: string
): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (period) {
    case "ovaj-mesec":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
    case "prosli-mesec":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
    case "poslednja-3":
      return { start: new Date(y, m - 2, 1), end: new Date(y, m + 1, 1) };
    case "ova-godina":
      return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
    case "prosla-godina":
      return { start: new Date(y - 1, 0, 1), end: new Date(y, 0, 1) };
    case "custom": {
      const start = customFrom ? new Date(customFrom) : new Date(0);
      const end = customTo
        ? new Date(new Date(customTo).getTime() + 86400000)
        : new Date(y + 1, 0, 1);
      return { start, end };
    }
    case "sve-vreme":
    default:
      return { start: new Date(0), end: new Date(9999, 0, 1) };
  }
}

// Returns equivalent previous period for comparison
function getPreviousPeriodRange(
  period: Period,
  customFrom: string,
  customTo: string
): { start: Date; end: Date } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (period) {
    case "ovaj-mesec":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
    case "prosli-mesec":
      return { start: new Date(y, m - 2, 1), end: new Date(y, m - 1, 1) };
    case "poslednja-3":
      return { start: new Date(y, m - 5, 1), end: new Date(y, m - 2, 1) };
    case "ova-godina":
      return { start: new Date(y - 1, 0, 1), end: new Date(y, 0, 1) };
    case "prosla-godina":
      return { start: new Date(y - 2, 0, 1), end: new Date(y - 1, 0, 1) };
    case "custom": {
      const { start, end } = getPeriodRange(period, customFrom, customTo);
      const length = end.getTime() - start.getTime();
      return {
        start: new Date(start.getTime() - length),
        end: start,
      };
    }
    case "sve-vreme":
    default:
      return null;
  }
}

// Isti period prošle godine (YoY) — pomeri tekući opseg za godinu unazad.
function getYearAgoRange(
  period: Period,
  customFrom: string,
  customTo: string
): { start: Date; end: Date } | null {
  if (period === "sve-vreme") return null;
  const { start, end } = getPeriodRange(period, customFrom, customTo);
  const s = new Date(start); s.setFullYear(s.getFullYear() - 1);
  const e = new Date(end); e.setFullYear(e.getFullYear() - 1);
  return { start: s, end: e };
}

const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: "ovaj-mesec", label: "Ovaj mesec" },
  { value: "prosli-mesec", label: "Prošli mesec" },
  { value: "poslednja-3", label: "Poslednja 3 meseca" },
  { value: "ova-godina", label: "Ova godina" },
  { value: "prosla-godina", label: "Prošla godina" },
  { value: "sve-vreme", label: "Sve vreme" },
  { value: "custom", label: "Prilagođeno" },
];

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Avg", "Sep", "Okt", "Nov", "Dec",
];

// ── Main component ───────────────────────────────────────────────────────────

export default function AnalitikaDashboard({ orders }: { orders: WcOrder[] }) {
  const [period, setPeriod] = useState<Period>("ovaj-mesec");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const { start, end } = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const previousRange = useMemo(
    () => getPreviousPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.date_created);
      const inPeriod = d >= start && d < end;
      if (!inPeriod) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (o.customer_email ?? "").toLowerCase().includes(q) ||
          (o.customer_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, start, end, search]);

  const previousOrders = useMemo(() => {
    if (!previousRange) return [];
    return orders.filter((o) => {
      const d = new Date(o.date_created);
      return d >= previousRange.start && d < previousRange.end;
    });
  }, [orders, previousRange]);

  // ── Computed metrics ───────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const completed = filteredOrders.filter((o) => o.status === "completed" && Number(o.total) > 0);
    const prevCompleted = previousOrders.filter((o) => o.status === "completed" && Number(o.total) > 0);

    const totalRevenue = completed.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = prevCompleted.reduce((s, o) => s + Number(o.total), 0);
    const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;
    const count = completed.length;
    const prevCount = prevCompleted.length;

    // Revenue by month — last 12 from today
    const now = new Date();
    const y = now.getFullYear();
    const mo = now.getMonth();
    const revenueByMonth: { month: string; prihod: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(y, mo - i, 1);
      const yr = d.getFullYear();
      const mn = d.getMonth();
      const monthRevenue = completed
        .filter((o) => {
          const od = new Date(o.date_created);
          return od.getFullYear() === yr && od.getMonth() === mn;
        })
        .reduce((s, o) => s + Number(o.total), 0);
      revenueByMonth.push({ month: monthNames[mn], prihod: monthRevenue });
    }

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const order of completed) {
      if (!order.items) continue;
      for (const item of order.items) {
        const cat = categorize(item.name ?? "");
        categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(item.total ?? 0);
      }
    }
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Country breakdown
    const countryMap: Record<string, number> = {};
    for (const order of completed) {
      const c = order.country || "Nepoznato";
      countryMap[c] = (countryMap[c] ?? 0) + Number(order.total);
    }
    const countrySorted = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const top5 = countrySorted.slice(0, 5);
    const ostaloValue = countrySorted.slice(5).reduce((s, c) => s + c.value, 0);
    const countryData =
      ostaloValue > 0 ? [...top5, { name: "Ostalo", value: ostaloValue }] : top5;

    // Izvori / kanali (normalizovan utm_source) — prihod po kanalu
    const sourceMap: Record<string, number> = {};
    for (const order of completed) {
      const ch = channelOf(order.utm_source);
      sourceMap[ch] = (sourceMap[ch] ?? 0) + Number(order.total);
    }
    const sourceData = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Payment methods — from all filtered orders (not just completed)
    const paymentMap: Record<string, number> = {};
    for (const order of filteredOrders) {
      const pm = order.payment_method_title || order.payment_method || "Nepoznato";
      paymentMap[pm] = (paymentMap[pm] ?? 0) + 1;
    }
    const totalOrderCount = filteredOrders.length;
    const paymentBreakdown = Object.entries(paymentMap)
      .map(([name, cnt]) => ({
        name,
        count: cnt,
        pct: totalOrderCount > 0 ? Math.round((cnt / totalOrderCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Refund rate
    const refundedCount = filteredOrders.filter((o) => o.status === "refunded").length;
    const refundRate =
      totalOrderCount > 0 ? ((refundedCount / totalOrderCount) * 100).toFixed(1) : "0.0";

    // Top 10 kurseva
    const productMap: Record<string, { name: string; sales: number; revenue: number }> = {};
    for (const order of completed) {
      if (!order.items) continue;
      for (const item of order.items) {
        const key = String(item.product_id ?? item.name);
        if (!productMap[key]) {
          productMap[key] = { name: item.name ?? "—", sales: 0, revenue: 0 };
        }
        productMap[key].sales += item.quantity ?? 1;
        productMap[key].revenue += Number(item.total ?? 0);
      }
    }
    const top10 = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalRevenue,
      prevRevenue,
      avgOrder,
      count,
      prevCount,
      revenueByMonth,
      categoryData,
      countryData,
      sourceData,
      paymentBreakdown,
      totalOrderCount,
      refundedCount,
      refundRate,
      top10,
    };
  }, [filteredOrders, previousOrders]);

  // Last 20 from filtered set (for the table at bottom)
  const last20 = filteredOrders.slice(0, 20);

  const pctRevenue = pct(metrics.totalRevenue, metrics.prevRevenue);
  const pctCount = pct(metrics.count, metrics.prevCount);
  const hasPrev = previousRange !== null;

  // YoY — isti period prošle godine
  const yearAgoRange = useMemo(
    () => getYearAgoRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );
  const yoy = useMemo(() => {
    if (!yearAgoRange) return null;
    const completed = orders.filter((o) => {
      const d = new Date(o.date_created);
      return d >= yearAgoRange.start && d < yearAgoRange.end && o.status === "completed" && Number(o.total) > 0;
    });
    return { revenue: completed.reduce((s, o) => s + Number(o.total), 0), count: completed.length };
  }, [orders, yearAgoRange]);
  const pctRevenueYoY = yoy && yoy.revenue > 0 ? pct(metrics.totalRevenue, yoy.revenue) : null;
  const pctCountYoY = yoy && yoy.count > 0 ? pct(metrics.count, yoy.count) : null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Analitika prihoda</h1>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
        {/* Period pills */}
        <div className="flex flex-wrap gap-2">
          {PERIOD_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                period === value
                  ? "bg-plava-light text-plava"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date inputs + search */}
        <div className="flex flex-wrap items-center gap-3">
          {period === "custom" && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">Od:</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-plava/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">Do:</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-plava/30"
                />
              </div>
            </>
          )}

          <input
            type="text"
            placeholder="Pretraži po imenu ili emailu..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-plava/30 min-w-[260px] flex-1"
          />
        </div>

        {/* Active filter summary */}
        <div className="text-xs text-gray-400">
          Prikazano: <span className="font-medium text-gray-600">{filteredOrders.length}</span> narudžbina
          {search && (
            <span>
              {" "}
              · pretraga: &ldquo;{search}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ukupan prihod */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Prihod (period)</div>
          <div className="text-2xl font-bold text-plava">{fmt(metrics.totalRevenue)}</div>
          <div className="flex flex-col gap-0.5 mt-1">
            {hasPrev && pctRevenue !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs prethodni: <PctBadge value={pctRevenue} />
              </span>
            )}
            {pctRevenueYoY !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs prošla god.: <PctBadge value={pctRevenueYoY} />
              </span>
            )}
          </div>
        </div>

        {/* Broj završenih narudžbina */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Završene narudžbine</div>
          <div className="text-2xl font-bold text-plava">{metrics.count}</div>
          <div className="flex flex-col gap-0.5 mt-1">
            {hasPrev && pctCount !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs prethodni: <PctBadge value={pctCount} />
              </span>
            )}
            {pctCountYoY !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs prošla god.: <PctBadge value={pctCountYoY} />
              </span>
            )}
          </div>
        </div>

        {/* Prosečna narudžbina */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Prosečna narudžbina</div>
          <div className="text-2xl font-bold text-plava">{fmt(Math.round(metrics.avgOrder))}</div>
          <div className="text-xs text-gray-400 mt-1">samo završene</div>
        </div>

        {/* Sve narudžbine u periodu */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Sve narudžbine</div>
          <div className="text-2xl font-bold text-plava">{metrics.totalOrderCount}</div>
          <div className="text-xs text-gray-400 mt-1">svi statusi</div>
        </div>
      </div>

      {/* ── Revenue chart ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Prihod po mesecima (poslednjih 12 u periodu)
        </h2>
        <RevenueChart data={metrics.revenueByMonth} />
      </div>

      {/* ── Pie charts ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prihod po kategoriji
          </h2>
          <CategoryChart data={metrics.categoryData} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prihod po zemlji
          </h2>
          <CountryChart data={metrics.countryData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prihod po izvoru (kanalu)
          </h2>
          <p className="text-xs text-gray-400 mb-2">Instagram, Google, Newsletter, Direktno… (iz WooCommerce atribucije; nove narudžbine = „Nepoznato" dok se ne uvede hvatanje)</p>
          <CountryChart data={metrics.sourceData} />
        </div>
      </div>

      {/* ── Info cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Način plaćanja */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Način plaćanja
          </h2>
          <div className="space-y-3">
            {metrics.paymentBreakdown.map((pm) => (
              <div key={pm.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{pm.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-plava h-2 rounded-full"
                      style={{ width: `${pm.pct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-12 text-right">{pm.count}</span>
                  <span className="text-gray-400 w-8 text-right">{pm.pct}%</span>
                </div>
              </div>
            ))}
            {metrics.paymentBreakdown.length === 0 && (
              <p className="text-sm text-gray-400">Nema podataka.</p>
            )}
          </div>
        </div>

        {/* Refund stopa */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Refund stopa
          </h2>
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`text-5xl font-bold mb-2 ${
                Number(metrics.refundRate) > 5 ? "text-koral" : "text-zelena"
              }`}
            >
              {metrics.refundRate}%
            </div>
            <div className="text-sm text-gray-500">
              {metrics.refundedCount} refundirano od {metrics.totalOrderCount} ukupno
            </div>
            <div
              className={`mt-3 text-xs px-3 py-1 rounded-full ${
                Number(metrics.refundRate) > 5
                  ? "bg-koral-light text-koral"
                  : "bg-zelena-light text-zelena"
              }`}
            >
              {Number(metrics.refundRate) <= 2
                ? "Odlično"
                : Number(metrics.refundRate) <= 5
                ? "Prihvatljivo"
                : "Visoka stopa"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 10 kurseva ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 kurseva
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Kurs</th>
                <th className="text-left px-4 py-3">Kategorija</th>
                <th className="text-right px-4 py-3">Prodaja</th>
                <th className="text-right px-4 py-3">Ukupan prihod</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metrics.top10.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-plava-light text-plava">
                      {categorize(item.name)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.sales}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmt(Math.round(item.revenue))}
                  </td>
                </tr>
              ))}
              {metrics.top10.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nema podataka.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Poslednje narudžbine ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Narudžbine u periodu
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Datum</th>
                <th className="text-left px-4 py-3">Kupac</th>
                <th className="text-right px-4 py-3">Iznos</th>
                <th className="text-left px-4 py-3">Plaćanje</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {last20.map((order) => {
                const badge = statusBadge(order.status);
                return (
                  <tr key={order.wc_order_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(order.date_created).toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {order.customer_name || "—"}
                      </div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {fmt(Number(order.total))}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {order.payment_method_title || order.payment_method || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {last20.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nema narudžbina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 20 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Prikazano prvih 20 od {filteredOrders.length} narudžbina u periodu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
