const faqByCategory: Record<string, { q: string; a: string }[]> = {
  video: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi. Potrebna ti je samo dobra volja i bilo koji uređaj sa internet konekcijom." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas - priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1-B1) i Vielfalt (B2-C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Koliko vremena treba nedeljno?", a: "To zavisi od tebe. Preporučujemo 3-4 sata nedeljno za optimalan napredak, ali učiš sopstvenim tempom." },
    { q: "Koliko dugo imam pristup?", a: "Pristup kursu imaš godinu dana od dana kupovine. Za to vreme možeš gledati lekcije neograničen broj puta." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  grupni: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi i link za poziv na prvi čas. Potrebna ti je samo dobra volja i bilo koji uređaj sa internet konekcijom." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas - priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1-B1) i Vielfalt (B2-C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Šta ako propustim čas?", a: "Beleške sa svakog časa su ti dostupne, a video lekcije na platformi možeš gledati kad god ti odgovara. Čas u grupi je za vežbanje govora - ako jedan propustiš, nadoknadićeš na sledećem." },
    { q: "Koliko vremena treba nedeljno?", a: "Oko 3 sata: dva časa po 60 minuta u grupi + oko sat vremena za video lekcije i vežbe na platformi." },
    { q: "Koliko polaznika je u grupi?", a: "Grupa broji najviše 6 polaznika. Za formiranje grupe potrebno je minimum 3 polaznika. Ukoliko se ne prijavi dovoljan broj, termin se pomera i ostaješ na listi." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a. Plaćanje na rate moguće je karticama Banca Intesa." },
  ],
  individualni: [
    { q: "Kako zakazujem časove?", a: "Nakon uplate dobijaš link za Google Calendar i zakazuješ termine kad ti odgovara. Potpuna fleksibilnost - ti biraš dan i sat." },
    { q: "Da li moram da kupujem udžbenike?", a: "Ne. Sav materijal dobijaš od nas - priručnike, vežbe, testove i materijal za pripremu ispita. Plan i program je rađen po uzoru na Schritte (A1-B1) i Vielfalt (B2-C1), ali je naš program modifikovan i prilagođen sadašnjem trenutku. Ne treba ti ništa drugo." },
    { q: "Koliko imam vremena da iskoristim časove?", a: "Individualne časove koristiš u roku od 3 meseca od kupovine (6 meseci za paket A1). Pristup video lekcijama i vežbama na platformi imaš godinu dana." },
    { q: "Šta ako moram da otkažem zakazani čas?", a: "Otkazivanje je moguće najkasnije 24 sata pre zakazanog časa." },
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
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
  "grupni-konverzacijski-kurs-nemackog-b1": [
    { q: "Šta se dešava nakon prijave?", a: "Odmah dobijaš potvrdu sa svim informacijama, a pre prvog časa i link za Google Meet poziv. Potreban ti je samo uređaj sa internet konekcijom - ništa se ne instalira i ne pripremaš posebno." },
    { q: "Koji nivo treba da imam?", a: "Kurs je namenjen onima koji su završili B1 i žele konverzacijsku praksu. Razumeš nemački, ali ti govor blokira - tu ti pomažemo." },
    { q: "Koliko vremena treba nedeljno?", a: "Oko 2 sata: jedan čas petkom od 60 minuta + 30-45 minuta za vežbanje reči na platformi pre časa." },
    { q: "Da li moram nešto da kupujem ili pripremam?", a: "Ne. Pre svakog časa dobijaš set reči (naše kartice za vežbanje) na platformi. Sve ostalo radimo zajedno na času - bez udžbenika i bez dodatnih materijala." },
    { q: "Koliko polaznika je u grupi?", a: "Najviše 6 polaznika, da svako stigne da priča. Za formiranje grupe potrebno je minimum 3 polaznika - ako se ne prijavi dovoljno, termin se pomera i ostaješ na listi." },
    { q: "Šta ako propustim čas?", a: "Čas u grupi je za vežbanje govora - ako jedan propustiš, nadoknadiš na sledećem. Raspored tema i setove reči imaš na platformi u svom tempu." },
    { q: "Mogu li da učestvujem sa telefona?", a: "Da! Časovi su preko Google Meet-a, a setove reči vežbaš u našoj aplikaciji - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a. Plaćanje na rate moguće je karticama Banca Intesa." },
  ],
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
    { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  "polozi-fide": [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijaš pristup svim materijalima na platformi." },
    { q: "Koliko dugo imam pristup?", a: "Pristup kursu imaš godinu dana od dana kupovine." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  "private-german-lessons-online": [
    { q: "What happens after I pay?", a: "You'll get a Google Calendar link to book your lessons whenever it suits you. You choose the day and time." },
    { q: "In what language are the lessons taught?", a: "Lessons and explanations are in English, while you learn and practice German. Perfect if you live in a German-speaking country and don't speak Serbian." },
    { q: "Who is my tutor?", a: "You're taught by an experienced Hartweger teacher who works in English - currently Katarina or Milica. You pick your tutor during checkout, and every lesson is 1-on-1." },
    { q: "What if I don't use all my sessions in a month?", a: "Unused sessions don't roll over to the next month. We recommend booking regularly." },
    { q: "Can I cancel a booked lesson?", a: "Yes - you can cancel up to 24 hours before the scheduled lesson." },
    { q: "How do I pay?", a: "You can pay by card (Visa, MasterCard) or via PayPal. Prices are shown in EUR." },
  ],
};

export default function ProductFaq({ category, slug, lang = "sr" }: { category: string; slug?: string; lang?: "sr" | "en" }) {
  const faq = (slug && faqBySlug[slug]) || faqByCategory[category] || faqByCategory.video;
  const title = lang === "en" ? "Frequently asked questions" : "Česta pitanja";

  return (
    <div>
      <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-5">{title}</h2>
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
