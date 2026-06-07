import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cat-matcher/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
