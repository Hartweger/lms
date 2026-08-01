// Tekst žutog okvira na checkoutu za mesečno plaćanje (EPM/banka: iznos,
// učestalost, maksimalan broj naplata i uslovi otkazivanja moraju biti
// prikazani PRE plaćanja). Čista funkcija radi testiranja - CheckoutForm
// samo renderuje rezultat. Narativ zavisi od `plan.tip`: "paket" (podrazumevano,
// npr. paket-a1-a2-b1) ima fiksan broj rata i postepeno otključavanje nivoa,
// pa se prikazuje ukupan zbir; "clanstvo" traje do otkazivanja i 121 je samo
// bankin tehnički maksimum naplata u seriji, ne obećanje - zbir 121 × rata bi
// bio zavaravajući, pa se ne prikazuje.
import type { SubscriptionPlan } from "./subscription-plans";

export interface PretplataOpis {
  naslov: string;
  stavke: string[];
  /**
   * Tekst uz kvadratić potvrde saglasnosti - namerno BEZ linka na kraju
   * ("saglasan/na sam sa"): CheckoutForm dodaje link ka /uslovi posle ovog
   * teksta, isto kao što je original radio (jedan `<a>` element, ne string).
   */
  potvrda: string;
}

// Isto formatiranje kao formatPrice u CheckoutForm.tsx (de-DE separator = tačka
// za hiljade) - narativ za paket mora ostati karakter-identičan postojećem.
const rsd = (n: number) => n.toLocaleString("de-DE");

export function pretplataOpis(plan: SubscriptionPlan, fullPrice: number): PretplataOpis {
  if (plan.tip === "clanstvo") {
    return {
      naslov: `Mesečna pretplata - ${rsd(plan.monthlyRsd)} RSD mesečno`,
      stavke: [
        `Danas se naplaćuje <strong>${rsd(plan.monthlyRsd)} RSD</strong>.`,
        `Isti iznos banka će automatski naplaćivati sa tvoje kartice <strong>svakog meseca</strong>, dok je pretplata aktivna - prva naredna naplata za mesec dana, istog datuma.`,
        `Pristup celoj biblioteci i zajednici važi dok je pretplata aktivna. Ne prikazujemo ukupan zbir kao obavezu - ovo nije paket sa fiksnim brojem rata, već članstvo do otkazivanja.`,
        `Tehnički maksimum banke je <strong>${plan.totalPayments} naplata</strong> u jednoj seriji (posle toga banka traži novu seriju) - to nije obećanje trajanja, pretplata prestaje ranije čim je otkažeš.`,
        `<strong>Na strani banke ne biraj „na rate“</strong> - mesečne naplate pokrećemo mi, a rate Banca Intesa kartice su nešto drugo i ne mogu da idu zajedno sa mesečnim plaćanjem.`,
        `<strong>Otkazivanje:</strong> u svakom trenutku, sam(a), u odeljku „Moj nalog“ na platformi. Ne moraš da nam pišeš ni da obrazlažeš. Posle otkazivanja pristup traje do kraja plaćenog meseca.`,
      ],
      potvrda: `Razumem da pokrećem mesečno plaćanje od ${rsd(plan.monthlyRsd)} RSD koje se automatski obnavlja dok ga ne otkažem, i saglasan/na sam sa`,
    };
  }

  // paket (npr. paket-a1-a2-b1): postojeći narativ prenet VERBATIM iz
  // CheckoutForm.tsx (bankina formulacija, fiksan broj rata + postepeno
  // otključavanje nivoa + ukupan zbir kao obaveza).
  return {
    naslov: `Pokrećeš pretplatu, ne jednokratnu kupovinu.`,
    stavke: [
      `Danas se naplaćuje <strong>${rsd(plan.monthlyRsd)} RSD</strong>.`,
      `Isti iznos banka će automatski naplatiti sa tvoje kartice <strong>svakog meseca</strong>, ukupno <strong>${plan.totalPayments} naplata</strong> - prva naredna za mesec dana, istog datuma.`,
      `Ukupno platiš <strong>${rsd(plan.monthlyRsd * plan.totalPayments)} RSD</strong> (jednokratno je ${rsd(fullPrice)} RSD).`,
      `Nivoi se otvaraju kako plaćaš: A1.1 odmah, A1.2 uz 2. naplatu, A2.1 uz 4, A2.2 uz 5, B1.1 uz 7, B1.2 uz 8. Meseci 3, 6 i 9-12 su za obnavljanje i završni ispit nivoa.`,
      `Pristup traje dok traju naplate. Ako plaćanje prekineš, ostaje ti do kraja plaćenog meseca.`,
      `<strong>Na strani banke ne biraj „na rate“</strong> - mesečne naplate pokrećemo mi, a rate Banca Intesa kartice su nešto drugo i ne mogu da idu zajedno sa mesečnim plaćanjem.`,
      `<strong>Otkazivanje:</strong> u svakom trenutku, sam(a), u odeljku „Moj nalog“ na platformi. Ne moraš da nam pišeš ni da obrazlažeš.`,
    ],
    potvrda: `Razumem da pokrećem mesečno plaćanje od ${rsd(plan.monthlyRsd)} RSD × ${plan.totalPayments} i saglasan/na sam sa`,
  };
}
