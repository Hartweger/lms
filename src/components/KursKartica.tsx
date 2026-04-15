import Link from "next/link";
import type { Course } from "@/lib/types";

const typeLabels: Record<string, string> = {
  video: "Video kurs",
  individual: "1:1 Nastava",
  group: "Grupna nastava",
};

const typeColors: Record<string, string> = {
  video: "bg-plava",
  individual: "bg-koral",
  group: "bg-gradient-to-r from-plava to-koral",
};

export default function KursKartica({ course }: { course: Course }) {
  return (
    <Link href={`/kurs/${course.slug}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className={`${typeColors[course.course_type]} p-8 text-center`}>
          <span className="text-white text-xs font-semibold uppercase tracking-wider">
            {typeLabels[course.course_type]}
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-plava transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {course.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-plava font-bold">
              {course.price > 0 ? `${course.price.toLocaleString("sr-RS")} RSD` : "Besplatno"}
            </span>
            <span className="text-xs text-gray-400 group-hover:text-plava transition-colors">
              Saznaj više →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
