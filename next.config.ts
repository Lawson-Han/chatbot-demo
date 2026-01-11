import type { NextConfig } from "next";

const basePathEnv =
  process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.BASE_PATH ?? "";
const basePath =
  basePathEnv.length > 0
    ? basePathEnv.startsWith("/")
      ? basePathEnv
      : `/${basePathEnv}`
    : undefined;

const nextConfig: NextConfig = {
  // Enable static export so we can publish to GitHub Pages.
  output: "export",
  // GitHub Pages serves from /<repo>/ when using a project site.
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
