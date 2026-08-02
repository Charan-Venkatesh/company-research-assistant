import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships .afm font metric files it reads from disk at runtime;
  // keeping it external (unbundled) so Vercel's file tracer includes them.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
