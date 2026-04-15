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
      <body className="min-h-screen flex flex-col">
        <Navigacija />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
