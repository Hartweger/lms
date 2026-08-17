import type { Metadata } from "next";

// Dečji deo ima svoj papirni okvir, odvojen od ostatka platforme. Podloga je
// topao papir, a ne beli ekran, jer se ceo zack drži tog jednog utiska.
export const metadata: Metadata = {
  // Adresa sadrži ključ deteta, pa ovim stranicama nije mesto u pretrazi.
  robots: { index: false, follow: false },
};

export default function ZackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#16161A]">
      {/* Uža kolona nego inače: ovo se čita na telefonu u ruci, a na širem
          ekranu ne sme da se razvuče u traku preko celog monitora. */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}
