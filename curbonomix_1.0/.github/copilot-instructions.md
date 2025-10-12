<!--
Guidance for AI coding agents working on the Curbonomix monorepo.
Keep this file short and concrete: what to change, where to look, and project-specific conventions.
-->
# Copilot instructions — Curbonomix

Summary
- Monorepo with packages/* (shared libs, agents, rtu-core) and apps/* (api, customer-portal, shop-designer).
- API is a Fastify-based Node app in `apps/api` that exposes RTU design endpoints. UI is a Vite React app in `apps/customer-portal`.
- Core geometry/logic lives in `packages/rtu-core/src` (RTU spec, sizing, DXF/GCode/submittal generators). Agents live under `packages/agents/*` and call into `rtu-core` and `lms`.

Quick goals for automated changes
- Make minimal, well-scoped edits. Prefer changes in a single package (or app) and add tests where small and obvious.
- Respect the TypeScript-first convention; many packages export types and small JS/TS modules used by other packages.

Where to look first (examples)
- API entry: `apps/api/src/main.ts` and `apps/api/src/api.ts` — these wire Fastify, LMS and register agents; they show expected request/response shapes.
- Core model + exporters: `packages/rtu-core/src/index.ts` — contains RTUSpec, resolveModel, sizePlenum, buildAdapter, toDXF, toGCode, toSubmittal. Use these utilities for any geometry or export work.
- Front-end entry: `apps/customer-portal/src/App.tsx` — demonstrates how the UI calls `/api/rtu/*` endpoints and expects JSON shapes {perf, geo} or file downloads.
- Agents: `packages/agents/*/src/index.ts` — simple IAgent implementations that call into `rtu-core` and `lms`. Use these as templates for new agents.
- LMS/SuperAgent usage: `apps/api/src/main.ts` — shows how the LMS and SuperAgent are instantiated and agents registered. Agents should return {ok,data} shaped results.

Important patterns & conventions
- Monorepo managed via npm workspaces (root `package.json`). Use `npm --workspace=<pkg>` for package-scoped scripts (see root scripts: `dev:api`, `dev:web`).
- Runtime behavior: API listens on HOST/PORT env vars (defaults shown in `apps/api/src/main.ts`). Dockerfile builds separate API and web images.
- Data shapes: RTUSpec (see `packages/rtu-core/src/index.ts`) is canonical. Validate against it when adding new endpoints or UI changes. Many functions throw specific error strings (e.g., `EXISTING_MODEL_NOT_FOUND`, `MISSING_FIELDS`) — preserve these where upstream code expects them.
- Exports: geometry functions return a minimal mesh { vertices: number[][], faces: number[][] } used directly by the UI's three.js renderer.
- File generation: `toDXF`, `toGCode`, `toSubmittal` produce plain text outputs and the API returns them using appropriate content-type and Content-Disposition headers. Preserve those behaviors when modifying download endpoints.

Build / dev / debug commands
- Run API locally: `npm run dev:api` (root) — this runs the workspace script for `@curbonomix/api`.
- Run web dev: `npm run dev:web` (root) — start the Vite dev server for the customer portal.
- Build web: `npm run build:web` (root) — builds the customer-portal for production.
- Container: `docker-compose up --build` will build API and web images (see `Dockerfile` and `docker-compose.yml`). API exposes port 3000 internally; Caddy serves the web app.

Tests & quick validations
- There are no centralized test runners visible; start by adding focused unit tests next to packages you change. Prefer small tests for `rtu-core` functions (sizePlenum, buildAdapter, toDXF/toGCode).
- After edits, run TypeScript builds for the affected package: `npm --workspace=@curbonomix/api run build` or run the app in dev mode to validate runtime TypeScript usage.

Editing guidance for AI agents
- Keep changes minimal and use existing utilities: e.g., when changing geometry, modify `packages/rtu-core/src/index.ts` and update usages in agents and UI.
- When adding or changing endpoints, update `apps/api/src/main.ts` and ensure the handler uses `RTUSpec` shape. Mirror errors thrown in `resolvePair` so clients (UI/agents) handle them.
- For UI changes, follow `App.tsx` patterns: the UI calls `/api/rtu/preview` (POST) and expects {perf, geo}. Use the same fetch wrapper style (see J<T> helper) and error handling.

Integration points and external dependencies
- No external network calls are made by default; important dependencies are internal packages (lms, rtu-core, agents). Keep cross-package imports relative to package names (e.g., `@curbonomix/rtu-core`).
- Caddy in `infra/caddy/Caddyfile` configures static site hosting—changes to routing or hostnames should be reflected there and in `docker-compose.yml`.

Safety and error-handling notes
- Preserve thrown error strings from `apps/api/src/main.ts` and `rtu-core` — consumers check them.
- When generating files (DXF/GCode), the API sets explicit Content-Type and Content-Disposition headers. Keep those headers intact.

Examples to copy (small snippets to reuse)
- Calling RTU endpoints (client): see `apps/customer-portal/src/App.tsx` — the POST body is either { existing_model, new_model } or manual fields plus manual flags.
- Building adapter + sizing (server): use `sizePlenum(spec)` and `buildAdapter(spec)` from `packages/rtu-core/src/index.ts`.

If anything is ambiguous
- Ask the maintainers about workspace package names (they use scoped names like `@curbonomix/api`) and whether adding test infrastructure is acceptable.

Please run this change by the repo owner if you plan to modify cross-cutting build or Docker behavior.
