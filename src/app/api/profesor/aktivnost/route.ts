import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const admin = createAdminClient();
  const { data: me } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "professor" && me?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const description = String(body.description ?? "").trim();
  const amount = Math.round(Number(body.amount));
  const activityDate = String(body.activityDate ?? "").trim();
  if (!description) return NextResponse.json({ error: "Opis je obavezan" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) return NextResponse.json({ error: "Datum nije validan" }, { status: 400 });

  const { error } = await admin.from("professor_activities").insert({
    professor_id: user.id,
    description, amount, activity_date: activityDate,
    status: "na_cekanju", submitted_by: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
