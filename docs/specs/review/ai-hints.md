---
type: feature
---
# Reviewers can request AI-generated code hints

## Why
Reviewers sometimes need a nudge toward a bug, edge case, or unfamiliar syntax. On-demand hints help them inspect the submission while leaving the review and judgment to the student.

## Where it lives
- `apps/web/app/api/submissions/[id]/hints/route.ts` — authorization, rate limit, Gemini request.
- `apps/web/components/AiHintPanel.tsx` — question input, loading/error states, labeled result.
- `packages/domain/src/reviews.ts` — ensures only the reviewer with an active draft can receive the code context.
- `GEMINI_API_KEY` — server-only configuration; never exposed to the browser.

## Behavior
- A student with an active draft review can request one hint or ask a short question about the code.
- The server loads the code itself; the browser never submits code to the hint endpoint.
- Only code belonging to the active review is sent to Gemini 3.5 Flash-Lite. The request is on demand, limited to five requests per user per minute per web process, and clipped to the first 24,000 characters.
- The model is instructed to offer concise review hints, explain concepts when asked, avoid solutions, treat code as untrusted input, and never claim it executed the code.
- Hints are labeled AI-generated and visually separated from the student's review.
- Missing configuration, provider failures, timeouts, invalid questions, and request limits return the standard API error shape. No provider error details or key are sent to the browser.
- Student code is sent to Google's Gemini API only after the reviewer chooses to request a hint.

## Examples
| State / input | Behavior |
|---|---|
| Reviewer asks about edge cases during a draft | Returns a labeled hint based on the submission |
| Author or unrelated student requests hints | 404; code is not sent |
| Question exceeds 500 characters | 400 validation error |
| No `GEMINI_API_KEY` is configured | 503 with a setup message |
| Sixth request in one minute | 429; wait before trying again |
| Provider is slow or unavailable | 504 or 503; the review draft remains unaffected |

## Verify
- Run `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Set `GEMINI_API_KEY` in ignored `apps/web/.env.local`, start `pnpm dev`, start a draft review as a student, request a hint, and confirm it appears in the labeled panel.
- Try requesting a hint as the submission author and confirm the request is rejected.

## Constraints & decisions
- Hints are optional and user-triggered to limit cost and avoid unsolicited AI feedback.
- The first version sends a bounded code excerpt and does not run code or add static-analysis dependencies.
- Rate limiting is in memory and resets when the web process restarts; a shared deployment should use a shared limiter.
- AI output is advisory and may be incorrect; students remain responsible for their own review.

## Out of scope
- Automated AI review, grading, reviewer scoring, and human/AI comparison are not part of this hint endpoint; see the project roadmap in `README.md`.
