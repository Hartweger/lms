// NH Membership sekcija - poseban vizuelni identitet, bez školske navigacije
// (root layout sakriva Navigaciju kroz SakrijNa). Obrazac: profesor/layout.tsx.
// PWA: manifest je vezan samo za ovaj segment - članstvo se dodaje na početni
// ekran kao "NH Membership" aplikacija; školski deo sajta manifest ne vidi.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { jeAktivnaClanica, CLANSTVO_PRODUCT_SLUG } from "@/lib/clanstvo";
import ClanstvoNav from "@/components/clanstvo/ClanstvoNav";
import ClanstvoFooter from "@/components/clanstvo/ClanstvoFooter";
import SakrijNa from "@/components/SakrijNa";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NH Membership",
  manifest: "/clanstvo.webmanifest",
  icons: { apple: "/nh-icon-180.png" },
  appleWebApp: {
    capable: true,
    title: "NH Membership",
    statusBarStyle: "default",
  },
};

export default async function ClanstvoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const clanica = await jeAktivnaClanica(supabase, user.id);
  if (!clanica) redirect(`/kupovina/${CLANSTVO_PRODUCT_SLUG}`);

  return (
    <div className="flex min-h-screen flex-col bg-nh-cream">
      <Suspense>
        <ClanstvoNav />
      </Suspense>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
      {/* Na zajednici footer izostaje - chat zauzima ceo ekran
          (h-[calc(100vh-9rem)] u ChatKlijent), a link ka pravilima
          stoji ispod forme za slanje poruke. */}
      <SakrijNa prefiksi={["/clanstvo/zajednica"]}>
        <ClanstvoFooter />
      </SakrijNa>
    </div>
  );
}
