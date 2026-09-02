"use client";

// Stavke sa bankovnog izvoda koje čekaju odluku.
//
// Sistem predlaže, Nataša potvrđuje. Ništa odavde ne ulazi ni u narudžbine ni u
// troškove dok se ne klikne.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/finansije";

export interface IzvodRed {
  id: string;
  smer: "priliv" | "odliv";
  iznos: number;
  datum: string | null;
  naziv: string | null;
  svrha: string | null;
  izvodBroj: number | null;
  vrsta: "uplata" | "trosak" | "nista";
  razlog: string;
  orderId: string | null;
  orderNumber: string | null;
  kategorija: string | null;
  neslaganje: { ocekivano: number; stiglo: number } | null;
}

function dan(d: string | null): string {
  if (!d) return "—";
  const [, m, x] = d.split("-");
  return `${x}.${m}.`;
}

const din = (n: number) => `${Math.round(n).toLocaleString("sr-RS")} RSD`;

export default function IzvodStavke({ redovi }: { redovi: IzvodRed[] }) {
  const router = useRouter();
  const [izbor, setIzbor] = useState<Record<string, string>>(
    Object.fromEntries(redovi.map((r) => [r.id, r.kategorija ?? ""])),
  );
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  if (redovi.length === 0) return null;

  const prilivi = redovi.filter((r) => r.smer === "priliv");
  const odlivi = redovi.filter((r) => r.smer === "odliv");
  const zbirOdliva = odlivi.reduce((a, r) => a + r.iznos, 0);

  async function posalji(id: string, telo: Record<string, unknown>) {
    setRadi(id);
    setGreska(null);
    try {
      const res = await fetch(`/api/admin/izvod/${id}`, {
        method: "POST",
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
    <section className="rounded-xl border border-plava/30 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="font-semibold">Sa bankovnog izvoda</h2>
        <span className="text-sm text-gray-500">
          {prilivi.length > 0 && `${prilivi.length} priliv${prilivi.length === 1 ? "" : "a"} · `}
          {odlivi.length} trošk{odlivi.length === 1 ? "" : "ova"} · {din(zbirOdliva)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Ništa ne ulazi u izveštaje dok ne potvrdiš.
      </p>

      {greska && <p className="text-sm text-koral font-medium mb-3">{greska}</p>}

      <div className="space-y-2">
        {redovi.map((r) => (
          <div
            key={r.id}
            className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${
              r.vrsta === "uplata" ? "border-plava/40 bg-plava-light/20" : "border-gray-100"
            }`}
          >
            <div className="min-w-[240px] flex-1">
              <p className="text-sm font-medium text-gray-900">
                {r.naziv ?? "Nepoznato"}
                {r.izvodBroj && (
                  <span className="text-xs font-normal text-gray-400"> · izvod {r.izvodBroj}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {dan(r.datum)} · {(r.svrha ?? "").slice(0, 70)}
              </p>
              <p className={`text-xs mt-0.5 ${r.neslaganje ? "text-koral font-medium" : "text-gray-400"}`}>
                {r.razlog}
              </p>
            </div>

            <span
              className={`text-sm font-semibold whitespace-nowrap ${
                r.smer === "priliv" ? "text-green-700" : "text-gray-900"
              }`}
            >
              {r.smer === "priliv" ? "+" : "−"}
              {din(r.iznos)}
            </span>

            {r.vrsta === "uplata" && r.orderId ? (
              <button
                onClick={() => posalji(r.id, { akcija: "uplata", orderId: r.orderId })}
                disabled={radi === r.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-plava text-white font-medium hover:bg-plava-dark transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {radi === r.id ? "..." : `Potvrdi ${r.orderNumber}`}
              </button>
            ) : r.vrsta === "trosak" ? (
              <>
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
                  onClick={() => posalji(r.id, { akcija: "trosak", kategorija: izbor[r.id] })}
                  disabled={radi === r.id || !izbor[r.id]}
                  className="text-xs px-3 py-1.5 rounded-lg bg-plava text-white font-medium hover:bg-plava-dark transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {radi === r.id ? "..." : "U troškove"}
                </button>
              </>
            ) : null}

            <button
              onClick={() => posalji(r.id, { akcija: "zanemari" })}
              disabled={radi === r.id}
              title="Skloni sa spiska bez upisa"
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
