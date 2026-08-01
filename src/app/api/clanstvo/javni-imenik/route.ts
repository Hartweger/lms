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
    await admin.from("clanice").update({ nh_membership: zeli }).eq("id", postojeca.id);
  } else if (zeli) {
    // Nema kartice, a članica želi da bude prikazana - pravimo novu, na čekanju
    // odobrenja, iz podataka koje je već popunila u svom profilu.
    await admin.from("clanice").insert({
      status: "pending",
      nh_membership: true,
      user_id: user.id,
      ime: profil!.ime,
      brend: profil!.delatnost || null,
      opis: profil!.bio || "",
      instagram: profil!.instagram ? `https://www.instagram.com/${profil!.instagram}` : null,
      web: profil!.web || null,
      email: user.email,
      usluge: [],
    });
    status = "pending";

    // Best-effort - neuspeh slanja mejla ne sme da obori zahtev.
    try {
      await sendNhKarticaAdminEmail({ ime: profil!.ime, email: user.email ?? "" });
    } catch (e) {
      console.error("[javni-imenik] slanje admin notifikacije palo:", e);
    }
  }
  // Nema kartice i zeli=false -> nema šta da se radi.

  return NextResponse.json({ ok: true, prikazano: zeli, status: status ?? "pending" });
}
