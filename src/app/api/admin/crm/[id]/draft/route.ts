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
    .from("crm_contacts").select("name,level,email,instagram_handle,user_id").eq("id", id).single();
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
  const vecKupac = owned.length
    ? `\n\nVAŽNO - OVA OSOBA JE VEĆ KUPAC i poseduje ove kurseve: ${owned.join(", ")}. NE nudi joj te kurseve ponovo. Umesto toga predloži logičan sledeći korak: viši nivo, dopunski sadržaj, ili obnovu pristupa ako ističe. Ako nema šta da se ponudi, napiši topao mejl za održavanje odnosa (pitaj kako napreduje).`
    : "";

  const prompt = `Ti si Nataša Hartweger, vlasnica škole nemačkog jezika Hartweger. Pišeš predlog mejl-odgovora osobi koja se zainteresovala za kurs. Tvoj zadatak je da napišeš topao, profesionalan i konkretan odgovor na osnovu razgovora.

PRAVILA:
- Obraćaj se na "ti" (ti-forma), prijateljski ali profesionalno.
- Ako je relevantno, predloži konkretan kurs i navedi cenu iz kataloga ispod. Ne izmišljaj cene ni kurseve kojih nema.
- Ako lid nije postavio konkretno pitanje, napiši ljubazan podsticaj da nastavi razgovor.
- Za nivoe A2 i više, uvek pomeni da nudimo besplatno testiranje nivoa: https://www.hartweger.rs/besplatno-testiranje
- Kod NAKI10 (10% na video kurseve) pomeni samo ako osoba NIJE već kupac video kursa.
- Koristi isključivo običnu crticu (-), nikada — ni –.
- Ne dodaji potpis na kraju (dodaje se automatski).

FORMATIRANJE (mejl se renderuje, pa formatiraj čitljivo):
- Kratak pozdrav u prvom redu, pa prazan red.
- Ako nudiš više kurseva, svaki stavi u poseban red koji počinje crticom (-), sa nazivom, cenom i linkom.
- Prazan red između celina. Ne pakuj sve u jedan dugačak pasus.
- Linkove piši kao gole URL-ove (postaće klikabilni automatski), ne u zagradama.
- Ukupno kratko: pozdrav + ponuda + poziv na sledeći korak.

PRIMERI DOBRIH MEJLOVA (uzor za ton, dužinu i strukturu - prilagodi imenu, nivou i razgovoru, ne kopiraj doslovno):

Primer za nivo A1:
subject: Tvoj nemački A1 - kako da kreneš
message:
Zdravo [ime],

vidim da si pričao/la sa našim NaKI asistentom o učenju nemačkog na A1 nivou - drago mi je što si se javio/la.

Za sam početak najčešće preporučujem dve opcije:
- VIDEO kurs A1 - učiš svojim tempom, 11.600 din (99 €). Kao NaKI korisnik imaš kod NAKI10 za 10% popusta na video kurseve.
- Grupni kurs A1.1 - uživo sa profesorkom i malom grupom, 19.600 din (168 €), sa rasporedom i podrškom.

Ako nisi siguran/na odakle da kreneš, javi mi šta ti je cilj (posao, ispit, selidba) pa da ti predložim tačno ono što ti treba.

Primer za nivo A2 (uvek dodaj besplatno testiranje za A2 i više):
subject: Tvoj nemački A2 - sledeći korak
message:
Zdravo [ime],

pričao/la si sa našim NaKI asistentom o nemačkom na A2 nivou - to znači da već imaš osnovu i sad gradimo dalje.

Predlažem:
- VIDEO kurs A2 - svojim tempom, 11.600 din (99 €). Kao NaKI korisnik imaš kod NAKI10 za 10% popusta.
- Grupni kurs A2.1 - uživo, mala grupa, 19.600 din (168 €).

Ako nisi sigurna da je baš A2 tvoj nivo, imamo i besplatno testiranje - za par minuta dobiješ tačan nivo, pa ne plaćaš nešto što ti ne treba: https://www.hartweger.rs/besplatno-testiranje

KONTAKT: ${ime}. ${nivo}${vecKupac}

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
