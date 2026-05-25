import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan format podataka." }, { status: 400 });
  }

  const { email, scores, recommendedLevel, totalQuestions, totalCorrect } = body;

  if (!email || !scores || !recommendedLevel) {
    return NextResponse.json({ error: "Nedostaju podaci." }, { status: 400 });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Neispravna email adresa." }, { status: 400 });
  }

  const validLevels = ["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2","C1+"];
  if (!validLevels.includes(recommendedLevel)) {
    return NextResponse.json({ error: "Neispravan nivo." }, { status: 400 });
  }

  if (typeof scores !== "object" || scores === null) {
    return NextResponse.json({ error: "Neispravni skorovi." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("placement_test_results").insert({
    email: trimmedEmail,
    scores,
    recommended_level: recommendedLevel,
    total_questions: totalQuestions,
    score: totalCorrect,
    ip_address: ip,
  });

  if (dbError) {
    console.error("Supabase error:", dbError);
  }

  const mlApiKey = process.env.MAILERLITE_API_KEY;
  if (mlApiKey) {
    try {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlApiKey}`,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          fields: {
            test_nivo: recommendedLevel,
            test_score: `${totalCorrect}/${totalQuestions}`,
          },
          groups: [process.env.MAILERLITE_EINSTUFUNG_GROUP_ID].filter(Boolean),
        }),
      });
    } catch (mlError) {
      console.error("MailerLite error:", mlError);
    }
  }

  return NextResponse.json({ success: true });
}
