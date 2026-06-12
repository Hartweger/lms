// Odjava od funnel/ponudbenih mejlova - link iz mejla (potpisan HMAC tokenom).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odjavaToken } from "@/lib/optout";

export const dynamic = "force-dynamic";

function page(poruka: string) {
  return `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hartweger</title></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:60px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#4fb1d3;">Hartweger</div>
      <div style="font-size:13px;color:#999;margin-top:4px;">Škola nemačkog jezika</div>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:24px 0 0;">${poruka}</p>
    </div>
  </div>
</body></html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("e") ?? "").trim().toLowerCase();
  const token = searchParams.get("t") ?? "";

  if (!email || !token || token !== odjavaToken(email)) {
    return new NextResponse(
      page("Link za odjavu nije ispravan. Piši nam na <a href=\"mailto:info@hartweger.rs\" style=\"color:#4fb1d3\">info@hartweger.rs</a> i odjavićemo te ručno."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("email_optouts")
    .upsert({ email, source: "link" }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("[odjava] upis pao:", error);
    return new NextResponse(
      page("Nešto nije u redu na našoj strani. Piši nam na <a href=\"mailto:info@hartweger.rs\" style=\"color:#4fb1d3\">info@hartweger.rs</a> i odjavićemo te ručno."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  console.log(`[odjava] ${email} odjavljen sa funnel mejlova`);
  return new NextResponse(
    page("Odjavljen/a si - nećemo ti više slati ponude na ovaj mejl. 💙<br><br>Ako se predomisliš, dovoljno je da ponovo uradiš test znanja na sajtu."),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
