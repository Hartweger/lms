import { createAdminClient } from "@/lib/supabase/admin";
import ZackClient from "./ZackClient";

export const dynamic = "force-dynamic";

export default async function AdminZackPage() {
  const supabase = createAdminClient();
  const { data: udzbenici } = await supabase
    .from("zack_udzbenici")
    .select("id, izdavac, naziv, razred")
    .order("razred");

  return <ZackClient udzbenici={udzbenici ?? []} />;
}
