// Postavljanje PIN-a sa hvala strane, posle gost-kupovine članstva: roditelj
// je tek platio, dete je upravo nastalo sa pin_hash = NULL, a prijavu (magic
// link) još nije prošao - pa se umesto sesije kao dokaz koristi orderId.
//
// Zašto je to dovoljno: orders.id je gen_random_uuid() (neizvodljiv, nije
// redni broj) i do njega dolazi samo kupac, kroz bankin 303 lanac na svoju
// hvala stranu. Uz to ruta radi ISKLJUČIVO dok je pin_hash NULL: jednom
// postavljen PIN se ovuda više nikad ne menja (za to postoji „Novi PIN" u
// panelu, iza prave prijave), pa ukraden orderId kasnije ne vredi ništa.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { napraviPinOtisak, pinJeIspravan, slabPin } from "@/lib/zack/pin";
import { smePostavljanjePina } from "@/lib/zack/gost";
import { jeUuid } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(request: Request) {
  // Ista kočnica kao na drugim javnim rutama - scrypt otisak nije besplatan.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimit(`zack-gost-pin:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return greska("Previše pokušaja. Sačekaj par minuta pa pokušaj ponovo.", 429);
  }

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  const { orderId, pin } = (telo ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !jeUuid(orderId)) {
    return greska("Nema takve porudžbine", 404);
  }
  if (typeof pin !== "string" || !pinJeIspravan(pin)) {
    return greska("PIN mora imati tačno četiri cifre.", 400);
  }
  if (slabPin(pin)) {
    return greska("Ovaj PIN je lako pogoditi. Izaberi cifre koje nisu sve iste ni u nizu.", 400);
  }

  try {
    const sb = createAdminClient();
    const { data: order, error: orderGreska } = await sb
      .from("orders")
      .select("id, payment_status, items")
      .eq("id", orderId)
      .maybeSingle();
    if (orderGreska) throw new Error(`Ne mogu da pročitam porudžbinu: ${orderGreska.message}`);
    // Nepostojeća porudžbina i porudžbina koja nije zack daju ISTI odgovor -
    // po ovoj ruti se ne sme ispipavati šta u tabeli postoji.
    const stavka = order && Array.isArray(order.items)
      ? (order.items[0] as { dete_id?: string; course_slug?: string } | undefined)
      : undefined;
    const deteId = stavka?.dete_id ?? null;
    if (!order || !deteId) return greska("Nema takve porudžbine", 404);

    const { data: dete, error: deteGreska } = await sb
      .from("zack_deca")
      .select("id, pin_hash")
      .eq("id", deteId)
      .maybeSingle();
    if (deteGreska) throw new Error(`Ne mogu da pročitam dete: ${deteGreska.message}`);
    if (!dete) return greska("Nema takve porudžbine", 404);

    if (!smePostavljanjePina({ paymentStatus: order.payment_status, deteId, pinHash: dete.pin_hash })) {
      // Već postavljen (ili naplata još nije potvrđena): obrazac se više ne
      // nudi, promena ide kroz „Novi PIN" u roditeljskom panelu.
      return greska("PIN je već postavljen. Ako hoćeš drugi, promeni ga u roditeljskom panelu.", 409);
    }

    const pinHash = await napraviPinOtisak(pin);
    // Uslov .is("pin_hash", null) i U SAMOM UPDATE-u: dva istovremena zahteva
    // ne mogu oba da prođu - drugi ne pogodi nijedan red i dobije 409.
    const { data: upisano, error: upisGreska } = await sb
      .from("zack_deca")
      .update({ pin_hash: pinHash })
      .eq("id", dete.id)
      .is("pin_hash", null)
      .select("id");
    if (upisGreska) throw new Error(`Ne mogu da upišem PIN: ${upisGreska.message}`);
    if (!upisano || upisano.length === 0) {
      return greska("PIN je već postavljen. Ako hoćeš drugi, promeni ga u roditeljskom panelu.", 409);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zack/gost/pin]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
