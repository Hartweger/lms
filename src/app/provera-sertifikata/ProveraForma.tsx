"use client";

import { useState } from "react";

interface CertResult {
  valid: boolean;
  name?: string;
  course?: string;
  date?: string;
}

export default function ProveraForma() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/provera-sertifikata?id=${encodeURIComponent(trimmed)}`
      );
      const data = (await res.json()) as CertResult;
      setResult(data?.valid ? data : { valid: false });
    } catch {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          aria-label="ID sertifikata"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ID sertifikata"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-lg bg-plava px-6 py-3 text-sm font-semibold text-white hover:bg-plava/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Proveravam..." : "Proveri"}
        </button>
      </form>

      {result && result.valid && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-6 text-center">
          <div className="text-green-600 text-lg font-bold mb-3">
            Sertifikat je validan
          </div>
          <div className="text-gray-700 mb-1">
            <span className="font-semibold">{result.name}</span>
          </div>
          <div className="text-gray-500 text-sm mb-1">
            uspešno završio/la kurs
          </div>
          <div className="text-gray-900 font-bold mb-2">{result.course}</div>
          <div className="text-gray-400 text-sm">Datum: {result.date}</div>
        </div>
      )}

      {result && !result.valid && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-6 text-center">
          <div className="text-red-600 text-lg font-bold mb-1">
            Sertifikat nije pronađen
          </div>
          <p className="text-gray-500 text-sm">
            Proverite da li ste ispravno uneli kod sertifikata.
          </p>
        </div>
      )}
    </div>
  );
}
