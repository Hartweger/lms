// Čista logika chat klijenta (components/clanstvo/ChatKlijent.tsx),
// izdvojena radi testiranja: dedupe/uklanjanje poruka i mapa nepročitanog.

export interface ChatPoruka {
  id: string;
  kanal_id: string;
  user_id: string;
  ime: string;
  tekst: string;
  created_at: string;
}

// Dedupe pri dodavanju poruke - i sopstveni insert i realtime INSERT event
// mogu doneti isti red (id), pa se dodaje samo ako još nije prisutan.
export function dodajPoruku(spisak: ChatPoruka[], nova: ChatPoruka): ChatPoruka[] {
  if (spisak.some((p) => p.id === nova.id)) return spisak;
  return [...spisak, nova];
}

// Realtime DELETE payload nosi samo id (replica identity default) - uklanjanje
// id-a kog nema u spisku je bezopasno (poruka iz drugog kanala).
export function ukloniPoruku(spisak: ChatPoruka[], id: string): ChatPoruka[] {
  return spisak.filter((p) => p.id !== id);
}

export type NeprocitanoMapa = Record<string, number>;

export function uvecajNeprocitano(mapa: NeprocitanoMapa, kanalId: string): NeprocitanoMapa {
  return { ...mapa, [kanalId]: (mapa[kanalId] ?? 0) + 1 };
}

export function ocistiNeprocitano(mapa: NeprocitanoMapa, kanalId: string): NeprocitanoMapa {
  if (!mapa[kanalId]) return mapa;
  return { ...mapa, [kanalId]: 0 };
}
