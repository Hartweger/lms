import { createAdminClient } from "@/lib/supabase/admin";
import RevenueChart from "./RevenueChart";
import CategoryChart from "./CategoryChart";
import CountryChart from "./CountryChart";

export const dynamic = "force-dynamic";

// ── helpers ────────────────────────────────────────────────────────────────

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

// ── page ───────────────────────────────────────────────────────────────────

export default async function AdminAnalitika() {
  const supabase = createAdminClient();

  // Fetch all orders (we need items JSONB so we can't just aggregate in SQL easily)
  const { data: allOrders } = await supabase
    .from("wc_orders")
    .select(
      "wc_order_id, status, currency, total, payment_method, payment_method_title, customer_email, customer_name, country, items, date_created, date_completed"
    )
    .order("date_created", { ascending: false });

  const orders: WcOrder[] = (allOrders ?? []) as WcOrder[];

  // ── Date helpers ────────────────────────────────────────────────────────
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed

  const startOfThisMonth = new Date(thisYear, thisMonth, 1);
  const startOfLastMonth = new Date(thisYear, thisMonth - 1, 1);
  const endOfLastMonth = new Date(thisYear, thisMonth, 1);
  const startOfSameMonthLastYear = new Date(thisYear - 1, thisMonth, 1);
  const endOfSameMonthLastYear = new Date(thisYear - 1, thisMonth + 1, 1);

  // ── Completed orders ────────────────────────────────────────────────────
  const completed = orders.filter((o) => o.status === "completed");

  const totalRevenue = completed.reduce((s, o) => s + Number(o.total), 0);
  const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;

  // This month
  const thisMonthCompleted = completed.filter(
    (o) => new Date(o.date_created) >= startOfThisMonth
  );
  const thisMonthRevenue = thisMonthCompleted.reduce((s, o) => s + Number(o.total), 0);
  const thisMonthCount = thisMonthCompleted.length;

  // Last month
  const lastMonthCompleted = completed.filter((o) => {
    const d = new Date(o.date_created);
    return d >= startOfLastMonth && d < endOfLastMonth;
  });
  const lastMonthRevenue = lastMonthCompleted.reduce((s, o) => s + Number(o.total), 0);
  const lastMonthCount = lastMonthCompleted.length;

  // Same month last year
  const sameMonthLastYearCompleted = completed.filter((o) => {
    const d = new Date(o.date_created);
    return d >= startOfSameMonthLastYear && d < endOfSameMonthLastYear;
  });
  const sameMonthLastYearRevenue = sameMonthLastYearCompleted.reduce(
    (s, o) => s + Number(o.total),
    0
  );

  const pctVsLastMonth = pct(thisMonthRevenue, lastMonthRevenue);
  const pctVsLastYear = pct(thisMonthRevenue, sameMonthLastYearRevenue);
  const pctCountVsLastMonth = pct(thisMonthCount, lastMonthCount);

  // ── Revenue by month (last 12) ─────────────────────────────────────────
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"];

  const revenueByMonth: { month: string; prihod: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthRevenue = completed
      .filter((o) => {
        const od = new Date(o.date_created);
        return od.getFullYear() === y && od.getMonth() === m;
      })
      .reduce((s, o) => s + Number(o.total), 0);
    revenueByMonth.push({
      month: monthNames[m],
      prihod: monthRevenue,
    });
  }

  // ── Category breakdown ─────────────────────────────────────────────────
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

  // ── Country breakdown ─────────────────────────────────────────────────
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
  const countryData = ostaloValue > 0 ? [...top5, { name: "Ostalo", value: ostaloValue }] : top5;

  // ── Payment methods ────────────────────────────────────────────────────
  const paymentMap: Record<string, number> = {};
  for (const order of orders) {
    const pm = order.payment_method_title || order.payment_method || "Nepoznato";
    paymentMap[pm] = (paymentMap[pm] ?? 0) + 1;
  }
  const totalOrderCount = orders.length;
  const paymentBreakdown = Object.entries(paymentMap)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalOrderCount) * 100) }))
    .sort((a, b) => b.count - a.count);

  // ── Refund rate ────────────────────────────────────────────────────────
  const refundedCount = orders.filter((o) => o.status === "refunded").length;
  const refundRate = totalOrderCount > 0 ? ((refundedCount / totalOrderCount) * 100).toFixed(1) : "0.0";

  // ── Top 10 kurseva ─────────────────────────────────────────────────────
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

  // ── Last 20 orders ────────────────────────────────────────────────────
  const last20 = orders.slice(0, 20);

  // ── Status badge helper ───────────────────────────────────────────────
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

  // ── % change display helper ───────────────────────────────────────────
  function PctBadge({ value }: { value: number | null }) {
    if (value === null) return null;
    const positive = value >= 0;
    return (
      <span className={`text-xs font-medium ${positive ? "text-zelena" : "text-koral"}`}>
        {positive ? "↑" : "↓"} {Math.abs(value)}%
      </span>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Analitika prihoda</h1>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ukupan prihod */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Ukupan prihod</div>
          <div className="text-2xl font-bold text-plava">{fmt(totalRevenue)}</div>
          <div className="text-xs text-gray-400 mt-1">{completed.length} narudžbina</div>
        </div>

        {/* Ovaj mesec */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Ovaj mesec</div>
          <div className="text-2xl font-bold text-plava">{fmt(thisMonthRevenue)}</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {pctVsLastMonth !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs prošli: <PctBadge value={pctVsLastMonth} />
              </span>
            )}
            {pctVsLastYear !== null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                vs god.pre: <PctBadge value={pctVsLastYear} />
              </span>
            )}
          </div>
        </div>

        {/* Prosečna narudžbina */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Prosečna narudžbina</div>
          <div className="text-2xl font-bold text-plava">{fmt(Math.round(avgOrder))}</div>
          <div className="text-xs text-gray-400 mt-1">samo završene</div>
        </div>

        {/* Narudžbine ovaj mesec */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Narudžbine ovaj mesec</div>
          <div className="text-2xl font-bold text-plava">{thisMonthCount}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-400">vs prošli:</span>
            <PctBadge value={pctCountVsLastMonth} />
          </div>
        </div>
      </div>

      {/* ── Revenue chart ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Prihod po mesecima (poslednjih 12)
        </h2>
        <RevenueChart data={revenueByMonth} />
      </div>

      {/* ── Pie charts ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prihod po kategoriji
          </h2>
          <CategoryChart data={categoryData} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prihod po zemlji
          </h2>
          <CountryChart data={countryData} />
        </div>
      </div>

      {/* ── Info cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Način plaćanja */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Način plaćanja
          </h2>
          <div className="space-y-3">
            {paymentBreakdown.map((pm) => (
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
          </div>
        </div>

        {/* Refund stopa */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Refund stopa
          </h2>
          <div className="flex flex-col items-center justify-center py-4">
            <div className={`text-5xl font-bold mb-2 ${Number(refundRate) > 5 ? "text-koral" : "text-zelena"}`}>
              {refundRate}%
            </div>
            <div className="text-sm text-gray-500">
              {refundedCount} refundirano od {totalOrderCount} ukupno
            </div>
            <div className={`mt-3 text-xs px-3 py-1 rounded-full ${Number(refundRate) > 5 ? "bg-koral-light text-koral" : "bg-zelena-light text-zelena"}`}>
              {Number(refundRate) <= 2 ? "Odlično" : Number(refundRate) <= 5 ? "Prihvatljivo" : "Visoka stopa"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 10 kurseva ───────────────────────────────────────────── */}
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
              {top10.map((item, idx) => (
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
              {top10.length === 0 && (
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

      {/* ── Poslednje narudžbine ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Poslednje narudžbine
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
                      <div className="font-medium text-gray-900">{order.customer_name || "—"}</div>
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
        </div>
      </div>
    </div>
  );
}
