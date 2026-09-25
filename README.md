# CodeLens

CodeLens is a peer code review platform for computer science courses. Students submit programming assignments, review each other's code, and receive feedback from both human reviewers and AI.

The main goal is to measure the quality of code reviews, not just collect them. CodeLens compares human and AI findings, tracks reviewer strengths over time, and helps professors see where reviewers agree, disagree, or miss important issues.

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

## Main features

- Anonymous peer code review
- GitHub-style inline comments
- Professor-created review rubrics
- Independent AI shadow reviews
- Human vs. AI review comparison
- Similar issue matching across differently worded comments
- Reviewer skill profiles
- False-positive and missed-issue tracking
- Smart reviewer assignment
- Professor dashboard for disagreements and review quality
- AI model comparison for review quality, latency, and cost

## Reviewer profiles

CodeLens tracks how reviewers perform across different types of issues, such as:

- Correctness
- Security
- Edge cases
- Performance
- Maintainability
- Documentation

The system can also track metrics such as confirmed issues found, missed issues, false positives, and agreement with instructor decisions.

## Human and AI review comparison

Human reviewers complete their review before seeing any AI feedback.

After submission, CodeLens can compare:

- Issues found by both the human and AI
- Issues found only by the human
- Issues found only by the AI
- Issues that reviewers disagree on
- Findings that require professor review

This makes it possible to study where human reviewers and AI models perform well or poorly.

## Tech stack

- **Frontend:** React, TypeScript
- **Backend:** Spring Boot, Java
- **Database:** PostgreSQL
- **AI:** Claude, OpenAI, or other LLM APIs
- **Code analysis:** Static analysis and AST parsing
- **Editor:** Monaco Editor

Code is analyzed statically and is not executed by the platform.

## Project scope

CodeLens is being built as a CISC 4900 semester project.

The required classroom workflow remains simple: professors create assignments, students submit code, students review peers, and professors manage the process.

The main engineering focus is the review system behind that workflow:

- matching similar code-review findings
- comparing human and AI reviewers
- measuring reviewer performance
- detecting disagreement
- improving future reviewer assignments

## Status

In development.
