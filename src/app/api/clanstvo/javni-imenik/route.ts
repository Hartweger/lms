// Opt-in za javni imenik na natasahartweger.rs/clanice: NH članica bira da
// njena kartica bude istaknuta. Kartica ide u postojeću clanice tabelu
// (service-role only), status 'pending' - Nataša odobrava u admin/clanice
// kao i sve ostale. Opt-out gasi samo NH oznaku, kartica ostaje - javni
// imenik je besplatan i nezavisan od članstva.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jeAktivnaClanica } from "@/lib/clanstvo";
import { sendNhKarticaAdminEmail } from "@/lib/email";

type ClaniceStatus = "pending" | "approved" | "rejected";

// Escapuje % i _ (specijalni znaci u Postgres LIKE/ILIKE) i backslash (escape
// karakter) tako da se ilike ponaša kao case-insensitive poređenje celog
// stringa, a ne kao pattern. Mejlovi iz organske prijave nisu normalizovani
// na mala slova pri upisu (natasahartweger.rs/api/clanice/prijava čuva onako
// kako je uneto), pa .eq na lowercase nije pouzdan - ilike sa escape-om je
// robusnije rešenje.
function escapeZaIlike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Normalizuje Instagram vrednost iz profila u čist handle: skida vodeći '@',
// a ako je vrednost puna URL (instagram.com/... ili bilo koja http(s) veza),
// izvlači poslednji segment putanje kao handle.
function instagramHandle(v: string): string {
  let s = v.trim();
  const m = s.match(/instagram\.com\/([^/?#]+)/i);
  if (m) {
    s = m[1];
  } else if (/^https?:\/\//i.test(s)) {
    s = s.replace(/\/+$/, "").split("/").pop() || s;
  }
  if (s.startsWith("@")) s = s.slice(1);
  return s;
}

// Zajednička provera za GET i POST: prijavljen korisnik + aktivno NH članstvo.
async function proveriPristup() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { greska: NextResponse.json({ error: "Prijavi se." }, { status: 401 }) } as const;
  }

  const aktivna = await jeAktivnaClanica(supabase, user.id);
  if (!aktivna) {
    return { greska: NextResponse.json({ error: "Samo za aktivne članice." }, { status: 403 }) } as const;
  }

  return { user } as const;
}

export async function GET() {
  const pristup = await proveriPristup();
  if ("greska" in pristup) return pristup.greska;

  const admin = createAdminClient();
  const { data: red } = await admin
    .from("clanice")
    .select("status, nh_membership")
    .eq("user_id", pristup.user.id)
    .maybeSingle();

  return NextResponse.json({
    prikazano: !!red && red.nh_membership,
    status: (red?.status as ClaniceStatus | undefined) ?? null,
  });
}

export async function POST(request: Request) {
  const pristup = await proveriPristup();
  if ("greska" in pristup) return pristup.greska;
  const { user } = pristup;

  const body = await request.json().catch(() => null);
  const zeli = body?.zeli;
  if (typeof zeli !== "boolean") {
    return NextResponse.json({ error: "Nedostaje 'zeli' (boolean)." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profil } = await admin
    .from("member_profiles")
    .select("ime, delatnost, bio, instagram, web")
    .eq("user_id", user.id)
    .maybeSingle();

  if (zeli && (!profil || !profil.ime)) {
    return NextResponse.json({ error: "Prvo popuni i sačuvaj profil." }, { status: 400 });
  }

  const { data: postojeca } = await admin
    .from("clanice")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  let status: ClaniceStatus | null = (postojeca?.status as ClaniceStatus | undefined) ?? null;

  if (postojeca) {
    // Već ima karticu (odobrenu, na čekanju ili odbijenu) - samo se menja NH oznaka,
    // kartica i njen status ostaju kakvi jesu.
    const { error: updateErr } = await admin
      .from("clanice")
      .update({ nh_membership: zeli })
      .eq("id", postojeca.id);
    if (updateErr) {
      console.error("[javni-imenik] izmena NH oznake pala:", updateErr);
      return NextResponse.json({ error: "Greška pri čuvanju. Pokušaj ponovo." }, { status: 500 });
    }
  } else if (zeli) {
    // Nema kartice po user_id-u. Pre nego što napravimo novu, proveravamo da li
    // već postoji organska prijava (sa natasahartweger.rs/clanice, user_id NULL)
    // sa istim mejlom - članica se mogla prijaviti pre nego što je napravila
    // platformski nalog. Ako postoji, preuzimamo tu karticu (njen sadržaj i
    // status ostaju netaknuti, ne šaljemo admin mejl jer je već organski
    // odobrena ili na čekanju) umesto da pravimo duplikat.
    let organska: { id: string; status: ClaniceStatus } | null = null;
    if (user.email) {
      const { data: nadjena, error: pretragaErr } = await admin
        .from("clanice")
        .select("id, status")
        .is("user_id", null)
        .ilike("email", escapeZaIlike(user.email))
        .maybeSingle();
      if (pretragaErr) {
        console.error("[javni-imenik] pretraga organske kartice pala:", pretragaErr);
        return NextResponse.json({ error: "Greška pri čuvanju. Pokušaj ponovo." }, { status: 500 });
      }
      organska = nadjena as { id: string; status: ClaniceStatus } | null;
    }

    if (organska) {
      const { error: preuzmiErr } = await admin
        .from("clanice")
        .update({ user_id: user.id, nh_membership: zeli })
        .eq("id", organska.id);
      if (preuzmiErr) {
        console.error("[javni-imenik] preuzimanje organske kartice palo:", preuzmiErr);
        return NextResponse.json({ error: "Greška pri čuvanju. Pokušaj ponovo." }, { status: 500 });
      }
      status = organska.status;
    } else {
      // Nema ni organske kartice - pravimo novu, na čekanju odobrenja, iz
      // podataka koje je članica već popunila u svom profilu.
      const handle = profil!.instagram ? instagramHandle(profil!.instagram) : "";
      const { error: insertErr } = await admin.from("clanice").insert({
        status: "pending",
        nh_membership: true,
        user_id: user.id,
        ime: profil!.ime,
        brend: profil!.delatnost || null,
        opis: profil!.bio || "",
        instagram: handle ? `https://www.instagram.com/${encodeURIComponent(handle)}` : null,
        web: profil!.web || null,
        email: user.email,
        usluge: [],
      });
      if (insertErr) {
        if (insertErr.code === "23505") {
          // Unique index (migracija 078) je uhvatio duplo slanje (race - dva
          // paralelna zahteva). Tretiramo kao uspeh radi idempotentnosti:
          // učitamo trenutno stanje reda umesto da vraćamo grešku korisnici
          // koja je samo dvaput kliknula.
          const { data: ponovljeno } = await admin
            .from("clanice")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();
          status = (ponovljeno?.status as ClaniceStatus | undefined) ?? "pending";
        } else {
          console.error("[javni-imenik] upis nove kartice pao:", insertErr);
          return NextResponse.json({ error: "Greška pri čuvanju. Pokušaj ponovo." }, { status: 500 });
        }
      } else {
        status = "pending";

        // Best-effort - neuspeh slanja mejla ne sme da obori zahtev.
        try {
          await sendNhKarticaAdminEmail({ ime: profil!.ime, email: user.email ?? "" });
        } catch (e) {
          console.error("[javni-imenik] slanje admin notifikacije palo:", e);
        }
      }
    }
  }
  // Nema kartice i zeli=false -> nema šta da se radi.

  return NextResponse.json({ ok: true, prikazano: zeli, status: status ?? "pending" });
}
