"use client";

// Druga i treća stavka ankete. Oba polja su neobavezna: roditelj je ono glavno
// već odgovorio klikom iz mejla, pa ovde nema nijedne obavezne provere i nema
// nijedne crvene poruke koja bi ga zaustavila.
//
// Posle slanja obrazac NESTAJE i ostaje zahvalnica - da se ne pošalje dvaput i
// da se ne gleda u prazna polja.
import { useState } from "react";
import { IVICA, MASTILO, PRIGUSEN, CRVENA } from "../../Ukras";
import { NAJVISE_SLOVA_SMETA, OMILJENO } from "@/lib/zack/anketa";

const FOKUS = "outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

// imeDeteta se NE prima: svako pitanje sa imenom traži padež („Šta je Mili"),
// a padeži se u zack!-u ne pogađaju - pitanja su zato bezlična.
export default function AnketaForma({ token }: { token: string }) {
  const [omiljeno, setOmiljeno] = useState<string[]>([]);
  const [smeta, setSmeta] = useState("");
  const [salje, setSalje] = useState(false);
  const [poslato, setPoslato] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  function prebaci(kljuc: string) {
    setOmiljeno((p) => (p.includes(kljuc) ? p.filter((k) => k !== kljuc) : [...p, kljuc]));
  }

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setSalje(true);
    setGreska(null);
    try {
      const o = await fetch("/api/zack/anketa/upisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, omiljeno, smeta }),
      });
      if (!o.ok) {
        const t = await o.json().catch(() => ({}));
        throw new Error(t.error ?? "Nešto je zapelo.");
      }
      setPoslato(true);
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Nešto je zapelo. Probaj ponovo.");
      setSalje(false);
    }
  }

  if (poslato) {
    return (
      <div>
        <p className="text-[17px] font-bold" style={{ color: MASTILO }}>
          Stiglo je. Hvala!
        </p>
        <p className="mt-2 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
          Pročitaćemo svaki odgovor. Ništa više ne moraš da radiš.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={posalji} noValidate>
      <fieldset className="border-0 p-0">
        <legend className="text-[16px] font-bold" style={{ color: MASTILO }}>
          Šta se najviše dopalo?
        </legend>
        <p className="mt-1 text-[14px]" style={{ color: PRIGUSEN }}>
          Može više odgovora.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {OMILJENO.map((o) => (
            <label
              key={o.kljuc}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2 text-[16px] ${FOKUS}`}
              style={{
                borderColor: omiljeno.includes(o.kljuc) ? MASTILO : IVICA,
                color: MASTILO,
                background: "#FFFFFF",
              }}
            >
              <input
                type="checkbox"
                className="h-5 w-5 flex-none"
                checked={omiljeno.includes(o.kljuc)}
                onChange={() => prebaci(o.kljuc)}
              />
              {o.tekst}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="anketa-smeta" className="block text-[16px] font-bold" style={{ color: MASTILO }}>
          Šta bi trebalo popraviti?
        </label>
        <p className="mt-1 text-[14px]" style={{ color: PRIGUSEN }}>
          Slobodno i najsitniju stvar - to nam najviše pomaže.
        </p>
        <textarea
          id="anketa-smeta"
          rows={4}
          maxLength={NAJVISE_SLOVA_SMETA}
          value={smeta}
          onChange={(e) => setSmeta(e.target.value)}
          className={`mt-2 w-full rounded-xl border-2 px-3.5 py-2.5 text-[16px] ${FOKUS}`}
          style={{ background: "#FFFFFF", borderColor: IVICA, color: MASTILO }}
        />
      </div>

      <p aria-live="polite" className="min-h-[20px] pt-1.5 text-[14px]" style={{ color: "#B3261E" }}>
        {greska}
      </p>

      <button
        type="submit"
        disabled={salje}
        className={`mt-2 min-h-[48px] w-full rounded-xl border-4 border-white px-6 text-[17px] font-bold text-white shadow-[0_4px_0_0_#8F1B14] disabled:opacity-70 ${FOKUS}`}
        style={{ background: CRVENA }}
      >
        {salje ? "Šaljem…" : "Pošalji"}
      </button>
    </form>
  );
}
