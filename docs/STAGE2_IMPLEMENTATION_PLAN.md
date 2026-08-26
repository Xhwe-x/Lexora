# Lexora Stage 2 UI / UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Stage 2 UI/UX direction: richer learning feedback, synchronized speech state, a distraction-free Reader, a Review Center, and a real local-first My page.

**Architecture:** Keep the existing local-first React/TypeScript architecture. Add small pure data modules for session summaries, reader persistence, review metrics, and learning-day history; keep visual components focused and reuse a single SpeechButton across learning, vocabulary and Reader surfaces.

**Tech Stack:** React 19, TypeScript, Vite, lucide-react, browser SpeechSynthesis, localStorage.

**Spec:** `/mnt/data/LEXORA_STAGE2_UI_UX_MODIFICATION_DIRECTION.md`

## Global Constraints

- Preserve the existing P0 LearnSession queue/retry behavior.
- Do not add backend, account, paid API, XP, coins, ranks, fake learning minutes, or fake memory percentages.
- Speech animation must follow real SpeechSynthesis start/end/error and respect reduced motion.
- Reader defaults to reading mode; text editing is secondary.
- Review has one primary CTA and meaningful empty-state routing.
- My statistics must be derived only from real local data.
- P2 items remain out of scope.

---

### Task 1: Pure Stage 2 learning data contracts
**Files:** Create `src/learning/sessionResults.ts`, `src/learning/learningHistory.ts`, `src/learning/reviewInsights.ts`, `src/features/reader/state.ts`; test under `tests/learning/`.
- [ ] Write failing tests for summary metrics, day aggregation/streak, review strength buckets, and reader state helpers.
- [ ] Run tests and confirm RED.
- [ ] Implement minimal pure functions and types.
- [ ] Run tests and confirm GREEN.

### Task 2: Feedback Dock + Session Summary
**Files:** Create `src/components/feedback/ExerciseFeedback.tsx`; modify `src/pages/LearnSession.tsx`, `src/styles/index.css`.
- [ ] Track per-word session results and session elapsed time internally without showing fake duration if unreliable.
- [ ] Replace ordinary feedback card with Feedback Dock, answer comparison, optional why section, retry explanation and Enter-to-continue.
- [ ] Replace completion card with real summary metrics and weak-word list.
- [ ] Verify TypeScript.

### Task 3: Shared SpeechButton
**Files:** Create `src/components/audio/SpeechButton.tsx`; modify `src/lib/speech.ts`, IntroExercise, WordCard, Reader, styles.
- [ ] Expose speech lifecycle callbacks and cancellation.
- [ ] Add synchronized playing/error UI, broadcast rings and reduced-motion fallback.
- [ ] Ensure repeated clicks restart rather than queue speech.
- [ ] Verify TypeScript.

### Task 4: Reader redesign + local vocabulary bridge
**Files:** Rewrite `src/components/Reader.tsx`; create reader subcomponents as needed; modify App/storage/styles.
- [ ] Default to Reading Canvas with toolbar and secondary editor.
- [ ] Add reader typography settings and persisted document/progress.
- [ ] Add desktop sticky inspector and mobile bottom sheet.
- [ ] Resolve local dictionary entries from existing `words`; unknown tokens explicitly say unavailable.
- [ ] Allow known local words to be added to learning without toast and persist reader word interactions.
- [ ] Verify keyboard/Esc/focus behavior and TypeScript.

### Task 5: Review Center
**Files:** Rewrite `src/components/Review.tsx`; modify App/styles.
- [ ] Build one-CTA hero with due/recent-error source counts and conservative memory buckets.
- [ ] Add recent-error and reader-word secondary sections only when data exists.
- [ ] Add recent activity derived from history.
- [ ] Route empty state to Reader and recent vocabulary.
- [ ] Verify TypeScript.

### Task 6: My/Profile + embedded settings
**Files:** Create `src/pages/My.tsx`, profile components; adapt Settings; modify App/Sidebar/styles.
- [ ] Record real LearningDayRecord entries from submitted exercises and reader actions.
- [ ] Display real learned words, effective reviews, week consistency and non-punitive streak.
- [ ] Add learning plan, vocabulary growth and earned milestone rows from real thresholds.
- [ ] Move settings to low-weight rows and data/privacy panel; keep destructive reset nested.
- [ ] Verify TypeScript.

### Task 7: Motion, mobile, accessibility, verification and packaging
**Files:** `src/styles/index.css`, docs/README as needed.
- [ ] Apply page enter, press, feedback, speech and sheet motion semantics with reduced-motion coverage.
- [ ] Validate 390px responsive rules for Reader, Review, My and Feedback.
- [ ] Run `npm run test:domain`, `npm test`, `npm run build` (reinstall dependencies if uploaded node_modules are cross-platform).
- [ ] Remove `node_modules` from delivery archive and package full project.
