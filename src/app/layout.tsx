import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Lato, Montserrat } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigacija from "@/components/Navigacija";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import SmileWidget from "@/components/naki/SmileWidget";
import PromoBar from "@/components/PromoBar";
import AttributionTracker from "@/components/AttributionTracker";
import MetaPixel from "@/components/MetaPixel";

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
            pa je ključ 'cookie-consent' hardkodiran: mora ostati u sinhronizaciji sa CONSENT_KEY iz src/lib/consent.ts */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
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
gtag('js', new Date());
gtag('config', 'G-MB9DRXVVF6');`,
          }}
        />
        <PromoBar />
        <Navigacija />
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
        <Footer />
        <SmileWidget />
        <CookieBanner />
        <AttributionTracker />
        <MetaPixel />
        <Analytics />
        <SpeedInsights />
        {/* lazyOnload (kao Meta Pixel): gtag.js je 176KB i ne sme da se nadmeće
            sa prvim renderom na mobilnom; dataLayer stub iz consent skripta
            baferuje evente dok se gtag.js ne učita.
            PAŽNJA: gtag('js')/gtag('config') se REDAJU u consent-default skriptu
            (beforeInteractive) - moraju u dataLayer PRE bilo kog eventa (npr.
            purchase na hvala strani pri hidraciji), inače gtag.js odbacuje
            evente bez konfigurisane destinacije. Ovde se samo učitava biblioteka. */}
        <Script
          id="ga4-gtag"
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-MB9DRXVVF6"
        />
      </body>
    </html>
  );
}
