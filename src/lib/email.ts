import { Resend } from "resend";
import { SITE_URL } from "@/lib/site-url";

const FROM = "Hartweger <kurs@hartweger.rs>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — emails disabled");
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
        ${ipsQrUrl ? `<div style="text-align: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e8f4f8;">
          <img src="${ipsQrUrl}" alt="IPS QR kod" width="180" height="180" style="border-radius: 8px;" />
          <div style="font-size: 12px; color: #888; margin-top: 6px;">📱 Skeniraj IPS QR kod u aplikaciji za mobilno bankarstvo</div>
        </div>` : ""}
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
      ? `<p style="margin:24px 0"><a href="${esc(opts.meetLink)}" style="background:#0AB3D7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Uđi u učionicu (Google Meet)</a></p>
<p style="font-size:13px;color:#666">Isti Meet link važi za sve časove. Termin ti stiže i u Google kalendar.</p>`
      : `<p style="font-size:14px;color:#666">Link za Google Meet i raspored stižu ti uskoro.</p>`;
    const notesRow = opts.notesUrl
      ? `<p>📝 <a href="${esc(opts.notesUrl)}">Beleške sa časova</a> — profesor/ka ih popunjava posle svakog časa.</p>`
      : "";
    const profRow = opts.profIme ? `<p><strong>Profesor/ka:</strong> ${esc(opts.profIme)}</p>` : "";
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Dobrodošli na grupni kurs nemačkog ${opts.nivo}!`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Dobrodošli${ime ? ", " + esc(ime) : ""}! 💚</h2>
<p>Prijava za <strong>grupni kurs nemačkog ${esc(opts.nivo)}</strong> je potvrđena.</p>
${profRow}
${meetBtn}
${notesRow}
<p>📚 Video lekcije i materijali su ti na platformi: <a href="https://kurs.hartweger.rs/prijava">prijavi se ovde</a> (istim mejlom).</p>
<p style="margin-top:24px">Vidimo se na času!<br>Hartweger tim</p>
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
      subject: `Nastavi nemački — upiši ${opts.nextNivo}`,
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
      subject: `Novi polaznik — grupni ${opts.nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Upisao/la se novi polaznik u tvoju grupu <strong>${esc(opts.nivo)}</strong>:</p>
<p><strong>Ime:</strong> ${esc(opts.studentName || "—")}<br>
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
      ? `<p style="margin:24px 0"><a href="${esc(opts.calendarUrl)}" style="background:#0AB3D7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Zakaži termin</a></p>
<p style="font-size:13px;color:#666">Termine biraš direktno u kalendaru profesorke.</p>`
      : `<p style="font-size:14px;color:#666">Link za zakazivanje termina stiže ti uskoro.</p>`;
    const notesRow = opts.notesUrl ? `<p>📝 <a href="${esc(opts.notesUrl)}">Beleške sa časova</a></p>` : "";
    const profRow = opts.profIme ? `<p><strong>Profesorka:</strong> ${esc(opts.profIme)}</p>` : "";
    const platformRow = opts.hasPlatform
      ? `<p>📚 Video lekcije i materijali su ti na platformi: <a href="https://kurs.hartweger.rs/prijava">prijavi se ovde</a> (istim mejlom).</p>`
      : "";
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Dobrodošli na individualni kurs nemačkog${opts.nivo ? " " + opts.nivo : ""}!`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Dobrodošli${ime ? ", " + esc(ime) : ""}! 💚</h2>
<p>Kupovina <strong>individualnog kursa nemačkog${opts.nivo ? " " + esc(opts.nivo) : ""}</strong> je potvrđena.</p>
${profRow}
${calBtn}
${notesRow}
${platformRow}
<p style="margin-top:24px">Vidimo se na času!<br>Hartweger tim</p>
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
      subject: `Novi individualni polaznik${opts.nivo ? " — " + opts.nivo : ""}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Imaš novog individualnog polaznika (${opts.nivo ? `<strong>${esc(opts.nivo)}</strong>, ` : ""}paket ${opts.lessons} časova):</p>
<p><strong>Ime:</strong> ${esc(opts.studentName || "—")}<br>
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
      subject: `Honorari ${label} — ukupno ${fmt(grandTotal)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Honorari — ${esc(label)}</h2>
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
      ? `Da ne praviš pauzu, nastavi na <strong>sledeći nivo (${esc(opts.nextLevelLabel)})</strong> — ili obnovi paket sa svojom profesorkom.`
      : `Možeš da obnoviš paket sa svojom profesorkom i nastaviš dalje.`;
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Ostao ti je još jedan čas — nastavi nemački",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Bravo${ime ? ", " + esc(ime) : ""}! 🎉</h2>
<p>Skoro si na kraju paketa — ostao ti je <strong>još jedan</strong> individualni čas${opts.nivo ? ` (${esc(opts.nivo)})` : ""}.</p>
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
      subject: `Interes za sledeći termin — ${nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6">
<h2>Novi interes za grupni termin</h2>
<p><strong>Nivo:</strong> ${esc(nivo)}</p>
<p><strong>Ime:</strong> ${esc(ime || "—")}</p>
<p><strong>Mejl:</strong> ${esc(email)}</p>
<p>Grupa za ovaj nivo je trenutno popunjena. Kontaktiraj polaznika kad otvoriš novi termin.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendInteresNotification pao:", e);
  }
}

// Jutarnji pregled adminu (Nataši) — dnevni snapshot stanja iz Supabase.
export type DailyBrief = {
  datum: string;
  noveNarudzbine: { broj: number; iznos: number };
  neaktivnostPoslato: number;
  neplacene: { orderNumber: string; ime: string; total: number; metod: string; danaStaro: number }[];
  isticePristup: { ime: string; kurs: string; datum: string }[];
  indOstao1: { ime: string; profesorka: string; kurs: string }[];
  grupeKraj: { nivo: string; profesorka: string; endDate: string; brojPolaznika: number }[];
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
<tbody>${d.neplacene.map((r) => `<tr><td style="padding:4px 8px">${esc(r.orderNumber)}</td><td style="padding:4px 8px">${esc(r.ime)}</td><td style="padding:4px 8px;text-align:right">${fmt(r.total)}</td><td style="padding:4px 8px">${esc(r.metod)}</td><td style="padding:4px 8px;text-align:right">${r.danaStaro}</td></tr>`).join("")}</tbody></table>`
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
      subject: `Jutarnji pregled — ${d.datum}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 4px">Dobro jutro ☀️</h2>
<p style="margin:0 0 4px;color:#666;font-size:13px">Pregled za ${esc(d.datum)}</p>
<div style="background:#f8fcfd;border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px">
  <strong>Juče:</strong> ${d.noveNarudzbine.broj} ${d.noveNarudzbine.broj === 1 ? "nova narudžbina" : "novih narudžbina"} (${fmt(d.noveNarudzbine.iznos)} din naplaćeno) · ${d.neaktivnostPoslato} podsetnika za neaktivnost
</div>
${sekcija(`Neplaćene narudžbine (${d.neplacene.length})`, neplaceneHtml, "Nema neplaćenih narudžbina.")}
${sekcija(`Ističe pristup — narednih 7 dana (${d.isticePristup.length})`, isteknHtml, "Niko ne ističe ove nedelje.")}
${sekcija(`Individualni — ostao 1 čas (${d.indOstao1.length})`, indHtml, "Nema paketa pri kraju.")}
${sekcija(`Grupe se završavaju — narednih 14 dana (${d.grupeKraj.length})`, grupeHtml, "Nijedna grupa se ne završava uskoro.")}
<p style="margin-top:24px;font-size:12px;color:#aaa">Automatski izveštaj iz LMS-a. Detalji na <a href="https://www.hartweger.rs/admin" style="color:#4fb1d3;text-decoration:none">/admin</a>.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendDailyAdminBrief pao:", e);
  }
}
