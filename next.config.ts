import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; keep it external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  // The proces-verbal PDF reads the bundled Inter TTFs at runtime; make sure
  // they ship with the serverless functions on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/fonts/*.ttf", "./drizzle/**"],
  },
};

export default nextConfig;
