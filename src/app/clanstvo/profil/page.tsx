"use client";
// Profil članice: predstavljanje za imenik. Čuva se direktno kroz browser
// klijent - RLS (074) dozvoljava upsert samo vlastitog reda i samo članicama.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Status kartice na javnom imeniku (natasahartweger.rs/clanice) - "pending"/"approved"/
// "rejected"/null (nema kartice); prikazuje se samo dok je javniImenik uključen.
type ImenikStatus = "pending" | "approved" | "rejected" | null;

export default function ClanstvoProfil() {
  const supabase = createClient();
  const [form, setForm] = useState({ ime: "", delatnost: "", bio: "", instagram: "", web: "" });
  const [poruka, setPoruka] = useState("");
  const [ucitava, setUcitava] = useState(true);
  const [javniImenik, setJavniImenik] = useState(false);
  const [pocetniJavniImenik, setPocetniJavniImenik] = useState(false);
  const [imenikStatus, setImenikStatus] = useState<ImenikStatus>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("member_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setForm({ ime: data.ime, delatnost: data.delatnost, bio: data.bio, instagram: data.instagram, web: data.web });
      else {
        const { data: up } = await supabase
          .from("user_profiles").select("full_name").eq("id", user.id).single();
        if (up) setForm((f) => ({ ...f, ime: up.full_name }));
      }

      const res = await fetch("/api/clanstvo/javni-imenik");
      if (res.ok) {
        const json = await res.json();
        setJavniImenik(!!json.prikazano);
        setPocetniJavniImenik(!!json.prikazano);
        setImenikStatus(json.status ?? null);
      }

      setUcitava(false);
    })();
  }, [supabase]);

  async function sacuvaj(e: React.FormEvent) {
    e.preventDefault();
    setPoruka("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("member_profiles").upsert({
      user_id: user.id, ...form, instagram: form.instagram.replace(/^@/, ""), updated_at: new Date().toISOString(),
    });
    if (error) {
      setPoruka("Greška pri čuvanju. Pokušaj ponovo.");
      return;
    }

    // Javni imenik se menja samo ako je čekboks stvarno promenjen - nema potrebe
    // da se svaki put ponovo šalje isti zahtev (i pokreće admin mejl).
    if (javniImenik !== pocetniJavniImenik) {
      const res = await fetch("/api/clanstvo/javni-imenik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zeli: javniImenik }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        setPocetniJavniImenik(javniImenik);
        setImenikStatus(json?.status ?? null);
      } else {
        setPoruka(json?.error ?? "Greška pri čuvanju javnog imenika.");
        return;
      }
    }

    setPoruka("Sačuvano ✓");
  }

  if (ucitava) return <p className="text-nh-dark/60">Učitavanje…</p>;

  const polje = "mt-1 w-full rounded-lg border border-nh-pink-light bg-white px-3 py-2";
  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Moj profil</h1>
      <p className="mt-1 text-nh-dark/70">Ovako te vide ostale članice u imeniku.</p>
      <form onSubmit={sacuvaj} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-nh-dark">Ime i prezime
          <input className={polje} value={form.ime} onChange={(e) => setForm({ ...form, ime: e.target.value })} required />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Čime se baviš
          <input className={polje} value={form.delatnost} placeholder="npr. Profesorka nemačkog jezika" onChange={(e) => setForm({ ...form, delatnost: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">O meni
          <textarea className={polje} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Instagram (bez @)
          <input className={polje} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Sajt
          <input className={polje} value={form.web} placeholder="https://…" onChange={(e) => setForm({ ...form, web: e.target.value })} />
        </label>

        <label className="flex items-start gap-2 text-sm font-semibold text-nh-dark">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-nh-pink-light"
            checked={javniImenik}
            onChange={(e) => setJavniImenik(e.target.checked)}
          />
          <span>
            Prikaži moju karticu i na javnom imeniku na natasahartweger.rs/clanice (NH oznaka - vidljivo svima na internetu)
          </span>
        </label>
        {javniImenik && imenikStatus === "pending" && (
          <p className="text-sm text-nh-dark/70">Kartica čeka Natašino odobrenje.</p>
        )}
        {javniImenik && imenikStatus === "approved" && (
          <p className="text-sm text-nh-dark/70">Kartica je vidljiva na javnom imeniku.</p>
        )}

        <button className="rounded-full bg-nh-pink px-6 py-2 font-semibold text-white">Sačuvaj</button>
        {poruka && <p className="text-sm text-nh-dark/70">{poruka}</p>}
      </form>
    </div>
  );
}
