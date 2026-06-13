import { Resend } from "resend";
import { SITE_URL } from "@/lib/site-url";
import { odjavaUrl } from "@/lib/optout";

const FROM = "Hartweger <kurs@hartweger.rs>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set - emails disabled");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/** Minimalni HTML-escape za korisnički unos u mejl telu. */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  courseTitles: string[]
) {
  const courseList = courseTitles.map((t) => `• ${t}`).join("\n");

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: "Dobrodošli na Hartweger kurs!",
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

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        Prijavi se na platformu i započni prvu lekciju. Pristup kursu važi <strong>godinu dana</strong> od kupovine.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${SITE_URL}/prijava" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Započni učenje
        </a>
      </div>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0 0 8px;">
        Prijava je bez lozinke - uneseš mejl kojim si kupio/la kurs i stigne ti link za ulazak.
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
    await resend.emails.send({
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
  opts: { currentNivo: string; nextNivo: string; courseUrl: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: `Nastavi nemački - upiši ${opts.nextNivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Bravo${ime ? ", " + esc(ime) : ""}! 🎉</h2>
<p>Tvoj grupni kurs <strong>${esc(opts.currentNivo)}</strong> se bliži kraju. Da ne praviš pauzu, upiši se na sledeći nivo i nastavi sa istim ritmom.</p>
<p style="margin:24px 0"><a href="${esc(opts.courseUrl)}" style="background:#F78687;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Upiši ${esc(opts.nextNivo)}</a></p>
<p style="font-size:13px;color:#666">Mesta su ograničena (grupe do 6 polaznika), pa preporučujemo da rezervišeš na vreme.</p>
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
  opts: { nivo: string; profIme?: string; calendarUrl?: string | null; notesUrl?: string | null; hasPlatform: boolean },
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
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Kupovina <strong>individualnog kursa nemačkog${opts.nivo ? " " + esc(opts.nivo) : ""}</strong> je potvrđena. Paket časova važi <strong>3 meseca</strong> od uplate.</p>
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
  opts: { label: string; ind: number; grp: number; rateInd: number; rateGrp: number; indTotal: number; grpTotal: number; total: number },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
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
</ul>
<p style="font-size:18px"><strong>Ukupno: ${fmt(opts.total)} din</strong></p>
<p style="font-size:13px;color:#666">Ako nešto ne štima, javi nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendHonorarProfEmail pao:", e);
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

// Trenutna notifikacija adminu (Nataši) čim stigne nova narudžbina - bez obzira na način plaćanja.
export async function sendNewOrderAdminEmail(o: {
  orderNumber: string;
  fullName: string;
  email: string;
  courseTitle: string;
  total: number;
  paymentMethod: string;
  country: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const metodLabel: Record<string, string> = {
      uplatnica: "Uplatnica (čeka uplatu)",
      paypal: "PayPal (čeka potvrdu)",
      kartica: "Kartica (instant)",
      kartica_rate: "Kartica na rate (instant)",
    };
    const fmt = (n: number) => n.toLocaleString("de-DE");
    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      replyTo: o.email,
      subject: `Nova narudžbina - ${o.fullName} · ${fmt(o.total)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:560px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 12px">🛒 Nova narudžbina</h2>
<table style="border-collapse:collapse;font-size:14px;width:100%">
<tbody>
<tr><td style="padding:6px 8px;color:#888">Narudžbina</td><td style="padding:6px 8px;font-weight:600">${esc(o.orderNumber)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Polaznik</td><td style="padding:6px 8px">${esc(o.fullName)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Mejl</td><td style="padding:6px 8px">${esc(o.email)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Kurs</td><td style="padding:6px 8px">${esc(o.courseTitle)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Iznos</td><td style="padding:6px 8px;font-weight:600">${fmt(o.total)} din</td></tr>
<tr><td style="padding:6px 8px;color:#888">Plaćanje</td><td style="padding:6px 8px">${esc(metodLabel[o.paymentMethod] ?? o.paymentMethod)}</td></tr>
<tr><td style="padding:6px 8px;color:#888">Zemlja</td><td style="padding:6px 8px">${esc(o.country)}</td></tr>
</tbody>
</table>
<p style="margin:18px 0 0">
  <a href="${SITE_URL}/admin/narudzbine" style="display:inline-block;background:#4fb1d3;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Otvori narudžbine</a>
</p>
</body></html>`,
    });
    console.log(`[email] Admin obavešten o narudžbini ${o.orderNumber}`);
  } catch (e) {
    console.error("[email] sendNewOrderAdminEmail pao:", e);
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
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const startUrl = o.lessonId ? `${SITE_URL}/lekcija/${o.lessonId}` : `${SITE_URL}/dashboard`;
    await resend.emails.send({
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
export async function sendExpiryReminder(o: {
  email: string; name: string; courseTitle: string; courseSlug: string; expiresAt: string;
  /** true (default) = video kupci, mejl SA kuponom OBNOVI50. false = ind/grupni, samo info bez kupona. */
  withCoupon?: boolean;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const withCoupon = o.withCoupon !== false;
    const renewUrl = `${SITE_URL}/kupovina/${o.courseSlug}`;
    const datum = new Date(o.expiresAt).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });
    const daysLeft = Math.max(1, Math.round((new Date(o.expiresAt).getTime() - Date.now()) / 86400000));

    const couponBlock = `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da nastaviš, možeš da <strong>obnoviš pristup na još godinu dana</strong> - i to uz <strong>50% popusta</strong> sa kodom:
      </p>
      <div style="text-align:center;margin:0 0 20px;">
        <span style="display:inline-block;background:#fff7ed;border:1px dashed #f59e0b;color:#b45309;font-weight:700;font-size:18px;letter-spacing:1px;padding:10px 20px;border-radius:8px;">OBNOVI50</span>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${renewUrl}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Obnovi pristup</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 8px;">
        Kod uneseš u polju za kupon prilikom kupovine. Ako ti treba pomoć, samo odgovori na ovaj mejl.
      </p>`;

    const noCouponBlock = `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da nastaviš ili pređeš na sledeći nivo, javi nam se - dogovorićemo najbolji sledeći korak za tebe.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="mailto:info@hartweger.rs" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Javi nam se</a>
      </div>`;

    await resend.emails.send({
      from: FROM, to: o.email, replyTo: "info@hartweger.rs",
      subject: withCoupon
        ? `Tvoj pristup kursu ističe ${datum} - obnovi sa 50% popusta`
        : `Tvoj pristup materijalima ističe ${datum}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${esc(o.name || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Tvoj pristup materijalima na platformi za <strong>${esc(o.courseTitle)}</strong> ističe <strong>${datum}</strong> (za ${daysLeft} ${daysLeft === 1 ? "dan" : "dana"}). Posle toga lekcije više neće biti dostupne.
      </p>
      ${withCoupon ? couponBlock : noCouponBlock}
      <p style="font-size:14px;color:#444;margin:0;">- Hartweger tim</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger - Škola nemačkog jezika · hartweger.rs</p></div>
  </div>
</body></html>`,
    });
    console.log(`[email] Podsetnik isteka (${withCoupon ? "kupon" : "bez kupona"}) → ${o.email} (${o.courseTitle})`);
  } catch (e) {
    console.error(`[email] sendExpiryReminder pao za ${o.email}:`, e);
  }
}

// Zamolnica aktivnom polazniku da podeli utisak (Google forma) - radi na zadržavanju + društvenom dokazu.
const REVIEW_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdkhFGw1YN0A6fQp2xvcqrqpSGbUEmcpUHtfLRCi3PagI0Ksw/viewform";
export async function sendReviewRequest(o: { email: string; name: string }) {
  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
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

    await resend.emails.send({
      from: FROM,
      to: ["info@hartweger.rs", "natasa@hartweger.rs"],
      subject: `Jutarnji pregled - ${d.datum}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 4px">Dobro jutro ☀️</h2>
<p style="margin:0 0 4px;color:#666;font-size:13px">Pregled za ${esc(d.datum)}</p>
<div style="background:#f8fcfd;border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px">
  <strong>Juče:</strong> ${d.noveNarudzbine.broj} ${d.noveNarudzbine.broj === 1 ? "nova narudžbina" : "novih narudžbina"} (${fmt(d.noveNarudzbine.iznos)} din naplaćeno) · ${d.neaktivnostPoslato} podsetnika za neaktivnost
</div>
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
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendDailyAdminBrief pao:", e);
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

    await resend.emails.send({
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

    await resend.emails.send({
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
