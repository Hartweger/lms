// NaKI content teme - rangiranje najčešćih muka iz razgovora za nedeljni
// "NaKI pitanje nedelje" mejl. Svaka tema nosi gotov YT ugao i IG ideju.
// Skripta scripts/naki-topics.mjs radi istu analizu za ad-hoc pregled.

export type NakiTopic = {
  name: string;
  re: RegExp;
  yt: string;
  ig: string;
};

// Redosled nije bitan - rangira se po broju sesija. Regexi rade nad lowercase tekstom.
export const NAKI_CONTENT_TOPICS: NakiTopic[] = [
  {
    name: "Negacija kein/nicht",
    re: /\bkein|\bnicht\b|negacij/,
    yt: "kein ili nicht? Pravilo koje vecina koristi pogresno (negiras imenicu = kein, sve ostalo = nicht).",
    ig: "Reel kviz: 'Ich trinke ___ Kaffee - kein ili nicht?' pa pravilo u jednoj recenici.",
  },
  {
    name: "Veznici / spajanje recenica (weil/dass/obwohl)",
    re: /\bweil\b|\bdass\b|\bobwohl\b|\bwenn\b|veznik|spajanj|spojim|spoji/,
    yt: "Zasto glagol skace na kraj? weil, dass, obwohl objasnjeni na primerima.",
    ig: "Reel 30s: zasto posle 'weil' glagol ide na kraj recenice.",
  },
  {
    name: "Padezi / rod (der/die/das, dativ)",
    re: /pade[zž]|dativ|akuzativ|\bder die das\b|koji je rod|rod imenic|mu[sš]ki rod|[zž]enski rod|srednji rod/,
    yt: "Kako konacno zapamtiti rod - MARMELADEN trik za dativ.",
    ig: "Carousel: zasto 'in der Schule' a 'im Krankenhaus'.",
  },
  {
    name: "Modalni glagoli",
    re: /modaln|m[oö]gen|m[uü]ssen|k[oö]nnen|d[uü]rfen|wollen|sollen|m[oö]chte/,
    yt: "Modalni glagoli: kako reci 'moram, mogu, hocu' i gde ide drugi glagol.",
    ig: "Reel: möchten vs wollen - kad koji.",
  },
  {
    name: "Konjunktiv / würde",
    re: /konjunktiv|w[uü]rde|h[aä]tte|w[aä]re|kondicional/,
    yt: "würde + Infinitiv - najlaksi nacin da zvucis pristojno na nemackom.",
    ig: "Reel: 'Ich haette gern / Ich wuerde gern' - kako se ljubazno trazi.",
  },
  {
    name: "Perfekt / proslo vreme (sein vs haben)",
    re: /perfekt|pro[sš]l|getrunken|gegangen|gegessen|gemacht|partizip/,
    yt: "Proslo vreme u govoru - Perfekt za 10 minuta (sein ili haben?).",
    ig: "Reel: 'bin' ili 'habe'? Glagoli kretanja idu sa sein.",
  },
  {
    name: "Vokabular / pojedinacne reci",
    re: /\bre[cč]\b|re[cč]i|vokabular|nova re|kako se ka[zž]e/,
    yt: "10 nemackih reci koje nemaju smisla - dok ne saznas zasto (Spiegelei, Ruehrei...).",
    ig: "Serija 'Zasto Nemci kazu...?' - jedna fora po Reelu.",
  },
  {
    name: "Prevod (trazi prevod)",
    re: /prevedi|prevod|[sš]ta zna[cč]i|znaci na nema/,
    yt: "5 srpskih recenica koje pogresno prevodimo na nemacki.",
    ig: "Reel: 'kako se kaze ___' - rec nedelje sa primerom upotrebe.",
  },
  {
    name: "Razdvojivi glagoli (trennbar)",
    re: /razdvoj|trennbar|aufstehen|ansehen|fernsehen|einkaufen|mitkommen/,
    yt: "Razdvojivi glagoli: zasto 'an' leti na kraj recenice.",
    ig: "Reel: 'Ich stehe um 7 auf' - gde ode 'auf'?",
  },
  {
    name: "Schreiben (formalan mejl / esej)",
    re: /schreiben|esej|sastav|formaln.*mejl|brief/,
    yt: "Kako napisati formalan mejl na nemackom (B1/B2 Schreiben).",
    ig: "Carousel: fraze za pocetak i kraj formalnog mejla.",
  },
];

export type RankedTopic = { topic: NakiTopic; sessions: number; hits: number };

// Rangira teme po broju RAZLIČITIH sesija u kojima se javljaju (pravi signal tražnje).
export function rankNakiTopics(
  userMessages: { session_id: string; message: string }[]
): RankedTopic[] {
  const lowered = userMessages.map((m) => ({ s: m.session_id, t: m.message.toLowerCase() }));
  return NAKI_CONTENT_TOPICS.map((topic) => {
    const sess = new Set<string>();
    let hits = 0;
    for (const { s, t } of lowered) {
      if (topic.re.test(t)) {
        hits++;
        sess.add(s);
      }
    }
    return { topic, sessions: sess.size, hits };
  }).sort((a, b) => b.sessions - a.sessions);
}

// Bira do `n` reprezentativnih (kratkih, različitih) korisničkih pitanja za datu temu.
export function pickExamples(
  userMessages: { message: string }[],
  topic: NakiTopic,
  n = 3
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of userMessages) {
    const t = m.message.trim();
    if (t.length < 6 || t.length > 120) continue;
    if (!topic.re.test(t.toLowerCase())) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= n) break;
  }
  return out;
}
