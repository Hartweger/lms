/**
 * Upload 5 audio (Radio Ansagen, zadatak 22) u Supabase storage (bucket blog-media).
 * Run: npx tsx scripts/upload-b11-hoeren-radio.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKET = "blog-media";
const PREFIX = "kursevi/b1-1/hoeren-radio-ansagen/";
const SRC_DIR = path.resolve(__dirname, "../../B1/audio");
const FILES: Record<string, string> = {
  "ansage1.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_33_L06_Schritt_D_22_1.mp3",
  "ansage2.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_34_L06_Schritt_D_22_2.mp3",
  "ansage3.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_35_L06_Schritt_D_22_3.mp3",
  "ansage4.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_36_L06_Schritt_D_22_4.mp3",
  "ansage5.mp3": "Schritte_int_Neu_5_AB_CD_1_Track_37_L06_Schritt_D_22_5.mp3",
};

async function main() {
  for (const [dest, src] of Object.entries(FILES)) {
    const full = path.join(SRC_DIR, src);
    if (!fs.existsSync(full)) { console.error("Nema:", full); process.exit(1); }
    const { error } = await supabase.storage.from(BUCKET).upload(PREFIX + dest, fs.readFileSync(full), { contentType: "audio/mpeg", upsert: true });
    if (error) { console.error(dest, error.message); process.exit(1); }
    console.log("✓ " + supabase.storage.from(BUCKET).getPublicUrl(PREFIX + dest).data.publicUrl);
  }
}
main();
