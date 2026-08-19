// Gost-kupovina zack! članstva: roditelj sa landinga plaća U JEDNOM POTEZU,
// bez prethodne prijave - nalog, roditeljski red i dete nastaju tek POSLE
// uspešne naplate (grant-access). Ovde je čista logika tog toka: provera
// unosa sa javne kupovne strane, oblik gost-zapisa koji porudžbina nosi kao
// dokaz pristanka, i pravilo kada hvala strana sme da ponudi postavljanje
// PIN-a.
//
// NAMERNO BEZ SERVERSKIH UVOZA (supabase i sl.): ovo uvoze i klijentske
// komponente (obrazac na kupovnoj strani) i vitest - isti razlog kao u
// clanstvo.ts.
import { isDeliverableEmail, domainTypoHint } from "@/lib/email-valid";

/** Ista granica kao u /api/zack/roditelj/deca - ime je detetovo, samo ime. */
export const GOST_IME_NAJVISE = 40;

/**
 * Zapis koji gost-porudžbina nosi u items[0].zack_gost dok dete još ne
 * postoji. Tekst pristanka i vreme se čuvaju CELI, u trenutku kreiranja
 * porudžbine - dokaz šta je roditelj stvarno video i kad, isto pravilo kao
 * zack_roditelji.pristanak_tekst. Posle uspešne naplate grant-access iz ovoga
 * pravi roditelja i dete, pa u stavku upiše dete_id; zack_gost ostaje kao
 * trag porekla.
 */
export type ZackGostMeta = {
  ime: string;
  udzbenik_id: string;
  pristanak_tekst: string;
  pristanak_at: string;
};

/** Isti oblik kao jeUuid u upiti.ts - ovde ponovljen da se ne uvuče serverski modul. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GostProvera =
  | { ok: true; ime: string; udzbenikId: string; email: string }
  | { ok: false; poruka: string };

/**
 * Provera unosa gost-obrasca - ISTA na klijentu (poruka uz polje) i na
 * serveru (/api/orders ne veruje klijentu). Vraća normalizovane vrednosti:
 * ime bez ivičnih razmaka, mejl malim slovima.
 *
 * PAŽNJA: nijedna poruka odavde ne sme da kaže da li mejl već postoji u
 * sistemu - grananje po postojećem nalogu ide tek posle uplate, u
 * grant-access. Ovde se proverava samo OBLIK unosa.
 */
export function proveriGostUnos(u: {
  ime?: unknown;
  udzbenikId?: unknown;
  email?: unknown;
  pristanak?: unknown;
}): GostProvera {
  const ime = typeof u.ime === "string" ? u.ime.trim() : "";
  if (!ime) return { ok: false, poruka: "Upiši ime deteta." };
  if (ime.length > GOST_IME_NAJVISE) return { ok: false, poruka: "Ime je predugačko." };

  if (typeof u.udzbenikId !== "string" || !UUID.test(u.udzbenikId)) {
    return { ok: false, poruka: "Izaberi razred i udžbenik." };
  }

  const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";
  if (!email || !isDeliverableEmail(email)) {
    const predlog = email ? domainTypoHint(email) : null;
    return {
      ok: false,
      poruka: predlog
        ? `Proveri mejl adresu - da nije ${email.split("@")[0]}@${predlog}?`
        : "Upiši ispravnu mejl adresu - na nju stižu kod deteta i računi.",
    };
  }

  // Server proverava pristanak ponovo, ne samo UI: bez štikliranog pristanka
  // porudžbina ne sme da nastane, jer se iz nje posle uplate pravi dete.
  if (u.pristanak !== true) {
    return { ok: false, poruka: "Potvrdi pristanak - bez njega ne smemo da napravimo profil deteta." };
  }

  return { ok: true, ime, udzbenikId: u.udzbenikId, email };
}

/**
 * Da li hvala strana sme da ponudi postavljanje PIN-a. Pravilo:
 * - porudžbina mora biti zack (stavka nosi dete_id) i NAPLAĆENA,
 * - PIN se nudi SAMO dok je pin_hash NULL - jednom postavljen, obrazac se
 *   više ne prikazuje (idempotentno), menja se posle isključivo u panelu.
 *
 * Isto pravilo koriste i strana (da li da crta obrazac) i ruta
 * /api/zack/gost/pin (da li da primi zahtev), da se UI i server ne raziđu.
 */
export function smePostavljanjePina(o: {
  paymentStatus: string;
  deteId: string | null | undefined;
  pinHash: string | null | undefined;
}): boolean {
  if (!o.deteId) return false;
  if (o.paymentStatus !== "completed") return false;
  return o.pinHash === null;
}
