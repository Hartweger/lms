import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";
import { couponPrice, type LevelCourse } from "./courses";

// Lični dnevni limiti (globalni NAKI_MAX_REQUESTS_PER_DAY ostaje kao zaštita troška).
export const NAKI_ANON_DAILY_LIMIT = 20;
export const NAKI_FREE_USER_DAILY_LIMIT = 40;

export type LimitIdentity = { loggedIn: boolean; isStudent: boolean };

/** Lični dnevni limit poruka; null = bez ličnog limita (polaznici). */
export function personalDailyLimit(id: LimitIdentity): number | null {
  if (id.isStudent) return null;
  return id.loggedIn ? NAKI_FREE_USER_DAILY_LIMIT : NAKI_ANON_DAILY_LIMIT;
}

/** 11600 → "11.600", da cena izgleda kao svuda na sajtu. */
function fmt(n: number): string {
  // Namerno bez toLocaleString: uz okrnjen ICU vrati "11,600", a zarez je kod
  // nas decimalni znak, pa bi cena delovala 1000x manja.
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Poruka kad korisnik potroši lični dnevni limit - prodajni trenutak umesto
 * "vidimo se sutra". Redosled je namerno: prvo koliko poruka i kad se vraćaju
 * (bez krivice), pa ponuda, pa tek onda mejl.
 *
 * Jedini pravi argument je da POLAZNICI NEMAJU dnevni limit - to je odgovor na
 * ono što čovek u tom trenutku i traži (još razgovora), a ne opšta reklama.
 * Do 15.08.2026 se to nije pominjalo nigde.
 *
 * Ponuda mora da postoji i kad nivo NIJE poznat: mereno 15.08.2026, od 264
 * limit-događaja nivo je bio nepoznat u 237 (89%), pa je stara poruka u skoro
 * svim slučajevima ostajala bez ijednog prodajnog elementa. Bez nivoa vodimo na
 * katalog i na besplatan test nivoa.
 *
 * NE upućujemo anonimne na pravljenje naloga: /prijava nema registraciju
 * (nalog nastaje kupovinom ili preko Google dugmeta), pa je jedini efekat
 * bio ćorsokak "poslali smo link" bez mejla. Vidi podršku 21.07.2026.
 */
export function limitReachedMessage(opts: {
  loggedIn: boolean;
  course: LevelCourse | null;
}): string {
  const parts: string[] = [];

  if (opts.loggedIn) {
    parts.push(
      `Potrošili smo današnjih ${NAKI_FREE_USER_DAILY_LIMIT} poruka 😊 Sutra nas čeka novih ${NAKI_FREE_USER_DAILY_LIMIT}, a do tada možeš vežbati kroz lekcije na platformi.`
    );
  } else {
    parts.push(
      `Potrošili smo današnjih ${NAKI_ANON_DAILY_LIMIT} besplatnih poruka 😊 Sutra kreće novih ${NAKI_ANON_DAILY_LIMIT}.`
    );
  }

  if (opts.course) {
    parts.push(
      `Ako ti je to premalo: polaznici naših kurseva pišu sa mnom bez dnevnog limita. Za tvoj nivo to je ${opts.course.title}, sa kuponom NAKI10 ${fmt(couponPrice(opts.course.price))} umesto ${fmt(opts.course.price)} RSD: ${SITE_URL}/kursevi/${opts.course.slug}`
    );
  } else {
    parts.push(
      `Ako ti je to premalo: polaznici naših kurseva pišu sa mnom bez dnevnog limita, uz video lekcije, vežbe i sertifikat: ${SITE_URL}/kursevi (ako ne znaš svoj nivo, test je besplatan: ${SITE_URL}/besplatno-testiranje)`
    );
  }

  if (!opts.loggedIn) {
    parts.push("Ostavi mi ime i mejl pa ti pošaljem besplatan plan učenja za tvoj nivo.");
  }

  return parts.join("\n\n");
}

/** Polaznik = ima bilo koji red u course_access ili individual_enrollments. */
export async function userIsStudent(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data: ca } = await admin
    .from("course_access")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (ca && ca.length) return true;
  const { data: ie } = await admin
    .from("individual_enrollments")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  return !!(ie && ie.length);
}

/** Broj današnjih korisničkih poruka za identitet (user_id ako je ulogovan, inače ip_hash). */
export async function countTodayMessages(
  admin: SupabaseClient,
  opts: { day: string; userId: string | null; ipHash: string }
): Promise<number> {
  let q = admin
    .from("naki_messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .eq("kind", "tutor")
    .gte("created_at", opts.day);
  q = opts.userId ? q.eq("user_id", opts.userId) : q.eq("ip_hash", opts.ipHash);
  const { count } = await q;
  return count ?? 0;
}
