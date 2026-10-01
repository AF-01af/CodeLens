# CodeLens

A peer code review platform for computer science courses: students submit code, review each other's work, and get feedback from both peers and AI, while professors keep control of assignments and grades.

**Live:** not deployed yet (target: Azure Container Apps, see [deploy spec](docs/specs/deploy.md))

## What it does

Today:

- Professors create assignments; students submit code once per assignment, before the due date ([spec](docs/specs/review/peer-review-api.md))
- Students review a classmate's submission; the author sees the review without the reviewer's name ([spec](docs/specs/review/peer-review-api.md))

Planned (not built yet): inline comments on code, rubrics, automatic anonymous reviewer pairing, AI shadow reviews run by the background worker, human vs AI comparison, reviewer profiles, professor grading.

## How it works

1. A professor creates an assignment and review rubric.
2. Students submit their code.
3. CodeLens assigns each submission to one or more student reviewers.
4. Students review the code without seeing AI feedback.
5. AI independently reviews the same submission in the background.
6. CodeLens groups similar findings from humans and AI.
7. The professor confirms which findings are valid.
8. Reviewer profiles are updated based on what each reviewer found, missed, or incorrectly flagged.
9. Future review assignments can use these profiles instead of relying only on random pairing.

Steps 1, 2 and 4 work through the API today. The rest are on the roadmap.

## Tech stack

Built on the [CTP C12 starter](https://github.com/CUNYTechPrep/ctp-starter).

| Layer | What we use |
|---|---|
| Web app + API | Next.js (App Router), React, TypeScript, Tailwind. The API is Next.js route handlers under `apps/web/app/api/` |
| Validation + queries | Zod schemas and Prisma queries in `packages/domain` |
| Database | PostgreSQL through Prisma. Local dev runs an embedded Postgres; tests use in-memory PGlite |
| Background worker | `apps/worker`, a separate Node process that polls an Azure Storage queue (Azurite locally). This is where AI reviews and static analysis will run |
| Tests | Vitest |
| CI | GitHub Actions on every PR: install, Prisma generate, typecheck, test, build |
| Deploy target | Azure: Container Apps for the web app, Azure Database for PostgreSQL, Azure Storage for blobs and queues |
| Package manager | pnpm workspaces + Turborepo |

Student code is analyzed statically. The platform never executes it.

## Repository structure

```text
CodeLens/
├── apps/
│   ├── web/          # Next.js app: pages + API route handlers
│   ├── worker/       # background job processor (queue consumer)
│   ├── db-server/    # local-dev embedded Postgres; applies migrations on boot
│   └── migrate/      # migration runner for CI/Azure + seed script
├── packages/
│   ├── db/           # Prisma schema, SQL migrations, Prisma client
│   ├── domain/       # Zod schemas + queries used by the web app (and their tests)
│   ├── auth/         # current-user helper (dev stub until real auth)
│   ├── services/     # Azure blob/queue clients (Azurite locally)
│   └── log/          # shared pino logger
├── tests/integration # repo-level PGlite smoke test
├── docs/             # specs, ADRs, runbooks, postmortems
└── .github/          # CI workflow, issue and PR templates
```

## Run it locally

No Docker and no cloud account needed. Always use `pnpm`, not `npm`.

```bash
pnpm install
pnpm prisma:generate     # typed DB client
pnpm dev                 # web + worker + local Postgres + Azurite
```

In a second terminal, with `pnpm dev` still running:

```bash
pnpm db:seed             # one professor (demo-user) and two students (student-a, student-b)
```

Check it worked: open `http://localhost:3000/api/health`. It should return `{"status":"ok","db":"ok"}`.

The app is at `http://localhost:3000`. To call the API as a specific user, send an `x-user-id` header (for example `x-user-id: student-a`). With no header you are `demo-user`, the professor. The [API spec](docs/specs/review/peer-review-api.md#verify) has a full curl walkthrough.

If the database gets into a bad state: stop `pnpm dev`, run `pnpm db:reset`, start `pnpm dev` again, then re-seed.

## Tests and checks

```bash
pnpm test                # unit + integration tests (PGlite, no services needed)
pnpm test:integration    # repo-level smoke test
pnpm typecheck
pnpm build
```

Run all of these before pushing. CI runs the same set on every pull request, and a PR needs a green check plus one approval to merge.

## Environment variables

Local dev needs none. `.env.example` lists every variable, including the ones Azure will need later (`DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `PG_POOL_MAX`). Never commit a `.env` file.

## Docs

Behavior lives in [`docs/specs/`](docs/specs/), decisions in [`docs/adr/`](docs/adr/), procedures in [`docs/runbooks/`](docs/runbooks/), bug history in [`docs/postmortems/`](docs/postmortems/). Start at [`docs/README.md`](docs/README.md).

## Team

- Aman Fatima ([@AF-01af](https://github.com/AF-01af))
- Wajahat Mahmood ([@wajm1](https://github.com/wajm1))

Roles and working agreement: [TeamCharter.md](TeamCharter.md).

## Contributing

Workflow, ground rules, and the documentation system: [`CONTRIBUTING.md`](CONTRIBUTING.md). Agent conventions: [`AGENTS.md`](AGENTS.md).

CodeLens is a CISC 4900 semester project, built in CUNY Tech Prep C12.
