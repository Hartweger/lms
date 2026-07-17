import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { legacyBlogSlugs } from "./src/lib/legacyBlogSlugs";

// CSP u REPORT-ONLY režimu (audit jul 2026): ništa ne blokira, samo prijavljuje
// prekršaje u Sentry (Security feed). Posle ~nedelju dana pregledati prijave pa
// prebaciti na pravi Content-Security-Policy header (enforce).
// 'unsafe-inline' u script-src je nužan: Next App Router ubacuje inline skripte,
// a statičke/ISR strane ne mogu nonce. CSP ovde pre svega ograničava SPOLJNE izvore.
// NAPOMENA: novi spoljni servis = dodati domen ovde, inače će (posle enforce-a) biti blokiran.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // GA4, Meta Pixel, Turnstile, Vimeo player API; blog kalkulator je inline (pokriven unsafe-inline)
  // 17.07: Sentry prijava 5b282137 (wasm-eval na /naki, 1 posetilac) = browser ekstenzija;
  // naš kod ne koristi WebAssembly, a Turnstile wasm vrti u svom iframe-u (challenges.cloudflare.com)
  // pod svojim CSP-om - 'wasm-unsafe-eval' NAMERNO ne dodajemo.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com https://player.vimeo.com",
  // 17.07: + www.gstatic.com po Sentry prijavi 46de38f2 - Chrome ugrađeni prevodilac stranice
  // (translate_http) ubacuje CSS sa gstatic.com; legitimna funkcija (dijaspora prevodi blog),
  // ponavljaće se kod raznih posetilaca - mora da radi i posle enforce-a
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // slike dolaze sa mnogo strana (Supabase, vumbnail, ytimg, tracking pikseli) - https: je svesni kompromis
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://rzmyglynjcygsbicssbt.supabase.co",
  // Dopune po Sentry CSP prijavama 12.07: connect.facebook.net (fbevents fetch ka svom domenu),
  // analytics.google.com + region1.* (GA4 beaconi), stats.g.doubleclick.net + www.google.* (GA4
  // Google signals ping, TLD zavisi od zemlje posetioca - dodate zemlje publike, ostale će u report)
  // 12.07 uveče: + ceo ex-Yu (ba po Sentry prijavi f4d9cdf1, me/hr/si/mk preventivno - ista publika)
  // 12.07 kasnije: + nl (Sentry prijava 919398bd, posetilac iz Holandije - dijaspora)
  // 17.07: + translate.googleapis.com i translate-pa.googleapis.com PREVENTIVNO - deo istog
  // Chrome-prevodilac toka kao gstatic CSS gore (prevod ide fetch-om iz konteksta stranice);
  // sam skript prevodioca ubacuje browser privilegovano pa script-src ne treba menjati
  "connect-src 'self' https://rzmyglynjcygsbicssbt.supabase.co wss://rzmyglynjcygsbicssbt.supabase.co https://translate.googleapis.com https://translate-pa.googleapis.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.google.com https://www.google.rs https://www.google.de https://www.google.at https://www.google.ch https://www.google.ba https://www.google.me https://www.google.hr https://www.google.si https://www.google.mk https://www.google.nl https://www.googletagmanager.com https://*.ingest.de.sentry.io https://challenges.cloudflare.com https://connect.facebook.net https://graph.facebook.com https://www.facebook.com https://vumbnail.com",
  // lekcijski embedovi + Turnstile + YouTube/Vimeo + Google mape na kontaktu.
  // 'self' + supabase + drive po Sentry prijavama 12.07: PdfBlock/LekcijaContent iframe-uju
  // PDF-ove sa Supabase Storage (117 lekcija) i Google Drive embede (6 lekcija)
  "frame-src 'self' https://rzmyglynjcygsbicssbt.supabase.co https://drive.google.com https://player.vimeo.com https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://quizlet.com https://*.quizlet.com https://wordwall.net https://*.wordwall.net https://learningapps.org https://www.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // prijave idu u Sentry → Security
  "report-uri https://o4511456054673408.ingest.de.sentry.io/api/4511456059326544/security/?sentry_key=4888c4f4fdf635c39c792f36efd16896",
].join("; ");

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      { hostname: "rzmyglynjcygsbicssbt.supabase.co" },
      { hostname: "*.supabase.co" },
      { hostname: "www.hartweger.rs" },
      { hostname: "vumbnail.com" },
    ],
    // Transformacija se naplaćuje po jedinstvenoj kombinaciji (slika + širina + format).
    // Duži keš = ista slika se ne transformiše iznova (30 dana umesto podrazumevana 4h).
    minimumCacheTTL: 2592000,
    // Najveća slika na sajtu je ~800px (hero/ImageBlock). Skidamo ogromne retina širine
    // (2048/3840) koje nikad ne treba - manje varijanti = manje transformacija.
    deviceSizes: [640, 750, 828, 1080, 1920],
    imageSizes: [128, 256, 384],
  },
  async redirects() {
    return [
      // Audio ispitnih vežbi preseljen na Supabase Storage (12.07.2026, bucket lekcije-media).
      // Baza je ažurirana na pune URL-ove; redirect čuva stare linkove iz otvorenih tabova/keša.
      {
        source: "/audio/:path*",
        destination:
          "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/lekcije-media/audio/:path*",
        permanent: true,
      },
      { source: "/korpa", destination: "/kursevi", permanent: true },
      { source: "/moj-nalog", destination: "/nalog", permanent: true },
      { source: "/prodavnica", destination: "/kursevi", permanent: true },
      { source: "/video-kursevi", destination: "/kursevi", permanent: true },
      { source: "/plan-ucenja", destination: "/kursevi", permanent: true },
      { source: "/clanice", destination: "https://www.natasahartweger.rs/clanice", permanent: false },
      // Digitalno preduzetništvo = lični brend → natasahartweger.rs
      { source: "/nh-academy", destination: "https://www.natasahartweger.rs/academy", permanent: false },
      { source: "/za-preduzetnice", destination: "https://www.natasahartweger.rs", permanent: false },
      { source: "/magazin/strucno-usavrsavanje-kada-posao-preraste-vlasnika-i-zasto-je-podrska-kljucna", destination: "https://www.natasahartweger.rs/blog/strucno-usavrsavanje-kada-posao-preraste-vlasnika-i-zasto-je-podrska-kljucna", permanent: false },
      { source: "/cesto-postavljena-pitanja", destination: "/faq", permanent: true },
      { source: "/opsti-uslovi-poslovanja", destination: "/uslovi", permanent: true },
      { source: "/naki-ai-asistent-nemacki", destination: "/naki", permanent: true },
      { source: "/kurs/kako-uciti-reci", destination: "/masterclass-reci", permanent: true },

      // WP landing pages
      { source: "/ispit-a1", destination: "/", permanent: true },
      { source: "/dobraskolajezika", destination: "/magazin/dobraskolajezika", permanent: true },
      { source: "/najbolje-za-sebe", destination: "/magazin/najbolje-za-sebe", permanent: true },

      // Stare WP taksonomije (Yoast sitemap audit): blog kategorije/tagovi/autor → magazin, nivo → kursevi
      { source: "/category/:path*", destination: "/magazin", permanent: true },
      { source: "/tag/:path*", destination: "/magazin", permanent: true },
      { source: "/author/:path*", destination: "/magazin", permanent: true },
      { source: "/nivo/:path*", destination: "/kursevi", permanent: true },
      // pa_tip-kursa taksonomija (nova u sitemap-u, /tip-kursa/grupni...) → kursevi
      { source: "/tip-kursa/:path*", destination: "/kursevi", permanent: true },

      // Stari WP blog: root-level tekstovi (/<slug>) → /magazin/<slug>
      // Samo "čisti" slugovi (a-z, 0-9, -); slugovi sa %-encoded znakovima (npr. emoji)
      // se preskaču jer ruše path-to-regexp pattern.
      ...legacyBlogSlugs
        .filter((slug) => /^[a-z0-9-]+$/.test(slug))
        .map((slug) => ({
          source: `/${slug}`,
          destination: `/magazin/${slug}`,
          permanent: true,
        })),
      // Stari emoji URL ovog teksta (slug očišćen u bazi) → nova čista adresa
      { source: "/zenski-rod-u-nemackom-jeziku-sta-je-sve-die-%f0%9f%8c%b8", destination: "/magazin/zenski-rod-u-nemackom-jeziku-sta-je-sve-die", permanent: true },
      { source: "/o-nama", destination: "/o-natasi", permanent: true },
      { source: "/moja-metodologija", destination: "/metodologija", permanent: true },
      { source: "/o-metodi", destination: "/metodologija", permanent: true },
      { source: "/kursevi-nemackog", destination: "/kursevi", permanent: true },

      // Stare WP stranice (page-sitemap audit)
      { source: "/kursevi-nemackog/grupni-kursevi", destination: "/grupni-kursevi", permanent: true },
      { source: "/kursevi-nemackog/individualni-kursevi", destination: "/individualni-kursevi", permanent: true },
      { source: "/kursevi-nemackog/video-kursevi", destination: "/kursevi", permanent: true },
      { source: "/kursevi-nemackog/besplatno", destination: "/besplatno-testiranje", permanent: true },
      { source: "/kurs-nemackog-jezika-a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/paket-od-a1-do-b1", destination: "/kursevi/paket-a1-a2-b1", permanent: true },
      { source: "/raspored-grupnih-kurseva", destination: "/raspored", permanent: true },
      { source: "/placanje-platnom-karticom", destination: "/uslovi", permanent: true },
      { source: "/od-individualne-do-grupne-nastave", destination: "/kursevi", permanent: true },
      { source: "/kurs-nemackog-jezika-za-firme-vokum-metoda", destination: "/metodologija", permanent: true },
      { source: "/instructor-dashboard", destination: "/dashboard", permanent: true },
      // 🏆 "naša zajednica – top polaznici" (leaderboard) — gasi se, na naslovnu
      { source: "/%f0%9f%8f%86-nasa-zajednica-top-polaznici", destination: "/", permanent: true },

      // Stari LearnDash kurs URL-ovi (GA audit 2026-06-11): /kursevi/<stari-slug>
      // padali na novi /kursevi/[slug] route kao 404. Slugovi NE postoje kao novi proizvodi.
      { source: "/kursevi/testiranje/:path*", destination: "/besplatno-testiranje", permanent: true },
      { source: "/kursevi/a1-1-online-kurs/:path*", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/kursevi/a1-2/:path*", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/kursevi/a2-1/:path*", destination: "/kursevi/video-kurs-a2", permanent: true },
      { source: "/kursevi/a2-2/:path*", destination: "/kursevi/video-kurs-a2", permanent: true },
      { source: "/kursevi/b1-1/:path*", destination: "/kursevi/video-kurs-b1", permanent: true },
      { source: "/kursevi/b1-2/:path*", destination: "/kursevi/video-kurs-b1", permanent: true },
      { source: "/kursevi/polozi-fsp/:path*", destination: "/kursevi/fsp", permanent: true },
      { source: "/kursevi/kako-da-ucis-reci/:path*", destination: "/masterclass-reci", permanent: true },

      // Broken-link audit (2026-06-24): interni linkovi iz migriranog blog/kurs sadržaja
      // koji su padali na 404. Ciljevi provereni naspram sitemap-a (živi 200).
      // -- blog tekstovi pogrešno pod /kursevi/ → /magazin/
      { source: "/kursevi/dass-recenice-u-nemackom-jeziku", destination: "/magazin/dass-recenice-u-nemackom-jeziku", permanent: true },
      { source: "/kursevi/weil-recenice", destination: "/magazin/weil-recenice", permanent: true },
      { source: "/kursevi/modalni-glagoli-u-nemackom-jeziku-kroz-najkorisnije-primere", destination: "/magazin/modalni-glagoli-u-nemackom-jeziku-kroz-najkorisnije-primere", permanent: true },
      { source: "/kursevi/odredjivanje-roda-imenice-u-nemackom-jeziku", destination: "/magazin/odredjivanje-roda-imenice-u-nemackom-jeziku", permanent: true },
      { source: "/kursevi/najbolje-za-sebe", destination: "/magazin/najbolje-za-sebe", permanent: true },
      // -- blog tekstovi koji NISU migrirani (nema posta) → /magazin lista
      { source: "/dete-i-mobilni-telefon-da-ili-ne", destination: "/magazin", permanent: true },
      { source: "/kursevi/dete-i-mobilni-telefon-da-ili-ne", destination: "/magazin", permanent: true },
      { source: "/blog", destination: "/magazin", permanent: true },
      { source: "/blog/:path*", destination: "/magazin", permanent: true },
      // -- stari kurs/proizvod slugovi → tačne kurs stranice
      { source: "/kursevi/polozi-fide-ispit", destination: "/kursevi/polozi-fide", permanent: true },
      { source: "/kursevi/polozi-goethe-b1-sa-natasom-i-katarinom", destination: "/kursevi/polozi-goethe-b1", permanent: true },
      { source: "/kursevi/polozi-geothe-c1", destination: "/kursevi/polozi-goethe-c1", permanent: true },
      { source: "/kursevi/video-polozi-goethe-b2-sa-natasom-i-ankom", destination: "/kursevi", permanent: true },
      { source: "/kursevi/kurs-nemackog-jezika-video-kurs-a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/kursevi/fsp-pripremni-kurs", destination: "/kursevi/fsp", permanent: true },
      { source: "/kursevi/grupni-kurs-nemackog-jezika-a1-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a1-2-2", permanent: true },
      { source: "/kursevi/grupni-kurs-nemackog-jezika-b2-1-b2-2", destination: "/grupni-kursevi", permanent: true },
      { source: "/kursevi/individualni-kurs-b2-poslednji-korak-do-b2-sertifikata", destination: "/kursevi/individualni-kurs-nemackog-jezika-b2-1", permanent: true },
      { source: "/kursevi/progovori", destination: "/kursevi/grupni-konverzacijski-kurs-nemackog-b1", permanent: true },
      { source: "/kursevi/a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/kursevi/nivo-a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      // -- generičke kurs liste
      { source: "/kursevi/video-kursevi", destination: "/kursevi", permanent: true },
      { source: "/kursevi/individualni-kursevi", destination: "/individualni-kursevi", permanent: true },
      { source: "/kursevi/individualni", destination: "/individualni-kursevi", permanent: true },
      { source: "/kursevi/grupni", destination: "/grupni-kursevi", permanent: true },
      { source: "/casovi-nemackog-11", destination: "/individualni-kursevi", permanent: true },
      { source: "/onlajn-kursevi-nemackog-u-grupi", destination: "/grupni-kursevi", permanent: true },
      { source: "/besplatni-kurs", destination: "/kursevi", permanent: true },
      { source: "/medicinski-nemacki", destination: "/kursevi/fsp", permanent: true },
      { source: "/kupovina/grupni-a2", destination: "/grupni-kursevi", permanent: true },
      { source: "/nastim", destination: "/o-natasi", permanent: true },
      { source: "/kursevi/od-individualne-do-grupne-nastave-skaliraj-svoj-biznis", destination: "https://natasahartweger.rs", permanent: true },

      // Stare samostalne LearnDash lekcije/testovi (root-level)
      { source: "/lekcije/:path*", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/testovi/:path*", destination: "/besplatno-testiranje", permanent: true },

      // Lični brend → natasahartweger.rs (eksterni redirect)
      { source: "/nh-academy", destination: "https://natasahartweger.rs/academy", permanent: true },
      { source: "/trening-uzivo-kreiraj-kurs-koji-se-voli", destination: "https://natasahartweger.rs/academy", permanent: true },
      { source: "/claude-vodic", destination: "https://natasahartweger.rs", permanent: true },
      { source: "/kursevi-nemackog/za-preduzetnice", destination: "https://natasahartweger.rs", permanent: true },
      { source: "/kategorija-proizvoda/za-preduzetnice", destination: "https://natasahartweger.rs", permanent: true },

      // Proizvod-kategorije (product_cat) → liste kurseva (za-preduzetnice je gore, pre catch-all)
      { source: "/kategorija-proizvoda/grupni-kursevi/:path*", destination: "/grupni-kursevi", permanent: true },
      { source: "/kategorija-proizvoda/individualni-kursevi/:path*", destination: "/individualni-kursevi", permanent: true },
      { source: "/kategorija-proizvoda/video-kursevi/:path*", destination: "/kursevi", permanent: true },
      { source: "/kategorija-proizvoda/:path*", destination: "/kursevi", permanent: true },

      // WP product URLs → new course URLs
      { source: "/proizvod/kurs-nemackog-jezika-video-kurs-a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/proizvod/osnovna-ponuda-kurs-nemackog-jezika-a2", destination: "/kursevi/video-kurs-a2", permanent: true },
      { source: "/proizvod/osnovna-ponuda-kurs-b1", destination: "/kursevi/video-kurs-b1", permanent: true },
      { source: "/proizvod/polozi-goethe-b1", destination: "/kursevi/polozi-goethe-b1", permanent: true },
      { source: "/proizvod/polozi-goethe-b2", destination: "/kursevi", permanent: true },
      { source: "/proizvod/polozi-c1", destination: "/kursevi/polozi-goethe-c1", permanent: true },
      { source: "/proizvod/gramatika-a2-b1", destination: "/kursevi/gramatika-a2-b1", permanent: true },
      { source: "/proizvod/kurs-za-mame", destination: "/kursevi/kurs-za-mame-i-trudnice", permanent: true },
      { source: "/proizvod/polozi-fide", destination: "/kursevi/polozi-fide", permanent: true },
      { source: "/proizvod/polozi-fsp", destination: "/kursevi/fsp", permanent: true },
      { source: "/proizvod/paket-a1-a2", destination: "/kursevi/paket-a1-a2", permanent: true },
      { source: "/proizvod/paket-a1-a2-b1", destination: "/kursevi/paket-a1-a2-b1", permanent: true },

      // Grupni
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a1-1", destination: "/kursevi/grupni-kurs-nemackog-jezika-a1-1", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a1-2-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a1-2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a2-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-b1-1-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-b1-1-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-b1-2", destination: "/kursevi/grupni-kurs-nemackog-b1-2", permanent: true },
      { source: "/proizvod/grupni-kurs-b2-1", destination: "/kursevi/grupni-kurs-b2-1", permanent: true },
      { source: "/proizvod/grupni-kurs-b2-2", destination: "/kursevi/grupni-kurs-b2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-c1-1", destination: "/kursevi/grupni-kurs-c1-1", permanent: true },
      { source: "/proizvod/grupni-kurs-c1-2", destination: "/kursevi/grupni-kurs-c1-2", permanent: true },

      // Individualni
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a11", destination: "/kursevi/individualni-kurs-nemackog-jezika-a11", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a1-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a1-2", permanent: true },
      { source: "/proizvod/paket-nivo-a1-a1-1-a1-2-individualni-standard", destination: "/kursevi/paket-nivo-a1-a1-1-a1-2-individualni-standard", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a2-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a2-2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b11", destination: "/kursevi/individualni-kurs-nemackog-jezika-b11", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b1-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-b1-2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b2-1", destination: "/kursevi/individualni-kurs-nemackog-jezika-b2-1", permanent: true },
      { source: "/proizvod/individualni-polozi-fide", destination: "/kursevi/individualni-polozi-fide", permanent: true },
      { source: "/proizvod/fsp-individualni", destination: "/kursevi/fsp-individualni", permanent: true },
      { source: "/proizvod/individualni-mesecni-paketi", destination: "/kursevi/individualni-mesecni-paketi", permanent: true },

      // Živi WP product slugovi (sitemap audit 2026-06-08) koji su se razlikovali
      // od gornjih eksplicitnih → padali na catch-all /kursevi umesto na svoju stranicu
      { source: "/proizvod/fsp", destination: "/kursevi/fsp", permanent: true },
      { source: "/proizvod/fsp-individualni-pripremni-kurs-nemackog-za-lekare", destination: "/kursevi/fsp-individualni", permanent: true },
      { source: "/proizvod/gramatika-nemackog-jezika-a2-b1", destination: "/kursevi/gramatika-a2-b1", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a2-1", destination: "/kursevi/individualni-kurs-nemackog-jezika-a2", permanent: true },
      { source: "/proizvod/individualni-mesecni-paketi-izaberi-profesora-paket-i-kreni", destination: "/kursevi/individualni-mesecni-paketi", permanent: true },
      { source: "/proizvod/kurs-nemackog-za-mame-i-trudnice", destination: "/kursevi/kurs-za-mame-i-trudnice", permanent: true },
      { source: "/proizvod/paket-a1-a2-i-b1", destination: "/kursevi/paket-a1-a2-b1", permanent: true },
      { source: "/proizvod/paket-a1-i-a2", destination: "/kursevi/paket-a1-a2", permanent: true },
      // Duplikat paketa ugašen (is_purchasable=false) → vodi na pravi paket-a1-a2
      { source: "/kursevi/paket-a1-i-a2", destination: "/kursevi/paket-a1-a2", permanent: true },
      // Masterclass „reči" preseljen sa kurs stranice na email-gate landing
      { source: "/kursevi/kako-uciti-reci", destination: "/masterclass-reci", permanent: true },
      { source: "/proizvod/polozi-fide-ispit", destination: "/kursevi/polozi-fide", permanent: true },
      { source: "/proizvod/polozi-goethe-b1-sa-natasom-i-katarinom", destination: "/kursevi/polozi-goethe-b1", permanent: true },
      { source: "/proizvod/polozi-goethe-c1", destination: "/kursevi/polozi-goethe-c1", permanent: true },
      { source: "/proizvod/video-polozi-goethe-b2-sa-natasom-i-ankom", destination: "/kursevi", permanent: true },
      { source: "/proizvod/grupni-kurs-konverzacije-na-nemackom-jeziku-2", destination: "/grupni-kursevi", permanent: true },
      { source: "/proizvod/kako-da-naucis-reci-na-stranom-jeziku", destination: "/kurs/kako-uciti-reci", permanent: true },

      // Lični brend proizvodi (NH Academy / za preduzetnice) → natasahartweger.rs
      { source: "/proizvod/kreiraj-kurs-koji-se-voli", destination: "https://natasahartweger.rs/academy", permanent: true },
      { source: "/proizvod/nh-academy-generacija-i-maj-2026", destination: "https://natasahartweger.rs/academy", permanent: true },
      { source: "/proizvod/od-individualne-do-grupne-nastave-skaliraj-svoj-biznis", destination: "https://natasahartweger.rs", permanent: true },
      { source: "/proizvod/kreiranje-ponude", destination: "https://natasahartweger.rs", permanent: true },

      // Catch-all: any remaining /proizvod/ URLs → /kursevi
      { source: "/proizvod/:slug", destination: "/kursevi", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: 'camera=(), microphone=(self), geolocation=(), fullscreen=(self "https://player.vimeo.com")' },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "hartweger",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
