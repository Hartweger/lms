import type { YoutubeSection } from "@/lib/section-types";

export default function YoutubeBlock({ videoId, label }: YoutubeSection) {
  return (
    <div className="my-4">
      {label && (
        <p className="text-sm text-gray-500 mb-2">{label}</p>
      )}
      <div className="relative w-full rounded-xl overflow-hidden shadow-sm" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
