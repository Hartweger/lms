import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // 1) ZAVRŠI: prošao kraj → zavrsena (sve aktivne, ne dira otkazane/već završene).
  const { data: closed, error: e1 } = await admin.from("groups")
    .update({ status: "zavrsena", updated_at: now })
    .lt("end_date", today)
    .in("status", ["planiran", "uskoro", "otvoren", "u_toku"])
    .select("id");
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  // 2) POKRENI: počela (start prošao), nije se završila → u_toku.
  const { data: started, error: e2 } = await admin.from("groups")
    .update({ status: "u_toku", updated_at: now })
    .lte("start_date", today)
    .in("status", ["planiran", "uskoro", "otvoren"])
    .or(`end_date.gte.${today},end_date.is.null`)
    .select("id");
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ closed: closed?.length || 0, started: started?.length || 0 });
}
