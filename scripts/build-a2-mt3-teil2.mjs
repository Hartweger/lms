import { readFileSync } from "node:fs"; import { createClient } from "@supabase/supabase-js";
const env={}; for(const r of readFileSync(".env.local","utf8").split("\n")){const m=r.replace(/\r$/,"").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");}
const sb=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const APPLY=process.argv.includes("--apply");
const EX="ba9fea2e-f719-4ca1-b4d9-c308dd5de6e3";
const grid='<br><img src="/audio/hoeren-mt3/teil2-grid.png" alt="9 Bilder a–i (Kurse)" class="rounded-lg">';
const head='<strong>Hören Teil 2</strong> — Slušaj razgovor (1×). Koji kurs pohađa svaka osoba? Izaberi sliku (a–i). Primer: <em>Annette → f</em>.<br><br>';
const items=["a","b","c","d","e","f","g","h","i"];
const T2=[
  {p:"Welchen Kurs besucht Thomas?", c:"0"}, // a
  {p:"Welchen Kurs besucht Martin?", c:"3"}, // d
  {p:"Welchen Kurs besucht Sarah?",  c:"8"}, // i
  {p:"Welchen Kurs besucht Erik?",   c:"6"}, // g
  {p:"Welchen Kurs besucht Julia?",  c:"4"}, // e
];
// idempotencija
const { data: existing } = await sb.from("exercise_questions").select("id,question,order_index").eq("exercise_id",EX);
if(existing.some(q=>q.question.includes("Hören Teil 2"))){ console.log("Teil 2 već postoji — preskačem"); process.exit(0); }
console.log(`Trenutno ${existing.length} pitanja. Reorder: Teil4(10-14)→15-19, Teil3(5-9)→10-14, ubaci Teil2 na 5-9`);
if(APPLY){
  // 1) Teil4 (order 10-14) -> 15-19  (radi od najvišeg da nema kolizije)
  for(const q of existing.filter(q=>q.order_index>=10).sort((a,b)=>b.order_index-a.order_index)){
    await sb.from("exercise_questions").update({order_index:q.order_index+5}).eq("id",q.id);
  }
  // 2) Teil3 (order 5-9) -> 10-14
  for(const q of existing.filter(q=>q.order_index>=5&&q.order_index<10).sort((a,b)=>b.order_index-a.order_index)){
    await sb.from("exercise_questions").update({order_index:q.order_index+5}).eq("id",q.id);
  }
  // 3) ubaci Teil2 na 5-9
  const rows=T2.map((t,i)=>({exercise_id:EX, question:(i===0?head:"")+`<strong>${6+i}.</strong> ${t.p}`+grid, options:{type:"quiz",items}, correct_answer:t.c, explanation:null, audio_url:"/audio/hoeren-mt3/teil2.mp3", order_index:5+i}));
  const { error }=await sb.from("exercise_questions").insert(rows);
  console.log(error?`ERROR: ${error.message}`:`✓ Teil 2 (5 pitanja) ubačen; ukupno ${existing.length+5}`);
} else console.log("(dry-run)");
