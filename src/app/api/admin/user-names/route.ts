// Vrati imena/mejlove za zadate user_id-jeve (service-role, zaobilazi RLS).
// Razlog: "Admins can read all profiles" RLS politika čita user_profiles iz same sebe
// (rekurzija), pa direktan browser upit na user_profiles tiho vrati prazno → "Nepoznat".
// Admin-only.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ names: {} });
  }

  const { data: profs } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", ids);

  const names: Record<string, { full_name: string; email: string }> = {};
  for (const p of profs ?? []) {
    names[p.id as string] = { full_name: (p.full_name as string) ?? "", email: (p.email as string) ?? "" };
  }
  return NextResponse.json({ names });
}
