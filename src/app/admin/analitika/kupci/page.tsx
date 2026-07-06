import { createAdminClient } from "@/lib/supabase/admin";
import KupciDashboard from "./KupciDashboard";

export const dynamic = "force-dynamic";

export default async function AdminKupci() {
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

  // Narudžbine sa nove platforme (tabela orders) - mapiraj na WcOrder oblik
  // da kupac ima kompletnu istoriju (staru WC + novu) na jednom mestu
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from("orders")
      .select("id, email, full_name, country, items, total, payment_status, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    for (const o of data) {
      allOrders.push({
        wc_order_id: 0,
        status: o.payment_status === "completed" ? "completed" : o.payment_status,
        currency: "RSD",
        total: o.total,
        payment_method: "",
        payment_method_title: "",
        customer_email: o.email,
        customer_name: o.full_name ?? "",
        country: o.country ?? "",
        items: (o.items ?? []).map((i: { title?: string; price?: number }) => ({
          name: i.title ?? "",
          quantity: 1,
          total: String(i.price ?? 0),
          product_id: 0,
        })),
        date_created: o.created_at,
        date_completed: null,
      });
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return <KupciDashboard orders={allOrders} />;
}
