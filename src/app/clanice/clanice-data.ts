// Podaci članica zajednice - preneto sa stare /clanice/ stranice (WP, CPT "zajednica")
// Fotografije: Supabase Storage blog-media/clanice/

export type UslugaKey =
  | "engleski"
  | "nemacki"
  | "italijanski"
  | "turizam"
  | "marketing"
  | "matematika"
  | "rucnopravljeno"
  | "virtualniasistent";

export const USLUGE: Record<UslugaKey, string> = {
  engleski: "Engleski jezik",
  nemacki: "Nemački jezik",
  italijanski: "Italijanski jezik",
  turizam: "Turizam",
  marketing: "Marketing",
  matematika: "Matematika",
  rucnopravljeno: "Ručno pravljeno",
  virtualniasistent: "Virtuelni asistent",
};

export interface ClanicaLink {
  vrsta: "instagram" | "linkedin" | "web" | "portfolio";
  url: string;
  label: string;
}

export interface Clanica {
  slug: string;
  ime: string;
  brend?: string;
  opis: string;
  usluge: UslugaKey[];
  email?: string;
  telefoni?: string[];
  linkovi: ClanicaLink[];
  foto?: string;
}

const FOTO = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/clanice";

export const CLANICE: Clanica[] = [
  {
    slug: "natasa-hartweger",
    ime: "Nataša Hartweger",
    brend: "Hartweger centar",
    opis: "Osnivač Hartweger centra. Pomažemo ljudima da nauče nemački jezik koji mogu zaista da koriste u realnom životu.",
    usluge: ["nemacki", "marketing"],
    email: "natasa@hartweger.rs",
    linkovi: [{ vrsta: "web", url: "https://www.hartweger.rs/", label: "hartweger.rs" }],
    foto: `${FOTO}/natasa-hartweger.jpg`,
  },
  {
    slug: "andrea-cosovic",
    ime: "Andrea Ćosović",
    brend: "CREDO škola",
    opis: "Osnivačica CREDO škole, specijalizovane za italijanski, engleski i španski jezik. Pomažemo kompanijama da grade jezičke veštine svojih zaposlenih, kako bi oni mogli da primene znanje u poslovnom okruženju i doprinose uspehu firme.",
    usluge: ["engleski", "italijanski"],
    email: "andrea@credoskola.com",
    linkovi: [
      { vrsta: "instagram", url: "https://www.instagram.com/italijanskijezikonline/", label: "@italijanskijezikonline" },
    ],
    foto: `${FOTO}/andrea-cosovic.jpg`,
  },
  {
    slug: "sanja-stojanovic",
    ime: "Sanja Stojanović",
    brend: "Londoner, Kragujevac",
    opis: "Vodim školu jezika i prevodilačku agenciju Londoner iz Kragujevca, koja pomaže odraslima i deci da engleski koriste sa samopouzdanjem u stvarnim situacijama, ne samo na času. Prepoznatljivi smo po individualnom pristupu i rezultatima koji se zaista čuju. Ako želite da zaista napredujete ili da vaš tim progovori engleski sa samopouzdanjem, javite mi se :)",
    usluge: ["engleski"],
    telefoni: ["063 738 7166"],
    linkovi: [],
  },
  {
    slug: "aleksandra-lalic",
    ime: "Aleksandra Lalić",
    opis: "Držim pripreme za malu maturu iz matematike.",
    usluge: ["matematika"],
    linkovi: [{ vrsta: "instagram", url: "https://www.instagram.com/_anamath", label: "@_anamath" }],
  },
  {
    slug: "ivana-zinic",
    ime: "Ivana Žinić",
    brend: "ProSpeak",
    opis: "Razumeš engleski, ali teško govoriš? Fali ti reč, blokiraš i zbog toga propuštaš mnoge prilike? U školi ProSpeak fokusiramo se na aktivaciju pasivnog znanja i razvoj komunikacijskih veština. Kroz moderan i praktičan pristup pomažemo profesionalcima da prevaziđu blokade u govoru i izgrade samopouzdanje u korišćenju engleskog jezika. Takođe nudimo obuke javnog nastupa i prezentacionih veština na engleskom jeziku, koje su od izuzetnog značaja u savremenom korporativnom okruženju.",
    usluge: ["engleski"],
    telefoni: ["063 718 8688"],
    linkovi: [{ vrsta: "instagram", url: "https://www.instagram.com/pro_speak_school", label: "@pro_speak_school" }],
  },
  {
    slug: "vanja-antic",
    ime: "Vanja Antić",
    brend: "Sprelt",
    opis: "Osnivač centra Sprelt, specijalizovanog za poslovni nemački jezik. Pomažem kompanijama i timovima da razviju sigurnu i efikasnu komunikaciju na nemačkom jeziku, razumeju poslovnu kulturu i izgrade jače veze sa nemačkim partnerima.",
    usluge: ["nemacki"],
    linkovi: [{ vrsta: "linkedin", url: "https://linkedin.com/in/vanja-anti%C4%87-sprelt", label: "LinkedIn" }],
    foto: `${FOTO}/vanja-antic.jpg`,
  },
  {
    slug: "sladjana-gregovic",
    ime: "Slađana Gregović",
    brend: "Guest House 4M, Petrovac",
    opis: "Želim da vam predstavim naš porodični biznis - Guest House 4M u Petrovcu. Nudimo udobne studio i klasične apartmane na prelepoj lokaciji, a uskoro širimo i našu ponudu. Dobrodošli! 🐚🌊",
    usluge: ["turizam"],
    telefoni: ["+381 64 927 9234", "+382 69 848 825"],
    linkovi: [
      { vrsta: "instagram", url: "https://www.instagram.com/guesthouse4m", label: "@guesthouse4m" },
      { vrsta: "linkedin", url: "https://www.linkedin.com/in/sladjana-gregovic-571ba6bb", label: "LinkedIn" },
    ],
    foto: `${FOTO}/sladjana-gregovic.jpg`,
  },
  {
    slug: "danica-trnavac",
    ime: "Danica Trnavac",
    opis: "Pomažem malim biznisima da uz pomoć Meta oglašavanja dopru do pravih ljudi, povećaju prodaju i izgrade poverenje kod svoje publike. Dok vi ulažete u kvalitet i ideje, ja brinem da se vaš glas čuje.",
    usluge: ["marketing"],
    email: "danica@hartweger.rs",
    linkovi: [
      { vrsta: "portfolio", url: "https://drive.google.com/file/d/1FT56iARXuASLk-2B6rXQWJqwY57kwvG1/view", label: "Portfolio" },
    ],
    foto: `${FOTO}/danica-trnavac.jpg`,
  },
  {
    slug: "katarina-dimitrijevic",
    ime: "Katarina Dimitrijević",
    brend: "Tvoja vezica",
    opis: "Zdravo, ja sam Katarina - i treniram najneobičniji sport: vez! 😄 Umesto trčanja za rezultatima, ja hvatam mir između uboda igle i konca. Od rupa pravim male umetnosti, a na radionicama zajedno treniramo fokus, budimo kreativnost i pronalazimo tišinu u pokretu. ✨ Ako ti treba pauza od brzog sveta - dođi da ušijemo malo mira zajedno. 🧶💖",
    usluge: ["rucnopravljeno"],
    linkovi: [{ vrsta: "instagram", url: "https://www.instagram.com/tvoja.vezica", label: "@tvoja.vezica" }],
    foto: `${FOTO}/katarina-dimitrijevic.jpg`,
  },
  {
    slug: "tijana-dabic",
    ime: "Tijana Dabić",
    brend: "Tradigital platforma",
    opis: "Hello! Ja sam Tijana Dabić - osnivač Tradigital kurseva jezika, online platforme namenjene početnicima i lažnim početnicima koji žele da savladaju engleski jezik na svoj način i u svom ritmu. Kursevi rade na svim uređajima i možete ih raditi bilo kada i bilo gde. Spojila sam najbolje iz tradicionalne nastave sa prednostima digitalnog formata i stvorila prostor u kojem vas ja - bukvalno - čekam. Vodim vas kroz lekciju, objašnjavam, ohrabrujem i pružam podršku na maternjem jeziku. Kao doktor metodike, bivši dekan i autor više od 15 udžbenika, utkala sam u ovu platformu godine znanja i iskustva - sa ciljem da učenje bude jasno, prijatno i osnažujuće.",
    usluge: ["engleski"],
    linkovi: [{ vrsta: "web", url: "https://kurs.tradigitalenglishteacher.com/", label: "tradigitalenglishteacher.com" }],
    foto: `${FOTO}/tijana-dabic.jpg`,
  },
  {
    slug: "jelena-ivancevic",
    ime: "Jelena Ivančević",
    brend: "Mind Your Own Business English",
    opis: "Kroz koncept „Mind Your Own Business English“ nudim individualne i potpuno prilagođene časove poslovnog engleskog za profesionalce koji već govore engleski, ali žele da zvuče samouverenije, prirodnije i tečnije u poslovnim situacijama. Moja nastava je zasnovana na realnim primerima iz poslovnog sveta - sastanci, mejlovi, prezentacije, intervjui, pregovaranje i (svima neophodni) small talk. Sa više od deset godina iskustva u globalnim kompanijama i formalnim obrazovanjem iz engleskog jezika i književnosti, spajam korporativno iskustvo i lingvističko znanje u praktičan, efikasan pristup učenju.",
    usluge: ["engleski"],
    email: "jelena.of.p@gmail.com",
    linkovi: [
      { vrsta: "instagram", url: "https://www.instagram.com/mind.your.own.business.english/", label: "@mind.your.own.business.english" },
    ],
    foto: `${FOTO}/jelena-ivancevic.jpg`,
  },
  {
    slug: "slatka-teglica",
    ime: "Slavica",
    brend: "Slatka teglica",
    opis: "Zdravo svima 🙂 Moje ime je Slavica i ja sam idejni tvorac Slatke teglice. U Slatkoj teglici stvaramo one ukuse koje je nekad pravila i vaša baka - da vas podsetimo na najlepše ukuse detinjstva. Naši proizvodi ne sadrže konzervanse, veštačke boje niti bilo kakve druge nepotrebne dodatke. Kad biste imali vremena i prostora, verovatno biste takve džemove, slatka, sokove, zimnicu i namaze napravili sami za svoju porodicu. Umesto toga, tu smo mi - da to uradimo za vas, s istom pažnjom i ljubavlju. 💛 U velikim gradovima vršimo dostavu na kućnu adresu, a za firme pripremamo korporativne poklone i poklone za zaposlene. Do sada smo imali više od 3500 zadovoljnih kupaca i sarađivali sa preko 150 kompanija.",
    usluge: ["rucnopravljeno"],
    telefoni: ["+381 62 968 6847"],
    linkovi: [{ vrsta: "instagram", url: "https://www.instagram.com/slatka_teglica/", label: "@slatka_teglica" }],
    foto: `${FOTO}/slatka-teglica.jpg`,
  },
  {
    slug: "ana-stanojevic",
    ime: "Ana Stanojević",
    brend: "AS Virtual Assistant",
    opis: "Zdravo, ja sam Ana, vaša virtuelna podrška za finansije, ljudske resurse i administraciju. Pomažem preduzetnicima, mikro i malim firmama da organizuju i pojednostave svakodnevne poslove, uvedu red u papirologiju, tokove dokumentacije i evidencije, imaju jasan uvid u finansije, obaveze i zakonske rokove - i oslobode svoje vreme za aktivnosti koje donose profit i rast.",
    usluge: ["virtualniasistent"],
    email: "office@as-virtualassistant.com",
    linkovi: [{ vrsta: "linkedin", url: "https://www.linkedin.com/in/ana-stanojevicva", label: "LinkedIn" }],
    foto: `${FOTO}/ana-stanojevic.jpg`,
  },
];
