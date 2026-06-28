import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { accessStatus, shouldShowRenew, isRenewable } from "@/lib/account";
import { GrupniIIndividualni, ProfilSekcija } from "./Sekcije";

export const metadata = { title: "Moj nalog - Hartweger", robots: { index: false } };

interface OrderItem {
  title?: string;
  course_slug?: string;
}

export default async function NalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: accessList } = await supabase
    .from("course_access")
    .select("course_id, expires_at")
    .eq("user_id", user.id);
  const courseIds = (accessList ?? []).map((a) => a.course_id);

  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title, slug, category").in("id", courseIds)
    : { data: [] as Array<{ id: string; title: string; slug: string; category: string | null }> };

  const now = new Date();
  const kursevi = (courses ?? []).map((c) => {
    const acc = (accessList ?? []).find((a) => a.course_id === c.id);
    return { ...c, status: accessStatus(acc?.expires_at ?? null, now) };
  });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, items, total, payment_method, created_at, fiscal_pdf_url")
    .eq("payment_status", "completed")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moj nalog</h1>

      {/* Pristup i kursevi */}
      <section className="mb-8">
        <p className="text-sm font-medium text-gray-500 mb-2">Pristup i kursevi</p>
        {kursevi.map((c) => {
          const expired = c.status.state === "expired";
          const renew = shouldShowRenew(c.status) && isRenewable(c.category, c.slug);
          return (
            <div
              key={c.id}
              className={`border rounded-lg p-4 mb-2 ${expired ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-200"}`}
            >
              <p className="font-medium text-gray-900">{c.title}</p>
              {c.status.state === "active" && c.status.daysLeft !== null && c.status.daysLeft <= 30 && (
                <p className="text-sm text-gray-500 mt-1">Pristup ističe za {c.status.daysLeft} dana</p>
              )}
              {c.status.state === "expiring" && (
                <p className="text-sm text-koral-dark mt-1">Pristup ističe za {c.status.daysLeft} dana</p>
              )}
              {expired && <p className="text-sm text-koral-dark mt-1">Pristup je istekao</p>}
              {renew && (
                <Link
                  href={`/kupovina/${c.slug}?kupon=OBNOVI50`}
                  className="inline-block mt-2 text-sm bg-koral-light text-koral-dark px-3 py-1.5 rounded-lg hover:bg-koral hover:text-white transition-colors"
                >
                  Obnovi −50%
                </Link>
              )}
            </div>
          );
        })}
        {kursevi.length === 0 && (
          <p className="text-sm text-gray-500">
            Još nemaš kurseve.{" "}
            <Link href="/kursevi" className="text-plava">Pogledaj ponudu</Link>
          </p>
        )}
      </section>

      {/* Časovi uživo (grupni + 1:1) - klijentski, učitava se iz API-ja */}
      <GrupniIIndividualni />

      {/* Moje porudžbine */}
      <section className="mb-8">
        <p className="text-sm font-medium text-gray-500 mb-2">Moje porudžbine</p>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {(orders ?? []).map((o) => {
            const items = (o.items as OrderItem[]) ?? [];
            const naziv = items[0]?.title ?? "Porudžbina";
            return (
              <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{naziv}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleDateString("sr-RS")} · {o.payment_method} · plaćeno
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium whitespace-nowrap">{o.total.toLocaleString("sr-RS")} RSD</span>
                  {o.fiscal_pdf_url && (
                    <a
                      href={o.fiscal_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-plava border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 whitespace-nowrap"
                    >
                      Račun
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {(orders ?? []).length === 0 && (
            <p className="text-sm text-gray-500 px-4 py-3">Nemaš porudžbina.</p>
          )}
        </div>
      </section>

      {/* Profil + promena mejla */}
      <ProfilSekcija initialName={profile?.full_name ?? ""} email={user.email ?? ""} />

      <p className="text-sm text-gray-400 mt-10 text-center">
        Treba ti pomoć? Piši nam na{" "}
        <a href="mailto:info@hartweger.rs" className="text-plava">info@hartweger.rs</a>
      </p>
    </div>
  );
}
