// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add this to ensure all routes are processed
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;