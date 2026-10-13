// Obaveštenja za privatni kanal Gen II. Svaki minut: pokupi nove poruke,
// grupiši po primaocu, pošalji jedan push - a onome ko nema pretplatu, mejl
// posle 10 minuta nepročitanosti. Nataša (admin) je takođe primalac, ali joj
// mejl ide odmah (prag 0), jer je to njen jedini kanal dok ne uključi push.
// Sva odluka je u lib/gen2-push.ts; ovde je samo čitanje baze i slanje.
import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { posaljiPush } from "@/lib/push";
import { sendGen2NovePorukeEmail } from "@/lib/email";
import {
  uTihimSatima,
  grupisiPoPrimaocu,
  tekstObavestenja,
  trebaMejl,
  type PorukaZaObavestenje,
  type Primalac,
} from "@/lib/gen2-push";

const KANAL_SLUG = "gen2";
const URL_KANALA = "/clanstvo/zajednica";
// Zaštita od preplavljivanja: i da ostane bez nadzora preko vikenda, jedan
// prolaz obrađuje najviše ovoliko poruka.
const MAX_PORUKA = 200;

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sada = new Date();
  // Tiha zona: ne šalje se i ne pomeraju se vodostaji, pa u 7 ujutru ide jedno
  // obaveštenje sa svime propuštenim.
  if (uTihimSatima(sada)) return NextResponse.json({ preskoceno: "tiha-zona" });

  const admin = createAdminClient();

  const kanal = must(
    await admin.from("chat_kanali").select("id, pristup_slug").eq("slug", KANAL_SLUG).maybeSingle(),
    "chat_kanali"
  );
  if (!kanal?.pristup_slug) return NextResponse.json({ preskoceno: "nema-kanala" });

  const kurs = must(
    await admin.from("courses").select("id").eq("slug", kanal.pristup_slug).maybeSingle(),
    "courses"
  );
  if (!kurs) return NextResponse.json({ preskoceno: "nema-kursa" });

  // Ko ima pristup kanalu = važeći course_access na kurs iz pristup_slug + admini.
  const pristupi = must(
    await admin.from("course_access").select("user_id, expires_at").eq("course_id", kurs.id),
    "course_access"
  ) ?? [];
  const admini = must(
    await admin.from("user_profiles").select("id").eq("role", "admin"),
    "user_profiles admini"
  ) ?? [];
  const adminIds = new Set(admini.map((a) => a.id));
  const korisnici = [
    ...new Set([
      ...pristupi
        .filter((p) => !p.expires_at || new Date(p.expires_at) > sada)
        .map((p) => p.user_id),
      ...adminIds,
    ]),
  ];
  if (korisnici.length === 0) return NextResponse.json({ obavesteno: 0 });

  // Prvi put viđen korisnik dobija vodostaj = sada, pa mu se istorija ne šalje unazad.
  must(
    await admin.from("chat_obavestenja").upsert(
      korisnici.map((user_id) => ({
        kanal_id: kanal.id,
        user_id,
        push_do: sada.toISOString(),
        mejl_do: sada.toISOString(),
      })),
      { onConflict: "kanal_id,user_id", ignoreDuplicates: true }
    ),
    "chat_obavestenja upsert"
  );

  const vodostaji = must(
    await admin
      .from("chat_obavestenja")
      .select("user_id, push_do, mejl_do")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_obavestenja"
  ) ?? [];
  if (vodostaji.length === 0) return NextResponse.json({ obavesteno: 0 });

  // Prozor pretrage: od najstarijeg vodostaja bilo kog primaoca, gledajući oba
  // (push_do i mejl_do). Poređenje ide preko Date, ne stringova - timestamptz
  // ume da stigne u više zapisa (+00:00 vs Z), pa leksikografsko poređenje nije
  // pouzdano.
  let najstarijiMs = Infinity;
  for (const v of vodostaji) {
    najstarijiMs = Math.min(najstarijiMs, new Date(v.push_do).getTime(), new Date(v.mejl_do).getTime());
  }
  const najstariji = new Date(najstarijiMs).toISOString();

  const poruke = must(
    await admin
      .from("chat_poruke")
      .select("id, user_id, ime, tekst, created_at")
      .eq("kanal_id", kanal.id)
      .gt("created_at", najstariji)
      .order("created_at", { ascending: true })
      .limit(MAX_PORUKA),
    "chat_poruke"
  ) as PorukaZaObavestenje[];
  if (poruke.length === 0) return NextResponse.json({ obavesteno: 0 });

  const procitano = must(
    await admin
      .from("chat_procitano")
      .select("user_id, last_read_at")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_procitano"
  ) ?? [];
  const citano = new Map(procitano.map((r) => [r.user_id, r.last_read_at]));

  const pretplate = must(
    await admin
      .from("push_pretplate")
      .select("endpoint, user_id, p256dh, auth")
      .in("user_id", korisnici),
    "push_pretplate"
  ) ?? [];
  const poKorisniku = new Map<string, typeof pretplate>();
  for (const s of pretplate) {
    poKorisniku.set(s.user_id, [...(poKorisniku.get(s.user_id) ?? []), s]);
  }

  const primaoci: Primalac[] = vodostaji.map((v) => ({
    user_id: v.user_id,
    push_do: v.push_do,
    mejl_do: v.mejl_do,
    last_read_at: citano.get(v.user_id) ?? null,
  }));

  let poslatoPush = 0;
  let poslatoMejl = 0;
  const mrtve: string[] = [];

  // --- Push ---
  for (const o of grupisiPoPrimaocu(poruke, primaoci, "push_do")) {
    const moje = poKorisniku.get(o.user_id) ?? [];
    const telo = { ...tekstObavestenja(o.poruke), url: URL_KANALA };
    let uspelo = false;
    for (const s of moje) {
      const ishod = await posaljiPush(s, telo);
      if (ishod === "ok") uspelo = true;
      if (ishod === "mrtva") mrtve.push(s.endpoint);
    }
    if (uspelo) poslatoPush++;
    // push_do se pomera i kad push nije poslat - inače bi prozor pretrage rastao
    // beskonačno za nekoga ko se nikad ne pretplati. mejl_do se pomera SAMO ako
    // je push stigao, da mejl-rezerva pokrije baš one koje push nije.
    must(
      await admin
        .from("chat_obavestenja")
        .update(uspelo ? { push_do: o.najnovija, mejl_do: o.najnovija } : { push_do: o.najnovija })
        .eq("kanal_id", kanal.id)
        .eq("user_id", o.user_id),
      "chat_obavestenja push_do"
    );
  }

  if (mrtve.length > 0) {
    await admin.from("push_pretplate").delete().in("endpoint", mrtve);
  }

  // --- Mejl ---
  // Vodostaji su se gore promenili, pa se čitaju ponovo.
  const svezi = must(
    await admin
      .from("chat_obavestenja")
      .select("user_id, push_do, mejl_do")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_obavestenja (mejl)"
  ) ?? [];
  const zaMejl: Primalac[] = svezi.map((v) => ({
    user_id: v.user_id,
    push_do: v.push_do,
    mejl_do: v.mejl_do,
    last_read_at: citano.get(v.user_id) ?? null,
  }));

  for (const o of grupisiPoPrimaocu(poruke, zaMejl, "mejl_do")) {
    const jeAdmin = adminIds.has(o.user_id);
    if (!trebaMejl(o.poruke, sada, jeAdmin ? 0 : undefined)) continue;
    const { data: korisnik } = await admin
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", o.user_id)
      .maybeSingle();
    if (!korisnik?.email) continue;
    const poslednja = o.poruke[o.poruke.length - 1];
    await sendGen2NovePorukeEmail(korisnik.email, korisnik.full_name ?? "", {
      broj: o.poruke.length,
      poslednjeIme: poslednja.ime,
      poslednjiTekst: poslednja.tekst.slice(0, 500),
      zaAdmina: jeAdmin,
    });
    poslatoMejl++;
    must(
      await admin
        .from("chat_obavestenja")
        .update({ mejl_do: o.najnovija })
        .eq("kanal_id", kanal.id)
        .eq("user_id", o.user_id),
      "chat_obavestenja mejl_do"
    );
  }

  return NextResponse.json({
    poruka: poruke.length,
    push: poslatoPush,
    mejl: poslatoMejl,
    mrtvePretplate: mrtve.length,
  });
}

export const GET = withCronLog("gen2-push", cronHandler);
