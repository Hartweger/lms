// B1.2 — Grupa 2A (sadržaj): Provera→Zapamti u Schreiben Teil 1/2/3 + nov zadatak/primer u Teil 2.
// Dry-run podrazumevano; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const TRANSFORMS = {
  // #22 Schreiben Teil 1 — „Provera" spoiler → „Zapamti" tekst
  22: (sec) => {
    const i = sec.findIndex((s) => s.type === "spoiler" && (s.title || "").startsWith("Provera"));
    if (i < 0) return { sections: sec, log: ["nema Provera spoilera (već izmenjeno?)"] };
    const out = [...sec];
    out[i] = {
      type: "text", style: "info",
      content:
        "## Zapamti — pre nego što predaš\n\n- **Anrede + potpis** su obavezni: oslovi osobu imenom i potpiši se. Bez toga gubiš poene na koherentnosti.\n- Obradi **sve tri tačke** (beschreiben, begründen, Vorschlag) — svaka nosi poene.\n- Obraćaš se sa **du** i imenom (neformalno).",
    };
    return { sections: out, log: [`Provera spoiler[${i}] → „Zapamti"`] };
  },

  // #23 Schreiben Teil 2 — nov zadatak (bez Cornelsena) + Stichpunkte + naš primer + Provera→Zapamti
  23: (sec) => {
    const out = [...sec];
    const log = [];
    const ti = out.findIndex((s) => (s.content || "").includes("Gewalt im Fernsehen"));
    if (ti > -1) {
      out[ti] = {
        type: "text", style: "uebung",
        content:
          "## Zadatak\n\nU onlajn forumu jednog časopisa pročitaš komentar na temu **mobilni telefoni u školi**:\n\n> **Markus:** „Handys gehören nicht in die Schule! Die Schüler sind nur abgelenkt und lernen nichts mehr. Ein Verbot wäre die beste Lösung.“\n\nNapiši svoje mišljenje (oko **80 reči**): da li se slažeš sa Markusom? Obrazloži stav sa bar dva argumenta i predloži rešenje.",
      };
      log.push(`zadatak[${ti}] (Cornelsen „Gewalt") → naš „Handys in der Schule"`);
    }
    const si = out.findIndex((s) => (s.content || "").includes("Beleške za ovaj zadatak"));
    if (si > -1) {
      out[si] = {
        type: "text", style: "default",
        content:
          "## Beleške za ovaj zadatak (Stichpunkte)\n\n- Handys nützlich: schnell Informationen suchen, Wörterbuch-Apps, Kontakt mit den Eltern\n- aber: Ablenkung im Unterricht, weniger Konzentration\n- Lösung: kein komplettes Verbot — nur in den Pausen oder mit Erlaubnis des Lehrers",
      };
      log.push(`Stichpunkte[${si}] → usklađeno sa novim zadatkom`);
    }
    const mi = out.findIndex((s) => (s.content || "").includes("Musterlösung — uzorni komentar"));
    if (mi > -1) {
      out[mi] = {
        type: "text", style: "beispiele",
        content:
          "## Primer rešenja\n\n*Das Thema „Handys in der Schule\" finde ich sehr wichtig. Einerseits hat Markus recht: Im Unterricht lenken Handys oft ab und die Schüler konzentrieren sich weniger. Andererseits bin ich gegen ein komplettes Verbot. Ein Handy kann auch nützlich sein — man kann schnell Informationen suchen oder eine Wörterbuch-App benutzen. Meiner Meinung nach sollte man Handys nur in den Pausen oder mit Erlaubnis des Lehrers erlauben. So sind die Schüler nicht abgelenkt, können das Handy aber trotzdem sinnvoll nutzen.*\n\n💡 Struktura: **uvod (tema) → stav → argument → druga strana → zaključak/rešenje.**",
      };
      log.push(`Musterlösung[${mi}] (Cornelsen) → naš primer rešenja`);
    }
    const pi = out.findIndex((s) => s.type === "spoiler" && (s.title || "").startsWith("Provera"));
    if (pi > -1) {
      out[pi] = {
        type: "text", style: "info",
        content:
          "## Zapamti\n\n- Imaj **jasan stav** (za ili protiv) — mišljenje mora biti prepoznatljivo, ne neodlučno.\n- Daj **bar dva argumenta** (weil/denn/deshalb, Einerseits… andererseits…).\n- Drži se **~80 reči** — prekratko gubi poene za ispunjenje zadatka.",
      };
      log.push(`Provera spoiler[${pi}] → „Zapamti"`);
    }
    return { sections: out, log };
  },

  // #24 Schreiben Teil 3 — „Provera" spoiler → „Zapamti" tekst
  24: (sec) => {
    const i = sec.findIndex((s) => s.type === "spoiler" && (s.title || "").startsWith("Provera"));
    if (i < 0) return { sections: sec, log: ["nema Provera spoilera (već izmenjeno?)"] };
    const out = [...sec];
    out[i] = {
      type: "text", style: "info",
      content:
        "## Zapamti\n\n- Obraćaš se sa **Sie** (poluformalno, sa prezimenom) — nikad du/euch.\n- **Anrede i pozdrav** na kraju su obavezni — bez njih gubiš poene.\n- Obradi **sve tri stvari**: zahvalnost + izvinjenje + razlog.",
    };
    return { sections: out, log: [`Provera spoiler[${i}] → „Zapamti"`] };
  },
};

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
