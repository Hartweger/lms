// Poklon do 1. septembra 2026: dete dobija ceo zack! BEZ PLAĆANJA I BEZ
// KARTICE. Ruta radi tačno ono što i gost-kupovina, samo bez novca:
//
//   1) proveri da poklon još važi (strana je javna - vrata zatvara SERVER),
//   2) proveri unos ISTOM proverom kao kupovna strana (proveriGostUnos),
//   3) jedan poklon po mejl adresi,
//   4) napravi porudžbinu istog oblika kao gost-kupovina, sa iznosom 0 i
//      poklon-oznakom u stavci,
//   5) pozove grantAccessForOrder - on pravi nalog, roditelja sa pristankom i
//      dete sa kodom, i upisuje fiksan rok.
//
// ZAŠTO JE PORUDŽBINA OD 0 DINARA OVDE BEZBEDNA: grantAccessForOrder ne dira
// ni novac ni fiskalni račun - fiskalizacija (fiscalizeOrder) i pretplata
// (subscription-start) žive isključivo u POZIVAOCU, a ovaj pozivalac nijedno ne
// zove. Zato poklon ne može ništa da naplati: NestPay se ne dodiruje, red u
// subscriptions ne nastaje, pa nema čega ni da se obnovi. Sve što od poklona
// ostaje jeste porudžbina od 0 dinara - trag ko je dobio pristup, kad i čime
// („ne dodeljuj pristup bez traga").
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { generateOrderNumber } from "@/lib/order-utils";
import { grantAccessForOrder } from "@/lib/grant-access";
import { ZACK_CLANSTVO_SLUG } from "@/lib/zack/clanstvo";
import { proveriGostUnos, type ZackGostMeta } from "@/lib/zack/gost";
import { PRISTANAK_TEKST } from "@/lib/zack/pristanak";
import { sendAdminZackPoklonEmail } from "@/lib/email";
import {
  PORUKA_POKLON_ISTEKAO,
  PORUKA_POKLON_VEC_UZET,
  napraviPoklonMeta,
  poklonVazi,
  vecUzetPoklon,
} from "@/lib/zack/poklon";

/** Metod plaćanja poklon-porudžbine. Nijedan cron ga ne prepoznaje kao naplativ
 *  (fiskalizacija i podsetnici gledaju kartica/kartica_rate/uplatnica/paypal),
 *  pa ovakva porudžbina nikad ne uđe ni u naplatu ni u fiskalni tok. */
const METOD_POKLON = "poklon";

/** Udžbenik koji se u poklonu nudi - isto pravilo kao na kupovnoj strani:
 *  samo sadržaj po planu i programu (danas jedini kompletan, peti razred). */
const IZDAVAC_PO_PLANU = "Po planu i programu";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(request: Request) {
  // Javna ruta koja pravi naloge i šalje mejlove na proizvoljnu adresu - bez
  // kočnice je vektor za spam tuđih inboksa. Ista mera kao /api/orders.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipLimit = await rateLimit(`zack-poklon:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    return greska("Previše pokušaja. Sačekaj par minuta pa pokušaj ponovo.", 429);
  }

  // Poklon je vremenski ograničen, a strana je javna i keširana kod posetioca -
  // pa rok mora da se proveri OVDE, ne samo u UI.
  if (!poklonVazi(new Date())) {
    return greska(PORUKA_POKLON_ISTEKAO, 410);
  }

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  const { deteIme, udzbenikId, email, pristanak } = (telo ?? {}) as Record<string, unknown>;

  // ISTA provera kao gost-kupovina - poklon nema svoja pravila o unosu.
  const provera = proveriGostUnos({ ime: deteIme, udzbenikId, email, pristanak });
  if (!provera.ok) return greska(provera.poruka, 400);

  try {
    const sb = createAdminClient();

    // Druga kočnica, po MEJLU: limit po IP-u ne pomaže protiv bombardovanja
    // jedne adrese sa više mreža, a ova ide kroz bazu (preživljava cold start).
    const mejlLimit = await rateLimit(`zack-poklon-mejl:${provera.email}`, {
      max: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!mejlLimit.allowed) {
      return greska("Previše pokušaja za ovu adresu. Sačekaj sat vremena pa probaj ponovo.", 429);
    }

    // Udžbenik mora postojati I biti iz ponude poklona - klijentu se ne veruje
    // da je poslao id iz padajuće liste.
    const { data: udzbenik, error: greskaUdzbenika } = await sb
      .from("zack_udzbenici")
      .select("id, razred")
      .eq("id", provera.udzbenikId)
      .eq("izdavac", IZDAVAC_PO_PLANU)
      .maybeSingle();
    if (greskaUdzbenika) throw new Error(`Ne mogu da proverim razred: ${greskaUdzbenika.message}`);
    if (!udzbenik) return greska("Izaberi razred.", 400);

    // Jedan poklon po mejl adresi. Gleda se trag u porudžbinama, ne dete -
    // porudžbina ostaje i ako roditelj obriše detetov profil.
    // Odgovor NAMERNO ne otkriva ništa o tuđem nalogu (v. PORUKA_POKLON_VEC_UZET).
    // .eq, ne .ilike: mejl je već normalizovan (mala slova), a „_" je dozvoljen
    // znak u adresi i u ilike bi bio džoker - tuđa slična adresa bi lažno
    // ispala kao već uzet poklon.
    const { data: ranije, error: greskaRanijih } = await sb
      .from("orders")
      .select("id, items")
      .eq("email", provera.email);
    if (greskaRanijih) throw new Error(`Ne mogu da proverim ranije poklone: ${greskaRanijih.message}`);
    if (vecUzetPoklon(ranije ?? [])) {
      return greska(PORUKA_POKLON_VEC_UZET, 409);
    }

    const { data: kurs, error: greskaKursa } = await sb
      .from("courses")
      .select("id, title, slug")
      .eq("slug", ZACK_CLANSTVO_SLUG)
      .maybeSingle();
    if (greskaKursa) throw new Error(`Ne mogu da pročitam proizvod: ${greskaKursa.message}`);
    if (!kurs) throw new Error("Proizvod zack! članstva ne postoji");

    // Nalog: isti obrazac kao /api/orders - postojeći se nađe po mejlu, novi
    // nastane potvrđen (roditelj posle ulazi magic linkom, bez lozinke).
    let userId: string;
    const { data: postojeciProfil } = await sb
      .from("user_profiles")
      .select("id")
      .eq("email", provera.email)
      .maybeSingle();
    if (postojeciProfil) {
      userId = postojeciProfil.id;
    } else {
      const { data: noviKorisnik, error: greskaNaloga } = await sb.auth.admin.createUser({
        email: provera.email,
        email_confirm: true,
      });
      if (greskaNaloga || !noviKorisnik.user) {
        throw new Error(`Ne mogu da napravim nalog: ${greskaNaloga?.message ?? "prazan odgovor"}`);
      }
      userId = noviKorisnik.user.id;
      // full_name ostaje prazan: poklon nema ni banku ni račun, pa nema razloga
      // da tražimo ime roditelja - mejl je jedini podatak koji nam treba.
      await sb.from("user_profiles").upsert({
        id: userId,
        email: provera.email,
        full_name: "",
        role: "student",
      });
    }

    const gost: ZackGostMeta = {
      ime: provera.ime,
      udzbenik_id: provera.udzbenikId,
      pristanak_tekst: PRISTANAK_TEKST,
      pristanak_at: new Date().toISOString(),
    };

    const { data: porudzbina, error: greskaPorudzbine } = await sb
      .from("orders")
      .insert({
        user_id: userId,
        email: provera.email,
        full_name: "",
        country: "Srbija",
        items: [
          {
            course_id: kurs.id,
            course_slug: kurs.slug,
            // Ime deteta u nazivu, kao i kod kupovine - admin i roditeljski
            // panel tako vide ZA KOGA je pristup.
            title: `${kurs.title} - ${provera.ime} (poklon)`,
            price: 0,
            // Dete još ne postoji: grant-access ga pravi iz ovog zapisa i tek
            // tada upisuje dete_id. Tekst i vreme pristanka ostaju trajno.
            zack_gost: gost,
            // Trag poklona: po ovoj oznaci se posle vidi ko je dobio pristup
            // bez plaćanja i dokle mu je obećan.
            zack_poklon: napraviPoklonMeta(),
          },
        ],
        subtotal: 0,
        discount: 0,
        total: 0,
        payment_method: METOD_POKLON,
        order_number: await generateOrderNumber(),
      })
      .select("id")
      .single();
    if (greskaPorudzbine || !porudzbina) {
      throw new Error(`Ne mogu da upišem porudžbinu: ${greskaPorudzbine?.message ?? "prazan odgovor"}`);
    }

    // Odavde nadalje sve radi postojeći grant: roditelj sa pristankom, dete sa
    // kodom, rok članstva i mejl. Porudžbina pri neuspehu ostaje pending, pa
    // se vidi da je pokušaj bio - a roditelj dobija mirnu poruku.
    const dodela = await grantAccessForOrder(porudzbina.id);
    if (!dodela.ok) {
      const poruka = `[zack/poklon] pristup nije dodeljen (order ${porudzbina.id}): ${dodela.error}`;
      console.error(poruka);
      Sentry.captureException(new Error(poruka));
      return greska(
        "Profil za dete nije uspeo da se napravi. Piši nam na info@hartweger.rs i rešićemo to za tebe.",
        500,
      );
    }

    // Javka vlasnici - da uživo vidi da li reklama radi. Best-effort: roditelj
    // je već dobio pristup, pa pad ovog mejla NE sme da mu vrati grešku.
    try {
      const { count } = await sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_method", METOD_POKLON)
        .eq("payment_status", "completed");
      await sendAdminZackPoklonEmail({
        imeDeteta: provera.ime,
        razred: udzbenik.razred ?? null,
        email: provera.email,
        ukupno: count ?? 0,
      });
    } catch (e) {
      console.error("[zack/poklon] javka adminu pala:", e);
      Sentry.captureException(e);
    }

    return NextResponse.json({ orderId: porudzbina.id });
  } catch (e) {
    console.error("[zack/poklon]", e);
    Sentry.captureException(e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
