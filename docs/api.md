# CodeLens API

Authentication is not implemented yet. Callers send user IDs in request bodies. Role checks look up those users in the database.

Base URL (local): `http://localhost:8080`

## Start the API

From the repo root (Docker Desktop must be running):

```bash
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

Check it is up:

```bash
curl -s http://localhost:8080/api/health
```

Expected: `{"status":"ok"}`

Run automated tests (no Docker needed; uses H2):

```bash
cd apps/api
./mvnw test
# or from repo root: npm run test:api
```

## End-to-end curl walkthrough

Paste this in a second terminal while the API is running. It creates a professor, two students, an assignment, a submission, a peer review, then shows the self-review failure.

```bash
BASE=http://localhost:8080

# 1. Professor
curl -s -X POST "$BASE/api/users" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Prof Ada","email":"ada@example.com","role":"PROFESSOR"}'
# note the returned "id" → PROFESSOR_ID

# 2. Student A
curl -s -X POST "$BASE/api/users" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Student A","email":"a@example.com","role":"STUDENT"}'
# note "id" → STUDENT_A_ID

# 3. Student B
curl -s -X POST "$BASE/api/users" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Student B","email":"b@example.com","role":"STUDENT"}'
# note "id" → STUDENT_B_ID

# 4. Assignment (replace 1 with PROFESSOR_ID)
curl -s -X POST "$BASE/api/assignments" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Linked List Assignment",
    "description": "Implement a singly linked list.",
    "dueDate": "2099-10-15T23:59:00",
    "professorId": 1
  }'
# note "id" → ASSIGNMENT_ID

# 5. Student A submits (replace 1 with ASSIGNMENT_ID, 2 with STUDENT_A_ID)
curl -s -X POST "$BASE/api/assignments/1/submissions" \
  -H 'Content-Type: application/json' \
  -d '{
    "studentId": 2,
    "code": "public class LinkedList { }"
  }'
# note "id" → SUBMISSION_ID

# 6. Student B reviews (replace 1 with SUBMISSION_ID, 3 with STUDENT_B_ID)
curl -s -X POST "$BASE/api/submissions/1/reviews" \
  -H 'Content-Type: application/json' \
  -d '{
    "reviewerId": 3,
    "content": "The null case is not handled before accessing the next node.",
    "status": "SUBMITTED"
  }'

# 7. Fetch submission + reviews
curl -s "$BASE/api/submissions/1"
curl -s "$BASE/api/submissions/1/reviews"

# 8. Should fail: Student A reviews themselves (400 SELF_REVIEW_NOT_ALLOWED)
curl -s -X POST "$BASE/api/submissions/1/reviews" \
  -H 'Content-Type: application/json' \
  -d '{
    "reviewerId": 2,
    "content": "I should not review myself.",
    "status": "SUBMITTED"
  }'
```

One-shot script that parses IDs with `python3` (macOS/Linux):

```bash
BASE=http://localhost:8080

PROF=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Prof Ada","email":"ada2@example.com","role":"PROFESSOR"}')
SA=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Student A","email":"a2@example.com","role":"STUDENT"}')
SB=$(curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' \
  -d '{"name":"Student B","email":"b2@example.com","role":"STUDENT"}')

PROF_ID=$(echo "$PROF" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
SA_ID=$(echo "$SA" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
SB_ID=$(echo "$SB" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

ASN=$(curl -s -X POST "$BASE/api/assignments" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Linked List\",\"description\":\"Implement a list.\",\"dueDate\":\"2099-10-15T23:59:00\",\"professorId\":$PROF_ID}")
ASN_ID=$(echo "$ASN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

SUB=$(curl -s -X POST "$BASE/api/assignments/$ASN_ID/submissions" -H 'Content-Type: application/json' \
  -d "{\"studentId\":$SA_ID,\"code\":\"public class LinkedList {}\"}")
SUB_ID=$(echo "$SUB" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

echo "Review:"
curl -s -X POST "$BASE/api/submissions/$SUB_ID/reviews" -H 'Content-Type: application/json' \
  -d "{\"reviewerId\":$SB_ID,\"content\":\"Looks good so far.\",\"status\":\"SUBMITTED\"}"
echo
echo "Self-review (expect error):"
curl -s -X POST "$BASE/api/submissions/$SUB_ID/reviews" -H 'Content-Type: application/json' \
  -d "{\"reviewerId\":$SA_ID,\"content\":\"Nope.\",\"status\":\"SUBMITTED\"}"
echo
echo "Submission:"
curl -s "$BASE/api/submissions/$SUB_ID"
echo
echo "Reviews:"
curl -s "$BASE/api/submissions/$SUB_ID/reviews"
echo
```

Use a fresh email each run (or wipe the DB with `docker compose down -v && docker compose up -d`) if you hit `DUPLICATE_EMAIL`.

Error shape:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User 123 was not found"
  }
}
```

## Health

### `GET /api/health`

Success `200`:

```json
{ "status": "ok" }
```

## Users

### `POST /api/users`

Request:

```json
{
  "name": "Wajahat Mahmood",
  "email": "waj@example.com",
  "role": "STUDENT"
}
```

`role` must be `STUDENT` or `PROFESSOR`.

Success `201`: user object with `id`, `name`, `email`, `role`, `createdAt`, `updatedAt`.

Common errors:

- `400 VALIDATION_ERROR` — blank name, bad email, missing role
- `409 DUPLICATE_EMAIL` — email already used

### `GET /api/users/{id}`

Success `200`: user object.

Common errors:

- `404 USER_NOT_FOUND`

## Assignments

### `POST /api/assignments`

Request:

```json
{
  "title": "Linked List Assignment",
  "description": "Implement a singly linked list.",
  "dueDate": "2026-10-15T23:59:00",
  "professorId": 1
}
```

Success `201`: assignment with `id`, `title`, `description`, `dueDate`, `professorId`, timestamps.

Common errors:

- `400 VALIDATION_ERROR`
- `400 INVALID_ROLE` — `professorId` is not a PROFESSOR
- `404 USER_NOT_FOUND`

### `GET /api/assignments/{id}`

Success `200`. Error: `404 ASSIGNMENT_NOT_FOUND`.

### `GET /api/assignments`

Success `200`: array of assignments.

## Submissions

### `POST /api/assignments/{assignmentId}/submissions`

Request:

```json
{
  "studentId": 2,
  "code": "public class LinkedList { }"
}
```

Success `201`: submission with `id`, `assignmentId`, `studentId`, `code`, `submittedAt`, timestamps.

Common errors:

- `400 INVALID_ROLE` — user is not a STUDENT
- `400 ASSIGNMENT_CLOSED` — due date has passed
- `404 ASSIGNMENT_NOT_FOUND` / `USER_NOT_FOUND`
- `409 DUPLICATE_SUBMISSION` — same student already submitted for this assignment

### `GET /api/submissions/{id}`

Success `200`. Error: `404 SUBMISSION_NOT_FOUND`.

### `GET /api/assignments/{assignmentId}/submissions`

Success `200`: array of submissions. Error: `404 ASSIGNMENT_NOT_FOUND`.

## Reviews

### `POST /api/submissions/{submissionId}/reviews`

Request:

```json
{
  "reviewerId": 3,
  "content": "The null case is not handled before accessing the next node.",
  "status": "SUBMITTED"
}
```

`status` must be `DRAFT` or `SUBMITTED`.

Success `201`: review with `id`, `submissionId`, `reviewerId`, `content`, `status`, `submittedAt` (set when status is `SUBMITTED`), timestamps.

Common errors:

- `400 INVALID_ROLE` — reviewer is not a STUDENT
- `400 SELF_REVIEW_NOT_ALLOWED` — reviewer owns the submission
- `404 SUBMISSION_NOT_FOUND` / `USER_NOT_FOUND`
- `409 DUPLICATE_REVIEW` — same reviewer already reviewed this submission

### `GET /api/reviews/{id}`

Success `200`. Error: `404 REVIEW_NOT_FOUND`.

### `GET /api/submissions/{submissionId}/reviews`

Success `200`: array of reviews. Error: `404 SUBMISSION_NOT_FOUND`.
