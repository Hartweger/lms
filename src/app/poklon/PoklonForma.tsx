"use client";

// Obrazac za poklon: ime deteta, razred, mejl roditelja i pristanak - isti
// obrazac kao na kupovnoj strani, samo bez ijednog polja o plaćanju, jer
// plaćanja nema.
//
// Provera je ISTA: poruke uz polja su ovde zbog lepšeg ispravljanja, ali
// poslednja reč pre slanja je proveriGostUnos - ista funkcija koju server
// ponavlja u /api/zack/poklon. Tako se klijent i server ne mogu razići.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRESKA, IVICA, MASTILO, PLAVA, PRIGUSEN, ZELENA } from "../zack/Ukras";
import { GOST_IME_NAJVISE, proveriGostUnos } from "@/lib/zack/gost";
import { PRISTANAK_TEKST } from "@/lib/zack/pristanak";
import { isDeliverableEmail, domainTypoHint } from "@/lib/email-valid";

const POLJE =
  "mt-1.5 w-full rounded-xl border-2 px-3.5 py-2.5 text-[16px] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";
const POLJE_STIL = { background: "#FFFFFF", borderColor: IVICA, color: MASTILO };
const OZNAKA = "block text-[15px] font-bold";

/** Pasusi pristanka: prvi je jedna rečenica i uvek vidljiv, ostatak se sklapa. */
const PASUSI = PRISTANAK_TEKST.split("\n\n");

type Greske = { ime?: string; udzbenik?: string; email?: string; pristanak?: string };

function GreskaUzPolje({ id, tekst }: { id: string; tekst?: string }) {
  return (
    <p id={id} aria-live="polite" className="min-h-[18px] pt-1 text-[13px]" style={{ color: GRESKA }}>
      {tekst}
    </p>
  );
}

export default function PoklonForma({
  udzbenici,
}: {
  udzbenici: { id: string; razred: number }[];
}) {
  const router = useRouter();
  const [ime, setIme] = useState("");
  const [udzbenikId, setUdzbenikId] = useState("");
  const [email, setEmail] = useState("");
  const [pristanak, setPristanak] = useState(false);
  const [ceoPristanak, setCeoPristanak] = useState(false);
  const [greske, setGreske] = useState<Greske>({});
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const proveri = (): Greske => {
    const g: Greske = {};
    const cistMejl = email.trim().toLowerCase();
    if (!ime.trim()) g.ime = "Upiši ime deteta.";
    else if (ime.trim().length > GOST_IME_NAJVISE) g.ime = "Ime je predugačko.";
    if (!udzbenikId) g.udzbenik = "Izaberi razred.";
    if (!cistMejl || !isDeliverableEmail(cistMejl)) {
      const predlog = cistMejl ? domainTypoHint(cistMejl) : null;
      g.email = predlog
        ? `Proveri mejl adresu - da nije ${cistMejl.split("@")[0]}@${predlog}?`
        : "Upiši ispravnu mejl adresu - na nju stiže kod deteta.";
    }
    if (!pristanak) g.pristanak = "Potvrdi pristanak - bez njega ne smemo da napravimo profil deteta.";
    return g;
  };

  const uzmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    const g = proveri();
    setGreske(g);
    if (Object.keys(g).length > 0) {
      setPoruka("Proveri označena polja pa pokušaj ponovo.");
      return;
    }
    // Ista provera koju radi i server - ako ovde ne prođe, nema šta da se šalje.
    const provera = proveriGostUnos({ ime, udzbenikId, email, pristanak });
    if (!provera.ok) {
      setPoruka(provera.poruka);
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/zack/poklon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deteIme: provera.ime,
          udzbenikId: provera.udzbenikId,
          email: provera.email,
          pristanak: true,
        }),
      });
      const podaci: { orderId?: string; error?: string } = await odgovor.json();
      if (odgovor.ok && podaci.orderId) {
        // Dalje preuzima ista strana kao posle kupovine: kod deteta i PIN.
        router.push(`/kupovina/hvala/${podaci.orderId}`);
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
      onSubmit={uzmi}
      noValidate
      className="mt-5 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]"
      style={{ borderColor: IVICA }}
    >
      <h2 className="text-[18px] font-bold" style={{ color: MASTILO }}>
        Za koga je poklon
      </h2>

      <div className="mt-3">
        <label htmlFor="poklon-ime" className={OZNAKA} style={{ color: MASTILO }}>
          Ime deteta
        </label>
        <input
          id="poklon-ime"
          type="text"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          autoComplete="off"
          maxLength={GOST_IME_NAJVISE}
          aria-invalid={!!greske.ime}
          aria-describedby="poklon-ime-greska poklon-ime-pomoc"
          className={POLJE}
          style={POLJE_STIL}
        />
        <GreskaUzPolje id="poklon-ime-greska" tekst={greske.ime} />
        <p id="poklon-ime-pomoc" className="text-[13px]" style={{ color: PRIGUSEN }}>
          Samo ime - prezime deteta se kod nas nigde ne čuva.
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="poklon-udzbenik" className={OZNAKA} style={{ color: MASTILO }}>
          Razred
        </label>
        <select
          id="poklon-udzbenik"
          value={udzbenikId}
          onChange={(e) => setUdzbenikId(e.target.value)}
          aria-invalid={!!greske.udzbenik}
          aria-describedby="poklon-udzbenik-greska"
          className={POLJE}
          style={POLJE_STIL}
        >
          <option value="">Izaberi razred</option>
          {udzbenici.map((u) => (
            <option key={u.id} value={u.id}>
              {u.razred}. razred
            </option>
          ))}
        </select>
        <GreskaUzPolje id="poklon-udzbenik-greska" tekst={greske.udzbenik} />
      </div>

      <div className="mt-3">
        <label htmlFor="poklon-email" className={OZNAKA} style={{ color: MASTILO }}>
          Tvoj mejl
        </label>
        <input
          id="poklon-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={!!greske.email}
          aria-describedby="poklon-email-greska poklon-email-pomoc"
          className={POLJE}
          style={POLJE_STIL}
        />
        <GreskaUzPolje id="poklon-email-greska" tekst={greske.email} />
        <p id="poklon-email-pomoc" className="text-[13px]" style={{ color: PRIGUSEN }}>
          Na njega stiže kod za prijavu deteta - i njime posle ulaziš u roditeljski panel.
        </p>
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
            aria-describedby="poklon-pristanak-greska"
            className="mt-1 h-4 w-4 flex-none"
          />
          <span>
            Pročitao/la sam pristanak i <strong>dajem ga</strong> - jesam roditelj ili staratelj
            deteta za koje uzimam poklon.
          </span>
        </label>
        <GreskaUzPolje id="poklon-pristanak-greska" tekst={greske.pristanak} />
      </div>

      <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: GRESKA }}>
        {poruka}
      </p>

      <button
        type="submit"
        disabled={saljeSe}
        className="mt-1 block w-full rounded-xl px-4 py-3.5 text-[16px] font-bold text-white shadow-[0_3px_0_0_#083E93] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Samo trenutak..." : "Otključaj zack! za dete"}
      </button>
      <p className="mt-2.5 text-center text-[13px]" style={{ color: PRIGUSEN }}>
        Nema sledećeg koraka sa plaćanjem - odmah dobijaš kod za prijavu deteta i postavljaš PIN.{" "}
        <strong style={{ color: ZELENA }}>Nalog nastane sam.</strong>
      </p>
    </form>
  );
}
