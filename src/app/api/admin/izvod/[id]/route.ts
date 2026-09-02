// Šta se radi sa jednom stavkom sa izvoda. Tek ovde ona ulazi u narudžbine ili
// troškove - do tog klika samo stoji i ne utiče ni na jedan izveštaj.
//
// `akcija: "uplata"`   → potvrđuje uplatu za narudžbinu (pristup + mejlovi, isti
//                        put kao dugme „Potvrdi uplatu")
// `akcija: "trosak"`   → pravi red u `expenses` i pamti kategoriju za dobavljača
// `akcija: "zanemari"` → sklanja sa spiska bez ikakvog upisa
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { grantAccessForOrder, GRANT_IN_PROGRESS } from "@/lib/grant-access";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";
import { predlogObrasca } from "@/lib/izvod-uparivanje";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { id } = await params;
  const telo = (await request.json()) as {
    akcija: "uplata" | "trosak" | "zanemari";
    orderId?: string;
    kategorija?: string;
    /** Da li da zapamti kategoriju za ovog dobavljača. Podrazumevano da. */
    zapamti?: boolean;
  };

  const { data: st } = await admin
    .from("bank_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!st) return NextResponse.json({ error: "Stavka nije pronađena." }, { status: 404 });
  if (st.status !== "novo") {
    return NextResponse.json({ error: "Stavka je već obrađena.", status: st.status }, { status: 400 });
  }

  // ---------- Ne knjiži ----------
  if (telo.akcija === "zanemari") {
    await admin.from("bank_transactions").update({ status: "zanemareno" }).eq("id", id);
    return NextResponse.json({ status: "zanemareno" });
  }

  // ---------- Potvrda uplate ----------
  if (telo.akcija === "uplata") {
    if (st.smer !== "priliv") {
      return NextResponse.json({ error: "Odliv ne može da bude uplata." }, { status: 400 });
    }
    if (!telo.orderId) {
      return NextResponse.json({ error: "Nedostaje narudžbina." }, { status: 400 });
    }

    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, payment_status, total")
      .eq("id", telo.orderId)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: "Narudžbina nije pronađena." }, { status: 400 });

    // Već potvrđena narudžbina se ne potvrđuje ponovo, ali se stavka veže za nju -
    // da se uplata ne nudi iznova pri svakom sledećem prolazu.
    if (order.payment_status !== "completed") {
      const ishod = await grantAccessForOrder(order.id);
      if (!ishod.ok) {
        const kod = ishod.error === GRANT_IN_PROGRESS ? 409 : 400;
        return NextResponse.json({ error: ishod.error }, { status: kod });
      }
    }

    await admin
      .from("bank_transactions")
      .update({ status: "upareno", order_id: order.id })
      .eq("id", id);

    return NextResponse.json({ status: "upareno", orderNumber: order.order_number });
  }

  // ---------- U troškove ----------
  if (st.smer !== "odliv") {
    return NextResponse.json({ error: "Priliv ne može da bude trošak." }, { status: 400 });
  }
  const kategorija = telo.kategorija;
  if (!kategorija || !(EXPENSE_CATEGORIES as readonly string[]).includes(kategorija)) {
    return NextResponse.json({ error: "Izaberi kategoriju troška." }, { status: 400 });
  }
  if (!st.datum) {
    return NextResponse.json({ error: "Stavci fali datum - ne može u troškove." }, { status: 400 });
  }

  const naziv = predlogObrasca({ naziv: st.naziv, svrha: st.svrha }) || st.naziv || "Trošak sa izvoda";

  const { data: trosak, error } = await admin
    .from("expenses")
    .insert({
      name: naziv,
      amount: Math.round(Number(st.iznos)),
      category: kategorija,
      expense_date: st.datum,
      recurring: false,
      note: [st.svrha, `izvod ${st.izvod_broj ?? "?"}`].filter(Boolean).join(" · ").slice(0, 500),
    })
    .select("id")
    .single();

  if (error || !trosak) {
    return NextResponse.json(
      { error: `Upis troška nije uspeo: ${error?.message ?? "nepoznato"}` },
      { status: 500 },
    );
  }

  await admin
    .from("bank_transactions")
    .update({ status: "proknjizeno", expense_id: trosak.id })
    .eq("id", id);

  // Zapamti kategoriju za ovog dobavljača, da se sledeći put predloži sama.
  if (telo.zapamti !== false && naziv.length >= 3) {
    await admin
      .from("expense_rules")
      .upsert({ obrazac: naziv, kategorija }, { onConflict: "obrazac" });
  }

  return NextResponse.json({ status: "proknjizeno", naziv, expenseId: trosak.id });
}
