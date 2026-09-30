import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; keep it external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  // Base44 preview origin — Next.js gates dev assets/HMR by origin, so the
  // preview's public host must be allow-listed or the page loads blank.
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? ["3000-" + process.env.BASE44_PUBLIC_HOST_SUFFIX]
    : [],
  // The proces-verbal PDF reads the bundled Inter TTFs at runtime; make sure
  // they ship with the serverless functions on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/fonts/*.ttf", "./drizzle/**"],
  },
};

export default nextConfig;
