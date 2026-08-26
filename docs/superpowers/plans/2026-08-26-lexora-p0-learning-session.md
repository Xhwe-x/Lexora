# Lexora P0 Learning Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard-style daily-word flow with one immersive, retry-aware daily learning session while preserving local-first storage and existing word progress.

**Architecture:** Add a pure `learning/` domain layer for session items, queue selection, grading metadata, and retry limits. `LearnSession` renders intro/choice/typing exercises through a shared shell and reports outcomes to `App`, which remains the owner of persisted progress and review history. The home page becomes a single primary CTA; manual review starts the same session engine in review-only mode.

**Tech Stack:** React 19, TypeScript 5.7, localStorage, lucide-react, Node 22 built-in test runner for pure-domain RED/GREEN cycles, existing Vitest when Rollup native dependency is available.

**Spec:** `/mnt/data/Lexora_UI_UX_Modification_Guide_v2.md`

## Global Constraints

- Keep the app local-first; add no backend or paid API.
- Session retry and long-term SRS remain separate mechanisms.
- New words must not go directly from full answer display to productive typing.
- Retry attempts are capped at 2 and do not increase the main progress denominator.
- Session navigation is hidden during immersive study.
- Mobile primary navigation has at most 5 labeled items.
- Existing `english-garden:*` progress must remain readable during the Lexora storage migration.

---

### Task 1: Session domain and retry behavior

**Files:**
- Create: `src/learning/types.ts`
- Create: `src/learning/sessionQueue.ts`
- Create: `src/learning/sessionQueue.node.test.ts`

**Interfaces:**
- Produces: `ExerciseType`, `SessionSource`, `SessionItem`, `SessionState`, `createDailySessionItems`, `createReviewSessionItems`, `enqueueRetry`, `selectNextItem`, `coreProgress`.

- [ ] Write Node tests proving intro/choice/typing ordering, delayed retry when alternatives exist, retry cap, and retry-independent core denominator.
- [ ] Run tests and confirm RED because the production module does not yet exist.
- [ ] Implement the minimal pure session queue logic.
- [ ] Run tests and confirm GREEN.

### Task 2: Review event history and storage migration

**Files:**
- Modify: `src/features/words/types.ts`
- Create: `src/learning/reviewHistory.ts`
- Create: `src/learning/reviewHistory.node.test.ts`
- Modify: `src/lib/storage.ts`

**Interfaces:**
- Produces: `ReviewEvent`, `appendReviewEvent`, `loadMigratedJson`.

- [ ] Write failing tests for capped review-event history and fallback from a Lexora key to the legacy English Garden key.
- [ ] Implement minimal helpers and keep old keys untouched.
- [ ] Re-run tests to GREEN.

### Task 3: Shared immersive exercise UI

**Files:**
- Create: `src/components/exercise/ExerciseShell.tsx`
- Create: `src/components/exercise/IntroExercise.tsx`
- Create: `src/components/exercise/ChoiceExercise.tsx`
- Create: `src/components/exercise/TypingExercise.tsx`
- Create: `src/pages/LearnSession.tsx`

**Interfaces:**
- Consumes: session items from Task 1, `Word[]`, progress callbacks from `App`.
- Produces: `LearnSession` with `daily` and `review` modes and completion summary.

- [ ] Implement the shell with exit button, monotonic core progress, `aria-live` feedback, and keyboard-safe controls.
- [ ] Intro only builds understanding; it never calls `rateWord` as a correct recall.
- [ ] Choice gives recognition evidence; typing gives productive recall evidence.
- [ ] Wrong answers show correction, enqueue delayed retry, and use choice downgrade on the second retry.

### Task 4: Home, navigation, and review integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Review.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `index.html`

**Interfaces:**
- App owns `sessionMode: 'daily' | 'review' | null`.
- Review page starts the same `LearnSession` engine rather than maintaining a second answer UI.

- [ ] Replace home KPI/dashboard blocks with one daily-focus card and one primary start/continue CTA.
- [ ] Hide Sidebar/Bottom Nav while a session is active.
- [ ] Reduce main navigation to 今日 / 单词 / 阅读 / 复习 / 我的 with icon + label.
- [ ] Rename visible branding to Lexora and preserve legacy localStorage compatibility.

### Task 5: Current UX debt fixes

**Files:**
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/Sentences.tsx`

**Interfaces:**
- Settings commits numeric values only on blur/Enter.
- Sentences never plays the full target sentence before submission.

- [ ] Add local draft string state to daily-count input and validate on commit.
- [ ] Replace pre-submit “听答案” with a non-leaking keyword/first-word hint; expose full audio only after an answer is submitted.

### Task 6: Visual system, mobile behavior, and verification

**Files:**
- Modify: `src/styles/index.css`
- Modify: `README.md` only if branding copy references the old product name prominently.

**Interfaces:**
- Session shell uses `.sessionShell` / `.exerciseCard`; navigation labels remain visible on mobile.

- [ ] Add focus-visible states, motion tokens, reduced-motion support, 44px touch targets, immersive session layout, and compact home summary styling.
- [ ] Run all Node domain tests.
- [ ] Run `node node_modules/typescript/bin/tsc -b` and fix all type errors.
- [ ] Attempt `npm test` and `npm run build`; if Rollup native dependency still blocks startup, report that environment blocker separately from TypeScript/domain-test results.
- [ ] Zip the modified project without shipping the broken uploaded `node_modules` directory.
