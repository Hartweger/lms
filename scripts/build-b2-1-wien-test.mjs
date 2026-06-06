// B2.1 — WIEN lekcija: Leseverstehen-test (Zuordnung Hitomi/Leandro/Aleeke). Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";
const EX = "Test: Wien – Leseverstehen";
const CTX = `**Wien am Sonntag – Lieblingsorte**

**Hitomi Sato (Stadtführerin aus Japan):** Nach einer Stadtführung setze ich mich gern in mein Stammlokal am Graben. Die feine Küche kombiniert österreichische Traditionsgerichte mit asiatischen Einflüssen. Hier kann ich auch stundenlang lesen und schreiben.

**Leandro Costa (Instrumentenbauer aus Brasilien):** Mein Lieblingsort liegt außerhalb Wiens: der Nationalpark an der Donau. Sonntags habe ich oft Heimweh. Wenn ich dort die Geräusche der Natur höre, fühle ich mich ein bisschen wie in meiner Heimatstadt Manaus.

**Aleeke Bekono-Gruber (Architekt aus Kamerun):** Sonntags gehe ich gern auf den Turm des Stephansdoms, weil man von dort oben die vielen alten Häuser wunderbar sieht. Übrigens habe ich meiner Frau dort einen Heiratsantrag gemacht.`;
const ITEMS = ["Hitomi (Stadtführerin)", "Leandro (Instrumentenbauer)", "Aleeke (Architekt)"];
const Q = [
  ["Wer arbeitet als Stadtführerin in Wien?", 0],
  ["Wer geht nach der Arbeit gern in sein Stammlokal am Graben?", 0],
  ["In wessen Lieblingslokal verbindet die Küche österreichische und asiatische Einflüsse?", 0],
  ["Wessen Lieblingsort liegt außerhalb Wiens, im Nationalpark?", 1],
  ["Wer fühlt sich in der Natur wie in seiner Heimatstadt Manaus?", 1],
  ["Wer genießt den Blick über Wien vom Turm des Stephansdoms?", 2],
  ["Wer hat seiner Frau auf dem Stephansdom einen Heiratsantrag gemacht?", 2],
];
const { data: l } = await sb.from("lessons").select("id").eq("course_id", CID).eq("title", "WIEN").single();
console.log("WIEN lekcija:", l.id, "| pitanja:", Q.length);
if (!APPLY) { console.log("[DRY]"); process.exit(0); }
await sb.from("exercises").delete().eq("lesson_id", l.id).eq("title", EX);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: l.id, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let i = 0;
for (const [q, c] of Q) { await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: q, options: { type: "quiz", items: ITEMS, context: { type: "text", title: "Wien am Sonntag – Lieblingsorte", content: CTX } }, correct_answer: String(c), question_type: "quiz", order_index: i++ }); }
console.log("✓ Upisan Wien-test (" + Q.length + " pit.)");
