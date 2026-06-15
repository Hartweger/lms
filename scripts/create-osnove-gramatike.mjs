// Kreira samostalni VIDEO kurs "Osnove nemačke gramatike" (slug osnove-nemacke-gramatike)
// Izvor: stari WP proizvod 35181 + LearnDash kurs 31537 (Vimeo 641079521 + Drive priručnik).
// Sadržaj: 1 video lekcija (120 min) + PDF priručnik (30 strana). Samostalan content kurs
// (course_unlocks: purchasable = content = ovaj kurs), kao gramatika-a2-b1.
// Idempotentno. Pokreni sa --apply za upis.
// Backfill pristupa: svi completed kupci WP proizvoda 35181 → pristup 365 dana od datuma kupovine.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const PRIRUCNIK = "https://drive.google.com/file/d/1hAxtfzSsyCwwrtu63lDl3vc3ESuhd9pV/view?usp=sharing";
const VIMEO_ID = "641079521";
const WP_PRODUCT_ID = 35181;
const WC_BASE = "https://old.hartweger.rs/wp-json/wc/v3";
const WC_AUTH = "Basic " + Buffer.from("ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322:cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4").toString("base64");

// Vrati mapu email -> najnoviji datum kupovine (completed) za proizvod 35181
async function fetchBuyers() {
  const byEmail = new Map();
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${WC_BASE}/orders?product=${WP_PRODUCT_ID}&status=completed&per_page=100&page=${page}`, { headers: { Authorization: WC_AUTH } });
    if (!r.ok) throw new Error(`WC orders → ${r.status}`);
    const orders = await r.json();
    if (!Array.isArray(orders) || orders.length === 0) break;
    for (const o of orders) {
      // potvrdi da porudžbina stvarno sadrži proizvod 35181
      if (!(o.line_items || []).some(li => li.product_id === WP_PRODUCT_ID)) continue;
      const email = (o.billing?.email || "").trim().toLowerCase();
      if (!email) continue;
      const d = new Date(o.date_created);
      const prev = byEmail.get(email);
      if (!prev || d > prev) byEmail.set(email, d);
    }
    if (orders.length < 100) break;
    await new Promise(res => setTimeout(res, 2500)); // rate limit
  }
  return byEmail;
}

const COURSE = {
  title: "VIDEO + priručnik: Osnove nemačke gramatike",
  slug: "osnove-nemacke-gramatike",
  description: "Kompletni video vodič kroz ključne teme nemačke gramatike + PDF priručnik od 30 strana.",
  course_type: "video",
  price: 2400,
  paypal_price_eur: 20,
  is_published: true,
  is_purchasable: true,
  category: "video",
  old_wc_product_id: 35181,
  handbook_url: PRIRUCNIK,
  marketing_description: [
    "Savladaj osnove nemačke gramatike uz kompletni video vodič i jedinstveni PDF priručnik od 30 strana.",
    "Da li želiš da razumeš i savladaš ključne gramatičke teme nemačkog jezika? Ako ti nedostaje struktura i jasnoća u osnovama, ovaj video vodič te sistematski vodi kroz sve esencijalne pojmove — da stekneš čvrste temelje i samopouzdanje.",
    "Za koga je ovaj vodič?",
    "Za tebe ako si već počeo/la da učiš nemački i želiš da učvrstiš gramatičke osnove.",
    "Za sve koji žele da razjasne konkretne nedoumice oko ključnih tema.",
    "Za polaznike na višim nivoima (B1, B2) koji i dalje imaju praznine u osnovnim pravilima — ovaj kurs ih popunjava i ojačava znanje.",
    "Vodič NIJE za potpune početnike koji nikada nisu učili nemački, ni za polaznike HARTWEGER centra koji su završili A1 (taj materijal je već uključen u njihov program).",
    "Šta sve obrađujemo: glagolska vremena (prezent, preterit, perfekat), modalne i nepravilne glagole, množinu imenica, padeže (nominativ, akuzativ, dativ), prisvojne i lične zamenice, predloge sa dativom i akuzativom, red reči u pitanjima, negaciju i priloge za vreme.",
    "Ne dozvoli da ti gramatika bude prepreka — izgradi solidne temelje za tečno i samouvereno govorenje nemačkog.",
  ].join("\n"),
  features: [
    "Video vodič (120 minuta) kroz ključne teme nemačke gramatike",
    "Ekskluzivni PDF priručnik od 30 strana — za štampu i trajnu upotrebu",
    "Sva osnovna glagolska vremena: prezent, preterit, perfekat",
    "Modalni i nepravilni glagoli + lista nepravilnih glagola",
    "Padeži: nominativ, akuzativ, dativ — razumevanje i primena",
    "Predlozi sa dativom i akuzativom, zamenice, množina imenica",
    "Red reči u pitanjima, negacija i prilozi za vreme",
    "Pristup platformi godinu dana",
  ],
};

const LESSON = {
  title: "Osnove nemačke gramatike – Video vodič",
  lesson_type: "video",
  vimeo_video_id: VIMEO_ID,
  order_index: 0,
  is_free_preview: false,
  content: "",
  sections: [
    { type: "badge", module: "Osnove nemačke gramatike" },
    { type: "video", vimeoId: VIMEO_ID },
    {
      type: "text",
      content:
        "**Materijali za preuzimanje:**\n\nPriručnik (PDF, 30 strana) možeš da skineš sa [ovog linka](" + PRIRUCNIK + ").\n\n---\n\n**Teme koje video obrađuje:** glagolska vremena (prezent, preterit, perfekat), modalni glagoli, molba uz konjunktiv, nepravilni glagoli, množina imenica, padeži (nominativ, akuzativ, dativ), prisvojne i lične zamenice, predlozi sa dativom i akuzativom, upitne reči i red reči u pitanjima, negacija, prilozi za vreme.",
    },
  ],
};

// --- KURS ---
const { data: existing } = await sb.from("courses").select("id").eq("slug", COURSE.slug).maybeSingle();
let courseId = existing?.id;
console.log(existing ? `~ kurs "${COURSE.slug}" već postoji (${courseId})` : `+ kreiraće se kurs "${COURSE.slug}" (€${COURSE.paypal_price_eur} / ${COURSE.price} RSD, published=${COURSE.is_published})`);

// Učitaj kupce (i u dry-run radi pregleda)
console.log("\n→ Povlačim completed kupce WP proizvoda " + WP_PRODUCT_ID + " …");
const buyers = await fetchBuyers();
console.log("  nađeno " + buyers.size + " jedinstvenih kupaca (po emailu).");

// Upari sa nalozima na novom LMS-u i izračunaj rok (365 dana od kupovine)
const grants = []; // {email, userId, purchase, expires, active}
const unmatched = [];
const now = new Date();
for (const [email, purchase] of buyers) {
  const expires = new Date(purchase.getTime() + 365 * 86400000);
  const { data: prof } = await sb.from("user_profiles").select("id").ilike("email", email).maybeSingle();
  if (prof?.id) grants.push({ email, userId: prof.id, purchase, expires, active: expires > now });
  else unmatched.push({ email, purchase, expires, active: expires > now });
}
const activeGrants = grants.filter(g => g.active).length;
const activeUnmatched = unmatched.filter(u => u.active).length;
console.log(`  upareno sa LMS nalogom: ${grants.length} (aktivnih: ${activeGrants})`);
console.log(`  BEZ LMS naloga: ${unmatched.length} (od toga ${activeUnmatched} bi imali aktivan pristup — nemaju nalog)`);
if (unmatched.length) {
  console.log("  — kupci bez naloga (ne mogu dobiti pristup dok se ne registruju):");
  for (const u of unmatched) console.log(`     ${u.active ? "AKTIVAN" : "istekao "} ${u.email} (kupio ${u.purchase.toISOString().slice(0,10)} → do ${u.expires.toISOString().slice(0,10)})`);
}

if (!APPLY) {
  console.log("\n[DRY RUN] Ništa nije upisano. Pokreni sa --apply za upis.");
  console.log("\nPLAN:");
  console.log("  1) courses ← " + COURSE.slug + " (published=" + COURSE.is_published + ", purchasable=" + COURSE.is_purchasable + ")");
  console.log("  2) lessons ← '" + LESSON.title + "' (video " + VIMEO_ID + " + priručnik)");
  console.log("  3) course_unlocks ← self (purchasable = content)");
  console.log("  4) course_access ← " + grants.length + " kupaca, expires_at = kupovina + 365 dana");
  process.exit(0);
}

if (!courseId) {
  const { data: created, error } = await sb.from("courses").insert(COURSE).select("id").single();
  if (error) throw error;
  courseId = created.id;
  console.log("  ✓ kreiran kurs " + courseId);
} else {
  const { error } = await sb.from("courses").update(COURSE).eq("id", courseId);
  if (error) throw error;
  console.log("  ✓ ažuriran kurs " + courseId);
}

// --- LEKCIJA ---
const { data: existLesson } = await sb.from("lessons").select("id").eq("course_id", courseId).eq("order_index", 0).maybeSingle();
if (existLesson) {
  const { error } = await sb.from("lessons").update({ ...LESSON, course_id: courseId }).eq("id", existLesson.id);
  if (error) throw error;
  console.log("  ✓ ažurirana lekcija " + existLesson.id);
} else {
  const { data: l, error } = await sb.from("lessons").insert({ ...LESSON, course_id: courseId }).select("id").single();
  if (error) throw error;
  console.log("  ✓ kreirana lekcija " + l.id);
}

// --- UNLOCK (self) ---
{
  const { error } = await sb.from("course_unlocks").upsert(
    { purchasable_course_id: courseId, content_course_id: courseId },
    { onConflict: "purchasable_course_id,content_course_id", ignoreDuplicates: true }
  );
  if (error) throw error;
  console.log("  ✓ course_unlocks → self");
}

// --- PRISTUP KUPCIMA (365 dana od kupovine) ---
let inserted = 0, skipped = 0;
for (const g of grants) {
  const { data: have } = await sb.from("course_access").select("id").eq("user_id", g.userId).eq("course_id", courseId).maybeSingle();
  if (have) { skipped++; continue; }
  const { error } = await sb.from("course_access").insert({ user_id: g.userId, course_id: courseId, expires_at: g.expires.toISOString() });
  if (error) throw error;
  inserted++;
}
console.log(`  ✓ course_access: ${inserted} novih, ${skipped} već postojalo (od ${grants.length} uparenih kupaca)`);

console.log("\n✓ Gotovo. Proveri: https://www.hartweger.rs/kursevi/" + COURSE.slug);
console.log("⚠ Smoke test: otvori lekciju i potvrdi da se Vimeo " + VIMEO_ID + " pušta (stari video — proveri da nije domenski zaključan).");
