import { permanentRedirect } from "next/navigation";

// /o-timu je spojen u /o-natasi (O Nataši + tim na jednoj stranici).
// Trajni (308) redirect - čuva stare linkove i SEO.
export default function OTimuPage() {
  permanentRedirect("/o-natasi");
}
