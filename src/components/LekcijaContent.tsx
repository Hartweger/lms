import VideoPlayer from "./VideoPlayer";
import type { Lesson } from "@/lib/types";

export default function LekcijaContent({ lesson }: { lesson: Lesson }) {
  switch (lesson.lesson_type) {
    case "video":
      return (
        <div>
          {lesson.vimeo_video_id && (
            <VideoPlayer vimeoId={lesson.vimeo_video_id} />
          )}
          {lesson.content && (
            <div className="mt-6 text-gray-700 leading-relaxed">
              {lesson.content}
            </div>
          )}
        </div>
      );

    case "pdf":
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-600 mb-4">{lesson.content}</p>
          <a
            href={lesson.content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
          >
            Otvori PDF
          </a>
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
        <div className="bg-white rounded-xl p-6 md:p-8">
          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {lesson.content}
          </div>
        </div>
      );

    default:
      return <p className="text-gray-400">Nepoznat tip lekcije.</p>;
  }
}
