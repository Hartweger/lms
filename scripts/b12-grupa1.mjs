// B1.2 — Grupa 1: sitne tekstualne/terminološke + par strukturnih izmena.
// Dry-run podrazumevano; --apply za upis. Radi nad parsiranim sekcijama (robusno).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

// helper: deep literal zamena u svim string poljima sekcije
const swap = (sections, pairs) => {
  let s = JSON.stringify(sections);
  const hits = [];
  for (const [from, to] of pairs) {
    const c = s.split(from).length - 1;
    hits.push(`${c}× "${from}" → "${to}"`);
    if (c) s = s.split(from).join(to);
  }
  return { sections: JSON.parse(s), log: hits };
};

// ── transformacije po order_index ─────────────────────────────────────────
const TRANSFORMS = {
  // #1 Höfliche Bitten — ubaci pravilo KII = Präteritum + Umlaut na početak
  1: (sec) => {
    const exists = sec.some((s) => (s.content || "").includes("Kako nastaje Konjunktiv II"));
    if (exists) return { sections: sec, log: ["već ubačeno"] };
    const kii = {
      type: "text",
      style: "info",
      content:
        "## Kako nastaje Konjunktiv II\n\nKonjunktiv II = **Präteritum + Umlaut** (kod nepravilnih glagola):\n\n- *war → wäre*\n- *hatte → hätte*\n- *konnte → könnte*\n- *durfte → dürfte*\n- *wurde → würde*\n\nU praksi za većinu glagola koristiš *würde + Infinitiv*.",
    };
    const out = [...sec];
    out.splice(2, 0, kii); // posle uvodnog info teksta
    return { sections: out, log: ["+1 sekcija (KII pravilo) na poziciji 2"] };
  },

  // #2 Relativsätze mit Präp. — Fem/Mask → padež + „5 koraka" pre vežbi
  2: (sec) => {
    let { sections, log } = swap(sec, [
      ["sich wenden an + Fem.", "sich wenden an + Akk."],
      ["sprechen mit + Mask.", "sprechen mit + Dat."],
      ["von + Plural", "von + Dat."],
      ["sich bewerben um + Fem.", "sich bewerben um + Akk."],
    ]);
    const kIdx = sections.findIndex((s) => (s.content || "").includes("5 koraka za gradnju"));
    const firstSpoiler = sections.findIndex((s) => s.type === "spoiler");
    if (kIdx > -1 && firstSpoiler > -1 && kIdx > firstSpoiler) {
      const [k] = sections.splice(kIdx, 1);
      const ins = sections.findIndex((s) => s.type === "spoiler");
      sections.splice(ins, 0, k);
      log.push(`„5 koraka" pomereno ispred vežbi (sa ${kIdx} na ${ins})`);
    } else log.push(`„5 koraka" — već ispred ili nije nađeno`);
    return { sections, log };
  },

  // #5 Probleme im Büro — skloni reč „Tekst" iz naslova
  5: (sec) => swap(sec, [["Tekst — Richtig oder Falsch?", "Richtig oder Falsch?"]]),

  // #10 Duzen vs. Siezen — „duzanje" → „nepersiranje"
  10: (sec) =>
    swap(sec, [
      ["duzanja i persiranja", "nepersiranja i persiranja"],
      ["brzog duzanja", "brzog nepersiranja"],
      ["brzo duzanje smatra", "brzo nepersiranje smatra"],
    ]),

  // #12 Temporalsätze — „Tipične greške" → „Zapamti" (opcija A)
  12: (sec) => {
    const i = sec.findIndex((s) => s.type === "mistakes");
    if (i < 0) return { sections: sec, log: ["nema mistakes sekcije (već izmenjeno?)"] };
    const out = [...sec];
    out[i] = {
      type: "text",
      style: "info",
      content:
        "## Zapamti\n\n- **bevor**: radnja **glavne** rečenice dešava se PRE *bevor*-radnje → *Bevor ich den Ordner lösche, mache ich eine Sicherungskopie.* (prvo kopija, pa brisanje)\n- **nachdem**: radnja je već ZAVRŠENA pre glavne, zato vreme ide jedan korak unazad (Perfekt → Präsens, Plusquamperfekt → Präteritum).\n- **während**: obe radnje teku istovremeno.",
    };
    return { sections: out, log: [`mistakes[${i}] → „Zapamti" tekst`] };
  },

  // #14 Finalsätze — „Na prvi pogled" → „Zapamti"
  14: (sec) => swap(sec, [["## Na prvi pogled", "## Zapamti"]]),

  // #16 Sind KI-Tools — sažetak kolumne na nemački (konzistentno)
  16: (sec) => {
    const i = sec.findIndex((s) => (s.content || "").includes("Ellas Kolumne"));
    if (i < 0) return { sections: sec, log: ["nema Ellas Kolumne (već izmenjeno?)"] };
    const out = [...sec];
    out[i] = {
      ...out[i],
      content:
        "## Ellas Kolumne (Stadt-Kurier)\n\nMein Kollege Sami hat aus Versehen einen wichtigen Ordner gelöscht – ohne Backup. Zwei Stunden Arbeit waren weg. Wir haben ein KI-Tool heruntergeladen, das gelöschte Dateien wiederherstellt. Es hat funktioniert. Ich war beeindruckt: Die KI hat in drei Minuten geschafft, was wir in zwei Stunden nicht konnten.\n\nAber am nächsten Tag habe ich mit einem KI-Assistenten einen Artikel über das Klima geschrieben. Der Text war technisch perfekt – aber er war so… leer. Keine Meinung, keine Überraschung, kein Gefühl. Meine Frage: Ist das wirklich besser? Oder nur schneller?",
    };
    return { sections: out, log: [`Kolumne[${i}] → pun nemački tekst`] };
  },

  // #20 20 glagola — svih 20 u kartice + zagrade na nemački infinitiv
  20: (sec) => {
    let { sections, log } = swap(sec, [
      ["(javim se)", "(sich melden)"],
      ["(potvrditi)", "(bestätigen)"],
      ["(odbila)", "(ablehnen)"],
      ["(razmisliti)", "(überlegen)"],
    ]);
    const fi = sections.findIndex((s) => s.type === "flashcard");
    if (fi > -1) {
      const items = [
        ["sich melden", "javiti se"], ["zurückschreiben", "odgovoriti pismeno"],
        ["bestätigen", "potvrditi"], ["zustimmen", "složiti se"],
        ["ablehnen", "odbiti"], ["empfehlen", "preporučiti"],
        ["verhandeln", "pregovarati"], ["zugeben", "priznati"],
        ["sich entscheiden", "odlučiti se"], ["überlegen", "razmisliti"],
        ["vermeiden", "izbeći"], ["erreichen", "postići, dostići"],
        ["beantragen", "podneti zahtev"], ["sich kümmern um", "brinuti se o"],
        ["erinnern an", "podsetiti na"], ["sich erinnern an", "setiti se"],
        ["erklären", "objasniti"], ["versichern", "uveriti, osigurati"],
        ["nachschauen", "proveriti, pogledati"], ["vorbeugen", "sprečiti, preduprediti"],
      ].map(([front, back]) => ({ front, back }));
      sections[fi] = { ...sections[fi], items };
      log.push(`flashcard: ${items.length} kartica (svih 20)`);
    }
    return { sections, log };
  },

  // #21 Vremena — ne izjednačavati važnost Plusquamperfekta (redosled ide posebno)
  21: (sec) =>
    swap(sec, [
      [
        "Posebno su važni **Perfekt**, **Präteritum** i **Plusquamperfekt**.",
        "Posebno su važni **Perfekt** i **Präteritum**. *Plusquamperfekt* na B1 uglavnom samo prepoznaješ.",
      ],
    ]),
};

// ── izvršavanje ───────────────────────────────────────────────────────────
const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id);
const byIdx = Object.fromEntries(lessons.map((l) => [l.order_index, l]));

for (const [idx, fn] of Object.entries(TRANSFORMS)) {
  const l = byIdx[idx];
  if (!l) { console.log(`#${idx}: NEMA lekcije`); continue; }
  const before = JSON.stringify(l.sections);
  const { sections, log } = fn(l.sections);
  const changed = JSON.stringify(sections) !== before;
  console.log(`\n#${idx} ${l.title}`);
  log.forEach((x) => console.log("   • " + x));
  if (changed && APPLY) {
    const { error } = await sb.from("lessons").update({ sections }).eq("id", l.id);
    console.log(error ? "   ✗ ERROR " + error.message : "   ✓ upisano");
  } else if (!changed) console.log("   (bez promene)");
}
if (!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
