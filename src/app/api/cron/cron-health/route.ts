// Watchdog nad svim cronovima: čita cron_runs i diže Sentry alarm ako neki
// cron kasni, pada ili je nestao. Samog sebe prijavljuje Sentry Cron Monitoru
// (slug "cron-health") - ako watchdog umre, Sentry javlja "missed check-in".
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPECTED_CRONS, findCronProblems, type CronRunRow } from "@/lib/cron-log";

export const dynamic = "force-dynamic";

const LOOKBACK_DAYS = 32; // pokriva i mesečni honorari cron

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return await Sentry.withMonitor(
    "cron-health",
    async () => {
      const admin = createAdminClient();
      const since = new Date(Date.now() - LOOKBACK_DAYS * 86400_000).toISOString();

      // Ne čitamo ceo prozor odjednom: PostgREST vraća najviše 1000 redova (Supabase
      // „Max rows"), a nestpay-poll na 15 min sam upiše ~3.000 reda za 32 dana - upit bi
      // se tiho odsekao i watchdog bi javljao lažno „nema-zapisa". Treba nam samo poslednji
      // prolaz po cronu, plus najstariji red u prozoru (zaštita „sistem je još mlad").
      const responses = await Promise.all([
        admin.from("cron_runs").select("name, ok, created_at").gte("created_at", since)
          .order("created_at", { ascending: true }).limit(1),
        ...EXPECTED_CRONS.map((c) =>
          admin.from("cron_runs").select("name, ok, created_at").eq("name", c.name)
            .gte("created_at", since).order("created_at", { ascending: false }).limit(1)
        ),
      ]);

      const failed = responses.find((r) => r.error);
      if (failed?.error) {
        Sentry.captureException(new Error(`[cron-health] čitanje cron_runs palo: ${failed.error.message}`));
        return NextResponse.json({ error: failed.error.message }, { status: 500 });
      }

      const runs = responses.flatMap((r) => (r.data ?? []) as CronRunRow[]);
      const problems = findCronProblems(EXPECTED_CRONS, runs, Date.now());
      if (problems.length > 0) {
        Sentry.captureException(
          new Error(
            `[cron-health] ${problems.length} cron(ova) sa problemom: ` +
              problems.map((p) => `${p.name}=${p.problem}`).join(", ")
          )
        );
      }

      return NextResponse.json({ checkedRuns: runs.length, problems });
    },
    {
      schedule: { type: "crontab", value: "0 16 * * *" },
      checkinMargin: 60,
      maxRuntime: 10,
      timezone: "Etc/UTC",
    }
  );
}
