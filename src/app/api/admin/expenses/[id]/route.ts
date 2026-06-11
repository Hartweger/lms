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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) {
    if (!(EXPENSE_CATEGORIES as readonly string[]).includes(body.category)) {
      return NextResponse.json({ error: "Nepoznata kategorija." }, { status: 400 });
    }
    patch.category = body.category;
  }
  if (body.amount !== undefined) {
    const iznos = Math.round(Number(body.amount));
    if (!Number.isFinite(iznos) || iznos <= 0) {
      return NextResponse.json({ error: "Iznos mora biti broj veći od 0." }, { status: 400 });
    }
    patch.amount = iznos;
  }
  if (body.course_id !== undefined) patch.course_id = body.course_id || null;
  if (body.expense_date !== undefined) patch.expense_date = body.expense_date;
  if (body.recurring !== undefined) patch.recurring = Boolean(body.recurring);
  if (body.ended_at !== undefined) patch.ended_at = body.ended_at || null;
  if (body.note !== undefined) patch.note = body.note || null;

  // Validacija ended_at >= expense_date: proveravamo samo kad su OBA u body-ju.
  // Kad je samo jedan prisutan, ne dohvatamo postojeći red — jednostavnost > pokrivenost
  // (edge-case parcijalni patch pokriva UI validacija i DB constraint ako postoji).
  if (body.ended_at && body.expense_date && body.ended_at < body.expense_date) {
    return NextResponse.json({ error: "Datum kraja ne može biti pre datuma početka." }, { status: 400 });
  }

  const { data, error } = await admin.from("expenses").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { error } = await admin.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
