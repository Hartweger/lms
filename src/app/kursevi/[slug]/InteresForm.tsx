"use client";
import { useState } from "react";

export default function InteresForm({ nivo }: { nivo: string }) {
  const [open, setOpen] = useState(false);
  const [ime, setIme] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "slanje" | "ok" | "greska">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("slanje");
    try {
      const res = await fetch("/api/grupe/interes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivo, ime, email }),
      });
      setStatus(res.ok ? "ok" : "greska");
    } catch {
      setStatus("greska");
    }
  }

  if (status === "ok") {
    return <p className="text-green-600 font-semibold">Hvala! Javićemo ti kad otvorimo sledeći termin. 💚</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-plava hover:bg-plava-dark text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg"
      >
        Obavesti me za sledeći termin
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-sm">
      <label htmlFor="interes-ime" className="sr-only">Ime</label>
      <input
        id="interes-ime"
        type="text" placeholder="Ime" value={ime} onChange={(e) => setIme(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-3"
      />
      <label htmlFor="interes-email" className="sr-only">Mejl adresa</label>
      <input
        id="interes-email"
        type="email" required placeholder="Tvoj mejl" value={email} onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-3"
      />
      <button
        type="submit" disabled={status === "slanje"}
        className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-6 rounded-lg disabled:opacity-60"
      >
        {status === "slanje" ? "Šaljem…" : "Pošalji"}
      </button>
      {status === "greska" && <p className="text-red-600 text-sm">Greška. Pokušaj ponovo.</p>}
    </form>
  );
}
