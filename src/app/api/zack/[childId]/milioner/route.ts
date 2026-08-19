// Gradivo za Milionera: gramatičke tačke i pitanja koja smeju da se pitaju iz
// ove lekcije.
//
// PRAVILO KOJE SE NE SME PREKRŠITI
// -------------------------------
// Vraća se samo gradivo sa `od_lekcije <= broj ove lekcije`. Broj lekcije se NE
// uzima iz adrese ni iz tela zahteva, nego se čita iz baze po `lekcijaId`, i to
// unutar udžbenika ovog deteta. Da se uzima iz tela, dete bi poslalo veći broj
// i dobilo gradivo koje škola nije radila - upravo ono što ovo pravilo sprečava.
//
// ZAŠTO SE `tacan` IPAK VRAĆA
// ---------------------------
// Odgovor nosi i koji je odgovor tačan, pa ko otvori mrežnu karticu u
// pretraživaču može da ga pročita. To je svesna odluka, ne propust:
//
// 1. NEMA ŠTA DA SE UKRADE. Milioner ne troši srca, ne daje sličice i ne upisuje
//    rezultat nigde. Jedina nagrada je rečenica „12 od 15" koja nestane kad se
//    ekran zatvori. Zaštita čuva nešto što ima vrednost, a ovde je nema.
// 2. PARTIJA MORA DA PREŽIVI LOŠU VEZU. Da se svaki odgovor proverava na
//    serveru, dete u kolima ili na slabom vaj-faju bi usred kviza ostalo na
//    pitanju koje ne može da odgovori. U ostalim igrama pad mreže sme da prođe
//    neprimećeno; ovde bi zaustavio partiju. Pravilo „greška ne prekida partiju"
//    vredi više od skrivenog broja.
// 3. POLA-POLA BI TRAŽIO SVOJ POZIV. Ta pomoć mora da zna koji su odgovori
//    netačni. Bez `tacan` na strani deteta, svaka pomoć postaje još jedan poziv
//    koji može da padne, i to baš u trenutku kad se dete muči sa pitanjem.
//
// Dvanaestogodišnjak koji otvori mrežnu karticu da bi video odgovor na pitanje
// iz nemačkog je uložio više truda nego da je naučio gradivo, i nikoga nije
// oštetio. Kad Milioner jednom počne da upisuje rezultat, ova odluka se menja,
// i tada provera odgovora ide na server.
import { NextResponse } from "next/server";
import {
  clanstvoAktivno,
  brojLekcijeUUdzbeniku,
  dozvoljenaGramatika,
  gramatickaPitanja,
  greskePitanja,
  jeUuid,
  nadjiDete,
} from "@/lib/zack/upiti";
import { PORUKA_ZAKLJUCANO } from "@/lib/zack/clanstvo";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return greska("Nema takvog deteta", 404);

  // Bez članstva su igre zaključane i NA SERVERU, ne samo u UI - mirna poruka,
  // bez cene i bez krivice. Album i sve zarađeno ostaju netaknuti; oslobođena
  // deca i naša probna (bez roditelja) prolaze - vidi lib/zack/clanstvo.ts.
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
  const lekcijaId = (telo as Record<string, unknown>).lekcijaId;
  // Neispravan oblik ključa bi u Postgresu izazvao grešku i time 500 umesto
  // poštenog 400, zato se proverava pre upita.
  if (typeof lekcijaId !== "string" || !jeUuid(lekcijaId)) {
    return greska("Nedostaje ispravan lekcijaId", 400);
  }

  try {
    // Jedan upit odgovara na oba pitanja: da li je lekcija ovog deteta i koji
    // joj je broj. Broj je ono po čemu se meri šta je obrađeno.
    const brojLekcije = await brojLekcijeUUdzbeniku(lekcijaId, dete.udzbenik_id);
    if (brojLekcije === null) return greska("Nema takve lekcije", 404);

    const tacke = await dozvoljenaGramatika(dete.udzbenik_id, brojLekcije);
    if (tacke.length === 0) {
      // Nije greška: lekcija prosto još nema obrađenog gradiva za proveru.
      return NextResponse.json({ brojLekcije, tacke: [], pitanja: [], greske: {} });
    }

    // Uz gradivo idu i ranije promašena pitanja deteta (ključ → koliko puta):
    // `sastaviPartiju` im daje prednost, da se rupa u gradivu ne zaobilazi
    // slučajnošću. Ovo nije rezultat ni ocena - detetu se nigde ne pokazuje.
    const [pitanja, greske] = await Promise.all([
      gramatickaPitanja(tacke.map((t) => t.id)),
      greskePitanja(dete.id),
    ]);
    return NextResponse.json({ brojLekcije, tacke, pitanja, greske: Object.fromEntries(greske) });
  } catch (e) {
    // Sirova poruka iz Postgresa ide u log, detetu se ne prosleđuje.
    console.error("[zack/milioner] čitanje gradiva:", e);
    return greska("Gradivo nije pročitano", 500);
  }
}
