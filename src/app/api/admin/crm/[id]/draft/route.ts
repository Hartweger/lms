import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/api-auth";
import {
  getCatalogText, getPreviewLessonsText, getFreeCoursesText, getOpenGroupsText, getNatasaIndividualText,
} from "@/lib/naki/catalog";
import { SMILE_MODEL, buildSalesSystemPrompt } from "@/lib/naki/sales-prompt";
import { userOwnsAnyVideoCourse } from "@/lib/coupon-ownership";
import { buildCrmDraftUserPrompt } from "@/lib/crm/draft-prompt";
import { opisKupca, type PlacenaNarudzbina, type PristupSaNaslovom } from "@/lib/crm/customer-status";
import { normalizeEmail, pickAllByEmail } from "@/lib/crm/match";
import { datumSlovima } from "@/lib/datum";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface InteractionRow { direction: string; summary: string | null; body: string | null; occurred_at: string }

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({ error: "AI nije dostupan." }, { status: 503 });
  }
  const { id } = await params;

  const { data: contact } = await admin
    .from("crm_contacts").select("name,level,source,email,instagram_handle,user_id").eq("id", id).single();
  if (!contact) return NextResponse.json({ error: "Kontakt ne postoji." }, { status: 404 });

  // Nalog polaznika: kontakt ga nema uvek upisanog (lid iz razgovora), a mejl ga ipak nalazi -
  // isto povezivanje kao u upsertContact.
  let userId: string | null = contact.user_id ?? null;
  const email = normalizeEmail(contact.email);
  if (!userId && email) {
    const { data: prof } = await admin.from("user_profiles").select("id").ilike("email", email).maybeSingle();
    userId = prof?.id ?? null;
  }

  // Šta osoba već poseduje (da AI ne nudi ono što već ima) i da li je uopšte kupac.
  let owned: string[] = [];
  let pristup: PristupSaNaslovom[] = [];
  if (userId) {
    const { data: access } = await admin
      .from("course_access").select("expires_at,source,courses(title)").eq("user_id", userId);
    const rows = (access ?? []) as unknown as {
      expires_at: string | null;
      source: string | null;
      courses: { title: string } | { title: string }[] | null;
    }[];
    pristup = rows.map((a) => ({
      expires_at: a.expires_at,
      source: a.source,
      title: Array.isArray(a.courses) ? a.courses[0]?.title : a.courses?.title,
    }));
    owned = pristup.map((a) => a.title).filter((t): t is string => Boolean(t));
  }

  // Plaćene narudžbine po mejlu i po nalogu. Mejl-upit sa ilike može da povuče i tuđe redove
  // (džoker „_"), pa se tačno poređenje radi posle - pogrešno upozorenje je skoro jednako
  // loše kao propušteno.
  const narudzbine: PlacenaNarudzbina[] = [];
  const ORDER_COLS = "order_number,created_at,items,email";
  if (email) {
    const { data } = await admin.from("orders").select(ORDER_COLS)
      .eq("payment_status", "completed").ilike("email", email).limit(50);
    narudzbine.push(...pickAllByEmail((data ?? []) as (PlacenaNarudzbina & { email: string | null })[], email));
  }
  if (userId) {
    const { data } = await admin.from("orders").select(ORDER_COLS)
      .eq("payment_status", "completed").eq("user_id", userId).limit(50);
    for (const n of (data ?? []) as (PlacenaNarudzbina & { email: string | null })[]) {
      if (!narudzbine.some((x) => x.order_number === n.order_number && x.created_at === n.created_at)) narudzbine.push(n);
    }
  }
  const kupac = opisKupca(narudzbine, pristup, datumSlovima);

  const { data: rawInteractions } = await admin
    .from("crm_interactions")
    .select("direction,summary,body,occurred_at")
    .eq("contact_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  // Najnovijih 50, pa hronološki; seče se od početka da poslednja poruka lida uvek ostane.
  const razgovor = [...(rawInteractions ?? [])].reverse()
    .map((it: InteractionRow) => {
      const ko = it.direction === "odlazna" ? "Mi" : "Lid";
      const tekst = [it.summary, it.body].filter(Boolean).join(" - ");
      return tekst ? `${ko}: ${tekst}` : null;
    })
    .filter(Boolean)
    .join("\n")
    .slice(-6000);

  // Isti izvor istine kao Smile: katalog, otvoreni grupni termini, Nataša na 1:1,
  // probne i besplatne lekcije. Mejl-režim je u user poruci (src/lib/crm/draft-prompt.ts).
  const ownsVideo = userId ? await userOwnsAnyVideoCourse(admin, userId) : false;
  const [catalogText, previewText, freeText, groupsText, natasaText] = await Promise.all([
    getCatalogText(admin),
    getPreviewLessonsText(admin),
    getFreeCoursesText(admin),
    getOpenGroupsText(),
    getNatasaIndividualText(admin),
  ]);
  const systemPrompt = buildSalesSystemPrompt(catalogText, {
    coupon: !ownsVideo,
    leadCapture: false,
    previews: previewText,
    free: freeText,
    groups: groupsText,
    natasa: natasaText,
  });
  const prompt = buildCrmDraftUserPrompt({
    ime: contact.name || "lid",
    nivo: contact.level,
    izvor: contact.source,
    owned,
    razgovor,
    kupac,
  });

  try {
    const completion = await anthropic.messages.create({
      model: SMILE_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const block = completion.content[0];
    const text = block && block.type === "text" ? block.text.trim() : "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: "AI nije vratio upotrebljiv predlog." }, { status: 502 });
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
    const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
    if (!subject || !message) {
      return NextResponse.json({ error: "AI predlog je nepotpun." }, { status: 502 });
    }
    return NextResponse.json({ subject, message });
  } catch (e) {
    console.error("[crm] AI draft pao", e);
    return NextResponse.json({ error: "Greška pri generisanju predloga." }, { status: 502 });
  }
}
