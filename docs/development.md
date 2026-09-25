# Local development

## Prerequisites

- Node.js 20+
- Java 21+
- Docker (for PostgreSQL)
- npm (comes with Node)

## 1. Clone and configure

```bash
cp .env.example .env
```

Defaults work for local development. Edit `.env` only if you need different ports or credentials.

## 2. Start PostgreSQL

```bash
docker compose up -d
```

Postgres listens on `localhost:5432` with database/user/password `codelens` by default.

## 3. Start the API

```bash
cd apps/api
./mvnw spring-boot:run
```

Or from the repo root:

```bash
npm run dev:api
```

Health check: [http://localhost:8080/api/health](http://localhost:8080/api/health)

Flyway applies migrations on startup. The first migration is an empty baseline; domain tables come later.

## 4. Start the frontend

In a second terminal:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page reports frontend status and whether it can reach the API.

## Tests

```bash
# Frontend typecheck / build
npm run typecheck
npm run build

# Backend unit tests
npm run test:api
# equivalent: cd apps/api && ./mvnw test
```

## Useful commands

| Command | What it does |
| --- | --- |
| `docker compose up -d` | Start Postgres |
| `docker compose down` | Stop Postgres |
| `npm run dev` | Next.js frontend |
| `npm run dev:api` | Spring Boot API |
| `npm run build` | Production frontend build |
| `npm run build:api` | Package the API JAR |
| `npm run test:api` | Backend tests |

## Environment variables

See `.env.example`. Important ones:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `POSTGRES_*` | Docker Compose / API | Database name, user, password, port |
| `DATABASE_URL` | API | JDBC connection string |
| `SERVER_PORT` | API | HTTP port (default `8080`) |
| `CORS_ALLOWED_ORIGINS` | API | Allowed browser origins |
| `NEXT_PUBLIC_API_URL` | Web | Base URL for API calls |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | — | Optional, future AI work |
