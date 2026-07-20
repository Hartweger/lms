import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

// Autoritativni limiter je u bazi (migracija 065, RPC rate_limit_hit) jer se
// in-memory Map resetuje na cold start i ne deli između lambdi. Map ostaje
// samo kao fallback kad RPC zakaže - bolje i labav limit nego pukla ruta.
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

let dbFailureReported = false;

function rateLimitMemory(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

export async function rateLimit(
  key: string,
  opts?: { max?: number; windowMs?: number }
): Promise<{ allowed: boolean; remaining: number }> {
  const max = opts?.max ?? MAX_REQUESTS;
  const windowMs = opts?.windowMs ?? WINDOW_MS;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .rpc("rate_limit_hit", { p_key: key, p_max: max, p_window_ms: windowMs })
      .single<{ allowed: boolean; remaining: number }>();
    if (error || !data) throw error ?? new Error("rate_limit_hit: prazan odgovor");
    return { allowed: data.allowed, remaining: data.remaining };
  } catch (err) {
    if (!dbFailureReported) {
      dbFailureReported = true;
      console.error("[rate-limit] RPC pao, fallback na in-memory:", err);
      Sentry.captureException(err, { tags: { modul: "rate-limit" } });
    }
    return rateLimitMemory(key, max, windowMs);
  }
}
