"use client";
// Chat zajednice. Poruke idu direktnim insertom iz browsera (RLS 075 je
// kapija), novi dolasci stižu kroz Realtime postgres_changes. Klijent je
// modul-singleton (lib/supabase/client) pa se kanal OBAVEZNO uklanja u
// cleanup-u (removeChannel) da se pretplate ne gomilaju.
// Auto-scroll obrazac: naki/NakiChat.tsx.
//
// Jedna trajna pretplata za SVE kanale (bez filter-a po kanal_id): INSERT u
// aktivnom kanalu ide u spisak poruka, u ostalima uvećava nepročitano (079).
// DELETE (admin moderacija) nosi samo id (replica identity default) - zato
// filter po kanalu ionako ne bi radio za DELETE evente.
//
// Realtime auth: createBrowserClient ne prosleđuje custom accessToken
// funkciju, pa SupabaseClient NE zove realtime.setAuth() odmah pri init-u -
// samo reaguje na SIGNED_IN/TOKEN_REFRESHED evente iz onAuthStateChange.
// Kod običnog učitavanja stranice sa već postojećom sesijom (iz kolačića)
// auth-js emituje INITIAL_SESSION, koji _handleTokenChanged ne hvata - pa bi
// realtime socket ostao neautentifikovan (anon), a RLS bi tiho odbio sve
// postgres_changes redove. Zato OBAVEZNO ručno zovemo setAuth() pre
// subscribe-a (bez argumenta - povlači trenutni access_token iz sesije).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  dodajPoruku,
  ukloniPoruku,
  uvecajNeprocitano,
  ocistiNeprocitano,
  type ChatPoruka,
  type NeprocitanoMapa,
} from "@/lib/chat-poruke";

interface Kanal {
  id: string;
  slug: string;
  naziv: string;
  opis: string;
  samo_admin_pise: boolean;
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
  const [poruke, setPoruke] = useState<ChatPoruka[]>([]);
  const [neprocitano, setNeprocitano] = useState<NeprocitanoMapa>({});
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState("");
  const kraj = useRef<HTMLDivElement>(null);
  // Realtime callback živi duže od render-a - id aktivnog kanala čita iz ref-a.
  const aktivniRef = useRef(aktivni);

  // Upis "pročitano do sada" (upsert, return=minimal) + lokalno nuliranje
  // bedža. Zove se pri ulasku u kanal i za svaku pristiglu poruku dok se
  // kanal gleda, da nepročitano ne raste "iza leđa".
  const oznaciProcitano = useCallback(
    (kanalId: string) => {
      setNeprocitano((m) => ocistiNeprocitano(m, kanalId));
      void supabase
        .from("chat_procitano")
        .upsert({ user_id: mojId, kanal_id: kanalId, last_read_at: new Date().toISOString() })
        .then(() => undefined);
    },
    [supabase, mojId]
  );

  // Trajna pretplata + početno stanje bedževa (jednom, za sve kanale).
  useEffect(() => {
    let aktivan = true;
    // useEffect ne može biti async, a setAuth() MORA biti sačekan pre
    // subscribe-a (vidi komentar na vrhu fajla) - zato kanal pravimo unutar
    // async IIFE i čuvamo referencu za cleanup u spoljnoj promenljivoj.
    let kanal: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: brojevi } = await supabase.rpc("chat_neprocitano");
      if (aktivan && brojevi) {
        // Aktivni kanal se odmah označava pročitanim u efektu istorije ispod.
        setNeprocitano(Object.fromEntries(brojevi.map((r) => [r.kanal_id, r.broj])));
      }

      // Vidi komentar na vrhu fajla - bez ovoga postgres_changes tiho ne
      // isporučuje ništa jer realtime socket ostaje anon.
      await supabase.realtime.setAuth();
      if (!aktivan) return;

      kanal = supabase
        .channel("chat-poruke")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_poruke" },
          // Napomena: supabase.channel(...) je tipiziran kao `any` (postojeći
          // propust u lib/supabase/client.ts - ReturnType<typeof createBrowserClient>
          // se ne razrešava kroz preklopljenu generičku funkciju), pa .on<T>()
          // ovde ne bi radio (TS2347). Zato ručno tipiziramo parametar callback-a.
          (payload: RealtimePostgresInsertPayload<ChatPoruka>) => {
            const nova = payload.new;
            if (aktivniRef.current?.id === nova.kanal_id) {
              setPoruke((p) => dodajPoruku(p, nova));
              oznaciProcitano(nova.kanal_id);
            } else {
              setNeprocitano((m) => uvecajNeprocitano(m, nova.kanal_id));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "chat_poruke" },
          // DELETE payload nosi samo primarni ključ; uklanjanje id-a iz drugog
          // kanala je no-op. Bedž se ne umanjuje (nemamo kanal_id) - ispravi se
          // sam pri sledećem učitavanju.
          (payload: RealtimePostgresDeletePayload<ChatPoruka>) => {
            const id = payload.old.id;
            if (id) setPoruke((p) => ukloniPoruku(p, id));
          }
        )
        .subscribe();
    })();

    return () => {
      aktivan = false;
      if (kanal) supabase.removeChannel(kanal);
    };
  }, [supabase, oznaciProcitano]);

  // Istorija aktivnog kanala + označavanje pročitanog pri ulasku.
  useEffect(() => {
    aktivniRef.current = aktivni;
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
      // Posle učitane istorije: kanal je "viđen" (asinhrono, van tela efekta -
      // react-hooks/set-state-in-effect).
      if (aktivan) oznaciProcitano(aktivni.id);
    })();
    return () => {
      aktivan = false;
    };
  }, [supabase, aktivni, oznaciProcitano]);

  useEffect(() => {
    kraj.current?.scrollIntoView({ behavior: "smooth" });
  }, [poruke]);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    const t = tekst.trim();
    if (!t || !aktivni || salje) return;
    setSalje(true);
    setGreska("");
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
      if (data) setPoruke((p) => dodajPoruku(p, data as ChatPoruka));
    } else {
      setGreska("Poruka nije poslata. Pokušaj ponovo.");
    }
    setSalje(false);
  }

  // Admin moderacija: RLS polisa chat_poruke_delete_admin je kapija; ostalim
  // gledaocima poruka nestaje kroz Realtime DELETE event.
  async function obrisi(id: string) {
    if (!window.confirm("Obrisati ovu poruku?")) return;
    const { error } = await supabase.from("chat_poruke").delete().eq("id", id);
    if (error) setGreska("Brisanje nije uspelo. Pokušaj ponovo.");
    else setPoruke((p) => ukloniPoruku(p, id));
  }

  const pise = aktivni && (!aktivni.samo_admin_pise || jaAdmin);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex gap-2 overflow-x-auto pb-3">
        {kanali.map((k) => {
          const izabran = aktivni?.id === k.id;
          const broj = izabran ? 0 : (neprocitano[k.id] ?? 0);
          return (
            <button
              key={k.id}
              onClick={() => setAktivni(k)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                izabran ? "bg-nh-pink text-white" : "bg-white text-nh-dark border border-nh-pink-light"
              }`}
            >
              {k.naziv}
              {broj > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-nh-pink px-1.5 text-xs font-semibold text-white">
                  {broj > 99 ? "99+" : broj}
                </span>
              )}
            </button>
          );
        })}
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
                {jaAdmin && (
                  <button
                    onClick={() => obrisi(p.id)}
                    title="Obriši poruku"
                    aria-label="Obriši poruku"
                    className="ml-2 rounded px-1 text-nh-dark/40 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
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
        <>
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
          <p className="mt-2 text-center text-xs text-nh-dark/40">
            Slanjem poruke prihvataš{" "}
            <Link href="/clanstvo/pravila" className="underline hover:text-nh-pink">
              pravila zajednice
            </Link>
            .
          </p>
        </>
      ) : null}
      {greska && <p className="mt-2 text-sm text-red-600">{greska}</p>}
      {!pise && (
        <p className="mt-3 text-sm text-nh-dark/50">U ovom kanalu objavljuje samo Nataša.</p>
      )}
    </div>
  );
}
