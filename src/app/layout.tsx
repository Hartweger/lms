import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigacija from "@/components/Navigacija";
import Footer from "@/components/Footer";

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
  title: "Hartweger — Škola nemačkog jezika",
  description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hartweger",
  },
  openGraph: {
    title: "Hartweger — Škola nemačkog jezika",
    description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "/logo.jpg", width: 400, height: 114, alt: "Hartweger logo" }],
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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KNP5DKDR"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Navigacija />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KNP5DKDR');`,
          }}
        />
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
