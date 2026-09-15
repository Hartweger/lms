import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOtpType, needsClick, potvrdaUrl, safeNext, type OtpType } from "@/lib/auth-confirm";

// Magic-link prijava preko NAŠEG domena (hartweger.rs/auth/confirm), bez Supabase verify hopa.
// Šablon mejla šalje: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
// Stari PKCE tok (/auth/callback ?code=) ostaje za druge slučajeve.
//
// GET više NE troši token (jednokratan je - pregled linka u mejlu ili dupli klik
// ga „pojede", pa polaznik završi na /prijava?greska=auth). GET šalje na
// /auth/potvrda sa dugmetom, a POST odavde radi verifyOtp. Izuzetak: auto=1 -
// linkovi koje naš server sam otvara u browseru (nestpay auto-login, impersonate).

async function verifyAndRedirect(origin: string, token_hash: string, type: OtpType, next: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`, { status: 303 });
  }

  // Token već iskorišćen, ali je taj prvi klik možda upravo ovaj browser ulogovao
  // (dupli klik). Ako sesija postoji - pusti unutra umesto da vraćamo na prijavu.
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return NextResponse.redirect(`${origin}${next}`, { status: 303 });
  }

  return NextResponse.redirect(`${origin}/prijava?greska=auth`, { status: 303 });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  if (!token_hash || !isOtpType(type)) {
    return NextResponse.redirect(`${origin}/prijava?greska=auth`);
  }

  if (needsClick(searchParams.get("auto"))) {
    return NextResponse.redirect(`${origin}${potvrdaUrl({ token_hash, type, next })}`);
  }

  return verifyAndRedirect(origin, token_hash, type, next);
}

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const form = await request.formData();
  const token_hash = form.get("token_hash");
  const type = form.get("type");
  const next = safeNext(typeof form.get("next") === "string" ? (form.get("next") as string) : null);

  if (typeof token_hash !== "string" || !token_hash || typeof type !== "string" || !isOtpType(type)) {
    return NextResponse.redirect(`${origin}/prijava?greska=auth`, { status: 303 });
  }

  return verifyAndRedirect(origin, token_hash, type, next);
}
