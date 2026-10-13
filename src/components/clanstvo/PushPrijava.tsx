"use client";
// Uključivanje push obaveštenja za Gen II kanal.
//
// Dozvola se traži ISKLJUČIVO iz onClick - browseri odbijaju
// Notification.requestPermission() koji ne dolazi iz korisničkog gesta.
//
// Na iOS-u u običnom tabu Notification/PushManager uopšte ne postoje (Web Push
// radi samo iz aplikacije dodate na početni ekran), pa se umesto dugmeta
// prikazuje uputstvo. Detekcija je u lib/push-klijent.ts.
//
// Pretplata se upisuje direktnim insertom pod RLS-om (push_pretplate), isto
// kako ChatKlijent upisuje poruke.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { base64UrlUBajtove, jeIosBezPwa } from "@/lib/push-klijent";

type Stanje = "ucitava" | "ios-uputstvo" | "nepodrzano" | "iskljuceno" | "ukljuceno" | "odbijeno";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function PushPrijava({ mojId }: { mojId: string }) {
  const [stanje, setStanje] = useState<Stanje>("ucitava");
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState("");

  useEffect(() => {
    let aktivan = true;
    (async () => {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      let novo: Stanje;
      if (jeIosBezPwa(nav.userAgent, nav.standalone === true, nav.maxTouchPoints)) {
        novo = "ios-uputstvo";
      } else if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window) ||
        !VAPID
      ) {
        novo = "nepodrzano";
      } else if (Notification.permission === "denied") {
        novo = "odbijeno";
      } else {
        const reg = await navigator.serviceWorker.getRegistration("/clanstvo/");
        const sub = await reg?.pushManager.getSubscription();
        novo = sub ? "ukljuceno" : "iskljuceno";
      }
      if (aktivan) setStanje(novo);
    })();
    return () => {
      aktivan = false;
    };
  }, []);

  async function ukljuci() {
    setRadi(true);
    setGreska("");
    try {
      const dozvola = await Notification.requestPermission();
      if (dozvola !== "granted") {
        setStanje(dozvola === "denied" ? "odbijeno" : "iskljuceno");
        return;
      }
      const reg = await navigator.serviceWorker.register("/clanstvo-sw.js", { scope: "/clanstvo/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlUBajtove(VAPID!),
      });
      const json = sub.toJSON();
      const { error } = await createClient().from("push_pretplate").upsert({
        endpoint: sub.endpoint,
        user_id: mojId,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      if (error) throw error;
      setStanje("ukljuceno");
    } catch (e) {
      console.error("[push] uključivanje palo:", e);
      setGreska("Uključivanje nije uspelo. Pokušaj ponovo.");
      setStanje("iskljuceno");
    } finally {
      setRadi(false);
    }
  }

  async function iskljuci() {
    setRadi(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/clanstvo/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_pretplate").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setStanje("iskljuceno");
    } finally {
      setRadi(false);
    }
  }

  if (stanje === "ucitava" || stanje === "nepodrzano") return null;

  const okvir = "mb-3 rounded-xl border border-nh-pink-light bg-nh-pink-bg px-4 py-3 text-sm";

  if (stanje === "ios-uputstvo") {
    return (
      <div className={okvir}>
        <strong>Da ne propustiš poruku:</strong> u Safariju dodirni dugme <em>Podeli</em>, pa{" "}
        <em>Dodaj na početni ekran</em>. Zatim otvori zajednicu iz te ikonice i ovde uključi
        obaveštenja.
      </div>
    );
  }

  if (stanje === "odbijeno") {
    return (
      <div className={okvir}>
        Obaveštenja su blokirana u podešavanjima browsera za ovaj sajt. Uključi ih tamo, pa osveži
        stranicu.
      </div>
    );
  }

  if (stanje === "ukljuceno") {
    return (
      <div className={`${okvir} flex items-center justify-between gap-3`}>
        <span>Obaveštenja su uključena na ovom uređaju.</span>
        <button
          onClick={iskljuci}
          disabled={radi}
          className="whitespace-nowrap rounded-full border border-nh-pink-light bg-white px-4 py-1.5 font-semibold text-nh-dark disabled:opacity-50"
        >
          Isključi
        </button>
      </div>
    );
  }

  return (
    <div className={okvir}>
      <div className="flex items-center justify-between gap-3">
        <span>Uključi obaveštenja da znaš kad neko napiše nešto u Gen II.</span>
        <button
          onClick={ukljuci}
          disabled={radi}
          className="whitespace-nowrap rounded-full bg-nh-pink px-4 py-1.5 font-semibold text-white disabled:opacity-50"
        >
          Uključi
        </button>
      </div>
      {greska && <p className="mt-2 text-red-600">{greska}</p>}
    </div>
  );
}
