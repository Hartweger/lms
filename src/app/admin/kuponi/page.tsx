import { createAdminClient } from "@/lib/supabase/admin";
import KuponiClient from "./KuponiClient";

export const dynamic = "force-dynamic";

export default async function AdminKuponiPage() {
  const supabase = createAdminClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return <KuponiClient initialCoupons={coupons ?? []} />;
}
