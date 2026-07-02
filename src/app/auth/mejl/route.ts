// src/app/auth/mejl/route.ts
// Login-link iz mejlova (welcome/nudge): verifikuje naš HMAC token pa TEK TADA
// generiše svež Supabase magic link i postavlja sesiju - vidi src/lib/login-link.ts
// zašto ne ide sirovi magic link u mejl. Neuspeh → /prijava?greska=link (baner).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLoginLinkToken } from "@/lib/login-link";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const t = searchParams.get("t");
  const payload = t ? verifyLoginLinkToken(t) : null;
  if (!payload) {
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  const admin = createAdminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: payload.email,
  });
  if (error || !link?.properties?.hashed_token) {
    console.error(`[auth/mejl] generateLink pao za ${payload.email}:`, error?.message);
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError) {
    console.error(`[auth/mejl] verifyOtp pao za ${payload.email}:`, otpError.message);
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  console.log(`[auth/mejl] login-link prijava: ${payload.email} → ${payload.next}`);
  return NextResponse.redirect(`${origin}${payload.next}`);
}
