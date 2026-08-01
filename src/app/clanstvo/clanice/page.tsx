// Imenik članica - vidljiv samo aktivnim članicama (RLS 074). Inicijali
// umesto fotografija (v1 - bez Storage-a).
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function inicijali(ime: string): string {
  return ime.split(/\s+/).filter(Boolean).slice(0, 2).map((d) => d[0]?.toUpperCase()).join("");
}

// Sajt unosi članica ručno - normalizujemo na https:// i dozvoljavamo link
// samo ako rezultat zaista počinje sa http(s), da se spreči npr. javascript: šema.
function sajtUrl(web: string): string | null {
  const url = web.startsWith("http") ? web : `https://${web}`;
  return /^https?:\/\//i.test(url) ? url : null;
}

export default async function Clanice() {
  const supabase = await createClient();
  const { data: clanice } = await supabase
    .from("member_profiles")
    .select("user_id, ime, delatnost, bio, instagram, web")
    .neq("ime", "")
    .order("ime", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Članice</h1>
      <p className="mt-1 text-nh-dark/70">
        Upoznaj se i poveži - dopuni svoj profil da bi te ostale pronašle.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(clanice ?? []).map((c) => (
          <div key={c.user_id} className="rounded-xl border border-nh-pink-light bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nh-pink-light font-heading font-bold text-nh-pink">
                {inicijali(c.ime)}
              </div>
              <div>
                <p className="font-semibold text-nh-dark">{c.ime}</p>
                {c.delatnost && <p className="text-sm text-nh-dark/60">{c.delatnost}</p>}
              </div>
            </div>
            {c.bio && <p className="mt-3 text-sm text-nh-dark/80">{c.bio}</p>}
            <div className="mt-3 flex gap-3 text-sm font-semibold text-nh-pink">
              {c.instagram && (
                <a href={`https://instagram.com/${encodeURIComponent(c.instagram)}`} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
              {c.web && sajtUrl(c.web) && (
                <a href={sajtUrl(c.web)!} target="_blank" rel="noopener noreferrer">
                  Sajt
                </a>
              )}
            </div>
          </div>
        ))}
        {(clanice ?? []).length === 0 && (
          <p className="text-nh-dark/60">Još nema popunjenih profila - budi prva!</p>
        )}
      </div>
    </div>
  );
}
