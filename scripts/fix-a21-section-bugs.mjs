// Targeted A2.1 sections fixes: duzen flashcard + W-Fragen framing. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env={}; for(const raw of readFileSync(".env.local","utf8").split("\n")){const m=raw.replace(/\r$/,"").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");}
const sb=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const APPLY=process.argv.includes("--apply");
const { data: course } = await sb.from("courses").select("id").eq("slug","nemacki-a2-1").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, sections").eq("course_id",course.id);
const byIdx = Object.fromEntries(lessons.map(l=>[l.order_index,l]));

// order_index -> [ [from, to], ... ] (literal replace u JSON stringu)
const FIXES = {
  1:  [["Poveži upitnu reč sa pitanjem:", "Pregled upitnih reči i odgovarajućih pitanja:"]],
  12: [["persirati na 'ti'", "obraćati se sa 'ti' (neformalno)"]],
};
for(const [idx, repls] of Object.entries(FIXES)){
  const l = byIdx[idx]; if(!l){ console.log(`order_index ${idx}: nema lekcije`); continue; }
  let s = JSON.stringify(l.sections); let n=0;
  for(const [from,to] of repls){ const c=s.split(from).length-1; if(c){ s=s.split(from).join(to); n+=c; console.log(`  [${idx}] ${c}× "${from}" → "${to}"`);} else console.log(`  [${idx}] NEMA "${from}" (već izmenjeno?)`); }
  if(n && APPLY){ const {error}=await sb.from("lessons").update({sections:JSON.parse(s)}).eq("id",l.id); console.log(error?`    ERROR ${error.message}`:`    ✓ upisano`); }
}
if(!APPLY) console.log("\nDry-run — --apply za upis.");
