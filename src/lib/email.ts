import { Resend } from "resend";

const FROM = "Hartweger <kurs@hartweger.rs>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — emails disabled");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
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
        Prijavi se na platformu i započni prvu lekciju:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://kurs.hartweger.rs/prijava" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Započni učenje
        </a>
      </div>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0 0 8px;">
        Možeš instalirati aplikaciju na telefon za brži pristup:
        <a href="https://kurs.hartweger.rs/instaliraj" style="color: #4fb1d3; text-decoration: none;">kurs.hartweger.rs/instaliraj</a>
      </p>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
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
        <a href="https://kurs.hartweger.rs/sertifikat/${certificateId}" style="display: inline-block; background: #34A853; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
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
        Završio/la si sve lekcije kursa <strong>${courseTitle}</strong>. Svaka čast na upornosti!
      </p>

      ${certBlock}

      <div style="background: #f8fcfd; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">
          „Übung macht den Meister"<br>
          <span style="font-size: 12px; color: #999;">— Vežba čini majstora</span>
        </p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="https://kurs.hartweger.rs/dashboard" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Nastavi sa učenjem
        </a>
      </div>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
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
        <a href="https://kurs.hartweger.rs/dashboard" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Nastavi sa učenjem
        </a>
      </div>

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0; text-align: center;">
        Samo 15 minuta dnevno pravi razliku.
      </p>


    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
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

export async function sendPaymentInstructionsEmail(
  to: string,
  name: string,
  courseTitle: string,
  orderNumber: string,
  totalRsd: number,
  paymentMethod: "uplatnica" | "paypal",
  paypalEur?: number
) {
  const paymentBlock =
    paymentMethod === "uplatnica"
      ? `
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
      </div>`
      : `
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

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Narudžbina #${orderNumber} — instrukcije za uplatu`,
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
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
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
