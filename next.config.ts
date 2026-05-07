import type { NextConfig } from "next";
import { validateProductionCoreEnv } from "./src/lib/env/shared";

if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "1") {
  validateProductionCoreEnv();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
