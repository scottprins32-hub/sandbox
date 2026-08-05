import { NextResponse } from "next/server";
import { dbStatus } from "@/server/db/health";

// Public diagnostic. Reports whether the deployment is gated, WITHOUT ever
// revealing the passcode itself. Exists because a missing SCARA_PASSCODE fails
// open silently, which is the one failure mode worth making loud.
export async function GET() {
  const raw = process.env.SCARA_PASSCODE;
  return NextResponse.json({
    ok: true,
    environment: process.env.NODE_ENV,
    // ok | unconfigured | unreachable | empty — so "why is Ops broken" is one
    // curl instead of guesswork. Status only, never a URL or token.
    database: await dbStatus(),
    // true only when the variable is set AND non-empty. An empty-string value
    // is a real and easy mistake to make in the Vercel UI, and it leaves the
    // app wide open, so it is reported as not configured.
    passcodeConfigured: typeof raw === "string" && raw.length > 0,
    passcodeLength: typeof raw === "string" ? raw.length : 0,
  });
}
