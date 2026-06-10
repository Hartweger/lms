import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { aggregateMonthly, computeHonorar, MESECI } from "@/lib/honorar";
import { resolveProfessorView } from "@/lib/professor-view";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("de-DE");

export default async function ProfesorHonorar({ searchParams }: { searchParams: Promise<{ god?: string; prof?: string }> }) {
  const { god, prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;
  const admin = createAdminClient();
  const isAdmin = ctx.isAdmin;

  const nowYear = new Date().getFullYear();
  const year = god && /^\d{4}$/.test(god) ? parseInt(god, 10) : nowYear;
  const from = `${year}-01-01`;
  const toExcl = `${year + 1}-01-01`;

  const YearTabs = (
    <div className="flex gap-2 mb-5">
      {[nowYear, nowYear - 1].map((y) => (
        <Link key={y} href={`/profesor/honorar?god=${y}${prof ? `&prof=${prof}` : ""}`}
          className={`px-3 py-1.5 rounded-lg text-sm ${y === year ? "bg-plava-light text-plava font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
          {y}.
        </Link>
      ))}
    </div>
  );

  // ───────── Profesorka: mesečni pregled svojih (i kad admin „gleda kao" profesora) ─────────
  if (!isAdmin || prof) {
    const [{ data: il }, { data: gs }] = await Promise.all([
      admin.from("individual_lessons").select("lesson_date").eq("professor_id", ctx.profId).gte("lesson_date", from).lt("lesson_date", toExcl),
      admin.from("group_sessions").select("session_date").eq("professor_id", ctx.profId).eq("cancelled", false).gte("session_date", from).lt("session_date", toExcl),
    ]);
    const { months, yearTotal } = aggregateMonthly(
      year,
      (il ?? []).map((x) => x.lesson_date),
      (gs ?? []).map((x) => x.session_date),
      ctx.honorarInd, ctx.honorarGrp,
    );
    return (
      <div>
        {YearTabs}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr><th className="text-left px-6 py-3">Mesec</th><th className="text-right px-6 py-3">Ind</th><th className="text-right px-6 py-3">Grp</th><th className="text-right px-6 py-3">Ukupno</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map((m) => (
                <tr key={m.month} className={m.total === 0 ? "text-gray-300" : "hover:bg-gray-50"}>
                  <td className="px-6 py-3 capitalize">{MESECI[m.month - 1]}</td>
                  <td className="px-6 py-3 text-right">{m.ind || "—"}</td>
                  <td className="px-6 py-3 text-right">{m.grp || "—"}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">{m.total ? fmt(m.total) + " din" : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-plava-light/40 font-bold text-gray-900">
                <td className="px-6 py-3" colSpan={3}>Ukupno {year}.</td>
                <td className="px-6 py-3 text-right">{fmt(yearTotal)} din</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">Računato uživo iz održanih časova/sesija. Zvaničan obračun stiže mejlom 1. u mesecu.</p>
      </div>
    );
  }

  // ───────── Admin: godišnji pregled po profesorki ─────────
  const { data: profs } = await admin.from("user_profiles").select("id, full_name, honorar_ind, honorar_grp").not("honorar_ind", "is", null);
  const [{ data: ilAll }, { data: gsAll }] = await Promise.all([
    admin.from("individual_lessons").select("professor_id").gte("lesson_date", from).lt("lesson_date", toExcl),
    admin.from("group_sessions").select("professor_id").eq("cancelled", false).gte("session_date", from).lt("session_date", toExcl),
  ]);
  const indByProf = new Map<string, number>();
  for (const r of ilAll ?? []) indByProf.set(r.professor_id, (indByProf.get(r.professor_id) ?? 0) + 1);
  const grpByProf = new Map<string, number>();
  for (const r of gsAll ?? []) if (r.professor_id) grpByProf.set(r.professor_id, (grpByProf.get(r.professor_id) ?? 0) + 1);

  const rows = (profs ?? []).map((p) => {
    const ind = indByProf.get(p.id) ?? 0;
    const grp = grpByProf.get(p.id) ?? 0;
    const h = computeHonorar(ind, grp, p.honorar_ind ?? 1400, p.honorar_grp ?? 1600);
    return { name: p.full_name || "—", ind, grp, total: h.total };
  }).sort((a, b) => b.total - a.total);
  const grand = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      {YearTabs}
      <p className="text-xs text-gray-400 mb-4">Godišnji pregled po profesorki ({year}.). Mesečni detalj svaka profesorka vidi na svom nalogu.</p>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr><th className="text-left px-6 py-3">Profesorka</th><th className="text-right px-6 py-3">Ind</th><th className="text-right px-6 py-3">Grp</th><th className="text-right px-6 py-3">Ukupno {year}.</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.name} className={r.total === 0 ? "text-gray-300" : "hover:bg-gray-50"}>
                <td className="px-6 py-3 text-gray-900">{r.name}</td>
                <td className="px-6 py-3 text-right">{r.ind || "—"}</td>
                <td className="px-6 py-3 text-right">{r.grp || "—"}</td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">{r.total ? fmt(r.total) + " din" : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-plava-light/40 font-bold text-gray-900">
              <td className="px-6 py-3" colSpan={3}>UKUPNO {year}.</td>
              <td className="px-6 py-3 text-right">{fmt(grand)} din</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
