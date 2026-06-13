import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalogText } from "@/lib/naki/catalog";
import { SMILE_MODEL } from "@/lib/naki/sales-prompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

interface InteractionRow { direction: string; summary: string | null; body: string | null; occurred_at: string }

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({ error: "AI nije dostupan." }, { status: 503 });
  }
  const { id } = await params;

  const { data: contact } = await admin
    .from("crm_contacts").select("name,level,email,instagram_handle").eq("id", id).single();
  if (!contact) return NextResponse.json({ error: "Kontakt ne postoji." }, { status: 404 });

  const { data: rawInteractions } = await admin
    .from("crm_interactions")
    .select("direction,summary,body,occurred_at")
    .eq("contact_id", id)
    .order("occurred_at", { ascending: true })
    .limit(50);

  const razgovor = (rawInteractions ?? [])
    .map((it: InteractionRow) => {
      const ko = it.direction === "odlazna" ? "Mi" : "Lid";
      const tekst = [it.summary, it.body].filter(Boolean).join(" — ");
      return tekst ? `${ko}: ${tekst}` : null;
    })
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);

  const catalogText = await getCatalogText(admin);

  const ime = contact.name || "lid";
  const nivo = contact.level ? `Procenjeni nivo: ${contact.level}.` : "Nivo nije poznat.";

  const prompt = `Ti si Nataša Hartweger, vlasnica škole nemačkog jezika Hartweger. Pišeš predlog mejl-odgovora osobi koja se zainteresovala za kurs. Tvoj zadatak je da napišeš topao, profesionalan i konkretan odgovor na osnovu razgovora.

PRAVILA:
- Obraćaj se na "ti" (ti-forma), prijateljski ali profesionalno.
- Ako je relevantno, predloži konkretan kurs i navedi cenu iz kataloga ispod. Ne izmišljaj cene ni kurseve kojih nema.
- Kratko i jasno (4-8 rečenica). Ne dodaji potpis na kraju (dodaje se automatski).
- Koristi isključivo običnu crticu (-), nikada — ni –.
- Ako lid nije postavio konkretno pitanje, napiši ljubazan podsticaj da nastavi razgovor.

KONTAKT: ${ime}. ${nivo}

KATALOG KURSEVA I CENA:
${catalogText}

RAZGOVOR DO SAD:
${razgovor || "(nema zabeleženog razgovora — napiši ljubazan prvi mejl koji poziva na razgovor o kursevima)"}

Vrati ISKLJUČIVO JSON u formatu: {"subject": "kratak naslov mejla", "message": "telo mejla"}`;

  try {
    const completion = await anthropic.messages.create({
      model: SMILE_MODEL,
      max_tokens: 800,
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
