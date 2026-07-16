import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Admin pregled i odobravanje prijava za stranicu članica (natasahartweger.rs/clanice).
// Tabela clanice ima RLS bez politika - pristup samo kroz service-role ovde.

const EDITABLE = ["ime", "brend", "opis", "usluge", "email", "telefon", "instagram", "linkedin", "web", "foto_url", "sort_order"] as const;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data: clanice, error } = await auth.admin
    .from("clanice")
    .select("*")
    .order("status", { ascending: false }) // pending pre approved
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clanice });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Nedostaje id." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status) {
    if (!["pending", "approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "Nepoznat status." }, { status: 400 });
    }
    update.status = body.status;
    update.approved_at = body.status === "approved" ? new Date().toISOString() : null;
  }

  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key];
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nema izmena." }, { status: 400 });
  }

  const { error } = await auth.admin.from("clanice").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Nedostaje id." }, { status: 400 });

  const { error } = await auth.admin.from("clanice").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
