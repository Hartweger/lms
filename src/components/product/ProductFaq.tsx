const faqByCategory: Record<string, { q: string; a: string }[]> = {
  video: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi. Potrebna ti je samo dobra volja i bilo koji uređaj sa internet konekcijom." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas — priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1–B1) i Vielfalt (B2–C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Koliko vremena treba nedeljno?", a: "To zavisi od tebe. Preporučujemo 3–4 sata nedeljno za optimalan napredak, ali učiš sopstvenim tempom." },
    { q: "Koliko dugo imam pristup?", a: "Pristup kursu imaš godinu dana od dana kupovine. Za to vreme možeš gledati lekcije neograničen broj puta." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju — šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  grupni: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi i link za poziv na prvi čas. Potrebna ti je samo dobra volja i bilo koji uređaj sa internet konekcijom." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas — priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1–B1) i Vielfalt (B2–C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Šta ako propustim čas?", a: "Beleške sa svakog časa su ti dostupne, a video lekcije na platformi možeš gledati kad god ti odgovara. Čas u grupi je za vežbanje govora — ako jedan propustiš, nadoknadićeš na sledećem." },
    { q: "Koliko vremena treba nedeljno?", a: "Oko 3 sata: dva časa po 60 minuta u grupi + oko sat vremena za video lekcije i vežbe na platformi." },
    { q: "Koliko polaznika je u grupi?", a: "Grupa broji najviše 6 polaznika. Za formiranje grupe potrebno je minimum 3 polaznika. Ukoliko se ne prijavi dovoljan broj, termin se pomera i ostaješ na listi." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju — šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a. Plaćanje na rate moguće je karticama Banca Intesa." },
  ],
  individualni: [
    { q: "Kako zakazujem časove?", a: "Nakon uplate dobijaš link za Google Calendar i zakazuješ termine kad ti odgovara. Potpuna fleksibilnost — ti biraš dan i sat." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas — priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1–B1) i Vielfalt (B2–C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Koliko imam vremena da iskoristim časove?", a: "Individualne časove koristiš u roku od 3 meseca od kupovine (6 meseci za paket A1). Pristup video lekcijama i vežbama na platformi imaš godinu dana." },
    { q: "Šta ako moram da otkažem zakazani čas?", a: "Otkazivanje je moguće najkasnije 24 sata pre zakazanog časa." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju — šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  mesecni: [
    { q: "Kako zakazujem časove?", a: "Nakon uplate dobijaš link za Google Calendar i zakazuješ termine kad ti odgovara." },
    { q: "Šta ako ne iskoristim sve časove u toku meseca?", a: "Neiskorišćeni časovi se ne prenose u sledeći mesec. Preporučujemo da zakazuješ redovno." },
    { q: "Da li dobijem sertifikat?", a: "Mesečni paketi ne uključuju sertifikat. Ako ti treba sertifikat, preporučujemo individualni kurs po nivou." },
    { q: "Mogu li da otkažem zakazani čas?", a: "Da, otkazivanje je moguće najkasnije 24 sata pre zakazanog časa." },
    { q: "Da li imam pristup video lekcijama?", a: "Mesečni paketi ne uključuju video lekcije. Fokus je na živim časovima sa profesorkom." },
  ],
};

/* Slug-specific FAQ overrides */
const faqBySlug: Record<string, { q: string; a: string }[]> = {
  "fsp-individualni": [
    { q: "Kako zakazujem časove?", a: "Nakon uplate dobijaš link za Google Calendar i zakazuješ termine sa profesorkom Milicom Vučić kad ti odgovara." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal za pripremu FSP ispita dobijaš od nas. Milica je autor svih materijala za FSP pripremu." },
    { q: "Šta ako moram da otkažem zakazani čas?", a: "Otkazivanje je moguće najkasnije 24 sata pre zakazanog časa." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  "individualni-polozi-fide": [
    { q: "Kako zakazujem časove?", a: "Nakon uplate dobijaš link za Google Calendar i zakazuješ termine kad ti odgovara." },
    { q: "Šta ako moram da otkažem zakazani čas?", a: "Otkazivanje je moguće najkasnije 24 sata pre zakazanog časa." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  "gramatika-a2-b1": [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup video predavanju i e-booku na platformi." },
    { q: "Koliko dugo imam pristup?", a: "Pristup video predavanju imaš godinu dana. E-book ostaje tvoj zauvek." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju — šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  "polozi-fide": [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi." },
    { q: "Koliko dugo imam pristup?", a: "Pristup kursu imaš godinu dana od dana kupovine." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
};

export default function ProductFaq({ category, slug }: { category: string; slug?: string }) {
  const faq = (slug && faqBySlug[slug]) || faqByCategory[category] || faqByCategory.video;

  return (
    <div>
      <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-5">Česta pitanja</h2>
      <div className="space-y-5">
        {faq.map((item, i) => (
          <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
            <h3 className="font-bold text-gray-900 text-[15px] mb-2 flex items-start gap-2.5">
              <span className="flex-shrink-0 w-6 h-6 bg-plava/10 rounded-md flex items-center justify-center text-plava text-xs font-bold mt-0.5">?</span>
              {item.q}
            </h3>
            <p className="text-gray-500 text-[14px] leading-relaxed pl-[34px]">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
