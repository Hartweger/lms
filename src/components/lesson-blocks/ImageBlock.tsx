import type { ImageSection } from "@/lib/section-types";

export default function ImageBlock({ url, alt, caption }: ImageSection) {
  return (
    <figure>
      <img
        src={url}
        alt={alt}
        className="w-full max-h-[500px] object-contain rounded-xl"
      />
      {caption && (
        <figcaption className="text-center text-xs text-gray-400 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
