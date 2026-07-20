"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordSaveErrorMessage } from "@/lib/auth-messages";

export default function Profil() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

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

  const handleSetPassword = async () => {
    setPwError("");
    setPwMessage("");
    if (newPassword.length < 6) {
      setPwError("Lozinka mora imati bar 6 karaktera.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Lozinke se ne poklapaju.");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) {
      setPwError(passwordSaveErrorMessage(error));
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPwMessage("Lozinka je sačuvana! Ubuduće možeš da se prijaviš sa email + lozinka.");
    setTimeout(() => setPwMessage(""), 5000);
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
        <h2 className="text-base font-semibold text-gray-900 mb-1">Lozinka</h2>
        <p className="text-xs text-gray-500 mb-4">Postavi lozinku da se ubuduće prijaviš brzo, sa email i lozinkom (bez čekanja linka na mejl).</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova lozinka</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} placeholder="Bar 6 karaktera" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ponovi lozinku</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} placeholder="Ista lozinka još jednom" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava" />
          </div>
          {pwError && <div role="alert" className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">{pwError}</div>}
          {pwMessage && <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">{pwMessage}</div>}
          <button onClick={handleSetPassword} disabled={pwSaving} className="w-full bg-plava text-white py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50">
            {pwSaving ? "Čuvam..." : "Sačuvaj lozinku"}
          </button>
        </div>
      </div>
    </div>
  );
}
