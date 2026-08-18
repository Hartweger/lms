"use client";

// Panel prijavljenog roditelja sa pristankom: spisak dece sa kodovima,
// promena PIN-a i dodavanje deteta. Sva pravila (slab PIN, jedinstven kod,
// čija su deca) živi na serveru - ovde se proverava samo oblik unosa, da
// roditelj ne čeka mrežu zbog očigledne omaške.
//
// Izgled: kartica deteta je mala korica albuma - ime na žutoj nalepnici (ista
// nalepnica koju dete vidi na svojoj stazi), a kod kao registarska tablica,
// ista slika koju dete vidi na prijavi. Roditelj tako zna šta detetu prepisuje.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recDan } from "@/lib/zack/izvestaj";
import {
  DISPLAY,
  GRESKA,
  IVICA,
  MASTILO,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  TablicaOkvir,
  ZELENA,
  ZUTA,
  ZackZnak,
} from "../Ukras";

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

// Dugmad kao na dečjoj strani, samo mirnija: puna plava sa tamnom stopom,
// bela sa papirnom stopom. Na pritisak „legnu".
const DUGME_PUNO =
  "font-heading rounded-xl text-white shadow-[0_3px_0_0_#083E93] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:translate-y-[2px] motion-safe:active:shadow-[0_1px_0_0_#083E93]";
const DUGME_BELO =
  "font-heading rounded-xl border-2 bg-white shadow-[0_2px_0_0_#DED8C8] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:translate-y-[1px] motion-safe:active:shadow-none";

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
          Tajni broj (PIN, 4 cifre)
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
          Ponovi tajni broj
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

/** Šta ruta napretka vraća za jedno dete. */
type Napredak = {
  reci: { naucene: number; ukupno: number };
  gradivo: string;
  lekcije: { broj: number; naziv: string; naucene: number; ukupno: number }[];
  vezbaZaredom: number | null;
  rekord: string | null;
  aktivnost: string;
};

/** „vežbalo pre 2 dana" stiže kao sredina rečenice; na početku reda treba veliko slovo. */
function velikoPrvoSlovo(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/**
 * Napredak jednog deteta, sklopljen ispod kartice na klik. Roditelju se ne
 * priča o sličicama ni spratovima nego o rečima i vežbanju - i samo o onome
 * što je dete URADILO. Nema procenata tačnosti ni poređenja; kad dete nije
 * vežbalo, rečenica je mirna i bez uzvičnika.
 */
function NapredakDeteta({ deteId }: { deteId: string }) {
  const [otvoren, setOtvoren] = useState(false);
  const [napredak, setNapredak] = useState<Napredak | null>(null);
  const [ucitava, setUcitava] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);

  const otvori = async () => {
    if (otvoren) {
      setOtvoren(false);
      return;
    }
    setOtvoren(true);
    if (napredak || ucitava) return;
    setUcitava(true);
    setPoruka(null);
    try {
      const odgovor = await fetch(`/api/zack/roditelj/deca/${deteId}/napredak`);
      if (odgovor.ok) {
        const podaci: Napredak = await odgovor.json();
        setNapredak(podaci);
      } else {
        setPoruka("Nešto je zapelo. Probaj ponovo za koji trenutak.");
      }
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setUcitava(false);
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={otvori}
        aria-expanded={otvoren}
        className={`${DUGME_BELO} px-4 py-2.5 text-[15px] font-bold`}
        style={{ borderColor: IVICA, color: MASTILO }}
      >
        {otvoren ? "Sakrij napredak" : "Napredak"}
      </button>

      {otvoren && (
        <div className="mt-3 rounded-xl border p-3" style={{ borderColor: IVICA, background: "#FFFFFF" }}>
          {ucitava && (
            <p className="text-[14px]" style={{ color: PRIGUSEN }}>
              Učitava se...
            </p>
          )}
          {poruka && (
            <p className="text-[14px]" style={{ color: GRESKA }}>
              {poruka}
            </p>
          )}
          {napredak && (
            <>
              <p className="text-[22px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                Zna {napredak.reci.naucene} od {napredak.reci.ukupno}
              </p>
              <p className="text-[14px]" style={{ color: PRIGUSEN }}>
                {napredak.gradivo}
              </p>

              <p className="mt-2 text-[14px]" style={{ color: PRIGUSEN }}>
                {velikoPrvoSlovo(napredak.aktivnost)}.
                {napredak.vezbaZaredom !== null && (
                  <> Vežba {napredak.vezbaZaredom} {recDan(napredak.vezbaZaredom)} zaredom.</>
                )}
                {napredak.rekord !== null && (
                  <> U igri pogađanja roda (der/die/das) popelo se {napredak.rekord}.</>
                )}
              </p>

              {napredak.lekcije.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {napredak.lekcije.map((lekcija) => (
                    <li
                      key={lekcija.broj}
                      className="flex items-baseline justify-between gap-3 text-[14px]"
                    >
                      <span className="min-w-0 truncate" style={{ color: MASTILO }}>
                        {lekcija.naziv}
                      </span>
                      <span className="flex-none tabular-nums" style={{ color: PRIGUSEN }}>
                        zna {lekcija.naucene} od {lekcija.ukupno}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
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
      className="rounded-2xl border p-4 shadow-[0_3px_0_0_#DED8C8]"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Ime na žutoj nalepnici - ista nalepnica koju dete vidi na stazi. */}
        <span
          className="inline-block -rotate-1 rounded-lg border-[3px] border-white px-2.5 py-0.5 text-[17px] shadow-[0_2px_6px_rgba(22,22,26,0.15)]"
          style={{ background: ZUTA, color: MASTILO, fontFamily: DISPLAY }}
        >
          {dete.ime}
        </span>
        <span className="text-[13px]" style={{ color: PRIGUSEN }}>
          {dete.udzbenik}
        </span>
      </div>

      <p className="mt-3 text-[13px]" style={{ color: PRIGUSEN }}>
        Kod za prijavu
      </p>
      {/* Tablica: ono što dete kuca na svojoj prijavi izgleda baš ovako. */}
      {dete.kod ? (
        <TablicaOkvir className="mt-1.5 max-w-[240px]">
          <span
            className="flex-1 px-3 py-2 text-center text-[22px] uppercase tracking-[0.1em]"
            style={{ color: MASTILO, fontFamily: DISPLAY }}
          >
            {dete.kod}
          </span>
        </TablicaOkvir>
      ) : (
        <p className="text-[22px]" style={{ color: PRIGUSEN, fontFamily: DISPLAY }}>
          bez koda
        </p>
      )}
      <p className="mt-2 text-[13px]" style={{ color: PRIGUSEN }}>
        Detetu za prijavu trebaju dve stvari: ovaj kod i tajni broj (PIN) koji
        ti postaviš. Kod je kao korisničko ime, samo što se ne bira nego ga
        dete dobije, a tajni broj je kao šifra.
      </p>

      <NapredakDeteta deteId={dete.id} />

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
          <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: GRESKA }}>
            {poruka}
          </p>
          <div className="mt-1 flex gap-3">
            <button
              type="submit"
              disabled={saljeSe}
              className={`${DUGME_PUNO} px-4 py-2.5 text-[15px] font-bold`}
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
              className={`${DUGME_BELO} px-4 py-2.5 text-[15px] font-bold`}
              style={{ borderColor: IVICA, color: MASTILO }}
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
          className={`${DUGME_BELO} mt-3 px-4 py-2.5 text-[15px] font-bold`}
          style={{ borderColor: IVICA, color: MASTILO }}
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
          `Profil za ${podaci.dete.ime} je napravljen. Detetu prepiši kod ${podaci.dete.kod} i tajni broj (PIN).`
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
      className="mt-4 rounded-2xl border p-4 shadow-[0_3px_0_0_#DED8C8]"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <h2 className="text-[18px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
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

      <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: GRESKA }}>
        {poruka}
      </p>
      <p aria-live="polite" className="text-[15px] font-bold" style={{ color: ZELENA }}>
        {uspeh}
      </p>

      <button
        type="submit"
        disabled={saljeSe}
        className={`${DUGME_PUNO} mt-2 w-full px-4 py-3 text-[16px] font-bold`}
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Pravi se..." : "Napravi profil"}
      </button>
    </form>
  );
}

/**
 * Prekidač dvonedeljnog izveštaja. Dugme sa aria-pressed, ne ukras: isti
 * prekidač i gasi i vraća izveštaje - i onda kad su se sami ugasili posle
 * mesec dana tišine.
 */
function IzvestajPrekidac({ ukljucen: pocetno }: { ukljucen: boolean }) {
  const [ukljucen, setUkljucen] = useState(pocetno);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const promeni = async () => {
    if (saljeSe) return;
    const novo = !ukljucen;
    setSaljeSe(true);
    setPoruka(null);
    try {
      const odgovor = await fetch("/api/zack/roditelj/izvestaj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ukljucen: novo }),
      });
      if (odgovor.ok) {
        setUkljucen(novo);
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
    <div
      className="mt-4 rounded-2xl border p-4 shadow-[0_3px_0_0_#DED8C8]"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p id="izvestaj-naslov" className="text-[16px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
            Izveštaj na dve nedelje
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: PRIGUSEN }}>
            Kratak mejl o napretku dece, na svake dve nedelje.
          </p>
        </div>
        <button
          type="button"
          onClick={promeni}
          disabled={saljeSe}
          aria-pressed={ukljucen}
          aria-labelledby="izvestaj-naslov"
          className="relative h-8 w-14 flex-none rounded-full border-2 outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
          style={{
            background: ukljucen ? ZELENA : "#FFFFFF",
            borderColor: ukljucen ? ZELENA : IVICA,
          }}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 h-6 w-6 rounded-full transition-[left] motion-reduce:transition-none ${
              ukljucen ? "left-[26px]" : "left-0.5"
            }`}
            style={{
              background: ukljucen ? "#FFFFFF" : PRIGUSEN,
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>
      <p aria-live="polite" className="text-[14px]" style={{ color: GRESKA }}>
        {poruka}
      </p>
    </div>
  );
}

export default function RoditeljPanel(props: {
  email: string;
  deca: DeteStavka[];
  udzbenici: UdzbenikStavka[];
  izvestajUkljucen: boolean;
}) {
  const router = useRouter();

  const odjava = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md">
      <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <ZackZnak velicina="md" />
        <span className="text-[24px] tracking-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
          za roditelje
        </span>
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
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

      <IzvestajPrekidac ukljucen={props.izvestajUkljucen} />

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
