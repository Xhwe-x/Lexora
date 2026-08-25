# Lexora Vocabulary Core MVP

> Maintained implementation plan. Update this document with every material
> code, verification, scope, or environment change.

## Status

Implementation is active on `feat/vocabulary-core`.

| Area                                 | Status      | Verification                                       |
| ------------------------------------ | ----------- | -------------------------------------------------- |
| Git baseline and test runner         | Complete    | Vitest starts and runs repository tests            |
| Vocabulary types and normalization   | Complete    | Unit tests                                         |
| Vocabulary database schema           | Complete    | `db:push` applied successfully to Neon             |
| Three-word CET-4 Seed                | Complete    | Two runs and database counts confirm idempotency   |
| Server answer evaluation             | Complete    | Unit tests                                         |
| Session builder and delayed retries  | Complete    | Deterministic unit tests                           |
| Lesson queries and map compatibility | Complete    | Unit tests, lint, TypeScript                       |
| Attempt persistence action           | Complete    | Domain tests and real Neon records                 |
| Vocabulary Lesson UI                 | Complete    | Component, flow, desktop and 390px browser tests   |
| Public preview mode                  | Complete    | Browser and HTTP verification                      |
| Authenticated end-to-end acceptance  | In progress | Core loop verified; final completion rerun remains |

The stale upstream account-limit banner was replaced with a Lexora Vocabulary
Core status banner so new Clerk users are not incorrectly told registration is
disabled.

The vocabulary UI now renders the English prompt above meaning choices and uses
a Julebu-inspired keyboard-first letter track for spelling and context input.
Before submission, letters remain neutral; after a wrong answer, the first
attempt is shown with per-character correct, wrong, and missing states. The
server remains authoritative for formal scoring.

Authenticated browser acceptance verified correct meaning feedback, XP, Hearts,
wrong spelling, mandatory correction without a duplicate Attempt, a delayed
type-switched retry, context input, responsive layout, and Neon persistence.
During acceptance, revalidating the active `/lesson` route caused an early map
redirect as soon as all words reached Lv.1. Vocabulary attempts now revalidate
map surfaces without invalidating the active Lesson; client queue completion is
the sole trigger for the completion screen.

Stripe remains optional for the Vocabulary Core milestone. Without Stripe keys,
the Shop renders normally with its upgrade control disabled, checkout returns a
clear unavailable result, and the webhook returns HTTP 503 instead of crashing
at module import.

## Current scope

Implement one runnable vocabulary Lesson for:

1. `abandon` — 放弃；抛弃
2. `available` — 可获得的；有空的
3. `maintain` — 维持；保持

The learning loop is:

```text
meaning choice
→ spelling input
→ context input
→ server-side evaluation
→ delayed retry with a different exercise type
→ XP / Hearts
→ persisted word progress
```

The following remain outside this plan:

- FSRS scheduling
- full CET-4/CET-6 imports
- AI-generated exercises
- speech and listening
- streak, boss, achievements, or subscription changes

## Architecture

Legacy and vocabulary Lessons coexist:

```text
Legacy Lesson     → challenges / challenge_options
Vocabulary Lesson → lesson_words / words / dynamic exercises
```

Do not change the legacy PostgreSQL Challenge enum. Lesson mode is detected by
the presence of `lesson_words`.

Vocabulary data uses:

```text
words
word_examples
lesson_words
user_word_progress
exercise_attempts
```

The `session-builder` owns static exercise generation and delayed retries. The
server action owns answer reconstruction, evaluation, XP, Hearts, attempts, and
word-progress persistence. Clients never submit `correct`, `correctAnswer`, or
XP values.

## Compatibility corrections to the original plan

The source application treated Lessons without legacy Challenges as locked.
The implementation therefore also updates course progress and map completion:

- vocabulary Lessons participate in active-Lesson selection;
- a vocabulary Lesson is complete when every linked word reaches at least
  Mastery Lv.1;
- vocabulary map percentage is the proportion of linked words at Lv.1;
- legacy Challenge completion semantics remain unchanged.

The Neon HTTP Drizzle driver does not support interactive transactions. The
attempt action uses Neon batch transactions so Attempt, counters, Mastery, XP,
and Hearts update atomically.

## Public preview mode

On this Windows environment, port `3000` belongs to an excluded TCP range.
`pnpm dev` therefore listens on `localhost:3100`. Clerk's development flow
also targets `localhost`, so binding only to `127.0.0.1` is not sufficient on
this Windows environment.

When Clerk is not configured:

- `/` renders the marketing homepage with a visible Preview badge;
- protected pages redirect to `/`;
- `/api/*` returns HTTP `503` with a configuration message;
- no fake authentication or database access is introduced.

When both Clerk keys are configured, the original Clerk Provider and Proxy
paths are used.

## Required local environment

Create `.env.local` in the project root. It is ignored by Git.

Standalone Drizzle and Seed commands load `.env.local` first and fall back to
`.env`, matching the local setup documented in this repository.

Required for authenticated vocabulary acceptance:

```env
DATABASE_URL="..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3100"
```

Stripe values are needed only when exercising the legacy subscription and
webhook flows.

## Remaining acceptance steps

Database setup evidence already collected:

- `pnpm db:push` applied the schema successfully;
- `pnpm db:vocab-demo` succeeded twice;
- Neon contains exactly three target words, three examples, one Demo Course,
  one Demo Unit, one Demo Lesson, and three ordered Lesson–Word links.

Remaining acceptance steps:

1. Sign in and select the CET-4 Demo course.
2. Complete all three exercise types.
3. Submit `availble`, verify correction input, then verify delayed retry.
4. Reduce Hearts to zero and confirm the Lesson continues.
5. Confirm `exercise_attempts`, `user_word_progress`, XP, and Hearts persisted.
6. Refresh during a Lesson and confirm persisted progress remains.
7. Open a legacy SELECT/ASSIST Lesson and verify regression behavior.
8. Run the final verification suite:

   ```powershell
   pnpm test:run
   pnpm lint
   pnpm exec tsc --noEmit
   pnpm build
   ```

## Working rules

- Use the applicable Superpowers process before each material code change.
- Write and observe a failing test before production behavior changes.
- Diagnose unexpected behavior before proposing a fix.
- Update this document and README when implementation or setup changes.
- Commit stable tasks separately and push `feat/vocabulary-core` to GitHub.
- Do not commit secrets, `.env.local`, build output, or dependency directories.
