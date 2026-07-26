import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryMessage = { role: "user" | "assistant"; content: string };

type Row = { role?: string | null; message?: string | null };

// Koliko poruka sesije čitamo za pamćenje (nivo, ime, rod, već postavljena pitanja).
// Ovo NE ide modelu - modelu i dalje ide kratak prozor razgovora.
const MAX_ROWS = 200;

/**
 * Redovi iz `naki_messages` u istoriju razgovora, bez internih markera
 * (`[limit_reached]`, `[email_capture]`) koje korisnik nikad nije video.
 */
export function toHistory(rows: Row[] | null | undefined): HistoryMessage[] {
  if (!rows) return [];
  const out: HistoryMessage[] = [];
  for (const r of rows) {
    if (r?.role !== "user" && r?.role !== "assistant") continue;
    const content = typeof r.message === "string" ? r.message.trim() : "";
    if (!content || content.startsWith("[")) continue;
    out.push({ role: r.role, content });
  }
  return out;
}

/**
 * Cela istorija sesije iz baze.
 *
 * Zašto iz baze: klijent šalje samo poslednjih 12 poruka (NakiChat.tsx), pa je server
 * "pamtio" samo taj prozor. Zbog toga je NaKI iznova pitao za nivo (u analizi 05.06-25.07:
 * 145 sesija dvaput, rekord 7) i, od 26.07, za rod - svako ponovljeno pitanje bilo je
 * dalje od 12 poruka unazad. Poruke ionako sve zapisujemo, pa ih odavde i čitamo.
 */
export async function loadSessionHistory(
  admin: SupabaseClient,
  sessionId: string
): Promise<HistoryMessage[]> {
  if (!sessionId) return [];
  const { data, error } = await admin
    .from("naki_messages")
    .select("role, message")
    .eq("session_id", sessionId)
    .eq("kind", "tutor")
    .order("created_at", { ascending: true })
    .limit(MAX_ROWS);
  if (error) return [];
  return toHistory(data as Row[]);
}
