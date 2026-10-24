# @project/web — the Next.js app

The user-facing web application. A Next.js server-rendered React app.

The home page is a local demo dashboard for the seeded professor and students.
It exposes the existing assignment, submission, and review workflow. The health
endpoint is for probes only; it is not the app's home page.

## Main routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Role-aware local demo dashboard |
| `/api/health` | GET | Health check — is the process alive? Can it reach the DB? |
| `/submissions/{id}/review` | GET | Review code after starting a peer review |

## Dependencies

- `@project/db` — the Prisma client and generated types
- `@project/services` — queue, storage, and notify adapters
- `@project/domain` — Zod schemas and database queries (empty on main, populated on example branches)
- `@project/auth` — the `currentUserId()` dev identity stub
- `@project/log` — pino logger

The local dashboard can switch between the seeded demo identities. That
development identity control is disabled in production unless explicitly
enabled with `ALLOW_DEV_IDENTITY`.

## Consumers

Users with a browser. No other app or package imports from `@project/web`.

## Local dev

```bash
pnpm dev:web     # starts the Next.js dev server
```

The dev server expects a Postgres server and Azurite running alongside it.
Start everything together with `pnpm dev` from the repo root. The dev server
uses Turbopack (`--turbopack`).

## When it changes

- A new route goes in `app/api/`.
- A new Client Component goes in `components/`.
- Routes are Server Components. Forms and interactivity are Client Components.
  The split is Week 5's topic.
