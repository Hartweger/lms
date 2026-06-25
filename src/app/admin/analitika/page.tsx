import { createAdminClient } from "@/lib/supabase/admin";
import AnalitikaDashboard from "./AnalitikaDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalitika() {
  const supabase = createAdminClient();

  // Supabase returns max 1000 rows per query - paginate to get all
  const allOrders: any[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from("wc_orders")
      .select("*")
      .order("date_created", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    allOrders.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Nove uplate (post-flip) žive u `orders` tabeli (wc_orders je zamrznut na ~28.05.2026,
  // WooCommerce prodaja zatvorena posle flipa). Mapiraj na wc_orders oblik i spoji -
  // disjunktni skupovi (wc istorija vs nove uplate), bez dupliranja.
  const { data: newOrders } = await supabase
    .from("orders")
    .select("created_at, payment_status, total, full_name, email, country, items, utm_source");
  for (const o of newOrders ?? []) {
    allOrders.push({
      date_created: o.created_at,
      status: o.payment_status,
      total: o.total,
      customer_name: o.full_name,
      customer_email: o.email,
      country: o.country ?? null,
      items: Array.isArray(o.items) ? o.items : [],
      utm_source: o.utm_source ?? null,
    });
  }

  // NaKI lead-ovi (email + datum) — za atribuciju nezavisnu od last-touch utm-a.
  // NaKI je gornji levak (hvata mejl), pa direktnu prodaju merimo join-om email↔porudžbina,
  // ne preko utm_source (koji last-touch prepiše IG/YT oglas). Vidi memoriju naki_levak_atribucija.
  const nakiLeads: { email: string; created_at: string }[] = [];
  let nakiOffset = 0;
  while (true) {
    const { data } = await supabase
      .from("naki_profiles")
      .select("email, created_at")
      .order("created_at", { ascending: false })
      .range(nakiOffset, nakiOffset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    for (const p of data) {
      if (p.email) nakiLeads.push({ email: p.email, created_at: p.created_at });
    }
    if (data.length < PAGE_SIZE) break;
    nakiOffset += PAGE_SIZE;
  }

  // Dnevni obim NaKI razgovora (zbir po danu) — kontekst za broj lead-ova.
  const { data: nakiUsageRows } = await supabase
    .from("naki_daily_usage")
    .select("day, count");
  const nakiUsage = (nakiUsageRows ?? []).map((u) => ({ day: u.day, count: u.count }));

  return <AnalitikaDashboard orders={allOrders} nakiLeads={nakiLeads} nakiUsage={nakiUsage} />;
}
