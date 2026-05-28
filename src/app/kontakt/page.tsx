import type { Metadata } from "next";
import KontaktForma from "@/components/KontaktForma";

export const metadata: Metadata = {
  title: "Kontakt — Hartweger škola nemačkog jezika",
  description: "Pošaljite nam poruku — pitanja o kursevima, plaćanju ili saradnji.",
};

export default function KontaktPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4 font-montserrat">Kontakt</h1>
      <p className="text-gray-600 mb-8 text-lg">
        Imate pitanje ili potrebu? Popunite formu ispod i javićemo vam se u najkraćem roku.
      </p>
      <div className="max-w-2xl">
        <KontaktForma />
      </div>
    </div>
  );
}
