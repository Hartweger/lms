"use client";

import { useState } from "react";
import Image from "next/image";

export default function VideoPlayer({ vimeoId }: { vimeoId: string }) {
  const [loaded, setLoaded] = useState(false);

  // Privatni Vimeo: vimeoId može biti "id/hash" (npr. "1124447925/1d8e522d7a").
  const [id, hash] = String(vimeoId).split("/");
  const hParam = hash || "0";

  return (
    <div
      className="relative w-full bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
      style={{ paddingBottom: "56.25%" }}
      onClick={() => !loaded && setLoaded(true)}
    >
      {loaded ? (
        <iframe
          src={`https://player.vimeo.com/video/${id}?h=${hParam}&title=0&byline=0&portrait=0&autoplay=1`}
          className="absolute top-0 left-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <Image
            src={`https://vumbnail.com/${id}.jpg`}
            alt="Video thumbnail"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            loading="lazy"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
