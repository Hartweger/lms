import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select(`*, user_profiles:user_id (full_name), courses:course_id (title)`)
    .eq("id", id)
    .single();

  if (!cert) {
    return NextResponse.json({ error: "Sertifikat nije pronađen" }, { status: 404 });
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFillColor(250, 251, 252);
  doc.rect(0, 0, 297, 210, "F");

  doc.setDrawColor(10, 179, 215);
  doc.setLineWidth(2);
  doc.rect(15, 15, 267, 180);

  doc.setTextColor(10, 179, 215);
  doc.setFontSize(16);
  doc.text("HARTWEGER", 148.5, 40, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Škola nemačkog jezika", 148.5, 48, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(26, 26, 46);
  doc.text("SERTIFIKAT", 148.5, 72, { align: "center" });

  doc.setDrawColor(247, 134, 135);
  doc.setLineWidth(1);
  doc.line(100, 78, 197, 78);

  doc.setFontSize(22);
  doc.setTextColor(10, 179, 215);
  const studentName = (cert.user_profiles as Record<string, string>)?.full_name || "Student";
  doc.text(studentName, 148.5, 100, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("je uspešno završio/la kurs", 148.5, 115, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(26, 26, 46);
  const courseTitle = (cert.courses as Record<string, string>)?.title || "Kurs";
  doc.text(courseTitle, 148.5, 130, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const date = new Date(cert.issued_at as string).toLocaleDateString("sr-RS", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Datum izdavanja: ${date}`, 148.5, 150, { align: "center" });

  doc.setFontSize(8);
  doc.text(`ID: ${cert.id}`, 148.5, 160, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(10, 179, 215);
  doc.text("Verifikacija: hartweger.rs/sertifikat/" + (cert.id as string).slice(0, 8), 148.5, 185, { align: "center" });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sertifikat-${(cert.id as string).slice(0, 8)}.pdf"`,
    },
  });
}
