// Kanali koje ManyChat šalje — svi su validni i kao CrmChannel i kao CrmSource.
export type IngestChannel = "instagram" | "whatsapp" | "manychat";

const VALID: IngestChannel[] = ["instagram", "whatsapp", "manychat"];

export interface IngestValue {
  email: string | null;
  name: string | null;
  phone: string | null;
  instagram: string | null;
  message: string | null;
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
  if (!email && !phone && !instagram) {
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
      channel: channel as IngestChannel,
    },
  };
}
