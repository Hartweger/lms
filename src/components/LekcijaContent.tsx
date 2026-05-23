import VideoPlayer from "./VideoPlayer";
import BlockRenderer from "./lesson-blocks/BlockRenderer";
import type { Lesson } from "@/lib/types";
import type { Section } from "@/lib/section-types";

function RichText({ content }: { content: string }) {
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
  if (text.includes("<p>") || text.includes("<h") || text.includes("<div")) {
    return text;
  }
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

export default function LekcijaContent({ lesson }: { lesson: Lesson }) {
  // New block system — takes precedence when sections exist
  const sections = lesson.sections as Section[] | null;
  if (sections && sections.length > 0) {
    return <BlockRenderer sections={sections} />;
  }

  // Legacy rendering — fallback for old lessons
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
          {lesson.content && lesson.content.startsWith("http") ? (
            <div>
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
                <iframe
                  src={lesson.content}
                  width="100%"
                  className="w-full hidden md:block"
                  style={{ height: "600px" }}
                />
              </div>
              <a
                href={lesson.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-plava hover:underline"
              >
                Otvori u novom prozoru
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
