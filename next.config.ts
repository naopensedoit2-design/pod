import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Uploads de imagem do painel (as imagens são reduzidas no navegador antes do envio).
      bodySizeLimit: "6mb",
    },
  },
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
};

export default nextConfig;
