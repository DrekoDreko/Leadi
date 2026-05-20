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
  experimental: {
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
