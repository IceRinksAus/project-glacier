import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows isolated local preview builds without disturbing an active dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactCompiler: true,
};

export default nextConfig;
