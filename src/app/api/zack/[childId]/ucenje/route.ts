// Beleženje da je dete prošlo fazu učenja na jednoj lekciji: reči, odnosno
// rečenice. Iz ovog reda vežbe znaju da smeju da se otključaju.
//
// UPIS JE PONOVLJIV
// -----------------
// Isti prolaz sme da stigne koliko god puta - `ignoreDuplicates` na
// UNIQUE (dete_id, lekcija_id, faza) znači da drugi i svaki sledeći poziv ne
// upisuju ništa. Zato se `prosao_at` ne pomera unazad ni unapred: pamti se prvi
// put kad je dete prošlo, a ne poslednji.
//
// RED SE NIKAD NE BRIŠE
// ---------------------
// Nema grane koja ovaj red uklanja, i to je pravilo a ne previd. Dete koje se
// vrati na fazu učenja - da ponovi reči pred vežbu, ili zato što mu je tako
// lepše - ne sme time da zaključa ono što mu je već otključano. Povratak na
// učenje je dobrodošao i ne košta ništa.
//
// KLIJENT NE ČEKA ODGOVOR
// -----------------------
// Vežbe se otključavaju odmah, u pretraživaču, a ovaj poziv ide u pozadini.
// Ako upis padne, dete tog trena ne gubi ništa: samo će ga sledeći dolazak na
// lekciju opet provesti kroz fazu učenja. Sličice, niz i rekordi se ovde ne
// diraju, pa ništa zarađeno ne zavisi od ovog reda.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clanstvoAktivno, jeUuid, lekcijaUUdzbeniku, nadjiDete } from "@/lib/zack/upiti";
import { PORUKA_ZAKLJUCANO } from "@/lib/zack/clanstvo";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Faze učenja, tačno onako kako ih baza dozvoljava u CHECK ograničenju. */
const FAZE = ["reci", "recenice"] as const;
type Faza = (typeof FAZE)[number];

/**
 * Bilo šta van spiska bi puklo tek u bazi, kao 500 umesto poštenog 400, a i
 * spisak faza mora da stoji na jednom mestu i uz kolonu i uz rutu.
 */
function jeFaza(v: unknown): v is Faza {
  return typeof v === "string" && (FAZE as readonly string[]).includes(v);
}

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return greska("Nema takvog deteta", 404);

  // Bez članstva su i učenje i vežbe zaključani NA SERVERU, ne samo u UI -
  // mirna poruka, bez cene i bez krivice, isto kao u `zaradi`.
  if (!(await clanstvoAktivno(dete.id))) return greska(PORUKA_ZAKLJUCANO, 403);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }
  const o = telo as Record<string, unknown>;

  // Neispravan oblik ključa bi u Postgresu izazvao grešku i time 500 umesto
  // poštenog 400, zato se proverava pre upita.
  if (typeof o.lekcijaId !== "string" || !jeUuid(o.lekcijaId)) {
    return greska("Nedostaje ispravan lekcijaId", 400);
  }
  if (!jeFaza(o.faza)) {
    return greska(`Faza mora biti ${FAZE.join(" ili ")}`, 400);
  }
  const lekcijaId = o.lekcijaId;
  const faza = o.faza;

  // Lekcija mora da bude iz udžbenika ovog deteta. Tuđa lekcija se ne priznaje
  // i ne pominje: isti odgovor kao da je nema, kao u `rekord` i `kesica`.
  if (!(await lekcijaUUdzbeniku(lekcijaId, dete.udzbenik_id))) {
    return greska("Nema takve lekcije", 404);
  }

  const sb = createAdminClient();
  // Sve se vezuje za dete.id, nikad za childId iz adrese.
  const { error } = await sb
    .from("zack_ucenje_prolazi")
    .upsert(
      { dete_id: dete.id, lekcija_id: lekcijaId, faza },
      { onConflict: "dete_id,lekcija_id,faza", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[zack/ucenje] upis prolaza:", error);
    return greska("Prolaz nije upisan", 500);
  }

  return NextResponse.json({ ok: true });
}
