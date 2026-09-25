# Team Charter

*C12 Fall 2026 · Week 3's homework · written as a team after kickoff
(section 4 while the migration review is fresh) · merged into your team
repo by the Week-4 session · revisit at midterm.*

## 1 · Team & Project

**Team name:** CodeLens

**Project (adopted pitch):** CodeLens is a peer code review platform that helps students learn from each other.

**Section:** Fri 3:00

**Members:**

| Name            | GitHub   | Email                        |
|-----------------|----------|------------------------------|
| Aman Fatima     | @AF-01af | afatima2035@gmail.com        |
| Wajahat Mahmood | @wajm1   | wajahatmahmood2004@gmail.com |

### Roles & responsibilities

**Rotating roles (posted in Slack each week):**
stand-up lead runs the meeting and posts notes; review captain is first responder on every PR; demo owner keeps `main` runnable.

**Standing ownership:** Aman owns frontend first; Wajahat owns backend first. First stop, not sole owner.

**Everyone, every week:** one merged PR, one review given, stand-up attended or an async update posted before it starts.

## 2 · The Product

**The problem:** Peer review often becomes busywork instead of real learning.

**Who it's for:** CS students submitting coursework, and professors who run the class and grades.

**Three core features (the MVP):**

1. Anonymous pairing for peer code review
2. Inline comments on submitted code
3. Professor-managed assignments and grades

**What ships by Week 13 (demo day):** A stranger can submit code, get paired with a peer's submission, leave a review, and a professor can see the pipeline and assign a grade.

**Out of scope / v2 ideas (Week-9 pitch fodder):** AI shadow reviews, review-quality scoring, smart reviewer matching, GitHub import.

## 3 · Working Agreement

**Where we talk:** Slack team channel

**Response window:** within 24 hours on weekdays

**When we meet (outside class):** Sundays

**Availability notes:** both usually free weekends; weeknights are hit or miss

**How we decide when we disagree:** list pros/cons; if still stuck, ship the smaller version

**Definition of done:** PR merged, CI green, reviewed, runs locally

### Rituals

| Ritual | When | Shape |
|--------|------|-------|
| Stand-up | Sunday 7pm ET, 15 min hard stop | merged / in review / blocked; every blocker gets an owner |
| Team review (in class) | every session, ~15 min | one PR on screen; comments filed for real |
| Async check-in | Wednesday by 9pm | one line each: in flight, anything slipping |
| Retro | midterm + before demo day | keep / stop / start — edit the charter on the spot |
| Planning | Sunday after stand-up, 10 min | next week's PRs claimed by name, one issue each |

**How we track work:** GitHub issues — one per PR, assigned to one person, closed by the merge

## 4 · Code & Review Norms

**Branch & PR flow:** branch off `main` → open PR → one approval → merge. No direct pushes to `main`.

**What blocks approval:** red CI, secrets in the diff, unresolved `blocker:` comments, PR that doesn't run locally

**Review response time:** within 24 hours on weekdays

**Comment conventions:** `blocker:` must fix; `q:` question; `nit:` optional polish

## 5 · AI Working Norms

**Course policy (not optional):** no AI-generated code gets merged unread.
The PR author owns every line they open, wherever it came from. AI
explanations get verified by running the code.

**How we use AI as a team:** debugging, boilerplate, and explaining errors when stuck

**What we never delegate to AI:** merging unread code, inventing product decisions, or letting agents open/merge PRs for us

## 6 · When Things Go Wrong

Stuck protocol (course default): 15 minutes stuck → post in the team
thread → still stuck at stand-up → TA → office hours.

**If someone can't deliver on time:** tell the other person same day; move the leftover work in Slack; keep `main` green

**If we have a conflict:** name it at stand-up → ask a TA → instructor if needed

## 7 · Commitment

We wrote this together, we mean it, and we'll revisit it at midterm and
update what isn't working.

| Signed  | Date   |
|---------|--------|
| Wajahat | Sep 24 |
| Aman    | Sep 24 |
|         |        |
|         |        |
