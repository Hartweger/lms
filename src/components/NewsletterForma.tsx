"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForma() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Unesite ispravnu email adresu.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Greška pri prijavi.");
      }
    } catch {
      setStatus("error");
      setMessage("Greška na mreži. Pokušajte ponovo.");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Vaša email adresa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="flex-1 px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-plava focus:ring-2 focus:ring-plava/20 disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "Šaljem..." : "Prijavi se"}
        </button>
      </form>
      {status === "success" && (
        <p className="text-green-600 text-sm mt-3 text-center">{message}</p>
      )}
      {status === "error" && (
        <p className="text-red-500 text-sm mt-3 text-center">{message}</p>
      )}
    </div>
  );
}
