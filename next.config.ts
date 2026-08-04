import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Important for multi-tenant custom domains later
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
