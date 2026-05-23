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
    if (selectedItem === text) {
      setSelectedItem(null);
    } else {
      setSelectedItem(text);
    }
  };

  const handleCategoryClick = (catIndex: number) => {
    if (answered || !selectedItem) return;
    setPlacements({ ...placements, [selectedItem]: catIndex });
    setSelectedItem(null);
  };

  const handleRemoveFromCategory = (text: string) => {
    if (answered) return;
    const newPlacements = { ...placements };
    delete newPlacements[text];
    setPlacements(newPlacements);
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
      <p className="text-lg font-medium text-gray-900 mb-1">{question}</p>
      <p className="text-xs text-gray-400 mb-5">
        {!selectedItem
          ? "① Klikni na reč ispod → ② Klikni na kategoriju gde pripada"
          : `Sad klikni na kategoriju gde pripada "${selectedItem}"`}
      </p>

      {/* Unplaced items — show FIRST so user knows what to click */}
      {unplaced.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {unplaced.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => handleItemClick(item.text)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                selectedItem === item.text
                  ? "border-plava bg-plava text-white shadow-md scale-105"
                  : "border-gray-200 text-gray-700 hover:border-plava bg-white"
              }`}
              disabled={answered}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((cat, ci) => (
          <div key={ci}>
            <button
              type="button"
              onClick={() => handleCategoryClick(ci)}
              className={`w-full py-3 px-3 rounded-xl text-sm font-bold transition-all border-2 ${
                selectedItem
                  ? "bg-plava-light border-plava text-plava cursor-pointer hover:bg-plava hover:text-white"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
              disabled={answered || !selectedItem}
            >
              {cat}
            </button>
            <div className="space-y-1 mt-2 min-h-[32px]">
              {items.filter((item) => placements[item.text] === ci).map((item) => (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => handleRemoveFromCategory(item.text)}
                  disabled={answered}
                  className={`w-full text-sm px-3 py-1.5 rounded-lg text-left ${
                    answered
                      ? item.category === ci
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                      : "bg-plava-light text-plava hover:bg-koral-light hover:text-koral cursor-pointer"
                  }`}
                  title={answered ? undefined : "Klikni da vratiš"}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Check */}
      {!answered && isComplete && (
        <button onClick={handleCheck} className="mt-5 bg-plava text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-plava-dark transition-colors">
          Proveri
        </button>
      )}
      {answered && (
        <button onClick={handleReset} className="mt-4 text-sm text-plava hover:underline">
          Pokušaj ponovo
        </button>
      )}
    </div>
  );
}
