import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

export default async function AdminKursevi() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kursevi</h1>
        <Link
          href="/admin/kursevi/novi"
          className="bg-plava text-white px-4 py-2 rounded-lg text-sm hover:bg-plava-dark transition-colors"
        >
          + Novi kurs
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Naziv</th>
              <th className="text-left px-6 py-3">Tip</th>
              <th className="text-left px-6 py-3">Cena</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(courses as Course[])?.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{course.title}</td>
                <td className="px-6 py-4 text-gray-500">{course.course_type}</td>
                <td className="px-6 py-4 text-gray-500">
                  {course.price.toLocaleString("sr-RS")} RSD
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      course.is_published
                        ? "bg-plava-light text-plava"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {course.is_published ? "Objavljen" : "Nacrt"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/kursevi/${course.id}`} className="text-plava hover:underline">
                    Izmeni
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
