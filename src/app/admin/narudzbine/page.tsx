import { createAdminClient } from "@/lib/supabase/admin";
import NarudzbineClient from "./NarudzbineClient";

export const dynamic = "force-dynamic";

export default async function AdminNarudzbinePage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return <NarudzbineClient initialOrders={orders ?? []} />;
}
