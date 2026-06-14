// Kanali ingesta: ManyChat (instagram/whatsapp/manychat) + Gmail/Apps Script (mejl).
export type IngestChannel = "instagram" | "whatsapp" | "manychat" | "mejl";

const VALID: IngestChannel[] = ["instagram", "whatsapp", "manychat", "mejl"];

export interface IngestValue {
  email: string | null;
  name: string | null;
  phone: string | null;
  instagram: string | null;
  message: string | null;
  subject: string | null;
  channel: IngestChannel;
}

export type ParseResult =
  | { ok: true; value: IngestValue }
  | { ok: false; error: string };

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  // ManyChat prazno polje renderuje kao neispunjen token, npr. "{{email}}" — tretiraj kao prazno.
  if (/^\{\{[^}]*\}\}$/.test(t)) return null;
  return t.slice(0, 4000);
}

export function parseIngest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Neispravan payload." };
  const b = body as Record<string, unknown>;
  const channel = str(b.channel);
  if (!channel || !(VALID as string[]).includes(channel)) {
    return { ok: false, error: "Nepoznat kanal." };
  }
  const email = str(b.email);
  const phone = str(b.phone);
  const instagram = str(b.instagram_handle ?? b.instagram);
  // Za mejl kanal email je obavezan (prirodni ključ); za ostale dovoljan je bilo koji identifikator.
  if (channel === "mejl") {
    if (!email) return { ok: false, error: "Mejl kanal zahteva email." };
  } else if (!email && !phone && !instagram) {
    return { ok: false, error: "Nedostaje identifikator (mejl/telefon/instagram)." };
  }
  return {
    ok: true,
    value: {
      email,
      name: str(b.name),
      phone,
      instagram,
      message: str(b.message),
      subject: str(b.subject),
      channel: channel as IngestChannel,
    },
  };
}
