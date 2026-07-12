// Vrati imena/mejlove za zadate user_id-jeve (service-role, zaobilazi RLS).
// Razlog: "Admins can read all profiles" RLS politika čita user_profiles iz same sebe
// (rekurzija), pa direktan browser upit na user_profiles tiho vrati prazno → "Nepoznat".
// Admin-only.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

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
