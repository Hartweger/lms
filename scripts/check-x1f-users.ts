import { createClient } from "@supabase/supabase-js";
import * as fs from "fs"; import * as path from "path";
const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath,"utf-8").split("\n")) {
  const [k,...v]=line.split("="); if(k&&v.length&&!process.env[k.trim()])process.env[k.trim()]=v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const emails = ["katarina.milenkovic@x1f.one","zarko.bogicevic@x1f.one","marko.milosavljevic@x1f.one","aleksandar.stanojevic@x1f.one"];
async function main(){
  const { data: courses } = await sb.from("courses").select("id,slug,title").in("slug",["nemacki-a1-1","nemacki-a1-2"]);
  console.log("COURSES:", JSON.stringify(courses));
  const { data: profs } = await sb.from("user_profiles").select("id,email,full_name").in("email", emails);
  console.log("EXISTING PROFILES:", JSON.stringify(profs));
  for (const p of (profs||[])) {
    const { data: acc } = await sb.from("course_access").select("course_id,expires_at,source").eq("user_id", p.id);
    console.log("  access", p.email, JSON.stringify(acc));
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
