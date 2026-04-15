"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NoviKurs() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const slug = title
      .toLowerCase()
      .replace(/[čć]/g, "c")
      .replace(/[šś]/g, "s")
      .replace(/[žź]/g, "z")
      .replace(/đ/g, "dj")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } = await supabase.from("courses").insert({
      title,
      slug,
      description: form.get("description") as string,
      course_type: form.get("course_type") as string,
      price: parseFloat(form.get("price") as string) || 0,
      is_published: form.get("is_published") === "on",
    });

    if (error) {
      alert("Greška: " + error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/kursevi");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Novi kurs</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naziv kursa</label>
          <input
            name="title"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
            placeholder="Nemački A1.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
          <textarea
            name="description"
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
            placeholder="Kratak opis kursa..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tip kursa</label>
          <select
            name="course_type"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
          >
            <option value="video">Video kurs</option>
            <option value="individual">1:1 Nastava</option>
            <option value="group">Grupna nastava</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cena (RSD)</label>
          <input
            name="price"
            type="number"
            min="0"
            step="100"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
            placeholder="12000"
          />
        </div>

        <div className="flex items-center gap-2">
          <input name="is_published" type="checkbox" id="published" className="rounded" />
          <label htmlFor="published" className="text-sm text-gray-700">
            Objavi odmah
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Čuvam..." : "Kreiraj kurs"}
        </button>
      </form>
    </div>
  );
}
