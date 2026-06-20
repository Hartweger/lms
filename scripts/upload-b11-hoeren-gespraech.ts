/**
 * Upload B13 audio (Gespräch / Vorstellungsgespräch) u Supabase storage (bucket blog-media).
 * Run: npx tsx scripts/upload-b11-hoeren-gespraech.ts
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
const DEST = "kursevi/b1-1/hoeren-vorstellungsgespraech/gespraech.mp3";
const SRC = path.resolve(__dirname, "../../B1/audio/Schritte_int_Neu_5_AB_CD_1_Track_24_L05_Schritt_B_13.mp3");

async function main() {
  if (!fs.existsSync(SRC)) { console.error("Nema fajla:", SRC); process.exit(1); }
  const { error } = await supabase.storage.from(BUCKET).upload(DEST, fs.readFileSync(SRC), { contentType: "audio/mpeg", upsert: true });
  if (error) { console.error(error.message); process.exit(1); }
  console.log("✓ " + supabase.storage.from(BUCKET).getPublicUrl(DEST).data.publicUrl);
}
main();
