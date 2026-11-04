import type { NextConfig } from "next";

// Build-time prerendering and `next dev`/`next start` evaluate event dates in
// Michigan time (deployed functions do the same via src/instrumentation.ts).
process.env.TZ = "America/Detroit";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Avoid serving stale Turbopack server bundles after src changes. */
  experimental: {
    serverComponentsHmrCache: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "**.fbcdn.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
