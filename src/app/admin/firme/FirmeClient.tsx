"use client";

import { useState } from "react";

export interface FirmaRed {
  pib: string;
  naziv: string;
  adresa: string | null;
  grad: string | null;
  maticniBroj: string | null;
  email: string | null;
  brojNarudzbina: number;
}

/** Bez ovoga SEF odbija fakturu, pa se to mora videti pre nego što zatreba. */
export function staDostaje(f: FirmaRed): string[] {
  const fali: string[] = [];
  if (!f.maticniBroj) fali.push("matični broj");
  if (!f.grad) fali.push("grad");
  return fali;
}

export default function FirmeClient({ firme }: { firme: FirmaRed[] }) {
  const [redovi, setRedovi] = useState<FirmaRed[]>(firme);
  const [izmena, setIzmena] = useState<string | null>(null);
  const [nacrt, setNacrt] = useState<FirmaRed | null>(null);
  const [cuvanje, setCuvanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const nepotpune = redovi.filter((f) => staDostaje(f).length > 0).length;

  function pocniIzmenu(f: FirmaRed) {
    setIzmena(f.pib);
    setNacrt({ ...f });
    setGreska(null);
  }

  async function sacuvaj() {
    if (!nacrt) return;
    setCuvanje(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(nacrt.pib)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naziv: nacrt.naziv,
          adresa: nacrt.adresa,
          grad: nacrt.grad,
          maticniBroj: nacrt.maticniBroj,
          email: nacrt.email,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGreska(json.error ?? "Čuvanje nije uspelo.");
        return;
      }
      setRedovi((prev) => prev.map((f) => (f.pib === nacrt.pib ? { ...nacrt } : f)));
      setIzmena(null);
      setNacrt(null);
    } catch {
      setGreska("Greška na serveru.");
    } finally {
      setCuvanje(false);
    }
  }

  const polje = (
    oznaka: string,
    kljuc: "naziv" | "adresa" | "grad" | "maticniBroj" | "email",
    mesto: string,
    obavezno = false,
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {oznaka}
        {obavezno && <span className="text-koral"> · SEF ga traži</span>}
      </label>
      <input
        type="text"
        value={nacrt?.[kljuc] ?? ""}
        onChange={(e) => setNacrt((n) => (n ? { ...n, [kljuc]: e.target.value } : n))}
        placeholder={mesto}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
      />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firme</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pamte se pri prvoj kupovini. Ovde se podaci ispravljaju i dopunjuju.
          </p>
        </div>
        {nepotpune > 0 && (
          <span className="text-sm text-koral font-medium">
            {nepotpune === 1 ? "1 firma nije potpuna" : `${nepotpune} firmi nije potpuno`} — faktura im
            ne može na SEF
          </span>
        )}
      </div>

      {greska && (
        <div className="mb-4 rounded-lg bg-koral/10 border border-koral/30 px-4 py-3">
          <p className="text-sm text-koral font-medium">{greska}</p>
        </div>
      )}

      {redovi.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            Još nijedna firma. Prva se upiše sama kad napraviš narudžbinu sa čekiranim
            {" "}&bdquo;Kupac je firma&ldquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {redovi.map((f) => {
            const fali = staDostaje(f);
            const seMenja = izmena === f.pib;
            return (
              <div
                key={f.pib}
                className={`rounded-xl border bg-white p-5 ${
                  fali.length ? "border-koral/40" : "border-gray-200"
                }`}
              >
                {seMenja ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-semibold text-gray-900">PIB {f.pib}</span>
                      <span className="text-xs text-gray-400">PIB se ne menja</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {polje("Naziv firme", "naziv", "PROBA DOO BEOGRAD")}
                      {polje("Matični broj", "maticniBroj", "21268372", true)}
                      {polje("Ulica i broj", "adresa", "Neka ulica 1")}
                      {polje("Grad", "grad", "Beograd", true)}
                      <div className="sm:col-span-2">
                        {polje("Mejl računovodstva", "email", "racunovodstvo@firma.rs")}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={sacuvaj}
                        disabled={cuvanje}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-plava text-white hover:bg-plava-dark transition-colors disabled:opacity-50"
                      >
                        {cuvanje ? "Čuvanje..." : "Sačuvaj"}
                      </button>
                      <button
                        onClick={() => {
                          setIzmena(null);
                          setNacrt(null);
                          setGreska(null);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Odustani
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{f.naziv}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        PIB {f.pib}
                        {f.maticniBroj && ` · matični ${f.maticniBroj}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {[f.adresa, f.grad].filter(Boolean).join(", ") || (
                          <span className="text-gray-400">bez adrese</span>
                        )}
                      </p>
                      {f.email && <p className="text-sm text-gray-500">{f.email}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {f.brojNarudzbina === 0
                          ? "bez narudžbina"
                          : f.brojNarudzbina === 1
                          ? "1 narudžbina"
                          : `${f.brojNarudzbina} narudžbina`}
                      </p>
                      {fali.length > 0 && (
                        <p className="text-sm text-koral font-medium mt-2">
                          Fali: {fali.join(" i ")} — bez toga faktura ne može na SEF
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => pocniIzmenu(f)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium hover:bg-plava hover:text-white transition-colors whitespace-nowrap"
                    >
                      Izmeni
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
