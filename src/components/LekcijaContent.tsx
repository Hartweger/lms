import VideoPlayer from "./VideoPlayer";
import type { Lesson } from "@/lib/types";

function RichText({ content }: { content: string }) {
  // Support basic formatting: **bold**, links, and line breaks
  // Content is stored as plain text with some HTML allowed
  return (
    <div
      className="prose prose-gray max-w-none text-gray-700 leading-relaxed
        prose-headings:text-gray-900 prose-a:text-plava prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-img:rounded-xl"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

function formatContent(text: string): string {
  if (!text) return "";

  // If content already contains HTML tags, return as-is
  if (text.includes("<p>") || text.includes("<h") || text.includes("<div")) {
    return text;
  }

  // Convert markdown-like formatting to HTML
  let html = text
    // Escape HTML entities (except already-present tags)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Headers: ## text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // Line breaks: double newline = paragraph, single = br
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return `<p>${html}</p>`;
}

export default function LekcijaContent({ lesson }: { lesson: Lesson }) {
  switch (lesson.lesson_type) {
    case "video":
      return (
        <div>
          {lesson.vimeo_video_id && (
            <VideoPlayer vimeoId={lesson.vimeo_video_id} />
          )}
          {lesson.content && (
            <div className="mt-6">
              <RichText content={lesson.content} />
            </div>
          )}
        </div>
      );

    case "pdf":
      return (
        <div>
          {/* Inline PDF viewer */}
          {lesson.content && lesson.content.startsWith("http") ? (
            <div>
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
                <iframe
                  src={lesson.content}
                  width="100%"
                  height="700"
                  className="w-full"
                  style={{ minHeight: "500px" }}
                />
              </div>
              <a
                href={lesson.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-plava hover:underline"
              >
                📄 Otvori u novom prozoru
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8">
              <RichText content={lesson.content} />
            </div>
          )}
        </div>
      );

    case "image":
      return (
        <div>
          <img
            src={lesson.content}
            alt={lesson.title}
            className="w-full rounded-xl"
          />
        </div>
      );

    case "text":
      return (
        <div className="bg-white rounded-xl p-5 md:p-8">
          {lesson.content ? (
            <RichText content={lesson.content} />
          ) : (
            <p className="text-gray-400 italic">Sadržaj ove lekcije će uskoro biti dostupan.</p>
          )}
        </div>
      );

    default:
      return <p className="text-gray-400">Nepoznat tip lekcije.</p>;
  }
}
