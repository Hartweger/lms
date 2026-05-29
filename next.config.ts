import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      { hostname: "rzmyglynjcygsbicssbt.supabase.co" },
      { hostname: "*.supabase.co" },
      { hostname: "www.hartweger.rs" },
      { hostname: "vumbnail.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/korpa", destination: "/kursevi", permanent: true },
      { source: "/moj-nalog", destination: "/dashboard", permanent: true },
      { source: "/prodavnica", destination: "/kursevi", permanent: true },
      { source: "/video-kursevi", destination: "/kursevi", permanent: true },
      { source: "/clanice", destination: "/kursevi", permanent: true },
      { source: "/plan-ucenja", destination: "/kursevi", permanent: true },
      { source: "/cesto-postavljena-pitanja", destination: "/faq", permanent: true },
      { source: "/opsti-uslovi-poslovanja", destination: "/uslovi", permanent: true },
      { source: "/nalog", destination: "/dashboard", permanent: true },

      // WP landing pages
      { source: "/ispit-a1", destination: "/", permanent: true },
      { source: "/dobraskolajezika", destination: "/magazin/dobraskolajezika", permanent: true },
      { source: "/najbolje-za-sebe", destination: "/magazin/najbolje-za-sebe", permanent: true },
      { source: "/o-nama", destination: "/o-timu", permanent: true },

      // WP product URLs → new course URLs
      { source: "/proizvod/kurs-nemackog-jezika-video-kurs-a1", destination: "/kursevi/video-kurs-a1", permanent: true },
      { source: "/proizvod/osnovna-ponuda-kurs-nemackog-jezika-a2", destination: "/kursevi/video-kurs-a2", permanent: true },
      { source: "/proizvod/osnovna-ponuda-kurs-b1", destination: "/kursevi/video-kurs-b1", permanent: true },
      { source: "/proizvod/polozi-goethe-b1", destination: "/kursevi/polozi-goethe-b1", permanent: true },
      { source: "/proizvod/polozi-goethe-b2", destination: "/kursevi/polozi-goethe-b2", permanent: true },
      { source: "/proizvod/polozi-c1", destination: "/kursevi/polozi-goethe-c1", permanent: true },
      { source: "/proizvod/gramatika-a2-b1", destination: "/kursevi/gramatika-a2-b1", permanent: true },
      { source: "/proizvod/kurs-za-mame", destination: "/kursevi/kurs-za-mame-i-trudnice", permanent: true },
      { source: "/proizvod/polozi-fide", destination: "/kursevi/polozi-fide", permanent: true },
      { source: "/proizvod/polozi-fsp", destination: "/kursevi/fsp", permanent: true },
      { source: "/proizvod/paket-a1-a2", destination: "/kursevi/paket-a1-a2", permanent: true },
      { source: "/proizvod/paket-a1-a2-b1", destination: "/kursevi/paket-a1-a2-b1", permanent: true },

      // Grupni
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a1-1", destination: "/kursevi/grupni-kurs-nemackog-jezika-a1-1", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a1-2-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a1-2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-a2-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-a2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-jezika-b1-1-2", destination: "/kursevi/grupni-kurs-nemackog-jezika-b1-1-2", permanent: true },
      { source: "/proizvod/grupni-kurs-nemackog-b1-2", destination: "/kursevi/grupni-kurs-nemackog-b1-2", permanent: true },
      { source: "/proizvod/grupni-kurs-b2-1", destination: "/kursevi/grupni-kurs-b2-1", permanent: true },
      { source: "/proizvod/grupni-kurs-b2-2", destination: "/kursevi/grupni-kurs-b2-2", permanent: true },
      { source: "/proizvod/grupni-kurs-c1-1", destination: "/kursevi/grupni-kurs-c1-1", permanent: true },
      { source: "/proizvod/grupni-kurs-c1-2", destination: "/kursevi/grupni-kurs-c1-2", permanent: true },

      // Individualni
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a11", destination: "/kursevi/individualni-kurs-nemackog-jezika-a11", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a1-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a1-2", permanent: true },
      { source: "/proizvod/paket-nivo-a1-a1-1-a1-2-individualni-standard", destination: "/kursevi/paket-nivo-a1-a1-1-a1-2-individualni-standard", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-a2-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-a2-2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b11", destination: "/kursevi/individualni-kurs-nemackog-jezika-b11", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b1-2", destination: "/kursevi/individualni-kurs-nemackog-jezika-b1-2", permanent: true },
      { source: "/proizvod/individualni-kurs-nemackog-jezika-b2-1", destination: "/kursevi/individualni-kurs-nemackog-jezika-b2-1", permanent: true },
      { source: "/proizvod/individualni-polozi-fide", destination: "/kursevi/individualni-polozi-fide", permanent: true },
      { source: "/proizvod/fsp-individualni", destination: "/kursevi/fsp-individualni", permanent: true },
      { source: "/proizvod/individualni-mesecni-paketi", destination: "/kursevi/individualni-mesecni-paketi", permanent: true },

      // Catch-all: any remaining /proizvod/ URLs → /kursevi
      { source: "/proizvod/:slug", destination: "/kursevi", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
