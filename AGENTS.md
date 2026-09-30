# Base44 Dev Environment

## What this is

Scara — a Next.js 15 (App Router) + TypeScript + Tailwind v4 app for a
cleaning-services startup. Local dev uses better-sqlite3 (native SQLite at
`.data/scara.db`); production uses Turso (libSQL). No external secrets are
needed to boot in dev.

## How to run

```bash
docker compose -f docker-compose.base44.yml up -d
```

The container installs npm deps, seeds the demo world on first boot (4
buildings, 2 cleaners, 2 weeks of history), and starts `next dev` on port
3000. The SQLite DB and node_modules persist in named volumes, so subsequent
restarts are fast and data survives.

## Key facts

- **Package manager:** npm (package-lock.json).
- **Native module:** better-sqlite3 requires build tools — the `node:22` image
  has them. node_modules lives in a named volume so the compiled binary
  persists across restarts.
- **Passcode:** `SCARA_PASSCODE=scara2026` gates all non-public routes. The
  public lead-gen page (`/`) and building status pages (`/b/<code>`) are open.
- **Health:** `GET /api/health` returns DB status (ok/unconfigured/unreachable/empty).
- **allowedDevOrigins:** next.config.ts allow-lists the Base44 preview origin
  so Next.js doesn't block HMR/dev assets.
- **Seed:** `npm run seed` migrates + wipes + reloads the demo world. It only
  runs on first boot (when `.data/scara.db` doesn't exist yet).
- **File watching:** `WATCHPACK_POLLING=true` is set because bind mounts in
  Docker don't always trigger native file events.

## Verify it works

```bash
curl -s localhost:3000/api/health   # → 200 with DB status
curl -s localhost:3000/             # → Romanian lead-gen HTML
```

## Test commands

```bash
npm run check     # typecheck + lint + unit tests
npm run test      # vitest only
npm run e2e       # playwright (requires `npm run build` first)
```
