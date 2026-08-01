// NH Membership sekcija - poseban vizuelni identitet, bez školske navigacije
// (root layout sakriva Navigaciju kroz SakrijNa). Obrazac: profesor/layout.tsx.
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { jeAktivnaClanica, CLANSTVO_PRODUCT_SLUG } from "@/lib/clanstvo";
import ClanstvoNav from "@/components/clanstvo/ClanstvoNav";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-nh-cream">
      <Suspense>
        <ClanstvoNav />
      </Suspense>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
