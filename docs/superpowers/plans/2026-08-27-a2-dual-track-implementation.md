# A2 Dual-Track Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an A2-first placement flow that asks for the learner's goal, scores a short assessment, stores a learning profile, and presents a daily/exam dual-track recommendation without replacing the existing learning Session, Reader, Review, or local-first storage.

**Architecture:** Keep placement logic pure and independent from React. Store one serializable placement profile in localStorage. Render first-run onboarding when no profile exists; after completion, pass the profile into the existing home page so it exposes one primary track and one secondary track with an adjustable initial ratio. Use a shared vocabulary model and track metadata rather than duplicating word progress.

**Tech Stack:** React 19, TypeScript, Vite, localStorage, Vitest, Node test runner.

**Spec:** `docs/LEXORA_A2_DUAL_TRACK_PRODUCT_DIRECTION.md`

## Global Constraints

- Default learner level is A2, but the placement result may recommend A1 reinforcement or B1 challenge.
- The two tracks are `daily` and `exam`; the combined-goal default ratio is 60% daily and 40% exam.
- Placement is a recommendation, not a CEFR certification.
- Existing localStorage keys and existing Session/Reader/Review behavior must remain compatible.
- No backend, authentication, AI API, payment, leaderboard, or unrelated visual redesign is part of this slice.
- Frontend changes belong under `src/`; test changes belong under `tests/learning/`.

---

### Task 1: Add placement domain logic and A2 question bank

**Owner:** `frontend_worker`

**Files:**
- Create: `src/learning/placement.ts`
- Create: `src/data/placement.ts`
- Modify: `src/features/words/types.ts`

**Interfaces:**
- `PlacementGoal = 'daily' | 'exam' | 'both'`
- `PlacementSkill = 'meaning' | 'context' | 'recall' | 'spelling'`
- `PlacementQuestion` contains `id`, `level`, `skill`, `prompt`, `options`, `answer`, `wordId`, and `track`.
- `PlacementAnswer` contains `questionId`, `answer`, `correct`, and `elapsedMs`.
- `PlacementProfile` contains `version`, `completedAt`, `level`, `goal`, `primaryTrack`, `dailyRatio`, `examRatio`, `overallScore`, `skillScores`, `recommendation`, and `answeredQuestionIds`.
- Export `scorePlacement(questions, answers, goal): PlacementProfile`.
- Export `getPlacementQuestions(): PlacementQuestion[]`.

- [ ] **Step 1: Define the pure placement types and question bank**

Create a fixed A2-centered bank containing 24 questions: 6 meaning, 6 context, 6 recall, and 6 spelling items. Include A1, A2, and B1 difficulty labels. Use the existing word data and real example sentences; do not invent a second word-progress format.

- [ ] **Step 2: Implement deterministic scoring**

For each skill, calculate the percentage of correct answers. Calculate `overallScore` as the weighted average `meaning * 0.25 + context * 0.25 + recall * 0.30 + spelling * 0.20`, rounded to the nearest integer. Map the score to:

```text
0–39   -> A1 reinforcement
40–69  -> A2 core
70–84  -> A2 core + B1 challenge
85–100 -> B1 challenge with A2 review
```

Set the track ratio from the goal: `daily` => 100/0, `exam` => 0/100, `both` => 60/40. Set `primaryTrack` to the larger ratio; for equal ratios use `daily`.

- [ ] **Step 3: Add recommendation copy**

Return a short recommendation that names the level band and the weakest skill. Use the wording “推荐从 A2 开始” or “当前表现接近 A2”; never claim that the assessment certifies a CEFR level.

- [ ] **Step 4: Export only pure functions**

The placement module must not import React, access `window`, access localStorage, or depend on current time except for the profile timestamp passed through a small injectable helper or generated at the boundary.

### Task 2: Add onboarding UI and persist the learner profile

**Owner:** `frontend_worker`

**Files:**
- Create: `src/components/PlacementOnboarding.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/styles/index.css`

**Interfaces:**
- `PlacementOnboarding` receives `questions` and `onComplete(profile)`.
- `App` reads `lexora:placement-profile`; when absent, it renders onboarding before the main shell.
- `Home` receives `placementProfile` and renders the level, primary track, ratio, and two track cards.

- [ ] **Step 1: Add the persisted profile boundary**

Use a new key named `lexora:placement-profile`. Parse invalid or incompatible data as absent and show onboarding again. Do not change the existing progress, settings, daily-plan, review-history, learning-history, or reader keys.

- [ ] **Step 2: Build the goal selection screen**

Show three choices: “日常英语”, “考试英语”, and “两者都要”. Each choice must be a real button with a visible selected state and a concise explanation. The default selected value is `both`.

- [ ] **Step 3: Build the assessment screen**

Show one question at a time with a visible `n / 24` progress indicator, the skill label, answer choices when present, and an input for recall/spelling questions. Record the answer only once. Provide a previous button only before submission of the current question; after submission, advance with a clear “下一题” action.

- [ ] **Step 4: Build the result screen**

Show the recommended level, primary path, daily/exam ratio, weakest skill, and a single “开始学习” action. Explain that this is a starting recommendation and can be changed later.

- [ ] **Step 5: Integrate the result into Home**

Keep the existing daily CTA. Add the current A2/profile strip and two path cards below the main daily focus. The daily card remains the only primary action; the secondary card links to the existing review or vocabulary page without introducing a new route.

- [ ] **Step 6: Keep responsive behavior coherent**

Use the existing cream/green visual system. On mobile, stack the goal choices, assessment card, result summary, and track cards; preserve the bottom navigation. Add keyboard focus styles for all new controls and do not add animation that ignores reduced-motion.

### Task 3: Add placement tests

**Owner:** `test_worker`

**Files:**
- Create: `tests/learning/placement.node.ts`

**Interfaces:**
- Import `scorePlacement`, `getPlacementQuestions`, and placement types from `src/learning/placement.ts`.

- [ ] **Step 1: Add question-bank coverage**

Assert that the bank contains 24 unique questions and exactly 6 questions for each skill.

- [ ] **Step 2: Add goal-ratio coverage**

Assert that `daily` produces 100/0, `exam` produces 0/100, and `both` produces 60/40.

- [ ] **Step 3: Add score-band coverage**

Use deterministic answer arrays to assert the A1, A2, A2-plus-challenge, and B1 recommendation bands at the exact boundary ranges 39, 40, 70, 85, and 100.

- [ ] **Step 4: Add weakest-skill coverage**

Use an answer set where recall is the only weak skill and assert that the recommendation mentions active recall or equivalent Chinese wording.

- [ ] **Step 5: Run the focused test**

Run:

```bash
npm run test:domain -- tests/learning/placement.node.ts
```

Expected: all placement tests pass with no failures.

### Task 4: Integration verification and review

**Owner:** main orchestrator

**Files:**
- No additional source files unless a review finding requires a narrowly scoped fix.

- [ ] **Step 1: Review delegated diffs**

Check that `frontend_worker` changed only `src/` and that `test_worker` changed only `tests/learning/`. Confirm no worker reverted or removed unrelated user changes.

- [ ] **Step 2: Run the complete verification**

Run:

```bash
npm run verify
```

Expected: domain tests, module tests, Vitest tests, TypeScript build, and Vite production build all pass.

- [ ] **Step 3: Perform a browser smoke test**

Open the local site and verify: first-run onboarding appears without a placement profile; all three goals can be selected; a completed assessment reaches the result screen; reloading skips onboarding; Home shows A2 and the selected track ratio; existing navigation still reaches Reader, Review, My, and the vocabulary page.

- [ ] **Step 4: Check final requirements**

Confirm the implementation covers the A2 baseline, two tracks, dynamic ratios, pure scoring logic, local persistence, responsive UI, and tests. Report any deferred P2/P3/P4 items separately.
