import type { SupabaseClient } from "@supabase/supabase-js";
import { pickAllByEmail, normalizeEmail } from "./match";
import { logInteraction } from "./contacts";

/**
 * Kupovina pomera lid u „upisan".
 *
 * Pouka 11.10.2026: Nikolina Mataija je ostavila mejl u razgovoru sa Smile-om (CRM je
 * napravio lid „kontaktiran"), tri sata kasnije kupila 1:1 B2.1 za 42.500 din, a u 13.15
 * joj je iz CRM-a otišao odgovor sa preporukom grupnih kurseva. Faza se do tada pomerala
 * SAMO na nov dolazni signal (fazaPosleSignala), pa je 82 osobe koje su platile CRM i
 * dalje vodio kao otvorene lidove.
 *
 * Ovo je obrnut smer od fazaPosleSignala i ne sudara se sa njom: ona reaguje na DOLAZNI
 * signal (nekad namerno vraća kupca u „nov", npr. kad popuni kontakt formu), ova na
 * NAPLATU. Zato se zove samo za prvu naplatu narudžbine - vidi poziv u grant-access.ts.
 */

export interface KupovinaNarudzbina {
  order_number?: string | number | null;
  email?: string | null;
  full_name?: string | null;
  user_id?: string | null;
}

export interface KontaktStanje {
  stage: string | null;
  name: string | null;
  user_id: string | null;
}

export interface PlanIzmene {
  patch: Record<string, unknown>;
  /** Faza se menjala - samo tada ima smisla traga u istoriji kontakta. */
  promenjenaFaza: boolean;
  prethodnaFaza: string | null;
}

/**
 * Šta upisati u kontakt posle plaćene narudžbine. Vraća null kad nema šta da se menja.
 * „izgubljen" se NAMERNO takođe pomera: osoba je platila, pa je „izgubljen" činjenično
 * netačan, a ostavljen bi je sakrio iz „upisan" arhive i vodio kao lid koji se još može
 * pridobiti.
 */
export function planIzmeneKontakta(cur: KontaktStanje, order: KupovinaNarudzbina): PlanIzmene | null {
  const patch: Record<string, unknown> = {};
  const promenjenaFaza = cur.stage !== "upisan";
  if (promenjenaFaza) patch.stage = "upisan";
  const ime = order.full_name?.trim();
  if (!cur.name?.trim() && ime) patch.name = ime;
  if (!cur.user_id && order.user_id) patch.user_id = order.user_id;
  if (Object.keys(patch).length === 0) return null;
  return { patch, promenjenaFaza, prethodnaFaza: cur.stage };
}

/**
 * Za plaćenu narudžbinu nađe CRM kontakt po mejlu i pomeri ga u „upisan".
 * Kontakt koji ne postoji se NE pravi: CRM je prodajni levak, ne baza polaznika.
 * Baca grešku ako upis padne (pozivalac je best-effort i hvata je); ostale kontakte
 * istog mejla ipak obiđe.
 * Vraća broj kontakata koji su stvarno izmenjeni.
 */
export async function oznaciKupca(admin: SupabaseClient, order: KupovinaNarudzbina): Promise<number> {
  const email = normalizeEmail(order.email);
  if (!email) return 0;

  // ilike bez escape-a: „_" u mejlu je džoker i može da povuče višak redova, ali ništa
  // ne propušta, a tačno poređenje radi pickAllByEmail ispod.
  const { data: rows, error } = await admin
    .from("crm_contacts")
    .select("id,email,stage,name,user_id")
    .ilike("email", email)
    .limit(50);
  if (error) throw new Error(`crm_contacts čitanje: ${error.message}`);

  const kontakti = pickAllByEmail(
    (rows ?? []) as (KontaktStanje & { id: string; email: string | null })[],
    email,
  );

  const greske: string[] = [];
  let izmenjeno = 0;
  for (const c of kontakti) {
    const plan = planIzmeneKontakta(c, order);
    if (!plan) continue;
    const { error: upErr } = await admin.from("crm_contacts").update(plan.patch).eq("id", c.id);
    if (upErr) {
      greske.push(`${c.id}: ${upErr.message}`);
      continue;
    }
    izmenjeno++;
    if (plan.promenjenaFaza) {
      const oznaka = order.order_number != null && order.order_number !== "" ? ` - narudžbina ${order.order_number}` : "";
      await logInteraction(admin, {
        contactId: c.id,
        channel: "sistem",
        direction: "interna",
        summary: `Kupovina potvrđena${oznaka}`,
        body: `Faza kontakta je promenjena iz „${plan.prethodnaFaza ?? "nepoznato"}" u „upisan" jer je naplata prošla.`,
        meta: { order_number: order.order_number ?? null, prethodna_faza: plan.prethodnaFaza },
      });
    }
  }
  if (greske.length) throw new Error(`crm_contacts izmena pala: ${greske.join("; ")}`);
  return izmenjeno;
}
