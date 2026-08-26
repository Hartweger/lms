import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import { KONSULTACIJA_CALENDAR_URL } from "@/lib/konsultacija";
import { SITE_URL } from "@/lib/site-url";
import { odjavaUrl, listUnsubscribeHeaders } from "@/lib/optout";
import { isSuppressed } from "@/lib/email-suppression";
import { htmlToText } from "@/lib/html-to-text";
import type { Ga4Weekly } from "@/lib/ga4-report";
import { MERCHANT, CARD_OUTCOME, pdvBreakdown, type NestpayTx, type RecurringTx } from "@/lib/payment-confirmation";
import { BANK_FIRME } from "@/lib/order-utils";
import type { DokumentPodaci } from "@/lib/dokument-podaci";
import type { SubscriptionBrief } from "@/lib/subscription-brief";
import type { NakiBrief } from "@/lib/naki-brief";
import { naslovIzvestaja, receniceZaDete, type IzvestajDeteta } from "@/lib/zack/izvestaj";
import { POKLON_DO_PRIKAZ } from "@/lib/zack/poklon";
import { datumSlovima } from "@/lib/datum";
import { VRACA_SE } from "@/lib/zack/anketa";

const FROM = "Hartweger <info@hartweger.rs>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set - emails disabled");
    return null;
  }
  return instrumentResend(new Resend(process.env.RESEND_API_KEY));
}

/**
 * Resend SDK NE baca izuzetak na API grešku — vraća `{ data: null, error }`, a pozivaoci taj
 * error ne čitaju. Ovde (jedina tačka kroz koju prolazi svih ~34 slanja) se svaki neuspeh
 * loguje i šalje u Sentry; throw (mrežni) se takođe beleži pa prosleđuje postojećim catch-evima.
 */
function instrumentResend(resend: Resend): Resend {
  const origSend = resend.emails.send.bind(resend.emails);
  resend.emails.send = (async (payload, options) => {
    try {
      const result = await origSend(payload, options);
      if (result?.error) {
        const to = Array.isArray(payload.to) ? payload.to.join(",") : payload.to;
        const msg = `[email] Resend odbio "${payload.subject}" → ${to}: ${result.error.message ?? JSON.stringify(result.error)}`;
        console.error(msg);
        Sentry.captureException(new Error(msg));
      }
      return result;
    } catch (e) {
      Sentry.captureException(e);
      throw e;
    }
  }) as typeof origSend;
  return resend;
}

/** Minimalni HTML-escape za korisnički unos u mejl telu. */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Slanje sa automatskim plain-text delom (bolji spam skor) i, za masovne/promotivne
 * mejlove (`bulk: true`), List-Unsubscribe header-ima. List-Unsubscribe se dodaje samo za
 * jednog primaoca (string) - nikad za admin liste (to: [info@, natasa@]).
 */
async function sendEmail(
  resend: Resend,
  p: {
    to: string | string[]; subject: string; html: string;
    from?: string; replyTo?: string; bulk?: boolean;
    /** PDF prilozi (predračun, faktura). `content` je base64 bez `data:` prefiksa. */
    attachments?: { filename: string; content: string }[];
  },
) {
  // Odjavljeni i trajno neisporučivi ne dobijaju masovnu poštu. Provera stoji OVDE, a ne
  // u svakom cron-u, da bi je i budući sender dobio sam od sebe. Transakcijske mejlove
  // (potvrde, magic link, pristup) ne dodiruje - oni nisu `bulk`.
  if (p.bulk && typeof p.to === "string" && (await isSuppressed(p.to))) {
    console.log(`[email] preskočeno (odjava/bounce) → ${p.to}: ${p.subject}`);
    return null;
  }
  return resend.emails.send({
    from: p.from ?? FROM,
    to: p.to,
    replyTo: p.replyTo ?? "info@hartweger.rs",
    subject: p.subject,
    html: p.html,
    text: htmlToText(p.html),
    ...(p.bulk && typeof p.to === "string" ? { headers: listUnsubscribeHeaders(p.to) } : {}),
    ...(p.attachments?.length ? { attachments: p.attachments } : {}),
  });
}

/** NH Academy Gen II - isti Meet link za svih 12 susreta. */
const ACADEMY_MEET_URL = "https://meet.google.com/kks-ebzg-gob";
const ACADEMY_MEET_PHONE = "+381 11 4250145";
const ACADEMY_MEET_PIN = "575 421 818 2660";

/**
 * „Dodaj u kalendar" za svih 12 termina odjednom (RRULE, 12 sreda od 30.9.).
 * Vreme se NAMERNO šalje kao lokalno uz ctz=Europe/Belgrade, a ne u UTC: letnje
 * računanje vremena prestaje 25.10.2026, pa bi UTC serija od 28.10. pomerila
 * susrete na 20:30.
 */
const ACADEMY_CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("NH Academy - Generacija II") +
  "&dates=20260930T193000/20260930T210000" +
  "&ctz=Europe/Belgrade" +
  "&recur=RRULE:FREQ=WEEKLY;COUNT=12" +
  "&location=" + encodeURIComponent(ACADEMY_MEET_URL) +
  "&details=" + encodeURIComponent(`Susreti su sredom u 19:30.\nLink: ${ACADEMY_MEET_URL}`);

/**
 * NH Academy nije kurs na platformi nego program uživo. Generički welcome mejl bi
 * polaznicu poslao na kontrolnu tablu gde je ne čeka nikakav sadržaj, uz brendiranje
 * škole nemačkog - posle uplate od 57.300 RSD to izgleda kao da nešto nije prošlo.
 * Zato svoj mejl: NH brend, datum početka i jasno šta sledi.
 */
export async function sendAcademyWelcomeEmail(to: string, name: string) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      to,
      from: "Nataša Hartweger <info@hartweger.rs>",
      subject: "Tvoje mesto u NH Academy je rezervisano",
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fdf5f7; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 26px;">
        <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #c94f6d;">NH Academy</div>
        <div style="font-size: 13px; color: #999; margin-top: 4px;">Generacija II</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a1a; margin: 0 0 16px;">Zdravo, ${esc(name) || "draga"}!</h1>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 18px;">
        Tvoje mesto u drugoj generaciji je rezervisano. Drago mi je što si tu.
      </p>

      <div style="background: #fdf5f7; border-left: 3px solid #c94f6d; border-radius: 6px; padding: 16px 18px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Kad počinjemo</div>
        <div style="font-size: 15px; color: #1a1a1a; line-height: 1.7;">
          <strong>Sreda, 30. septembar u 19:30</strong><br>
          12 susreta, sredom, do 16. decembra<br>
          Preko Google Meet-a, link je isti svaki put:<br>
          <a href="${ACADEMY_MEET_URL}" style="color: #c94f6d; font-weight: 600;">${ACADEMY_MEET_URL.replace("https://", "")}</a>
        </div>
      </div>

      <div style="text-align: center; margin: 0 0 22px;">
        <a href="${ACADEMY_CALENDAR_URL}"
           style="display: inline-block; background: #c94f6d; color: #ffffff; text-decoration: none;
                  font-size: 15px; font-weight: 600; padding: 13px 26px; border-radius: 8px;">
          Dodaj svih 12 termina u kalendar
        </a>
      </div>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 18px;">
        <strong>Sačuvaj ovaj mejl</strong> — u njemu ti je link za sve susrete. Pred prvo veče stiže
        poruka sa pripremom i pristupom zajednici. Do tada ne moraš ništa.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #888; margin: 0 0 22px;">
        Ako ti nekad zataji internet, možeš i telefonom: ${ACADEMY_MEET_PHONE}, PIN ${ACADEMY_MEET_PIN}#
      </p>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 22px;">
        Ako imaš bilo kakvo pitanje, samo odgovori na ovaj mejl. Čitam ga ja.
      </p>

      <p style="font-family: Georgia, serif; font-size: 15px; color: #c94f6d; margin: 0;">— Nataša</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (e) {
    console.error("[email] Academy welcome pao:", e);
    Sentry.captureException(e);
  }
}

/**
 * Konsultacija nije kurs: posle uplate ne sledi pristup sadržaju nego biranje termina.
 * Generički welcome mejl bi kupca poslao na kontrolnu tablu gde ga ne čeka ništa, uz
 * brendiranje škole nemačkog. Zato svoj mejl: NH brend i jedno dugme, link za termin.
 */
export async function sendKonsultacijaEmail(to: string, name: string) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      to,
      from: "Nataša Hartweger <info@hartweger.rs>",
      subject: "Uplata je stigla - izaberi termin konsultacije",
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fdf5f7; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 26px;">
        <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #c94f6d;">Nataša Hartweger</div>
        <div style="font-size: 13px; color: #999; margin-top: 4px;">Konsultacija, 90 minuta</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a1a; margin: 0 0 16px;">Zdravo, ${esc(name) || "draga"}!</h1>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 18px;">
        Uplata je stigla i ostalo je samo da izabereš termin koji ti odgovara.
      </p>

      <div style="text-align: center; margin: 0 0 22px;">
        <a href="${KONSULTACIJA_CALENDAR_URL}"
           style="display: inline-block; background: #c94f6d; color: #ffffff; text-decoration: none;
                  font-size: 15px; font-weight: 600; padding: 13px 26px; border-radius: 8px;">
          Izaberi termin
        </a>
      </div>

      <div style="background: #fdf5f7; border-left: 3px solid #c94f6d; border-radius: 6px; padding: 16px 18px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Kako izgleda poziv</div>
        <div style="font-size: 15px; color: #1a1a1a; line-height: 1.7;">
          90 minuta, video poziv jedan na jedan.<br>
          Prolazimo gde si sad, šta te koči i šta prvo da rešiš.<br>
          Snimak poziva ostaje tebi.
        </div>
      </div>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 18px;">
        <strong>Da dođem spremna:</strong> odgovori na ovaj mejl u par rečenica čime se baviš i šta te
        trenutno najviše koči. Pročitam pre nego što se čujemo, pa ne trošimo poziv na upoznavanje.
      </p>

      <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 22px;">
        Ako ti termin ne odgovara ili moraš da pomeriš, samo mi javi na ovaj mejl.
      </p>

      <p style="font-family: Georgia, serif; font-size: 15px; color: #c94f6d; margin: 0;">- Nataša</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (e) {
    console.error("[email] Konsultacija mejl pao:", e);
    Sentry.captureException(e);
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  courseTitles: string[],
  /**
   * startUrl = direktan login-link (/auth/mejl token). Bez njega CTA vodi na /prijava (npr. wc-webhook).
   * hasLesson = login-link cilja prvu lekciju; false = /dashboard (kurs bez lekcija, ne obećavati lekciju).
   * subscription = mesečno plaćanje: zahtev banke je da notifikacija za inicijalnu ponavljajuću
   * transakciju kupcu JASNO kaže da je pokrenuta pretplata (iznos, učestalost, broj naplata, otkazivanje).
   * subscription.tip = "clanstvo" (nh-clanstvo) menja narativ: 121 je bankin tehnički maksimum
   * naplata u seriji, ne obećanje - pa se "od 121" ovde NE prikazuje (vidi subscription-plans.ts).
   */
  opts?: {
    startUrl?: string;
    hasLesson?: boolean;
    subscription?: { monthlyRsd: number; totalPayments: number; tip?: "paket" | "clanstvo" };
  },
) {
  const courseList = courseTitles.map((t) => `• ${t}`).join("\n");
  const startUrl = opts?.startUrl || `${SITE_URL}/prijava`;
  const ctaLabel = opts?.startUrl ? (opts.hasLesson ? "Započni prvu lekciju" : "Uđi na platformu") : "Započni učenje";

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: opts?.subscription
        ? (opts.subscription.tip === "clanstvo"
          ? "Dobrodošli! Pokrenuto je mesečno članstvo"
          : "Dobrodošli! Pokrenuto je mesečno plaćanje (pretplata)")
        : "Dobrodošli na Hartweger kurs!",
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: 700; color: #4fb1d3;">Hartweger</div>
        <div style="font-size: 13px; color: #999; margin-top: 4px;">Škola nemačkog jezika</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">
        Zdravo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px;">
        Tvoj nalog je kreiran i pristup kursu je aktiviran. Možeš odmah početi sa učenjem.
      </p>

      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Tvoji kursevi</div>
        <div style="font-size: 14px; color: #1a1a2e; white-space: pre-line;">${courseList}</div>
      </div>

      ${opts?.subscription
        ? (opts.subscription.tip === "clanstvo"
          ? `
      <div style="background: #fff8e7; border: 1px solid #f0d48a; border-radius: 8px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px;">Pokrenuto je mesečno članstvo</div>
        <div style="font-size: 14px; color: #444; line-height: 1.6;">
          Danas je naplaćen prvi mesec članstva u iznosu od
          <strong>${opts.subscription.monthlyRsd.toLocaleString("de-DE")} RSD</strong>. Isti iznos se automatski
          naplaćuje sa tvoje platne kartice <strong>jednom mesečno</strong>, istog datuma u mesecu - mesečno članstvo
          se obnavlja svakog meseca dok ga ne otkažeš. Za svaku naplatu dobijaš potvrdu i fiskalni račun na email.
          <br /><br />
          Mesečno članstvo možeš da <strong>otkažeš u svakom trenutku</strong> u odeljku
          <a href="${SITE_URL}/nalog" style="color: #4fb1d3;">„Moj nalog"</a> na platformi (opcija „Otkaži mesečno
          članstvo") ili slanjem zahteva na info@hartweger.rs. Otkazivanje zaustavlja sve buduće naplate.
        </div>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        ${opts?.startUrl
          ? `Klikni na dugme ispod i odmah ulaziš ${opts.hasLesson ? "u prvu lekciju" : "na platformu"}. Pristup važi dok je članstvo aktivno.`
          : "Prijavi se na platformu i započni prvu lekciju. Pristup važi dok je članstvo aktivno."}
      </p>`
          : `
      <div style="background: #fff8e7; border: 1px solid #f0d48a; border-radius: 8px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px;">Pokrenuto je mesečno plaćanje (pretplata)</div>
        <div style="font-size: 14px; color: #444; line-height: 1.6;">
          Danas je naplaćena <strong>1. od ${opts.subscription.totalPayments} mesečnih naplata</strong> u iznosu od
          <strong>${opts.subscription.monthlyRsd.toLocaleString("de-DE")} RSD</strong>. Isti iznos se automatski
          naplaćuje sa tvoje platne kartice <strong>jednom mesečno</strong>, istog datuma u mesecu, dok se ne izvrši
          ukupno ${opts.subscription.totalPayments} naplata. Za svaku naplatu dobijaš potvrdu i fiskalni račun na email.
          <br /><br />
          Mesečno plaćanje možeš da <strong>otkažeš u svakom trenutku</strong> u odeljku
          <a href="${SITE_URL}/nalog" style="color: #4fb1d3;">„Moj nalog"</a> na platformi (opcija „Otkaži mesečno
          plaćanje") ili slanjem zahteva na info@hartweger.rs. Otkazivanje zaustavlja sve buduće naplate.
        </div>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        ${opts?.startUrl
          ? `Klikni na dugme ispod i odmah ulaziš ${opts.hasLesson ? "u prvu lekciju" : "na platformu"}. Pristup važi dok traju mesečne naplate, a nivoi se otvaraju redom kako naplate teku.`
          : "Prijavi se na platformu i započni prvu lekciju. Pristup važi dok traju mesečne naplate, a nivoi se otvaraju redom kako naplate teku."}
      </p>`)
        : `
      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        ${opts?.startUrl
          ? `Klikni na dugme ispod i odmah ulaziš ${opts.hasLesson ? "u prvu lekciju" : "na platformu"}. Pristup kursu važi <strong>godinu dana</strong> od kupovine.`
          : "Prijavi se na platformu i započni prvu lekciju. Pristup kursu važi <strong>godinu dana</strong> od kupovine."}
      </p>`}

      <div style="text-align: center; margin: 24px 0;">
        <a href="${startUrl}" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          ${ctaLabel}
        </a>
      </div>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0 0 8px;">
        ${opts?.startUrl
          ? `Dugme te automatski prijavljuje. Ako link istekne, uđi na <a href="${SITE_URL}/prijava" style="color: #4fb1d3; text-decoration: none;">hartweger.rs/prijava</a> - bez lozinke, mejlom kojim si kupio/la kurs.`
          : "Prijava je bez lozinke - uneseš mejl kojim si kupio/la kurs i stigne ti link za ulazak."}
      </p>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0 0 8px;">
        Možeš instalirati aplikaciju na telefon za brži pristup:
        <a href="${SITE_URL}/instaliraj" style="color: #4fb1d3; text-decoration: none;">hartweger.rs/instaliraj</a>
      </p>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger - Škola nemačkog jezika</p>
      <p style="margin: 4px 0 0;"><a href="mailto:info@hartweger.rs" style="color: #bbb; text-decoration: none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log(`[email] Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`[email] Failed to send welcome email to ${to}:`, error);
  }
}

export async function sendCourseCompletedEmail(
  to: string,
  name: string,
  courseTitle: string,
  certificateId: string | null
) {
  const certBlock = certificateId
    ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${SITE_URL}/sertifikat/${certificateId}" style="display: inline-block; background: #34A853; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Preuzmi sertifikat
        </a>
      </div>`
    : "";

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Čestitamo! Završili ste kurs: ${courseTitle}`,
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: 700; color: #4fb1d3;">Hartweger</div>
      </div>

      <div style="text-align: center; font-size: 48px; margin-bottom: 16px;">&#127942;</div>

      <h1 style="font-size: 20px; color: #1a1a2e; text-align: center; margin: 0 0 16px;">
        Čestitamo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; text-align: center; margin: 0 0 20px;">
        Uspešno si završio/la kurs <strong>${courseTitle}</strong> i položio/la završni test. Svaka čast na upornosti!
      </p>

      ${certBlock}

      <div style="background: #f8fcfd; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">
          „Übung macht den Meister"<br>
          <span style="font-size: 12px; color: #999;">- Vežba čini majstora</span>
        </p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${SITE_URL}/dashboard" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Nastavi sa učenjem
        </a>
      </div>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger - Škola nemačkog jezika</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log(`[email] Course completed email sent to ${to}`);
  } catch (error) {
    console.error(`[email] Failed to send completion email to ${to}:`, error);
  }
}

export async function sendInactivityReminder(
  to: string,
  name: string,
  courseTitle: string,
  lessonTitle: string | null
) {
  const lessonHint = lessonTitle
    ? `<p style="font-size: 14px; color: #666; margin: 0 0 4px;">Sledeća lekcija:</p>
       <p style="font-size: 15px; color: #1a1a2e; font-weight: 600; margin: 0;">${lessonTitle}</p>`
    : "";

  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      bulk: true,
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `${name || "Učeniče"}, nedostaješ nam!`,
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: 700; color: #4fb1d3;">Hartweger</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">
        Zdravo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px;">
        Primetili smo da nisi bio/la aktivna na kursu <strong>${courseTitle}</strong> već neko vreme. Svaki dan je prilika da naučiš nešto novo!
      </p>

      ${lessonHint ? `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        ${lessonHint}
      </div>
      ` : ""}

      <div style="text-align: center; margin: 24px 0;">
        <a href="${SITE_URL}/dashboard" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Nastavi sa učenjem
        </a>
      </div>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0; text-align: center;">
        Samo 15 minuta dnevno pravi razliku.
      </p>


    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger - Škola nemačkog jezika</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log(`[email] Inactivity reminder sent to ${to}`);
  } catch (error) {
    console.error(`[email] Failed to send inactivity reminder to ${to}:`, error);
  }
}

// Blokovi sa podacima za uplatu - dele ih mejl sa instrukcijama i podsetnici za uplatu.
function uplatnicaBlockHtml(totalRsd: number, orderNumber: string, ipsQrUrl?: string) {
  return `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Podaci za uplatu</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #888; width: 45%;">Primalac</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">Hartweger, Beograd, 11070 Beograd</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Broj računa</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">170-10559767000-18</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Iznos</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${totalRsd} RSD</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Poziv na broj</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Svrha</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">Placanje porudzbine #${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888;">Šifra plaćanja</td>
            <td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">189</td>
          </tr>
        </table>
        ${ipsQrUrl ? `<div style="text-align: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e8f4f8;">
          <img src="${ipsQrUrl}" alt="IPS QR kod" width="180" height="180" style="border-radius: 8px;" />
          <div style="font-size: 12px; color: #888; margin-top: 6px;">📱 Skeniraj IPS QR kod u aplikaciji za mobilno bankarstvo</div>
        </div>` : ""}
      </div>`;
}

function paypalBlockHtml(paypalEur?: number) {
  return `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">PayPal uplata</div>
        <p style="font-size: 14px; color: #1a1a2e; margin: 0 0 8px;">
          Iznos: <strong>${paypalEur} EUR</strong>
        </p>
        <p style="font-size: 12px; color: #888; margin: 0 0 16px;">
          Napomena: na PayPal uplate primenjuje se dodatak od 12% zbog troškova transakcije.
        </p>
        <div style="text-align: center;">
          <a href="https://www.paypal.com/paypalme/natasahartweger1/${paypalEur}EUR" style="display: inline-block; background: #003087; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Plati putem PayPal-a
          </a>
        </div>
      </div>`;
}

export async function sendPaymentInstructionsEmail(
  to: string,
  name: string,
  courseTitle: string,
  orderNumber: string,
  totalRsd: number,
  paymentMethod: "uplatnica" | "paypal" | "kartica",
  paypalEur?: number,
  orderId?: string,
  ipsQrUrl?: string
) {
  const karticaBlock = `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Plaćanje karticom</div>
        <p style="font-size: 14px; color: #1a1a2e; margin: 0 0 8px;">Iznos: <strong>${totalRsd} RSD</strong></p>
        <p style="font-size: 13px; color: #888; margin: 0 0 16px;">Klikni na dugme i plati karticom (Visa/Mastercard) sigurno preko banke.</p>
        <div style="text-align: center;">
          <a href="${SITE_URL}/kupovina/kartica/${orderId ?? ""}" style="display: inline-block; background: #4fb1d3; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Plati karticom
          </a>
        </div>
      </div>`;
  const paymentBlock =
    paymentMethod === "kartica"
      ? karticaBlock
      : paymentMethod === "uplatnica"
      ? uplatnicaBlockHtml(totalRsd, orderNumber, ipsQrUrl)
      : paypalBlockHtml(paypalEur);

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Narudžbina #${orderNumber} - instrukcije za uplatu`,
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: 700; color: #4fb1d3;">Hartweger</div>
        <div style="font-size: 13px; color: #999; margin-top: 4px;">Škola nemačkog jezika</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">
        Zdravo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        Hvala na narudžbini! Naručili ste kurs <strong>${courseTitle}</strong>. Kada potvrdimo uplatu, aktiviramo pristup najduže tri radna dana.
      </p>

      ${paymentBlock}

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0; text-align: center;">
        Ako imate pitanja, pišite nam na <a href="mailto:info@hartweger.rs" style="color: #4fb1d3; text-decoration: none;">info@hartweger.rs</a>
      </p>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger - Škola nemačkog jezika</p>
      <p style="margin: 4px 0 0;"><a href="mailto:info@hartweger.rs" style="color: #bbb; text-decoration: none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log(`[email] Payment instructions email sent to ${to}`);
  } catch (error) {
    console.error(`[email] Failed to send payment instructions email to ${to}:`, error);
  }
}

// Podsetnik za uplatnicu/PayPal narudžbinu koja čeka uplatu (3. i 8. dan).
// Obavezno blag ton: uplata je možda već poslata (putuje 1-3 radna dana), pa nema pretnji otkazivanjem.
export async function sendUplataReminderEmail(o: {
  email: string;
  fullName: string;
  courseTitle: string;
  courseSlug: string;
  orderNumber: string;
  totalRsd: number;
  paymentMethod: "uplatnica" | "paypal";
  stage: 1 | 2;
  paypalEur?: number;
  ipsQrUrl?: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const paymentBlock = o.paymentMethod === "uplatnica"
      ? uplatnicaBlockHtml(o.totalRsd, o.orderNumber, o.ipsQrUrl)
      : paypalBlockHtml(o.paypalEur);
    const uvod = o.stage === 1
      ? `Pre par dana si naručio/la kurs <strong>${esc(o.courseTitle)}</strong> (narudžbina #${esc(o.orderNumber)}), a uplatu još nismo videli - pa evo malog podsetnika sa svim podacima:`
      : `Tvoja narudžbina za <strong>${esc(o.courseTitle)}</strong> (#${esc(o.orderNumber)}) i dalje čeka uplatu, pa se javljamo poslednji put da proverimo treba li ti nešto:`;
    const karticaAlt = o.stage === 2
      ? `<p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako ti je jednostavnije, isti kurs možeš platiti i <a href="${SITE_URL}/kupovina/${esc(o.courseSlug)}" style="color:#4fb1d3;">karticom online</a> - pristup se tada aktivira odmah.
      </p>`
      : "";
    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: o.stage === 1
        ? `Podsetnik - čekamo tvoju uplatu za narudžbinu #${o.orderNumber} 🙂`
        : `Tvoje mesto na kursu još čeka - narudžbina #${o.orderNumber}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      </div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.fullName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">${uvod}</p>
      ${paymentBlock}
      <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 16px;">
        ✅ Ako si uplatu već poslao/la, slobodno ignoriši ovaj mejl - uplate putuju 1-3 radna dana, a potvrda i pristup stižu čim je vidimo.
      </p>
      ${karticaAlt}
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">
        Imaš pitanje ili želiš drugačiji način plaćanja? Samo odgovori na ovaj mejl - tu smo.
      </p>
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Podsetnik za uplatu #${o.stage} → ${o.email} (${o.orderNumber})`);
  } catch (e) {
    console.error(`[email] sendUplataReminderEmail pao za ${o.orderNumber}:`, e);
  }
}

export async function sendGrupniWelcomeEmail(
  to: string,
  name: string,
  opts: { nivo: string; profIme?: string; meetLink?: string; notesUrl?: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const meetBtn = opts.meetLink
      ? `<div style="text-align:center;margin:24px 0;"><a href="${esc(opts.meetLink)}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Uđi u učionicu (Google Meet)</a></div>
<p style="font-size:13px;color:#999;text-align:center;margin:0 0 16px;">Isti Meet link važi za sve časove. Termin ti stiže i u Google kalendar.</p>`
      : `<p style="font-size:14px;color:#666;margin:0 0 16px;">Link za Google Meet i raspored stižu ti uskoro.</p>`;
    const notesRow = opts.notesUrl
      ? `<p style="font-size:14px;color:#444;margin:0 0 16px;">📝 <a href="${esc(opts.notesUrl)}" style="color:#4fb1d3;">Beleške sa časova</a> - profesor/ka ih popunjava posle svakog časa.</p>`
      : "";
    const profRow = opts.profIme ? `<p style="font-size:15px;color:#444;margin:0 0 16px;"><strong>Profesor/ka:</strong> ${esc(opts.profIme)}</p>` : "";
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Dobrodošli na grupni kurs nemačkog ${opts.nivo}!`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      </div>
      <h1 style="font-size:20px;margin:0 0 16px;">Dobrodošli${ime ? ", " + esc(ime) : ""}! 💚</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Prijava za <strong>grupni kurs nemačkog ${esc(opts.nivo)}</strong> je potvrđena.</p>
      ${profRow}
      ${meetBtn}
      ${notesRow}
      <div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <p style="font-size:14px;color:#1a1a2e;margin:0 0 6px;">📚 Video lekcije i materijali te čekaju na platformi: <a href="${SITE_URL}/prijava" style="color:#4fb1d3;">hartweger.rs/prijava</a></p>
        <p style="font-size:13px;color:#888;margin:0;">Prijava je bez lozinke - uneseš mejl kojim si se upisao/la i stigne ti link za ulazak. Pristup platformi važi godinu dana.</p>
      </div>
      <p style="font-size:15px;color:#444;margin:0;">Vidimo se na času!<br>Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;">
      <p style="margin:0;">Hartweger - Škola nemačkog jezika</p>
      <p style="margin:4px 0 0;"><a href="mailto:info@hartweger.rs" style="color:#bbb;text-decoration:none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendGrupniWelcomeEmail pao:", e);
  }
}

/**
 * Podsetnik profesorki 14 dana pre kraja njene grupe: koga da pozove u sledeći nivo
 * i šta tačno da im ponudi. Odluka 21.07.2026 - poziv je lični, od profesorke koja
 * ih već vodi, jer ona zna ko od polaznika planira dalje (masovna slanja su konvertovala 0).
 * Automatska ponuda polaznicima (sendNextLevelOffer) ide odvojeno, 7 dana pre kraja.
 */
export async function sendProfNextGroupReminder(
  to: string,
  opts: {
    profIme: string;
    nivo: string;
    endDate: string;
    polaznici: { email: string; ime: string }[];
    sledeca: {
      nivo: string;
      startDate: string;
      dani: string;
      vreme: string;
      profIme: string;
      slobodno: number;
    } | null;
    nextNivo: string | null;
    rasporedUrl: string;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = opts.profIme ? opts.profIme.split(" ")[0] : "";
    const dat = (d: string) =>
      new Date(d).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });
    const kraj = dat(opts.endDate);
    const lista = opts.polaznici.length
      ? `<ul style="margin:0 0 18px;padding-left:20px;font-size:15px;color:#444">${opts.polaznici
          .map((p) => `<li>${esc(p.ime || p.email)}${p.ime ? ` - ${esc(p.email)}` : ""}</li>`)
          .join("")}</ul>`
      : `<p style="font-size:15px;color:#444;margin:0 0 18px">Ova grupa trenutno nema aktivnih polaznika.</p>`;

    const ponuda = opts.sledeca
      ? `<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px">
<div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta im nudiš - ${esc(opts.sledeca.nivo)}:</strong><br>
• početak: ${esc(dat(opts.sledeca.startDate))}<br>
• termin: ${esc(opts.sledeca.dani)} ${esc(opts.sledeca.vreme)}<br>
• profesorka: ${esc(opts.sledeca.profIme)}<br>
• slobodno još ${opts.sledeca.slobodno} od 6 mesta<br>
• prijava: <a href="${esc(opts.rasporedUrl)}" style="color:#4fb1d3">${esc(opts.rasporedUrl)}</a></div></div>`
      : opts.nextNivo
        ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Grupa za ${esc(opts.nextNivo)} još nije otvorena.</strong> Javi Nataši da je otvori pre nego što pozoveš polaznike - inače nemaju gde da se prijave.</p>`
        : `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Ovo je poslednji nivo u nizu, pa nema direktnog nastavka. Ako neko od njih želi dalje, javi Nataši.</p>`;

    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Tvoja ${opts.nivo} grupa se završava ${kraj} - pozovi ih u nastavak`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:20px;margin:0 0 16px;color:#1a1a2e">Tvoja ${esc(opts.nivo)} grupa se završava ${esc(kraj)}</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${ime ? `Ćao ${esc(ime)},` : "Ćao,"}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Vreme je da ih pozoveš da nastave. Ti znaš ko od njih planira dalje, pa je tvoja poruka vrednija od naše opšte ponude.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px"><strong>Koga da pozoveš:</strong></p>
${lista}
${ponuda}
<p style="font-size:13px;line-height:1.6;color:#888;margin:0">Napomena: polaznici 7 dana pre kraja dobijaju i automatsku ponudu sa sajta. Tvoja poruka je dodatak tome, ne zamena - najbolje deluje ako je pošalješ pre nje ili je spomeneš uživo na času.</p>
</div>
<div style="text-align:center;font-size:12px;color:#bbb;padding:18px 0">Hartweger - automatski podsetnik pred kraj ciklusa</div>
</div></body></html>`,
    });
  } catch (e) {
    console.error("[email] sendProfNextGroupReminder pao:", e);
  }
}

export async function sendNatasaNextTermReminder(
  opts: { nivo: string; nextNivo: string | null; endDate: string; profIme?: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const sledeci = opts.nextNivo
      ? `Vreme je da otvoriš sledeći nivo <strong>${esc(opts.nextNivo)}</strong> (dugme „Otvori novi termin" u /admin/grupe).`
      : `Ovo je poslednji nivo u nizu.`;
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `Podsetnik: grupa ${opts.nivo} se bliži kraju`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Grupa ${esc(opts.nivo)} se završava ${esc(opts.endDate)}</h2>
${opts.profIme ? `<p><strong>Profesor/ka:</strong> ${esc(opts.profIme)}</p>` : ""}
<p>${sledeci}</p>
<p>Polaznici će automatski dobiti ponudu za sledeći nivo 7 dana pre kraja.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendNatasaNextTermReminder pao:", e);
  }
}

export async function sendNextLevelOffer(
  to: string,
  name: string,
  opts: {
    currentNivo: string;
    nextNivo: string;
    courseUrl: string;
    /** Konkretna otvorena grupa sledećeg nivoa, ako postoji - datum i termin prodaju bolje od gole prodajne strane. */
    sledeca?: { startDate: string; dani: string; vreme: string; profIme: string; slobodno: number } | null;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const s = opts.sledeca;
    const datum = s
      ? new Date(s.startDate).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const detalji = s
      ? `<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 20px">
<div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Nova ${esc(opts.nextNivo)} grupa:</strong><br>
• kreće ${esc(datum)}<br>
• ${esc(s.dani)}, ${esc(s.vreme)}<br>
${s.profIme ? `• profesorka: ${esc(s.profIme)}<br>` : ""}
• ostalo još ${s.slobodno} od 6 mesta</div></div>`
      : "";
    const zurba = s && s.slobodno > 0 && s.slobodno <= 3
      ? `Ostalo je još samo ${s.slobodno} ${s.slobodno === 1 ? "mesto" : "mesta"}, pa nemoj da odlažeš.`
      : "Mesta su ograničena (grupe do 6 polaznika), pa preporučujemo da rezervišeš na vreme.";
    await sendEmail(resend, {
      bulk: true,
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: s
        ? `Nastavi nemački - ${opts.nextNivo} kreće ${datum}`
        : `Nastavi nemački - upiši ${opts.nextNivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Bravo${ime ? ", " + esc(ime) : ""}! 🎉</h2>
<p>Tvoj grupni kurs <strong>${esc(opts.currentNivo)}</strong> se bliži kraju. Da ne praviš pauzu, upiši se na sledeći nivo i nastavi sa istim ritmom.</p>
${detalji}
<p style="margin:24px 0"><a href="${esc(opts.courseUrl)}" style="background:#F78687;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Upiši ${esc(opts.nextNivo)}</a></p>
<p style="font-size:13px;color:#666">${esc(zurba)}</p>
<p style="margin-top:20px">Vidimo se i dalje!<br>Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendNextLevelOffer pao:", e);
  }
}

export async function sendProfNewStudentEmail(
  profEmail: string,
  profIme: string,
  opts: { nivo: string; studentName?: string; studentEmail: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Novi polaznik - grupni ${opts.nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Upisao/la se novi polaznik u tvoju grupu <strong>${esc(opts.nivo)}</strong>:</p>
<p><strong>Ime:</strong> ${esc(opts.studentName || "-")}<br>
<strong>Mejl:</strong> ${esc(opts.studentEmail)}</p>
<p>Dodat/a je na termin u tvom Google kalendaru i u tvoj spisak (GRP tab).</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendProfNewStudentEmail pao:", e);
  }
}

export async function sendIndividualWelcomeEmail(
  to: string,
  name: string,
  opts: { nivo: string; profIme?: string; calendarUrl?: string | null; notesUrl?: string | null; hasPlatform: boolean; isMonthly?: boolean; rok?: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const calBtn = opts.calendarUrl
      ? `<div style="text-align:center;margin:24px 0;"><a href="${esc(opts.calendarUrl)}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Zakaži termin</a></div>
<p style="font-size:13px;color:#999;text-align:center;margin:0 0 16px;">Termine biraš direktno u kalendaru profesorke.</p>`
      : `<p style="font-size:14px;color:#666;margin:0 0 16px;">Link za zakazivanje termina stiže ti uskoro.</p>`;
    const notesRow = opts.notesUrl ? `<p style="font-size:14px;color:#444;margin:0 0 16px;">📝 <a href="${esc(opts.notesUrl)}" style="color:#4fb1d3;">Beleške sa časova</a></p>` : "";
    const profRow = opts.profIme ? `<p style="font-size:15px;color:#444;margin:0 0 16px;"><strong>Profesorka:</strong> ${esc(opts.profIme)}</p>` : "";
    // Mesečni (KTZ) paket važi mesec dana, ostali 3 meseca. Ako imamo konkretan rok, pokaži datum.
    const vaznost = opts.rok
      ? `Paket časova važi do <strong>${esc(opts.rok)}</strong>`
      : (opts.isMonthly ? "Paket časova važi <strong>mesec dana</strong> od uplate" : "Paket časova važi <strong>3 meseca</strong> od uplate");
    const platformRow = opts.hasPlatform
      ? `<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <p style="font-size:14px;color:#1a1a2e;margin:0 0 6px;">📚 Video lekcije i materijali te čekaju na platformi: <a href="${SITE_URL}/prijava" style="color:#4fb1d3;">hartweger.rs/prijava</a></p>
        <p style="font-size:13px;color:#888;margin:0;">Prijava je bez lozinke - uneseš mejl kojim si kupio/la kurs i stigne ti link za ulazak.</p>
      </div>`
      : "";
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Dobrodošli na individualni kurs nemačkog${opts.nivo ? " " + opts.nivo : ""}!`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      </div>
      <h1 style="font-size:20px;margin:0 0 16px;">Dobrodošli${ime ? ", " + esc(ime) : ""}! 💚</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Kupovina <strong>individualnog kursa nemačkog${opts.nivo ? " " + esc(opts.nivo) : ""}</strong> je potvrđena. ${vaznost}.</p>
      ${profRow}
      ${calBtn}
      ${notesRow}
      ${platformRow}
      <p style="font-size:15px;color:#444;margin:0;">Vidimo se na času!<br>Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;">
      <p style="margin:0;">Hartweger - Škola nemačkog jezika</p>
      <p style="margin:4px 0 0;"><a href="mailto:info@hartweger.rs" style="color:#bbb;text-decoration:none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendIndividualWelcomeEmail pao:", e);
  }
}

export async function sendProfNewIndividualStudentEmail(
  profEmail: string,
  profIme: string,
  opts: { nivo: string; lessons: number; studentName?: string; studentEmail: string; notesUrl?: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const notesRow = opts.notesUrl ? `<p>📝 <a href="${esc(opts.notesUrl)}">Beleške</a></p>` : "";
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Novi individualni polaznik${opts.nivo ? " - " + opts.nivo : ""}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Imaš novog individualnog polaznika (${opts.nivo ? `<strong>${esc(opts.nivo)}</strong>, ` : ""}paket ${opts.lessons} časova):</p>
<p><strong>Ime:</strong> ${esc(opts.studentName || "-")}<br>
<strong>Mejl:</strong> ${esc(opts.studentEmail)}</p>
${notesRow}
<p>Polaznik zakazuje termine preko tvog kalendara. Održane časove upisuješ na platformi.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendProfNewIndividualStudentEmail pao:", e);
  }
}

export async function sendHonorarProfEmail(
  profEmail: string,
  profIme: string,
  opts: {
    label: string; ind: number; grp: number; rateInd: number; rateGrp: number;
    indTotal: number; grpTotal: number; total: number; balance?: number;
    aktivnosti?: { description: string; amount: number }[];
    isplate?: { date: string; amount: number }[];
  },
): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) return false;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const aktRows = (opts.aktivnosti ?? [])
      .map((a) => `<li>${esc(a.description || "Dodatna aktivnost")}: <strong>${fmt(a.amount)} din</strong></li>`)
      .join("");
    const isplate = opts.isplate ?? [];
    const isplaceno = isplate.reduce((s, x) => s + x.amount, 0);
    const fmtDatum = (iso: string) => {
      const [y, m, d] = iso.split("-");
      return y && m && d ? `${Number(d)}.${Number(m)}.${y}.` : iso;
    };
    const isplateBlock = isplate.length > 0
      ? `<p>Isplaćeno ti je u ovom mesecu <strong>${fmt(isplaceno)} din</strong> (${isplate.map((x) => `${fmt(x.amount)} din (${fmtDatum(x.date)})`).join(", ")}).</p>`
      : "";
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Honorar za ${opts.label}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Tvoj obračun za <strong>${esc(opts.label)}</strong>:</p>
<ul>
<li>Individualni časovi: ${opts.ind} × ${fmt(opts.rateInd)} din = <strong>${fmt(opts.indTotal)} din</strong></li>
<li>Grupne sesije: ${opts.grp} × ${fmt(opts.rateGrp)} din = <strong>${fmt(opts.grpTotal)} din</strong></li>
${aktRows}
</ul>
<p style="font-size:18px"><strong>Ukupno: ${fmt(opts.total)} din</strong></p>
${isplateBlock}
${typeof opts.balance === "number" ? `<p style="font-size:13px;color:#666">Trenutni saldo (zarađeno - isplaćeno): <strong>${fmt(opts.balance)} din</strong>.</p>` : ""}
<p style="font-size:13px;color:#666">Ako nešto ne štima, javi nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    return true;
  } catch (e) {
    console.error("[email] sendHonorarProfEmail pao:", e);
    return false;
  }
}

export async function sendHonorarSummaryEmail(
  label: string,
  rows: { name: string; ind: number; grp: number; total: number }[],
  grandTotal: number,
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const trs = rows.map((r) => `<tr><td style="padding:4px 10px">${esc(r.name)}</td><td style="padding:4px 10px">${r.ind}</td><td style="padding:4px 10px">${r.grp}</td><td style="padding:4px 10px;text-align:right"><strong>${fmt(r.total)}</strong></td></tr>`).join("");
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `Honorari ${label} - ukupno ${fmt(grandTotal)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Honorari - ${esc(label)}</h2>
<table style="border-collapse:collapse;font-size:14px">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 10px;text-align:left">Profesorka</th><th style="padding:4px 10px">ind</th><th style="padding:4px 10px">grp</th><th style="padding:4px 10px;text-align:right">din</th></tr></thead>
<tbody>${trs}</tbody>
</table>
<p style="font-size:18px;margin-top:16px"><strong>UKUPNO: ${fmt(grandTotal)} din</strong></p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendHonorarSummaryEmail pao:", e);
  }
}

export async function sendPaymentEmail(
  profEmail: string,
  profIme: string,
  opts: { amount: number; date: string; balance: number; note?: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const saldoLine = opts.balance > 0
      ? `Preostali saldo (još ti dugujemo): <strong>${fmt(opts.balance)} din</strong>.`
      : opts.balance < 0
        ? `Stanje: <strong>${fmt(-opts.balance)} din</strong> preplate.`
        : `Saldo je izmiren - <strong>0 din</strong>.`;
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Isplata honorara - ${fmt(opts.amount)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Isplaćeno ti je <strong>${fmt(opts.amount)} din</strong> (datum: ${esc(opts.date)}).${opts.note ? " Napomena: " + esc(opts.note) + "." : ""}</p>
<p>${saldoLine}</p>
<p style="font-size:13px;color:#666">Ako nešto ne štima, javi nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendPaymentEmail pao:", e);
  }
}

export async function sendOneLessonLeftEmail(
  to: string,
  name: string,
  opts: { nivo: string; nextLevelLabel: string | null; courseUrl: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const cta = opts.courseUrl
      ? `<p style="margin:24px 0"><a href="${esc(opts.courseUrl)}" style="background:#F78687;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Pogledaj sledeći nivo</a></p>`
      : "";
    const nastavak = opts.nextLevelLabel
      ? `Da ne praviš pauzu, nastavi na <strong>sledeći nivo (${esc(opts.nextLevelLabel)})</strong> - ili obnovi paket sa svojom profesorkom.`
      : `Možeš da obnoviš paket sa svojom profesorkom i nastaviš dalje.`;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: "Ostao ti je još jedan čas - nastavi nemački",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Bravo${ime ? ", " + esc(ime) : ""}! 🎉</h2>
<p>Skoro si na kraju paketa - ostao ti je <strong>još jedan</strong> individualni čas${opts.nivo ? ` (${esc(opts.nivo)})` : ""}.</p>
<p>${nastavak}</p>
${cta}
<p style="margin-top:20px">Vidimo se i dalje!<br>Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendOneLessonLeftEmail pao:", e);
  }
}

export async function sendInteresNotification(nivo: string, email: string, ime: string) {
  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      replyTo: email,
      subject: `Interes za sledeći termin - ${nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6">
<h2>Novi interes za grupni termin</h2>
<p><strong>Nivo:</strong> ${esc(nivo)}</p>
<p><strong>Ime:</strong> ${esc(ime || "-")}</p>
<p><strong>Mejl:</strong> ${esc(email)}</p>
<p>Grupa za ovaj nivo je trenutno popunjena. Kontaktiraj polaznika kad otvoriš novi termin.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendInteresNotification pao:", e);
  }
}

/**
 * Način plaćanja za admin mejl. Nepoznat metod NE sme da se prikaže kao kartica -
 * Nataša ručno potvrđuje uplatnicu i PayPal, a karticu ne, pa pogrešna oznaka znači
 * da upis tiho stoji (zatečeno 17.08.2026 na narudžbini 2026-304).
 */
function metodPlacanjaLabel(metod: string): string {
  const metodLabel: Record<string, string> = {
    uplatnica: "Uplatnica (čeka uplatu)",
    paypal: "PayPal (čeka potvrdu)",
    kartica: "Kartica (instant)",
    kartica_rate: "Kartica na rate (instant)",
    kartica_pretplata: "Kartica - mesečna pretplata (instant)",
  };
  return metodLabel[metod] ?? `Nepoznat metod: ${metod || "(prazno)"} - proveri u adminu`;
}

// Trenutna notifikacija adminu (Nataši) čim stigne nova narudžbina - bez obzira na način plaćanja.
export async function sendNewOrderAdminEmail(o: {
  orderNumber: string;
  fullName: string;
  email: string;
  courseTitle: string;
  total: number;
  paymentMethod: string;
  country: string;
  /**
   * Popunjeno samo kad kupac naknadno promeni način plaćanja na već poslatoj
   * porudžbini (reuse pending porudžbine u /api/orders) - tada je ovo prethodni metod.
   */
  previousPaymentMethod?: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const promena = Boolean(o.previousPaymentMethod);
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const metodCell = promena
      ? `<span style="color:#888;text-decoration:line-through">${esc(metodPlacanjaLabel(o.previousPaymentMethod!))}</span><br>` +
        `<strong>${esc(metodPlacanjaLabel(o.paymentMethod))}</strong>`
      : esc(metodPlacanjaLabel(o.paymentMethod));
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      replyTo: o.email,
      subject: promena
        ? `Promenjen način plaćanja - ${o.fullName} · ${o.orderNumber}`
        : `Nova narudžbina - ${o.fullName} · ${fmt(o.total)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:560px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 12px">${promena ? "🔄 Promenjen način plaćanja" : "🛒 Nova narudžbina"}</h2>
${promena ? `<p style="margin:0 0 12px;background:#fff6e5;border-left:3px solid #e6a23c;padding:8px 12px;font-size:14px">Kupac je na istoj narudžbini promenio način plaćanja. Važi novi metod ispod.</p>` : ""}
<table style="border-collapse:collapse;font-size:14px;width:100%">
<tbody>
<tr><td style="padding:6px 8px;color:#888">Narudžbina</td><td style="padding:6px 8px;font-weight:600">${esc(o.orderNumber)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Polaznik</td><td style="padding:6px 8px">${esc(o.fullName)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Mejl</td><td style="padding:6px 8px">${esc(o.email)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Kurs</td><td style="padding:6px 8px">${esc(o.courseTitle)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Iznos</td><td style="padding:6px 8px;font-weight:600">${fmt(o.total)} din</td></tr>
<tr><td style="padding:6px 8px;color:#888">Plaćanje</td><td style="padding:6px 8px">${metodCell}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Zemlja</td><td style="padding:6px 8px">${esc(o.country)}</td></tr>
</tbody>
</table>
<p style="margin:18px 0 0">
  <a href="${SITE_URL}/admin/narudzbine" style="display:inline-block;background:#4fb1d3;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Otvori narudžbine</a>
</p>
</body></html>`,
    });
    console.log(
      promena
        ? `[email] Admin obavešten o promeni metoda na ${o.orderNumber}: ${o.previousPaymentMethod} → ${o.paymentMethod}`
        : `[email] Admin obavešten o narudžbini ${o.orderNumber}`
    );
  } catch (e) {
    console.error("[email] sendNewOrderAdminEmail pao:", e);
  }
}

/**
 * Potvrda o plaćanju karticom - obavezan mejl po Uputstvu za rad EPM (Banca Intesa) v3.5,
 * tačka 2.7. Šalje se iz NestPay callback-a za USPEŠNO i NEUSPEŠNO plaćanje, sa svih 5
 * propisanih elemenata: ishod, podaci o kupcu, o narudžbini, o trgovcu i o transakciji.
 * Kod neuspeha se NE navode razlozi odbijanja (dozvoljen samo bankin predloženi tekst).
 */
export async function sendCardPaymentConfirmationEmail(o: {
  email: string;
  fullName: string;
  orderNumber: string;
  items: { title: string; price: number }[];
  /** Iznos popusta u RSD (0 = bez popusta) - da se spisak stavki slaže sa ukupnom cenom. */
  discount: number;
  total: number;
  country: string;
  success: boolean;
  tx: NestpayTx;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const fmt = (n: number) => n.toLocaleString("sr-RS");
    const pdv = pdvBreakdown(o.total, o.country);
    const itemRows = o.items
      .map(
        (it) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${esc(it.title)} × 1</td>` +
          `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${fmt(it.price)} RSD</td></tr>`,
      )
      .join("");
    const txRow = (label: string, value: string) =>
      `<tr><td style="padding:4px 8px;color:#888;">${label}</td><td style="padding:4px 8px;">${esc(value)}</td></tr>`;

    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: o.success
        ? `Potvrda o plaćanju - narudžbina #${o.orderNumber}`
        : `Plaćanje nije uspešno - narudžbina #${o.orderNumber}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      </div>

      <h1 style="font-size:20px;margin:0 0 16px;">Potvrda o plaćanju</h1>

      <div style="background:${o.success ? "#effaf1;border:1px solid #bfe5c8" : "#fff3f3;border:1px solid #f0b9b9"};border-radius:8px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:15px;font-weight:700;color:${o.success ? "#1c7a34" : "#c0392b"};">
          ${o.success ? CARD_OUTCOME.success : CARD_OUTCOME.fail}
        </div>
        ${o.success ? "" : `<div style="font-size:14px;color:#444;line-height:1.6;margin-top:6px;">${CARD_OUTCOME.failHint}</div>`}
      </div>

      <h2 style="font-size:14px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Podaci o kupcu</h2>
      <p style="font-size:14px;color:#444;margin:0 0 18px;">${esc(o.fullName)}<br/>${esc(o.email)}</p>

      <h2 style="font-size:14px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Podaci o narudžbini</h2>
      <table style="border-collapse:collapse;font-size:14px;width:100%;margin:0 0 18px;">
        <tbody>
          ${itemRows}
          ${o.discount > 0 ? `<tr><td style="padding:6px 8px;color:#888;">Popust</td><td style="padding:6px 8px;text-align:right;white-space:nowrap;">−${fmt(o.discount)} RSD</td></tr>` : ""}
          <tr><td style="padding:6px 8px;color:#888;">${esc(pdv.label)}</td><td style="padding:6px 8px;text-align:right;white-space:nowrap;">${fmt(pdv.amountRsd)} RSD</td></tr>
          <tr><td style="padding:6px 8px;font-weight:700;">Ukupno</td><td style="padding:6px 8px;text-align:right;font-weight:700;white-space:nowrap;">${fmt(o.total)} RSD</td></tr>
          <tr><td style="padding:6px 8px;color:#888;">Broj porudžbenice (Order ID)</td><td style="padding:6px 8px;text-align:right;">${esc(o.orderNumber)}</td></tr>
        </tbody>
      </table>

      <h2 style="font-size:14px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Podaci o transakciji</h2>
      <table style="border-collapse:collapse;font-size:13px;width:100%;margin:0 0 18px;">
        <tbody>
          ${txRow("Datum i vreme", o.tx.dateTime)}
          ${txRow("Order ID", o.orderNumber)}
          ${txRow("AuthCode", o.tx.authCode)}
          ${txRow("Response", o.tx.response)}
          ${txRow("ProcReturnCode", o.tx.procReturnCode)}
          ${txRow("mdStatus", o.tx.mdStatus)}
        </tbody>
      </table>

      <h2 style="font-size:14px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Podaci o trgovcu</h2>
      <p style="font-size:13px;color:#444;line-height:1.6;margin:0;">
        ${esc(MERCHANT.naziv)}<br/>
        PIB: ${MERCHANT.pib}<br/>
        ${esc(MERCHANT.adresa)}
      </p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;">
      <p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p>
      <p style="margin:4px 0 0;"><a href="mailto:info@hartweger.rs" style="color:#bbb;text-decoration:none;">info@hartweger.rs</a></p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Potvrda o plaćanju (${o.success ? "uspeh" : "neuspeh"}) poslata za ${o.orderNumber} → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendCardPaymentConfirmationEmail pao za ${o.orderNumber}:`, e);
  }
}

// Polazniku čija kartična kupovina nije prošla (odbijena ili nezavršena) - ponuda da pokuša ponovo.
export async function sendCardRetryEmail(o: {
  email: string;
  fullName: string;
  courseTitle: string;
  courseSlug: string;
  orderNumber: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const retryUrl = `${SITE_URL}/kupovina/${o.courseSlug}`;
    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: "Kupovina nije prošla - pokušaj ponovo 🙂",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.fullName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Primetili smo da tvoja kupovina kursa <strong>${esc(o.courseTitle)}</strong> nije prošla - plaćanje karticom nije uspelo da se završi.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px;">
        To se ponekad desi (banka traži dodatnu potvrdu, istekla sesija…). Nije ti ništa naplaćeno. Možeš da pokušaš ponovo jednim klikom:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${retryUrl}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Završi kupovinu</a>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">
        Ako je bilo problema sa karticom ili želiš da platiš na drugi način (uplatnica), samo nam odgovori na ovaj mejl - rado pomažemo.
      </p>
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;">
      <p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Card-retry mejl poslat za ${o.orderNumber} → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendCardRetryEmail pao za ${o.orderNumber}:`, e);
  }
}

// Drugi podsetnik (3 dana posle) ako kupovina i dalje nije završena.
export async function sendCardReminder2Email(o: {
  email: string; fullName: string; courseTitle: string; courseSlug: string; orderNumber: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const retryUrl = `${SITE_URL}/kupovina/${o.courseSlug}`;
    await resend.emails.send({
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: "Tvoje mesto na kursu te još čeka 💙",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.fullName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Pre par dana si krenuo/la sa upisom na <strong>${esc(o.courseTitle)}</strong>, ali kupovina nije završena. Mesto te i dalje čeka 🙂
      </p>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px;">
        Ako želiš da nastaviš, treba ti samo minut:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${retryUrl}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Završi upis</a>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">
        Imaš pitanje ili želiš da platiš uplatnicom? Samo odgovori na ovaj mejl - tu smo.
      </p>
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] 2. podsetnik poslat za ${o.orderNumber} → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendCardReminder2Email pao za ${o.orderNumber}:`, e);
  }
}

// Obaveštenje da je neplaćena porudžbina otkazana (7 dana posle, ako ništa nije plaćeno).
export async function sendOrderCancelledEmail(o: {
  email: string; fullName: string; courseTitle: string; courseSlug: string; orderNumber: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const retryUrl = `${SITE_URL}/kupovina/${o.courseSlug}`;
    await resend.emails.send({
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: "Porudžbina je otkazana - ali možeš ponovo kad god želiš",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.fullName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Tvoja porudžbina za <strong>${esc(o.courseTitle)}</strong> nije plaćena, pa smo je zatvorili. Ništa ti nije naplaćeno.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px;">
        Ako se predomisliš, uvek možeš da se upišeš ponovo - bićemo tu:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${retryUrl}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Pogledaj kurs</a>
      </div>
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Otkazivanje poslato za ${o.orderNumber} → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendOrderCancelledEmail pao za ${o.orderNumber}:`, e);
  }
}

// Aktivacioni nudge: polaznik ima pristup ali nije otvorio nijednu lekciju - poziv da započne.
export async function sendActivationNudge(o: {
  email: string; name: string; courseTitle: string; lessonId: string | null; lessonTitle: string | null;
  /** Direktan login-link (/auth/mejl token). Bez njega pada na goli /lekcija ili /dashboard. */
  startUrl?: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const startUrl = o.startUrl ?? (o.lessonId ? `${SITE_URL}/lekcija/${o.lessonId}` : `${SITE_URL}/dashboard`);
    await sendEmail(resend, {
      bulk: true,
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: "Spreman/na da kreneš sa nemačkim? 🇩🇪",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.name || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Tvoj pristup kursu <strong>${esc(o.courseTitle)}</strong> je aktivan, ali primetili smo da još nisi započeo/la. Najteži korak je prvi - a traje samo par minuta 🙂
      </p>
      ${o.lessonTitle ? `<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:0 0 20px;"><div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Prva lekcija</div><div style="font-size:14px;color:#1a1a2e;">${esc(o.lessonTitle)}</div></div>` : ""}
      <div style="text-align:center;margin:24px 0;">
        <a href="${startUrl}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Započni prvu lekciju</a>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">
        Ako ti nešto nije jasno ili ti treba pomoć oko prvog koraka, samo odgovori na ovaj mejl - tu smo.
      </p>
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Aktivacioni nudge → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendActivationNudge pao za ${o.email}:`, e);
  }
}

// Podsetnik 15 dana pre isteka pristupa + poziv na obnovu (kupon OBNOVI50).
export interface ExpiryReminderItem {
  courseTitle: string;
  /**
   * Slug PROIZVODA za obnovu (npr. „video-kurs-a1"). Sadržajni kurs („nemacki-a1-1")
   * nije u prodaji, pa link na njega daje 404. Bez proizvoda nema kupon-verzije mejla.
   */
  renewSlug?: string | null;
  /** Naziv tog proizvoda - potreban samo kad grupa ima više različitih proizvoda za obnovu. */
  renewTitle?: string | null;
}

export interface ExpiryReminderInput {
  name: string;
  expiresAt: string;
  /**
   * Svi kursevi istog polaznika koji ističu istog dana - JEDAN mejl za sve. Slanje po
   * kursu je 13.08.2026. poslalo 6 identičnih mejlova vlasnici paketa od 6 nivoa.
   */
  items: ExpiryReminderItem[];
  /** true (default) = video kupci, mejl SA kuponom OBNOVI50. false = ind/grupni, samo info bez kupona. */
  withCoupon?: boolean;
  /**
   * Koliko dana posle isteka kupon još važi (`coupons.renewal_days_after`). Rok se
   * mora videti u mejlu - kod sa ćutljivim rokom je isto što i kod koji ne radi.
   */
  couponDaysAfter?: number | null;
  /** „Danas" za računanje preostalih dana - postoji zbog testova. */
  now?: Date;
}

/** Naslov + HTML podsetnika. Odvojeno od slanja da bi sadržaj mogao da se testira. */
export function expiryReminderContent(o: ExpiryReminderInput): { subject: string; html: string } | null {
  {
    const items = o.items.filter((i) => i.courseTitle);
    if (items.length === 0) return null;
    // Isti proizvod pokriva više nivoa (video-kurs-a1 → A1.1 i A1.2) - dugme se ne ponavlja.
    const products = [...new Map(
      items.filter((i) => i.renewSlug).map((i) => [i.renewSlug as string, i.renewTitle ?? null])
    ).entries()];
    const withCoupon = o.withCoupon !== false && products.length > 0;
    const datum = new Date(o.expiresAt).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });
    const daysLeft = Math.max(1, Math.round((new Date(o.expiresAt).getTime() - (o.now ?? new Date()).getTime()) / 86400000));
    const kodDo = o.couponDaysAfter == null
      ? null
      : new Date(new Date(o.expiresAt).getTime() + o.couponDaysAfter * 86400000)
          .toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });

    // Jedan proizvod → jedno dugme „Obnovi pristup". Više njih (paket od 6 nivoa se obnavlja
    // kroz 3 video kursa) → dugme po proizvodu, da se vidi šta koje obnavlja.
    const dugmad = products.map(([slug, naslov]) => `
      <div style="text-align:center;margin:0 0 10px;">
        <a href="${SITE_URL}/kupovina/${slug}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">${
          products.length === 1 ? "Obnovi pristup" : `Obnovi: ${esc(naslov ?? slug)}`
        }</a>
      </div>`).join("");

    const couponBlock = `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da nastaviš, možeš da <strong>obnoviš pristup na još godinu dana</strong> - i to uz <strong>50% popusta</strong> sa kodom:
      </p>
      <div style="text-align:center;margin:0 0 20px;">
        <span style="display:inline-block;background:#fff7ed;border:1px dashed #f59e0b;color:#b45309;font-weight:700;font-size:18px;letter-spacing:1px;padding:10px 20px;border-radius:8px;">OBNOVI50</span>
      </div>
      <div style="margin:24px 0;">${dugmad}</div>
      <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 8px;">
        Kod uneseš u polju za kupon prilikom kupovine.${kodDo ? ` Važi do <strong>${kodDo}</strong> - i posle isteka pristupa imaš vremena da se predomisliš.` : ""} Ako ti treba pomoć, samo odgovori na ovaj mejl.
      </p>`;

    const noCouponBlock = `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da nastaviš ili pređeš na sledeći nivo, javi nam se - dogovorićemo najbolji sledeći korak za tebe.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="mailto:info@hartweger.rs" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Javi nam se</a>
      </div>`;

    const jedan = items.length === 1;
    // Više kurseva → spisak, jedan → naziv u rečenici (dokazana kopija ostaje netaknuta).
    const uvod = jedan
      ? `Tvoj pristup materijalima na platformi za <strong>${esc(items[0].courseTitle)}</strong> ističe <strong>${datum}</strong> (za ${daysLeft} ${daysLeft === 1 ? "dan" : "dana"}). Posle toga lekcije više neće biti dostupne.`
      : `Tvoj pristup materijalima na platformi ističe <strong>${datum}</strong> (za ${daysLeft} ${daysLeft === 1 ? "dan" : "dana"}) za ove kurseve:</p>
      <ul style="font-size:15px;line-height:1.7;color:#444;margin:0 0 16px;padding-left:20px;">${
        items.map((i) => `<li>${esc(i.courseTitle)}</li>`).join("")
      }</ul>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Posle toga lekcije više neće biti dostupne.`;

    return {
      subject: withCoupon
        ? `Tvoj pristup ${jedan ? "kursu" : "kursevima"} ističe ${datum} - obnovi sa 50% popusta`
        : `Tvoj pristup materijalima ističe ${datum}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.name || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">${uvod}</p>
      ${withCoupon ? couponBlock : noCouponBlock}
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    };
  }
}

export async function sendExpiryReminder(o: ExpiryReminderInput & { email: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    const sadrzaj = expiryReminderContent(o);
    if (!sadrzaj) return;
    await resend.emails.send({
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: sadrzaj.subject, html: sadrzaj.html,
    });
    console.log(`[email] Podsetnik isteka → ${o.email} (${o.items.map((i) => i.courseTitle).join(", ")})`);
  } catch (e) {
    console.error(`[email] sendExpiryReminder pao za ${o.email}:`, e);
  }
}

// Zamolnica aktivnom polazniku da podeli utisak (Google forma) - radi na zadržavanju + društvenom dokazu.
const REVIEW_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdkhFGw1YN0A6fQp2xvcqrqpSGbUEmcpUHtfLRCi3PagI0Ksw/viewform";
// Zvanični Google Business review link (isti koji stoji na kraju forme utisaka).
const GOOGLE_REVIEW_URL = "https://g.page/r/Ca0DnH5bZ6YHEB0/review";

// Kratak ask za recenziju posle položenog ispita (nov sertifikat). Google link je PRVI/glavni.
export async function sendReviewRequestRecert(o: { email: string; name: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      bulk: true,
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: "Čestitamo na položenom ispitu! 🎉",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Bravo, ${esc(o.name || "")}! 🎉</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px;">
        Položio/la si ispit i osvojio/la novi nivo - svaka čast na trudu! Ako ti je škola pomogla na tom putu, par reči na Google-u mnogo znači i pomaže nekom ko se još dvoumi da krene.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${GOOGLE_REVIEW_URL}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Ostavi recenziju na Google-u</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 8px;text-align:center;">
        Više voliš par rečenica nama direktno? <a href="${REVIEW_FORM_URL}" style="color:#4fb1d3;">Popuni kratku formu</a>.
      </p>
      <p style="font-size:14px;color:#444;margin:16px 0 0;">Hvala ti i vidimo se na sledećem nivou! - Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Recenzija posle sertifikata → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendReviewRequestRecert pao za ${o.email}:`, e);
  }
}
export async function sendReviewRequest(o: { email: string; name: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      bulk: true,
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: "Kako ti ide sa nemačkim? Podeli utisak 💬",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.name || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Vidimo da redovno učiš i napreduješ - bravo! 🎉 Ako ti se kurs dopada, znači nam mnogo da čujemo tvoj utisak.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px;">
        Treba ti samo minut - popuni kratku formu (i pomozi nekom ko se još dvoumi da krene):
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${REVIEW_FORM_URL}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Podeli utisak</a>
      </div>
      <p style="font-size:14px;color:#444;margin:0;">Hvala ti puno! - Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Zamolnica za utisak → ${o.email}`);
  } catch (e) {
    console.error(`[email] sendReviewRequest pao za ${o.email}:`, e);
  }
}

// Jutarnji pregled adminu (Nataši) - dnevni snapshot stanja iz Supabase.
export type DailyBrief = {
  datum: string;
  /** Mesečno plaćanje: naplate 2..N, pale naplate i otkazivanja se ne vide nigde drugde. */
  pretplate?: SubscriptionBrief;
  /** NaKI: efekat prepravki promptova od 27.07.2026 (ponuda kursa, ponovljena pitanja, ton). */
  naki?: NakiBrief;
  noveNarudzbine: { broj: number; iznos: number };
  neaktivnostPoslato: number;
  neplacene: { orderNumber: string; ime: string; total: number; metod: string; danaStaro: number }[];
  isticePristup: { ime: string; kurs: string; datum: string }[];
  indOstao1: { ime: string; profesorka: string; kurs: string }[];
  grupeKraj: { nivo: string; profesorka: string; endDate: string; brojPolaznika: number }[];
  bounces?: { email: string; tip: string; razlog: string }[];
};

export async function sendDailyAdminBrief(d: DailyBrief) {
  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `Jutarnji pregled - ${d.datum}`,
      html: buildDailyBriefHtml(d),
    });
  } catch (e) {
    console.error("[email] sendDailyAdminBrief pao:", e);
  }
}

/** HTML jutarnjeg pregleda. Izdvojeno iz slanja da se izgled može proveriti bez slanja mejla. */
export function buildDailyBriefHtml(d: DailyBrief): string {
  {
    const fmt = (n: number) => n.toLocaleString("de-DE");

    const sekcija = (naslov: string, telo: string, prazno: string) =>
      `<h3 style="margin:22px 0 8px;font-size:15px;color:#1a1a2e">${naslov}</h3>` +
      (telo || `<p style="margin:0;color:#999;font-size:13px">${prazno}</p>`);

    const neplaceneHtml = d.neplacene.length
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Narudžbina</th><th style="padding:4px 8px;text-align:left">Polaznik</th><th style="padding:4px 8px;text-align:right">din</th><th style="padding:4px 8px;text-align:left">Način</th><th style="padding:4px 8px;text-align:right">dana</th></tr></thead>
<tbody>${d.neplacene.map((r) => `<tr><td style="padding:4px 8px">${esc(r.orderNumber)}</td><td style="padding:4px 8px">${esc(r.ime)}</td><td style="padding:4px 8px;text-align:right">${fmt(r.total)}</td><td style="padding:4px 8px">${esc(r.metod)}</td><td style="padding:4px 8px;text-align:right">${r.danaStaro}${r.danaStaro >= 21 ? " ⚠️" : ""}</td></tr>`).join("")}</tbody></table>${d.neplacene.some((r) => r.danaStaro >= 21) ? `<p style="margin:6px 0 0;font-size:12px;color:#b45309">⚠️ = starije od 21 dan, polaznik je dobio oba podsetnika - razmisli o ručnom otkazivanju u /admin/narudzbine.</p>` : ""}`
      : "";

    const isteknHtml = d.isticePristup.length
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Polaznik</th><th style="padding:4px 8px;text-align:left">Kurs</th><th style="padding:4px 8px;text-align:right">Ističe</th></tr></thead>
<tbody>${d.isticePristup.map((r) => `<tr><td style="padding:4px 8px">${esc(r.ime)}</td><td style="padding:4px 8px">${esc(r.kurs)}</td><td style="padding:4px 8px;text-align:right">${esc(r.datum)}</td></tr>`).join("")}</tbody></table>`
      : "";

    const indHtml = d.indOstao1.length
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Polaznik</th><th style="padding:4px 8px;text-align:left">Profesorka</th><th style="padding:4px 8px;text-align:left">Kurs</th></tr></thead>
<tbody>${d.indOstao1.map((r) => `<tr><td style="padding:4px 8px">${esc(r.ime)}</td><td style="padding:4px 8px">${esc(r.profesorka)}</td><td style="padding:4px 8px">${esc(r.kurs)}</td></tr>`).join("")}</tbody></table>`
      : "";

    const grupeHtml = d.grupeKraj.length
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Nivo</th><th style="padding:4px 8px;text-align:left">Profesorka</th><th style="padding:4px 8px;text-align:right">Kraj</th><th style="padding:4px 8px;text-align:right">Polaznika</th></tr></thead>
<tbody>${d.grupeKraj.map((r) => `<tr><td style="padding:4px 8px">${esc(r.nivo)}</td><td style="padding:4px 8px">${esc(r.profesorka)}</td><td style="padding:4px 8px;text-align:right">${esc(r.endDate)}</td><td style="padding:4px 8px;text-align:right">${r.brojPolaznika}</td></tr>`).join("")}</tbody></table>`
      : "";

    // Pretplate: sve tri stvari (naplaćeno, palo, otkazano) inače prolaze tiho.
    const p = d.pretplate;
    const redoviPretplata = [
      ...(p?.naplaceno ?? []).map(
        (r) => `✅ <strong>${esc(r.ime)}</strong> - ${r.rata}. naplata od ${r.ukupno}, ${fmt(r.iznos)} din`,
      ),
      ...(p?.pale ?? []).map(
        (r) =>
          `⚠️ <strong>${esc(r.ime)}</strong> - ${r.rata ? `${r.rata}. naplata` : "naplata"} nije prošla, ` +
          (r.odbijeno
            ? `<strong>banka odbila raniji pokušaj</strong> - čeka se redovan termin, vidi da li treba ručno`
            : `zakazan ${r.pokusaj}. pokušaj od 30`),
      ),
      ...(p?.otkazano ?? []).map(
        (r) => `🚪 <strong>${esc(r.ime)}</strong> - otkazano posle ${r.placeno}/${r.ukupno} naplata · ${esc(r.razlog)}`,
      ),
    ];
    const pretplateHtml = p
      ? `${redoviPretplata.length ? `<ul style="margin:0 0 8px;padding-left:20px;font-size:13px">${redoviPretplata.map((r) => `<li style="margin:2px 0">${r}</li>`).join("")}</ul>` : `<p style="margin:0 0 8px;color:#999;font-size:13px">Juče se nije promenilo ništa.</p>`}
<p style="margin:0;font-size:13px;color:#555">Ukupno: <strong>${p.aktivnih}</strong> ${p.aktivnih === 1 ? "aktivna pretplata" : "aktivnih pretplata"} · <strong>${fmt(p.mesecno)} din</strong> mesečno</p>`
      : "";

    // NaKI: prati efekat prepravki promptova (27.07.2026). Osnovice za poređenje su
    // upisane u sam mejl, da se brojka ne gleda bez konteksta.
    const n = d.naki;
    const alarm = (uslov: boolean) => (uslov ? ' style="color:#b45309;font-weight:bold"' : "");
    const nakiHtml = n
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<tbody>
<tr><td style="padding:3px 8px">Sesije / poruke</td><td style="padding:3px 8px;text-align:right">${n.sesija} / ${n.porukaKorisnika}</td><td style="padding:3px 8px;color:#999">&nbsp;</td></tr>
<tr><td style="padding:3px 8px">Ponuda kursa</td><td style="padding:3px 8px;text-align:right"${alarm(n.ponudaProcenat < 20)}>${n.ponudaKursa} sesija (${n.ponudaProcenat}%)</td><td style="padding:3px 8px;color:#999">cilj ~43%, pre izmene 3%</td></tr>
<tr><td style="padding:3px 8px">Ponovljeno pitanje (nivo/rod)</td><td style="padding:3px 8px;text-align:right"${alarm(n.ponovljenoPitanje > 0)}>${n.ponovljenoPitanje}</td><td style="padding:3px 8px;color:#999">mora biti 0</td></tr>
<tr><td style="padding:3px 8px">Pohvale : žalbe</td><td style="padding:3px 8px;text-align:right"${alarm(n.odnos !== null && n.odnos < 3)}>${n.odnos === null ? `${n.pohvale} : 0` : `${n.odnos} : 1`}</td><td style="padding:3px 8px;color:#999">osnovica 4,6 - ako padne, ponuda smeta</td></tr>
<tr><td style="padding:3px 8px">Novi mejlovi</td><td style="padding:3px 8px;text-align:right">${n.noviMejlovi} (${n.stopaHvatanja}%)</td><td style="padding:3px 8px;color:#999">ranije 7-16%</td></tr>
<tr><td style="padding:3px 8px">Potrošen dnevni limit</td><td style="padding:3px 8px;text-align:right">${n.limitDogadjaja}</td><td style="padding:3px 8px;color:#999">&nbsp;</td></tr>
</tbody></table>`
      : "";

    return `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 4px">Dobro jutro ☀️</h2>
<p style="margin:0 0 4px;color:#666;font-size:13px">Pregled za ${esc(d.datum)}</p>
<div style="background:#f8fcfd;border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px">
  <strong>Juče:</strong> ${d.noveNarudzbine.broj} ${d.noveNarudzbine.broj === 1 ? "nova narudžbina" : "novih narudžbina"} (${fmt(d.noveNarudzbine.iznos)} din naplaćeno) · ${d.neaktivnostPoslato} podsetnika za neaktivnost
</div>
${p ? sekcija(`Mesečno plaćanje (${p.aktivnih})`, pretplateHtml, "") : ""}
${n ? sekcija("NaKI juče", nakiHtml, "") : ""}
${sekcija(`Neplaćene narudžbine (${d.neplacene.length})`, neplaceneHtml, "Nema neplaćenih narudžbina.")}
${sekcija(`Ističe pristup - narednih 7 dana (${d.isticePristup.length})`, isteknHtml, "Niko ne ističe ove nedelje.")}
${sekcija(`Individualni - ostao 1 čas (${d.indOstao1.length})`, indHtml, "Nema paketa pri kraju.")}
${sekcija(`Grupe se završavaju - narednih 14 dana (${d.grupeKraj.length})`, grupeHtml, "Nijedna grupa se ne završava uskoro.")}
${(d.bounces?.length ?? 0) > 0 ? sekcija(
  `📪 Mejlovi koji nisu stigli - juče (${d.bounces!.length})`,
  `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Mejl</th><th style="padding:4px 8px;text-align:left">Šta</th><th style="padding:4px 8px;text-align:left">Razlog</th></tr></thead>
<tbody>${d.bounces!.map((b) => `<tr><td style="padding:4px 8px">${esc(b.email)}</td><td style="padding:4px 8px">${esc(b.tip)}</td><td style="padding:4px 8px;color:#888">${esc(b.razlog.slice(0, 80))}</td></tr>`).join("")}</tbody></table>
<p style="margin:6px 0 0;font-size:12px;color:#b45309">Ovi polaznici NE dobijaju naše mejlove - proveri da li imaš drugi kontakt (telefon) ili ispravi mejl u /admin/studenti.</p>`,
  "",
) : ""}
<p style="margin-top:24px;font-size:12px;color:#aaa">Automatski izveštaj iz LMS-a. Detalji na <a href="https://www.hartweger.rs/admin" style="color:#4fb1d3;text-decoration:none">/admin</a>.</p>
</body></html>`;
  }
}

// Mejl #1 testiranje-funnela: rezultat testa znanja, šalje se ODMAH po testu iz LMS-a
// (zamena za MailerLite automaciju "Einstufungstest - rezultat" - nju ugasiti u MailerLite-u).
export async function sendTestResultEmail(
  to: string,
  opts: {
    nivo: string;
    score: string;
    grupniUrl: string | null;
    individualniUrl: string | null;
    videoUrl: string | null;
    kurseviUrl: string;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const nivo = esc(opts.nivo);
    const videoLabel = esc(opts.nivo.split(".")[0]);

    const linkovi =
      `<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px;">` +
      (opts.grupniUrl ? `<p style="margin:0 0 6px;">👥 <a href="${esc(opts.grupniUrl)}" style="color:#4fb1d3;">Grupni kurs ${nivo}</a> - grupe do 6 polaznika, uživo preko Google Meet-a</p>` : "") +
      (opts.individualniUrl ? `<p style="margin:0 0 6px;">🎯 <a href="${esc(opts.individualniUrl)}" style="color:#4fb1d3;">Individualni kurs ${nivo}</a> - 1-na-1 sa profesorkom</p>` : "") +
      (opts.videoUrl
        ? `<p style="margin:0;">🎬 <a href="${esc(opts.videoUrl)}" style="color:#4fb1d3;">Video kurs ${videoLabel}</a> - uči svojim tempom</p>`
        : `<p style="margin:0;">🎬 <a href="${esc(opts.kurseviUrl)}" style="color:#4fb1d3;">Video kursevi</a> - uči svojim tempom</p>`) +
      `</div>`;

    await sendEmail(resend, {
      bulk: true,
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Tvoj rezultat testa znanja - nivo ${opts.nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      </div>
      <h1 style="font-size:20px;margin:0 0 16px;">Bravo, test je iza tebe! 🎉</h1>
      <div style="background:#f8fcfd;border-radius:8px;padding:18px;text-align:center;margin:0 0 20px;">
        <div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Tvoj rezultat</div>
        <div style="font-size:15px;color:#444;margin-top:6px;">Tačnih odgovora: <strong>${esc(opts.score)}</strong></div>
        <div style="font-size:22px;font-weight:700;color:#4fb1d3;margin-top:8px;">Preporučeni nivo: ${nivo}</div>
      </div>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px;">
        Na osnovu testa, ovo su kursevi koji ti najviše odgovaraju:
      </p>
      ${linkovi}
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">
        Ako nisi siguran/na šta ti najviše odgovara, samo odgovori na ovaj mejl - rado pomažemo da izabereš.
      </p>
      <p style="font-size:14px;color:#444;margin:16px 0 0;">Srdačan pozdrav,<br>Nataša Hartweger</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;">
      <p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p>
      <p style="margin:4px 0 0;">Dobijaš ovaj mejl jer si uradio/la test znanja na hartweger.rs. <a href="${odjavaUrl(to)}" style="color:#bbb;">Odjavi se od ponuda</a></p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Rezultat testa (${opts.nivo}) → ${to}`);
  } catch (e) {
    console.error("[email] sendTestResultEmail pao:", e);
  }
}

// Testiranje-funnel: follow-up mejlovi #2-#4 posle testa znanja (mejl #1 "rezultat" šalje sendTestResultEmail odmah po testu).
// Zamena za Apps Script generisiTestiranjeMejl/skenirajTestiranje.
export async function sendTestFunnelEmail(
  to: string,
  opts: {
    name: string;
    nivo: string;
    emailNumber: 2 | 3 | 4;
    grupniUrl: string | null;
    individualniUrl: string | null;
    videoUrl: string | null;
    kurseviUrl: string;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = opts.name ? opts.name.split(" ")[0] : "";
    const pozdrav = `Pozdrav${ime ? ", " + esc(ime) : ""}!`;
    const nivo = esc(opts.nivo);
    const videoLabel = esc(opts.nivo.split(".")[0]);

    const linkovi =
      `<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px">` +
      (opts.grupniUrl ? `<p style="margin:0 0 6px">👥 <a href="${esc(opts.grupniUrl)}" style="color:#4fb1d3">Grupni kurs ${nivo}</a> - grupe do 6 polaznika</p>` : "") +
      (opts.individualniUrl ? `<p style="margin:0 0 6px">🎯 <a href="${esc(opts.individualniUrl)}" style="color:#4fb1d3">Individualni kurs ${nivo}</a> - 1-na-1 sa profesorkom</p>` : "") +
      (opts.videoUrl
        ? `<p style="margin:0">🎬 <a href="${esc(opts.videoUrl)}" style="color:#4fb1d3">Video kurs ${videoLabel}</a> - uči svojim tempom</p>`
        : `<p style="margin:0">🎬 <a href="${esc(opts.kurseviUrl)}" style="color:#4fb1d3">Video kursevi</a> - uči svojim tempom</p>`) +
      `</div>`;

    let subject: string;
    let telo: string;
    if (opts.emailNumber === 2) {
      subject = `Još razmišljaš? Evo šta uključuje kurs ${opts.nivo}`;
      telo = `<p>Uradio/la si test znanja i odgovara ti nivo <strong>${nivo}</strong>.</p>
<p>Evo šta dobijaš na kursu:</p>
<ul style="padding-left:20px">
<li>Video lekcije sa objašnjenjima gramatike i vežbama</li>
<li>Kvizove za proveru znanja nakon svake lekcije</li>
<li>Završni test i sertifikat po završetku nivoa</li>
<li>Pristup materijalima 24/7</li>
</ul>`;
    } else if (opts.emailNumber === 3) {
      subject = `Polaznici kursa ${opts.nivo} kažu...`;
      telo = `<p>Znamo da je odluka o kursu važna, pa delimo iskustva naših polaznika:</p>
<blockquote style="border-left:3px solid #ddd;margin:14px 0;padding:4px 14px;color:#555;font-style:italic">„Konačno sam našla kurs koji je prilagođen mom tempu učenja."</blockquote>
<blockquote style="border-left:3px solid #ddd;margin:14px 0;padding:4px 14px;color:#555;font-style:italic">„Profesorke su fantastične, sve je jasno objašnjeno."</blockquote>
<p>Pridruži se i ti - tvoj nivo je <strong>${nivo}</strong>:</p>`;
    } else {
      subject = `Poslednja šansa - započni ${opts.nivo} ovog meseca`;
      telo = `<p>Ovo je poslednji put da ti se javljamo u vezi sa rezultatom testa znanja.</p>
<p>Tvoj preporučeni nivo je <strong>${nivo}</strong> i kursevi su dostupni odmah:</p>`;
    }

    await sendEmail(resend, {
      bulk: true,
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:560px;margin:0 auto;padding:16px">
<p>${pozdrav}</p>
${telo}
${linkovi}
<p>Ako imaš bilo kakvih pitanja pre upisa, samo odgovori na ovaj mejl.</p>
<p style="margin-top:20px">Srdačan pozdrav,<br>Nataša Hartweger</p>
<p style="margin-top:24px;font-size:12px;color:#aaa">Dobijaš ovaj mejl jer si uradio/la test znanja na hartweger.rs. <a href="${odjavaUrl(to)}" style="color:#aaa">Odjavi se od ovih ponuda</a>.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendTestFunnelEmail pao:", e);
  }
}

// Dnevni rezime: koliko Schreiben-a čeka pregled. Šalje se profesoru (njegovi učenici)
// ili adminu (eseji bez dodeljenog profa). `link` vodi na odgovarajuću stranicu za pregled.
export async function sendPendingEssaysDigest(o: {
  to: string | string[];
  recipientName: string;
  essays: { studentName: string; lessonTitle: string; submittedAt: string }[];
  forAdmin: boolean;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    if (o.essays.length === 0) return;

    const link = o.forAdmin ? `${SITE_URL}/admin/eseji` : `${SITE_URL}/profesor/eseji`;
    const n = o.essays.length;
    const naslov = o.forAdmin
      ? `${n} Schreiben-a bez profesora čeka pregled`
      : `Imaš ${n} ${n === 1 ? "Schreiben" : "Schreiben-a"} za pregled`;
    const fmtDan = (v: string) =>
      new Date(v).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

    const redovi = o.essays
      .map(
        (e) =>
          `<tr><td style="padding:6px 8px">${esc(e.studentName)}</td><td style="padding:6px 8px">${esc(
            e.lessonTitle
          )}</td><td style="padding:6px 8px;text-align:right;color:#888">${esc(fmtDan(e.submittedAt))}</td></tr>`
      )
      .join("");

    await resend.emails.send({
      from: FROM,
      to: o.to,
      replyTo: "info@hartweger.rs",
      subject: `📝 ${naslov}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:19px;margin:0 0 12px;">Zdravo, ${esc(o.recipientName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">${esc(naslov)}. Pregled počinje od AI provere koja je već urađena - ti samo dodaš svoj komentar i ocenu i objaviš.</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%;margin:0 0 8px;">
        <thead><tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Učenik</th><th style="padding:6px 8px;text-align:left">Lekcija</th><th style="padding:6px 8px;text-align:right">Poslato</th></tr></thead>
        <tbody>${redovi}</tbody>
      </table>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${link}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Otvori pregled</a>
      </div>
      <p style="font-size:13px;color:#888;margin:12px 0 0;">Hartweger tim</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Rezime eseja (${o.essays.length}) → ${o.to}`);
  } catch (e) {
    console.error(`[email] sendPendingEssaysDigest pao za ${o.to}:`, e);
  }
}

// Učeniku kad profesor/admin objavi pregled njegovog Schreiben-a.
export async function sendEssayFeedbackEmail(o: {
  to: string;
  studentName: string;
  lessonTitle: string;
  lessonId: string;
  score: number | null;
  feedback: string | null;
}) {
  try {
    const resend = getResend();
    if (!resend) return;

    const labels: Record<number, string> = {
      1: "Treba još vežbe",
      2: "Solidno, ali ima prostora",
      3: "Dobro",
      4: "Vrlo dobro",
      5: "Odlično!",
    };
    const ocenaHtml =
      o.score != null
        ? `<p style="font-size:15px;margin:0 0 12px;color:#1a1a2e;"><strong>Ocena:</strong> ${"★".repeat(o.score)}${"☆".repeat(5 - o.score)} - ${esc(labels[o.score] ?? "")}</p>`
        : "";
    const komentarHtml = o.feedback
      ? `<div style="background:#f8fcfd;border-radius:8px;padding:14px 16px;margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">${esc(o.feedback)}</div>`
      : "";

    await resend.emails.send({
      from: FROM,
      to: o.to,
      replyTo: "info@hartweger.rs",
      subject: "📝 Tvoj Schreiben je pregledan",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:20px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 12px;">Zdravo, ${esc(o.studentName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Tvoj profesor je pregledao Schreiben iz lekcije <strong>${esc(o.lessonTitle)}</strong>.</p>
      ${ocenaHtml}
      ${komentarHtml}
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE_URL}/lekcija/${esc(o.lessonId)}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Pogledaj feedback</a>
      </div>
      <p style="font-size:14px;color:#444;margin:12px 0 0;">Samo nastavi ovako! - Hartweger tim</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Feedback eseja → ${o.to}`);
  } catch (e) {
    console.error(`[email] sendEssayFeedbackEmail pao za ${o.to}:`, e);
  }
}

/** Alarm Nataši: pristupi (course_access) upisani BEZ source taga posle uvođenja taga = sumnjivo (možda bug u mapiranju). */
export async function sendAccessAuditEmail(rows: { ime: string; email: string; kurs: string; datum: string }[]) {
  try {
    const resend = getResend();
    if (!resend) return;
    const redovi = rows
      .map(
        (r) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(r.ime || "")}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(r.email || "")}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(r.kurs || "")}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(r.datum || "")}</td></tr>`,
      )
      .join("");
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `⚠️ Provera pristupa: ${rows.length} ${rows.length === 1 ? "grant bez opravdanja" : "grantova bez opravdanja"}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Pristup dodeljen bez traga (source)</h2>
<p>Ovi pristupi su upisani u <code>course_access</code> bez <code>source</code> taga otkad je tag uveden. Svaki regularan grant (kupovina, grupa, migracija) sad ostavlja trag — pa ovo može da znači grešku u mapiranju proizvoda ili ručan unos. Proveri da li je svaki opravdan.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
<thead><tr style="background:#f5f5f5"><th style="padding:6px 10px;text-align:left">Ime</th><th style="padding:6px 10px;text-align:left">Email</th><th style="padding:6px 10px;text-align:left">Kurs</th><th style="padding:6px 10px;text-align:left">Dodeljeno</th></tr></thead>
<tbody>${redovi}</tbody>
</table>
<p style="font-size:13px;color:#666;margin-top:16px">Ako je grant ispravan, ne treba ništa — alarm je samo upozorenje. Ako nije, ukloni red u Supabase ili javi.</p>
</body></html>`,
    });
    console.log(`[email] Access audit alarm → ${rows.length} redova`);
  } catch (e) {
    console.error("[email] sendAccessAuditEmail pao:", e);
  }
}

// Nedeljni "NaKI pitanje nedelje" - content podsetnik Nataši (info@).
// Tema = najtraženija iz NaKI razgovora te nedelje + gotov YT/IG ugao.
export async function sendNakiContentEmail(opts: {
  tema: string;
  sesija: number;
  primeri: string[];
  yt: string;
  ig: string;
  dani: number;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const primeriHtml = opts.primeri.length
      ? `<ul style="margin:8px 0 0;padding-left:20px;color:#444">${opts.primeri
          .map((p) => `<li style="margin:2px 0">${esc(p)}</li>`)
          .join("")}</ul>`
      : `<p style="color:#888;margin:8px 0 0">(nema kratkih primera ove nedelje)</p>`;
    await resend.emails.send({
      from: "Hartweger NaKI <info@hartweger.rs>",
      to: "info@hartweger.rs",
      replyTo: "info@hartweger.rs",
      subject: `NaKI pitanje nedelje: ${opts.tema}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
<div style="font-size:13px;color:#999">NaKI pitanje nedelje · poslednjih ${opts.dani} dana</div>
<h2 style="margin:6px 0 4px;color:#4fb1d3">${esc(opts.tema)}</h2>
<p style="margin:0;color:#666;font-size:14px">Javilo se u <strong>${opts.sesija}</strong> različitih NaKI sesija ove nedelje - dokazana tražnja.</p>
<p style="margin:18px 0 4px;font-weight:600">Šta učenici stvarno pišu:</p>
${primeriHtml}
<p style="margin:18px 0 4px;font-weight:600">YouTube ugao:</p>
<p style="margin:0;color:#444">${esc(opts.yt)}</p>
<p style="margin:14px 0 4px;font-weight:600">Instagram ideja:</p>
<p style="margin:0;color:#444">${esc(opts.ig)}</p>
<p style="margin:22px 0 0;font-size:13px;color:#888">Cela lista tema: <code>cd LMS/lms &amp;&amp; node scripts/naki-topics.mjs</code></p>
</div>
<p style="text-align:center;font-size:12px;color:#bbb;margin-top:16px">Automatski podsetnik · ponedeljkom</p>
</div>
</body></html>`,
    });
    console.log(`[email] NaKI pitanje nedelje → "${opts.tema}" (${opts.sesija} sesija)`);
  } catch (e) {
    console.error("[email] sendNakiContentEmail pao:", e);
  }
}

// Ponedeljni podsetnik profesorki: njeni polaznici koji "traže pažnju" na platformi
// (crveni: neaktivni >14 dana ili nije počeo posle grejs-perioda). Zamena za stari LD mejl.
export async function sendProfPodsetnik(opts: {
  to: string;
  profIme: string;
  polaznici: { ime: string; razlog: string }[];
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const n = opts.polaznici.length;
    if (n === 0) return;
    const ime = opts.profIme ? opts.profIme.split(" ")[0] : "";
    const redovi = opts.polaznici
      .map(
        (p) =>
          `<tr><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#1a1a2e;">${esc(p.ime)}</td>
<td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#e74c3c;font-size:13px;">${esc(p.razlog)}</td></tr>`,
      )
      .join("");
    const naslov = n === 1 ? "1 polaznik ti traži pažnju na platformi" : `${n} polaznika ti traže pažnju na platformi`;
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: "info@hartweger.rs",
      subject: naslov,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
        <div style="font-size:13px;color:#999;margin-top:4px;">Nedeljni pregled</div>
      </div>
      <h1 style="font-size:19px;margin:0 0 8px;">Hallo${ime ? ", " + esc(ime) : ""}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Ovi tvoji polaznici se nisu javljali na platformi - možda im treba mali podstrek:</p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 8px;">${redovi}</table>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE_URL}/profesor" style="display:inline-block;background:#4fb1d3;color:white;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Otvori panel</a>
      </div>
      <p style="font-size:13px;color:#999;text-align:center;margin:8px 0 0;">Na panelu vidiš napredak svih polaznika u realnom vremenu.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#bbb;margin-top:16px;">Automatski podsetnik · ponedeljkom</p>
  </div>
</body></html>`,
    });
    console.log(`[email] prof-podsetnik → ${opts.to} (${n} polaznika)`);
  } catch (e) {
    console.error("[email] sendProfPodsetnik pao:", e);
  }
}

// Zbirni pregled Nataši: koja profesorka ima koliko polaznika koji traže pažnju.
export async function sendNatasaProfPodsetnikZbirni(opts: {
  stavke: { prof: string; broj: number }[];
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ukupno = opts.stavke.reduce((s, x) => s + x.broj, 0);
    const redovi = opts.stavke.length
      ? opts.stavke
          .map(
            (s) =>
              `<tr><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;">${esc(s.prof)}</td>
<td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:#e74c3c;font-weight:600;">${s.broj}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="2" style="padding:10px;color:#27ae60;">Nijedna profesorka nema polaznike koji traže pažnju ✓</td></tr>`;
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      replyTo: "info@hartweger.rs",
      subject: `Nedeljni pregled profesorki: ${ukupno} polaznika traži pažnju`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:19px;margin:0 0 16px;color:#4fb1d3;">Nedeljni pregled - profesorke</h1>
      <table style="border-collapse:collapse;width:100%;">${redovi}</table>
    </div>
    <p style="text-align:center;font-size:12px;color:#bbb;margin-top:16px;">Automatski zbirni pregled · ponedeljkom</p>
  </div>
</body></html>`,
    });
    console.log(`[email] prof-podsetnik zbirni → Nataša (${ukupno} ukupno)`);
  } catch (e) {
    console.error("[email] sendNatasaProfPodsetnikZbirni pao:", e);
  }
}

// ---- Nedeljni poslovni izveštaj (ponedeljkom, adminu) ----
// Živi podaci iz Supabase. Zamena za stari marketinški Apps Script koji je čitao iz
// ručno ažuriranog Google Sheet-a. Šalje cron /api/cron/business-summary.
export type WeeklySummary = {
  odDatum: string;
  doDatum: string;
  prihod: {
    iznos: number;
    broj: number;
    prosleIznos: number;
    prosleBroj: number;
    poMetodu: { metod: string; broj: number; iznos: number }[];
  };
  aktivacija: {
    noviPristup: number; // novi pristupi (course_access) ove nedelje
    odNjihKrenulo: number; // koliko njih je otvorilo bar 1 lekciju
    zaglavljeni30: number; // pristup u posl. 30 dana, nikad nijedna lekcija
  };
  upisi: { nivo: string; tip: string; broj: number }[];
  upisiUkupno: number;
  istek: {
    brojNarednih15: number;
    obnovi50OveNedelje: number;
    stavke: { ime: string; kurs: string; datum: string }[];
  };
  declined: {
    broj: number;
    stavke: { ime: string; iznos: number; datum: string }[];
  };
  ga4?: Ga4Weekly | null; // saobraćaj iz GA4; izostaje ako kredencijali nisu postavljeni
};

export async function sendWeeklyBusinessSummary(s: WeeklySummary) {
  const resend = getResend();
  if (!resend) return;

  const num = (n: number) => new Intl.NumberFormat("sr-RS").format(n);
  const rsd = (n: number) => `${new Intl.NumberFormat("sr-RS").format(Math.round(n))} RSD`;

  const deltaBadge = (now: number, prev: number) => {
    if (prev === 0) return now > 0 ? `<span style="color:#16a34a;">▲ novo</span>` : `<span style="color:#999;">—</span>`;
    const pct = Math.round(((now - prev) / prev) * 100);
    if (pct > 0) return `<span style="color:#16a34a;">▲ +${pct}%</span>`;
    if (pct < 0) return `<span style="color:#dc2626;">▼ ${pct}%</span>`;
    return `<span style="color:#999;">— 0%</span>`;
  };

  const card = (title: string, inner: string) => `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin-bottom:16px;">
      <h2 style="font-size:15px;margin:0 0 14px;color:#4fb1d3;text-transform:uppercase;letter-spacing:.04em;">${title}</h2>
      ${inner}
    </div>`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#555;font-size:14px;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${value}</td></tr>`;

  // 1) Prihod
  const metodRedovi =
    s.prihod.poMetodu.length === 0
      ? `<tr><td style="padding:6px 0;color:#999;font-size:13px;" colspan="2">Nema naplaćenih porudžbina.</td></tr>`
      : s.prihod.poMetodu
          .map((m) => row(`${esc(m.metod)} <span style="color:#999;">(${m.broj})</span>`, rsd(m.iznos)))
          .join("");
  const prihodCard = card(
    "💰 Prihod ove nedelje",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Naplaćeno ukupno", `${rsd(s.prihod.iznos)} &nbsp; ${deltaBadge(s.prihod.iznos, s.prihod.prosleIznos)}`)}
      ${row("Broj porudžbina", `${num(s.prihod.broj)} &nbsp; ${deltaBadge(s.prihod.broj, s.prihod.prosleBroj)}`)}
      <tr><td colspan="2" style="padding:8px 0 4px;color:#999;font-size:12px;border-top:1px solid #eee;">Po načinu plaćanja</td></tr>
      ${metodRedovi}
    </table>`
  );

  // 2) Aktivacija
  const aktProcenat =
    s.aktivacija.noviPristup > 0
      ? Math.round((s.aktivacija.odNjihKrenulo / s.aktivacija.noviPristup) * 100)
      : 0;
  const zaglavBoja = s.aktivacija.zaglavljeni30 > 0 ? "#dc2626" : "#16a34a";
  const aktivacijaCard = card(
    "🚀 Aktivacija (tvoj #1 problem)",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Novi pristupi ove nedelje", num(s.aktivacija.noviPristup))}
      ${row("Od njih krenulo (≥1 lekcija)", `${num(s.aktivacija.odNjihKrenulo)} (${aktProcenat}%)`)}
      ${row(`<span style="color:${zaglavBoja};">Zaglavljeni — pristup 30 dana, 0 lekcija</span>`, `<span style="color:${zaglavBoja};font-weight:700;">${num(s.aktivacija.zaglavljeni30)}</span>`)}
    </table>`
  );

  // 3) Upisi po nivou/tipu
  const upisRedovi =
    s.upisi.length === 0
      ? `<tr><td style="padding:6px 0;color:#999;font-size:13px;" colspan="2">Nema novih upisa.</td></tr>`
      : s.upisi
          .map((u) => row(`${esc(u.nivo)} <span style="color:#999;">· ${esc(u.tip)}</span>`, num(u.broj)))
          .join("");
  const upisiCard = card(
    `📚 Novi upisi ove nedelje (${num(s.upisiUkupno)})`,
    `<table style="width:100%;border-collapse:collapse;">${upisRedovi}</table>`
  );

  // 4) Istek & obnove
  const istekStavke =
    s.istek.stavke.length === 0
      ? ""
      : `<tr><td colspan="2" style="padding:8px 0 4px;color:#999;font-size:12px;border-top:1px solid #eee;">Ističe uskoro</td></tr>` +
        s.istek.stavke
          .map((x) => row(`${esc(x.ime)} <span style="color:#999;">· ${esc(x.kurs)}</span>`, esc(x.datum)))
          .join("");
  const istekCard = card(
    "⏳ Istek pristupa & obnove",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Ističe narednih 15 dana", num(s.istek.brojNarednih15))}
      ${row("OBNOVI50 iskorišćen ove nedelje", num(s.istek.obnovi50OveNedelje))}
      ${istekStavke}
    </table>`
  );

  // 5) Declined kartice
  const declinedStavke =
    s.declined.stavke.length === 0
      ? `<tr><td style="padding:6px 0;color:#16a34a;font-size:13px;" colspan="2">Nijedna kartica nije odbijena. 🎉</td></tr>`
      : s.declined.stavke
          .map((x) => row(`${esc(x.ime)} <span style="color:#999;">· ${esc(x.datum)}</span>`, rsd(x.iznos)))
          .join("");
  const declinedCard = card(
    `💳 Odbijene kartice (${num(s.declined.broj)})`,
    `<table style="width:100%;border-collapse:collapse;">${declinedStavke}</table>`
  );

  // 6) Saobraćaj (GA4) — samo ako ima podataka
  let ga4Card = "";
  if (s.ga4) {
    const g = s.ga4;
    const izvoriRedovi =
      g.izvori.length === 0
        ? ""
        : `<tr><td colspan="2" style="padding:8px 0 4px;color:#999;font-size:12px;border-top:1px solid #eee;">Top izvori (po konverzijama)</td></tr>` +
          g.izvori
            .map((i) =>
              row(`${esc(i.izvor)} <span style="color:#999;">· ${num(i.sesije)} sesija</span>`, `${num(i.konverzije)} konv.`)
            )
            .join("");
    ga4Card = card(
      "📈 Saobraćaj (GA4)",
      `<table style="width:100%;border-collapse:collapse;">
        ${row("Sesije", `${num(g.sesije)} &nbsp; ${deltaBadge(g.sesije, g.prosleSesije)}`)}
        ${row("Korisnici", `${num(g.korisnici)} &nbsp; ${deltaBadge(g.korisnici, g.prosleKorisnici)}`)}
        ${row("Pregledi stranica", `${num(g.pregledi)} &nbsp; ${deltaBadge(g.pregledi, g.proslePregledi)}`)}
        ${row("Konverzije", `${num(g.konverzije)} &nbsp; ${deltaBadge(g.konverzije, g.prosleKonverzije)}`)}
        ${izvoriRedovi}
      </table>`
    );
  }

  const html = `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:20px;margin:0 0 4px;color:#1a1a2e;">📊 Nedeljni izveštaj — Hartweger</h1>
    <p style="margin:0 0 20px;color:#888;font-size:13px;">${s.odDatum} – ${s.doDatum} · uživo iz baze</p>
    ${prihodCard}
    ${aktivacijaCard}
    ${upisiCard}
    ${istekCard}
    ${declinedCard}
    ${ga4Card}
    <p style="text-align:center;font-size:12px;color:#bbb;margin-top:8px;">Automatski izveštaj · ponedeljkom · Hartweger tim</p>
  </div>
</body></html>`;

  try {
    await sendEmail(resend, {
      to: "info@hartweger.rs",
      subject: `📊 Nedeljni izveštaj — Hartweger (${s.doDatum})`,
      html,
    });
    console.log("[email] nedeljni poslovni izveštaj poslat");
  } catch (e) {
    console.error("[email] sendWeeklyBusinessSummary pao:", e);
  }
}

/**
 * Potvrda naplaćene rate kod mesečnog plaćanja. Rate 2-12 ne dobijaju dobrodošlicu
 * (polaznica je već na kursu), nego kratku potvrdu sa novim rokom pristupa.
 * Podaci o transakciji i trgovcu su OBAVEZNI i u ovim mejlovima (EPM 2.7 - zahtev
 * banke 24.07.2026 za naknadne mesečne naplate) - ostaju identični za oba tipa plana.
 * o.tip === "clanstvo" (nh-clanstvo) menja samo naslov/uvod: nema fiksnog broja rata,
 * pa se "od N" ovde ne prikazuje (vidi subscription-plans.ts).
 */
export async function sendSubscriptionChargeEmail(o: {
  email: string;
  name: string | null;
  courseTitle: string;
  installmentNo: number;
  totalPayments: number;
  amount: number;
  accessUntil: string;
  orderNumber: string;
  tx: RecurringTx;
  tip?: "paket" | "clanstvo";
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = o.name ? o.name.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const doKada = new Date(o.accessUntil).toLocaleDateString("sr-RS");
    const jeClanstvo = o.tip === "clanstvo";
    const txRow = (label: string, value: string) =>
      `<tr><td style="padding:4px 8px;color:#888;">${label}</td><td style="padding:4px 8px;">${esc(value)}</td></tr>`;
    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: jeClanstvo
        ? `Naplaćeno mesečno članstvo - ${o.courseTitle}`
        : `Naplaćena ${o.installmentNo}. rata od ${o.totalPayments} - ${o.courseTitle}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Naplatili smo <strong>${fmt(o.amount)} RSD</strong> - ${jeClanstvo ? "to je redovna mesečna naplata mesečnog članstva" : `to je ${o.installmentNo}. rata od ukupno ${o.totalPayments}`} za kurs <strong>${esc(o.courseTitle)}</strong>.</p>
<p style="font-size:14px;color:#1c7a34;font-weight:700">${CARD_OUTCOME.success}</p>
<p>Pristup ti važi do <strong>${doKada}</strong> i produžiće se sam sa ${jeClanstvo ? "sledećom naplatom" : "narednom ratom"}. Fiskalni račun stiže zasebno.</p>
<h2 style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:18px 0 4px;">Podaci o transakciji</h2>
<table style="border-collapse:collapse;font-size:13px;width:100%;max-width:420px;margin:0 0 12px;">
  <tbody>
    ${txRow("Datum i vreme", o.tx.dateTime)}
    ${txRow("Broj porudžbine (Order ID)", o.orderNumber)}
    ${txRow("Iznos", `${fmt(o.amount)} RSD`)}
    ${txRow("AuthCode", o.tx.authCode)}
    ${txRow("Broj transakcije (TransId)", o.tx.transId)}
  </tbody>
</table>
<h2 style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Podaci o trgovcu</h2>
<p style="font-size:13px;color:#444;margin:0 0 12px">
  ${esc(MERCHANT.naziv)}<br/>
  PIB: ${MERCHANT.pib}<br/>
  ${esc(MERCHANT.adresa)}
</p>
<p style="font-size:13px;color:#666">${jeClanstvo ? `Mesečno članstvo možeš da otkažeš kad god hoćeš, u odeljku „Moj nalog" na platformi.` : `Mesečno plaćanje možeš da otkažeš kad god hoćeš, u odeljku „Moj nalog" na platformi.`}</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendSubscriptionChargeEmail pao:", e);
  }
}

/**
 * Prva naplata zack! članstva - roditelju, uz obavezno pretplatno obaveštenje
 * (banka/EPM: iznos, učestalost i otkazivanje moraju stajati već u prvoj
 * poruci). Potvrda kartične transakcije sa svim podacima banke ide zasebnim
 * mejlom iz callbacka; rate 2+ dobijaju sendSubscriptionChargeEmail.
 */
export async function sendZackWelcomeEmail(
  to: string,
  name: string | null,
  o: {
    imeDeteta: string;
    monthlyRsd: number;
    accessUntil: string;
    /** Kod za prijavu deteta - roditelju jedini „login" podatak, pa ide u mejl kad postoji. */
    kod?: string | null;
    /** Otvoreni PIN, samo za novonapravljeno dete. Nigde se ne čuva. */
    pin?: string | null;
    /** Staro dete bez PIN-a: ide uputstvo kako da ga postavi. */
    pinNijePostavljen?: boolean;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const doKada = new Date(o.accessUntil).toLocaleDateString("sr-RS");
    // Dete iz panela već ima i kod i PIN; gost-dete tek dobija kod, a PIN ga čeka.
    const uvodDeteta = o.pinNijePostavljen
      ? `Profil za <strong>${esc(o.imeDeteta)}</strong> je napravljen, a članstvo uključeno - igre, kesice sa sličicama i Milioner su otključani.`
      : `Članstvo za <strong>${esc(o.imeDeteta)}</strong> je uključeno - igre, kesice sa sličicama i Milioner su otključani. Dete nastavlja tamo gde je stalo, sa istim kodom i PIN-om.`;
    const blokKoda = papiric(o);
    await sendEmail(resend, {
      to,
      subject: `zack! članstvo za ${o.imeDeteta} je aktivno`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>${uvodDeteta}</p>
${blokKoda}
<p>Pokrenuto je <strong>mesečno plaćanje od ${fmt(o.monthlyRsd)} RSD</strong>: isti iznos banka će automatski naplaćivati sa tvoje kartice svakog meseca, dok članstvo ne otkažeš. Trenutna naplata pokriva period do <strong>${doKada}</strong> i produžiće se sama sa sledećom naplatom.</p>
<p><strong>Otkazivanje:</strong> jednim klikom, u svakom trenutku, u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a> - ne moraš da nam pišeš ni da obrazlažeš. Posle otkazivanja pristup traje do kraja plaćenog meseca.</p>
<p style="font-size:13px;color:#666">Fiskalni račun i potvrda o plaćanju stižu zasebnim mejlovima. Za sva pitanja piši nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack welcome mejl poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackWelcomeEmail pao:", e);
  }
}

/**
 * „Papirić": kod i PIN na jednom mestu, uokvireni, da roditelj ima šta da
 * prepiše bez traženja po mejlu.
 *
 * Od 22.08.2026. PIN se dodeljuje SAM pri pravljenju deteta, pa je ovaj mejl
 * jedino mesto na kom se otvoreni PIN uopšte pojavljuje - nigde se ne čuva.
 * Stara deca (napravljena pre toga) nemaju `pin`, pa im i dalje ide uputstvo
 * kako da ga postave.
 */
function papiric(o: { kod?: string | null; pin?: string | null; pinNijePostavljen?: boolean }): string {
  if (!o.kod) return "";
  const red = (naziv: string, vrednost: string) =>
    `<tr><td style="padding:2px 14px 2px 0;color:#666;font-size:14px">${naziv}</td>` +
    `<td style="font-size:22px;font-weight:bold;letter-spacing:2px">${esc(vrednost)}</td></tr>`;
  const uputstvoBezPina = `<p>PIN još nije postavljen - postavlja se u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a> („Novi PIN" uz dete).</p>`;
  return `<table style="border:2px solid #DED8C8;border-radius:10px;padding:14px 18px;margin:18px 0;background:#FCFBF7">
${red("Kod", o.kod)}${o.pin ? red("PIN", o.pin) : ""}
</table>
${o.pin ? "<p>Prepiši detetu kod i PIN na papirić - to je cela instalacija.</p>" : o.pinNijePostavljen ? uputstvoBezPina : ""}`;
}

/**
 * Poklon do 15. septembra (/poklon): dete je dobilo ceo zack! bez plaćanja.
 *
 * PADEŽI: ime deteta se NIKAD ne stavlja u položaj koji traži promenu („za
 * Mila" umesto „za Milu"). Automatsko menjanje padeža nije pouzdano - strana
 * imena, nadimci, skraćenice - pa se rečenice grade tako da ime uvek stoji u
 * nominativu. Isto pravilo važi za sve mejlove ovog niza.
 *
 * Ovaj mejl NE SME da pomene karticu, iznos, naplatu ni obnavljanje - ničega
 * od toga u poklonu nema, pa bi svaka takva rečenica bila neistina. Zato je
 * odvojen od `sendZackWelcomeEmail`, umesto da se u njemu granaju rečenice.
 * Kaže tri stvari: šta dete ima, do kada, i šta biva posle tog datuma.
 */
export async function sendZackPoklonEmail(
  to: string,
  name: string | null,
  o: {
    imeDeteta: string;
    /** Fiksan rok poklona (lib/zack/poklon.ts) - u mejlu stoji ispisan datum. */
    vaziDo: string;
    /** Kod za prijavu deteta - roditelju jedini „login" podatak. */
    kod?: string | null;
    /** Otvoreni PIN, samo za novonapravljeno dete. Nigde se ne čuva. */
    pin?: string | null;
    /** Staro dete bez PIN-a: ide uputstvo kako da ga postavi. */
    pinNijePostavljen?: boolean;
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    // Ispisan datum, isti oblik kao svuda na sajtu („15. septembra 2026"), a NE
    // sr-RS „15. 9. 2026" - dva zapisa istog roka u istom mejlu zbunjuju.
    const doKada = datumSlovima(o.vaziDo);
    const blokKoda = papiric(o);
    await sendEmail(resend, {
      to,
      subject: `${o.imeDeteta} ima zack! - poklon do ${POKLON_DO_PRIKAZ}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p><strong>${esc(o.imeDeteta)}</strong> ima svoj profil i ceo zack! je otključan - igre, kesice sa sličicama i Milioner. Prijava je na <a href="${SITE_URL}/zack">hartweger.rs/zack</a>.</p>
${blokKoda}
<p>Ovo je <strong>poklon do ${doKada}</strong>: ništa nije naplaćeno, kartica nam nije potrebna i ništa neće biti naplaćeno ni kasnije.</p>
<p>Posle tog datuma igre, kesice i Milioner miruju, a <strong>album i sve što je dete zaradilo ostaju</strong> - ništa mu se ne oduzima. Ako želiš da dete nastavi, članstvo se uključuje u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a> - a ako ne želiš, ne moraš ništa da radiš.</p>
<p style="font-size:13px;color:#666">Za sva pitanja piši nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack poklon mejl poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackPoklonEmail pao:", e);
  }
}

/**
 * Podsetnik par dana pred istek poklona - šalje se TAČNO JEDNOM po detetu
 * (trag je zack_deca.poklon_podsetnik_at, upisan pre slanja).
 *
 * Ton: nema prekora, nema odbrojavanja i nema „poslednja šansa". Mejl kaže šta
 * ističe, šta OSTAJE i šta roditelj može da uradi ako hoće - a izričito kaže i
 * da ne mora ništa. Rod deteta se nigde ne pogađa (album i sličice, ne
 * „zaradio/la"). Ide kao bulk, pa odjavljene i baunsere sender sam preskoči.
 */
export async function sendZackPoklonPodsetnikEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; vaziDo: string; mesecnoRsd: number },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const doKada = datumSlovima(o.vaziDo);
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: `${o.imeDeteta} ima zack! još do ${doKada}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p><strong>${esc(o.imeDeteta)}</strong> ima poklon do <strong>${doKada}</strong>. Posle tog datuma igre, kesice i Milioner miruju.</p>
<p><strong>Album i sve sličice ostaju</strong> - ništa se detetu ne oduzima i ništa se ne briše.</p>
<p>Ako želiš da ${esc(o.imeDeteta)} nastavi, članstvo je ${o.mesecnoRsd.toLocaleString("de-DE")} dinara mesečno po detetu, bez ugovora, i uključuje se u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a>.</p>
<p>Ako ne želiš - ne moraš ništa da radiš. Ništa ti neće biti naplaćeno.</p>
<p style="font-size:13px;color:#666">Za sva pitanja piši nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack poklon podsetnik poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackPoklonPodsetnikEmail pao:", e);
  }
}

/**
 * Javka Nataši čim neko uzme poklon - da uživo vidi da li reklama radi, bez
 * ulaženja u admin.
 *
 * Nosi i UKUPAN broj poklona do sada, pa jedan mejl odgovara na pravo pitanje
 * („koliko ih je?") umesto da se broje mejlovi u sandučetu. Ako akcija krene
 * jako, ovo se gasi jednom linijom u ruti i ostaje dnevni pregled.
 *
 * NIJE bulk: ovo je javka vlasnici, ne pošta polazniku.
 */
export async function sendAdminZackPoklonEmail(o: {
  imeDeteta: string;
  razred: number | null;
  email: string;
  ukupno: number;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, {
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `zack! poklon #${o.ukupno} - ${o.imeDeteta}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p><strong>${esc(o.imeDeteta)}</strong>${o.razred ? `, ${o.razred}. razred` : ""} - poklon uzet.</p>
<p style="color:#666">Roditelj: ${esc(o.email)}</p>
<p style="font-size:22px"><strong>Ukupno do sada: ${o.ukupno}</strong></p>
<p style="font-size:13px;color:#666">Stiže sa svakim novim poklonom. Sve zajedno vidiš u <a href="${SITE_URL}/admin/analitika">analitici</a>.</p>
</body></html>`,
    });
    console.log(`[email] admin javka za poklon #${o.ukupno}`);
  } catch (e) {
    console.error("[email] sendAdminZackPoklonEmail pao:", e);
  }
}

/**
 * PIN nije postavljen - jedan mejl, sutradan.
 *
 * Ovo je NAJHITNIJI mejl u nizu: bez PIN-a dete ne može da uđe, pa poklon
 * stoji neupotrebljen. Zato mejl ima tačno jedan zadatak i tačno jedno dugme -
 * bez priče o igrama, albumu i roku, koje bi razvodnile taj jedan klik.
 *
 * Ton je i dalje bez prekora: ne kaže „nisi postavio", nego „fali još PIN".
 */
export async function sendZackPinPodsetnikEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; kod: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: `Fali još PIN za ${o.imeDeteta}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Profil je otvoren i sve čeka, samo <strong>${esc(o.imeDeteta)}</strong> još nema PIN - a bez njega prijava ne radi.</p>
${o.kod ? `<p>Kod: <strong style="font-size:20px;letter-spacing:2px">${esc(o.kod)}</strong></p>` : ""}
<p style="margin:26px 0">
  <a href="${SITE_URL}/zack/roditelj" style="display:inline-block;padding:14px 26px;border-radius:10px;background:#D6291F;color:#fff;text-decoration:none;font-weight:bold;font-size:17px">Postavi PIN</a>
</p>
<p>U panelu stoji „Novi PIN" uz dete. Četiri cifre, pola minuta - pa kod i PIN prepišeš detetu na papirić.</p>
<p style="font-size:13px;color:#666">Ovo je jedini mejl o PIN-u.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack pin podsetnik poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackPinPodsetnikEmail pao:", e);
  }
}

/**
 * Trećeg dana, SAMO ako se dete nijednom nije prijavilo. Poklon koji dete nikad
 * ne otvori je propao poklon, a razlog je po pravilu proza - papirić sa kodom
 * se zaturi.
 *
 * Ton: NEMA prekora. Ne piše „dete nije ušlo" ni „nisi iskoristio", nego „kod
 * čeka" - i kod se ponavlja u samom mejlu, da roditelj ne mora ništa da traži.
 */
export async function sendZackAktivacijaEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; kod: string | null; pinNijePostavljen: boolean },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: "Kod za prijavu još čeka",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Profil je spreman i čeka: <strong>${esc(o.imeDeteta)}</strong> se prijavljuje na <a href="${SITE_URL}/zack">hartweger.rs/zack</a>.</p>
${o.kod ? `<p>Kod: <strong style="font-size:20px;letter-spacing:2px">${esc(o.kod)}</strong></p>` : ""}
${
  o.pinNijePostavljen
    ? `<p>PIN još nije postavljen - postavlja se u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a> („Novi PIN" uz dete).</p>`
    : "<p>Kod i PIN staju na papirić - to je cela instalacija, bez mejla za dete i bez skidanja.</p>"
}
<p>Deset minuta je dovoljno za prvi put.</p>
<p style="font-size:13px;color:#666">Ovo je jedini podsetnik koji šaljemo o kodu.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack aktivacija poslata → ${to}`);
  } catch (e) {
    console.error("[email] sendZackAktivacijaEmail pao:", e);
  }
}

/**
 * Dete je ušlo jednom pa stalo - jedan miran mejl roditelju.
 *
 * NAJOSETLJIVIJI ton u nizu. Odsustvo se NE pominje: nema „nije ulazilo", nema
 * „primetili smo", nema broja propuštenih dana. Mejl govori samo o onome što je
 * zarađeno i o onome što je nadomak - album kao razlog da se vrati, nikad
 * prekor zato što se nije vratio.
 *
 * Zato i nema dugme „Vrati se", nego „Otvori album": zove ono što je detetovo,
 * a ne obavezu.
 */
/**
 * „1 sličica, 2 sličice, 5 sličica" - srpska množina ima tri oblika, a ne dva.
 * Nominativ jednine i genitiv množine su ovde isti („sličica"), pa se izdvaja
 * samo opseg 2-4. Izuzeci 11-14 idu po pravilu za pet i više (11 sličica).
 */
function slicicaOblik(n: number): string {
  const d = n % 10;
  const dd = n % 100;
  if (dd >= 11 && dd <= 14) return "sličica";
  return d >= 2 && d <= 4 ? "sličice" : "sličica";
}

export async function sendZackPovratakEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; slicica: number; lekcija: string | null; fali: number },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    // „fali još 5 sličica" ima smisla samo dok lekcija nije popunjena; kad jeste,
    // rečenica bi bila neistinita, pa je nema.
    const redFali =
      o.fali > 0 && o.lekcija
        ? `<p>Do kraja lekcije <strong>${esc(o.lekcija)}</strong> fali još ${o.fali} ${slicicaOblik(o.fali)}.</p>`
        : "";
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: `${o.imeDeteta} ima ${o.slicica} ${slicicaOblik(o.slicica)}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p><strong>${esc(o.imeDeteta)}</strong> u zack! albumu ima <strong>${o.slicica}</strong> ${slicicaOblik(o.slicica)}. ${o.slicica === 1 ? "I ostaje tu." : "Sve tu i ostaju."}</p>
${redFali}
<p style="margin:26px 0">
  <a href="${SITE_URL}/zack" style="display:inline-block;padding:14px 26px;border-radius:10px;background:#D6291F;color:#fff;text-decoration:none;font-weight:bold;font-size:17px">Otvori album</a>
</p>
<p>Deset minuta je dovoljno. Prijava je kodom i PIN-om, kao i prvi put.</p>
<p style="font-size:13px;color:#666">Ovo je jedini mejl ove vrste.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack povratak poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackPovratakEmail pao:", e);
  }
}

/**
 * Anketa o utiscima, oko 7. dana i SAMO roditelju čije dete stvarno vežba.
 *
 * Prvo pitanje su tri dugmeta u samom mejlu: klik već upisuje odgovor i tek
 * onda otvara stranicu sa preostala dva. Ko odustane posle prvog klika, ipak
 * nam je odgovorio - zato dugmad vode na rutu sa odgovorom, a ne na praznu
 * stranicu.
 *
 * Anketa je INTERNA: nigde ne traži dozvolu za objavu i nigde ne obećava da će
 * nešto biti objavljeno, jer neće.
 */
export async function sendZackAnketaEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; token: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    // Dugmad idu na rutu koja UPIŠE odgovor pa preusmeri na stranicu - zato
    // GET sa odgovorom u putanji, a ne link na obrazac.
    const dugme = (kljuc: string, tekst: string) =>
      `<a href="${SITE_URL}/api/zack/anketa/${encodeURIComponent(o.token)}/${encodeURIComponent(kljuc)}" style="display:inline-block;margin:0 6px 8px 0;padding:11px 18px;border-radius:8px;background:#0B54C9;color:#fff;text-decoration:none;font-weight:bold">${esc(tekst)}</a>`;
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: "Kako ide sa zack!-om?",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p><strong>${esc(o.imeDeteta)}</strong> već nedelju dana vežba u zack!-u. Zanima nas jedna stvar, pa da nam kažeš klikom:</p>
<p style="font-size:17px;font-weight:bold;margin-bottom:12px">Da li se ${esc(o.imeDeteta)} vraća zack!-u?</p>
<p>${VRACA_SE.map((v) => dugme(v.kljuc, v.tekst)).join("")}</p>
<p>Posle klika te čekaju još dva pitanja, oba neobavezna. Ukupno pola minuta.</p>
<p style="font-size:13px;color:#666">Odgovori ostaju kod nas i služe samo da vidimo šta da popravimo - ništa se nigde ne objavljuje.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack anketa poslata → ${to}`);
  } catch (e) {
    console.error("[email] sendZackAnketaEmail pao:", e);
  }
}

/**
 * Dan posle isteka poklona. Poslednji mejl u nizu.
 *
 * Ovo je najosetljiviji mejl niza: roditelj je upravo izgubio nešto što nije
 * platio. Zato prvo stoji šta OSTAJE, pa tek onda šta miruje, a ponuda članstva
 * je jedna rečenica bez popusta, bez roka i bez „poslednja šansa". Ko ne uradi
 * ništa, ne dobija više nijedan mejl o ovome.
 */
export async function sendZackIstekEmail(
  to: string,
  name: string | null,
  o: { imeDeteta: string; mesecnoRsd: number },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    await sendEmail(resend, {
      to,
      bulk: true,
      subject: "zack! miruje, album ostaje",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Poklon je juče istekao, pa da ti kažemo šta to znači.</p>
<p><strong>Sve zarađeno ostaje</strong>: album, sve sličice i ceo napredak. Ništa se ne briše, a profil i prijava kodom rade kao i do sada.</p>
<p>Miruju samo igre, kesice i Milioner.</p>
<p>Ako želiš da se otključaju, članstvo je ${o.mesecnoRsd.toLocaleString("de-DE")} dinara mesečno po detetu, bez ugovora, i uključuje se u <a href="${SITE_URL}/zack/roditelj">roditeljskom panelu</a>. Ako ne želiš, ne moraš ništa da radiš - ovo je poslednji mejl o poklonu.</p>
<p>Hvala na poverenju.</p>
<p style="font-size:13px;color:#666">Za sva pitanja piši nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] zack istek poslat → ${to}`);
  } catch (e) {
    console.error("[email] sendZackIstekEmail pao:", e);
  }
}

/**
 * Pala mesečna naplata - šalje se JEDNOM, kad je prvi put primetimo (posle toga
 * banka na naš zahtev pokušava iznova danima, ne treba 30 mejlova). Istekla
 * kartica se ne da spasiti pokušajima: banka traži da kupac autorizuje NOV plan.
 */
export async function sendSubscriptionRetryEmail(o: {
  email: string;
  name: string | null;
  courseTitle: string;
  installmentNo: number;
  totalPayments: number;
  amount: number;
  /** Da li je banka prihvatila da ranije pokuša ponovo. Kad nije, ne smemo da
   *  obećavamo automatske pokušaje - ostaje redovan termin sledeće naplate. */
  automatskiPokusaj?: boolean;
  /** Prvi termin na čekanju u seriji, "YYYY-MM-DD HH:mm:ss.S" (bankino vreme). */
  sledecaNaplata?: string | null;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = o.name ? o.name.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const automatski = o.automatskiPokusaj !== false;
    const sledeci = o.sledecaNaplata
      ? new Date(o.sledecaNaplata.replace(" ", "T")).toLocaleDateString("sr-RS")
      : null;
    // Kad banka odbije da pomeri palu naplatu, jedini istinit podatak je redovan
    // termin sledeće naplate. Obećanje „pokušaćemo narednih dana" tu ne sme da stoji.
    const sledeciKorak = automatski
      ? `<p><strong>Ništa ne moraš da radiš odmah</strong> - narednih dana ćemo automatski pokušati ponovo. Proveri samo da na kartici ima sredstava.</p>`
      : `<p>Mesečno plaćanje <strong>nije otkazano</strong> - plan ide dalje${sledeci ? `, a sledeća naplata je zakazana za <strong>${esc(sledeci)}</strong>` : ""}. Ako želiš da nastaviš bez prekida, odgovori na ovaj mejl pa ćemo ponovo pokušati naplatu od <strong>${fmt(o.amount)} RSD</strong>. Pre toga proveri kod svoje banke da li kartica ima pokriće i da li propušta ponavljajuće (recurring) naplate - to je najčešći razlog.</p>`;
    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: `Mesečna naplata nije prošla - ${o.courseTitle}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Pokušali smo da naplatimo <strong>${fmt(o.amount)} RSD</strong> - ${o.installmentNo}. mesečnu uplatu od ukupno ${o.totalPayments} za kurs <strong>${esc(o.courseTitle)}</strong> - ali naplata nije prošla (najčešće: nedovoljno sredstava na kartici).</p>
${sledeciKorak}
<p>Ako je kartica u međuvremenu <strong>istekla ili zamenjena</strong>, automatski pokušaji ne pomažu: odgovori nam na ovaj mejl, pa ćemo zajedno pokrenuti mesečno plaćanje novom karticom.</p>
<p style="font-size:13px;color:#666">Dok uplata ne prođe, pristup kursu pauzira - napredak ostaje sačuvan i čeka te na istom mestu. Mesečno plaćanje uvek možeš da otkažeš u odeljku „Moj nalog" na platformi.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
    console.log(`[email] Subscription-retry mejl poslat → ${o.email}`);
  } catch (e) {
    console.error("[email] sendSubscriptionRetryEmail pao:", e);
  }
}

// Kratka notifikacija adminu (Nataši) kad NH članica napravi novu karticu za javni
// imenik iz opt-in toka u /clanstvo/profil - čeka odobrenje u admin/clanice.
export async function sendNhKarticaAdminEmail(o: { ime: string; email: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      replyTo: o.email,
      subject: `Nova NH kartica čeka odobrenje - ${o.ime}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Nova kartica za javni imenik</h2>
<p><strong>Ime:</strong> ${esc(o.ime)}</p>
<p><strong>Mejl:</strong> ${esc(o.email)}</p>
<p>NH članica je iz svog profila zatražila da njena kartica bude vidljiva na javnom imeniku (natasahartweger.rs/clanice). Kartica čeka odobrenje.</p>
<p style="margin-top:18px">
  <a href="https://www.hartweger.rs/admin/clanice" style="display:inline-block;background:#4fb1d3;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Otvori odobravanje</a>
</p>
</body></html>`,
    });
    console.log(`[email] Admin obavešten o novoj NH kartici (${o.email})`);
  } catch (e) {
    console.error("[email] sendNhKarticaAdminEmail pao:", e);
  }
}

// ── zack! dvonedeljni izveštaj roditelju ─────────────────────────────────────
// Render je odvojen od slanja i vraća gotov HTML: tako se sadržaj mejla može
// pogledati (i testirati) bez ijednog stvarnog slanja, a cron ga samo prosledi.
// Sve rečenice sastavlja lib/zack/izvestaj.ts - ovde se samo prelamaju u HTML
// koji radi u mejl klijentima: tabele i inline stilovi, bez flexa.

/** Papir i mastilo dečje aplikacije; crvena iz „zack!" znaka, štedljivo. */
const ZACK_PAPIR = "#FCFBF7";
const ZACK_POZADINA = "#F4F1E9";
const ZACK_IVICA = "#DED8C8";
const ZACK_MASTILO = "#16161A";
const ZACK_PRIGUSEN = "#6E6A5E";
const ZACK_CRVENA = "#E5342A";

function zackOmotac(sadrzaj: string): string {
  return `<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:${ZACK_POZADINA};font-family:'Helvetica Neue',Arial,sans-serif;color:${ZACK_MASTILO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ZACK_POZADINA};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${ZACK_PAPIR};border:1px solid ${ZACK_IVICA};border-radius:14px;">
        <tr><td style="padding:28px 28px 8px;">
          <span style="font-size:26px;font-weight:800;color:${ZACK_CRVENA};letter-spacing:-0.5px;">zack!</span>
        </td></tr>
        ${sadrzaj}
        <tr><td style="padding:20px 28px 26px;border-top:1px solid ${ZACK_IVICA};">
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${ZACK_MASTILO};">
            <a href="${SITE_URL}/zack/roditelj" style="color:${ZACK_MASTILO};font-weight:700;">Roditeljski panel</a>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:${ZACK_PRIGUSEN};">
            Ovaj izveštaj stiže na dve nedelje. Gasi se i pali jednim klikom u roditeljskom panelu.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Dvonedeljni izveštaj: po jedan blok za svako dete. Vraća predmet i HTML,
 * ne šalje ništa.
 */
export function renderZackIzvestajEmail(deca: readonly IzvestajDeteta[]): {
  subject: string;
  html: string;
} {
  const blokovi = deca
    .map((dete) => {
      const recenice = receniceZaDete(dete)
        .map(
          (r) =>
            `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:${ZACK_MASTILO};">${esc(r)}</p>`
        )
        .join("\n          ");
      return `<tr><td style="padding:14px 28px 4px;">
          <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:${ZACK_MASTILO};">${esc(dete.ime)}</p>
          ${recenice}
        </td></tr>`;
    })
    .join("\n");

  return {
    subject: naslovIzvestaja(deca.map((d) => d.ime)),
    html: zackOmotac(`<tr><td style="padding:6px 28px 0;">
          <p style="margin:0;font-size:14px;color:${ZACK_PRIGUSEN};">Izveštaj za protekle dve nedelje</p>
        </td></tr>
        ${blokovi}
        <tr><td style="padding:4px 28px 18px;"></td></tr>`),
  };
}

/**
 * Poslednji mejl pre gašenja: mirno kaže da izveštaji staju i kako se vraćaju.
 * Bez podvlačenja i bez saveta - pravilo sa platforme: ne opominjati.
 */
export function renderZackOprostajEmail(): { subject: string; html: string } {
  return {
    subject: "zack! - izveštaji za sada staju",
    html: zackOmotac(`<tr><td style="padding:14px 28px 18px;">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${ZACK_MASTILO};">
            U poslednjih mesec dana nije bilo vežbanja, pa dvonedeljni izveštaji za sada staju.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${ZACK_MASTILO};">
            Kad god poželiš da ih vratiš, uključi ih jednim klikom u roditeljskom panelu.
          </p>
        </td></tr>`),
  };
}

/** Slanje već renderovanog izveštaja (ili oproštajnog mejla) roditelju. */
export async function sendZackIzvestajEmail(to: string, mejl: { subject: string; html: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    await sendEmail(resend, { bulk: true, to, subject: mejl.subject, html: mejl.html });
    console.log(`[email] zack izveštaj poslat → ${to}`);
  } catch (e) {
    console.error(`[email] sendZackIzvestajEmail pao → ${to}:`, e);
  }
}

/** Podaci za uplatu na dokumentu firme - drugi račun nego kod uplatnica fizičkim licima. */
function firmaUplatnicaBlockHtml(o: {
  ukupnoSaPdv: number;
  broj: string;
  tip: "predracun" | "faktura";
  ipsQrUrl?: string | null;
}) {
  const svrha = `Placanje po ${o.tip === "predracun" ? "predracunu" : "fakturi"} ${o.broj}`;
  return `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Podaci za uplatu</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #888; width: 45%;">Primalac</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${MERCHANT.naziv}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Broj računa</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${BANK_FIRME.racun} (${BANK_FIRME.naziv})</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Iznos</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 700; font-size: 16px;">${o.ukupnoSaPdv.toLocaleString("sr-RS")} RSD</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Poziv na broj</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${o.broj}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Svrha</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">${svrha}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Šifra plaćanja</td><td style="padding: 6px 0; color: #1a1a2e; font-weight: 600;">189</td></tr>
        </table>
        ${o.ipsQrUrl ? `<div style="text-align: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e8f4f8;">
          <img src="${o.ipsQrUrl}" alt="IPS QR kod" width="180" height="180" style="border-radius: 8px;" />
          <div style="font-size: 12px; color: #888; margin-top: 6px;">Skenirajte IPS QR kod u aplikaciji za mobilno bankarstvo</div>
        </div>` : ""}
      </div>`;
}

/** Stavke dokumenta u telu mejla - da se vidi ŠTA se plaća, bez otvaranja priloga. */
function stavkeBlockHtml(d: DokumentPodaci) {
  const redovi = d.stavke
    .map(
      (s) => `<tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #1a1a2e;">${s.opis}${s.kolicina > 1 ? ` <span style="color:#888;">× ${s.kolicina}</span>` : ""}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1a1a2e; white-space: nowrap;">${s.iznosBezPdv.toLocaleString("sr-RS")} RSD</td>
          </tr>`,
    )
    .join("");
  return `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 16px;">
        <tr>
          <td style="padding: 0 0 8px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Opis usluge</td>
          <td style="padding: 0 0 8px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Bez PDV</td>
        </tr>
        ${redovi}
        <tr><td style="padding: 8px 0; color: #888;">Ukupno bez PDV</td><td style="padding: 8px 0; text-align: right; color: #1a1a2e;">${d.ukupnoBezPdv.toLocaleString("sr-RS")} RSD</td></tr>
        <tr><td style="padding: 2px 0; color: #888;">PDV (20%)</td><td style="padding: 2px 0; text-align: right; color: #1a1a2e;">${d.pdv.toLocaleString("sr-RS")} RSD</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700; color: #1a1a2e; border-top: 2px solid #1a1a2e;">UKUPNO SA PDV</td><td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 16px; color: #1a1a2e; border-top: 2px solid #1a1a2e;">${d.ukupnoSaPdv.toLocaleString("sr-RS")} RSD</td></tr>
      </table>`;
}

/**
 * Predračun ili faktura firmi. PDF ide kao prilog, ali telo mejla nosi SVE
 * potrebno za uplatu - jer se ovaj mejl prosleđuje računovođi ili onome ko plaća,
 * a prilog se u prosleđenom mejlu lako izgubi iz vida.
 *
 * Predračun nosi podatke za uplatu; faktura ne - do nje se stiže tek posle uplate.
 *
 * Persiranje je namerno: ovo je jedini mejl koji ide firmi, a ne polazniku.
 * Nije `bulk` - ne prolazi kroz odjave i baunsere, kao ni ostale potvrde.
 */
export function dokumentEmailNaslov(d: DokumentPodaci): string {
  const naziv = d.tip === "predracun" ? "Predračun" : "Faktura";
  return `${naziv} ${d.broj} · ${d.ukupnoSaPdv.toLocaleString("sr-RS")} RSD · Hartweger`;
}

/** Telo mejla. Izdvojeno da može da se pregleda i testira bez slanja. */
export function dokumentEmailHtml(d: DokumentPodaci, ipsQrUrl?: string | null): string {
  const jePredracun = d.tip === "predracun";
  const naziv = jePredracun ? "Predračun" : "Faktura";
  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f6f7f9; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 28px;">

      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 18px;">
        <span style="font-size: 20px; font-weight: 700; letter-spacing: 1px;">${naziv.toUpperCase()}</span>
      </div>

      <table style="width: 100%; font-size: 14px; margin: 0 0 18px;">
        <tr><td style="color: #888; padding: 3px 0;">Broj</td><td style="text-align: right; font-weight: 600;">${d.broj}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">Datum</td><td style="text-align: right;">${d.datum}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">Kupac</td><td style="text-align: right; font-weight: 600;">${d.kupac.naziv}</td></tr>
        <tr><td style="color: #888; padding: 3px 0;">PIB</td><td style="text-align: right;">${d.kupac.pib}</td></tr>
      </table>

      ${stavkeBlockHtml(d)}

      ${jePredracun ? firmaUplatnicaBlockHtml({ ukupnoSaPdv: d.ukupnoSaPdv, broj: d.broj, tip: d.tip, ipsQrUrl }) : ""}

      ${jePredracun
        ? `<p style="font-size: 14px; margin: 0 0 6px;"><strong>Rok plaćanja: 7 dana</strong> od datuma predračuna.</p>
           <p style="font-size: 13px; color: #666; margin: 0 0 18px;">Ovaj mejl možete proslediti računovodstvu - sadrži sve podatke potrebne za uplatu. Predračun je i u prilogu, kao PDF.</p>`
        : `<p style="font-size: 13px; color: #666; margin: 0 0 18px;">Faktura je u prilogu, kao PDF.</p>`}

      <p style="font-size: 14px; margin: 0 0 4px;">Za sva pitanja samo odgovorite na ovaj mejl.</p>
      <p style="font-size: 14px; margin: 18px 0 0;">Srdačno,<br/>Hartweger tim</p>

      <p style="font-size: 11px; color: #aaa; margin: 26px 0 0; border-top: 1px solid #eee; padding-top: 14px;">
        ${MERCHANT.naziv}<br/>
        ${MERCHANT.adresa} · PIB: ${MERCHANT.pib}<br/>
        www.hartweger.rs · info@hartweger.rs
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendDokumentEmail(o: {
  to: string;
  dokument: DokumentPodaci;
  pdf: Buffer;
  ipsQrUrl?: string | null;
}) {
  const d = o.dokument;
  try {
    const resend = getResend();
    if (!resend) return null;
    return await sendEmail(resend, {
      to: o.to,
      subject: dokumentEmailNaslov(d),
      html: dokumentEmailHtml(d, o.ipsQrUrl),
      attachments: [
        {
          filename: `${d.tip}-${d.broj.replace(/[^\w-]/g, "-")}.pdf`,
          content: o.pdf.toString("base64"),
        },
      ],
    });
  } catch (e) {
    console.error(`[email] sendDokumentEmail pao za ${d.broj}:`, e);
    return null;
  }
}
