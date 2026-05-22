import type { TextSection, TextStyle } from "@/lib/section-types";

const styleClasses: Record<TextStyle, string> = {
  default: "border-l-4 border-plava bg-gray-50",
  beispiele: "border-l-4 border-zelena bg-zelena-light",
  uebung: "border-l-4 border-koral bg-koral-light",
  info: "bg-white",
};

function formatContent(text: string): string {
  if (!text) return "";
  if (text.includes("<p>") || text.includes("<h") || text.includes("<div")) {
    return text;
  }
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-plava hover:underline">$1</a>')
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

export default function TextBlock({ content, style = "default" }: TextSection) {
  return (
    <div className={`rounded-xl p-5 md:p-6 ${styleClasses[style]}`}>
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed
          prose-headings:text-gray-900 prose-a:text-plava prose-strong:text-gray-900"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
    </div>
  );
}
