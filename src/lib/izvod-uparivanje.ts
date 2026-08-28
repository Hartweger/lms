// src/lib/izvod-uparivanje.ts
// Šta predložiti za svaku stavku sa izvoda. Čist modul: bez baze i bez mreže.
//
// Načelo: sistem PREDLAŽE, Nataša potvrđuje. Zato svaka stavka dobija predlog i
// razlog, a nikad se ništa ne knjiži samo.

import { nadjiBrojNarudzbine, type IzvodStavka } from "@/lib/izvod-xml";

/** Narudžbina koja čeka uplatu, svedena na ono što treba za uparivanje. */
export interface CekaUplatu {
  id: string;
  orderNumber: string;
  total: number;
}

export interface Predlog {
  vrsta: "uplata" | "trosak" | "nista";
  /** Narudžbina za koju je uplata, kad je vrsta "uplata". */
  orderId?: string;
  orderNumber?: string;
  /** Predložena kategorija, kad je vrsta "trosak". Null = Nataša bira. */
  kategorija?: string | null;
  /** Zašto je predlog takav - piše se korisnici, ne u dnevnik. */
  razlog: string;
  /** Iznos na izvodu se ne poklapa sa narudžbinom. Traži pogled. */
  neslaganje?: { ocekivano: number; stiglo: number };
}

/**
 * Prilivi koje ne treba nuditi kao uplatu za kurs: dnevni obračun kartičnog
 * prometa i slično. Prepoznaju se po svrsi, ne po iznosu.
 */
const NIJE_UPLATA_ZA_KURS = /^KART\.TRANS|^POS |obracun kartic/i;

/**
 * Odlivi koji nisu poslovni trošak nego premeštanje sopstvenog novca.
 * Za njih se ne nudi kategorija - ne knjiže se kao trošak.
 */
const NIJE_TROSAK = /prenos sredstava na sopstveni|interni prenos/i;

export function predloziZa(
  s: IzvodStavka,
  cekaju: readonly CekaUplatu[],
  pravila: ReadonlyMap<string, string>,
): Predlog {
  if (s.smer === "priliv") {
    if (s.svrha && NIJE_UPLATA_ZA_KURS.test(s.svrha)) {
      return { vrsta: "nista", razlog: "Obračun kartičnog prometa, ne uplata za kurs." };
    }

    const broj = nadjiBrojNarudzbine(
      s,
      cekaju.map((n) => n.orderNumber),
    );
    if (!broj) {
      return { vrsta: "nista", razlog: "Nema poziva na broj koji odgovara narudžbini koja čeka uplatu." };
    }

    const n = cekaju.find((x) => x.orderNumber === broj)!;
    // Zaokruživanje na dinar: banka ume da prikaže 40250.00, mi čuvamo 40250.
    const razlika = Math.round(s.iznos) - Math.round(n.total);
    if (razlika !== 0) {
      return {
        vrsta: "uplata",
        orderId: n.id,
        orderNumber: n.orderNumber,
        razlog:
          razlika > 0
            ? `Stiglo ${razlika.toLocaleString("sr-RS")} RSD više nego što narudžbina traži.`
            : `Fali ${Math.abs(razlika).toLocaleString("sr-RS")} RSD do punog iznosa.`,
        neslaganje: { ocekivano: n.total, stiglo: s.iznos },
      };
    }

    return {
      vrsta: "uplata",
      orderId: n.id,
      orderNumber: n.orderNumber,
      razlog: "Poziv na broj i iznos se poklapaju.",
    };
  }

  // Odliv
  if (s.svrha && NIJE_TROSAK.test(s.svrha)) {
    return { vrsta: "nista", razlog: "Premeštanje sopstvenog novca, nije trošak." };
  }

  const kategorija = kategorijaZa(s, pravila);
  return {
    vrsta: "trosak",
    kategorija,
    razlog: kategorija
      ? "Kategorija zapamćena od ranije."
      : "Nov dobavljač - izaberi kategoriju, zapamtiću je.",
  };
}

/**
 * Kategorija iz naučenih pravila. Traži se u nazivu I u svrsi, jer kartična
 * naplata nosi trgovca u svrsi ("...,FACEBK *VLCD22NKB4,DUBLIN,IE"), a naziv je
 * uvek ista banka.
 *
 * Duži obrazac pobeđuje: "GOOGLE ADS" je precizniji od "GOOGLE".
 */
export function kategorijaZa(
  s: Pick<IzvodStavka, "naziv" | "svrha">,
  pravila: ReadonlyMap<string, string>,
): string | null {
  const gde = [s.naziv, s.svrha].filter(Boolean).join(" ").toUpperCase();
  if (!gde) return null;

  let najduzi: string | null = null;
  let nadjena: string | null = null;
  for (const [obrazac, kategorija] of pravila) {
    const o = obrazac.toUpperCase();
    if (!gde.includes(o)) continue;
    if (najduzi === null || o.length > najduzi.length) {
      najduzi = o;
      nadjena = kategorija;
    }
  }
  return nadjena;
}

/**
 * Iz naziva i svrhe izvlači kratku oznaku dobavljača, kao predlog obrasca koji
 * se pamti. Kartična naplata ima trgovca posle zvezdice ili zareza.
 */
export function predlogObrasca(s: Pick<IzvodStavka, "naziv" | "svrha">): string {
  const svrha = s.svrha ?? "";
  // "...,FACEBK *VLCD22NKB4,DUBLIN,IE" → FACEBK
  const zvezdica = /([A-Za-zČĆŠŽĐčćšžđ0-9.\-& ]{3,})\s*\*/.exec(svrha);
  if (zvezdica) return zvezdica[1].trim().split(",").pop()!.trim();

  // "kartica EX92...,ANTHROPIC,DUBLIN,IE" → ANTHROPIC
  const delovi = svrha.split(",").map((d) => d.trim()).filter(Boolean);
  const kandidat = delovi.find((d) => d.length >= 4 && !/kartica|debitna|NATA/i.test(d));
  if (kandidat) return kandidat;

  return (s.naziv ?? "").split(",")[0].trim();
}
