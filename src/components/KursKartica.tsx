import Link from "next/link";
import type { Course } from "@/lib/types";

const typeColors: Record<string, string> = {
  video: "bg-plava",
  individual: "bg-koral",
  group: "bg-gradient-to-r from-plava to-koral",
};

export default function KursKartica({ course }: { course: Course }) {
  return (
    <Link href={`/kurs/${course.slug}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-plava p-8 text-center">
          <span className="text-white text-lg font-bold">
            {course.title}
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-plava transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {course.description}
          </p>
          <div className="mt-4 flex items-center justify-end">
            <span className="text-xs text-gray-400 group-hover:text-plava transition-colors">
              Saznaj više →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
