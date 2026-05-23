"use client";

import { useState } from "react";

interface CategorizeProps {
  question: string;
  categories: string[];
  items: { text: string; category: number }[];
  onAnswer: (correct: boolean) => void;
}

export default function CategorizeExercise({ question, categories, items, onAnswer }: CategorizeProps) {
  const [placements, setPlacements] = useState<Record<string, number | null>>({});
  const [answered, setAnswered] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const unplaced = items.filter((item) => placements[item.text] === undefined);
  const isComplete = Object.keys(placements).length === items.length;

  const handleItemClick = (text: string) => {
    if (answered) return;
    setSelectedItem(text);
  };

  const handleCategoryClick = (catIndex: number) => {
    if (answered || !selectedItem) return;
    setPlacements({ ...placements, [selectedItem]: catIndex });
    setSelectedItem(null);
  };

  const handleCheck = () => {
    setAnswered(true);
    const allCorrect = items.every((item) => placements[item.text] === item.category);
    onAnswer(allCorrect);
  };

  const handleReset = () => {
    setPlacements({});
    setAnswered(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-4">{question}</p>

      {/* Categories */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((cat, ci) => (
          <div key={ci} className="text-center">
            <button
              type="button"
              onClick={() => handleCategoryClick(ci)}
              className={`w-full py-2 px-3 rounded-lg text-sm font-bold mb-2 transition-colors ${
                selectedItem ? "bg-plava text-white cursor-pointer" : "bg-gray-100 text-gray-700"
              }`}
              disabled={answered || !selectedItem}
            >
              {cat}
            </button>
            <div className="space-y-1 min-h-[40px]">
              {items.filter((item) => placements[item.text] === ci).map((item) => (
                <div
                  key={item.text}
                  className={`text-xs px-2 py-1 rounded ${
                    answered
                      ? item.category === ci
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                      : "bg-plava-light text-plava"
                  }`}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unplaced items */}
      {unplaced.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {unplaced.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => handleItemClick(item.text)}
              className={`px-3 py-2 rounded-lg text-sm border-2 transition-colors ${
                selectedItem === item.text
                  ? "border-plava bg-plava-light text-plava font-bold"
                  : "border-gray-200 text-gray-700 hover:border-plava"
              }`}
              disabled={answered}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {/* Check / Reset */}
      {!answered && isComplete && (
        <button onClick={handleCheck} className="mt-4 bg-plava text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors">
          Proveri
        </button>
      )}
      {answered && (
        <button onClick={handleReset} className="mt-4 text-sm text-plava hover:underline">
          Pokušaj ponovo
        </button>
      )}

      {selectedItem && !answered && (
        <p className="mt-2 text-xs text-gray-400">Klikni na kategoriju gde pripada &quot;{selectedItem}&quot;</p>
      )}
    </div>
  );
}
