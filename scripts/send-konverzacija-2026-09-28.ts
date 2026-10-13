/**
 * Konverzacija B1+ - ponuda za termin 13.10.2026 (utorkom 17-18h, Katarina, 9 časova).
 *
 * Dve publike:
 *   A - 8 ljudi koji su TRAŽILI baš ovaj kurs; svako sa svojim uvodom.
 *   B - segment koji je dokazano na B1+ (ima B2/C1 kurs, ili 75%+ B1.2 videa,
 *       ili je bio u grupi B1.2/B2.x/C1.x). Računa se ŽIVO iz baze.
 *
 * Isključenja (živa, po reference_kampanje_pravila):
 *   email_optouts, email_bounces, interni @hartweger.rs nalozi,
 *   već ima konverzacijski kurs (course_access ili plaćena porudžbina),
 *   AKTIVAN individualni paket (odluka Nataše 28.09.2026),
 *   sumnjiv domen (suggestEmailFix) - takvi se ISPISUJU i preskaču, ne popravljaju.
 *
 *   npx tsx scripts/send-konverzacija-2026-09-28.ts            # DRY
 *   npx tsx scripts/send-konverzacija-2026-09-28.ts --preview  # DRY + HTML pregled
 *   npx tsx scripts/send-konverzacija-2026-09-28.ts --send     # A + B
 *   npx tsx scripts/send-konverzacija-2026-09-28.ts --send --only=A
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { suggestEmailFix } from "../src/lib/crm/email-typos";

for (const f of [".env.local", ".env.production"]) {
  const p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const [k, ...v] = line.split("=");
    const key = k?.trim();
    const val = v.join("=").trim().replace(/^["']|["']$/g, "");
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
if (!RESEND_KEY || RESEND_KEY.length < 20) throw new Error("RESEND_API_KEY nije postavljen (proveri shell okruzenje)");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const FROM = "Hartweger <info@hartweger.rs>";
const KAMPANJA = "konverzacija-b1-2026-09-28";
const GROUP_ID = "85a35d43-dcdc-4d30-b818-76beb8d2f8e0";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-konverzacijski-kurs-nemackog-b1";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] as "A" | "B" | undefined;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Grupa = "A" | "B";
interface Primalac { email: string; ime: string | null; subject: string; grupa: Grupa; uvod: string; napomena?: string }

const P = (t: string) => `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${t}</p>`;

const TERMIN_BOX = `<div style="background:#f6f3fc;border-left:3px solid #8f7ad3;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Konverzacijski kurs nemačkog (B1+)</strong><br>prvi čas <strong>utorak 13.10. u 17:00</strong>, profesorka Katarina Todosijević<br>utorkom 17:00-18:00, 9 časova, do 08.12.<br>mala grupa, najviše 6 ljudi, online preko Google Meeta<br><a href="${KURS_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj kurs i prijavi se →</a></div></div>`;

const ZAJEDNICKO = `${P(`Ovo nije kurs gramatike. Svaki čas je jedna tema i pričanje od prve minute - posao i svakodnevica, porodica, život u gradu i na selu, putovanja, životna sredina, internet. Uz svaku temu na platformi te čekaju kartice sa rečima za tu temu, da pre časa osvežiš vokabular.`)}
${P(`Cena je <strong>17.550 din.</strong> (150 €). Mesto se zauzima kad uplata prođe.`)}`;

function buildEmail(p: Primalac): string {
  const pozdrav = p.ime ? `Ćao ${p.ime},` : "Ćao,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Konverzacija B1+ kreće u utorak 13.10. u 17h, mala grupa do 6 ljudi.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
${p.uvod}
${TERMIN_BOX}
${ZAJEDNICKO}
${p.napomena ?? ""}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako ti nešto nije jasno ili ti termin ne odgovara, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si naš polaznik/ca ili si nam se javio/la sa pitanjem o kursevima nemačkog.</div>
</div></body></html>`;
}

// ---------------------------------------------------------------- A: lični
const A: Primalac[] = [
  { email: "iva.kotur@gmail.com", ime: "Ivana", grupa: "A",
    subject: "Konverzacija - sad je termin utorkom, ne subotom",
    uvod: P(`u avgustu si napisala da ti termin subotom ne odgovara i da se nadaš da će biti ponuđen neki drugi dan. Javljam ti čim ima novo: <strong>nova grupa je utorkom.</strong>`) },
  { email: "bartulovicandja@gmail.com", ime: "Anđa", grupa: "A",
    subject: "Konverzacijski kurs - termin koji si tražila",
    uvod: P(`juče si ostavila mejl da te obavestimo kad se otvori sledeći termin konverzacijskog kursa. Evo ga odmah.`) },
  { email: "vladimirderman5@gmail.com", ime: "Vladimire", grupa: "A",
    subject: "Grupni konverzacijski kurs - nova grupa od 13. oktobra",
    uvod: P(`pisao si nam u avgustu da te zanima grupni online konverzacijski kurs, kao osvežavanje jezika posle devet godina u Nemačkoj. Izvini što si čekao na odgovor - sad imamo tačno to.`),
    napomena: P(`Pitao si i za „peglanje akcenta": na času se izgovor ispravlja kroz govor, ali to nije poseban trening akcenta. Ako ti je baš to prioritet, javi pa da vidimo šta ima smisla.`) },
  { email: "tina.novak1@hotmail.com", ime: "Tina", grupa: "A",
    subject: "Konverzacijski kurs - nova grupa kreće od nule",
    uvod: P(`u avgustu sam ti nudila da se priključiš grupi koja je već bila krenula. Sad kreće nova, od prvog časa.`) },
  { email: "jelena.roksandic96@gmail.com", ime: "Jelena", grupa: "A",
    subject: "Konverzacija posle B1.1 - nova grupa od 13. oktobra",
    uvod: P(`u avgustu si ostavila mejl za konverzacijski kurs, a početkom septembra si završila B1.1 grupu. Ovo je tačno ono što dolazi posle - da sve što si naučila počneš i da koristiš.`) },
  { email: "svircevsasa@gmail.com", ime: "Saša", grupa: "A",
    subject: "Konverzacijski kurs - nova grupa kreće od nule",
    uvod: P(`u avgustu sam ti nudila da uskočiš u grupu koja je već bila krenula. Sad kreće nova, od prvog časa.`) },
  { email: "natalijap@hotmail.com", ime: "Natalija", grupa: "A",
    subject: "Konverzacijska grupa ipak postoji - od 13. oktobra",
    uvod: P(`krajem jula si pitala da li će biti konverzacijske grupe i odgovorila sam ti da neće. Ispostavilo se drugačije - grupa postoji i kreće 13. oktobra. Vodi je Katarina, ne Marija.`) },
  { email: "nenad.djurokw@gmail.com", ime: "Nenade", grupa: "A",
    subject: "Konverzacijski kurs - nov termin od 13. oktobra",
    uvod: P(`u julu si ostavio mejl za konverzacijski kurs. Evo novog termina.`) },
];

const B_SUBJECT = "Vreme je da progovoriš - konverzacija B1+ od 13. oktobra";
const B_UVOD = P(`znamo kroz šta si prošao/la kod nas i znamo šta je obično sledeći problem: gramatika stoji, reči ima, a u razgovoru sve ide sporo.`) + P(`Zato postoji konverzacijski kurs B1+ - grupa u kojoj se samo priča.`);

// ------------------------------------------------- B: publika živo iz baze
function prvoIme(full: string | null): string | null {
  const s = (full ?? "").trim();
  if (!s) return null;
  const prvi = s.split(/\s+/)[0];
  if (!/^[A-ZČĆŠĐŽ][a-zčćšđžA-ZČĆŠĐŽ'-]{1,}$/u.test(prvi)) return null; // korisnička imena tipa "sladjaerakovic"
  return prvi;
}

/**
 * Supabase tiho seče na 1000 redova (reference_supabase_max_rows_1000) - svaki
 * select koji može da pređe hiljadu redova MORA kroz .range() stranicu po stranicu.
 * lesson_progress za B1.2 realno ima nekoliko hiljada redova.
 */
async function straniceno<T>(
  napravi: (od: number, do_: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const KORAK = 1000;
  const out: T[] = [];
  for (let od = 0; ; od += KORAK) {
    const { data, error } = await napravi(od, od + KORAK - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < KORAK) return out;
  }
}

async function ucitajB(): Promise<Primalac[]> {
  const [b2c1, b12prog, grupe, lekcijeB12] = await Promise.all([
    straniceno<{ user_id: string; expires_at: string | null }>((od, do_) =>
      supabase.from("course_access").select("user_id, expires_at, courses!inner(slug)")
        .in("courses.slug", ["nemacki-b2-1", "nemacki-b2-2", "nemacki-c1-1", "polozi-goethe-b2", "polozi-goethe-c1"])
        .range(od, do_) as never),
    straniceno<{ user_id: string }>((od, do_) =>
      supabase.from("lesson_progress").select("user_id, completed, lessons!inner(courses!inner(slug))")
        .eq("completed", true).eq("lessons.courses.slug", "nemacki-b1-2").range(od, do_) as never),
    straniceno<{ user_id: string }>((od, do_) =>
      supabase.from("group_enrollments").select("user_id, status, groups!inner(level)")
        .eq("status", "active").in("groups.level", ["B1.2", "B2.1", "B2.2", "C1.1", "C1.2"]).range(od, do_) as never),
    straniceno<{ id: string }>((od, do_) =>
      supabase.from("lessons").select("id, courses!inner(slug)").eq("courses.slug", "nemacki-b1-2").range(od, do_) as never),
  ]);

  const ukupnoB12 = lekcijeB12.length;
  if (ukupnoB12 < 10) throw new Error(`Sumnjiv broj lekcija B1.2: ${ukupnoB12}`);
  const prag = Math.ceil(ukupnoB12 * 0.75);

  const ids = new Set<string>();
  const sada = Date.now();
  for (const r of b2c1) if (!r.expires_at || new Date(r.expires_at).getTime() > sada) ids.add(r.user_id);
  const brojac = new Map<string, number>();
  for (const r of b12prog) brojac.set(r.user_id, (brojac.get(r.user_id) ?? 0) + 1);
  for (const [u, n] of brojac) if (n >= prag) ids.add(u);
  for (const r of grupe) ids.add(r.user_id);
  console.log(`B1.2 lekcija: ${ukupnoB12}, prag ${prag} | kandidata po kriterijumu: ${ids.size}`);

  const lista = [...ids];
  const profili: Array<{ id: string; email: string; full_name: string | null }> = [];
  for (let i = 0; i < lista.length; i += 200) {
    const { data, error } = await supabase.from("user_profiles").select("id, email, full_name").in("id", lista.slice(i, i + 200));
    if (error) throw new Error(error.message);
    profili.push(...(data ?? []));
  }

  const aEmails = new Set(A.map((p) => p.email.toLowerCase()));
  const kandidati = profili.filter((u) => {
    const e = (u.email ?? "").toLowerCase();
    return e && !aEmails.has(e) && !e.endsWith("@hartweger.rs") && e !== "natasahartweger@gmail.com";
  });

  return kandidati.map((u) => ({
    email: u.email.toLowerCase(), ime: prvoIme(u.full_name), grupa: "B" as const,
    subject: B_SUBJECT, uvod: B_UVOD,
  }));
}

// --------------------------------------------------------------- isključenja
async function primeniIskljucenja(svi: Primalac[]): Promise<{ ostaju: Primalac[]; izbaceni: Array<[string, string]> }> {
  const emails = svi.map((p) => p.email);
  const izbaceni: Array<[string, string]> = [];
  const razlog = new Map<string, string>();

  const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

  for (const c of chunk(emails, 200)) {
    const [opt, bnc] = await Promise.all([
      supabase.from("email_optouts").select("email").in("email", c),
      supabase.from("email_bounces").select("email").in("email", c),
    ]);
    if (opt.error) throw new Error(opt.error.message);
    if (bnc.error) throw new Error(bnc.error.message);
    for (const r of opt.data ?? []) razlog.set((r.email as string).toLowerCase(), "odjavljen");
    for (const r of bnc.data ?? []) razlog.set((r.email as string).toLowerCase(), "bounce");
  }

  // profili -> id, pa provera konverzacije i individualnih paketa
  const profili: Array<{ id: string; email: string }> = [];
  for (const c of chunk(emails, 200)) {
    const { data, error } = await supabase.from("user_profiles").select("id, email").in("email", c);
    if (error) throw new Error(error.message);
    profili.push(...(data ?? []));
  }
  const byId = new Map(profili.map((u) => [u.id, u.email.toLowerCase()]));
  const userIds = [...byId.keys()];

  for (const c of chunk(userIds, 200)) {
    const [konv, ind] = await Promise.all([
      supabase.from("course_access").select("user_id, courses!inner(slug)").in("user_id", c)
        .in("courses.slug", ["grupni-konverzacijski-kurs-nemackog-b1", "konverzacijski-b1-sadrzaj"]),
      supabase.from("individual_enrollments").select("user_id, expires_at").in("user_id", c).eq("status", "active"),
    ]);
    if (konv.error) throw new Error(konv.error.message);
    if (ind.error) throw new Error(ind.error.message);
    for (const r of konv.data ?? []) { const e = byId.get((r as { user_id: string }).user_id); if (e) razlog.set(e, "vec ima konverzaciju"); }
    for (const r of ind.data ?? []) {
      const exp = (r as { expires_at: string | null }).expires_at;
      if (exp && new Date(exp).getTime() <= Date.now()) continue;
      const e = byId.get((r as { user_id: string }).user_id);
      if (e) razlog.set(e, "aktivan individualni paket");
    }
  }

  // plaćena porudžbina baš ovog kursa
  for (const c of chunk(emails, 200)) {
    const { data, error } = await supabase.from("orders").select("email, items").in("email", c).eq("payment_status", "completed");
    if (error) throw new Error(error.message);
    for (const o of data ?? []) {
      const items = (o.items as Array<{ course_slug?: string }> | null) ?? [];
      if (items.some((i) => i.course_slug === "grupni-konverzacijski-kurs-nemackog-b1")) {
        razlog.set((o.email as string).toLowerCase(), "kupio konverzaciju");
      }
    }
  }

  for (const p of svi) {
    const typo = suggestEmailFix(p.email);
    if (typo) razlog.set(p.email, `sumnjiv domen (predlog: ${typo.suggestion})`);
  }

  const ostaju = svi.filter((p) => {
    const r = razlog.get(p.email);
    if (r) { izbaceni.push([p.email, r]); return false; }
    return true;
  });
  return { ostaju, izbaceni };
}

async function logCrm(p: Primalac, resendId: string | null) {
  const { data: c, error: e1 } = await supabase.from("crm_contacts").select("id, stage").ilike("email", p.email).maybeSingle();
  if (e1) throw new Error(`crm_contacts read ${p.email}: ${e1.message}`);
  let id = c?.id as string | undefined;
  if (!id) {
    const { data: n, error: e2 } = await supabase.from("crm_contacts")
      .insert({ email: p.email, name: p.ime, source: "rucno", stage: "kontaktiran", level: "B1", last_interaction_at: new Date().toISOString() })
      .select("id").single();
    if (e2) throw new Error(`crm_contacts insert ${p.email}: ${e2.message}`);
    id = n.id;
  }
  const { error: e3 } = await supabase.from("crm_interactions").insert({
    contact_id: id, channel: "mejl", direction: "odlazna",
    summary: `Ponuda Konverzacija B1+ 13.10: ${p.subject}`,
    body: `Poslato skriptom send-konverzacija-2026-09-28.ts. Publika: ${p.grupa}. Grupa: ${GROUP_ID}. Resend id: ${resendId ?? "?"}`,
    occurred_at: new Date().toISOString(),
    meta: { kampanja: KAMPANJA, publika: p.grupa, group_id: GROUP_ID, resend_id: resendId },
  });
  if (e3) throw new Error(`crm_interactions ${p.email}: ${e3.message}`);
  const patch: Record<string, unknown> = { last_interaction_at: new Date().toISOString() };
  if (c?.stage === "nov") patch.stage = "kontaktiran";
  const { error: e4 } = await supabase.from("crm_contacts").update(patch).eq("id", id);
  if (e4) throw new Error(`crm_contacts update ${p.email}: ${e4.message}`);
}

async function run() {
  // provera da je termin i dalje otvoren
  const { data: g, error: ge } = await supabase.from("groups")
    .select("level, status, start_date, session_time, max_seats").eq("id", GROUP_ID).single();
  if (ge) throw new Error(`groups: ${ge.message}`);
  if (g.status !== "otvoren") throw new Error(`Grupa nije otvorena (status=${g.status}) - ne šaljem.`);
  console.log(`Grupa: ${g.level} ${g.start_date} ${g.session_time} status=${g.status}`);

  const b = await ucitajB();
  const svi = [...A, ...b];
  const { ostaju, izbaceni } = await primeniIskljucenja(svi);

  console.log(`\nKandidati: ${svi.length} (A ${A.length}, B ${b.length})`);
  console.log(`Izbačeno: ${izbaceni.length}`);
  for (const [e, r] of izbaceni) console.log(`  - ${e}: ${r}`);

  const ciljna = ONLY ? ostaju.filter((p) => p.grupa === ONLY) : ostaju;
  console.log(`\nZa slanje: ${ciljna.length} (A ${ciljna.filter((p) => p.grupa === "A").length}, B ${ciljna.filter((p) => p.grupa === "B").length})`);

  if (PREVIEW) {
    const dir = path.resolve(__dirname, "_konverzacija_preview_2026-09-28");
    fs.mkdirSync(dir, { recursive: true });
    for (const p of [...A, ciljna.find((x) => x.grupa === "B")!].filter(Boolean)) {
      fs.writeFileSync(path.join(dir, `${p.email.replace(/[@.]/g, "_")}.html`), buildEmail(p));
    }
    console.log(`Pregled: ${dir}/`);
  }
  if (!SEND) {
    for (const p of ciljna) console.log(`  [${p.grupa}] ${p.email}${p.ime ? ` (${p.ime})` : " (bez imena)"}`);
    console.log(`\n[DRY] --send da pošaljem.`);
    fs.writeFileSync(path.resolve(__dirname, "_konverzacija_publika_2026-09-28.json"), JSON.stringify(ciljna.map(({ email, ime, grupa }) => ({ email, ime, grupa })), null, 2));
    return;
  }

  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; grupa: Grupa; resend_id: string | null; crm: boolean }> = [];
  for (const p of ciljna) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `${KAMPANJA}/${p.email}` },
      body: JSON.stringify({ from: FROM, to: [p.email], reply_to: "info@hartweger.rs", subject: p.subject, html: buildEmail(p) }),
    });
    if (!res.ok) { fail++; console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); await sleep(600); continue; }
    const body = await res.json().catch(() => ({}));
    const rid = body?.id ?? null;
    let crm = true;
    try { await logCrm(p, rid); } catch (e) { crm = false; console.error(`  ⚠ CRM ${p.email}: ${(e as Error).message}`); }
    ok++; poslato.push({ email: p.email, grupa: p.grupa, resend_id: rid, crm });
    console.log(`  ✓ [${p.grupa}] ${p.email} ${rid ?? ""}${crm ? "" : " (CRM NIJE upisan)"}`);
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${ciljna.length}).`);
  fs.writeFileSync(path.resolve(__dirname, `_konverzacija_sent_2026-09-28${ONLY ? `_${ONLY}` : ""}.json`), JSON.stringify(poslato, null, 2));
}
run().catch((e) => { console.error(e); process.exit(1); });
