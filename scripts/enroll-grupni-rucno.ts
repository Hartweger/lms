/**
 * Ručni grupni upis — ceo tok kao grantAccessForOrder (grupni deo), bez porudžbine.
 * Upis + pristup + professor_students + GAS enroll (Meet gost, prof Sheet, beleške) + mejlovi.
 *   npx tsx scripts/enroll-grupni-rucno.ts <email> <group_id>
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs"; import * as path from "path";

for (const file of ["../.env.local", "../.env.production"]) {
  const p = path.resolve(__dirname, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
  }
}

import { sendGrupniWelcomeEmail, sendProfNewStudentEmail } from "../src/lib/email";
import { callGas } from "../src/lib/gas";
import { nextExpiry, computeSeats } from "../src/lib/groups";

const email = (process.argv[2] || "").toLowerCase().trim();
const groupId = process.argv[3] || "";
if (!email.includes("@") || !groupId) { console.error("Upotreba: npx tsx scripts/enroll-grupni-rucno.ts <email> <group_id>"); process.exit(1); }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: group, error: gerr } = await sb.from("groups")
    .select("id, level, status, max_seats, manual_enrolled, gcal_event_id, meet_link, notes_url, professor_id, content_course_id, professor:professor_id(full_name, email)")
    .eq("id", groupId).single();
  if (gerr || !group) throw new Error(`Grupa ne postoji: ${gerr?.message}`);
  const nivo = group.level as string;

  const { data: prof0 } = await sb.from("user_profiles").select("id, full_name").eq("email", email).maybeSingle();
  if (!prof0?.id) throw new Error(`Nema profila za ${email} — prvo napravi nalog`);
  const uid = prof0.id as string;
  const studentName = (prof0.full_name as string) || "";

  const { count } = await sb.from("group_enrollments").select("*", { count: "exact", head: true })
    .eq("group_id", group.id).eq("status", "active");
  const seats = computeSeats({ maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled, activeEnrollments: count ?? 0 });
  if (seats.full) throw new Error(`Grupa ${nivo} je puna (${seats.enrolled}/${group.max_seats})`);

  const { error: eerr } = await sb.from("group_enrollments").upsert(
    { group_id: group.id, user_id: uid, status: "active", enrolled_at: new Date().toISOString(), cancelled_at: null },
    { onConflict: "group_id,user_id" },
  );
  if (eerr) throw new Error(`group_enrollments: ${eerr.message}`);
  console.log(`✓ Upis u grupu ${nivo} (${seats.enrolled + 1}/${group.max_seats})`);

  if (group.content_course_id) {
    const { data: cur } = await sb.from("course_access")
      .select("expires_at").eq("user_id", uid).eq("course_id", group.content_course_id).maybeSingle();
    const curMs = cur?.expires_at ? new Date(cur.expires_at).getTime() : null;
    const finalExp = new Date(nextExpiry(curMs)).toISOString();
    const { error: cerr } = await sb.from("course_access").upsert(
      { user_id: uid, course_id: group.content_course_id, expires_at: finalExp, source: "grupa-rucni-unos" },
      { onConflict: "user_id,course_id" },
    );
    if (cerr) throw new Error(`course_access: ${cerr.message}`);
    console.log(`✓ Pristup sadržajnom kursu do ${finalExp.slice(0, 10)}`);
  }

  if (group.professor_id && group.content_course_id) {
    const { error: perr } = await sb.from("professor_students").upsert(
      { professor_id: group.professor_id, student_id: uid, course_id: group.content_course_id, assigned_via: "group" },
      { onConflict: "professor_id,student_id,course_id", ignoreDuplicates: true },
    );
    if (perr) console.error(`professor_students: ${perr.message}`); else console.log("✓ professor_students veza");
  }

  const prof = (Array.isArray(group.professor) ? group.professor[0] : group.professor) as { full_name?: string; email?: string } | null;
  const profIme = prof?.full_name || "";

  if (group.gcal_event_id) {
    await callGas("enroll", { nivo, prof: profIme, eventId: group.gcal_event_id, studentEmail: email, studentName });
    console.log("✓ GAS enroll (Meet gost + prof Sheet + beleške)");
  } else {
    console.warn("⚠ Grupa nema gcal_event_id — GAS enroll preskočen");
  }

  await sendGrupniWelcomeEmail(email, studentName, { nivo, profIme, meetLink: group.meet_link, notesUrl: group.notes_url });
  console.log(`✓ Welcome mejl → ${email}`);

  if (prof?.email) {
    await sendProfNewStudentEmail(prof.email, profIme, { nivo, studentName, studentEmail: email });
    console.log(`✓ Mejl profesorki → ${prof.email}`);
  }
  console.log("GOTOVO.");
}

main().catch((e) => { console.error("GREŠKA:", e.message || e); process.exit(1); });
