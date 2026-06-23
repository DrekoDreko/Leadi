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
  },
  async redirects() {
    return [
      // Rota legada do onboarding de equipe que nunca existiu como pagina.
      // Mantemos o redirect para nao quebrar links/historico antigos.
      {
        source: "/team/setup",
        destination: "/team/invite",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
