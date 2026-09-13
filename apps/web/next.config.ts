import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(__dirname, "..", "..");

// Fully static site: every page is pre-rendered at build time and served from S3/CloudFront.
// No server, no Lambda, no API routes — downloads are pre-built zips in public/, and search runs
// in the browser over public/search-index.json. The dynamic API routes are parked in
// src/_dynamic-api/ for when AI search is switched on later.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
