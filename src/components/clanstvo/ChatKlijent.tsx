"use client";
// Chat zajednice. Poruke idu direktnim insertom iz browsera (RLS 075 je
// kapija), novi dolasci stižu kroz Realtime postgres_changes filtriran po
// kanalu. Klijent je modul-singleton (lib/supabase/client) pa se kanal
// OBAVEZNO uklanja u cleanup-u (removeChannel) da se pretplate ne gomilaju.
// Auto-scroll obrazac: naki/NakiChat.tsx.
//
// Realtime auth: createBrowserClient ne prosleđuje custom accessToken
// funkciju, pa SupabaseClient NE zove realtime.setAuth() odmah pri init-u -
// samo reaguje na SIGNED_IN/TOKEN_REFRESHED evente iz onAuthStateChange.
// Kod običnog učitavanja stranice sa već postojećom sesijom (iz kolačića)
// auth-js emituje INITIAL_SESSION, koji _handleTokenChanged ne hvata - pa bi
// realtime socket ostao neautentifikovan (anon), a RLS bi tiho odbio sve
// postgres_changes redove. Zato OBAVEZNO ručno zovemo setAuth() pre
// subscribe-a (bez argumenta - povlači trenutni access_token iz sesije).
import { useEffect, useRef, useState } from "react";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface Kanal {
  id: string;
  slug: string;
  naziv: string;
  opis: string;
  samo_admin_pise: boolean;
}
interface Poruka {
  id: string;
  kanal_id: string;
  user_id: string;
  ime: string;
  tekst: string;
  created_at: string;
}

// Dedupe pri dodavanju poruke - i sopstveni insert i realtime INSERT event
// mogu doneti isti red (id), pa se dodaje samo ako još nije prisutan.
function dodajPoruku(spisak: Poruka[], nova: Poruka): Poruka[] {
  if (spisak.some((p) => p.id === nova.id)) return spisak;
  return [...spisak, nova];
}

export default function ChatKlijent({
  kanali,
  mojId,
  mojeIme,
  jaAdmin,
  adminIds,
}: {
  kanali: Kanal[];
  mojId: string;
  mojeIme: string;
  jaAdmin: boolean;
  adminIds: string[];
}) {
  const supabase = createClient();
  const [aktivni, setAktivni] = useState<Kanal | null>(kanali[0] ?? null);
  const [poruke, setPoruke] = useState<Poruka[]>([]);
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const kraj = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aktivni) return;
    let aktivan = true;

    (async () => {
      const { data } = await supabase
        .from("chat_poruke")
        .select("*")
        .eq("kanal_id", aktivni.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (aktivan) setPoruke((data ?? []).reverse());
    })();

    // Vidi komentar na vrhu fajla - bez ovoga postgres_changes tiho ne
    // isporučuje ništa jer realtime socket ostaje anon.
    supabase.realtime.setAuth();

    const kanal = supabase
      .channel(`chat-${aktivni.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_poruke", filter: `kanal_id=eq.${aktivni.id}` },
        // Napomena: supabase.channel(...) je tipiziran kao `any` (postojeći
        // propust u lib/supabase/client.ts - ReturnType<typeof createBrowserClient>
        // se ne razrešava kroz preklopljenu generičku funkciju), pa .on<T>()
        // ovde ne bi radio (TS2347). Zato ručno tipiziramo parametar callback-a.
        (payload: RealtimePostgresInsertPayload<Poruka>) => setPoruke((p) => dodajPoruku(p, payload.new))
      )
      .subscribe();

    return () => {
      aktivan = false;
      supabase.removeChannel(kanal);
    };
  }, [supabase, aktivni]);

  useEffect(() => {
    kraj.current?.scrollIntoView({ behavior: "smooth" });
  }, [poruke]);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    const t = tekst.trim();
    if (!t || !aktivni || salje) return;
    setSalje(true);
    const { data, error } = await supabase
      .from("chat_poruke")
      .insert({
        kanal_id: aktivni.id,
        user_id: mojId,
        ime: mojeIme,
        tekst: t,
      })
      .select()
      .single();
    if (!error) {
      setTekst("");
      // Dodaj odmah lokalno - ne čekamo Realtime (koji bi mogao kasniti ili,
      // ako je nešto pošlo naopako sa autentifikacijom socketa, izostati).
      // dodajPoruku sprečava duplikat kad isti red kasnije stigne i preko
      // postgres_changes.
      if (data) setPoruke((p) => dodajPoruku(p, data as Poruka));
    }
    setSalje(false);
  }

  const pise = aktivni && (!aktivni.samo_admin_pise || jaAdmin);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex gap-2 overflow-x-auto pb-3">
        {kanali.map((k) => (
          <button
            key={k.id}
            onClick={() => setAktivni(k)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
              aktivni?.id === k.id ? "bg-nh-pink text-white" : "bg-white text-nh-dark border border-nh-pink-light"
            }`}
          >
            {k.naziv}
          </button>
        ))}
      </div>
      {aktivni?.opis && <p className="pb-2 text-sm text-nh-dark/60">{aktivni.opis}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-nh-pink-light bg-white p-4">
        {poruke.map((p) => {
          const natasa = adminIds.includes(p.user_id);
          const moja = p.user_id === mojId;
          return (
            <div key={p.id} className={moja ? "text-right" : ""}>
              <p className="text-xs text-nh-dark/50">
                {natasa ? "💗 Nataša" : p.ime} ·{" "}
                {new Date(p.created_at).toLocaleString("sr-RS", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              <p
                className={`mt-0.5 inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-left ${
                  natasa ? "bg-nh-pink text-white" : moja ? "bg-nh-pink-bg text-nh-dark" : "bg-nh-cream text-nh-dark"
                }`}
              >
                {p.tekst}
              </p>
            </div>
          );
        })}
        {poruke.length === 0 && <p className="text-nh-dark/50">Još nema poruka - napiši prvu!</p>}
        <div ref={kraj} />
      </div>

      {pise ? (
        <form onSubmit={posalji} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-full border border-nh-pink-light bg-white px-4 py-2"
            placeholder={`Poruka u ${aktivni?.naziv}…`}
            value={tekst}
            maxLength={2000}
            onChange={(e) => setTekst(e.target.value)}
          />
          <button disabled={salje} className="rounded-full bg-nh-pink px-6 py-2 font-semibold text-white disabled:opacity-50">
            Pošalji
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-nh-dark/50">U ovom kanalu objavljuje samo Nataša.</p>
      )}
    </div>
  );
}
