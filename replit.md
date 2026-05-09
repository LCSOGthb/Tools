# Personal Tool Console

A command-driven personal utility app with local history, saved shortcuts, and fast results. Supports math, unit conversion, currency conversion, QR code generation, password generation, and a speed test — all running locally in the browser.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `personal-tool-console`)
- API: Express 5 (artifact: `api-server` — unused by the frontend, scaffold only)
- DB: PostgreSQL + Drizzle ORM (unused — app is fully local-storage based)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- QR: `qrcode.react`

## Where things live

- `artifacts/personal-tool-console/src/pages/home.tsx` — all tool logic (math, unit, currency, QR, password, speed test), history, pinned shortcuts, settings
- `artifacts/personal-tool-console/src/App.tsx` — router
- `artifacts/personal-tool-console/src/index.css` — dark slate theme
- `lib/api-spec/openapi.yaml` — API contract (healthz only, no app-specific routes)

## Architecture decisions

- Fully client-side: all tool logic runs in the browser with no backend required.
- localStorage for persistence: history, pinned shortcuts, and preferences are stored with versioned keys (`ptc_*_v1`).
- Currency rates are hardcoded/static — replace with a live API for production use.
- QR codes are rendered inline using `qrcode.react` (SVG, no external service).
- Speed test downloads a public CDN file — swap for a controlled endpoint in production.

## Product

Users type commands into a command palette and get instant results for:
- Math: `16 * 24 + 10`
- Unit conversion: `10 km to mi`
- Currency conversion: `100 usd to myr`
- Password generation: `gen password 16 strong`
- QR code: `qr https://example.com`
- Speed test: `speed test`

Results appear instantly with copy/pin actions. History and pinned commands persist in localStorage.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The app is fully frontend-only. The api-server and database packages are scaffold-only.
- `pnpm dev` at workspace root has no dev script — use `restart_workflow` instead.
- The detect script reports `CLIENT_DIR=` empty because the migration was a Next.js root project (not a subdirectory). Frontend was ported manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
