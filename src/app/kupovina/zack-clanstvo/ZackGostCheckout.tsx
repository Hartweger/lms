"use client";

// Javni (gost) korak zack! checkouta: ime deteta, razred, mejl roditelja i
// pristanak - SVE NA JEDNOJ STRANI, pa preusmerenje na bankinu formu
// (postojeći tok /kupovina/kartica/[orderId]). Nalog i dete nastaju tek posle
// uspešne naplate; PIN se ovde namerno NE traži - postavlja se na hvala
// strani ili u panelu, da obrazac pred plaćanje ostane kratak.
//
// Iznos i pravila stoje IZNAD, na serverskoj strani - ovde se o ceni ništa ne
// odlučuje: /api/orders je računa sam iz plana, klijentu se ne veruje. Ista
// nepoverljivost važi i za ovaj obrazac: server ponavlja svaku proveru
// (proveriGostUnos), uključujući i štikliran pristanak.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRESKA, IVICA, MASTILO, PLAVA, PRIGUSEN, ZELENA } from "../../zack/Ukras";
import { GOST_IME_NAJVISE } from "@/lib/zack/gost";
import { PRISTANAK_TEKST } from "@/lib/zack/pristanak";
import { isDeliverableEmail, domainTypoHint } from "@/lib/email-valid";

const POLJE =
  "mt-1.5 w-full rounded-xl border-2 px-3.5 py-2.5 text-[16px] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";
const POLJE_STIL = { background: "#FFFFFF", borderColor: IVICA, color: MASTILO };
const OZNAKA = "block text-[15px] font-bold";

/** Pasusi pristanka: prvi je jedna rečenica i uvek je vidljiv, ostatak se sklapa. */
const PASUSI = PRISTANAK_TEKST.split("\n\n");

type Greske = {
  ime?: string;
  udzbenik?: string;
  email?: string;
  punoIme?: string;
  pristanak?: string;
  mesecno?: string;
};

function GreskaUzPolje({ id, tekst }: { id: string; tekst?: string }) {
  return (
    <p id={id} aria-live="polite" className="min-h-[18px] pt-1 text-[13px]" style={{ color: GRESKA }}>
      {tekst}
    </p>
  );
}

export default function ZackGostCheckout(props: {
  udzbenici: { id: string; naziv: string; izdavac: string; razred: number }[];
  /** Prijavljen korisnik: mejl je njegov i ne kuca se - porudžbina se ionako kači po mejlu. */
  fiksniEmail: string | null;
  pocetnoIme: string;
  iznosRsd: number;
}) {
  const router = useRouter();
  const [ime, setIme] = useState("");
  const [udzbenikId, setUdzbenikId] = useState("");
  const [email, setEmail] = useState("");
  const [punoIme, setPunoIme] = useState(props.pocetnoIme);
  const [pristanak, setPristanak] = useState(false);
  const [ceoPristanak, setCeoPristanak] = useState(false);
  const [mesecno, setMesecno] = useState(false);
  const [greske, setGreske] = useState<Greske>({});
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const iznos = props.iznosRsd.toLocaleString("de-DE");

  const proveri = (): { greske: Greske; email: string } => {
    const g: Greske = {};
    const cistMejl = (props.fiksniEmail ?? email).trim().toLowerCase();
    if (!ime.trim()) g.ime = "Upiši ime deteta.";
    else if (ime.trim().length > GOST_IME_NAJVISE) g.ime = "Ime je predugačko.";
    if (!udzbenikId) g.udzbenik = "Izaberi razred i udžbenik.";
    if (!cistMejl || !isDeliverableEmail(cistMejl)) {
      const predlog = cistMejl ? domainTypoHint(cistMejl) : null;
      g.email = predlog
        ? `Proveri mejl adresu - da nije ${cistMejl.split("@")[0]}@${predlog}?`
        : "Upiši ispravnu mejl adresu - na nju stižu kod deteta i računi.";
    }
    if (!punoIme.trim()) g.punoIme = "Upiši ime i prezime - banka ih traži uz karticu.";
    if (!pristanak) g.pristanak = "Potvrdi pristanak - bez njega ne smemo da napravimo profil deteta.";
    if (!mesecno) g.mesecno = "Potvrdi da razumeš mesečno plaćanje pre nastavka.";
    return { greske: g, email: cistMejl };
  };

  const plati = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    const { greske: g, email: cistMejl } = proveri();
    setGreske(g);
    if (Object.keys(g).length > 0) {
      setPoruka("Proveri označena polja pa pokušaj ponovo.");
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: punoIme.trim(),
          email: cistMejl,
          country: "Srbija",
          courseSlug: "zack-clanstvo",
          paymentMethod: "kartica_pretplata",
          deteIme: ime.trim(),
          udzbenikId,
          pristanak: true,
        }),
      });
      const podaci: { orderId?: string; error?: string } = await odgovor.json();
      if (odgovor.ok && podaci.orderId) {
        // Dalje preuzima postojeća kartična strana: auto-POST ka NestPay-u.
        router.push(`/kupovina/kartica/${podaci.orderId}`);
        return;
      }
      setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  return (
    <form
      onSubmit={plati}
      noValidate
      className="mt-5 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]"
      style={{ borderColor: IVICA }}
    >
      <h2 className="text-[18px] font-bold" style={{ color: MASTILO }}>
        Za koga uključuješ članstvo
      </h2>

      <div className="mt-3">
        <label htmlFor="zack-gost-ime" className={OZNAKA} style={{ color: MASTILO }}>
          Ime deteta
        </label>
        <input
          id="zack-gost-ime"
          type="text"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          autoComplete="off"
          maxLength={GOST_IME_NAJVISE}
          aria-invalid={!!greske.ime}
          aria-describedby="zack-gost-ime-greska zack-gost-ime-pomoc"
          className={POLJE}
          style={POLJE_STIL}
        />
        <GreskaUzPolje id="zack-gost-ime-greska" tekst={greske.ime} />
        <p id="zack-gost-ime-pomoc" className="text-[13px]" style={{ color: PRIGUSEN }}>
          Samo ime - prezime deteta se kod nas nigde ne čuva.
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="zack-gost-udzbenik" className={OZNAKA} style={{ color: MASTILO }}>
          Razred i udžbenik iz škole
        </label>
        <select
          id="zack-gost-udzbenik"
          value={udzbenikId}
          onChange={(e) => setUdzbenikId(e.target.value)}
          aria-invalid={!!greske.udzbenik}
          aria-describedby="zack-gost-udzbenik-greska"
          className={POLJE}
          style={POLJE_STIL}
        >
          <option value="">Izaberi razred i udžbenik</option>
          {props.udzbenici.map((u) => (
            <option key={u.id} value={u.id}>
              {u.razred}. razred - {u.naziv} ({u.izdavac})
            </option>
          ))}
        </select>
        <GreskaUzPolje id="zack-gost-udzbenik-greska" tekst={greske.udzbenik} />
      </div>

      {props.fiksniEmail ? (
        <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
          Kod deteta, potvrda i računi stižu na{" "}
          <strong style={{ color: MASTILO }}>{props.fiksniEmail}</strong> (mejl tvog naloga).
        </p>
      ) : (
        <div className="mt-3">
          <label htmlFor="zack-gost-email" className={OZNAKA} style={{ color: MASTILO }}>
            Tvoj mejl
          </label>
          <input
            id="zack-gost-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!greske.email}
            aria-describedby="zack-gost-email-greska zack-gost-email-pomoc"
            className={POLJE}
            style={POLJE_STIL}
          />
          <GreskaUzPolje id="zack-gost-email-greska" tekst={greske.email} />
          <p id="zack-gost-email-pomoc" className="text-[13px]" style={{ color: PRIGUSEN }}>
            Na njega stižu kod za prijavu deteta, potvrda i računi - i njime posle ulaziš u
            roditeljski panel.
          </p>
        </div>
      )}

      <div className="mt-3">
        <label htmlFor="zack-gost-puno-ime" className={OZNAKA} style={{ color: MASTILO }}>
          Tvoje ime i prezime
        </label>
        <input
          id="zack-gost-puno-ime"
          type="text"
          value={punoIme}
          onChange={(e) => setPunoIme(e.target.value)}
          autoComplete="name"
          maxLength={80}
          aria-invalid={!!greske.punoIme}
          aria-describedby="zack-gost-puno-ime-greska"
          className={POLJE}
          style={POLJE_STIL}
        />
        <GreskaUzPolje id="zack-gost-puno-ime-greska" tekst={greske.punoIme} />
      </div>

      {/* ── Pristanak: naslov + prva rečenica uvek vidljivi, ostatak sklopiv ── */}
      <div
        className="mt-4 rounded-xl border-2 p-4"
        style={{ borderColor: IVICA, background: "#FCFBF7" }}
      >
        <p className="text-[15px] font-bold" style={{ color: MASTILO }}>
          Pristanak roditelja
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: MASTILO }}>
          {PASUSI[0]}
        </p>
        {ceoPristanak &&
          PASUSI.slice(1).map((pasus) => (
            <p key={pasus.slice(0, 24)} className="mt-2 text-[14px] leading-relaxed" style={{ color: MASTILO }}>
              {pasus}
            </p>
          ))}
        <button
          type="button"
          aria-expanded={ceoPristanak}
          onClick={() => setCeoPristanak((o) => !o)}
          className="mt-2 rounded-lg text-[14px] font-bold underline underline-offset-2 outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ color: MASTILO }}
        >
          {ceoPristanak ? "Sakrij ceo tekst pristanka" : "Prikaži ceo tekst pristanka"}
        </button>

        <label
          className="mt-3 flex items-start gap-2.5 text-[14px] leading-relaxed"
          style={{ color: MASTILO }}
        >
          <input
            type="checkbox"
            checked={pristanak}
            onChange={(e) => setPristanak(e.target.checked)}
            aria-invalid={!!greske.pristanak}
            aria-describedby="zack-gost-pristanak-greska"
            className="mt-1 h-4 w-4 flex-none"
          />
          <span>
            Pročitao/la sam pristanak i <strong>dajem ga</strong> - jesam roditelj ili staratelj
            deteta za koje uključujem članstvo.
          </span>
        </label>
        <GreskaUzPolje id="zack-gost-pristanak-greska" tekst={greske.pristanak} />
      </div>

      <label
        className="mt-3 flex items-start gap-2.5 text-[14px] leading-relaxed"
        style={{ color: MASTILO }}
      >
        <input
          type="checkbox"
          checked={mesecno}
          onChange={(e) => setMesecno(e.target.checked)}
          aria-invalid={!!greske.mesecno}
          aria-describedby="zack-gost-mesecno-greska"
          className="mt-1 h-4 w-4 flex-none"
        />
        <span>
          Razumem da pokrećem mesečno plaćanje od {iznos} RSD koje se automatski obnavlja dok ga
          ne otkažem, i saglasan/na sam sa uslovima korišćenja.
        </span>
      </label>
      <GreskaUzPolje id="zack-gost-mesecno-greska" tekst={greske.mesecno} />

      <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: GRESKA }}>
        {poruka}
      </p>

      <button
        type="submit"
        disabled={saljeSe}
        className="mt-1 block w-full rounded-xl px-4 py-3.5 text-[16px] font-bold text-white shadow-[0_3px_0_0_#083E93] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Samo trenutak..." : `Plati ${iznos} din`}
      </button>
      <p className="mt-2.5 text-center text-[13px]" style={{ color: PRIGUSEN }}>
        Sledeći korak je zaštićena stranica Banca Intesa na kojoj unosiš karticu. Posle plaćanja
        dobijaš kod za prijavu deteta i postavljaš PIN - <strong style={{ color: ZELENA }}>nalog nastane sam</strong>.
      </p>
    </form>
  );
}
