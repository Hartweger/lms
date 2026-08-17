import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Lato, Montserrat } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigacija from "@/components/Navigacija";
import SakrijNa from "@/components/SakrijNa";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import SmileWidget from "@/components/naki/SmileWidget";
import PromoBar from "@/components/PromoBar";
import AttributionTracker from "@/components/AttributionTracker";
import MetaPixel from "@/components/MetaPixel";

// Google Ads konverzije. Bez ovoga Ads nema sopstveni signal - konverzije stižu
// samo uvezene iz GA4, koji zbog Consent Mode-a ne vidi posetioce bez saglasnosti
// (mereno 11.08.2026: 271 klik -> 113 sesija). Sa AW tagom Google modeluje i te.
// Prazno = tag se ne emituje, ponašanje ostaje kao pre.
const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID ?? "";

/**
 * Jedno pravilo za oba Google skripta: na dečjem delu se merenje ne pali.
 * Provera je u samom skriptu, a ne kroz `SakrijNa`, jer se oba izvršavaju pre
 * nego što React zna rutu - za `beforeInteractive` klijentska komponenta stiže
 * prekasno. Ista provera i za `lazyOnload`, da ne postoje dva pravila.
 *
 * Poklapa i „/zack" i „/zack/...", a ne „/zackara".
 */
const ZACK_PUTANJA = `(location.pathname === '/zack' || location.pathname.indexOf('/zack/') === 0)`;

const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-lato",
});

// Samo težine koje se stvarno koriste (semibold 600 + bold 700) - svaka težina
// je ~2 preload woff2 fajla na kritičnoj putanji prvog rendera na mobilnom.
// h1 u magazin prose (800) se sintetizuje iz 700 - vizuelno zanemarljivo.
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4fb1d3",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hartweger.rs"),
  title: "Hartweger - Škola nemačkog jezika",
  description: "Nauči nemački online - video kursevi, grupna i individualna nastava sa profesorkom Natašom Hartweger. Testiraj nivo besplatno i kreni odmah.",
  manifest: "/manifest.json",
  alternates: { canonical: "./" },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hartweger",
  },
  openGraph: {
    title: "Hartweger - Škola nemačkog jezika",
    description: "Nauči nemački online - video kursevi, grupna i individualna nastava sa profesorkom Natašom Hartweger. Testiraj nivo besplatno i kreni odmah.",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hartweger - Škola nemačkog jezika",
    description: "Nauči nemački online - video kursevi, grupna i individualna nastava sa profesorkom Natašom Hartweger. Testiraj nivo besplatno i kreni odmah.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sentry ingest se zove rano iz instrumentation-client - preconnect štedi
  // DNS+TLS handshake (Lighthouse procena ~370ms na sporom 4G).
  preconnect("https://o4511456054673408.ingest.de.sentry.io");
  return (
    <html lang="sr" className={`${lato.variable} ${montserrat.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#glavni"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-plava-dark focus:shadow-lg focus:ring-2 focus:ring-plava-dark"
        >
          Preskoči na sadržaj
        </a>
        {/* Google Consent Mode v2 - mora pre GTM-a. Inline skript ne može da importuje TS,
            pa je ključ 'cookie-consent' hardkodiran: mora ostati u sinhronizaciji sa CONSENT_KEY iz src/lib/consent.ts

            DEČJI DEO: na /zack se NE konfiguriše nijedna destinacija (nema
            gtag('js') ni gtag('config')), pa gtag.js nema kome da šalje, i
            window.gtag se uopšte ne postavlja - da ni jedan budući ubačen
            isečak nema odakle da pošalje događaj sa dečjeg dela. Provera je u
            samom skriptu, a ne kroz SakrijNa: ovaj skript ide
            beforeInteractive, dakle pre nego što React uopšte zna koja je ruta,
            pa ga klijentska komponenta ne bi stigla da spreči.
            Sam gtag('consent','default') sme da ostane i tamo - on ništa ne
            šalje, samo upisuje podrazumevano „odbijeno" u dataLayer.
            Zbog toga je sve u IIFE: bez njega bi `function gtag` sam po sebi
            postao window.gtag, ma gde stajao. Van /zack ponašanje je isto kao
            pre, uključujući redosled upisa u dataLayer. */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function () {
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem('cookie-consent') === 'granted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
} catch (e) {}
if (${ZACK_PUTANJA}) return;
window.gtag = gtag;
gtag('js', new Date());
gtag('config', 'G-MB9DRXVVF6');${ADS_ID ? `
gtag('config', '${ADS_ID}', { allow_enhanced_conversions: true });` : ""}
})();`,
          }}
        />
        {/* Dečji deo (/zack) je zaseban brend i namerno nema ništa od školskog
            okvira: ni promo traku, ni navigaciju sa Hartweger logotipom, ni
            podnožje, ni prodajnog asistenta. Natašino ime stoji na roditeljskoj
            strani, gde gradi poverenje, i nigde više. */}
        <SakrijNa prefiksi={["/zack"]}>
          <PromoBar />
        </SakrijNa>
        <SakrijNa prefiksi={["/clanstvo", "/zack"]}>
          <Navigacija />
        </SakrijNa>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "@id": "https://www.hartweger.rs/#organization",
                name: "Centar za nemački jezik Hartweger",
                alternateName: "Hartweger - Škola nemačkog jezika",
                description:
                  "Online škola nemačkog jezika sa sertifikovanim profesorima. Video kursevi, grupna i individualna nastava od A1 do C1 nivoa po VoKuM metodi.",
                url: "https://www.hartweger.rs",
                logo: "https://www.hartweger.rs/logo.jpg",
                image: "https://www.hartweger.rs/og/share.png",
                email: "info@hartweger.rs",
                knowsLanguage: ["de", "sr"],
                areaServed: ["RS", "BA", "ME", "HR", "DE", "AT", "CH"],
                founder: {
                  "@type": "Person",
                  name: "Nataša Hartweger",
                  url: "https://www.hartweger.rs/o-natasi",
                  sameAs: ["https://natasahartweger.rs"],
                },
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Jurija Gagarina 20",
                  addressLocality: "Novi Beograd",
                  postalCode: "11070",
                  addressCountry: "RS",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "info@hartweger.rs",
                  contactType: "customer support",
                  availableLanguage: ["sr", "de"],
                },
                sameAs: [
                  "https://www.instagram.com/hartweger_centar/",
                  "https://www.youtube.com/@NatasaHartweger",
                  "https://www.facebook.com/hartwegercentar/",
                  "https://rs.linkedin.com/in/natasahartweger",
                  "https://x.com/nacapaun",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://www.hartweger.rs/#website",
                name: "Hartweger - Škola nemačkog jezika",
                url: "https://www.hartweger.rs",
                inLanguage: "sr-RS",
                publisher: { "@id": "https://www.hartweger.rs/#organization" },
              },
            ]),
          }}
        />
        <main id="glavni" className="flex-1">{children}</main>
        {/* Članstvo ima svoj ClanstvoFooter (clanstvo/layout.tsx) - školski
            footer sa kursevima i bankarskim logotipima tamo nema smisla. */}
        <SakrijNa prefiksi={["/clanstvo", "/zack"]}>
          <Footer />
        </SakrijNa>
        {/* Smile je prodajni asistent za odrasle. Detetu nema šta da ponudi. */}
        <SakrijNa prefiksi={["/zack"]}>
          <SmileWidget />
        </SakrijNa>
        {/* Dete pravno ne može da da saglasnost za kolačiće, pa mu se traka ne
            pokazuje. Iz istog razloga se na /zack ne pali ni reklamni piksel ni
            Google merenje: gtag.js se ne učita i nijedna destinacija se ne
            konfiguriše (vidi provere putanje uz oba gtag skripta).
            Koliko se deca vraćaju meri se iz naših tabela (zaradjena_at,
            poslednje_tacno_at, niz dana). Kad roditeljski nalog sa pristankom
            bude gotov, ovo se preispituje. */}
        <SakrijNa prefiksi={["/zack"]}>
          <CookieBanner />
        </SakrijNa>
        {/* Praćenje izvora posete piše kolačić hw_attr sa rokom od 90 dana.
            Detetu se ne piše: ono ništa ne kupuje, pa nema ni porudžbine kojoj
            bi se izvor pripisao, a marketinški kolačić na dečjem delu nema kome
            da se opravda. */}
        <SakrijNa prefiksi={["/zack"]}>
          <AttributionTracker />
        </SakrijNa>
        <SakrijNa prefiksi={["/zack"]}>
          <MetaPixel />
        </SakrijNa>
        <Analytics />
        <SpeedInsights />
        {/* lazyOnload (kao Meta Pixel): gtag.js je 176KB i ne sme da se nadmeće
            sa prvim renderom na mobilnom; dataLayer stub iz consent skripta
            baferuje evente dok se gtag.js ne učita.
            PAŽNJA: gtag('js')/gtag('config') se REDAJU u consent-default skriptu
            (beforeInteractive) - moraju u dataLayer PRE bilo kog eventa (npr.
            purchase na hvala strani pri hidraciji), inače gtag.js odbacuje
            evente bez konfigurisane destinacije. Ovde se samo učitava biblioteka.

            Biblioteka se na /zack ne učitava uopšte. Zato ovde stoji inline
            skript koji sam ubacuje <script src>, umesto `src` na Script
            komponenti: `src` bi krenuo bez obzira na rutu, a provera putanje
            mora da bude ista kao u consent skriptu - jedno pravilo, ne dva. */}
        <Script
          id="ga4-gtag"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `if (!${ZACK_PUTANJA}) {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-MB9DRXVVF6';
  document.head.appendChild(s);
}`,
          }}
        />
      </body>
    </html>
  );
}
