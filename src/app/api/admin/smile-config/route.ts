import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_KEYS = ["enabled", "nudge", "lead_capture", "coupon", "model"] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { admin: null, status: 401 as const };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? { admin, status: 200 as const } : { admin: null, status: 403 as const };
}

export async function POST(request: Request) {
  const { admin, status } = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status });

  const body = await request.json();
  const { key, value } = body as { key?: string; value?: string };

  if (!key || !(ALLOWED_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: "Nepoznat ključ." }, { status: 400 });
  }
  if (typeof value !== "string") {
    return NextResponse.json({ error: "Vrednost mora biti string." }, { status: 400 });
  }

  const { error } = await admin.from("smile_config").upsert({ key, value }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
