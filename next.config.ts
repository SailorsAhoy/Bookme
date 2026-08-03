import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable if you later add server actions heavily
  },
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
