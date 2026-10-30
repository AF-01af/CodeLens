---
type: feature
---
# Readers can switch submitted code into a more readable view

## Why
Long code lines and large submissions are difficult to inspect in a narrow browser window. Readers can opt into line numbers, softer wrapping, and more generous line spacing without changing the submitted source.

## Where it lives
- `apps/web/components/CodeViewer.tsx` — shared code display and local mode toggle
- `apps/web/app/submissions/[id]/review/page.tsx` — anonymous code shown to the assigned reviewer
- `apps/web/app/page.tsx` — professor and student submission views

## Behavior
- Code is shown in a compact, horizontally scrollable view by default.
- Each code viewer has an independent, accessible toggle labeled “Readable code mode”; its pressed state reflects the selected mode.
- Readable mode numbers source lines, wraps long lines, and increases text size and line spacing. It preserves source characters and order; it does not format, highlight, execute, or persist code.
- Turning readable mode off restores compact horizontal scrolling.
- The mode is local to the viewer and resets when that page/view is reloaded.

## Examples

| State / input | Behavior |
|---|---|
| Viewer first loads with multi-line code | Compact monospaced source is shown with horizontal scrolling as needed |
| Reader activates “Readable code mode” | Line numbers appear, long lines wrap, and the button reports pressed |
| Reader disables readable mode | Number gutter is removed and source returns to compact horizontal scrolling |
| Source contains blank lines or a trailing newline | Blank source lines remain visible and are numbered; source text itself is unchanged |

## Verify
- `pnpm typecheck`, `pnpm test`, and `pnpm build`
- Open a review and dashboard code block, toggle the mode with mouse and keyboard, and verify wrapping/line numbers and reversible state without source changes.

## Constraints & decisions
- This is a display-only view, not a language-aware formatter or syntax highlighter; arbitrary submitted languages remain supported without dependencies.
- Mode state is intentionally transient and per viewer; no preference or submission data is written.

## Out of scope
- Syntax highlighting, code editing, diff views, and persisted reader preferences — no spec yet.
- Review comments and rubric interaction — no spec yet.
