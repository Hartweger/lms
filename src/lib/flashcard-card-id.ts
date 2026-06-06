/** Determinističan, stabilan id kartice. Ne zavisi od pozicije u nizu, razmaka, ni velikih slova. */
export function cardId(setKey: string, front: string, back: string): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const raw = `${setKey}::${norm(front)}::${norm(back)}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0; // djb2
  return `${setKey}_${h.toString(36)}`;
}
