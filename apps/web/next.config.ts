import type { NextConfig } from "next";

import { webSecurityHeaders } from "./security-headers";

const nextConfig: NextConfig = {
  // Allows isolated local preview builds without disturbing an active dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  reactCompiler: true,
  headers() {
    return [
      {
        source: "/:path*",
        headers: [...webSecurityHeaders],
      },
    ];
  },
};

export default nextConfig;
