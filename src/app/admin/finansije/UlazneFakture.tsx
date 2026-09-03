"use client";

// Ulazne fakture povučene sa SEF-a koje još čekaju odluku.
//
// Namerno stoje ODVOJENO od troškova i ne ulaze ni u jedan izveštaj dok Nataša ne
// izabere kategoriju. Sistem prikuplja, ona odlučuje.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/finansije";

export interface UlaznaRed {
  id: string;
  /** Status na SEF-u: New, Seen, Approved, Rejected... */
  sefStatus: string | null;
  brojDokumenta: string | null;
  dobavljac: string | null;
  pib: string | null;
  iznos: number | null;
  datum: string | null;
  rokPlacanja: string | null;
  predlog: string | null;
  /** Postoji li već sličan trošak; samo upozorenje, ne blokira. */
  upozorenje: string | null;
}

/** Statusi ulazne fakture na SEF-u, na našem jeziku. */
const SEF_LABEL: Record<string, string> = {
  New: "nova",
  Seen: "viđena",
  ReNotified: "ponovo javljena",
  Approved: "prihvaćena",
  Rejected: "odbijena",
  Cancelled: "otkazana",
  Storno: "stornirana",
};

function dan(d: string | null): string {
  if (!d) return "—";
  const [g, m, x] = d.split("-");
  return `${x}.${m}.${g}.`;
}

export default function UlazneFakture({ redovi }: { redovi: UlaznaRed[] }) {
  const router = useRouter();
  const [izbor, setIzbor] = useState<Record<string, string>>(
    Object.fromEntries(redovi.map((r) => [r.id, r.predlog ?? ""])),
  );
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  async function povuci() {
    setRadi("povlacenje");
    setGreska(null);
    try {
      const res = await fetch("/api/admin/ulazne-fakture/povuci", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setGreska(json.error ?? "Povlačenje nije uspelo.");
        return;
      }
      if (json.upisano === 0) {
        setGreska(`SEF nema ulaznih faktura u poslednjih ${json.dana} dana.`);
        return;
      }
      router.refresh();
    } catch {
      setGreska("Greška na serveru.");
    } finally {
      setRadi(null);
    }
  }

  async function posalji(id: string, telo: Record<string, unknown>) {
    setRadi(id);
    setGreska(null);
    try {
      const res = await fetch(`/api/admin/ulazne-fakture/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telo),
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
    <section className="bg-white rounded-xl border border-plava/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="font-semibold">Ulazne fakture sa SEF-a</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {redovi.length === 0
              ? "nijedna ne čeka"
              : redovi.length === 1
              ? "1 čeka odluku"
              : `${redovi.length} čeka odluku`}
          </span>
          <button
            onClick={povuci}
            disabled={radi === "povlacenje"}
            title="Isti posao koji cron radi u 5:30, samo odmah"
            className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {radi === "povlacenje" ? "Povlačim..." : "Povuci sa SEF-a"}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Ne ulaze u troškove dok ne izabereš kategoriju. Do tada ne utiču ni na jedan izveštaj.
      </p>

      {greska && <p className="text-sm text-koral font-medium mb-3">{greska}</p>}

      <div className="space-y-2">
        {redovi.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
          >
            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-medium text-gray-900">
                {r.dobavljac ?? "Nepoznat dobavljač"}
              </p>
              {r.upozorenje && (
                <p className="text-xs text-koral font-medium">{r.upozorenje}</p>
              )}
              <p className="text-xs text-gray-500">
                {r.brojDokumenta ?? "bez broja"} · {dan(r.datum)}
                {r.sefStatus && ` · ${SEF_LABEL[r.sefStatus] ?? r.sefStatus}`}
                {r.pib && ` · PIB ${r.pib}`}
                {r.rokPlacanja && ` · rok ${dan(r.rokPlacanja)}`}
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {r.iznos != null ? `${Math.round(r.iznos).toLocaleString("sr-RS")} RSD` : "—"}
            </span>

            <a
              href={`/api/admin/ulazne-fakture/${r.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-plava hover:underline whitespace-nowrap"
            >
              Pogledaj
            </a>

            {r.sefStatus === "Approved" ? (
              <span className="text-xs text-green-600 whitespace-nowrap">✓ prihvaćena</span>
            ) : r.sefStatus === "Rejected" ? (
              <span className="text-xs text-koral whitespace-nowrap">odbijena</span>
            ) : (
              <>
                <button
                  onClick={() => posalji(r.id, { odluka: "prihvati" })}
                  disabled={radi === r.id}
                  title="Zvanično prihvata fakturu na SEF-u"
                  className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {radi === r.id ? "..." : "Prihvati na SEF-u"}
                </button>
                <button
                  onClick={() => {
                    const razlog = window.prompt("Razlog odbijanja (dobavljač ga vidi):");
                    if (razlog?.trim()) posalji(r.id, { odluka: "odbij", napomena: razlog.trim() });
                  }}
                  disabled={radi === r.id}
                  className="text-xs text-gray-400 hover:text-koral hover:underline whitespace-nowrap"
                >
                  Odbij
                </button>
              </>
            )}

            <select
              value={izbor[r.id] ?? ""}
              onChange={(e) => setIzbor((p) => ({ ...p, [r.id]: e.target.value }))}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
            >
              <option value="">Kategorija...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c as ExpenseCategory]}
                </option>
              ))}
            </select>

            <button
              onClick={() => posalji(r.id, { kategorija: izbor[r.id] })}
              disabled={radi === r.id || !izbor[r.id]}
              className="text-xs px-3 py-1.5 rounded-lg bg-plava text-white font-medium hover:bg-plava-dark transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {radi === r.id ? "..." : "Dodaj u troškove"}
            </button>

            <button
              onClick={() => posalji(r.id, { zanemari: true })}
              disabled={radi === r.id}
              title="Skloni sa spiska bez upisa u troškove (storno, duplikat, tuđa faktura)"
              className="text-xs text-gray-400 hover:text-koral hover:underline transition-colors whitespace-nowrap"
            >
              Ne knjiži
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
