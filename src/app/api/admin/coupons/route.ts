import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { admin };
}

export async function GET() {
  const auth = await getAdminUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: coupons, error } = await auth.admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { code, amount, maxUses, expiresAt } = body;

  const trimmedCode = (code ?? "").trim().toUpperCase();
  if (!trimmedCode) {
    return NextResponse.json({ error: "Kod je obavezan." }, { status: 400 });
  }
  if (amount == null) {
    return NextResponse.json({ error: "Iznos popusta je obavezan." }, { status: 400 });
  }

  const { data: coupon, error } = await auth.admin
    .from("coupons")
    .insert({
      code: trimmedCode,
      amount,
      discount_type: "percent",
      max_uses: maxUses ?? null,
      expires_at: expiresAt ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Kupon sa tim kodom već postoji." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon }, { status: 201 });
}
