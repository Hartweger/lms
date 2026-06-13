import { createAdminClient } from "@/lib/supabase/admin";
import type { CrmContact } from "@/lib/crm/types";
import CrmListClient from "./CrmListClient";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_contacts")
    .select("*")
    .order("last_interaction_at", { ascending: false })
    .limit(2000);
  return <CrmListClient contacts={(data ?? []) as CrmContact[]} />;
}
