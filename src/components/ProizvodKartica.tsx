import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/types";

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

export default function ProizvodKartica({ course }: { course: Course }) {
  const isVariable =
    course.category === "individualni" || course.category === "mesecni";

  return (
    <Link href={`/kursevi/${course.slug}`} className="block group">
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-plava hover:shadow-md transition-all">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            width={400}
            height={192}
            className="w-full h-48 object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-plava to-plava-dark flex items-center justify-center">
            <span className="text-white text-lg font-bold text-center px-4">
              {course.title}
            </span>
          </div>
        )}
        <div className="p-5">
          <h3 className="font-heading font-semibold text-lg text-gray-900 group-hover:text-plava transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {course.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-bold text-gray-900">
              {isVariable && "od "}
              {formatPrice(course.price)} din
            </span>
            <span className="text-sm text-plava font-medium group-hover:translate-x-1 transition-transform inline-block">
              Saznaj više →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
