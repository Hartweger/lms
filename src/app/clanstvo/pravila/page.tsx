// Pravila zajednice NH Membership - vezana iz ClanstvoFooter-a i ispod forme
// za slanje poruka u chatu (ChatKlijent). Opšti uslovi kupovine, reklamacije
// i privatnost ostaju na /uslovi - ovde su samo pravila ponašanja u zajednici.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pravila zajednice - NH Membership",
};

const PRAVILA = [
  {
    naslov: "Poštovanje pre svega",
    tekst:
      "Zajednica je prostor podrške. Uvrede, omalovažavanje, govor mržnje i svađe ovde nemaju mesto - neslaganje je u redu, ali uvek uz poštovanje.",
  },
  {
    naslov: "Što je u zajednici, ostaje u zajednici",
    tekst:
      "Poruke, iskustva i podaci koje članice podele u chatu ne iznose se napolje - ni kao screenshot, ni prepričavanjem sa imenom. Tuđa priča nije tvoja za deljenje.",
  },
  {
    naslov: "Bez spama i neželjene reklame",
    tekst:
      "Chat nije oglasni prostor. Samopromocija i pozivanje na druge grupe, proizvode ili usluge dozvoljeni su samo tamo gde je to izričito predviđeno ili uz dogovor sa Natašom.",
  },
  {
    naslov: "Materijali su samo za članice",
    tekst:
      "Lekcije, snimci i materijali iz biblioteke namenjeni su isključivo tvojoj ličnoj upotrebi. Deljenje sa trećim licima nije dozvoljeno - detaljnije u uslovima korišćenja.",
  },
  {
    naslov: "Pazi šta deliš",
    tekst:
      "Poruke vide sve članice kanala i čuvaju se na platformi. Ne deli osetljive lične podatke - svoje ni tuđe (brojeve telefona, adrese, finansijske podatke).",
  },
  {
    naslov: "Moderacija",
    tekst:
      "Nataša kao administratorka može ukloniti poruke koje krše ova pravila. Kod ponovljenih ili težih kršenja pristup zajednici može biti privremeno ili trajno ukinut, u skladu sa opštim uslovima korišćenja.",
  },
  {
    naslov: "Nešto nije u redu?",
    tekst:
      "Ako primetiš poruku koja krši pravila ili imaš bilo kakav problem, javi se Nataši direktno u chatu ili na info@hartweger.rs.",
  },
];

export default function PravilaZajednice() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-nh-dark">
          Pravila zajednice
        </h1>
        <p className="mt-2 text-nh-dark/70">
          Zajednica NH Membership je privatan prostor za članice - mesto gde se
          pitamo, delimo i podržavamo. Da bi tako i ostalo, važi nekoliko
          jednostavnih pravila. Slanjem poruke u chatu prihvataš ih.
        </p>
      </div>

      <ol className="space-y-5">
        {PRAVILA.map((p, i) => (
          <li
            key={p.naslov}
            className="rounded-xl border border-nh-pink-light bg-white p-5"
          >
            <h2 className="font-heading font-bold text-nh-dark">
              <span className="text-nh-pink">{i + 1}.</span> {p.naslov}
            </h2>
            <p className="mt-1.5 text-sm text-nh-dark/70">{p.tekst}</p>
          </li>
        ))}
      </ol>

      <p className="text-sm text-nh-dark/60">
        Na članstvo se primenjuju i{" "}
        <Link href="/uslovi" className="underline hover:text-nh-pink">
          opšti uslovi korišćenja i politika privatnosti
        </Link>{" "}
        platforme.
      </p>
    </div>
  );
}
