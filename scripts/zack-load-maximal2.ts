// Jednokratni upis Maximala 2 iz pregledanog nacrta. Ne briše ništa.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key);

type Rec = { de: string; sr: string; rod: string; mn: string; iz: boolean };
type Pit = { pitanje: string; opcije: string[]; tacan: number; tezina: number };
type Tacka = { naziv: string; objasnjenje: string; primer: string; pitanja: Pit[] };
type Lek = { oznaka: string; naziv: string; reci: Rec[]; tacke: Tacka[] };

const rod = (r: string) => {
  const p = (r || "").trim().split(" ")[0];
  return ["der", "die", "das"].includes(p) ? p : "nema";
};

async function glavno() {
  const lekcije: Lek[] = JSON.parse(readFileSync("/tmp/zack-parsed.json", "utf8"));

  const { data: u } = await db.from("zack_udzbenici").select("id").eq("slug", "maximal-2-r6").single();
  if (!u) throw new Error("Udzbenik maximal-2-r6 ne postoji");

  const { data: lek } = await db.from("zack_lekcije").select("id, broj").eq("udzbenik_id", u.id).order("broj");
  const poBroju = new Map((lek ?? []).map((l) => [l.broj, l.id]));

  let reci = 0, tacke = 0, pitanja = 0;

  for (const [i, l] of lekcije.entries()) {
    const lekcijaId = poBroju.get(i + 1);
    if (!lekcijaId) throw new Error(`Lekcija ${i + 1} ne postoji`);

    const redovi = l.reci.map((r, j) => ({
      lekcija_id: lekcijaId, redni_broj: j + 1, de: r.de, sr: r.sr,
      rod: rod(r.rod), mnozina: r.mn || null,
      vrsta: rod(r.rod) !== "nema" ? "imenica" : "ostalo", izuzetak: r.iz,
    }));
    const { error: e1 } = await db.from("zack_reci").upsert(redovi, { onConflict: "lekcija_id,de" });
    if (e1) throw new Error(`reci ${l.oznaka}: ${e1.message}`);
    reci += redovi.length;

    for (const [k, t] of l.tacke.entries()) {
      const { data: g, error: e2 } = await db.from("zack_gramatika").upsert({
        udzbenik_id: u.id, redni_broj: (i + 1) * 100 + k + 1, naziv: t.naziv,
        objasnjenje: t.objasnjenje, primer: t.primer, od_lekcije: i + 1,
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
