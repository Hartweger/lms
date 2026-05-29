import { createAdminClient } from "@/lib/supabase/admin";
import AnalitikaDashboard from "./AnalitikaDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalitika() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("wc_orders")
    .select("*")
    .order("date_created", { ascending: false });

  return <AnalitikaDashboard orders={data ?? []} />;
}
