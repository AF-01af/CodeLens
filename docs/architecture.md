# Architecture

CodeLens is a peer code review platform for computer science courses. This document describes the intended system shape. Most product features are not implemented yet.

## Current stack

```text
Browser
   |
Next.js frontend  (apps/web)
   |
Spring Boot REST API  (apps/api)
   |
PostgreSQL  (Docker Compose)
```

- **Frontend (`apps/web`)** — React, TypeScript, Next.js, Tailwind. UI only. Do not put business logic or persistence in Next.js API routes.
- **Backend (`apps/api`)** — Java, Spring Boot, Spring Data JPA / Hibernate, Flyway. Owns business logic and the database schema.
- **Database** — PostgreSQL is the source of truth. Local development uses Docker Compose.

## Domain concepts (future schema)

An earlier Prisma draft captured these core entities. They inform the future Flyway/JPA model; they are **not** migrated into the database yet:

- **User** — student or professor
- **Assignment** — created by a professor
- **Submission** — student code for an assignment
- **ReviewPairing** — anonymous assignment of a reviewer to a submission
- **Review** — human review content and status
- **Grade** — professor grading of a submission

Later work will also need rubrics, inline comments, AI shadow reviews, issue matching, adjudication, and reviewer performance profiles.

## Future seams (not implemented)

```text
Spring Boot
   |
   +-- AI review service      (OpenAI / Anthropic / Gemini behind our interface)
   +-- static analysis        (AST / linters — code is NEVER executed for AI review)
   +-- issue matching         (group differently worded findings)
   +-- reviewer assignment    (use performance profiles over time)
```

Rules for those seams when they arrive:

1. External AI providers sit behind our own service interface — never called ad hoc from controllers or the frontend.
2. AI findings retain provenance (provider, model, prompt version).
3. Student code is analyzed statically and must not be executed on the server as part of AI review.
4. GitHub integration may be added later; it is not required for the classroom workflow.
