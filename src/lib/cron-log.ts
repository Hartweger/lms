// Cron nadzor (audit jul 2026): 18 cron zakazivanja nosi novčane i mejl tokove,
// a pad je do sada bio nevidljiv. Svaki cron kroz withCronLog upisuje red u
// cron_runs (migracija 061); dnevni /api/cron/cron-health poredi poslednje
// upise sa očekivanim intervalima i diže Sentry alarm. Samog watchdoga čuva
// Sentry Cron Monitor (jedini - ostaje u besplatnoj kvoti).
import { createAdminClient } from "@/lib/supabase/admin";

/** Očekivani cronovi i koliko sme da prođe od poslednjeg prolaza (sa zazorom). */
export const EXPECTED_CRONS: { name: string; maxAgeHours: number }[] = [
  // dnevni (26h = 24h + zazor)
  { name: "inactivity", maxAgeHours: 26 },
  { name: "activation", maxAgeHours: 26 },
  { name: "expiry-reminder", maxAgeHours: 26 },
  { name: "review-request", maxAgeHours: 26 },
  { name: "review-recert", maxAgeHours: 26 },
  { name: "eseji-pregled", maxAgeHours: 26 },
  { name: "close-groups", maxAgeHours: 26 },
  { name: "jutarnji-pregled", maxAgeHours: 26 },
  { name: "grupe-podsetnik", maxAgeHours: 26 },
  { name: "test-funnel", maxAgeHours: 26 },
  // 3x dnevno (6,14,22 UTC → najviše 8h razmaka + zazor)
  { name: "nestpay-reconcile", maxAgeHours: 10 },
  // nedeljni (170h = 7 dana + zazor)
  { name: "access-audit", maxAgeHours: 170 },
  { name: "naki-content-weekly", maxAgeHours: 170 },
  { name: "prof-podsetnik", maxAgeHours: 170 },
  { name: "business-summary", maxAgeHours: 170 },
  // mesečni (31 dan + zazor)
  { name: "honorari", maxAgeHours: 745 },
];

/**
 * Omotač za cron GET handlere: beleži svaki autorizovan prolaz u cron_runs.
 * 401 (skeneri/pogrešan secret) se ne beleži; pad upisa ne sme da obori cron.
 */
export function withCronLog<R extends Request>(
  name: string,
  handler: (req: R) => Promise<Response>
): (req: R) => Promise<Response> {
  return async (req: R) => {
    const started = Date.now();
    let res: Response | null = null;
    let thrown: unknown = null;
    try {
      res = await handler(req);
    } catch (e) {
      thrown = e;
    }
    const status = res?.status ?? 500;
    if (status !== 401) {
      try {
        const admin = createAdminClient();
        await admin.from("cron_runs").insert({
          name,
          ok: !thrown && status < 400,
          status,
          duration_ms: Date.now() - started,
        });
      } catch (e) {
        console.error(`[cron-log] upis za ${name} pao:`, e);
      }
    }
    if (thrown) throw thrown;
    return res!;
  };
}

export interface CronRunRow {
  name: string;
  ok: boolean;
  created_at: string;
}

export interface CronProblem {
  name: string;
  problem: "kasni" | "pao" | "nema-zapisa";
}

/**
 * Poredi poslednje prolaze sa očekivanim intervalima. „nema-zapisa" se javlja
 * samo ako je najstariji red u tabeli stariji od intervala tog crona - da svež
 * deploy nadzora ne okine lažne alarme za cronove koji još nisu ni trebali da prođu.
 */
export function findCronProblems(
  expected: { name: string; maxAgeHours: number }[],
  runs: CronRunRow[],
  nowMs: number
): CronProblem[] {
  const latest = new Map<string, CronRunRow>();
  let oldestMs = Infinity;
  for (const r of runs) {
    const t = new Date(r.created_at).getTime();
    if (t < oldestMs) oldestMs = t;
    const cur = latest.get(r.name);
    if (!cur || t > new Date(cur.created_at).getTime()) latest.set(r.name, r);
  }

  const problems: CronProblem[] = [];
  for (const exp of expected) {
    const maxAgeMs = exp.maxAgeHours * 3600_000;
    const run = latest.get(exp.name);
    if (!run) {
      if (oldestMs !== Infinity && nowMs - oldestMs > maxAgeMs) {
        problems.push({ name: exp.name, problem: "nema-zapisa" });
      }
      continue;
    }
    if (!run.ok) {
      problems.push({ name: exp.name, problem: "pao" });
    } else if (nowMs - new Date(run.created_at).getTime() > maxAgeMs) {
      problems.push({ name: exp.name, problem: "kasni" });
    }
  }
  return problems;
}
