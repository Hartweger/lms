"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const CATEGORIES = [
  { value: "", label: "Izaberi temu" },
  { value: "video", label: "Video kursevi" },
  { value: "grupni", label: "Grupni kursevi" },
  { value: "individualni", label: "Individualni časovi" },
  { value: "usluge", label: "Prevođenje / Biografija" },
  { value: "placanje", label: "Plaćanje i fakture" },
  { value: "ostalo", label: "Ostalo" },
];

export default function KontaktForma() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !category || !message) {
      setStatus("error");
      setErrorMsg("Molimo popunite sva polja.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setCategory("");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Greška pri slanju. Pokušajte ponovo.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Greška na mreži. Pokušajte ponovo.");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-green-800 text-center">
        Hvala! Poruka je poslata.
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-plava";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="kontakt-name" className="block text-sm font-medium text-gray-700 mb-1">
          Ime i prezime
        </label>
        <input
          id="kontakt-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="kontakt-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email adresa
        </label>
        <input
          id="kontakt-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="kontakt-category" className="block text-sm font-medium text-gray-700 mb-1">
          Tema
        </label>
        <select
          id="kontakt-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          required
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} disabled={cat.value === ""}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="kontakt-message" className="block text-sm font-medium text-gray-700 mb-1">
          Poruka
        </label>
        <textarea
          id="kontakt-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          required
        />
      </div>

      {status === "error" && (
        <p className="text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Šaljem..." : "Pošalji poruku"}
      </button>
    </form>
  );
}
