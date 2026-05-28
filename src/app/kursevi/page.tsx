import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProizvodKartica from "@/components/ProizvodKartica";
import type { Course, CourseCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kursevi nemačkog jezika — Hartweger",
  description:
    "Video kursevi, grupna i individualna nastava nemačkog jezika. Odaberite kurs koji vam odgovara.",
};

const categoryLabels: Record<string, string> = {
  video: "Video kursevi",
  grupni: "Grupni kursevi",
  individualni: "Individualni kursevi",
  paket: "Paketi",
  usluga: "Usluge",
  mesecni: "Mesečne pretplate",
};

const categoryOrder: CourseCategory[] = [
  "video",
  "grupni",
  "individualni",
  "paket",
  "usluga",
  "mesecni",
];

export default async function KurseviPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_purchasable", true)
    .order("price", { ascending: true });

  if (!courses || courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
          Kursevi
        </h1>
        <p className="text-gray-500">Proizvodi se dodaju uskoro.</p>
      </div>
    );
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: (courses as Course[]).filter((c) => c.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-10 text-center">
        Kursevi nemačkog jezika
      </h1>

      {grouped.map((group) => (
        <section key={group.category} className="mb-14">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.items.map((course) => (
              <ProizvodKartica key={course.id} course={course} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
