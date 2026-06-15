/**
 * Sends migration emails to A1 users who have been migrated to the new LMS.
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && \
 *   RESEND_API_KEY=re_xxx npx tsx scripts/send-migration-emails.ts
 *
 * Add --dry-run to preview without sending.
 * Add --filter=a1 to send only to A1 users (default: a1)
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");
const resend = DRY_RUN ? null : new Resend(process.env.RESEND_API_KEY!);
const FROM = "Hartweger <info@hartweger.rs>";

// A1 course slugs
const A1_SLUGS = ["nemacki-a1-1", "nemacki-a1-2"];

// Already emailed via MailerLite "LMS migracija - istice pristup" group (27 users)
const ALREADY_EMAILED = new Set([
  "minacv@gmail.com",
  "maminozlatozlatno@gmail.com",
  "aleksandarpmau@gmail.com",
  "kajchy97@gmail.com",
  "aleksa.cepic@gmail.com",
  "nikolinjovana97@gmail.com",
  "alekspop73@gmail.com",
  "maja_kocec@hotmail.com",
  "svetiel@yahoo.de",
  "darkocep@gmail.com",
  "natalijajelicic19@gmail.com",
  "gajevicr@gmail.com",
  "kostic.milan@outlook.com",
  "malesevicviktorija94@gmail.com",
  "tanjadomazet@hotmail.com",
  "katarinaicic1804@gmail.com",
  "ivanamilivojevic997@gmail.com",
  "dulabict@gmail.com",
  "ana.grujicic2006@gmail.com",
  "lunasoradi1@gmail.com",
  "ante.duzel19@gmail.com",
  "nikiknezevic19@icloud.com",
  "nincetovic.tijana22@gmail.com",
  "pavlovzana@gmail.com",
  "am.mircic@icloud.com",
  "treskavicamarko99@gmail.com",
  "nikolic.miki95@gmail.com",
  // Dec 2025 batch
  "vmaksic.99@gmail.com",
  "isidorahygge@gmail.com",
  "milenamina986@yahoo.com",
  "danijeladjokic08@gmail.com",
  "micapetakovic03@gmail.com",
  "milan986antic@gmail.com",
  "tamarajokic17@gmail.com",
  "janaamb002@gmail.com",
  "radojcictanja@yahoo.com",
  "milovan_milic@yahoo.com",
  "nikola793110@gmail.com",
  "susasladjana8@gmail.com",
  "ristic.maja017@gmail.com",
  "djuricatara05@gmail.com",
  "jan.educate25@gmail.com",
  "anitalukic1979@gmail.com",
  "stodorovic99@gmail.com",
  // radojcicexdjukictanja@gmail.com already in Nov list
  "sasa.nedin2@gmail.com",
  "mylosmilos@gmail.com",
  // uros1996ljube@gmail.com already in Sep list
  "radojicicmilos2000@gmail.com",
  "agansaulic@gmail.com",
  "nkozoderovic00@gmail.com",
  "stefanija.ristomanova@yahoo.com",
  // Nov 2025 batch
  "rina.zlatkovic@gmail.com",
  "budimir.zorica@gmail.com",
  "dusandimitrijevic98@gmail.com",
  "slavicastanojkoviclavica@gmail.com",
  "trifunovicb97@gmail.com",
  "duhpetar@gmail.com",
  "milicaivanbanjac@gmail.com",
  "milosevicnastasija@gmail.com",
  "bojana.maric@gmx.de",
  "marinagrubor96@gmail.com",
  "tijana.cekovic97@gmail.com",
  "edina.mr@icloud.com",
  "marija.gardzic82@gmail.com",
  "mijatfon@gmail.com",
  "aleksandra.vulisic@gmail.com",
  "mirjana.de71@gmail.com",
  "kperic2004@gmail.com",
  "vranicbranko88@gmail.com",
  "tajla87@live.de",
  // tijana.tucakov@yahoo.com already in Oct list
  "jelenapetrov03@gmail.com",
  "danieldopudja4@gmail.com",
  "mirjanazgalecic@gmail.com",
  "joksimovicsanja86@gmail.com",
  "emilija.lukic4@gmail.com",
  "radojcicexdjukictanja@gmail.com",
  "aleksandar.stevanovic.zre@gmail.com",
  "cvetanovic26@gmail.com",
  "jovana.jasovic12@gmail.com",
  // Oct 2025 batch
  "andjelicajocko@gmail.com",
  "dardaniadomuskennel@gmail.com",
  "nikola017marinkovic@gmail.com",
  "ivanco226@gmail.com",
  "isrnic28@gmail.com",
  "nenadstanujkic@gmail.com",
  "tacakosta@gmail.com",
  "aminabebabah@gmail.com",
  "daliborka.beljean@gmail.com",
  "tijana.tucakov@yahoo.com",
  "goca.mitic88@gmail.com",
  "tanja.zivanovic983@gmail.com",
  "alimpije.markovic00@gmail.com",
  "draganbrestovac1@gmail.com",
  "nemanja1993pn@gmail.com",
  "antonija.iphone@outlook.com",
  "snezanamilunovic@yahoo.com",
  "bojana.business@gmail.com",
  // gajevicr@gmail.com already in MailerLite list
  // Sep 2025 batch
  "radivojevicivana12@gmail.com",
  "minakocec@gmail.com",
  "nina1999zivanovic@gmail.com",
  "mladenstojkovic.rg@gmail.com",
  "amilevic@yahoo.com",
  "uros1996ljube@gmail.com",
  "ilic.biljana@hotmail.com",
  "j.maksimovic.acc@gmail.com",
  "marina.dragovic00@gmail.com",
  "kamma2610@hotmail.com",
  "dajanadzindo@gmail.com",
  "ftodorovic58@gmail.com",
  "4dragana4@gmail.com",
  "suzana.paunovic96@gmail.com",
  "danijelapastronjevic@gmail.com",
  "kurcubictamara042@gmail.com",
  // Aug 2025 batch — A1/paket kupci
  "jovana.stojanovicka@gmail.com",
  "ddanka.sarvanovic@gmail.com",
  "anjajeremic98@gmail.com",
  "aleksandar.rakic@yahoo.com",
  "jmrkosic@gmail.com",
  "mulequebre@gmail.com",
  "bojana95p@gmail.com",
  "nikoladvizac777@gmail.com",
  "marina1nikolic@gmail.com",
  "jelena.vukas@yahoo.com",
  "marijanaimarkovic7@gmail.com",
  "savictanja99@gmail.com",
  "ivanamclmc@gmail.com",
]);

function buildMigrationEmail(name: string, courses: string[], expiresAt: string): string {
  const courseList = courses.map((t) => `<li style="margin-bottom: 4px;">${t}</li>`).join("\n");
  const expiryDate = new Date(expiresAt).toLocaleDateString("sr-Latn-RS", {
    day: "numeric", month: "long", year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" style="width: 120px; height: auto;" />
      </div>

      <h1 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">
        Zdravo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px;">
        Vaš kurs nemačkog se sada nalazi na <strong>novoj platformi</strong> — <a href="https://www.hartweger.rs" style="color: #4fb1d3; text-decoration: none; font-weight: 600;">www.hartweger.rs</a>. Platforma radi u svakom browseru, na telefonu i na računaru. Brža je, preglednija i prilagođena za učenje u pokretu.
      </p>

      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Vaši kursevi</div>
        <ul style="font-size: 14px; color: #1a1a2e; margin: 0; padding-left: 18px;">${courseList}</ul>
        <div style="font-size: 12px; color: #999; margin-top: 8px;">Pristup do: ${expiryDate}</div>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 8px;">
        <strong>Kako da se prijavite:</strong>
      </p>
      <ol style="font-size: 14px; line-height: 1.7; color: #444; margin: 0 0 20px; padding-left: 20px;">
        <li>Kliknite dugme ispod</li>
        <li>Unesite svoju email adresu (ovu na koju čitate mejl)</li>
        <li>Dobićete link za prijavu na email — kliknite na njega i gotovo!</li>
      </ol>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://www.hartweger.rs/prijava" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Prijavi se na novu platformu
        </a>
      </div>

      <div style="background: #f0faf0; border-left: 3px solid #34d399; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px;">Šta vas čeka na novoj platformi?</div>
        <ul style="font-size: 13px; line-height: 1.7; color: #444; margin: 0; padding-left: 18px;">
          <li><strong>Priručnik u PDF-u</strong> — kompletna gramatika i vokabular za vaš nivo</li>
          <li><strong>WhatsApp grupa</strong> — povežite se sa drugim učenicima</li>
          <li><strong>Interaktivne vežbe</strong> — kvizovi, kartice, prevodi, dijalozi</li>
          <li><strong>NaKI</strong> — AI asistent koji vam pomaže sa nemačkim</li>
        </ul>
        <p style="font-size: 13px; color: #666; margin: 8px 0 0;">Sve se nalazi u <strong>Willkommen</strong> lekciji na početku kursa.</p>
      </div>

      <div style="background: #faf9f7; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <p style="font-size: 13px; line-height: 1.6; color: #666; margin: 0;">
          <strong>Napomena:</strong> Stara platforma (hartweger.rs/moj-nalog) nastavlja da radi do septembra 2026. Preporučujemo da što pre pređete na novu platformu jer su tamo svi novi sadržaji i vežbe.
        </p>
      </div>

      <div style="background: #faf9f7; border-radius: 10px; padding: 20px; margin: 0;">
        <div style="font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px;">
          Instalirajte aplikaciju na telefon
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 0 0 12px;">
          Pristupajte lekcijama direktno sa početnog ekrana — bez otvaranja browsera. Izgleda kao prava aplikacija!
        </p>
        <a href="https://www.hartweger.rs/instaliraj" style="display: inline-block; background: white; color: #4fb1d3; border: 1px solid #4fb1d3; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
          Kako da instaliram →
        </a>
      </div>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
      <p style="margin: 4px 0 0;"><a href="mailto:info@hartweger.rs" style="color: #bbb; text-decoration: none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body>
</html>`.trim();
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN — no emails will be sent ===\n" : "=== SENDING EMAILS ===\n");

  // Get A1 course IDs
  const courseIds: string[] = [];
  const courseNames: Record<string, string> = {};

  for (const slug of A1_SLUGS) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, title")
      .eq("slug", slug)
      .single();
    if (course) {
      courseIds.push(course.id);
      courseNames[course.id] = course.title;
    }
  }

  if (courseIds.length === 0) {
    console.error("No A1 courses found");
    process.exit(1);
  }

  console.log("A1 courses:", Object.values(courseNames).join(", "));

  // Get all users with A1 course access (active, not expired)
  const { data: accessRecords } = await supabase
    .from("course_access")
    .select("user_id, course_id, expires_at")
    .in("course_id", courseIds)
    .gte("expires_at", new Date().toISOString());

  if (!accessRecords || accessRecords.length === 0) {
    console.log("No active A1 users found");
    return;
  }

  // Group by user
  const userCourses = new Map<string, { courseIds: string[]; latestExpiry: string }>();
  for (const rec of accessRecords) {
    if (!userCourses.has(rec.user_id)) {
      userCourses.set(rec.user_id, { courseIds: [rec.course_id], latestExpiry: rec.expires_at });
    } else {
      const existing = userCourses.get(rec.user_id)!;
      if (!existing.courseIds.includes(rec.course_id)) {
        existing.courseIds.push(rec.course_id);
      }
      if (rec.expires_at > existing.latestExpiry) {
        existing.latestExpiry = rec.expires_at;
      }
    }
  }

  console.log(`Users with active A1 access: ${userCourses.size}\n`);

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const [userId, data] of userCourses) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, full_name, created_at")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      console.log(`SKIP ${userId} — no email`);
      skipped++;
      continue;
    }

    // Skip admin/test accounts
    if (profile.email.includes("hartweger.rs") || profile.email.includes("test@")) {
      console.log(`SKIP ${profile.email} — admin/test`);
      skipped++;
      continue;
    }

    // Skip users already emailed via MailerLite
    if (ALREADY_EMAILED.has(profile.email.toLowerCase())) {
      console.log(`SKIP ${profile.email} — already emailed via MailerLite`);
      skipped++;
      continue;
    }

    const courses = data.courseIds.map((cid) => courseNames[cid]).filter(Boolean);
    const name = profile.full_name || "";

    if (DRY_RUN) {
      console.log(`WOULD SEND ${profile.email} (${name}) — ${courses.join(", ")} — expires ${data.latestExpiry.slice(0, 10)}`);
      sent++;
      continue;
    }

    try {
      await resend!.emails.send({
        from: FROM,
        to: profile.email,
        subject: "Vaš kurs nemačkog je na novoj platformi!",
        html: buildMigrationEmail(name, courses, data.latestExpiry),
      });
      sent++;
      console.log(`SENT ${profile.email} (${name})`);

      // Rate limit: ~10 emails/sec for Resend
      if (sent % 10 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      errors++;
      console.error(`ERROR ${profile.email}:`, err);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`${DRY_RUN ? "Would send" : "Sent"}: ${sent}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
