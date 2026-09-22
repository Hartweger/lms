/**
 * Licni mejlovi za A2.2 (28.09) i B1.1 (28.09) - 14 rucno odabranih primalaca
 * (nezavrsene porudzbine, „Ceka termin" bez odgovora, Smile lidovi bez odgovora, NaKI).
 * Svaki mejl ima svoj uvod; zajednicki blok nosi termin, cenu i sta kurs nosi.
 * Posle slanja upisuje odlaznu interakciju u CRM (meta.kampanja) i stage nov→kontaktiran.
 *
 *   npx tsx scripts/send-a22-b11-licni-2026-09-22.ts            # DRY
 *   npx tsx scripts/send-a22-b11-licni-2026-09-22.ts --preview  # DRY + HTML pregled svih
 *   npx tsx scripts/send-a22-b11-licni-2026-09-22.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

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
const KAMPANJA = "a22-b11-licni-2026-09-22";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const A22_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2-2";
const B11_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const A21_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";

type Blok = "A22" | "B11" | "OBA" | "A2_OBA";
interface Primalac { email: string; ime: string | null; subject: string; blok: Blok; uvod: string; napomena?: string; }

const A22_BOX = `<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Grupni kurs A2.2</strong><br>prvi čas <strong>ponedeljak 28.09. u 18:00</strong>, profesorka Milica Vučić<br>ponedeljkom i sredom 18:00-19:00, 7 nedelja i 14 časova, do 11.11.<br><a href="${A22_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj A2.2 →</a></div></div>`;
const B11_BOX = `<div style="background:#f3f9fc;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Grupni kurs B1.1</strong><br>prvi čas <strong>ponedeljak 28.09. u 17:00</strong>, profesorka Milica Vučić<br>ponedeljkom i četvrtkom 17:00-18:00, 7 nedelja i 14 časova, do 12.11.<br><a href="${B11_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj B1.1 →</a></div></div>`;
const A21_BOX = `<div style="background:#f6f3fc;border-left:3px solid #8f7ad3;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Grupni kurs A2.1</strong><br>prvi čas <strong>četvrtak 01.10. u 19:00</strong>, profesorka Milica Vučić<br>utorkom i četvrtkom 19:00-20:00, 7 nedelja i 14 časova<br><a href="${A21_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj A2.1 →</a></div></div>`;

const ZAJEDNICKO = `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Šta kurs nosi:</strong> živu online nastavu u maloj grupi do 6 polaznika, video lekcije prof. Nataše Hartweger uz vežbe i testove na platformi dostupne 24/7 godinu dana, objašnjenja na našem jeziku, sav materijal uključen bez kupovine udžbenika i sertifikat po položenom završnom ispitu.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena je <strong>19.600 din.</strong> (oko 168 €), moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>`;

function boxes(b: Blok): string {
  if (b === "A22") return A22_BOX;
  if (b === "B11") return B11_BOX;
  if (b === "OBA") return A22_BOX + B11_BOX;
  return A21_BOX + A22_BOX;
}

function buildEmail(p: Primalac): string {
  const pozdrav = p.ime ? `Ćao ${p.ime},` : "Ćao,";
  const preheader = p.blok === "B11" ? "B1.1 kreće u ponedeljak 28.09. u 17h, mala grupa do 6 polaznika." : "A2.2 kreće u ponedeljak 28.09. u 18h, mala grupa do 6 polaznika.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">${preheader}</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
${p.uvod}
${boxes(p.blok)}
${ZAJEDNICKO}
${p.napomena ?? ""}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš bilo kakvo pitanje ili ti termin ne odgovara, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog.</div>
</div></body></html>`;
}

const P = (t: string) => `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${t}</p>`;
const TEST = `Ako nisi siguran/na koji je tvoj polunivo, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> - traje par minuta i odmah dobijaš preporuku.`;

const PRIMAOCI: Primalac[] = [
  // ---------- A2.2 ----------
  { email: "nikola.stankovicc@gmail.com", ime: "Nikola", blok: "A22",
    subject: "Tvoja porudžbina za A2.2 još čeka uplatu",
    uvod: P(`tvoja porudžbina <strong>2026-530</strong> za grupni kurs A2.2 od 18.09. je i dalje otvorena: kartica tada nije prošla, a uplatnica još nije stigla. Grupa kreće u ponedeljak, pa ti javljamo da mesto još može da bude tvoje.`),
    napomena: P(`Podaci za uplatu su u mejlu sa potvrdom porudžbine. Ako ti je lakše karticom ili ti treba nova uplatnica, odgovori na ovaj mejl i sredićemo odmah.`) },
  { email: "mojsijev.dragana@gmail.com", ime: "Dragana", blok: "A22",
    subject: "Tvoja porudžbina za A2.2 još čeka uplatu",
    uvod: P(`tvoja porudžbina <strong>2026-518</strong> za grupni kurs A2.2 od 15.09. (PayPal) je i dalje otvorena i nije plaćena. Grupa kreće u ponedeljak, pa ti javljamo da mesto još može da bude tvoje.`),
    napomena: P(`Uputstvo za PayPal je u mejlu sa potvrdom porudžbine. Ako ti je lakše karticom ili nešto nije jasno, odgovori na ovaj mejl i sredićemo odmah.`) },
  { email: "carefree_333@yahoo.com", ime: "Irena", blok: "A22",
    subject: "Otvoren je termin za A2.2 - ponedeljak 28.09.",
    uvod: P(`krajem avgusta nam je sa tvoje adrese stigao zahtev da javimo kad se otvori termin za A2.2. Otvoren je - i kreće već u ponedeljak.`),
    napomena: P(`Ako ti se čini da si već iznad A2.2 (test u julu ti je pokazao B1.1), istog dana kreće i <a href="${B11_URL}" style="color:#4fb1d3;font-weight:700">B1.1 grupa</a> u 17:00, ponedeljkom i četvrtkom. Reci nam šta ti više leži pa ti pomognemo da izabereš.`) },
  { email: "nadzicjovanovic@gmail.com", ime: "Nevena", blok: "A22",
    subject: "Otvoren je termin za A2.2 - ponedeljak 28.09.",
    uvod: P(`sredinom avgusta nam je sa tvoje adrese stigao zahtev da javimo kad se otvori termin za A2.2. Otvoren je - i kreće već u ponedeljak.`) },
  { email: "mirta.posnjak65@gmail.com", ime: "Mirta", blok: "OBA",
    subject: "A2.2 i B1.1 kreću 28.09. - koji je tvoj?",
    uvod: P(`u avgustu smo od tebe imali dva zahteva: prvo za B1.1 grupu, pa 12.08. za termin A2.2. Oba kursa sad kreću istog dana, u ponedeljak 28.09., pa biraš onaj koji ti odgovara:`),
    napomena: P(TEST + ` Plaćanje iz inostranstva ide karticom bez provizije.`) },
  { email: "jelena.lazarevic579@gmail.com", ime: "Jelena", blok: "A22",
    subject: "Otvoren je termin za A2.2 - ponedeljak 28.09.",
    uvod: P(`krajem jula si u razgovoru sa Smile pomenula da ti je naš test pokazao A2.2 nivo. Smile je prosledio, a mi nismo stigli da odgovorimo - izvini na čekanju. Sad imamo i konkretan termin: A2.2 grupa kreće u ponedeljak.`) },
  { email: "miksin77@gmail.com", ime: null, blok: "A2_OBA",
    subject: "Koliko traje A2 kurs - i dva termina koja kreću",
    uvod: P(`u avgustu je preko Smile stiglo tvoje pitanje koliko traje kurs A2, uz napomenu da si već na A2 nivou posle kursa u drugoj školi. Odgovor kasni, izvini na tome. Grupni kurs traje 7 nedelja po polunivou (A2.1 i A2.2 su odvojeni kursevi), a baš sad kreću oba:`),
    napomena: P(TEST) },
  { email: "marijaneskovic92@gmail.com", ime: "Marija", blok: "A2_OBA",
    subject: "Oktobar je tu - A2 grupa kreće 28.09.",
    uvod: P(`u avgustu si sa Smile pravila plan: A2 pa B1 do januara ili februara, sa startom u oktobru. Taj trenutak je stigao. Ako ti više odgovara rad sa profesorkom uživo nego samo video, evo šta kreće u narednih nedelju dana:`),
    napomena: P(`Posle A2.2 prirodno ide B1.1 u sledećem ciklusu, pa se plan do februara realno drži. ` + TEST) },
  // ---------- B1.1 ----------
  { email: "prljanovicmilica.11@gmail.com", ime: "Milica", blok: "B11",
    subject: "Tvoja porudžbina za B1.1 još čeka uplatu",
    uvod: P(`tvoja porudžbina <strong>2026-538</strong> za grupni kurs B1.1 od 20.09. (uplatnica) je i dalje otvorena. Grupa kreće u ponedeljak, a mesto se zauzima tek kad uplata legne, pa ti javljamo da ne ostaneš bez njega.`),
    napomena: P(`Podaci za uplatu su u mejlu sa potvrdom porudžbine. Ako ti treba nova uplatnica ili ti je lakše karticom, odgovori na ovaj mejl i sredićemo odmah.`) },
  { email: "minasalkic@gmail.com", ime: "Jasmina", blok: "B11",
    subject: "Otvoren je termin za B1.1 - ponedeljak 28.09.",
    uvod: P(`sredinom avgusta je tvoj test kod nas pokazao B1.1, a videli smo i vežbanje sa NaKI. Uz video gramatiku A2-B1 koju već imaš, B1.1 grupa uživo sa profesorkom je logičan sledeći korak - i kreće u ponedeljak.`) },
  { email: "azramujovic1@hotmail.com", ime: "Azra", blok: "B11",
    subject: "B1 kurs - cena, trajanje i termin koji kreće 28.09.",
    uvod: P(`u avgustu je preko Smile stiglo tvoje pitanje o kursu B1 i B2 - koliko košta i koliko traje. Odgovor kasni, izvini na tome. Nivo B1 se kod nas radi u dva dela, B1.1 pa B1.2, po 7 nedelja svaki, a B2 ide posle toga. Prvi deo kreće u ponedeljak:`),
    napomena: P(TEST) },
  { email: "gradimir.zugic@gmail.com", ime: "Gradimire", blok: "B11",
    subject: "Od A1 (2021) do B1 - odakle da kreneš",
    uvod: P(`pre nedelju dana je u razgovoru sa Smile stiglo: A1 završen 2021, cilj B1. Iskreno, posle pauze od nekoliko godina B1.1 može da bude prevelik skok - zato prvo uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> (par minuta), pa se vidi da li je pravi ulaz A2.1, A2.2 ili B1.1. Sva tri termina kreću u narednih nedelju dana; ako test kaže B1, ovo je tvoja grupa:`),
    napomena: P(`Ako test pokaže A2, istog dana kreće <a href="${A22_URL}" style="color:#4fb1d3;font-weight:700">A2.2</a> (ponedeljak 28.09. u 18h), a <a href="${A21_URL}" style="color:#4fb1d3;font-weight:700">A2.1</a> kreće u četvrtak 01.10. u 19h. Pošalji nam rezultat pa ti kažemo gde se najbolje uklapaš.`) },
  { email: "marijapetkovic1000@gmail.com", ime: "Marija", blok: "B11",
    subject: "Otvoren je termin za B1.1 - ponedeljak 28.09.",
    uvod: P(`krajem jula je preko Smile stiglo tvoje: ÖSD A1 položen, A2 odslušan, cilj je B1 i da progovoriš. Tada smo poslali konverzacijski kurs, a sad kreće baš ono što tražiš - B1.1 grupa, u ponedeljak.`),
    napomena: P(`U grupi do 6 ljudi svi pričaju na svakom času, pa i onaj deo „da progovorim" ide uz gramatiku, ne posle nje.`) },
  { email: "nikolinamarkovic1993@gmail.com", ime: "Nikolina", blok: "OBA",
    subject: "A2.2 i B1.1 kreću 28.09. - koji je tvoj?",
    uvod: P(`u razgovorima sa NaKI u junu i avgustu stoji: negde između A2 i B1. Baš za taj slučaj imamo oba termina istog dana, u ponedeljak 28.09., pa biraš:`),
    napomena: P(`Perfekt sa haben i sein ti sa NaKI ide bez greške, a to je gradivo A2.2 - B1.1 bi ti verovatno bio pravi izazov. ` + TEST) },
];

async function logCrm(p: Primalac, resendId: string | null) {
  const { data: c, error: e1 } = await supabase.from("crm_contacts").select("id, stage").ilike("email", p.email).maybeSingle();
  if (e1) throw new Error(`crm_contacts read ${p.email}: ${e1.message}`);
  let id = c?.id as string | undefined;
  if (!id) {
    const { data: n, error: e2 } = await supabase.from("crm_contacts")
      .insert({ email: p.email, name: p.ime, source: "rucno", stage: "kontaktiran", last_interaction_at: new Date().toISOString() })
      .select("id").single();
    if (e2) throw new Error(`crm_contacts insert ${p.email}: ${e2.message}`);
    id = n.id;
  }
  const { error: e3 } = await supabase.from("crm_interactions").insert({
    contact_id: id, channel: "mejl", direction: "odlazna",
    summary: `Lični mejl: ${p.subject}`,
    body: `Poslato preko Resend skripte send-a22-b11-licni-2026-09-22.ts. Blok: ${p.blok}. Resend id: ${resendId ?? "?"}`,
    occurred_at: new Date().toISOString(),
    meta: { kampanja: KAMPANJA, blok: p.blok, resend_id: resendId },
  });
  if (e3) throw new Error(`crm_interactions ${p.email}: ${e3.message}`);
  const patch: Record<string, unknown> = { last_interaction_at: new Date().toISOString() };
  if (c?.stage === "nov") patch.stage = "kontaktiran";
  const { error: e4 } = await supabase.from("crm_contacts").update(patch).eq("id", id);
  if (e4) throw new Error(`crm_contacts update ${p.email}: ${e4.message}`);
}

async function run() {
  console.log(`Primalaca: ${PRIMAOCI.length} | kampanja ${KAMPANJA}`);
  const emails = PRIMAOCI.map((p) => p.email.toLowerCase());
  const { data: opt } = await supabase.from("email_optouts").select("email").in("email", emails);
  if (opt && opt.length) throw new Error(`Odjavljeni u listi: ${opt.map((o) => o.email).join(", ")}`);

  if (PREVIEW) {
    const dir = path.resolve(__dirname, "_a22_b11_licni_preview");
    fs.mkdirSync(dir, { recursive: true });
    for (const p of PRIMAOCI) fs.writeFileSync(path.join(dir, `${p.email.replace(/[@.]/g, "_")}.html`), buildEmail(p));
    console.log(`Pregled: ${dir}/`);
  }
  if (!SEND) {
    PRIMAOCI.forEach((p) => console.log(`  [${p.blok}] ${p.email} - ${p.subject}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; resend_id: string | null; crm: boolean }> = [];
  for (const p of PRIMAOCI) {
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
    ok++; poslato.push({ email: p.email, resend_id: rid, crm });
    console.log(`  ✓ ${p.email} ${rid ?? ""}${crm ? "" : " (CRM NIJE upisan)"}`);
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${PRIMAOCI.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_a22_b11_licni_sent_2026-09-22.json"), JSON.stringify(poslato, null, 2));
}
run().catch((e) => { console.error(e); process.exit(1); });
