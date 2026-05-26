"use client";

import { useState } from "react";

export default function VideoPlayer({ vimeoId }: { vimeoId: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative w-full bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
      style={{ paddingBottom: "56.25%" }}
      onClick={() => !loaded && setLoaded(true)}
    >
      {loaded ? (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?h=0&title=0&byline=0&portrait=0&autoplay=1`}
          className="absolute top-0 left-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <img
            src={`https://vumbnail.com/${vimeoId}.jpg`}
            alt="Video thumbnail"
            className="absolute top-0 left-0 w-full h-full object-cover"
            loading="lazy"
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
