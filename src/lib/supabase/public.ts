import { createClient } from "@supabase/supabase-js";

// Cookie-less anon klijent za JAVNE stranice (magazin/blog) — bez cookies() poziva,
// pa ruta može da bude statička/ISR (revalidate). Čita samo javno-čitljive podatke
// (blog_posts is_published=true kroz anon RLS). NE koristiti za korisničke/gated podatke.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
