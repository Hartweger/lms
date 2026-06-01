// (A) L2 Familie: zameni placeholder odgovore u spoileru "Pitanja za razgovor"
//     pravim Musterantworten.
// (B) L25 Krimi: dodaj mini-Krimi tekst + Leseverstehen pitanja (prava vežba).
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const FAMILIE = "1ff97f3a-fb10-4bb4-ba55-6f81eb359749";
const KRIMI = "2e3e079b-7dd2-4d20-a5a3-c82ddf01bf9e";

const FAMILIE_ITEMS = [
  { question: "Haben Sie Geschwister? Wie viele, wie alt sind sie?", answer: "Beispiel: Ja, ich habe einen Bruder und eine Schwester. Mein Bruder ist 25, meine Schwester ist 19. (oder: Nein, ich bin Einzelkind.)" },
  { question: "In welchen Ländern haben Sie Verwandte?", answer: "Beispiel: Ich habe Verwandte in Serbien und in Österreich. Meine Tante lebt in Wien." },
  { question: "Gibt es in Ihrer Familie regelmäßig ein Familienfest?", answer: "Beispiel: Ja, wir feiern jedes Jahr Weihnachten zusammen. Die ganze Familie kommt zu meiner Oma." },
  { question: "Was ist besser: eine große oder eine kleine Familie? Warum?", answer: "Beispiel: Ich finde eine große Familie besser, weil immer jemand für dich da ist. (oder: eine kleine Familie, weil es ruhiger ist.)" },
];

const KRIMI_MARKER = "Mini-Krimi: Der gestohlene Laptop";
const KRIMI_SECTIONS = [
  { type: "text", style: "default", content: "## Mini-Krimi: Der gestohlene Laptop\n\nPročitaj kratku krimi priču i odgovori na pitanja — odlična vežba čitanja (Leseverstehen)." },
  { type: "text", style: "beispiele", content: "Am Montag kommt Frau Berger ins Büro. Ihr Laptop ist weg! „Wo ist mein Laptop?“, ruft sie. Am Freitag war er noch da.\n\nDrei Personen haben einen Schlüssel zum Büro: Herr Klein, Frau Wolf und der Hausmeister Herr Schmidt.\n\nHerr Klein sagt: „Ich war am Wochenende in Hamburg.“ Frau Wolf sagt: „Ich war krank zu Hause.“ Herr Schmidt sagt: „Ich habe am Samstag das Büro geputzt. Die Tür war offen.“\n\nDie Polizei kommt. Auf dem Schreibtisch von Herrn Schmidt findet sie den Laptop von Frau Berger." },
  { type: "spoiler", title: "Leseverstehen — Wer war es?", items: [
    { question: "Was ist passiert?", answer: "Der Laptop von Frau Berger wurde gestohlen — er ist weg." },
    { question: "Wann war der Laptop noch da?", answer: "Am Freitag." },
    { question: "Wer hat einen Schlüssel zum Büro?", answer: "Herr Klein, Frau Wolf und der Hausmeister Herr Schmidt." },
    { question: "Wo war Herr Klein am Wochenende?", answer: "In Hamburg." },
    { question: "Wer hat am Samstag das Büro geputzt?", answer: "Herr Schmidt, der Hausmeister." },
    { question: "Wer war es wahrscheinlich? Warum?", answer: "Wahrscheinlich Herr Schmidt — die Polizei findet den Laptop auf seinem Schreibtisch, und nur er war am Samstag im Büro." },
  ] },
];

// ── (A) Familie ──
{
  const { data: l } = await sb.from("lessons").select("title, sections").eq("id", FAMILIE).single();
  const secs = l.sections || [];
  const idx = secs.findIndex((s) => s.type === "spoiler" && s.title === "Pitanja za razgovor");
  if (idx === -1) { console.log("Familie: spoiler 'Pitanja za razgovor' nije nađen"); }
  else if (!JSON.stringify(secs[idx].items).includes("Odgovori slobodno") && JSON.stringify(secs[idx].items).includes("Beispiel")) {
    console.log("Familie: već ima Musterantworten — preskačem");
  } else {
    console.log(`Familie: zamenjujem ${secs[idx].items.length} placeholder odgovora pravim Musterantworten`);
    if (APPLY) {
      const next = [...secs];
      next[idx] = { ...secs[idx], items: FAMILIE_ITEMS };
      const { error } = await sb.from("lessons").update({ sections: next }).eq("id", FAMILIE);
      console.log(error ? `  ERROR: ${error.message}` : "  ✓ upisano");
    }
  }
}

// ── (B) Krimi ──
{
  const { data: l } = await sb.from("lessons").select("title, sections").eq("id", KRIMI).single();
  const secs = l.sections || [];
  if (JSON.stringify(secs).includes(KRIMI_MARKER)) { console.log("Krimi: mini-Krimi već postoji — preskačem"); }
  else {
    console.log(`Krimi: dodajem mini-Krimi tekst + Leseverstehen (${KRIMI_SECTIONS.length} sekcije)`);
    if (APPLY) {
      const { error } = await sb.from("lessons").update({ sections: [...secs, ...KRIMI_SECTIONS] }).eq("id", KRIMI);
      console.log(error ? `  ERROR: ${error.message}` : `  ✓ upisano (${secs.length + KRIMI_SECTIONS.length} sekcija)`);
    }
  }
}
if (!APPLY) console.log("\nDry-run — --apply za upis.");
