# CodeLens

Peer code review platform for computer science courses.

Professors create assignments and rubrics. Students submit code and review each other's work with inline comments. AI can independently review the same submission in the background. Longer term, CodeLens compares human and AI findings, tracks reviewer strengths, and improves future review assignments.

## Current status

**Foundation + first API.** The repo has:

- a Next.js frontend scaffold
- a Spring Boot API for users, assignments, submissions, and reviews (`GET /api/health` plus CRUD-ish endpoints)
- PostgreSQL via Docker Compose and Flyway
- docs for architecture, local setup, and the API

Auth, AI, rubrics, and the rest of the product UI are **not** implemented yet. See [docs/api.md](docs/api.md).

## Repository structure

```text
CodeLens/
├── apps/
│   ├── web/          # Next.js + React + TypeScript + Tailwind
│   └── api/          # Spring Boot REST API (Java 21)
├── docs/
│   ├── architecture.md
│   └── development.md
├── .github/          # CI + issue/PR templates
├── docker-compose.yml
├── .env.example
├── package.json      # convenience scripts for the frontend + API
└── README.md
```

## Prerequisites

- Node.js 20+
- Java 21+
- Docker

## Quick start

```bash
# 1. Env
cp .env.example .env

# 2. Database
docker compose up -d

# 3. API (terminal A)
npm run dev:api

# 4. Frontend (terminal B)
npm install
npm run dev
```

- Frontend: http://localhost:3000  
- API health: http://localhost:8080/api/health  

Full details: [docs/development.md](docs/development.md). Architecture: [docs/architecture.md](docs/architecture.md).

## Tests

```bash
npm run typecheck    # frontend
npm run build        # frontend
npm run test:api     # backend (Maven)
```

## Environment variables

Copy `.env.example` to `.env`. Never commit secrets. AI keys are optional and unused until AI features exist.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React, TypeScript, Next.js, Tailwind |
| Backend | Java 21, Spring Boot, Spring Data JPA, Flyway |
| Database | PostgreSQL |
| Editor (later) | Monaco |
| AI (later) | OpenAI / Anthropic (behind our own service) |

Student code is analyzed statically and is never executed as part of AI review.
