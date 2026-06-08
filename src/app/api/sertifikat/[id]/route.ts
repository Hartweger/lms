import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_HOST } from "@/lib/site-url";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();

  if (!cert) {
    return NextResponse.json({ error: "Sertifikat nije pronađen" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", cert.user_id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", cert.course_id)
    .single();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  // Load Roboto font for Serbian characters
  const fontPath = path.join(process.cwd(), "src/fonts/Roboto-VF.ttf");
  const fontData = fs.readFileSync(fontPath);
  doc.addFileToVFS("Roboto-VF.ttf", fontData.toString("base64"));
  doc.addFont("Roboto-VF.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // Load images
  const logoData = fs.readFileSync(path.join(process.cwd(), "src/fonts/logo.png"));
  const potpisData = fs.readFileSync(path.join(process.cwd(), "src/fonts/potpis.png"));

  // === Background ===
  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, W, H, "F");

  // === Blue triangle top-left ===
  doc.setFillColor(79, 177, 211);
  doc.triangle(0, 0, 0, 90, 35, 0, "F");

  // === Coral triangle bottom-right ===
  doc.setFillColor(229, 123, 120);
  doc.triangle(W, H, W, 130, W - 40, H, "F");

  // === Decorative corner brackets (top-right) ===
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.8);
  // Top-right corner
  doc.line(W - 45, 20, W - 20, 20);
  doc.line(W - 20, 20, W - 20, 45);
  doc.line(W - 50, 25, W - 25, 25);
  doc.line(W - 25, 25, W - 25, 50);
  // Bottom-left corner
  doc.line(20, H - 20, 45, H - 20);
  doc.line(20, H - 20, 20, H - 45);
  doc.line(25, H - 25, 50, H - 25);
  doc.line(25, H - 25, 25, H - 50);

  // === SERTIFIKAT title ===
  doc.setFontSize(42);
  doc.setTextColor(40, 40, 40);
  doc.text("SERTIFIKAT", W / 2, 52, { align: "center" });

  // === ZERTIFIKAT subtitle ===
  doc.setFontSize(24);
  doc.setTextColor(218, 165, 96);
  doc.text("ZERTIFIKAT", W / 2, 66, { align: "center" });

  // === Student name ===
  const studentName = profile?.full_name || "Student";
  doc.setFontSize(26);
  doc.setTextColor(40, 40, 40);
  doc.text(studentName, W / 2, 105, { align: "center" });

  // Line above name
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(80, 93, W - 80, 93);

  // === Course description ===
  const courseTitle = course?.title || "Kurs";
  // Extract level from title (e.g. "Nemački A2.1" → "A2.1")
  const levelMatch = courseTitle.match(/(A1\.1|A1\.2|A2\.1|A2\.2|A1|A2|B1\.1|B1\.2|B1|B2)/i);
  const level = levelMatch ? levelMatch[1] : "";

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`o uspešno završenom kursu nemačkog jezika ${level}`, W / 2, 120, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(`Teilnahmebestätigung für den Deutschkurs (Niveau ${level}).`, W / 2, 130, { align: "center" });

  // Line below description
  doc.line(80, 136, W - 80, 136);

  // === Date ===
  const date = new Date(cert.issued_at as string).toLocaleDateString("sr-Latn-RS", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(date, W / 2, 145, { align: "center" });

  // === Signature (bottom-left area) ===
  doc.addImage(potpisData.toString("base64"), "PNG", 55, 155, 50, 20);

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Nataša Hartweger", 65, 182);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Schulleiterin/Direktorka", 65, 187);

  // === Logo (bottom-right) ===
  doc.addImage(logoData.toString("base64"), "PNG", W - 85, 165, 50, 13);

  // === Verification (very small, bottom center) ===
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text("Verifikacija: " + SITE_HOST + "/sertifikat/" + (cert.id as string).slice(0, 8), W / 2, H - 8, { align: "center" });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sertifikat-${(cert.id as string).slice(0, 8)}.pdf"`,
    },
  });
}
