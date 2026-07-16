"use client";

import { useMemo, useState } from "react";
import { CLANICE, USLUGE, type Clanica, type UslugaKey } from "./clanice-data";

const CHIP_STYLE: Record<UslugaKey, string> = {
  engleski: "bg-plava-light text-plava-dark ring-plava/30",
  nemacki: "bg-koral-light text-koral-dark ring-koral/30",
  italijanski: "bg-zelena-light text-zelena ring-zelena/30",
  turizam: "bg-plava-light text-plava-dark ring-plava/30",
  marketing: "bg-ljubicasta-light text-ljubicasta ring-ljubicasta/30",
  matematika: "bg-narandzasta-light text-narandzasta ring-narandzasta/30",
  rucnopravljeno: "bg-koral-light text-koral-dark ring-koral/30",
  virtualniasistent: "bg-ljubicasta-light text-ljubicasta ring-ljubicasta/30",
};

const AVATAR_GRADIENTS = [
  "from-plava to-plava-dark",
  "from-koral to-koral-dark",
  "from-ljubicasta to-plava-dark",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/š/g, "s")
    .replace(/đ/g, "dj")
    .replace(/č|ć/g, "c")
    .replace(/ž/g, "z");
}

function initials(ime: string): string {
  return ime
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function LinkIcon({ vrsta }: { vrsta: string }) {
  const cls = "w-4 h-4 shrink-0";
  if (vrsta === "instagram")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  if (vrsta === "linkedin")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-4V9Z" />
      </svg>
    );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3.2c2.6 2.5 3.9 5.4 3.9 8.8s-1.3 6.3-3.9 8.8c-2.6-2.5-3.9-5.4-3.9-8.8s1.3-6.3 3.9-8.8Z" />
    </svg>
  );
}

function ClanicaCard({ clanica, index }: { clanica: Clanica; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const dugOpis = clanica.opis.length > 220;

  return (
    <article
      className="group flex flex-col bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      style={{ animation: `clanica-in 0.5s ease-out both`, animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {clanica.foto ? (
          <img
            src={clanica.foto}
            alt={clanica.brend ? `${clanica.ime} - ${clanica.brend}` : clanica.ime}
            decoding="async"
            className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]}`}
          >
            <span className="font-heading text-5xl font-bold text-white/90 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              {initials(clanica.ime)}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">{clanica.ime}</h3>
          {clanica.brend && <p className="text-white/90 text-sm drop-shadow-sm">{clanica.brend}</p>}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {clanica.usluge.map((u) => (
            <span key={u} className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${CHIP_STYLE[u]}`}>
              {USLUGE[u]}
            </span>
          ))}
        </div>

        <p
          className="text-gray-600 text-sm leading-relaxed"
          style={
            !expanded && dugOpis
              ? { display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }
              : undefined
          }
        >
          {clanica.opis}
        </p>
        {dugOpis && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="self-start mt-1.5 text-sm font-semibold text-plava-dark hover:text-plava transition-colors"
          >
            {expanded ? "Prikaži manje" : "Pročitaj više"}
          </button>
        )}

        <div className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 text-sm">
          {clanica.email && (
            <a
              href={`mailto:${clanica.email}`}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-plava-dark transition-colors max-w-full"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="m3.5 6.5 8.5 7 8.5-7" />
              </svg>
              <span className="truncate">{clanica.email}</span>
            </a>
          )}
          {clanica.telefoni?.map((t) => (
            <a
              key={t}
              href={`tel:${t.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-plava-dark transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              {t}
            </a>
          ))}
          {clanica.linkovi.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-plava-dark transition-colors max-w-full"
            >
              <LinkIcon vrsta={l.vrsta} />
              <span className="truncate">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ClaniceDirectory() {
  const [upit, setUpit] = useState("");
  const [usluga, setUsluga] = useState<UslugaKey | null>(null);

  const filtrirane = useMemo(() => {
    const q = normalize(upit.trim());
    return CLANICE.filter((c) => {
      if (usluga && !c.usluge.includes(usluga)) return false;
      if (!q) return true;
      const stog = normalize(
        [c.ime, c.brend ?? "", c.opis, ...c.usluge.map((u) => USLUGE[u])].join(" ")
      );
      return q.split(/\s+/).every((rec) => stog.includes(rec));
    });
  }, [upit, usluga]);

  const dostupneUsluge = Object.keys(USLUGE) as UslugaKey[];

  return (
    <div>
      <style>{`@keyframes clanica-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }`}</style>

      {/* Pretraga + filteri */}
      <div className="mb-8">
        <div className="relative max-w-xl mx-auto mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4.5 4.5" />
          </svg>
          <input
            type="search"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Pretraži po imenu, usluzi ili opisu..."
            aria-label="Pretraga članica"
            className="w-full rounded-full border border-gray-200 bg-white pl-12 pr-5 py-3.5 text-[15px] shadow-sm outline-none focus:border-plava focus:ring-4 focus:ring-plava/15 transition"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setUsluga(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              usluga === null
                ? "bg-plava text-white shadow-md shadow-plava/30"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-plava/50 hover:text-plava-dark"
            }`}
          >
            Sve
          </button>
          {dostupneUsluge.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUsluga(usluga === u ? null : u)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                usluga === u
                  ? "bg-plava text-white shadow-md shadow-plava/30"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-plava/50 hover:text-plava-dark"
              }`}
            >
              {USLUGE[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Rezultati */}
      {filtrirane.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrirane.map((c, i) => (
            <ClanicaCard key={c.slug} clanica={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">Nema rezultata za tvoju pretragu.</p>
          <button
            type="button"
            onClick={() => {
              setUpit("");
              setUsluga(null);
            }}
            className="mt-4 text-plava-dark font-semibold hover:text-plava transition-colors"
          >
            Poništi filtere
          </button>
        </div>
      )}
    </div>
  );
}
