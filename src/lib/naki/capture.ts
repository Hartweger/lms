// NaKI email capture — welcome mejl (Resend), MailerLite, fallback planovi.
// Portovano sa starog PHP-a (sendWelcomeEmail / addToMailerLite / getFallbackPlan).
import { Resend } from "resend";
import { NAKI_MAILERLITE_GROUP } from "./system-prompt";

const FROM = "Nataša Hartweger <natasa@hartweger.rs>";

const LEVEL_LINKS: Record<string, string> = {
  A1: '<a href="https://www.hartweger.rs/padezi-u-nemackom-jeziku-kako-prepoznati-padeze-u-nemackom-jeziku/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Padeži u nemačkom</a> | <a href="https://www.hartweger.rs/rodovi-u-nemackom/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Rodovi: der, die, das</a>',
  A2: '<a href="https://www.hartweger.rs/modalni-glagoli-u-nemackom-jeziku-kroz-najkorisnije-primere/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Modalni glagoli</a> | <a href="https://www.hartweger.rs/vremena-u-nemackom-jeziku-kako-i-kada-se-koriste-video-lekcija-pdf/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Vremena u nemačkom</a>',
  B1: '<a href="https://www.hartweger.rs/weil-recenice/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Weil rečenice</a> | <a href="https://www.hartweger.rs/testovi-za-ispit-b1-iz-nemackog-jezika/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Testovi za B1 ispit</a>',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getFallbackPlan(name: string, level: string): string {
  const lvl = level.toUpperCase();
  const plans: Record<string, string> = {
    A1: `Hallo, ${name}! Odlično što počinješ od samog početka — A1 je temelj svega! Na osnovu naših razgovora, vidiš se da imaš motivaciju i volju, što je pola posla. Evo tvojih 3 prioriteta:\n\n1. Glagol 'sein' i 'haben' — nauči ih napamet! Ich bin, du bist, er ist. Ich habe, du hast, er hat.\n2. Rod imenica — uvek uči sa članom: der Mann, die Frau, das Kind.\n3. Prezent glagola — nastavci E-ST-T-EN-T-EN: ich lerne, du lernst, er lernt.\n\nMali koraci svaki dan — za mesec dana ćeš videti ogromnu razliku!`,
    A2: `Hallo, ${name}! Ti si već prošao osnove i spreman si za sledeći korak — bravo! Vidi se da razumeš strukturu rečenice, sada je vreme da je utvrdiš. Evo tvojih 3 prioriteta:\n\n1. Akuzativ — samo muški rod se menja: den Mann (ne der!). Sve ostalo ostaje isto.\n2. Modalni glagoli — können, müssen, wollen. Ich kann schwimmen. Du musst lernen.\n3. Perfekt za razgovor — haben/sein + Partizip: Ich habe gegessen. Ich bin gefahren.\n\nSvaki dan po 15 minuta — jezik je kao mišić, treba vežbanje!`,
    B1: `Hallo, ${name}! B1 nivo znači da možeš da se sporazumeš — to je veliki uspeh! Sada radimo na tečnosti i sigurnosti. Evo tvojih 3 prioriteta:\n\n1. Zavisne rečenice sa 'weil' i 'dass' — glagol ide na kraj! Ich lerne, weil ich nach Deutschland fahren möchte.\n2. Konjunktiv II za uljudnost — Könnten Sie mir helfen? Ich würde gerne...\n3. Pasiv — Das Buch wird gelesen. Proširuje ti izražavanje za pisane tekstove.\n\nTi si na pravom putu — samo nastavi!`,
  };
  if (plans[lvl]) return plans[lvl];
  return `Hallo, ${name}! Drago mi je što si ovde! Na osnovu naših razgovora, vidiš se da imaš pravi pristup učenju nemačkog. Evo tvojih 3 prioriteta:\n\n1. Gradivo svaki dan — i 10-15 minuta je dovoljno za napredak.\n2. Rod imenica — uvek uči sa članom: der, die, das.\n3. Perfekt u govoru — Ich habe gemacht, Ich bin gegangen — ovo ti treba odmah!\n\nJa sam tu za sva pitanja. Hajde da učimo zajedno!`;
}

export async function sendNakiWelcomeEmail(
  to: string,
  name: string,
  level: string,
  plan: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[naki] RESEND_API_KEY not set — welcome email disabled");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const linksHtml = LEVEL_LINKS[level.toUpperCase()] ??
    '<a href="https://www.hartweger.rs/?utm_source=naki&utm_medium=email" style="color:#4EADC5;">Blog Hartweger centra</a>';
  const planHtml = escapeHtml(plan).replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html lang="sr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
    <tr><td style="background:#4EADC5;padding:30px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">NaKI</h1>
      <p style="margin:8px 0 0;color:#e0f4f9;font-size:14px;">Natašin AI asistent za nemački jezik</p>
    </td></tr>
    <tr><td style="padding:40px;">
      <p style="font-size:16px;color:#333;line-height:1.6;">${planHtml}</p>
      <hr style="border:none;border-top:1px solid #e8e8e8;margin:30px 0;">
      <p style="font-size:14px;color:#666;">Korisni članci za tvoj nivo:</p>
      <p style="font-size:14px;">${linksHtml}</p>
      <p style="font-size:14px;color:#666;">YouTube lekcije: <a href="https://www.youtube.com/@NatasaHartweger?utm_source=naki&utm_medium=email" style="color:#4EADC5;">@NatasaHartweger</a></p>
      <hr style="border:none;border-top:1px solid #e8e8e8;margin:30px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="https://www.hartweger.rs/kursevi-nemackog/?utm_source=naki&utm_medium=email&utm_campaign=welcome_plan" style="display:inline-block;background:#4EADC5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">Pogledaj kurseve</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">Nataša Hartweger | <a href="https://www.hartweger.rs" style="color:#4EADC5;">www.hartweger.rs</a> | <a href="mailto:info@hartweger.rs" style="color:#4EADC5;">info@hartweger.rs</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "natasa@hartweger.rs",
      subject: `Hallo, ${name}! Tvoj plan učenja je spreman`,
      html,
    });
  } catch (e) {
    console.error("[naki] welcome email failed", e);
  }
}

export async function addToMailerLite(email: string, name: string, level: string): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) return;
  const parts = name.trim().split(" ");
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  try {
    await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: { name, last_name: lastName, naki_nivo: level },
        groups: [NAKI_MAILERLITE_GROUP],
      }),
    });
  } catch (e) {
    console.error("[naki] MailerLite add failed", e);
  }
}
