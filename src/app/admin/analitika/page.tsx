import { createAdminClient } from "@/lib/supabase/admin";
import AnalitikaDashboard from "./AnalitikaDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalitika() {
  const supabase = createAdminClient();

  // Supabase returns max 1000 rows per query — paginate to get all
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
  // WooCommerce prodaja zatvorena posle flipa). Mapiraj na wc_orders oblik i spoji —
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

  return <AnalitikaDashboard orders={allOrders} />;
}
