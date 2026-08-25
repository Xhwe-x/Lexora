# Lexora Experience Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the product as Lexora, add lightweight Chinese/English UI,
reduce click latency, and split oversized vocabulary code while preserving all
learning behavior.

**Architecture:** A typed internal i18n layer supplies Server and Client
Components without a new dependency. One cached learning-path query replaces
duplicated Learn reads, vocabulary validation reads run concurrently, and the
large Lesson client is decomposed into focused units.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS,
Clerk, Drizzle ORM, Neon HTTP, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-lexora-experience-refactor-design.md`

## Global Constraints

- Product brand is exactly `Lexora`.
- Supported locales are exactly `zh-CN` and `en`; default is `zh-CN`.
- Do not add an i18n dependency or locale-prefixed routes.
- Do not translate database-authored content or React Admin.
- Do not change vocabulary scoring, delayed retry, Mastery, XP, or Hearts.
- Preserve safe preview mode and optional Stripe behavior.
- Every behavior change follows a red-green test cycle.
- Each stable task is committed separately and pushed to
  `feat/vocabulary-core`.

---

### Task 1: Lexora brand and design tokens

**Files:**

- Modify: `config/index.ts`
- Modify: `package.json`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/sidebar.tsx`
- Modify: `app/(marketing)/header.tsx`
- Modify: `app/(marketing)/page.tsx`
- Modify: `app/(auth)/header.tsx`
- Modify: `actions/user-subscription.ts`
- Modify: `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

**Interfaces:**

- Produces CSS brand tokens such as `--lexora-ink`, `--lexora-brand`, and
  `--lexora-surface` consumed by later UI tasks.

- [ ] Replace runtime and metadata `Lingo` strings with `Lexora`.
- [ ] Change package name to `lexora` and update repository keywords.
- [ ] Add Lexora surface, shadow, focus, and reduced-motion base styles.
- [ ] Preserve upstream attribution in README acknowledgements.
- [ ] Run `rg -n "Lingo|lingo"` and classify the remaining database/example
      or attribution occurrences.
- [ ] Run format, tests, lint, and TypeScript.
- [ ] Commit: `feat(brand): rename product to Lexora`.

### Task 2: Typed locale foundation

**Files:**

- Create: `lib/i18n/config.test.ts`
- Create: `lib/i18n/config.ts`
- Create: `lib/i18n/messages.test.ts`
- Create: `lib/i18n/messages.ts`
- Create: `lib/i18n/server.ts`
- Create: `lib/i18n/provider.tsx`
- Create: `components/locale-switcher.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**

- Produces `Locale = "zh-CN" | "en"`.
- Produces `resolveLocale(value?: string): Locale`.
- Produces `detectBrowserLocale(languages: string[]): Locale`.
- Produces `translate(locale, key): string`.
- Produces `useI18n(): { locale; setLocale; t }`.
- Produces `getRequestLocale(): Promise<Locale>`.

- [ ] Write tests showing invalid locale fallback, English browser detection,
      Chinese default, and missing-key Chinese fallback.
- [ ] Run focused tests and observe missing-module failures.
- [ ] Implement locale types and typed dictionaries.
- [ ] Implement Cookie-backed server locale and optimistic client provider.
- [ ] Add an accessible locale switch with `中文` and `EN` labels.
- [ ] Wrap application content in `LocaleProvider` and set the HTML language.
- [ ] Run focused and full verification.
- [ ] Commit: `feat(i18n): add Chinese and English locale foundation`.

### Task 3: Translate public and authenticated shells

**Files:**

- Modify: `app/(marketing)/*`
- Modify: `app/(auth)/header.tsx`
- Modify: `components/sidebar.tsx`
- Modify: `components/mobile-header.tsx`
- Modify: `components/mobile-sidebar.tsx`
- Modify: `components/sidebar-item.tsx`
- Modify: `components/banner.tsx`
- Modify: `components/promo.tsx`
- Modify: `components/quests.tsx`
- Modify: `components/user-progress.tsx`

**Interfaces:**

- Consumes `useI18n()` and `LocaleSwitcher`.

- [ ] Add all shell messages to both dictionaries before replacing strings.
- [ ] Replace visible hardcoded copy and meaningful image alt text.
- [ ] Add locale switchers to marketing, authentication, desktop, and mobile
      shells.
- [ ] Add skip-to-content link and stable `main` id.
- [ ] Ensure icon buttons have labels and focus-visible rings.
- [ ] Run format, tests, lint, and TypeScript.
- [ ] Commit: `feat(i18n): localize Lexora navigation and marketing`.

### Task 4: Translate core pages and Lessons

**Files:**

- Modify: `app/(main)/courses/*`
- Modify: `app/(main)/learn/*`
- Modify: `app/(main)/leaderboard/page.tsx`
- Modify: `app/(main)/quests/page.tsx`
- Modify: `app/(main)/shop/*`
- Modify: `components/modals/*`
- Modify: `app/lesson/*`
- Modify: `components/vocabulary-lesson/*`
- Modify: `lib/i18n/messages.ts`

**Interfaces:**

- Server Components consume `getRequestLocale()` and `translate()`.
- Client Components consume `useI18n()`.

- [ ] Add message keys for all non-admin core routes and both Lesson modes.
- [ ] Translate page headings, buttons, toasts, empty states, feedback, result
      labels, keyboard hints, and modal actions.
- [ ] Keep English words, Chinese definitions, course titles, and answer values
      unchanged as learning content.
- [ ] Replace vague pending buttons with localized `处理中…` / `Working…`.
- [ ] Run all tests and add a component test for locale-specific vocabulary
      labels.
- [ ] Commit: `feat(i18n): localize learning and lesson flows`.

### Task 5: Consolidate Learn queries

**Files:**

- Create: `lib/learning-path.test.ts`
- Create: `lib/learning-path.ts`
- Modify: `db/queries.ts`
- Modify: `app/(main)/learn/page.tsx`

**Interfaces:**

- Produces `buildLearningPath(units): LearningPath` as a pure function.
- Produces cached `getLearningPath()` in `db/queries.ts`.
- Compatibility functions `getUnits`, `getCourseProgress`, and
  `getLessonPercentage` delegate to `getLearningPath`.

- [ ] Write fixtures covering legacy, vocabulary, completed, and empty Lessons.
- [ ] Verify the focused test fails before implementation.
- [ ] Extract pure normalization and active-Lesson selection.
- [ ] Replace duplicate Unit/Lesson queries with one cached database read.
- [ ] Update Learn page to request the combined result once.
- [ ] Measure warm `/learn` navigation against the 2851 ms baseline.
- [ ] Commit: `perf(learn): consolidate learning path queries`.

### Task 6: Reduce vocabulary route and attempt latency

**Files:**

- Create: `db/vocabulary-queries.ts`
- Modify: `db/queries.ts`
- Modify: `app/lesson/lesson-content.tsx`
- Modify: `actions/vocabulary-attempt.ts`
- Modify: `lib/vocabulary/attempt-rules.test.ts`
- Modify: `lib/vocabulary/attempt-rules.ts`

**Interfaces:**

- `getVocabularyLesson(lessonId)` moves to `db/vocabulary-queries.ts`.
- Lesson route uses the vocabulary query result as its mode signal.
- Attempt validation executes independent reads through one `Promise.all`.

- [ ] Add a regression test for the read-plan inputs and validation results.
- [ ] Remove the separate vocabulary mode query from the vocabulary route.
- [ ] Run Lesson membership, user progress, and example checks concurrently.
- [ ] Preserve the Neon batch transaction and server-side answer evaluation.
- [ ] Add localized pending state to the submission button.
- [ ] Measure one correct submission before and after.
- [ ] Commit: `perf(vocabulary): reduce lesson and attempt round trips`.

### Task 7: Decompose the vocabulary Lesson client

**Files:**

- Create: `components/vocabulary-lesson/use-vocabulary-lesson.ts`
- Create: `components/vocabulary-lesson/vocabulary-completion.tsx`
- Create: `components/vocabulary-lesson/vocabulary-footer.tsx`
- Create: `components/vocabulary-lesson/exercise-stage.tsx`
- Modify: `components/vocabulary-lesson/vocabulary-lesson.tsx`

**Interfaces:**

- `useVocabularyLesson(props)` owns queue, answer, pending, scoring, and action
  transitions.
- Presentation components receive serializable values and callbacks only.
- `VocabularyLesson` composes Header, ExerciseStage, VocabularyFooter, and
  VocabularyCompletion.

- [ ] Move state unchanged into the hook and keep all existing tests green.
- [ ] Move completion, exercise dispatch, and footer into focused components.
- [ ] Keep `vocabulary-lesson.tsx` under 160 lines.
- [ ] Search for orphaned imports/components and remove only confirmed dead
      code introduced by this refactor.
- [ ] Run format, all tests, lint, TypeScript, and build.
- [ ] Commit: `refactor(vocabulary): split lesson orchestration`.

### Task 8: Visual polish, browser QA, and Web Interface Guidelines

**Files:**

- Modify only files with verified UI findings from Tasks 1–7.
- Update: `docs/superpowers/plans/2026-08-25-lexora-experience-refactor.md`

**Interfaces:**

- Uses current Vercel Web Interface Guidelines fetched during this task.

- [ ] Test marketing, Learn, Shop, and Vocabulary Lesson in both locales.
- [ ] Test default desktop viewport and 390 × 844 viewport.
- [ ] Verify focus, keyboard, touch targets, long text, and pending feedback.
- [ ] Check browser logs; fix application errors and warnings.
- [ ] Record after-navigation timings beside the baseline.
- [ ] Run Web Interface Guidelines review in `file:line` format and fix all
      concrete accessibility or interaction issues in scope.
- [ ] Commit: `fix(ui): polish Lexora bilingual experience`.

### Task 9: Local code review and release verification

**Files:**

- Review commit range: fixed point at the commit immediately before Task 1
  through `HEAD`.
- Update this plan with verification and review results.

**Interfaces:**

- Uses `code-review-and-quality` five-axis checklist.

- [ ] Review tests before implementation across correctness, readability,
      architecture, security, and performance.
- [ ] Categorize findings as Critical, Required, Optional, Nit, or FYI.
- [ ] Fix every Critical and Required finding, then rerun affected tests.
- [ ] Run `pnpm format`, `pnpm test:run`, `pnpm lint`,
      `pnpm exec tsc --noEmit`, and `pnpm build`.
- [ ] Scan staged content for secrets and confirm `.env.local` is ignored.
- [ ] Commit review fixes and documentation separately.
- [ ] Push `feat/vocabulary-core` and verify the remote SHA.
