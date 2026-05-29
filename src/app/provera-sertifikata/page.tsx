import type { Metadata } from "next";
import ProveraForma from "./ProveraForma";

export const metadata: Metadata = {
  title: "Provera sertifikata — Hartweger",
  description: "Proverite validnost sertifikata iz Hartweger škole nemačkog jezika.",
  openGraph: {
    title: "Provera sertifikata — Hartweger",
    description: "Proverite validnost sertifikata iz Hartweger škole nemačkog jezika.",
  },
};

export default function ProveraSertifikataPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Provera sertifikata
          </h1>
          <p className="text-gray-600 text-lg">
            Unesite kod sertifikata da proverite njegovu validnost.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <ProveraForma />
      </section>
    </>
  );
}
