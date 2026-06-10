import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const GO = process.argv[2]==="GO";
const H="65a2d0e8-acbe-4dc1-bcd4-bb2df42c9b31";
const { data: cs } = await sb.from("courses").select("id, slug").eq("course_type","individual");
const cid = s => cs.find(c=>c.slug===s).id;
const C = { A11:cid("individualni-kurs-nemackog-jezika-a11"), A12:cid("individualni-kurs-nemackog-jezika-a1-2"), A21:cid("individualni-kurs-nemackog-jezika-a2"), A22:cid("individualni-kurs-nemackog-jezika-a2-2"), B11:cid("individualni-kurs-nemackog-jezika-b11"), B12:cid("individualni-kurs-nemackog-jezika-b1-2") };
const pd = s => { const p=s.trim().replace(/\.$/,"").split(".").map(x=>x.trim()).filter(Boolean); let[d,m,y]=p; y=y||"2026"; if(y.length===2)y="20"+y; return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`; };
const rows = [
 ["stefantravica980@gmail.com","B11",10,[]],
 ["tijana.tucakov@yahoo.com","A12",7,["09.02","11.02","12.02","12.02"]],
 ["aleksa.cepic@gmail.com","A21",10,["23.01","11.02","23.02","02.03","03.03","09.03","13.03","24.02"]],
 ["nijovan@gmail.com","A22",10,["16.01","20.01","23.01","27.01","30.01","04.02","06.02","11.02"]],
 ["tomislav.jakopanec80@gmail.com","A21",10,["13.02","24.02","27.02","03.03","05.03","10.03","12.03","17.03","24.03","26.03"]],
 ["rina.zlatkovic@gmail.com","A12",4,["01.01","09.01","12.01","16.01"]],
 ["milos.miric.bg@gmail.com","A22",10,["17.03","18.03","23.03","26.03","09.01","14.04","17.04","21.04"]],
 ["veljkonovicic@gmail.com","A22",10,["29.01","03.02","9.2","12.02","26.02","03.03","16.03","25.03","03.04","27.04"]],
 ["nijovan@gmail.com","B11",10,["13.03","17.03","20.03","24.03","26.03","31.03","02.04","07.04","10.04","24.04"]],
 ["toskicmarija98@gmail.com","A11",14,["9.1","12.01","19.01","04.02","20.02","12.03","05.05"]],
 ["nijovan@gmail.com","B12",10,["30.04","05.05","08.05","12.05","15.05","19.05","22.05","28.05","29.05","02.06"]],
 ["aleksa.cepic@gmail.com","A22",10,["19.03","26.03","10.04","15.04","28.04","14.05","21.05","27.05","29.05","03.06"]],
 ["tomislav.jakopanec80@gmail.com","A22",10,["14.04","16.04","21.04","23.04","29.04","04.05","18.05","20.05","03.06","09.06"]],
];
const month={}; let total=0;
console.log(GO?"=== UNOS ARHIVE ===":"=== DRY arhiva (status=završeno) ===");
for(const [email,lvl,pkg,dates] of rows){
  const {data:p}=await sb.from("user_profiles").select("id,full_name").eq("email",email).single();
  const course=C[lvl];
  const {data:ex}=await sb.from("individual_enrollments").select("id").eq("user_id",p.id).eq("professor_id",H).eq("course_id",course).maybeSingle();
  if(ex){ console.log(`SKIP ${p.full_name} ${lvl} — već postoji`); continue; }
  const iso=dates.map(pd);
  for(const d of iso){ const m=d.slice(0,7); month[m]=(month[m]||0)+1; total++; }
  console.log(`${p.full_name.padEnd(24)} | ${lvl} | ${iso.length} časova`);
  if(GO){
    const {data:enr,error}=await sb.from("individual_enrollments").insert({user_id:p.id,professor_id:H,course_id:course,package_lessons:pkg,lessons_used:iso.length,status:"completed"}).select("id").single();
    if(error){console.log("  GREŠKA:",error.message);continue;}
    for(const d of iso) await sb.from("individual_lessons").insert({enrollment_id:enr.id,professor_id:H,lesson_date:d});
    const {data:ps}=await sb.from("professor_students").select("id").eq("professor_id",H).eq("student_id",p.id).eq("course_id",course).maybeSingle();
    if(!ps) await sb.from("professor_students").insert({professor_id:H,student_id:p.id,course_id:course,assigned_via:"individual"});
  }
}
console.log("\nUKUPNO arhiva:",total,"časova =",(total*1400).toLocaleString("de-DE"),"RSD (×1400)");
console.log("Po mesecima (individualni):");
for(const [m,n] of Object.entries(month).sort()) console.log(`  ${m}: ${n} × 1400 = ${(n*1400).toLocaleString("de-DE")} RSD`);
