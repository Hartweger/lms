// src/app/dev/maskota/page.tsx
import { MascotBear, type MascotState } from "@/components/mascot/MascotBear";

const STATES: { state: MascotState; label: string }[] = [
  { state: "happy", label: "Srećan (maše)" },
  { state: "celebrate", label: "Oduševljen (ruke uvis)" },
  { state: "proud", label: "Ponosan (palac gore)" },
  { state: "thinking", label: "Zamišljen (ruka na bradi)" },
  { state: "sleepy", label: "Pospan (Zzz)" },
  { state: "sad", label: "Tužan (briše suzu)" },
];

export default function MaskotaPreview() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Maskota — pregled poza</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {STATES.map(({ state, label }) => (
          <div key={state} className="bg-white border-2 border-plava rounded-xl p-4 text-center">
            <MascotBear state={state} size="full" className="w-32 h-36 mx-auto" />
            <MascotBear state={state} size="head" className="w-12 h-12 mx-auto mt-2 opacity-80" />
            <p className="mt-2 font-semibold text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
