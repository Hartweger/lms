import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opšti uslovi poslovanja — Hartweger",
  description: "Opšti uslovi korišćenja platforme Hartweger — uslovi kupovine, pristup kursevima i pravila korišćenja.",
};

export default function UsloviPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Opšti uslovi poslovanja
          </h1>
          <p className="text-gray-500">Poslednja izmena: maj 2026.</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray max-w-none">

          <h2>1. Video kursevi</h2>
          <ul>
            <li>Pristup video lekcijama i svim materijalima na platformi traje <strong>godinu dana</strong> od dana kupovine.</li>
            <li>Po završetku kursa i ispita polaznik dobija sertifikat HARTWEGER centra.</li>
            <li>Materijali su namenjeni isključivo za ličnu upotrebu — zabranjena je redistribucija, snimanje i deljenje.</li>
          </ul>

          <h2>2. Grupni kursevi</h2>
          <ul>
            <li>Grupe broje od 3 do 6 polaznika.</li>
            <li>Za pokretanje grupe potrebno je minimum 3 polaznika. Ukoliko se ne prijavi dovoljan broj, termin se pomera i polaznik ostaje na listi.</li>
            <li>Časovi se održavaju putem Google Meet platforme.</li>
            <li>Polaznik dobija pristup video lekcijama i svim materijalima na platformi na godinu dana.</li>
          </ul>

          <h3>Otkazivanje grupnog kursa:</h3>
          <ul>
            <li>Dva dana pre početka kursa — povraćaj 100%.</li>
            <li>Prvih 15 dana od početka kursa — povraćaj 50%.</li>
            <li>Nakon 15 dana od početka kursa — bez povraćaja.</li>
          </ul>

          <h2>3. Individualni kursevi</h2>
          <ul>
            <li>Individualne časove polaznik koristi u roku od <strong>3 meseca</strong> od kupovine (6 meseci za paket A1).</li>
            <li>Termine zakazuje polaznik putem Google Calendar linka.</li>
            <li>Otkazivanje zakazanog časa moguće je najkasnije <strong>24 sata pre</strong> termina.</li>
            <li>Neiskorišćeni časovi iz mesečnog paketa se ne prenose u sledeći mesec.</li>
            <li>Pristup video lekcijama i materijalima na platformi traje godinu dana.</li>
          </ul>

          <h2>4. Plaćanje</h2>
          <ul>
            <li>Plaćanje je moguće platnom karticom (Visa, MasterCard, AmEx), uplatom na dinarski račun ili putem PayPal-a.</li>
            <li>Plaćanje na rate moguće je isključivo karticama Banca Intesa banke (do 6 rata).</li>
            <li>Cene su izražene u dinarima (RSD). Cene u evrima su informativnog karaktera.</li>
          </ul>

          <h2>5. Zaštita autorskih prava</h2>
          <p>
            Sav sadržaj na platformi (video lekcije, priručnici, vežbe, testovi) je intelektualna svojina HARTWEGER centra.
            Zabranjena je redistribucija, snimanje, kopiranje i deljenje materijala sa trećim licima.
            Kršenje ovih pravila može rezultirati ukidanjem pristupa bez povraćaja sredstava.
          </p>

          <h2>6. Kontakt</h2>
          <p>
            Za sva pitanja, reklamacije i žalbe obratite nam se na{" "}
            <Link href="/kontakt" className="text-plava hover:underline">kontakt formu</Link>{" "}
            ili putem emaila: <strong>info@hartweger.rs</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
