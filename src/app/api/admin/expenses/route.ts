import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data, error } = await admin.from("expenses").select("*").order("expense_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { name, category, amount, course_id, expense_date, recurring, ended_at, note } = body;

  if (!name || !category || !expense_date) {
    return NextResponse.json({ error: "Naziv, kategorija i datum su obavezni." }, { status: 400 });
  }
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Nepoznata kategorija." }, { status: 400 });
  }
  const iznos = Math.round(Number(amount));
  if (!Number.isFinite(iznos) || iznos <= 0) {
    return NextResponse.json({ error: "Iznos mora biti broj veći od 0." }, { status: 400 });
  }

  const { data, error } = await admin.from("expenses").insert({
    name, category, amount: iznos,
    course_id: course_id || null,
    expense_date,
    recurring: Boolean(recurring),
    ended_at: ended_at || null,
    note: note || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
