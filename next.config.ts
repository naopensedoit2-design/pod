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
  images: {
    // Fotos de produto: 75 nas grades, 90 na página do produto.
    qualities: [75, 90],
    // As fotos não mudam de conteúdo no mesmo endereço (versão no caminho ou id novo).
    minimumCacheTTL: 2678400,
    localPatterns: [
      { pathname: "/media/**", search: "" },
      { pathname: "/products/**", search: "" },
      { pathname: "/demo/**", search: "" },
    ],
    remotePatterns: [{ protocol: "https", hostname: "cdn.youdraw.com.br", pathname: "/**", search: "" }],
  },
};

export default nextConfig;
