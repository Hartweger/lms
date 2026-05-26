import Image from "next/image";
import type { ImageSection } from "@/lib/section-types";

export default function ImageBlock({ url, alt, caption }: ImageSection) {
  return (
    <figure>
      <div className="relative w-full">
        <Image
          src={url}
          alt={alt}
          width={800}
          height={500}
          className="w-full h-auto max-h-[500px] object-contain rounded-xl"
          sizes="(max-width: 768px) 100vw, 800px"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-gray-400 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
