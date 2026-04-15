import type { Metadata } from "next";
import "./globals.css";
import Navigacija from "@/components/Navigacija";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Hartweger — Škola nemačkog jezika",
  description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
  openGraph: {
    title: "Hartweger — Škola nemačkog jezika",
    description: "Naučite nemački jezik online — video kursevi, individualna i grupna nastava",
    locale: "sr_RS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navigacija />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
