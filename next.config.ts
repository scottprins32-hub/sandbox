import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; keep it external to the server bundle.
  // Base44 preview origin (no-op elsewhere).
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? ["3000-" + process.env.BASE44_PUBLIC_HOST_SUFFIX]
    : [],
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  // The proces-verbal PDF reads the bundled Inter TTFs at runtime; make sure
  // they ship with the serverless functions on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/fonts/*.ttf", "./drizzle/**"],
  },
};

export default nextConfig;
