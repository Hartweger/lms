// Namenska stranica plaćanja zack! članstva - PO DETETU, mesečna pretplata.
//
// Zašto ne školski CheckoutForm: on nosi kupone, PayPal/uplatnicu, varijante i
// engleski - ništa od toga ovde ne važi, a poverenje je poenta ove strane:
// roditelj pre unosa kartice mora da vidi ŠTA plaća, KO stoji iza (puni podaci
// firme iz /uslovi) i da kartica ide kroz bankin sistem, ne naš. Statična ruta
// pobeđuje dinamičku /kupovina/[slug], pa školski checkout za ovaj slug nikad
// ne igra.
//
/* eslint-disable @next/next/no-img-element --
   sitni bankini logotipi (isti fajlovi kao u školskom Footer-u); next/image bi
   im dodao obradu koja ničemu ne služi, a EPM traži tačno ove znake. */
// Dva toka do istog plaćanja:
// - RODITELJ IZ PANELA stiže sa ?dete=... i kupuje za postojeće dete
//   (isti uslov sprovodi i /api/orders);
// - SVI OSTALI (i neprijavljeni!) dobijaju javnu kupovnu stranu: ime deteta,
//   razred, mejl i pristanak NA ISTOJ STRANI, pa pravo na bankinu formu.
//   Nalog, roditeljski red i dete nastaju tek POSLE uspešne naplate
//   (grant-access) - kupovina ne sme da traži otvaranje naloga unapred.
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nadjiRoditelja } from "@/lib/zack/roditelj";
import { jeUuid } from "@/lib/zack/upiti";
import { jeOtkljucano, ZACK_PROMO_RSD, ZACK_PUNA_RSD } from "@/lib/zack/clanstvo";
import { IVICA, MASTILO, PAPIR, PRIGUSEN, ZUTA, ZackZnak } from "../../zack/Ukras";
import ZackCheckout from "./ZackCheckout";
import ZackGostCheckout from "./ZackGostCheckout";

export const metadata: Metadata = {
  title: "zack! članstvo - plaćanje | Hartweger",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const rsd = (n: number) => n.toLocaleString("de-DE");

/** Okvir stranice: papir podloga i uska kolona, kao roditeljski deo zack!-a. */
function Okvir({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen" style={{ background: PAPIR }}>
      <div className="mx-auto max-w-xl px-4 py-10 md:py-14">{children}</div>
    </section>
  );
}

function PorukaSaLinkom({ naslov, tekst }: { naslov: string; tekst: string }) {
  return (
    <Okvir>
      <h1 className="font-montserrat text-2xl font-bold" style={{ color: MASTILO }}>
        {naslov}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
        {tekst}
      </p>
      <p className="mt-5">
        <Link href="/zack/roditelj" className="font-bold underline" style={{ color: MASTILO }}>
          Idi u roditeljski panel →
        </Link>
      </p>
    </Okvir>
  );
}

function NaslovStrane() {
  return (
    <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ZackZnak velicina="sm" />
      <span className="font-montserrat text-2xl font-bold md:text-3xl" style={{ color: MASTILO }}>
        Uključi članstvo
      </span>
    </h1>
  );
}

/**
 * Blok „šta se plaća". Sa imenom deteta (tok iz panela) nosi i žutu nalepnicu;
 * u javnom toku ime još ne postoji, pa rečenice govore „po detetu".
 */
function StaSePlaca({ imeDeteta }: { imeDeteta?: string }) {
  return (
    <div className="relative mt-8">
      {imeDeteta && (
        /* Ime deteta na žutoj nalepnici - ista koju roditelj vidi u panelu. */
        <span
          className="absolute -top-3.5 left-5 z-10 inline-block -rotate-1 rounded-lg border-[3px] border-white px-2.5 py-0.5 text-[16px] font-bold shadow-[0_2px_6px_rgba(22,22,26,0.15)]"
          style={{ background: ZUTA, color: MASTILO }}
        >
          {imeDeteta}
        </span>
      )}
      <div
        className={`rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8] ${imeDeteta ? "pt-7" : ""}`}
        style={{ borderColor: IVICA }}
      >
        <p className="text-[17px] leading-relaxed" style={{ color: MASTILO }}>
          zack! članstvo {imeDeteta ? <>za <strong>{imeDeteta}</strong></> : "za tvoje dete"} -{" "}
          <strong>{rsd(ZACK_PROMO_RSD)} din mesečno</strong>{" "}
          <span style={{ color: PRIGUSEN }}>(promo cena, puna je {rsd(ZACK_PUNA_RSD)})</span>,
          obnavlja se automatski, otkazuješ jednim klikom.
        </p>
        <ul className="mt-4 space-y-2 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
          <li>
            Danas se naplaćuje <strong style={{ color: MASTILO }}>{rsd(ZACK_PROMO_RSD)} RSD</strong>.
            Isti iznos banka će automatski naplaćivati sa tvoje kartice{" "}
            <strong style={{ color: MASTILO }}>svakog meseca</strong>, dok je članstvo aktivno.
          </li>
          <li>
            {imeDeteta ? (
              <>
                Detetu se otključavaju igre, kesice sa sličicama i Milioner - odmah, na istom
                profilu, sa istim kodom i PIN-om.
              </>
            ) : (
              <>
                Odmah posle plaćanja dete dobija svoj otključan profil. Nalog nastane
                sam - kod za prijavu deteta stiže na tvoj
                mejl i piše na strani posle plaćanja.
              </>
            )}
          </li>
          <li>
            <strong style={{ color: MASTILO }}>Otkazivanje:</strong> u svakom trenutku, u
            roditeljskom panelu, bez pisanja i bez obrazlaganja. Posle otkazivanja igre rade do
            kraja plaćenog meseca, a album i sve zarađeno ostaju zauvek.
          </li>
          <li>
            Na strani banke <strong style={{ color: MASTILO }}>ne biraj „na rate“</strong> -
            mesečne naplate pokrećemo mi, a rate Banca Intesa kartice su nešto drugo.
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Blok poverenja: ko stoji iza i kuda ide kartica - isti u oba toka. */
function BlokPoverenja() {
  return (
    <div
      className="mt-5 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]"
      style={{ borderColor: IVICA }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: PRIGUSEN }}>
        Kome plaćaš
      </h2>
      {/* Tačno podaci iz /uslovi, odeljak 6 „Osnovni podaci o firmi". */}
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MASTILO }}>
        NATAŠA HARTWEGER PR STUDIO ZA UČENJE NEMAČKOG JEZIKA I PREVOĐENJE HARTWEGER BEOGRAD (NOVI
        BEOGRAD)
        <br />
        Jurija Gagarina 20, Beograd (Novi Beograd)
        <br />
        Matični broj: 63647357 · PIB: 108712117
        <br />
        Kontakt:{" "}
        <a href="mailto:info@hartweger.rs" className="underline">
          info@hartweger.rs
        </a>
      </p>

      <h2
        className="mt-5 text-xs font-semibold uppercase tracking-wide"
        style={{ color: PRIGUSEN }}
      >
        Gde unosiš karticu
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MASTILO }}>
        Karticu unosiš na zaštićenoj stranici <strong>Banca Intesa</strong> (NestPay sistem
        banke), a ne kod nas - mi podatke tvoje kartice{" "}
        <strong>ne vidimo niti čuvamo</strong>.
      </p>

      {/* Isti znaci kartica i banke kao u školskom podnožju (EPM 2.2). */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <img src="/images/kartice/visa.jpg" alt="Visa" className="w-[40px] rounded border" style={{ borderColor: IVICA }} loading="lazy" />
        <img src="/images/kartice/mastercard.jpg" alt="Mastercard" className="w-[40px] rounded border" style={{ borderColor: IVICA }} loading="lazy" />
        <img src="/images/kartice/maestro.jpg" alt="Maestro" className="w-[40px] rounded border" style={{ borderColor: IVICA }} loading="lazy" />
        <img src="/images/kartice/dina.jpg" alt="DinaCard" className="w-[40px] rounded border" style={{ borderColor: IVICA }} loading="lazy" />
        <img src="/images/kartice/amex.png" alt="American Express" className="w-[40px] rounded border" style={{ borderColor: IVICA }} loading="lazy" />
        <a
          href="https://www.bancaintesa.rs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Banca Intesa"
          className="rounded border bg-white px-2 py-1"
          style={{ borderColor: IVICA }}
        >
          <img src="/images/kartice/banca-intesa-color.png" alt="Banca Intesa" className="h-5" loading="lazy" />
        </a>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed" style={{ color: PRIGUSEN }}>
        Pre plaćanja pročitaj{" "}
        <Link href="/uslovi" className="underline" style={{ color: MASTILO }}>
          uslove korišćenja
        </Link>{" "}
        i{" "}
        <Link href="/uslovi#placanje" className="underline" style={{ color: MASTILO }}>
          pravila otkazivanja mesečnog plaćanja
        </Link>
        .
      </p>
    </div>
  );
}

export default async function ZackClanstvoPage({
  searchParams,
}: {
  searchParams: Promise<{ dete?: string }>;
}) {
  const { dete: deteId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  // ── Tok iz panela: prijavljen roditelj sa ?dete= kupuje za postojeće dete ──
  if (user && deteId && jeUuid(deteId)) {
    const roditelj = await nadjiRoditelja(user.id);
    const dete = roditelj
      ? (
          await admin
            .from("zack_deca")
            .select("id, ime, roditelj_id, oslobodjeno, clanstvo_do")
            .eq("id", deteId)
            .eq("roditelj_id", roditelj.id)
            .maybeSingle()
        ).data
      : null;
    if (!roditelj || !dete) {
      return (
        <PorukaSaLinkom
          naslov="Za koje dete?"
          tekst="Nismo našli dete za koje se uključuje članstvo. Kreni iz roditeljskog panela - dugme „Uključi članstvo“ stoji uz svako dete."
        />
      );
    }

    // Već otključano (oslobođeno ili plaćeni period još traje) - nema šta da se
    // plaća; /api/orders isto odbija, ovde se to kaže lepše i pre kartice.
    if (
      jeOtkljucano(
        { roditeljId: dete.roditelj_id, oslobodjeno: dete.oslobodjeno, clanstvoDo: dete.clanstvo_do },
        new Date()
      )
    ) {
      return (
        <PorukaSaLinkom
          naslov={`${dete.ime} već ima pristup`}
          tekst="Igre su ovom detetu već otključane, pa novo plaćanje sad nije potrebno. Stanje članstva vidiš u roditeljskom panelu."
        />
      );
    }

    const { data: profil } = await admin
      .from("user_profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    return (
      <Okvir>
        <p className="mb-5">
          <Link
            href="/zack/roditelj"
            className="text-[15px] font-bold underline underline-offset-2"
            style={{ color: PRIGUSEN }}
          >
            ← Nazad u roditeljski panel
          </Link>
        </p>
        <NaslovStrane />
        <StaSePlaca imeDeteta={dete.ime} />
        <BlokPoverenja />
        <ZackCheckout
          deteId={dete.id}
          imeDeteta={dete.ime}
          email={roditelj.email}
          pocetnoIme={profil?.full_name ?? ""}
          iznosRsd={ZACK_PROMO_RSD}
        />
      </Okvir>
    );
  }

  // ── Javna kupovna strana: sve na jednoj strani, bez prethodne prijave ──────
  const { data: udzbenici, error: greskaUdzbenika } = await admin
    .from("zack_udzbenici")
    .select("id, naziv, izdavac, razred")
    .order("razred");
  if (greskaUdzbenika) {
    throw new Error(`Ne mogu da pročitam udžbenike: ${greskaUdzbenika.message}`);
  }

  // Prijavljen korisnik: mejl je njegov (porudžbina se ionako kači po mejlu),
  // a ako već ima decu u panelu, prvo ga podsećamo da za NJIH kreće odande -
  // da ne bi greškom napravio duplo dete.
  let fiksniEmail: string | null = null;
  let pocetnoIme = "";
  let postojecaDeca: { id: string; ime: string }[] = [];
  if (user) {
    fiksniEmail = user.email ?? null;
    const [{ data: profil }, roditelj] = await Promise.all([
      admin.from("user_profiles").select("full_name").eq("id", user.id).maybeSingle(),
      nadjiRoditelja(user.id),
    ]);
    pocetnoIme = profil?.full_name ?? "";
    if (roditelj) {
      fiksniEmail = roditelj.email;
      const { data: deca } = await admin
        .from("zack_deca")
        .select("id, ime")
        .eq("roditelj_id", roditelj.id)
        .order("created_at");
      postojecaDeca = deca ?? [];
    }
  }

  return (
    <Okvir>
      <p className="mb-5">
        <Link
          href="/nemacki-za-decu"
          className="text-[15px] font-bold underline underline-offset-2"
          style={{ color: PRIGUSEN }}
        >
          ← Nazad na zack! stranu
        </Link>
      </p>
      <NaslovStrane />
      <StaSePlaca />
      <BlokPoverenja />

      {postojecaDeca.length > 0 && (
        <div
          className="mt-5 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]"
          style={{ borderColor: IVICA }}
        >
          <p className="text-[15px] leading-relaxed" style={{ color: MASTILO }}>
            Na tvom nalogu već postoji {postojecaDeca.length === 1 ? "detetov profil" : "više dečjih profila"}.
            Članstvo za postojeće dete uključi ovde, da ne nastane dupli profil:
          </p>
          <ul className="mt-3 space-y-2">
            {postojecaDeca.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/kupovina/zack-clanstvo?dete=${d.id}`}
                  className="font-bold underline underline-offset-2"
                  style={{ color: MASTILO }}
                >
                  Uključi članstvo za {d.ime} →
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
            Obrazac ispod koristi samo ako plaćaš za <strong>novo dete</strong> koje još nema
            profil.
          </p>
        </div>
      )}

      <ZackGostCheckout
        udzbenici={udzbenici ?? []}
        fiksniEmail={fiksniEmail}
        pocetnoIme={pocetnoIme}
        iznosRsd={ZACK_PROMO_RSD}
      />
    </Okvir>
  );
}
