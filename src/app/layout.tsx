import type { Metadata } from "next";
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

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
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
  description: "Naučite nemački jezik online - video kursevi, individualna i grupna nastava",
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
    description: "Naučite nemački jezik online - video kursevi, individualna i grupna nastava",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hartweger - Škola nemačkog jezika",
    description: "Naučite nemački jezik online - video kursevi, individualna i grupna nastava",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
} catch (e) {}`,
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
        <Script
          id="ga4-gtag"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-MB9DRXVVF6"
        />
        <Script
          id="ga4-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MB9DRXVVF6');`,
          }}
        />
      </body>
    </html>
  );
}
