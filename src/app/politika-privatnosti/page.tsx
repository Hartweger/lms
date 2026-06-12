import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politika privatnosti - Hartweger",
  description:
    "Kako prikupljamo, koristimo i štitimo tvoje podatke na hartweger.rs, koje kolačiće koristimo i koja su tvoja prava.",
  alternates: { canonical: "/politika-privatnosti" },
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Politika privatnosti - Hartweger",
    description: "Kako prikupljamo, koristimo i štitimo tvoje podatke na hartweger.rs.",
  },
};

export default function PolitikaPrivatnosti() {
  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Politika privatnosti
          </h1>
          <p className="text-gray-500">Poslednja izmena: jun 2026.</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray max-w-none">
          <p>
            Tvoja privatnost nam je važna. Ova politika objašnjava koje podatke prikupljamo kada
            koristiš sajt hartweger.rs, zašto ih prikupljamo, sa kim ih delimo i koja su tvoja
            prava. Rukovalac podataka je Centar za nemački jezik Hartweger.
          </p>

          <h2>Koje podatke prikupljamo</h2>
          <ul>
            <li>
              <strong>Podaci o nalogu:</strong> ime, e-mail adresa i podaci o pristupu kursevima -
              kako bismo ti omogućili prijavu i praćenje napretka.
            </li>
            <li>
              <strong>Podaci o kupovini:</strong> podaci neophodni za obradu porudžbine i izdavanje
              računa.
            </li>
            <li>
              <strong>Tehnički podaci:</strong> anonimni podaci o korišćenju sajta (posete, učinak),
              radi poboljšanja sadržaja.
            </li>
          </ul>

          <h2>Kolačići</h2>
          <p>
            <strong>Neophodni kolačići</strong> omogućavaju prijavu i osnovno funkcionisanje sajta i
            uvek su uključeni. <strong>Analitičke i marketinške kolačiće</strong> (Google)
            postavljamo samo ako daš saglasnost preko obaveštenja o kolačićima. Saglasnost možeš da
            opozoveš u svako doba (vidi „Tvoja prava").
          </p>

          <h2>Sa kim delimo podatke (obrađivači)</h2>
          <ul>
            <li>
              <strong>Supabase</strong> - čuvanje naloga, autentikacija i sesija korisnika.
            </li>
            <li>
              <strong>Google (Google Analytics, Google Ads, Google Tag Manager)</strong> - analitika
              i oglašavanje. Aktivira se samo uz tvoju saglasnost.
            </li>
            <li>
              <strong>Vercel</strong> - hosting sajta i anonimna analitika učinka (bez kolačića).
            </li>
            <li>
              <strong>Resend</strong> - slanje transakcionih i informativnih e-mail poruka.
            </li>
            <li>
              <strong>Banca Intesa (NestPay)</strong> - obrada plaćanja platnim karticama i na rate.
            </li>
            <li>
              <strong>PayPal</strong> - obrada plaćanja za korisnike iz inostranstva.
            </li>
            <li>
              <strong>Fiscomm</strong> - izdavanje fiskalnih računa u skladu sa zakonom.
            </li>
          </ul>

          <h2>Koliko čuvamo podatke</h2>
          <p>
            Podatke čuvamo onoliko koliko je potrebno za pružanje usluge i ispunjavanje zakonskih
            obaveza. Kada više nisu potrebni, brišemo ih ili anonimizujemo.
          </p>

          <h2>Tvoja prava</h2>
          <p>
            Imaš pravo da zatražiš pristup svojim podacima, njihovu ispravku ili brisanje, kao i da
            opozoveš saglasnost za kolačiće. Saglasnost za kolačiće možeš da poništiš tako što
            obrišeš kolačiće i lokalne podatke sajta u podešavanjima pregledača, ili nas
            kontaktiraš. Za sve zahteve piši na{" "}
            <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>.
          </p>

          <h2>Kontakt</h2>
          <p>
            Za sva pitanja o privatnosti i obradi podataka, obrati nam se na{" "}
            <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>. Pogledaj i naše{" "}
            <Link href="/uslovi">uslove korišćenja</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
