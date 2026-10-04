import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/api-auth";
import {
  getCatalogText, getPreviewLessonsText, getFreeCoursesText, getOpenGroupsText, getNatasaIndividualText,
} from "@/lib/naki/catalog";
import { SMILE_MODEL, buildSalesSystemPrompt } from "@/lib/naki/sales-prompt";
import { userOwnsAnyVideoCourse } from "@/lib/coupon-ownership";
import { buildCrmDraftUserPrompt } from "@/lib/crm/draft-prompt";

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

  // Šta osoba već poseduje (da AI ne nudi ono što već ima)
  let owned: string[] = [];
  if (contact.user_id) {
    const { data: access } = await admin
      .from("course_access").select("courses(title)").eq("user_id", contact.user_id);
    owned = (access ?? [])
      .map((a: { courses: { title: string } | { title: string }[] | null }) =>
        Array.isArray(a.courses) ? a.courses[0]?.title : a.courses?.title)
      .filter((t): t is string => Boolean(t));
  }

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
  const ownsVideo = contact.user_id ? await userOwnsAnyVideoCourse(admin, contact.user_id) : false;
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
