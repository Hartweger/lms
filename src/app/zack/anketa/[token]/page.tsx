// Preostala dva pitanja ankete. Roditelj ovde stiže SA VEĆ UPISANIM prvim
// odgovorom (kliknuo ga je u mejlu), pa strana nikad ne počinje praznim
// obrascem i nikad ne traži da se prvo pitanje ponovi.
//
// Strana je roditeljska, pa sme Hartweger okvir, ali izgleda kao ostatak zack!
// sveta: papir, uska kolona, mirne rečenice - isti oblik kao /poklon.
//
// robots: noindex - ovo je lični link iz mejla, nema šta da traži u pretrazi.
// force-dynamic: stanje ankete se čita u trenutku otvaranja, ne iz keša.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { IVICA, MASTILO, PAPIR, PRIGUSEN, ZackZnak } from "../../Ukras";
import AnketaForma from "./AnketaForma";

export const metadata: Metadata = {
  title: "Kratka anketa | zack!",
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

export default async function AnketaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sb = createAdminClient();

  const { data: anketa } = await sb
    .from("zack_ankete")
    .select("id, dovrsena_at")
    .eq("token", token)
    .maybeSingle();

  if (!anketa) {
    // Nepoznat token nije greška roditelja - mirna rečenica, bez crvenog.
    return (
      <Okvir>
        <Naslov tekst="Ovaj link više ne radi" />
        <p className="mt-6 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
          Anketa je zatvorena ili je link istekao. Ako imaš nešto da nam kažeš, piši nam na{" "}
          <a href="mailto:info@hartweger.rs" className="font-bold underline" style={{ color: MASTILO }}>
            info@hartweger.rs
          </a>{" "}
          - pročitamo sve.
        </p>
      </Okvir>
    );
  }

  if (anketa.dovrsena_at) {
    return (
      <Okvir>
        <Naslov tekst="Hvala!" />
        <p className="mt-6 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
          Odgovori su stigli i pročitaćemo ih. Ništa više ne moraš da radiš.
        </p>
      </Okvir>
    );
  }

  return (
    <Okvir>
      <Naslov tekst="Hvala! Još dva pitanja" />
      <p className="mt-5 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
        Prvi odgovor je zabeležen. Oba pitanja ispod su neobavezna - pošalji i prazna ako ti se
        ne odgovara.
      </p>
      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]" style={{ borderColor: IVICA }}>
        <AnketaForma token={token} />
      </div>
      <p className="mt-5 text-[14px] leading-relaxed" style={{ color: PRIGUSEN }}>
        Odgovori ostaju kod nas i služe samo da vidimo šta da popravimo. Ništa se nigde ne
        objavljuje.
      </p>
    </Okvir>
  );
}
