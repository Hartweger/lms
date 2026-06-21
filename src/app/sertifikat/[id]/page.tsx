import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SertifikatStranica({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cert } = await supabase.from("certificates").select("*").eq("id", id).single();
  if (!cert) notFound();

  const { data: course } = await supabase.from("courses").select("title").eq("id", cert.course_id).single();
  const courseTitle = course?.title || "Kurs";
  const level = (courseTitle.match(/(A1\.1|A1\.2|A2\.1|A2\.2|B1\.1|B1\.2|A1|A2|B1|B2)/i)?.[1] ?? "B1").toUpperCase();

  const issuedDate = new Date(cert.issued_at || cert.created_at);
  const pdfUrl = `/api/sertifikat/${cert.id}`;
  const certUrl = `https://www.hartweger.rs/sertifikat/${cert.id}`;

  // LinkedIn „Add to profile"
  const linkedinUrl =
    "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME" +
    `&name=${encodeURIComponent(`Zertifikat Deutsch ${level} (GER)`)}` +
    `&organizationName=${encodeURIComponent("Hartweger - Škola nemačkog jezika")}` +
    `&issueYear=${issuedDate.getFullYear()}&issueMonth=${issuedDate.getMonth() + 1}` +
    `&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(cert.id)}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Pravi sertifikat (PDF: logo, potpis, dvojezično, Roboto za č/ć/đ/š/ž) */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-5" style={{ aspectRatio: "297 / 210" }}>
          <iframe src={pdfUrl} className="w-full h-full" title="Sertifikat / Zertifikat" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-plava text-white px-6 py-2.5 rounded-lg hover:bg-plava-dark transition-colors text-sm font-medium"
          >
            Preuzmi PDF · Als PDF herunterladen
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-6 py-2.5 rounded-lg hover:bg-[#004182] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
            </svg>
            Dodaj na LinkedIn
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Verifikacija / Verifizierung: hartweger.rs/sertifikat/{cert.id}
        </p>
      </div>
    </div>
  );
}
