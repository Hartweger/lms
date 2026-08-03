// Prvi spisak FAQ stavki se učitava na serveru i predaje klijentskoj
// komponenti kao početno stanje - bez toga bi FaqAdmin morao da fetch-uje u
// useEffect-u pri montiranju (react-hooks/set-state-in-effect).
// Pristup čuva proxy (role=admin za /admin/*).
import { createClient } from "@/lib/supabase/server";
import type { FaqItem } from "@/lib/types";
import FaqAdmin from "./FaqAdmin";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faq_items")
    .select("*")
    .order("order_index", { ascending: true });

  return <FaqAdmin initial={(data ?? []) as FaqItem[]} />;
}
