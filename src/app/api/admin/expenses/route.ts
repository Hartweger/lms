import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { data, error } = await admin.from("expenses").select("*").order("expense_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

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
  if (ended_at && expense_date && ended_at < expense_date) {
    return NextResponse.json({ error: "Datum kraja ne može biti pre datuma početka." }, { status: 400 });
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
