import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Broad for now to ensure it works with dynamic Supabase URLs
      },
    ],
  },
};

export default nextConfig;
