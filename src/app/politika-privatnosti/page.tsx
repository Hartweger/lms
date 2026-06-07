import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politika privatnosti — Hartweger",
  description:
    "Kako prikupljamo, koristimo i štitimo tvoje podatke na kurs.hartweger.rs, koje kolačiće koristimo i koja su tvoja prava.",
  alternates: { canonical: "/politika-privatnosti" },
  robots: { index: true, follow: true },
};

export default function PolitikaPrivatnosti() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-lg">
      <h1>Politika privatnosti</h1>
      <p>
        Tvoja privatnost nam je važna. Ova politika objašnjava koje podatke prikupljamo kada
        koristiš sajt kurs.hartweger.rs, zašto ih prikupljamo, sa kim ih delimo i koja su tvoja
        prava. Rukovalac podataka je Centar za nemački jezik Hartweger.
      </p>

      <h2>Koje podatke prikupljamo</h2>
      <ul>
        <li>
          <strong>Podaci o nalogu:</strong> ime, e-mail adresa i podaci o pristupu kursevima — kako
          bismo ti omogućili prijavu i praćenje napretka.
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
        uvek su uključeni. <strong>Analitičke i marketinške kolačiće</strong> (Google) postavljamo
        samo ako daš saglasnost preko obaveštenja o kolačićima. Saglasnost možeš da opozoveš u svako
        doba (vidi „Tvoja prava").
      </p>

      <h2>Sa kim delimo podatke (obrađivači)</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — čuvanje naloga, autentikacija i sesija korisnika.
        </li>
        <li>
          <strong>Google (Google Analytics, Google Ads, Google Tag Manager)</strong> — analitika i
          oglašavanje. Aktivira se samo uz tvoju saglasnost.
        </li>
        <li>
          <strong>Vercel</strong> — hosting sajta i anonimna analitika učinka (bez kolačića).
        </li>
        <li>
          <strong>Resend</strong> — slanje transakcionih i informativnih e-mail poruka.
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
        opozoveš saglasnost za kolačiće. Saglasnost za kolačiće možeš da poništiš tako što obrišeš
        kolačiće i lokalne podatke sajta u podešavanjima pregledača, ili nas kontaktiraš. Za sve
        zahteve piši na{" "}
        <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>.
      </p>

      <h2>Kontakt</h2>
      <p>
        Za sva pitanja o privatnosti i obradi podataka, obrati nam se na{" "}
        <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>. Pogledaj i naše{" "}
        <Link href="/uslovi">uslove korišćenja</Link>.
      </p>
    </article>
  );
}
