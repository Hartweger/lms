"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Section } from "@/lib/section-types";

interface LessonData {
  id: string;
  title: string;
  sections: Section[] | null;
  course_id: string;
}

export default function EditLessonSections() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [jsonMode, setJsonMode] = useState<number | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, sections, course_id")
        .eq("id", params.id)
        .single();
      if (data) {
        setLesson(data as LessonData);
        setSections((data.sections as Section[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(async (newSections: Section[]) => {
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from("lessons")
      .update({ sections: newSections as unknown as Record<string, unknown>[] })
      .eq("id", params.id);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [params.id, supabase]);

  const updateSection = (index: number, updated: Section) => {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
  };

  const deleteSection = (index: number) => {
    if (!confirm("Obrisati ovu sekciju?")) return;
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
  };

  const addSection = (type: Section["type"]) => {
    let newSection: Section;
    switch (type) {
      case "text":
        newSection = { type: "text", content: "", style: "default" };
        break;
      case "video":
        newSection = { type: "video", vimeoId: "" };
        break;
      case "table":
        newSection = { type: "table", headers: ["Nemacki", "Srpski"], rows: [["", ""]] };
        break;
      case "formula":
        newSection = { type: "formula", content: "" };
        break;
      case "spoiler":
        newSection = { type: "spoiler", title: "Vezba", items: [{ question: "", answer: "" }] };
        break;
      case "flashcard":
        newSection = { type: "flashcard", items: [{ front: "", back: "" }] };
        break;
      case "vocabulary":
        newSection = { type: "vocabulary", rows: [["", ""]] };
        break;
      case "badge":
        newSection = { type: "badge", module: "Modul 1", category: "grammatik" };
        break;
      case "mistakes":
        newSection = { type: "mistakes", items: [{ wrong: "", correct: "", explanation: "" }] };
        break;
      case "link":
        newSection = { type: "link", linkType: "external", href: "", label: "" };
        break;
      default:
        newSection = { type: "text", content: "" };
    }
    const newSections = [...sections, newSection];
    setSections(newSections);
  };

  const openJsonEditor = (index: number) => {
    setJsonMode(index);
    setJsonText(JSON.stringify(sections[index], null, 2));
  };

  const VALID_TYPES = ["text", "video", "badge", "formula", "table", "mistakes", "spoiler", "vocabulary", "pdf", "image", "link", "flashcard"];

  const saveJsonEdit = () => {
    if (jsonMode === null) return;
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.type || !VALID_TYPES.includes(parsed.type)) {
        alert("Neispravan tip sekcije! Dozvoljeni: " + VALID_TYPES.join(", "));
        return;
      }
      updateSection(jsonMode, parsed);
      setJsonMode(null);
    } catch {
      alert("Neispravan JSON!");
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Ucitavanje...</div>;
  if (!lesson) return <div className="p-8 text-koral">Lekcija nije pronadjena.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/kursevi/${lesson.course_id}`} className="text-sm text-plava hover:underline">
            &larr; Nazad na kurs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
          <p className="text-sm text-gray-400">{sections.length} sekcija</p>
        </div>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-koral text-sm">Greska: {saveError}</span>}
          {saved && <span className="text-green-600 text-sm">Sacuvano!</span>}
          <button
            onClick={() => save(sections)}
            disabled={saving}
            className="bg-plava text-white px-6 py-2 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Cuvam..." : "Sacuvaj sve"}
          </button>
          <Link
            href={`/lekcija/${lesson.id}`}
            target="_blank"
            className="text-sm text-gray-500 hover:text-plava border border-gray-200 px-4 py-2 rounded-lg"
          >
            Pregled
          </Link>
        </div>
      </div>

      {/* JSON modal */}
      {jsonMode !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-gray-900 mb-3">Uredi JSON — sekcija {jsonMode + 1}</h3>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="flex-1 w-full font-mono text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-plava min-h-[300px]"
              spellCheck={false}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setJsonMode(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                Otkazi
              </button>
              <button onClick={saveJsonEdit} className="px-4 py-2 bg-plava text-white rounded-lg text-sm hover:bg-plava-dark">
                Primeni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                  {i + 1}. {section.type}
                </span>
                {"style" in section && section.style && (
                  <span className="text-xs bg-plava-light text-plava px-2 py-1 rounded">
                    {section.style}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(i, "up")} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Gore">
                  ↑
                </button>
                <button onClick={() => moveSection(i, "down")} disabled={i === sections.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Dole">
                  ↓
                </button>
                <button onClick={() => openJsonEditor(i)} className="p-1 text-gray-400 hover:text-plava" title="JSON editor">
                  {"{ }"}
                </button>
                <button onClick={() => deleteSection(i)} className="p-1 text-gray-400 hover:text-koral" title="Obrisi">
                  ✕
                </button>
              </div>
            </div>

            {/* Content editors by type */}
            {section.type === "text" && (
              <div className="space-y-2">
                <select
                  value={(section as { style?: string }).style || "default"}
                  onChange={(e) => updateSection(i, { ...section, style: e.target.value } as Section)}
                  className="text-xs border border-gray-200 rounded px-2 py-1"
                >
                  <option value="default">default</option>
                  <option value="info">info</option>
                  <option value="beispiele">beispiele</option>
                  <option value="uebung">uebung</option>
                </select>
                <textarea
                  value={(section as { content: string }).content}
                  onChange={(e) => updateSection(i, { ...section, content: e.target.value } as Section)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-plava"
                  placeholder="Markdown sadrzaj..."
                />
              </div>
            )}

            {section.type === "video" && (
              <input
                value={(section as { vimeoId: string }).vimeoId}
                onChange={(e) => updateSection(i, { ...section, vimeoId: e.target.value } as Section)}
                placeholder="Vimeo ID"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            )}

            {section.type === "formula" && (
              <textarea
                value={(section as { content: string }).content}
                onChange={(e) => updateSection(i, { ...section, content: e.target.value } as Section)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-plava"
                placeholder="Formula / pravilo..."
              />
            )}

            {section.type === "badge" && (
              <div className="flex gap-3">
                <input
                  value={(section as { module: string }).module}
                  onChange={(e) => updateSection(i, { ...section, module: e.target.value } as Section)}
                  placeholder="Modul"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <select
                  value={(section as { category: string }).category}
                  onChange={(e) => updateSection(i, { ...section, category: e.target.value } as Section)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="grammatik">grammatik</option>
                  <option value="wortschatz">wortschatz</option>
                  <option value="lesen">lesen</option>
                  <option value="hoeren">hoeren</option>
                  <option value="schreiben">schreiben</option>
                </select>
              </div>
            )}

            {/* For complex types (table, spoiler, flashcard, vocabulary, mistakes) — show JSON preview + edit button */}
            {["table", "spoiler", "flashcard", "vocabulary", "mistakes", "link", "image", "pdf"].includes(section.type) && (
              <div>
                <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-auto max-h-40">
                  {JSON.stringify(section, null, 2).slice(0, 500)}
                  {JSON.stringify(section).length > 500 ? "\n..." : ""}
                </pre>
                <button
                  onClick={() => openJsonEditor(i)}
                  className="mt-2 text-sm text-plava hover:underline"
                >
                  Uredi u JSON editoru
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-5">
        <p className="text-sm text-gray-500 mb-3">Dodaj novu sekciju:</p>
        <div className="flex flex-wrap gap-2">
          {(["text", "video", "badge", "formula", "table", "spoiler", "flashcard", "vocabulary", "mistakes", "link"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => addSection(type)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-plava-light hover:text-plava transition-colors"
              >
                + {type}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
