// Jednokratni upis 5. razreda iz pregledanog nacrta po planu i programu.
// Ne briše ništa. Ulaz: /tmp/r5-parsed.json (parsiran nacrt).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG = "nemacki-5-razred";

type Rec = { de: string; sr: string; rod: string; mn: string; iz: boolean };
type Pit = { pitanje: string; opcije: string[]; tacan: number; tezina: number };
type Tacka = { naziv: string; objasnjenje: string; primer: string; pitanja: Pit[] };
type Lek = {
  broj: number; naziv: string; reci: Rec[];
  podsetnik: { naslov: string; tekst: string; primer: string } | null;
  tacke: Tacka[];
};

const rod = (r: string) => {
  const p = (r || "").trim().split(" ")[0];
  return ["der", "die", "das"].includes(p) ? p : "nema";
};

async function glavno() {
  const lekcije: Lek[] = JSON.parse(readFileSync("/tmp/r5-parsed.json", "utf8"));
  const { data: u } = await db.from("zack_udzbenici").select("id").eq("slug", SLUG).single();
  if (!u) throw new Error("nema razreda " + SLUG);

  let reci = 0, tacke = 0, pitanja = 0;
  for (const l of lekcije) {
    const { data: lek, error: e0 } = await db.from("zack_lekcije").upsert({
      udzbenik_id: u.id, broj: l.broj, naziv: l.naziv,
      pravilo_naslov: l.podsetnik?.naslov ?? null,
      pravilo_tekst: l.podsetnik?.tekst ?? null,
      pravilo_primer: l.podsetnik?.primer ?? null,
    }, { onConflict: "udzbenik_id,broj" }).select("id").single();
    if (e0 || !lek) throw new Error(`lekcija ${l.broj}: ${e0?.message}`);

    const redovi = l.reci.map((r, j) => ({
      lekcija_id: lek.id, redni_broj: j + 1, de: r.de, sr: r.sr,
      rod: rod(r.rod), mnozina: r.mn || null,
      vrsta: rod(r.rod) !== "nema" ? "imenica" : "ostalo", izuzetak: r.iz,
    }));
    const { error: e1 } = await db.from("zack_reci").upsert(redovi, { onConflict: "lekcija_id,de" });
    if (e1) throw new Error(`reci ${l.broj}: ${e1.message}`);
    reci += redovi.length;

    for (const [k, t] of l.tacke.entries()) {
      const { data: g, error: e2 } = await db.from("zack_gramatika").upsert({
        udzbenik_id: u.id, redni_broj: l.broj * 100 + k + 1, naziv: t.naziv,
        objasnjenje: t.objasnjenje, primer: t.primer, od_lekcije: l.broj,
      }, { onConflict: "udzbenik_id,redni_broj" }).select("id").single();
      if (e2 || !g) throw new Error(`tacka ${t.naziv}: ${e2?.message}`);
      tacke++;
      const p = t.pitanja.map((q, n) => ({
        gramatika_id: g.id, redni_broj: n + 1, pitanje: q.pitanje,
        opcije: q.opcije, tacan: q.tacan, tezina: q.tezina,
      }));
      if (p.length) {
        const { error: e3 } = await db.from("zack_gramatika_pitanja").upsert(p, { onConflict: "gramatika_id,redni_broj" });
        if (e3) throw new Error(`pitanja ${t.naziv}: ${e3.message}`);
        pitanja += p.length;
      }
    }
  }
  console.log(`upisano: reci=${reci} tacke=${tacke} pitanja=${pitanja}`);
}
glavno().catch((e) => { console.error("PUKLO:", e.message); process.exit(1); });
