import type { NextConfig } from "next";
import {
  shouldValidateProductionCoreEnv,
  validateProductionCoreEnv
} from "./src/lib/env/shared";

if (shouldValidateProductionCoreEnv()) {
  validateProductionCoreEnv();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  experimental: {
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
