"use client";

import { useState } from "react";

interface AuthFormaProps {
  tip: "prijava" | "registracija" | "reset";
  onSubmit: (data: { email: string; password: string; fullName?: string }) => Promise<string | null>;
}

export default function AuthForma({ tip, onSubmit }: AuthFormaProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    setUspeh(null);
    setLoading(true);

    const result = await onSubmit({ email, password, fullName });

    if (result) {
      if (result.startsWith("OK:")) {
        setUspeh(result.slice(3));
      } else {
        setGreska(result);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {tip === "registracija" && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Ime i prezime
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
            placeholder="Ana Petrović"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
          placeholder="vas@email.com"
        />
      </div>

      {tip !== "reset" && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Lozinka
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
            placeholder="Minimum 6 karaktera"
          />
        </div>
      )}

      {greska && (
        <div className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
          {greska}
        </div>
      )}

      {uspeh && (
        <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">
          {uspeh}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-plava text-white py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
      >
        {loading
          ? "Učitavanje..."
          : tip === "prijava"
          ? "Prijavite se"
          : tip === "registracija"
          ? "Registrujte se"
          : "Pošaljite link za reset"}
      </button>
    </form>
  );
}
