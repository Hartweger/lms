// src/components/hearts/HeartsWidget.tsx
import { MascotBear, type MascotState } from "@/components/mascot/MascotBear";
import { HeartVessel } from "./HeartVessel";
import { HeartsInfoPopover } from "./HeartsInfoPopover";

type Props = {
  totalHearts: number;
  level: number;
  toNext: number;
  percent: number;
  nextLevel: number;
  streak: number;
  mascotState: MascotState;
  awayMessage?: string | null;
};

export function HeartsWidget({ totalHearts, level, toNext, percent, nextLevel, streak, mascotState, awayMessage }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-plava shadow-sm flex items-center gap-4">
      <MascotBear state={mascotState} size="full" className="w-20 h-24 shrink-0" />
      <HeartVessel fillPercent={percent} className="w-14 h-14 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">Nivo {level}</span>
          <HeartsInfoPopover />
        </div>
        <div className="text-sm font-semibold text-gray-700 mt-1">
          {totalHearts.toLocaleString("sr-RS")} ❤️
        </div>
        <div className="h-3 bg-plava-light rounded-full overflow-hidden mt-2">
          <div className="h-full bg-koral rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {awayMessage ?? `još ${toNext} ❤️ do Nivoa ${nextLevel}`}
        </div>
        {streak > 0 && (
          <span className="inline-block mt-2 bg-orange-50 text-orange-600 font-bold text-xs px-3 py-1 rounded-full">
            🔥 {streak} {streak === 1 ? "dan" : "dana"} zaredom
          </span>
        )}
      </div>
    </div>
  );
}
