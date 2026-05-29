import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      { hostname: "rzmyglynjcygsbicssbt.supabase.co" },
      { hostname: "*.supabase.co" },
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
