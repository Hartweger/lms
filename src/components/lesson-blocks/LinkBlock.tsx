import Link from "next/link";
import type { LinkSection, LinkType } from "@/lib/section-types";

const linkStyles: Record<LinkType, string> = {
  kviz: "bg-koral hover:bg-koral-dark text-white",
  quizlet: "bg-[#4257B2] hover:bg-[#3a4d9e] text-white",
  pdf: "bg-red-600 hover:bg-red-700 text-white",
  dw: "bg-gray-900 hover:bg-gray-800 text-white",
  external: "bg-gray-100 hover:bg-gray-200 text-gray-700",
};

const defaultLabels: Record<LinkType, string> = {
  kviz: "Uradi kviz",
  quizlet: "Vezba na Quizlet",
  pdf: "Otvori PDF",
  dw: "Deutsche Welle",
  external: "Otvori link",
};

export default function LinkBlock({ linkType, href, label }: LinkSection) {
  const isInternal = href.startsWith("/");
  const classes = `inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${linkStyles[linkType]}`;

  if (isInternal) {
    return (
      <Link href={href} className={classes}>
        {label || defaultLabels[linkType]}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {label || defaultLabels[linkType]}
    </a>
  );
}
