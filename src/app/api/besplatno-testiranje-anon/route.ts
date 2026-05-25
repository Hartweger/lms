import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan format." }, { status: 400 });
  }

  const { scores, recommendedLevel, totalQuestions, totalCorrect } = body;

  const validLevels = ["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2","C1+"];
  if (!recommendedLevel || !validLevels.includes(recommendedLevel)) {
    return NextResponse.json({ error: "Nedostaju podaci." }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.from("placement_test_results").insert({
    scores,
    recommended_level: recommendedLevel,
    total_questions: totalQuestions,
    score: totalCorrect,
    ip_address: ip,
  });

  return NextResponse.json({ success: true });
}
