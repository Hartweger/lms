"use client";

// Mesečne fakture koje čekaju slanje.
//
// Cron ih prvog u mesecu SAMO PRIPREMI. Broj se dodeljuje tek na „Pošalji" - da
// pripremljena a neposlata faktura ne potroši broj i ne ostavi rupu u seriji.

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MesecnaRed {
  id: string;
  firma: string;
  opis: string;
  iznos: number;
  period: string;
  broj: string | null;
  poslata: boolean;
  sefId: string | null;
  sefStatus: string | null;
  mejl: string | null;
}

const MESECI = ["januar","februar","mart","april","maj","jun","jul","avgust","septembar","oktobar","novembar","decembar"];

function mesec(period: string): string {
  const [g, m] = period.split("-");
  return `${MESECI[Number(m) - 1]} ${g}.`;
}

export default function MesecneFakture({ redovi }: { redovi: MesecnaRed[] }) {
  const router = useRouter();
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  if (redovi.length === 0) return null;

  async function posalji(id: string, akcija: "posalji" | "sef") {
    setRadi(`${id}-${akcija}`);
    setGreska(null);
    try {
      const res = await fetch(`/api/admin/mesecne-fakture/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcija }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGreska(json.error ?? "Nije uspelo.");
        return;
      }
      router.refresh();
    } catch {
      setGreska("Greška na serveru.");
    } finally {
      setRadi(null);
    }
  }

  return (
    <section className="rounded-xl border border-plava/30 bg-white p-5 mb-6">
      <h2 className="font-semibold text-gray-900">Mesečne fakture</h2>
      <p className="text-xs text-gray-500 mt-1 mb-4">
        Pripremaju se same prvog u mesecu. Broj se dodeljuje tek kad pošalješ.
      </p>

      {greska && <p className="text-sm text-koral font-medium mb-3">{greska}</p>}

      <div className="space-y-2">
        {redovi.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-medium text-gray-900">{r.firma}</p>
              <p className="text-xs text-gray-500">
                {r.opis} · {mesec(r.period)}
                {r.broj && ` · faktura ${r.broj}`}
                {r.mejl && ` · ${r.mejl}`}
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {r.iznos.toLocaleString("sr-RS")} RSD
            </span>

            <a
              href={`/api/admin/mesecne-fakture/${r.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-plava hover:underline whitespace-nowrap"
            >
              Pogledaj PDF
            </a>

            {r.poslata ? (
              <span className="text-xs text-green-600 whitespace-nowrap">✓ poslata</span>
            ) : (
              <button
                onClick={() => posalji(r.id, "posalji")}
                disabled={radi === `${r.id}-posalji`}
                className="text-xs px-3 py-1.5 rounded-lg bg-plava text-white font-medium hover:bg-plava-dark transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {radi === `${r.id}-posalji` ? "..." : "Pošalji fakturu"}
              </button>
            )}

            {r.poslata &&
              (r.sefId ? (
                <span className="text-xs text-gray-500 whitespace-nowrap" title={`SEF id: ${r.sefId}`}>
                  SEF: {r.sefStatus ?? "poslata"}
                </span>
              ) : (
                <button
                  onClick={() => posalji(r.id, "sef")}
                  disabled={radi === `${r.id}-sef`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {radi === `${r.id}-sef` ? "..." : "Pošalji na SEF"}
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
