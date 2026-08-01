"use client";
// Profil članice: predstavljanje za imenik. Čuva se direktno kroz browser
// klijent - RLS (074) dozvoljava upsert samo vlastitog reda i samo članicama.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ClanstvoProfil() {
  const supabase = createClient();
  const [form, setForm] = useState({ ime: "", delatnost: "", bio: "", instagram: "", web: "" });
  const [poruka, setPoruka] = useState("");
  const [ucitava, setUcitava] = useState(true);

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
    setPoruka(error ? "Greška pri čuvanju. Pokušaj ponovo." : "Sačuvano ✓");
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
        <button className="rounded-full bg-nh-pink px-6 py-2 font-semibold text-white">Sačuvaj</button>
        {poruka && <p className="text-sm text-nh-dark/70">{poruka}</p>}
      </form>
    </div>
  );
}
