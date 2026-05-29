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

  return <AnalitikaDashboard orders={allOrders} />;
}
