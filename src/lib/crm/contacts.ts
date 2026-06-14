import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail, pickMatch } from "./match";
import type { CrmSource, CrmChannel, CrmDirection } from "./types";

export interface UpsertInput {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  instagram?: string | null;
  source: CrmSource;
  level?: string | null;
  userId?: string | null;
}

/**
 * Pronađe postojeći kontakt (po mejlu, pa po IG handle-u) ili kreira nov.
 * Ažurira last_interaction_at; popunjava prazna polja, ne gazi postojeća.
 * Vraća contact id ili null ako upis ne uspe.
 */
export async function upsertContact(
  admin: SupabaseClient,
  input: UpsertInput,
): Promise<string | null> {
  const email = normalizeEmail(input.email);
  const instagram = input.instagram?.trim().replace(/^@/, "").toLowerCase() || null;

  // Auto-poveži sa nalogom polaznika po mejlu (ako već nije prosleđen userId).
  let userId = input.userId || null;
  if (!userId && email) {
    const { data: prof } = await admin
      .from("user_profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (prof?.id) userId = prof.id;
  }

  // Aktivan kupac (ima bar jedan važeći pristup) → ne vodi se kao svež lid, ide u „upisan".
  let isActiveCustomer = false;
  if (userId) {
    const { data: acc } = await admin
      .from("course_access")
      .select("expires_at")
      .eq("user_id", userId);
    const nowMs = Date.now();
    isActiveCustomer = (acc ?? []).some(
      (a: { expires_at: string | null }) => a.expires_at === null || new Date(a.expires_at).getTime() > nowMs,
    );
  }

  // Učitaj kandidate (mali skup: po mejlu ili IG-u)
  const filters: string[] = [];
  if (email) filters.push(`email.ilike.${email}`);
  if (instagram) filters.push(`instagram_handle.ilike.${instagram}`);

  let existingId: string | null = null;
  if (filters.length) {
    const { data: rows } = await admin
      .from("crm_contacts")
      .select("id,email,instagram_handle")
      .or(filters.join(","))
      .limit(50);
    existingId = pickMatch(rows ?? [], { email, instagram });
  }

  const now = new Date().toISOString();

  if (existingId) {
    // Popuni samo prazna polja, uvek osveži last_interaction_at
    const patch: Record<string, unknown> = { last_interaction_at: now };
    if (input.name) patch.name = input.name;
    if (input.phone) patch.phone = input.phone;
    if (email) patch.email = email;
    if (instagram) patch.instagram_handle = instagram;
    if (input.level) patch.level = input.level;
    if (userId) patch.user_id = userId;
    if (isActiveCustomer) patch.stage = "upisan";
    const { data: cur } = await admin
      .from("crm_contacts")
      .select("name,phone,level,user_id")
      .eq("id", existingId)
      .single();
    if (cur?.name) delete patch.name;
    if (cur?.phone) delete patch.phone;
    if (cur?.level) delete patch.level;
    if (cur?.user_id) delete patch.user_id;
    await admin.from("crm_contacts").update(patch).eq("id", existingId);
    return existingId;
  }

  const { data, error } = await admin
    .from("crm_contacts")
    .insert({
      email,
      name: input.name || null,
      phone: input.phone || null,
      instagram_handle: instagram,
      user_id: userId,
      source: input.source,
      level: input.level || null,
      stage: isActiveCustomer ? "upisan" : "nov",
      last_interaction_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[crm] upsertContact insert failed", error);
    return null;
  }
  return data.id;
}

export interface LogInput {
  contactId: string;
  channel: CrmChannel;
  direction?: CrmDirection;
  summary?: string | null;
  body?: string | null;
  meta?: Record<string, unknown> | null;
  occurredAt?: string;
}

export async function logInteraction(
  admin: SupabaseClient,
  input: LogInput,
): Promise<void> {
  const occurred = input.occurredAt || new Date().toISOString();
  const { error } = await admin.from("crm_interactions").insert({
    contact_id: input.contactId,
    channel: input.channel,
    direction: input.direction || "dolazna",
    summary: input.summary || null,
    body: input.body || null,
    meta: input.meta || null,
    occurred_at: occurred,
  });
  if (error) console.error("[crm] logInteraction failed", error);
  else {
    await admin
      .from("crm_contacts")
      .update({ last_interaction_at: occurred })
      .eq("id", input.contactId);
  }
}
