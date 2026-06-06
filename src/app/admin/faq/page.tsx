"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FaqItem } from "@/lib/types";

const CATEGORIES = [
  { value: "pre-kupovine", label: "Pre kupovine" },
  { value: "nakon-kupovine", label: "Nakon kupovine" },
];

const emptyForm = {
  question: "",
  answer: "",
  category: "pre-kupovine",
  order_index: 0,
  is_published: true,
};

export default function AdminFaqPage() {
  const supabase = createClient();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("faq_items")
      .select("*")
      .order("order_index", { ascending: true });
    if (data) setItems(data as FaqItem[]);
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      await supabase
        .from("faq_items")
        .update({
          question: form.question,
          answer: form.answer,
          category: form.category,
          order_index: form.order_index,
          is_published: form.is_published,
        })
        .eq("id", editingId);
    } else {
      await supabase.from("faq_items").insert({
        question: form.question,
        answer: form.answer,
        category: form.category,
        order_index: form.order_index,
        is_published: form.is_published,
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    await fetchItems();
    setLoading(false);
  }

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
      order_index: item.order_index,
      is_published: item.is_published,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Obrisati ovo pitanje?")) return;
    await supabase.from("faq_items").delete().eq("id", id);
    await fetchItems();
  }

  return (
    <div>
      <h1 className="font-montserrat text-2xl font-bold text-gray-900 mb-6">
        FAQ upravljanje
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-4"
      >
        <h2 className="font-semibold text-gray-800">
          {editingId ? "Izmeni pitanje" : "Novo pitanje"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pitanje
          </label>
          <input
            type="text"
            required
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Odgovor
          </label>
          <textarea
            required
            rows={4}
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40"
          />
          <p className="mt-1 text-xs text-gray-400">
            Link: [tekst](/putanja) za stranicu na sajtu ili [tekst](mailto:adresa) za email.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategorija
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redosled
            </label>
            <input
              type="number"
              value={form.order_index}
              onChange={(e) =>
                setForm({ ...form, order_index: Number(e.target.value) })
              }
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
                className="rounded"
              />
              Objavljeno
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-plava text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {editingId ? "Sačuvaj izmene" : "Dodaj"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Otkaži
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{item.question}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {item.answer}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>Kategorija: {item.category}</span>
                <span>Redosled: {item.order_index}</span>
                {!item.is_published && (
                  <span className="text-amber-500 font-medium">Neobjavljeno</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startEdit(item)}
                className="text-sm text-plava hover:underline"
              >
                Izmeni
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Obriši
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm">Nema FAQ stavki.</p>
        )}
      </div>
    </div>
  );
}
