import type { NextConfig } from "next";

// Set by the GitHub Pages workflow (e.g. "/massage" for a project site); empty for local dev or a custom domain
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only, so build the site as a static export into /out
  output: "export",
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
