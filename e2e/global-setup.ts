import { execSync } from "node:child_process";

export default function globalSetup() {
  // Fresh demo world for every run (idempotent; wipes and reloads).
  execSync("npm run seed", { stdio: "inherit" });
}
