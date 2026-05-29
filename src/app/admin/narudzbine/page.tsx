import { createAdminClient } from "@/lib/supabase/admin";
import NarudzbineClient from "./NarudzbineClient";

export const dynamic = "force-dynamic";

export default async function AdminNarudzbinePage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, price")
    .eq("is_purchasable", true)
    .order("title");

  return <NarudzbineClient initialOrders={orders ?? []} courses={courses ?? []} />;
}
