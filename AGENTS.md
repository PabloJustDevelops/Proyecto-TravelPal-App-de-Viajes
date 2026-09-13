## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in this repo, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, label strings unchanged (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root, ADRs in `docs/DECISIONS/`. See `docs/agents/domain.md`.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **travelpal** (API base `https://sjdq7zsn.eu-central.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Hosting

La app corre en Cloudflare Workers con `@opennextjs/cloudflare` (build, preview y deploy via
`opennextjs-cloudflare`). Vercel queda retirado del repo.

Pendiente: desconectar la integracion de Vercel con este repositorio desde la cuenta de Vercel
de Pablo (requiere su login). El repo ya no la necesita.

### Despliegue automatico (pendiente, dashboard de Cloudflare)

Workers Builds es el equivalente a lo que hacia Vercel. Lo configura Pablo en el dashboard:

1. Workers & Pages -> `app-viajes` -> Settings -> Builds -> Connect to Git.
2. Autorizar GitHub y elegir el repo `PabloJustDevelops/Proyecto-TravelPal-App-de-Viajes`.
3. Rama de produccion: `main`. Build command: `npx opennextjs-cloudflare build`.
   Deploy command: `npx wrangler deploy`.
4. Variables de build: `NEXT_PUBLIC_INSFORGE_URL` y `NEXT_PUBLIC_INSFORGE_ANON_KEY`
   (se inlinean en el bundle durante el build).
5. Secret de runtime: `INSFORGE_API_KEY` (Settings -> Variables and Secrets). Nunca al repo.

Manual, por ahora: `npm run deploy` (build de OpenNext + deploy) con `wrangler login`.
