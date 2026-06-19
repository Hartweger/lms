// NaKI content miner — najčešće teme i signali namere iz razgovora.
// Pokretanje:  node scripts/naki-topics.mjs            (poslednjih 7 dana)
//              node scripts/naki-topics.mjs 30         (poslednjih N dana)
// Izlaz koristi marketing/...-naki-content-ideje.md (sadržaj za YouTube/IG).
import { config } from "dotenv";
config({ path: new URL("../.env.local", import.meta.url).pathname });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const days = Math.max(1, parseInt(process.argv[2] ?? "7", 10) || 7);
const since = new Date(Date.now() - days * 86400e3).toISOString();

async function rest(p) {
  const all = [];
  for (let f = 0; ; f += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${p}${p.includes("?") ? "&" : "?"}offset=${f}&limit=1000`, { headers: H });
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    all.push(...rows);
    if (rows.length < 1000) return all;
  }
}

const msgs = await rest(`naki_messages?select=session_id,role,message&created_at=gte.${since}`);
const userMsgs = msgs.filter((m) => m.role === "user");
const sessions = new Set(msgs.map((m) => m.session_id)).size;
console.log(`\n═══ NaKI teme — poslednjih ${days} dana ═══`);
console.log(`User poruka: ${userMsgs.length}, sesija: ${sessions}\n`);

// # različitih sesija u kojima se tema javlja = pravi signal tražnje
const sessHits = (re) => {
  const s = new Set();
  userMsgs.forEach((m) => { if (re.test(m.message.toLowerCase())) s.add(m.session_id); });
  return s.size;
};
const hits = (re) => userMsgs.filter((m) => re.test(m.message.toLowerCase())).length;

const TOPICS = [
  ["Negacija kein/nicht", /\bkein|\bnicht\b|negacij/],
  ["Veznici / spajanje recenica", /\bweil\b|\bdass\b|\bobwohl\b|\bwenn\b|veznik|spajanj|spojim|spoji/],
  ["Padezi (dativ/akuzativ/rod)", /pade[zž]|dativ|akuzativ|\bder die das\b|koji je rod|rod imenic|mu[sš]ki rod|[zž]enski rod|srednji rod/],
  ["Modalni glagoli", /modaln|m[oö]gen|m[uü]ssen|k[oö]nnen|d[uü]rfen|wollen|sollen|m[oö]chte/],
  ["Konjunktiv / würde", /konjunktiv|w[uü]rde|h[aä]tte|w[aä]re|kondicional/],
  ["Perfekt / proslo vreme", /perfekt|pro[sš]l|getrunken|gegangen|gegessen|gemacht|partizip/],
  ["Vokabular / pojedinacne reci", /\bre[cč]\b|re[cč]i|vokabular|nova re|kako se ka[zž]e/],
  ["Prevod (trazi prevod)", /prevedi|prevod|[sš]ta zna[cč]i|znaci na nema/],
  ["Razdvojivi glagoli (trennbar)", /razdvoj|trennbar|aufstehen|ansehen|fernsehen|einkaufen|mitkommen/],
  ["Promena vokala (lesen/fahren)", /menja vokal|promena vokal|liest|f[aä]hrt|schl[aä]ft/],
  ["Pisanje / Schreiben (esej, mejl)", /schreiben|esej|sastav|formaln.*mejl|brief/],
  ["Futur / buducnost", /futur|budu[cć]nost|werde |wird /],
  ["Pridevi / komparacija", /pridev|komparativ|superlativ|por[eE]?[dđ]enj/],
];

console.log("TEMA (broj sesija / ukupno pogodaka):");
TOPICS.map(([n, re]) => [n, sessHits(re), hits(re)])
  .sort((a, b) => b[1] - a[1])
  .forEach(([n, s, h]) => console.log(`  ${String(s).padStart(3)} ses / ${String(h).padStart(4)} hit   ${n}`));

console.log("\n--- SIGNALI NAMERE (za prioritizaciju lidova) ---");
const INTENT = [
  ["Ispit (Goethe/OSD/telc/FSP/FIDE)", /ispit|goethe|[oö]sd|telc|fsp|fide|prijemni|polaganj|zertifikat|pr[uü]fung/],
  ["Selidba / Nemacka / viza", /selim|selidb|seliti|u nema[cč]koj|nach deutschland|viza|aufenthalt|nostrifik|spajanje porodic/],
  ["Rok / hitnost", /\brok\b|hitno|[sš]to pre|za mesec|za nedelju|uskoro|do kraja/],
];
INTENT.forEach(([n, re]) => console.log(`  ${String(sessHits(re)).padStart(3)} ses / ${String(hits(re)).padStart(4)} hit   ${n}`));
console.log("\nNapomena: 'Posao/Arbeit' namerno izostavljeno - regex hvata 'arbeiten' kao vežbu (lažno naduvano).\n");
