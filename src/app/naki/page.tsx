import type { Metadata } from "next";
import NakiChat from "@/components/naki/NakiChat";

export const metadata: Metadata = {
  title: "NaKI — AI asistent za nemački | Hartweger",
  description:
    "NaKI je AI asistent Nataše Hartweger za učenje nemačkog jezika. Postavi pitanje, vežbaj gramatiku i dobij objašnjenja na srpskom — besplatno.",
};

export default function NakiPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto mb-5 max-w-xl text-center">
        <h1 className="font-heading mb-2 text-2xl font-bold text-gray-900">
          NaKI — tvoj AI asistent za nemački
        </h1>
        <p className="text-sm text-gray-500">
          Pitaj bilo šta o nemačkom jeziku. Objašnjavam na srpskom, Natašinim stilom.
        </p>
      </div>
      <NakiChat />
    </main>
  );
}
