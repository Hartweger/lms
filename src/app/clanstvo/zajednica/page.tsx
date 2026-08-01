// Zajednica: server deo učitava kanale + ime članice + admin id-jeve
// (Natašine poruke se ističu), klijent radi poruke i Realtime.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ChatKlijent from "@/components/clanstvo/ChatKlijent";

export const dynamic = "force-dynamic";

export default async function Zajednica() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kanali } = await supabase
    .from("chat_kanali")
    .select("id, slug, naziv, opis, samo_admin_pise")
    .order("sort", { ascending: true });

  const { data: profil } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  // Admin id-jevi za isticanje poruka (malo redova; service-role jer
  // user_profiles RLS ne dozvoljava čitanje tuđih profila - 001, potvrđeno).
  const admin = createAdminClient();
  const { data: admini } = await admin
    .from("user_profiles")
    .select("id")
    .eq("role", "admin");

  return (
    <ChatKlijent
      kanali={kanali ?? []}
      mojId={user!.id}
      mojeIme={profil?.full_name ?? ""}
      jaAdmin={profil?.role === "admin"}
      adminIds={(admini ?? []).map((a) => a.id)}
    />
  );
}
