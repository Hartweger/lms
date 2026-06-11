import type { Metadata } from "next";
import MasterclassReci from "./MasterclassReci";

export const metadata: Metadata = {
  title: "Besplatan masterclass: Kako da naučiš reči na stranom jeziku | Hartweger",
  description:
    "Besplatan masterclass Nataše Hartweger — praktične taktike kako da lakše i efikasnije pamtiš reči na nemačkom. Ostavi mejl i odmah gledaj snimak + materijali.",
  alternates: { canonical: "https://www.hartweger.rs/masterclass-reci" },
  openGraph: {
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Hartweger — Škola nemačkog jezika" }],
    title: "Kako da (na)učiš reči na stranom jeziku — besplatan masterclass",
    description:
      "Praktične taktike kako da lakše pamtiš reči na nemačkom. Kartice, mape uma, aplikacije i obnavljanje. Besplatno — ostavi mejl i gledaj odmah.",
    url: "https://www.hartweger.rs/masterclass-reci",
    siteName: "Hartweger",
    type: "website",
  },
};

export default function MasterclassReciPage() {
  return <MasterclassReci />;
}
