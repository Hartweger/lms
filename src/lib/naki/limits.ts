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

/**
 * Poruka kad korisnik potroši lični dnevni limit - prodajni trenutak umesto
 * "vidimo se sutra". Anonimnima nudi plan učenja na mejl; svima sa poznatim
 * nivoom nudi odgovarajući video kurs uz kupon NAKI10.
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
      "Za danas smo potrošili sve poruke 😊 Sutra nastavljamo sa novom energijom! Do tada možeš vežbati kroz lekcije na platformi."
    );
  } else {
    parts.push(
      "Za danas smo potrošili besplatne poruke 😊 Ostavi mi ime i mejl pa ti pošaljem besplatan plan učenja, a sutra nastavljamo."
    );
  }
  if (opts.course) {
    parts.push(
      `P.S. Ako želiš da učiš svojim tempom, tu je ${opts.course.title} - sa kuponom NAKI10 košta ${couponPrice(opts.course.price)} umesto ${opts.course.price} RSD: ${SITE_URL}/kursevi/${opts.course.slug}`
    );
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
