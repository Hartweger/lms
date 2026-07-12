// Zajednička auth provera za API rute: ulogovan korisnik + rola iz user_profiles.
// Zamenjuje isti blok od ~10 redova koji se ponavljao u ~40 ruta.
//
// Upotreba:
//   const auth = await requireAdmin();
//   if (!auth.ok) return auth.response;
//   const { user, admin } = auth; // admin = service-role klijent, spreman za upite
import { NextResponse } from "next/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApiAuth =
  | { ok: true; user: User; admin: SupabaseClient; role: string }
  | { ok: false; response: NextResponse };

const unauthorized = (): ApiAuth => ({
  ok: false,
  response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
});

async function requireRole(allowed: string[]): Promise<ApiAuth> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || !profile || !allowed.includes(profile.role)) return unauthorized();

  return { ok: true, user, admin, role: profile.role };
}

/** Samo admin. */
export function requireAdmin(): Promise<ApiAuth> {
  return requireRole(["admin"]);
}

/** Profesorka ili admin. */
export function requireProfessorOrAdmin(): Promise<ApiAuth> {
  return requireRole(["professor", "admin"]);
}
