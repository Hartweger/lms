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
  brojDokumenta: string | null;
  dobavljac: string | null;
  pib: string | null;
  iznos: number | null;
  datum: string | null;
  rokPlacanja: string | null;
  predlog: string | null;
}

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

  if (redovi.length === 0) return null;

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
        <span className="text-sm text-gray-500">
          {redovi.length === 1 ? "1 čeka odluku" : `${redovi.length} čeka odluku`}
        </span>
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
              <p className="text-xs text-gray-500">
                {r.brojDokumenta ?? "bez broja"} · {dan(r.datum)}
                {r.pib && ` · PIB ${r.pib}`}
                {r.rokPlacanja && ` · rok ${dan(r.rokPlacanja)}`}
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {r.iznos != null ? `${Math.round(r.iznos).toLocaleString("sr-RS")} RSD` : "—"}
            </span>

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
