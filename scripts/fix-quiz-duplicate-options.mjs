// Fix quiz questions where a distractor is identical to the correct answer
// (user clicking the duplicate gets marked wrong). Dry-run default; --apply to write.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local","utf8").split("\n")) { const m = raw.replace(/\r$/,"").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g,""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const APPLY = process.argv.includes("--apply");

// id -> { index, expectOld, newVal }
const FIXES = [
  { id:"dcfe32a8-c3af-4453-be43-551429208c6c", index:2, expectOld:"geflogen", newVal:"geflogt" }, // fliegen
  { id:"66884be1-d191-4d8a-9e89-58508e7e9b15", index:2, expectOld:"gelernt",  newVal:"lernte"  }, // lernen
];

function detect(raw){
  if(Array.isArray(raw)) return {fmt:"array", items:raw};
  if(raw && typeof raw==="object" && Array.isArray(raw.items)) return {fmt:"object", items:raw.items, obj:raw};
  if(typeof raw==="string"){ try{const p=JSON.parse(raw); if(Array.isArray(p))return{fmt:"json-array",items:p}; if(p&&Array.isArray(p.items))return{fmt:"json-object",items:p.items,obj:p};}catch{} }
  return null;
}

for(const f of FIXES){
  const { data, error } = await sb.from("exercise_questions").select("id, question, options, correct_answer").eq("id", f.id).single();
  if(error){ console.log(`  ${f.id}: NEMA (${error.message})`); continue; }
  const d = detect(data.options);
  if(!d){ console.log(`  ${f.id}: nepoznat format options`); continue; }
  const cur = d.items[f.index];
  const curVal = typeof cur==="string"?cur:cur?.text;
  if(curVal !== f.expectOld){ console.log(`  ${f.id}: indeks ${f.index} je "${curVal}" (ocekivano "${f.expectOld}") — PRESKACEM (vec izmenjeno?)`); continue; }
  const before = [...d.items];
  if(typeof cur==="string") d.items[f.index]=f.newVal; else d.items[f.index]={...cur, text:f.newVal};
  // re-serialize
  let out;
  if(d.fmt==="array") out=d.items;
  else if(d.fmt==="object"){ out={...d.obj, items:d.items}; }
  else if(d.fmt==="json-array") out=JSON.stringify(d.items);
  else if(d.fmt==="json-object") out=JSON.stringify({...d.obj, items:d.items});
  console.log(`  ${f.id}  (corr=${data.correct_answer})\n    Q: ${String(data.question).replace(/\n/g," ").slice(0,60)}\n    PRE:  ${JSON.stringify(before.map(x=>typeof x==="string"?x:x.text))}\n    POSLE:${JSON.stringify(d.items.map(x=>typeof x==="string"?x:x.text))}`);
  if(APPLY){ const {error:e}=await sb.from("exercise_questions").update({options:out}).eq("id",f.id); console.log(e?`    ERROR ${e.message}`:`    ✓ upisano`); }
}
if(!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
