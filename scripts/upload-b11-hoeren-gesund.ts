/**
 * Upload 4 audio fajla (Ansage 1–4, „Gesund leben") iz B1/audio u Supabase storage (bucket blog-media).
 * Run: npx tsx scripts/upload-b11-hoeren-gesund.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "blog-media";
const PREFIX = "kursevi/b1-1/hoeren-gesund-leben/";
const SRC_DIR = path.resolve(__dirname, "../../B1/audio");

const FILES: Record<string, string> = {
  "ansage1.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_12_L03_Schritt_D_18_1.mp3",
  "ansage2.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_13_L03_Schritt_D_18_2.mp3",
  "ansage3.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_14_L03_Schritt_D_18_3.mp3",
  "ansage4.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_15_L03_Schritt_D_18_4.mp3",
};

async function main() {
  const urls: Record<string, string> = {};
  for (const [dest, src] of Object.entries(FILES)) {
    const full = path.join(SRC_DIR, src);
    if (!fs.existsSync(full)) {
      console.error(`Nema fajla: ${full}`);
      process.exit(1);
    }
    const buf = fs.readFileSync(full);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(PREFIX + dest, buf, { contentType: "audio/mpeg", upsert: true });
    if (error) {
      console.error(`Greška upload ${dest}:`, error.message);
      process.exit(1);
    }
    const url = supabase.storage.from(BUCKET).getPublicUrl(PREFIX + dest).data.publicUrl;
    urls[dest] = url;
    console.log(`✓ ${dest} → ${url}`);
  }
  fs.writeFileSync(path.resolve(__dirname, "b11-hoeren-gesund-urls.json"), JSON.stringify(urls, null, 2));
  console.log("\nURL-ovi snimljeni u scripts/b11-hoeren-gesund-urls.json");
}

main();
