# Lexora Experience Refactor — Local Code Review

## Context

- Fixed point: `1d41c7fe4ec4270ea8ea361fa65bbd298d232c7d`
- Scope: Lexora branding, Chinese/English UI, navigation and action latency,
  vocabulary client decomposition, and related accessibility polish.
- Spec:
  `docs/superpowers/specs/2026-08-25-lexora-experience-refactor-design.md`
- Review skill: `code-review-and-quality`

## Tests reviewed first

The change adds behavior tests for:

- Lexora metadata branding;
- locale validation and browser-language selection;
- Chinese/English dictionary parity and fallback;
- vocabulary meaning rendering;
- learning-path completion, active Lesson selection, and percentage logic.

Existing vocabulary domain, delayed retry, answer evaluation, typing feedback,
preview configuration, Stripe configuration, and Lesson flow tests remain
green.

## Correctness

**Required — fixed:** `t()` accepted arbitrary strings even though the
dictionary exposed `MessageKey`. A typo could silently render the key. The
public translation API and Client Context now require `MessageKey`; the loose
overload remains only for explicit fallback testing.

**Required — fixed:** Quests and Shop rendered `<div>` directly under `<ul>`.
The children are now semantic `<li>` elements.

**Required — fixed:** `autoFocus={isDesktop}` did not guarantee focus after the
media query updated. The input now uses a ref and effect to focus only on
desktop when enabled.

**Required — fixed:** reduced-motion users could receive a first-frame Confetti
flash. The media-query default now suppresses Confetti until motion preference
is known.

No remaining correctness blocker found.

## Readability & simplicity

- `vocabulary-lesson.tsx` decreased from 379 to 131 lines.
- State and network transitions live in `use-vocabulary-lesson.ts`.
- Completion, exercise composition, and footer feedback are separate focused
  components.
- `db/queries.ts` decreased to approximately 196 lines, with vocabulary reads
  isolated in `db/vocabulary-queries.ts`.

**Optional:** split `lib/i18n/messages.ts` by domain if it grows beyond roughly
400 lines. At its current size, one typed dictionary keeps parity checks simple.

**Optional:** refactor the 259-line Legacy `app/lesson/quiz.tsx` in a separate
behavior-preserving change. Mixing that refactor into this feature would make
the reviewed scope harder to reason about.

## Architecture

- No i18n dependency or locale route hierarchy was added.
- Locale state has one Cookie-backed provider and one server resolver.
- Learn path normalization is a tested pure function backed by one cached
  database graph query.
- Vocabulary route and Action changes reduce round trips without changing the
  atomic write batch or server-authoritative scoring.

No circular dependency or misplaced feature logic found.

## Security

- No secrets or `.env.local` content enter the diff.
- Clerk protection, server-side answer reconstruction, Lesson/Word ownership,
  example ownership, and parameterized Drizzle queries remain intact.
- No new runtime dependency was added.

No security finding.

## Performance

- Warm `/learn` navigation improved from 2851 ms to a 1273 ms average in the
  recorded authenticated development runs.
- Vocabulary Server Action internal timing improved from roughly 2.6–5.0
  seconds to 1.287 seconds in the recorded run.
- Remaining latency variance is dominated by Clerk development proxy and Neon
  network timing rather than duplicate application queries.

**Optional:** repeat measurements in a deployed environment near the Neon
region before setting production performance budgets.

## Verification

- `pnpm format`: pass
- `pnpm test:run`: 14 files, 83 tests, pass
- `pnpm lint`: pass
- `pnpm exec tsc --noEmit`: pass
- `pnpm build`: pass
- Authenticated Chinese/English desktop QA: pass
- 390 × 844 Vocabulary Lesson QA: pass
- Application browser logs: no application error; only Clerk development-key
  warning and an attribute injected by the user's browser extension

## Verdict

**Approve.** The change improves code health and fulfills the reviewed spec.
There are no remaining Critical or Required findings.
