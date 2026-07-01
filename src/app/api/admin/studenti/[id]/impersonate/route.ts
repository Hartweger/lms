import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// „Uđi kao đak" — admin dobija jednokratni magic-link za nalog đaka i otvara ga
// u anonimnom prozoru da vidi tačno ono što đak vidi (podrška/debug).
// Ništa se đaku ne šalje mejlom; token se vraća samo pozivaocu (adminu).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: student } = await admin
    .from("user_profiles")
    .select("email")
    .eq("id", id)
    .single();
  if (!student?.email) {
    return NextResponse.json({ error: "Đak nema mejl" }, { status: 404 });
  }

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: student.email,
  });
  if (error || !link?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message || "Neuspelo generisanje linka" },
      { status: 500 }
    );
  }

  // Evidencija (bez posebne tabele — vidi spec).
  console.log(`[impersonate] admin ${user.id} -> đak ${id}`);
  Sentry.addBreadcrumb({
    category: "admin",
    level: "info",
    message: `impersonate: admin ${user.id} -> student ${id}`,
  });

  const origin = new URL(_request.url).origin;
  const url = `${origin}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&next=/dashboard`;

  return NextResponse.json({ url });
}
