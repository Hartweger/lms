import type { AudioSection } from "@/lib/section-types";

export default function AudioBlock({ url, label }: AudioSection) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-5">
      {label && (
        <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      )}
      <audio controls className="w-full" preload="none">
        <source src={url} type="audio/mpeg" />
        Tvoj pregledač ne podržava audio player.
      </audio>
    </div>
  );
}
