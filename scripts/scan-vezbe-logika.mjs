// READ-ONLY: logičke greške u vežbama i spoiler mini-vežbama, u svim kursevima.
//
// NE preklapa se sa scan-multi-blank.mjs (markeri ______ i broj odgovora u fill_blank)
// ni sa scan-bank-shortage.mjs (nedovoljno kopija reči u banci). Ovde se traži ono
// što te dve ne vide:
//
//   A) spoiler mini-vežbe (lessons.sections) - razdvojivi glagoli:
//      - neodvojiv glagol (be-, ver-, ent-, er-, ge-, zer-, emp-, miss-) cepan na dva dela
//      - prefiks iz rešenja koji je VEĆ odštampan u rečenici (polaznik ga upiše dvaput)
//      - povratna zamenica predstavljena kao prefiks
//      - broj praznina se ne poklapa sa brojem delova rešenja
//   B) kvizovi - correct_answer koji nije važeći indeks, indeks van opsega,
//      duple ili prazne opcije, kviz bez ponuđenih odgovora
//   C) nedostajući dijakritici (č ć š ž đ) i umlauti (ä ö ü)
//   D) pravilo „naš jezik", ne „srpski" (reči `srpsk` i `Serbisch`)
//
// Pokretanje iz LMS/lms:
//   node scripts/scan-vezbe-logika.mjs                  - ceo sajt
//   node scripts/scan-vezbe-logika.mjs --kurs nemacki-a2-1
//   node scripts/scan-vezbe-logika.mjs --provera A,B    - samo odabrane grupe
//   node scripts/scan-vezbe-logika.mjs --sve            - i nalazi niske pouzdanosti
//
// Izveštaj: vezbe-logika-report.json
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const arg = (ime) => { const i = process.argv.indexOf(ime); return i > -1 ? process.argv[i + 1] : null; };
const samoKurs = arg("--kurs");
const provere = new Set((arg("--provera") || "A,B,C,D").toUpperCase().split(",").map((s) => s.trim()));
const prikaziSlabe = process.argv.includes("--sve");

// Supabase tiho seče na 1000 redova, zato uvek preko .range()
async function svi(tabela, kolone) {
  const out = [];
  for (let od = 0; ; od += 1000) {
    const { data, error } = await sb.from(tabela).select(kolone).range(od, od + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

// replika parseOptions iz src/components/exercises/ExerciseRunner.tsx -
// tip pitanja određuje options.type, NE question_type (koji je često samo "quiz")
function parseOptions(opts, correctAnswer) {
  if (!opts) {
    const ca = (correctAnswer || "").toLowerCase();
    if (ca === "true" || ca === "false") return { type: "true_false", items: null };
    return { type: "quiz", items: [] };
  }
  if (typeof opts === "object" && !Array.isArray(opts) && opts !== null) {
    if (opts.type) return { type: opts.type, items: opts.items ?? null };
  }
  if (Array.isArray(opts)) return { type: "quiz", items: opts };
  if (typeof opts === "string") {
    try {
      const parsed = JSON.parse(opts);
      if (typeof parsed === "object" && parsed?.type) return { type: parsed.type, items: parsed.items };
      if (Array.isArray(parsed)) return { type: "quiz", items: parsed };
    } catch { /* not JSON */ }
    return { type: "quiz", items: [opts] };
  }
  return { type: "quiz", items: [] };
}

// ExerciseRunner rešava ove tipove PRE nego što pogleda options.type
const TIP_PRE_OPCIJA = new Set(["dialog", "speak", "sprechen", "listen_write", "essay", "millionaire"]);

const NEODVOJIVI = ["be", "emp", "ent", "er", "ge", "miss", "ver", "zer", "wider"];
const RAZDVOJIVI = ["ab", "an", "auf", "aus", "bei", "ein", "mit", "nach", "vor", "zu", "zurück",
  "weg", "los", "her", "hin", "fest", "statt", "teil", "zusammen", "fern", "um", "frei", "heim", "vorbei", "entlang"];
const POVRATNE = ["mich", "dich", "sich", "uns", "euch", "mir", "dir"];

// Namerni kontrastni primeri: rešenje koje samo objašnjava da glagol NIJE razdvojiv
// nije greška (vidi B1.2 „Das Paket ist nicht angekommen").
const IZUZETAK = /nije razdvojiv/i;

// Reči koje se LEGITIMNO pišu bez kvačica - inače bi „sto" (Tisch) tražilo „što".
// Spisak raste kad se pojavi nov lažan nalaz.
const BEZ_KVACICA_OK = new Set(["sto", "visi", "deca", "decu", "deci", "posao", "poslu", "posla",
  "prijatelje", "prijatelji", "prijatelja", "razgovaramo", "razgovarate", "razgovaraju", "svejedno",
  "vas", "nas", "sve", "svi", "para", "pare", "kosa", "luk", "sok", "pas", "rana", "cena", "cene"]);

// Parovi gde su OBE varijante prave nemačke reči - „schon" nije loše napisano „schön".
const UMLAUT_OK = new Set(["schon", "musste", "mussten", "konnte", "konnten", "wurde", "durfte",
  "mochte", "fuhr", "ware", "hatte", "tochter", "kochen", "kochte", "anfangen", "hort", "horte",
  "vertrage", "kindergarten", "zahlen", "fordern", "sohn", "wusste", "danke", "magen", "messen",
  "offen", "stehen", "halten", "fallt", "halt", "losung", "sturm", "schwer", "druckt", "stucke"]);

const nalazi = [];
const dodaj = (grupa, pouzdanost, tip, gde, detalj, extra = {}) =>
  nalazi.push({ grupa, pouzdanost, tip, ...gde, detalj, ...extra });

const praznine = (t) => (String(t).match(/_{2,}/g) || []).length;
const delovi = (t) => String(t).split(/\s*(?:…|\.\.\.)\s*/).map((s) => s.trim()).filter(Boolean);
const imaCepanje = (t) => /…|\.\.\./.test(String(t));
const reci = (t) => String(t).toLowerCase().match(/[a-zäöüßčćšžđ]+/g) || [];

// Samo sâmo rešenje, bez objašnjenja: „stützte ... ab (sich abstützen)" -> „stützte ... ab".
// Vraća null za ponuđene odgovore tipa „b) zu - …", jer tu „…" pripada objašnjenju, ne rešenju.
function odgovorJezgro(a) {
  const s = String(a).trim();
  if (/^[a-zA-Z]\)/.test(s)) return null;
  return s.split(/\s+[-–]\s+/)[0].split(/\s+\(/)[0].trim();
}
// Prefiks se traži SAMO u rečenici koja ima praznine - u „Beim Fallen fängt er sich
// mit der Hand ab. Er ___ sich mit der Hand ___ ." prvo „ab" je u zadatoj rečenici.
function klauzaSaPrazninama(q) {
  const recenice = String(q).split(/(?<=[.?!])\s+/).filter((r) => /_{2,}/.test(r));
  return recenice.length ? recenice.join(" ") : String(q);
}
// glagol iz zagrade na kraju pitanja: „Er ___ das Paket ___. (zurückschicken)"
function glagolIzZagrade(t) {
  const m = String(t).match(/\(([^)]{2,40})\)\s*[.?!]?\s*$/);
  if (!m) return null;
  const v = m[1].replace(/^sich\s+/i, "").split(/[,;/]/)[0].trim().toLowerCase();
  return /^[a-zäöüß]+$/.test(v) ? v : null;
}

const courses = await svi("courses", "id, title, slug");
const kursevi = Object.fromEntries(courses.map((c) => [c.id, c.slug || c.title]));
const ciljani = samoKurs ? courses.filter((c) => c.slug === samoKurs).map((c) => c.id) : null;
if (samoKurs && !ciljani.length) { console.error(`Nema kursa sa slug-om "${samoKurs}".`); process.exit(1); }
const uOpsegu = (courseId) => !ciljani || ciljani.includes(courseId);

const lessons = (await svi("lessons", "id, course_id, order_index, title, sections")).filter((l) => uOpsegu(l.course_id));
const lekcijaPo = Object.fromEntries(lessons.map((l) => [l.id, l]));
const exercises = (await svi("exercises", "id, lesson_id, title, exercise_type")).filter((e) => lekcijaPo[e.lesson_id]);
const vezbaPo = Object.fromEntries(exercises.map((e) => [e.id, e]));
const questions = (await svi("exercise_questions", "id, exercise_id, question, options, correct_answer")).filter((q) => vezbaPo[q.exercise_id]);

const gdeLekcija = (l, dodatno) => ({ kurs: kursevi[l.course_id], lekcija: l.title, redosled: l.order_index, lesson_id: l.id, ...dodatno });
const gdeVezba = (q) => {
  const e = vezbaPo[q.exercise_id]; const l = lekcijaPo[e.lesson_id];
  return gdeLekcija(l, { vezba: e.title, question_id: q.id });
};

/* ---------- A) spoiler mini-vežbe: razdvojivi glagoli ---------- */
if (provere.has("A")) {
  for (const l of lessons) {
    const sekcije = Array.isArray(l.sections) ? l.sections : [];
    sekcije.forEach((s, si) => {
      if (s?.type !== "spoiler" || !Array.isArray(s.items)) return;
      s.items.forEach((it, ii) => {
        const Q = String(it.question || ""), A = String(it.answer || "");
        const nb = praznine(Q);
        if (!nb || IZUZETAK.test(A)) return;
        const gde = gdeLekcija(l, { sekcija: `sections[${si}] "${s.title || ""}" item ${ii}`, pitanje: Q, resenje: A });
        const glagol = glagolIzZagrade(Q);
        const uRecenici = reci(klauzaSaPrazninama(Q).replace(/\([^)]*\)\s*$/, ""));
        const jezgro = odgovorJezgro(A);

        if (jezgro && imaCepanje(jezgro)) {
          const d = delovi(jezgro);
          const drugi = (d[1] || "").split(/\s+/)[0].replace(/[.,;:()]/g, "").toLowerCase();

          if (glagol) {
            const pre = NEODVOJIVI.find((p) => glagol.startsWith(p) && !RAZDVOJIVI.some((r) => glagol.startsWith(r)));
            if (pre) {
              dodaj("A", "visoka", "NEODVOJIV_CEPAN", gde,
                `„${glagol}" ima neodvojiv prefiks „${pre}-", a rešenje ga cepa na ${d.length} dela`);
            }
          }
          if (POVRATNE.includes(drugi) && uRecenici.includes(drugi)) {
            dodaj("A", "visoka", "ZAMENICA_DVAPUT", gde,
              `povratna zamenica „${drugi}" je već odštampana u rečenici, a stoji i u rešenju`);
          } else if (RAZDVOJIVI.includes(drugi) && uRecenici.includes(drugi)) {
            // „srednja" namerno: predlozi koji su ujedno prefiksi (auf, an, vor…) se
            // LEGITIMNO javljaju dvaput - „Es prallte auf den Mast auf." Treba ljudska provera.
            dodaj("A", "srednja", "PREFIKS_DVAPUT", gde,
              `prefiks „${drugi}" već stoji u rečenici sa prazninama - proveri da ga polaznik ne upisuje dvaput`);
          }
          if (d.length !== nb) {
            dodaj("A", "srednja", "PRAZNINE_NE_ODGOVARAJU", gde,
              `${nb} praznina, a rešenje je razdvojeno na ${d.length} dela`);
          }
        } else if (jezgro && nb >= 2 && glagol) {
          // razdvojiv glagol, dve praznine, a rešenje nije razdvojeno
          const pre = RAZDVOJIVI.find((p) => glagol.startsWith(p) && glagol.length > p.length + 2);
          const punaRecenica = /^[A-ZÄÖÜ].*[.?!]$/.test(A.trim());
          if (pre && !punaRecenica && delovi(A).length === 1 && A.trim().split(/\s+/).length === 1) {
            dodaj("A", "srednja", "NIJE_RAZDVOJENO", gde,
              `„${glagol}" je razdvojiv i ima ${nb} praznine, a rešenje „${A}" je jedna reč`);
          }
        }

        if (/razdvoj|trennbar/i.test(s.title || "") && glagol) {
          const pre = NEODVOJIVI.find((p) => glagol.startsWith(p) && !RAZDVOJIVI.some((r) => glagol.startsWith(r)));
          if (pre) {
            dodaj("A", "visoka", "NASLOV_OBECAVA_RAZDVOJIV", gde,
              `sekcija se zove „${s.title}", a „${glagol}" nije razdvojiv (${pre}-)`);
          }
        }
      });
    });
  }
}

/* ---------- B) kvizovi ---------- */
if (provere.has("B")) {
  for (const q of questions) {
    const e = vezbaPo[q.exercise_id];
    if (TIP_PRE_OPCIJA.has(e.exercise_type)) continue;
    const { type, items } = parseOptions(q.options, q.correct_answer);
    if (type !== "quiz") continue;
    const gde = { ...gdeVezba(q), pitanje: String(q.question).replace(/\s+/g, " ").slice(0, 120) };
    const opcije = Array.isArray(items) ? items : [];
    const ca = String(q.correct_answer ?? "");

    if (!opcije.length) { dodaj("B", "visoka", "KVIZ_BEZ_OPCIJA", gde, "nema nijedan ponuđen odgovor"); continue; }
    if (!/^\d+$/.test(ca)) {
      dodaj("B", "visoka", "ODGOVOR_NIJE_INDEKS", gde,
        `correct_answer = "${ca}"; QuizExercise radi parseInt pa nijedan klik nije tačan`, { opcije: opcije.map(String) });
      continue;
    }
    const n = Number(ca);
    if (n >= opcije.length) {
      dodaj("B", "visoka", "INDEKS_VAN_OPSEGA", gde, `indeks ${n}, a ima ${opcije.length} opcija`, { opcije: opcije.map(String) });
    }
    const norm = opcije.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x).trim().toLowerCase()));
    const duple = [...new Set(norm.filter((x, i) => norm.indexOf(x) !== i))];
    if (duple.length) dodaj("B", "visoka", "DUPLA_OPCIJA", gde, `opcija se ponavlja: ${duple.join(" | ")}`);
    if (opcije.some((x) => typeof x !== "object" && !String(x).trim())) {
      dodaj("B", "visoka", "PRAZNA_OPCIJA", gde, "jedna od ponuđenih opcija je prazna");
    }
  }
}

/* ---------- C) dijakritici i umlauti ---------- */
if (provere.has("C")) {
  const skiniKvacice = (s) => s.replace(/[šŠ]/g, "s").replace(/[čćČĆ]/g, "c").replace(/[žŽ]/g, "z").replace(/[đĐ]/g, "dj");
  // ß i ss se svode na „s" da bi „dreisig" pronašlo „dreißig"
  const skiniUmlaut = (s) => s.replace(/[äÄ]/g, "a").replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u").replace(/ß/g, "s").replace(/ss/gi, "s");

  // Rečnik se gradi iz CELOG sajta (ne samo iz --kurs), da poređenje ima oslonac.
  const sveLekcije = await svi("lessons", "id, sections");
  const svaPitanja = await svi("exercise_questions", "question, options, correct_answer");
  const kvaciceRec = new Map(), umlautRec = new Map();
  const upisi = (t) => {
    for (const w of String(t).match(/[A-Za-zÄÖÜäöüßČĆŠŽĐčćšžđ]{3,}/g) || []) {
      if (/[čćšžđČĆŠŽĐ]/.test(w)) {
        const k = skiniKvacice(w).toLowerCase();
        kvaciceRec.set(k, (kvaciceRec.get(k) || new Map()).set(w.toLowerCase(), 1));
      }
      if (/[äöüÄÖÜß]/.test(w) && w.length >= 4) {
        const k = skiniUmlaut(w).toLowerCase();
        umlautRec.set(k, (umlautRec.get(k) || new Map()).set(w, 1));
      }
    }
  };
  const broj = new Map();
  const prebroj = (t) => { for (const w of String(t).match(/[A-Za-zÄÖÜäöüßČĆŠŽĐčćšžđ]{3,}/g) || []) { const k = w.toLowerCase(); broj.set(k, (broj.get(k) || 0) + 1); } };
  for (const l of sveLekcije) { upisi(JSON.stringify(l.sections)); prebroj(JSON.stringify(l.sections)); }
  for (const q of svaPitanja) { const t = [q.question, q.correct_answer, JSON.stringify(q.options)].join(" "); upisi(t); prebroj(t); }

  // Ključna provera: gola varijanta je sumnjiva samo ako je RETKA u odnosu na varijantu
  // sa kvačicama. Bez toga nemačko „das" pada na naše „daš", a „Tochter" na „Töchter".
  const PRAG = 3;        // koliko puta oblik sa kvačicama/umlautom mora da postoji drugde
  const MAX_GOLIH = 2;   // ako se goli oblik javlja češće od ovoga, to je prava reč
  const ODNOS = 5;       // i mora biti bar toliko puta ređi od oblika sa kvačicama

  const sumnjivo = (w, recnik, dozvoljeni, kljuc) => {
    const k = w.toLowerCase();
    if (dozvoljeni.has(k)) return null;
    const v = recnik.get(kljuc(w).toLowerCase());
    if (!v) return null;
    const saZnakom = [...v.keys()].reduce((a, b) => a + (broj.get(b.toLowerCase()) || 0), 0);
    const golih = broj.get(k) || 0;
    if (saZnakom < PRAG || golih > MAX_GOLIH || saZnakom < golih * ODNOS) return null;
    return { treba: [...v.keys()].join("/"), saZnakom, golih };
  };

  const proveriTekst = (tekst, gde, polje) => {
    for (const w of String(tekst).match(/[A-Za-zÄÖÜäöüßČĆŠŽĐčćšžđ]{3,}/g) || []) {
      if (/[čćšžđ]/i.test(w)) continue;
      if (!/[äöüß]/i.test(w)) {
        const kv = sumnjivo(w, kvaciceRec, BEZ_KVACICA_OK, skiniKvacice);
        if (kv) {
          dodaj("C", "srednja", "BEZ_KVACICA", { ...gde, polje },
            `„${w}" je verovatno „${kv.treba}" (sa kvačicama ${kv.saZnakom}x, golo ${kv.golih}x)`,
            { isecak: String(tekst).slice(0, 120) });
        }
      }
      if (w.length >= 4 && !/[äöüß]/i.test(w)) {
        const um = sumnjivo(w, umlautRec, UMLAUT_OK, skiniUmlaut);
        if (um) {
          // i uz odnos, parovi tipa Tochter/Töchter prolaze - zato niska pouzdanost
          dodaj("C", "niska", "MOZDA_BEZ_UMLAUTA", { ...gde, polje },
            `„${w}" je možda „${um.treba}" (sa umlautom ${um.saZnakom}x, golo ${um.golih}x) - proveri ručno`,
            { isecak: String(tekst).slice(0, 120) });
        }
      }
    }
  };

  for (const q of questions) {
    const gde = gdeVezba(q);
    proveriTekst(q.question, gde, "pitanje");
    proveriTekst(q.correct_answer, gde, "odgovor");
    const it = parseOptions(q.options, q.correct_answer).items;
    if (Array.isArray(it)) {
      for (const x of it) proveriTekst(typeof x === "object" ? Object.values(x).join(" ") : x, gde, "opcija");
    }
  }
  // naslovi se vide polazniku isto kao i pitanja („Zavrsni ispit A1.1")
  for (const l of lessons) proveriTekst(l.title, gdeLekcija(l, {}), "naslov lekcije");
  for (const e of exercises) {
    const l = lekcijaPo[e.lesson_id];
    proveriTekst(e.title, gdeLekcija(l, { vezba: e.title }), "naslov vežbe");
  }
  // spoiler mini-vežbe nisu u tabeli exercises, a polaznik ih čita
  for (const l of lessons) {
    const sekcije = Array.isArray(l.sections) ? l.sections : [];
    sekcije.forEach((s, si) => {
      if (!Array.isArray(s?.items)) return;
      const gde = gdeLekcija(l, { sekcija: `sections[${si}] "${s.title || s.type}"` });
      proveriTekst(s.title, gde, "naslov sekcije");
      for (const it of s.items) {
        proveriTekst(it?.question ?? it?.front ?? "", gde, "spoiler pitanje");
        proveriTekst(it?.answer ?? it?.back ?? "", gde, "spoiler rešenje");
      }
    });
  }
}

/* ---------- D) pravilo „naš jezik", ne „srpski" ---------- */
if (provere.has("D")) {
  const RE = /srpsk\w*|Serbisch/gi;
  for (const l of lessons) {
    const j = JSON.stringify(l.sections || null);
    for (const m of String(j).matchAll(RE)) {
      dodaj("D", "visoka", "NAS_JEZIK", gdeLekcija(l, { sekcija: "sections" }),
        `„${m[0]}" - koristi „naš jezik" / „kod nas" / „Prevod"`,
        { isecak: j.slice(Math.max(0, m.index - 60), m.index + 60) });
    }
  }
  for (const q of questions) {
    const polja = { pitanje: q.question, odgovor: q.correct_answer, opcije: JSON.stringify(q.options) };
    for (const [polje, t] of Object.entries(polja)) {
      for (const m of String(t ?? "").matchAll(RE)) {
        dodaj("D", "visoka", "NAS_JEZIK", { ...gdeVezba(q), polje },
          `„${m[0]}" - koristi „naš jezik" / „kod nas" / „Prevod"`, { isecak: String(t).slice(0, 120) });
      }
    }
  }
}

/* ---------- izveštaj ---------- */
// u scripts/ jer .gitignore već ima pravilo `scripts/*-report.json`
const izlaz = arg("--json") || "scripts/vezbe-logika-report.json";
writeFileSync(izlaz, JSON.stringify(nalazi, null, 2));

const vidljivi = prikaziSlabe ? nalazi : nalazi.filter((n) => n.pouzdanost !== "niska");
const poTipu = {};
for (const n of nalazi) poTipu[`${n.grupa} ${n.tip} (${n.pouzdanost})`] = (poTipu[`${n.grupa} ${n.tip} (${n.pouzdanost})`] || 0) + 1;

console.log(`Pregledano: ${lessons.length} lekcija, ${exercises.length} vežbi, ${questions.length} pitanja${samoKurs ? ` (kurs ${samoKurs})` : ""}`);
console.log(`Nalaza: ${nalazi.length}${prikaziSlabe ? "" : ` (prikazano ${vidljivi.length}, niska pouzdanost sakrivena - vidi --sve)`}\n`);
for (const [k, v] of Object.entries(poTipu).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);

const red = { visoka: 0, srednja: 1, niska: 2 };
for (const n of vidljivi.sort((a, b) => red[a.pouzdanost] - red[b.pouzdanost])) {
  console.log(`\n[${n.pouzdanost.toUpperCase()}] ${n.tip}`);
  console.log(`  ${n.kurs} | #${n.redosled} ${n.lekcija}${n.vezba ? ` | ${n.vezba}` : ""}${n.sekcija ? ` | ${n.sekcija}` : ""}${n.polje ? ` | ${n.polje}` : ""}`);
  if (n.pitanje) console.log(`  Q: ${n.pitanje}`);
  if (n.resenje) console.log(`  A: ${n.resenje}`);
  if (n.isecak && !n.pitanje) console.log(`  …${String(n.isecak).replace(/\s+/g, " ")}…`);
  console.log(`  -> ${n.detalj}`);
}
console.log(`\nIzveštaj: ${izlaz}`);
