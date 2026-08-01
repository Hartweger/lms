import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Eksplicitni SupabaseClient<Database> tip — ReturnType<typeof createBrowserClient>
// se zbog generika degradira u any, pa klijentski kod ostaje bez provere tipova.
let client: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
