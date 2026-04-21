import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    turbopack: {
      root: '.'
    }
  } as any,
};

export default nextConfig;
