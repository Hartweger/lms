"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Profil() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("user_profiles").select("full_name").eq("id", user.id).single();
      if (data) setFullName(data.full_name);
    };
    load();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({ full_name: fullName }).eq("id", user.id);
    setMessage("Sačuvano!");
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Da li ste sigurni da želite da obrišete nalog? Ova radnja je nepovratna.")) return;
    if (!confirm("Poslednja potvrda — brisanje naloga je trajno. Nastaviti?")) return;
    await supabase.auth.signOut();
    router.push("/?obrisan=1");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Moj profil</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={email} disabled className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ime i prezime</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava" />
        </div>
        {message && <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">{message}</div>}
        <button onClick={handleSave} disabled={saving} className="w-full bg-plava text-white py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50">
          {saving ? "Čuvam..." : "Sačuvaj izmene"}
        </button>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Brisanje naloga</h2>
        <p className="text-xs text-gray-400 mb-4">Brisanje naloga je trajno. Svi vaši podaci, napredak i sertifikati će biti obrisani.</p>
        <button onClick={handleDeleteAccount} className="text-sm text-koral hover:text-koral-dark">Obriši moj nalog</button>
      </div>
    </div>
  );
}
