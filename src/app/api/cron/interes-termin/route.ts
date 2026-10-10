import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { sendTerminOtvoren } from "@/lib/email";
import { formatDaysFull } from "@/lib/groups";
import { kljuc, zaObavestiti, type Lid, type OtvorenaGrupa } from "@/lib/interes-obavestenje";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dnevni cron: javi ljudima koji su ostavili mejl na „Obavesti me za sledeći
 * termin" da je termin njihovog nivoa otvoren.
 *
 * Do 10.2026 ta povratna veza nije postojala - lid bi ostao da čeka, a termin
 * bi se otvorio i prošao bez njega (vidi Konverzaciju B1+, 6 ljudi je čekalo
 * dok je termin bio otvoren nedeljama).
 *
 * Idempotentnost: svako poslato obaveštenje se upisuje kao `crm_interactions`
 * sa `meta.tip = 'interes-obavesten'` i `meta.group_id`, pa se isti par
 * čovek+grupa nikad ne ponavlja. Nova grupa istog nivoa je nova vest i šalje se.
 */
async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const danas = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());

  // 1) otvorene grupe koje tek kreću
  const grupeRows = must(
    await admin
      .from("groups")
      .select("id, level, start_date, days, session_time, purchasable_course_id, professor:professor_id(full_name)")
      .eq("status", "otvoren")
      .gte("start_date", danas),
    "groups",
  );
  const grupe: OtvorenaGrupa[] = (grupeRows ?? [])
    .filter((g): g is typeof g & { start_date: string } => !!g.start_date)
    .map((g) => ({ id: g.id, level: g.level, startDate: g.start_date }));
  if (!grupe.length) return NextResponse.json({ poslato: 0, razlog: "nema otvorenih termina" });

  // 2) ko čeka koji nivo + ko je već obavešten (oba iz crm_interactions)
  const interakcije = must(
    await admin
      .from("crm_interactions")
      .select("contact_id, meta, occurred_at, contact:contact_id(email, name)")
      .in("meta->>tip", ["interes-za-grupu", "interes-obavesten"]),
    "crm_interactions",
  );

  const lidovi: Lid[] = [];
  const vecObavesteni = new Set<string>();
  for (const row of interakcije ?? []) {
    const meta = (row.meta ?? {}) as Record<string, string>;
    if (!row.contact_id) continue;
    if (meta.tip === "interes-obavesten") {
      if (meta.group_id) vecObavesteni.add(kljuc(row.contact_id, meta.group_id));
      continue;
    }
    const c = Array.isArray(row.contact) ? row.contact[0] : row.contact;
    if (!c?.email || !meta.nivo) continue;
    lidovi.push({
      contactId: row.contact_id, email: c.email, ime: c.name ?? null, nivo: meta.nivo,
      trazioAt: row.occurred_at ?? undefined,
    });
  }

  // 2b) ko je posle zahteva već platio kurs ili ušao u grupu - njemu se ne javlja
  const poslednjaKupovina = await kupovinePoMejlu(admin, lidovi.map((l) => l.email));

  const zaSlanje = zaObavestiti(lidovi, grupe, vecObavesteni, danas, poslednjaKupovina);
  if (!zaSlanje.length) return NextResponse.json({ poslato: 0, cekaju: lidovi.length });

  // 3) detalji grupe i cena - konkretan termin prodaje bolje od gole stranice
  const detalji = new Map(
    (grupeRows ?? []).map((g) => {
      const p = Array.isArray(g.professor) ? g.professor[0] : g.professor;
      return [g.id, {
        dani: formatDaysFull(g.days), vreme: (g.session_time ?? "").split("-")[0],
        prof: p?.full_name ?? "", kursId: g.purchasable_course_id as string | null,
      }];
    }),
  );
  const kursIds = [...new Set([...detalji.values()].map((d) => d.kursId).filter(Boolean))] as string[];
  const kursevi = kursIds.length
    ? must(await admin.from("courses").select("id, slug, price").in("id", kursIds), "courses")
    : [];
  const kursPoId = new Map((kursevi ?? []).map((c) => [c.id, c]));

  // 4) slanje; svaki uspeh odmah ostavlja trag, da pad na pola ne ponovi mejlove
  let poslato = 0;
  const greske: string[] = [];
  for (const { lid, grupa } of zaSlanje) {
    const d = detalji.get(grupa.id);
    const kurs = d?.kursId ? kursPoId.get(d.kursId) : null;
    try {
      const res = await sendTerminOtvoren(lid.email, lid.ime ?? "", {
        nivo: grupa.level,
        startDate: grupa.startDate,
        dani: d?.dani ?? "",
        vreme: d?.vreme ?? "",
        profIme: d?.prof ?? "",
        kursUrl: kurs?.slug ? `${SITE_URL}/kursevi/${kurs.slug}` : `${SITE_URL}/raspored`,
        cena: kurs?.price ? Number(kurs.price) : null,
      });
      // sendEmail vraća null kad je čovek odjavljen ili baunser - to nije greška,
      // ali ni slanje, pa ne upisujemo trag (da dobije mejl ako se ikad vrati)
      if (!res) continue;
      await admin.from("crm_interactions").insert({
        contact_id: lid.contactId,
        channel: "mejl",
        direction: "odlazna",
        summary: `Obavešten o terminu: ${grupa.level}`,
        body: `Automatsko obaveštenje - termin ${grupa.level} od ${grupa.startDate} je otvoren.`,
        meta: { tip: "interes-obavesten", group_id: grupa.id, nivo: grupa.level, kampanja: "interes-termin" },
      });
      poslato++;
    } catch (e) {
      greske.push(`${lid.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ poslato, kandidata: zaSlanje.length, cekaju: lidovi.length, greske });
}

/**
 * mejl (mala slova) -> ISO poslednje plaćene porudžbine ili upisa u grupu.
 * Upiti idu u komadima po mejlovima lidova (Supabase tiho seče na 1000 redova).
 * zack! članstvo nije kurs nemačkog i ne gasi zahtev.
 */
async function kupovinePoMejlu(admin: ReturnType<typeof createAdminClient>, mejlovi: string[]) {
  const rezultat = new Map<string, string>();
  const zabelezi = (mejl: string | null | undefined, kad: string | null | undefined) => {
    if (!mejl || !kad) return;
    const m = mejl.trim().toLowerCase();
    const pre = rezultat.get(m);
    if (!pre || kad > pre) rezultat.set(m, kad);
  };
  const svi = [...new Set(mejlovi.flatMap((m) => [m.trim(), m.trim().toLowerCase()]))];
  for (let i = 0; i < svi.length; i += 200) {
    const komad = svi.slice(i, i + 200);
    const porudzbine = must(
      await admin.from("orders").select("email, created_at, items")
        .eq("payment_status", "completed").in("email", komad),
      "orders",
    );
    for (const o of porudzbine ?? []) {
      const items = (o.items ?? []) as { course_slug?: string }[];
      if (items.length && items.every((it) => (it.course_slug ?? "").startsWith("zack"))) continue;
      zabelezi(o.email, o.created_at);
    }
    const profili = must(await admin.from("user_profiles").select("id, email").in("email", komad), "user_profiles");
    const mejlPoId = new Map((profili ?? []).map((p) => [p.id, p.email as string]));
    if (mejlPoId.size) {
      const upisi = must(
        await admin.from("group_enrollments").select("user_id, enrolled_at")
          .in("user_id", [...mejlPoId.keys()]).is("cancelled_at", null),
        "group_enrollments",
      );
      for (const u of upisi ?? []) zabelezi(mejlPoId.get(u.user_id), u.enrolled_at);
    }
  }
  return rezultat;
}

export const GET = withCronLog("interes-termin", cronHandler);
