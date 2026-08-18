"use client";

// Panel prijavljenog roditelja sa pristankom: spisak dece sa kodovima,
// promena PIN-a i dodavanje deteta. Sva pravila (slab PIN, jedinstven kod,
// čija su deca) živi na serveru - ovde se proverava samo oblik unosa, da
// roditelj ne čeka mrežu zbog očigledne omaške.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const CRVENA = "#B3261E";
const ZELENA = "#1B6E3C";

// Ista provera kao pinJeIspravan iz lib/zack/pin.ts, koji se ovde ne sme
// uvesti jer vuče node:crypto.
const PIN_OBLIK = /^\d{4}$/;

export type DeteStavka = {
  id: string;
  ime: string;
  kod: string | null;
  udzbenik: string;
};

export type UdzbenikStavka = {
  id: string;
  naziv: string;
  izdavac: string;
  razred: number;
};

const OZNAKA = "font-heading block text-[15px] font-bold";
const POLJE =
  "mt-1.5 w-full rounded-xl border-2 px-3.5 py-2.5 text-[16px] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";
const POLJE_STIL = { background: "#FFFFFF", borderColor: IVICA, color: MASTILO };

/** Dva polja za PIN: novi i ponovljen. Oblik proverava ovde, snagu server. */
function proveriPinUnos(pin: string, ponovo: string): string | null {
  if (!PIN_OBLIK.test(pin)) return "PIN mora imati tačno četiri cifre.";
  if (pin !== ponovo) return "PIN i ponovljeni PIN se ne poklapaju.";
  return null;
}

function PinPolja(props: {
  idOsnova: string;
  pin: string;
  ponovo: string;
  naPin: (v: string) => void;
  naPonovo: (v: string) => void;
}) {
  const pinAtributi = {
    type: "password" as const,
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    maxLength: 4,
    autoComplete: "off",
    className: POLJE,
    style: POLJE_STIL,
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={`${props.idOsnova}-pin`} className={OZNAKA} style={{ color: MASTILO }}>
          PIN (4 cifre)
        </label>
        <input
          id={`${props.idOsnova}-pin`}
          value={props.pin}
          onChange={(e) => props.naPin(e.target.value)}
          {...pinAtributi}
        />
      </div>
      <div>
        <label htmlFor={`${props.idOsnova}-ponovo`} className={OZNAKA} style={{ color: MASTILO }}>
          Ponovi PIN
        </label>
        <input
          id={`${props.idOsnova}-ponovo`}
          value={props.ponovo}
          onChange={(e) => props.naPonovo(e.target.value)}
          {...pinAtributi}
        />
      </div>
    </div>
  );
}

/** Kartica jednog deteta: kod krupno (da se lako prepiše) i promena PIN-a. */
function DeteKartica({ dete }: { dete: DeteStavka }) {
  const [otvoreno, setOtvoreno] = useState(false);
  const [pin, setPin] = useState("");
  const [ponovo, setPonovo] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const sacuvaj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    const omaska = proveriPinUnos(pin, ponovo);
    if (omaska) {
      setPoruka(omaska);
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch(`/api/zack/roditelj/deca/${dete.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (odgovor.ok) {
        setUspeh("Novi PIN je sačuvan.");
        setOtvoreno(false);
        setPin("");
        setPonovo("");
      } else {
        const podaci: { error?: string } = await odgovor.json();
        setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
      }
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  return (
    <li
      className="rounded-2xl border p-4 shadow-[0_2px_0_0_#DED8C8]"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-heading text-[18px] font-bold" style={{ color: MASTILO }}>
          {dete.ime}
        </span>
        <span className="text-[13px]" style={{ color: PRIGUSEN }}>
          {dete.udzbenik}
        </span>
      </div>

      <p className="mt-2 text-[13px]" style={{ color: PRIGUSEN }}>
        Kod za prijavu
      </p>
      <p
        className="font-heading text-[30px] font-bold tracking-[0.12em]"
        style={{ color: PLAVA }}
      >
        {dete.kod ?? "bez koda"}
      </p>

      <div aria-live="polite">
        {uspeh && !otvoreno && (
          <p className="mt-2 text-[14px]" style={{ color: ZELENA }}>
            {uspeh}
          </p>
        )}
      </div>

      {otvoreno ? (
        <form onSubmit={sacuvaj} noValidate className="mt-3">
          <PinPolja
            idOsnova={`dete-${dete.id}`}
            pin={pin}
            ponovo={ponovo}
            naPin={setPin}
            naPonovo={setPonovo}
          />
          <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: CRVENA }}>
            {poruka}
          </p>
          <div className="mt-1 flex gap-3">
            <button
              type="submit"
              disabled={saljeSe}
              className="font-heading rounded-xl px-4 py-2.5 text-[15px] font-bold text-white outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
              style={{ background: PLAVA }}
            >
              {saljeSe ? "Čuva se..." : "Sačuvaj PIN"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtvoreno(false);
                setPoruka(null);
                setPin("");
                setPonovo("");
              }}
              className="font-heading rounded-xl border-2 px-4 py-2.5 text-[15px] font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
              style={{ borderColor: IVICA, color: MASTILO, background: "#FFFFFF" }}
            >
              Odustani
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOtvoreno(true);
            setUspeh(null);
          }}
          className="font-heading mt-3 rounded-xl border-2 px-4 py-2.5 text-[15px] font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ borderColor: IVICA, color: MASTILO, background: "#FFFFFF" }}
        >
          Novi PIN
        </button>
      )}
    </li>
  );
}

function DodajDete({ udzbenici }: { udzbenici: UdzbenikStavka[] }) {
  const router = useRouter();
  const [ime, setIme] = useState("");
  const [udzbenikId, setUdzbenikId] = useState("");
  const [pin, setPin] = useState("");
  const [ponovo, setPonovo] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const dodaj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    if (!ime.trim()) {
      setPoruka("Upiši ime deteta.");
      return;
    }
    if (!udzbenikId) {
      setPoruka("Izaberi udžbenik.");
      return;
    }
    const omaska = proveriPinUnos(pin, ponovo);
    if (omaska) {
      setPoruka(omaska);
      return;
    }
    setPoruka(null);
    setUspeh(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/zack/roditelj/deca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ime: ime.trim(), udzbenikId, pin }),
      });
      const podaci: { dete?: { ime: string; kod: string }; error?: string } =
        await odgovor.json();
      if (odgovor.ok && podaci.dete) {
        setUspeh(
          `Profil za ${podaci.dete.ime} je napravljen. Kod je ${podaci.dete.kod} - prepiši ga detetu zajedno sa PIN-om.`
        );
        setIme("");
        setUdzbenikId("");
        setPin("");
        setPonovo("");
        // Spisak iznad stiže sa servera, pa se osvežava cela stranica.
        router.refresh();
      } else {
        setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
      }
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  return (
    <form
      onSubmit={dodaj}
      noValidate
      className="mt-4 rounded-2xl border p-4 shadow-[0_2px_0_0_#DED8C8]"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <h2 className="font-heading text-[18px] font-bold" style={{ color: MASTILO }}>
        Dodaj dete
      </h2>

      <div className="mt-3">
        <label htmlFor="novo-ime" className={OZNAKA} style={{ color: MASTILO }}>
          Ime deteta
        </label>
        <input
          id="novo-ime"
          type="text"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          autoComplete="off"
          maxLength={40}
          className={POLJE}
          style={POLJE_STIL}
        />
      </div>

      <div className="mt-3">
        <label htmlFor="novo-udzbenik" className={OZNAKA} style={{ color: MASTILO }}>
          Udžbenik iz škole
        </label>
        <select
          id="novo-udzbenik"
          value={udzbenikId}
          onChange={(e) => setUdzbenikId(e.target.value)}
          className={POLJE}
          style={POLJE_STIL}
        >
          <option value="">Izaberi udžbenik</option>
          {udzbenici.map((u) => (
            <option key={u.id} value={u.id}>
              {u.naziv} ({u.izdavac}, {u.razred}. razred)
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <PinPolja
          idOsnova="novo"
          pin={pin}
          ponovo={ponovo}
          naPin={setPin}
          naPonovo={setPonovo}
        />
        <p className="mt-1.5 text-[13px]" style={{ color: PRIGUSEN }}>
          PIN biraš ti i kažeš ga detetu. Neka ne bude niz ni iste cifre.
        </p>
      </div>

      <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: CRVENA }}>
        {poruka}
      </p>
      <p aria-live="polite" className="text-[15px] font-bold" style={{ color: ZELENA }}>
        {uspeh}
      </p>

      <button
        type="submit"
        disabled={saljeSe}
        className="font-heading mt-2 w-full rounded-xl px-4 py-3 text-[16px] font-bold text-white outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Pravi se..." : "Napravi profil"}
      </button>
    </form>
  );
}

export default function RoditeljPanel(props: {
  email: string;
  deca: DeteStavka[];
  udzbenici: UdzbenikStavka[];
}) {
  const router = useRouter();

  const odjava = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md">
      <h1 className="font-heading text-3xl font-bold" style={{ color: MASTILO }}>
        zack! za roditelje
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: PRIGUSEN }}>
        Prijavljen si kao {props.email}.{" "}
        <button
          type="button"
          onClick={odjava}
          className="underline outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#0B54C9]"
          style={{ color: PRIGUSEN }}
        >
          Odjavi se
        </button>
      </p>

      {props.deca.length === 0 ? (
        <p className="mt-5 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
          Još nema nijednog profila. Dodaj dete ispod: dobićeš kod, a PIN biraš sam.
          Dete se sa to dvoje prijavljuje na stranici zack.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {props.deca.map((dete) => (
            <DeteKartica key={dete.id} dete={dete} />
          ))}
        </ul>
      )}

      <DodajDete udzbenici={props.udzbenici} />

      <p className="mt-5 text-center text-[13px]" style={{ color: PRIGUSEN }}>
        Dete se prijavljuje kodom i PIN-om na{" "}
        <Link
          href="/zack"
          className="underline outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#0B54C9]"
          style={{ color: PRIGUSEN }}
        >
          stranici za prijavu
        </Link>
        .
      </p>
    </main>
  );
}
