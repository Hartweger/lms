import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Ručno osvežavanje ISR keša za magazin (radni tok: izmena posta direktno u
// Supabase tabeli blog_posts, bez admin UI). Bez ovoga se izmena vidi tek po
// isteku revalidate = 3600 na /magazin stranicama.
// Poziv: POST { "secret": "...", "slug": "moj-post" } - slug je opcion;
// bez njega se osvežava samo lista /magazin.
export async function POST(request: NextRequest) {
  let body: { secret?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.REVALIDATE_SECRET || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const revalidated = ["/magazin"];
  revalidatePath("/magazin");
  if (body.slug) {
    const path = `/magazin/${body.slug}`;
    revalidatePath(path);
    revalidated.push(path);
  }

  return NextResponse.json({ revalidated });
}
