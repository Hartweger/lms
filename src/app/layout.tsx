import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigacija from "@/components/Navigacija";
import Footer from "@/components/Footer";

const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
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
};

export const metadata: Metadata = {
  title: "Hartweger — Škola nemačkog jezika",
  description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
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
        <Navigacija />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
