# Base44 notes
- Dev runs via `docker compose -f docker-compose.base44.yml up -d` (Next dev on :3000, node_modules in a named volume).
- No secrets needed in dev: SQLite at `.data/scara.db`, uploads in `data/uploads/`. First boot runs `npm run seed`; later boots run migrations only. Delete `.data/scara.db` to reseed.
- `SCARA_PASSCODE` unset = routes are open. Turso/R2 vars are production-only.
- Health: `curl localhost:3000/api/health`. Tests: `npm run check` inside the container.
