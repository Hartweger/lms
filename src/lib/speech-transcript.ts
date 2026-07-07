// Spajanje rezultata prepoznavanja govora (Web Speech API).
//
// Desktop Chrome finalne rezultate šalje kao ZASEBNE segmente - ispravno je
// nadovezati ih. Chrome na Androidu, međutim, svaki parcijalni rezultat šalje
// označen kao finalan i KUMULATIVAN (sadrži celu rečenicu do tog trenutka),
// pa nadovezivanje multiplicira reči: "im im Wohnzimmer im Wohnzimmer steht...".
// Zato: ako novi rezultat "nastavlja" postojeći tekst (počinje njegovim
// rečima), on ga ZAMENJUJE; u suprotnom se nadovezuje.

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.!?,;:„“”‚’‘"'\-—–…()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function mergeTranscript(prev: string, next: string): string {
  const n = next.replace(/\s+/g, " ").trim();
  if (!n) return prev.replace(/\s+/g, " ").trim();
  const p = prev.replace(/\s+/g, " ").trim();
  if (!p) return n;

  const pt = tokens(p);
  const nt = tokens(n);
  // Kumulativan rezultat: novi je bar iste dužine, a početak mu se (skoro)
  // poklapa sa prethodnim. Prag < 1 jer engine ume da revidira poneku raniju
  // reč dok kuca kumulativne finale ("sind" -> "steht").
  if (pt.length > 0 && nt.length >= pt.length) {
    let same = 0;
    for (let i = 0; i < pt.length; i++) {
      if (pt[i] === nt[i]) same++;
    }
    if (same / pt.length >= 0.6) return n;
  }
  return p + " " + n;
}
