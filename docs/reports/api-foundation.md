# API foundation — What, Why, and How

Milestone report for CodeLens's first working REST API (users, assignments, submissions, reviews). Auth, AI, rubrics, and related features are intentionally out of scope.

## What

### Endpoints added

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Already existed; unchanged |
| POST | `/api/users` | Create student or professor |
| GET | `/api/users/{id}` | Fetch one user |
| POST | `/api/assignments` | Professor creates an assignment |
| GET | `/api/assignments` | List assignments |
| GET | `/api/assignments/{id}` | Fetch one assignment |
| POST | `/api/assignments/{assignmentId}/submissions` | Student submits code |
| GET | `/api/assignments/{assignmentId}/submissions` | List submissions for an assignment |
| GET | `/api/submissions/{id}` | Fetch one submission |
| POST | `/api/submissions/{submissionId}/reviews` | Student reviews a submission |
| GET | `/api/submissions/{submissionId}/reviews` | List reviews for a submission |
| GET | `/api/reviews/{id}` | Fetch one review |

### Database tables added

Flyway migration `V2__core_tables.sql` creates:

- `users` — name, unique email, role (`STUDENT` / `PROFESSOR`)
- `assignments` — title, description, due date, FK to professor
- `submissions` — code text, FK to assignment + student, unique `(assignment_id, student_id)`
- `reviews` — content, status (`DRAFT` / `SUBMITTED`), FK to submission + reviewer, unique `(submission_id, reviewer_id)`

`V1__baseline.sql` remains the empty baseline from the cleanup milestone.

### Java packages / classes

```text
com.codelens
  CodeLensApplication
  config/CorsConfig                    (existing)
  controller/HealthController          (existing)
  controller/UserController
  controller/AssignmentController
  controller/SubmissionController
  controller/ReviewController
  domain/User, Assignment, Submission, Review
  domain/UserRole, ReviewStatus
  dto/*Request, *Response, ErrorBody, ErrorResponse
  repository/*Repository
  service/UserService, AssignmentService, SubmissionService, ReviewService
  exception/ApiException, ApiExceptions, GlobalExceptionHandler
```

Controllers accept HTTP + validated DTOs. Services enforce role checks and business rules. Repositories talk to PostgreSQL through Spring Data JPA. Entities are not returned from controllers.

### Migrations

- `V1__baseline.sql` — unchanged placeholder
- `V2__core_tables.sql` — core schema for this milestone

### Tests

- `HealthControllerTest` — existing slice test for health
- `ApiFlowIntegrationTest` — full MockMvc flow on in-memory H2 with Flyway:
  - create professor + two students
  - professor creates assignment; student cannot
  - student A submits; student B reviews
  - student A cannot review themselves
  - 404 for missing user
  - 400 for invalid body
  - 409 for duplicate email

### Documentation

- `docs/api.md` — endpoint reference for what exists today
- `docs/reports/api-foundation.md` — this report

### Existing files changed

- `apps/api/pom.xml` — added H2 (test scope) for integration tests
- `apps/api/src/test/resources/application.yml` — new; H2 + Flyway for tests

### Dependencies

- Added: `com.h2database:h2` (test)
- No production dependencies added
- Frontend unchanged

---

## Why

### Controllers vs services

HTTP mapping and status codes stay in controllers. Role checks, duplicate rules, and self-review prevention live in services so the rules are one place and easy to test through the API without scattering `if` statements across handlers.

### DTOs instead of entities

Entities carry JPA relationships and persistence concerns. Returning them would leak lazy-loading behavior and couple the JSON shape to the database. Request/response records keep the public API small and stable.

### BIGINT identity IDs

The assignment brief used numeric IDs (`"professorId": 1`). Sequential `BIGINT` values are easy to pass around in curl and classroom debugging. UUIDs would work but are louder for this stage. We can migrate later if needed; we are not pretending IDs are secret (there is no auth yet).

### Flyway owns schema

`ddl-auto: validate` means Hibernate never invents tables. Schema changes are reviewable SQL files. That matches the team’s migration-review habit and avoids drift between “what JPA thinks” and “what Postgres has.”

### Relationships

- Assignment → one professor user
- Submission → one assignment + one student
- Review → one submission + one reviewer

No courses table: the product does not need it for the first demo path. No separate ReviewPairing entity: reviewers are chosen by the client for now; automatic pairing comes later.

### Validation rules

- Unique email — prevents confusing duplicate accounts in demos
- Professor-only assignment create — role is checked in DB because there is no login yet
- Student-only submit/review — same reason
- One submission per student per assignment — keeps the “active submission” story simple
- One review per reviewer per submission — avoids spam duplicates
- Self-review blocked — core peer-review rule
- Past due date rejected — cheap deadline check without a job scheduler

### What we deliberately skipped

Auth, courses, rubrics, AI, inline comments, file upload, grading, notifications, OpenAPI UI, Testcontainers, and seed data. Those need their own designs; stuffing them in now would make the first API hard to learn.

### H2 for tests instead of Testcontainers

CI and laptops should run `./mvnw test` without Docker. H2 in PostgreSQL mode runs the same Flyway scripts. Limitation: H2 is not Postgres. Manual checks against Docker Postgres are still recommended when Docker is available.

---

## How

### Request flow (general)

```text
Client
  |
  v
Controller   (@Valid DTOs, HTTP status)
  |
  v
Service      (business rules, load related users)
  |
  v
Repository   (Spring Data JPA)
  |
  v
PostgreSQL   (schema from Flyway)
  |
  v
Response DTO
```

### Creating an assignment

1. `POST /api/assignments` with JSON body.
2. `AssignmentController` binds `CreateAssignmentRequest` and runs Bean Validation (`@NotBlank`, `@NotNull`).
3. `AssignmentService.create` loads `professorId` via `UserService.requireUser`.
4. If role ≠ `PROFESSOR`, throw `ApiException` with `INVALID_ROLE` → 400.
5. Persist `Assignment` through `AssignmentRepository`.
6. Map to `AssignmentResponse` (includes `professorId`, not the whole user graph).

### Submitting code

1. `POST /api/assignments/{assignmentId}/submissions`.
2. Service loads assignment and student.
3. Rejects non-students, past due dates, and duplicate `(assignment, student)`.
4. Saves `Submission` with `code` as text; `submittedAt` set on insert.
5. Returns `SubmissionResponse`.

### Submitting a peer review

1. `POST /api/submissions/{submissionId}/reviews`.
2. Service loads submission and reviewer.
3. Reviewer must be `STUDENT`.
4. If `reviewer.id == submission.student.id`, throw `SELF_REVIEW_NOT_ALLOWED`.
5. Duplicate reviewer+submission → 409.
6. On `SUBMITTED` status, entity sets `submittedAt` in `@PrePersist`.
7. Returns `ReviewResponse`.

### Error handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps:

| Exception | Status | Code |
|-----------|--------|------|
| `ApiException` | as set on exception | e.g. `USER_NOT_FOUND` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` |
| `HttpMessageNotReadableException` | 400 | `INVALID_REQUEST` |
| other `Exception` | 500 | `INTERNAL_ERROR` (no stack trace in body) |

Shape: `{ "error": { "code", "message" } }`.

### Database migrations

On startup Flyway applies pending files under `classpath:db/migration` in order. After cleanup, a fresh DB runs V1 then V2. Hibernate then validates entities against that schema. Do not edit applied migrations; add `V3_...` instead.

### Run and verify locally

Start Postgres and the API (Docker Desktop must be running):

```bash
# from repo root
cp -n .env.example .env
docker compose up -d
npm run dev:api
```

Or:

```bash
docker compose up -d
cd apps/api
./mvnw spring-boot:run
```

Health check:

```bash
curl -s http://localhost:8080/api/health
# {"status":"ok"}
```

Automated tests (H2, no Docker):

```bash
cd apps/api
./mvnw test
# or: npm run test:api
```

`ApiFlowIntegrationTest` boots the full Spring context against H2, applies Flyway, and drives the HTTP flow with MockMvc.

Manual end-to-end check against real Postgres (one-shot; needs `python3`):

```bash
BASE=http://localhost:8080

PROF=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Prof Ada","email":"ada-report@example.com","role":"PROFESSOR"}')
SA=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Student A","email":"a-report@example.com","role":"STUDENT"}')
SB=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Student B","email":"b-report@example.com","role":"STUDENT"}')

PROF_ID=$(echo "$PROF" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
SA_ID=$(echo "$SA" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
SB_ID=$(echo "$SB" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

ASN=$(curl -s -X POST "$BASE/api/assignments" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Linked List\",\"description\":\"Implement a list.\",\"dueDate\":\"2099-10-15T23:59:00\",\"professorId\":$PROF_ID}")
ASN_ID=$(echo "$ASN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

SUB=$(curl -s -X POST "$BASE/api/assignments/$ASN_ID/submissions" -H 'Content-Type: application/json' \
  -d "{\"studentId\":$SA_ID,\"code\":\"public class LinkedList {}\"}")
SUB_ID=$(echo "$SUB" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

curl -s -X POST "$BASE/api/submissions/$SUB_ID/reviews" -H 'Content-Type: application/json' \
  -d "{\"reviewerId\":$SB_ID,\"content\":\"Looks good.\",\"status\":\"SUBMITTED\"}"
echo
curl -s -X POST "$BASE/api/submissions/$SUB_ID/reviews" -H 'Content-Type: application/json' \
  -d "{\"reviewerId\":$SA_ID,\"content\":\"Self review\",\"status\":\"SUBMITTED\"}"
echo
curl -s "$BASE/api/submissions/$SUB_ID/reviews"
echo
```

More copy-paste examples: [docs/api.md](../api.md).

### Domain relationship diagram

```text
User (PROFESSOR)
   |
   | creates
   v
Assignment
   |
   | receives
   v
Submission <---- User (STUDENT author)
   |
   | receives
   v
Review <---- User (STUDENT reviewer)
```

---

## Files changed

### Created

| File | What / Why / How |
|------|------------------|
| `V2__core_tables.sql` | Creates users/assignments/submissions/reviews with FKs and uniqueness. Flyway applies it before JPA validates. |
| `domain/*.java` | JPA entities and enums. Persist the core model; timestamps set in `@PrePersist` / `@PreUpdate`. |
| `repository/*.java` | Spring Data interfaces. Lookups and existence checks used by services. |
| `service/*.java` | Business rules for create/get/list flows. Controllers call only these. |
| `controller/UserController.java` etc. | HTTP endpoints under `/api`. Validate input and return DTOs. |
| `dto/*.java` | Request/response records and error envelope. Keep API JSON separate from entities. |
| `exception/*.java` | Typed API errors + global handler. One error JSON shape for clients. |
| `ApiFlowIntegrationTest.java` | End-to-end HTTP tests on H2 covering the peer-review happy path and failure cases. |
| `src/test/resources/application.yml` | Points tests at H2 so `./mvnw test` needs no Docker. |
| `docs/api.md` | Human docs for the endpoints that exist. |
| `docs/reports/api-foundation.md` | This What/Why/How write-up. |

### Modified

| File | What / Why / How |
|------|------------------|
| `apps/api/pom.xml` | Added H2 test dependency so integration tests can run without Postgres. |

### Unchanged (relevant)

| File | Note |
|------|------|
| `HealthController`, `CorsConfig`, `CodeLensApplication` | Still the entry points for health and CORS |
| Frontend | No change; still calls `/api/health` only |
| `V1__baseline.sql` | Left in place for migration history |

---

## Known limitations

- No authentication; anyone who can reach the API can act as any user ID.
- No courses, rubrics, pairing algorithm, AI, or inline comments.
- Code is plain text, not file storage.
- Integration tests use H2, not real PostgreSQL (Docker was unavailable during this milestone’s live smoke attempt).
- No seed data; create users manually or via the API.
- List endpoints have no pagination or filters.
