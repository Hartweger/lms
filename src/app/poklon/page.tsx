// Poklon do 1. septembra 2026: dete dobija ceo zack! besplatno, bez kartice i
// bez ijednog plaćanja - obnavljanje nemačkog pred polazak u školu.
//
// Strana je RODITELJSKA (sme da nosi Hartweger okvir), ali izgleda kao ostatak
// zack! sveta: papir, uska kolona, mirne rečenice. Obrazac je isti kao na
// kupovnoj strani i koristi ISTU proveru (proveriGostUnos) - poklon nema svoja
// pravila o unosu, samo nema plaćanja.
//
// U ponudi je samo peti razred: sadržaj po planu i programu je jedini
// kompletan, a udžbenik se roditelju ne pominje (odluka 19.08) - pita se samo
// „Razred", isto kao na kupovnoj strani.
//
// force-dynamic: rok poklona se gleda po SADAŠNJEM trenutku, pa se strana ne
// sme zamrznuti u keš iz avgusta i posle 1.9. i dalje nuditi poklon.
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { POKLON_DO_PRIKAZ, poklonVazi } from "@/lib/zack/poklon";
import { IVICA, MASTILO, PAPIR, PRIGUSEN, ZackZnak } from "../zack/Ukras";
import PoklonForma from "./PoklonForma";

export const metadata: Metadata = {
  // Bez indeksiranja dok vlasnica ne odluči gde se poklon oglašava - strana
  // radi, ali je ne nalazi ko na nju nije pozvan.
  title: "zack! na poklon do 1. septembra | Hartweger",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function Okvir({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen" style={{ background: PAPIR }}>
      <div className="mx-auto max-w-xl px-4 py-10 md:py-14">{children}</div>
    </section>
  );
}

function Naslov({ tekst }: { tekst: string }) {
  return (
    <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ZackZnak velicina="sm" />
      <span className="font-montserrat text-2xl font-bold md:text-3xl" style={{ color: MASTILO }}>
        {tekst}
      </span>
    </h1>
  );
}

/** Bela kartica sa istom senkom kao na kupovnoj strani. */
function Kartica({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8] ${className}`}
      style={{ borderColor: IVICA }}
    >
      {children}
    </div>
  );
}

export default async function PoklonPage() {
  // Poklon je prošao: mirna rečenica i put dalje, nikad greška. Isto pravilo
  // kao prema detetu - ništa se ne oduzima i niko se ne požuruje.
  if (!poklonVazi(new Date())) {
    return (
      <Okvir>
        <Naslov tekst="Poklon je zatvoren" />
        <Kartica className="mt-8">
          <p className="text-[17px] leading-relaxed" style={{ color: MASTILO }}>
            Poklon je važio do {POKLON_DO_PRIKAZ} i sada je zatvoren. Deca koja su ga uzela i
            dalje imaju svoj album i sve što su zaradila - to im ostaje.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
            Ako želiš da tvoje dete krene sada, članstvo se uključuje u svakom trenutku.
          </p>
          <p className="mt-4">
            <Link
              href="/kupovina/zack-clanstvo"
              className="font-bold underline underline-offset-2"
              style={{ color: MASTILO }}
            >
              Uključi članstvo →
            </Link>
          </p>
        </Kartica>
      </Okvir>
    );
  }

  const admin = createAdminClient();
  const { data: udzbenici, error: greskaUdzbenika } = await admin
    .from("zack_udzbenici")
    .select("id, razred")
    .eq("izdavac", "Po planu i programu")
    .order("razred");
  if (greskaUdzbenika) {
    throw new Error(`Ne mogu da pročitam razrede: ${greskaUdzbenika.message}`);
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
      <Naslov tekst={`zack! na poklon do ${POKLON_DO_PRIKAZ}`} />

      {/* Sve što roditelj mora da zna PRE obrasca - bez sitnih slova. */}
      <Kartica className="mt-8">
        <p className="text-[17px] leading-relaxed" style={{ color: MASTILO }}>
          Do {POKLON_DO_PRIKAZ} dete dobija ceo zack! <strong>besplatno</strong> - da obnovi
          nemački pre nego što krene škola.
        </p>
        <ul className="mt-4 space-y-2 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
          <li>
            <strong style={{ color: MASTILO }}>Bez kartice i bez plaćanja.</strong> Ne tražimo
            broj kartice, nema pretplate i ništa ti neće biti naplaćeno - ni sada ni kasnije.
          </li>
          <li>
            Dete odmah dobija svoj profil: igre, kesice sa sličicama i Milioner. Kod za prijavu
            dobijaš na sledećoj strani i na mejl.
          </li>
          <li>
            <strong style={{ color: MASTILO }}>Posle {POKLON_DO_PRIKAZ}:</strong> igre, kesice i
            Milioner miruju, a album i sve što je dete zaradilo ostaju - detetu se ništa ne
            oduzima. Ako poželiš da nastavi, članstvo uključuješ sam, kad i ako hoćeš.
          </li>
        </ul>
      </Kartica>

      <PoklonForma udzbenici={udzbenici ?? []} />

      <p className="mt-5 text-[14px] leading-relaxed" style={{ color: PRIGUSEN }}>
        Jedan poklon ide po jednoj mejl adresi. O detetu čuvamo samo ime - prezime nam ne treba.
        Više o tome piše u{" "}
        <Link href="/uslovi" className="underline" style={{ color: MASTILO }}>
          uslovima korišćenja
        </Link>
        .
      </p>
    </Okvir>
  );
}
