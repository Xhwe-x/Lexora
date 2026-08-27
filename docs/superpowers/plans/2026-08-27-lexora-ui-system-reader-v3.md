# Lexora UI System and Reader V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the V3 product and UI direction: let users enter the site before placement, move placement into the first learning session, make answer confirmation keyboard-friendly, enrich A2 Chinese learning content, and deliver a concise Lexora-owned component style with a stronger Reader.

**Architecture:** Keep the current React/Vite stack and local-first storage. Build small local primitives under src/components/ui and learning/reader feature components rather than installing four UI libraries. Keep existing daily/review progress compatible, and add new Reader metadata and sentence-level state only where the current flow needs it.

**Tech Stack:** React 19, TypeScript, Vite, CSS custom properties, localStorage, Vitest, Node test runner.

**Spec:** docs/LEXORA_UI_SYSTEM_AND_READER_OPTIMIZATION_V3.md

## Global Constraints

- Use the A2 learner as the default content baseline.
- Keep the cream/green Lexora identity, adding Tide blue for Reader and Amber for exam states.
- Do not use full-page gradients, glowing borders, particle effects, or continuous decorative motion.
- Do not install shadcn/ui, Magic UI, Aceternity UI, or Naive UI; implement local React components inspired by their delivery principles.
- The first site render must not be blocked by placement.
- Existing localStorage keys and existing daily/review/Reader behavior must remain compatible.
- Frontend changes are limited to src/; test changes are limited to tests/.

---

### Task 1: Move placement into the first learning action

**Owner:** frontend_worker

**Files:**
- Modify: src/App.tsx
- Modify: src/components/PlacementOnboarding.tsx
- Modify: src/pages/Home.tsx

**Interfaces:**
- App keeps a nullable PlacementProfile and a pending first-learning action.
- Home accepts PlacementProfile | null and shows a non-blocking “未完成起点测评” state.
- PlacementOnboarding accepts an onComplete callback and returns to the pending daily-learning action after completion.

- [ ] **Step 1: Preserve existing local data**

Keep progress, settings, daily-plan, review-history, learning-history, reader-document, and reader-interactions unchanged. Use lexora:placement-profile only for the new placement profile.

- [ ] **Step 2: Remove the global gate**

Render the normal App shell when placementProfile is null. Do not return PlacementOnboarding before the sidebar and main page are available.

- [ ] **Step 3: Intercept only the first formal learning action**

When the user clicks the first “开始今日学习” and there is no valid profile, open placement inside the learning flow. Preserve the intent so completing placement immediately begins the original daily Session.

- [ ] **Step 4: Keep returning users stable**

When a valid profile exists, “开始今日学习” enters the existing Session directly. Invalid profiles trigger placement only when the user starts formal learning.

### Task 2: Rebuild the local component visual baseline

**Owner:** frontend_worker

**Files:**
- Modify: src/styles/index.css
- Create or modify: src/components/ui/Button.tsx
- Create or modify: src/components/ui/Input.tsx
- Create or modify: src/components/ui/Badge.tsx
- Create or modify: src/components/ui/Progress.tsx
- Create or modify: src/components/ui/StatusMessage.tsx
- Modify: src/components/Sidebar.tsx
- Modify: src/pages/Home.tsx

**Interfaces:**
- Shared primitives expose semantic variants, not page-specific color values.
- Primary, secondary, ghost, danger, selected, disabled, success, and error states are explicit.
- Existing class names may be preserved through a compatibility layer while new sections migrate to the primitives.

- [ ] **Step 1: Add the V3 design tokens**

Define page, surface, ink, border, primary, Tide, Amber, danger, focus, radius, shadow, and motion tokens from the spec. Keep the token names centralized.

- [ ] **Step 2: Reduce template signals**

Replace oversized rounded gradient panels, excessive shadows, capsule-heavy tags, and decorative glow effects with flat surfaces, 8/12/16px radii, fine borders, compact labels, and one visual accent per page.

- [ ] **Step 3: Preserve responsive behavior**

Keep the desktop sidebar and mobile bottom navigation. Ensure all new component states work at 390px without horizontal overflow.

### Task 3: Improve context questions, Enter, and Chinese content

**Owner:** frontend_worker

**Files:**
- Modify: src/components/exercise/ChoiceExercise.tsx
- Modify: src/components/exercise/TypingExercise.tsx
- Modify: src/components/feedback/ExerciseFeedback.tsx
- Modify: src/components/PlacementOnboarding.tsx
- Modify: src/learning/exercises.ts
- Modify: src/features/words/types.ts
- Modify: src/data/words.ts
- Modify: src/pages/LearnSession.tsx
- Modify: src/styles/index.css

**Interfaces:**
- ChoiceExercise supports clear prompt, sentence context, selected state, disabled state, and keyboard confirmation.
- TypingExercise submits on Enter when non-empty and advances on Enter after feedback.
- Word supports optional meanings, partOfSpeech, collocations, dailyExample, dailyExampleZh, examExample, and examExampleZh fields.

- [ ] **Step 1: Rebuild context-question hierarchy**

Render the type label, short instruction, large sentence with a visible blank, a compact Chinese context hint, answer options, and one confirmation action. Keep detailed explanations inside feedback.

- [ ] **Step 2: Add idempotent keyboard confirmation**

Use the form submit path for input questions. For choice questions, Enter confirms the selected option. Prevent Enter from submitting twice. The button label includes “Enter”.

- [ ] **Step 3: Manage focus**

Move focus to the feedback continue button after submission and to the first control of the next question after continuing. Do not force a keyboard open on mobile.

- [ ] **Step 4: Enrich A2 Chinese content**

Keep zh as the primary fallback, then add optional multiple meanings, part of speech, collocations, and daily/exam examples. Show the current meaning first and keep other meanings expandable.

- [ ] **Step 5: Keep answer hints honest**

Chinese prompts may describe the meaning, usage, or situation but must not reveal the full English answer unless the learner explicitly requests a hint.

### Task 4: Deliver the Reader V3 baseline

**Owner:** frontend_worker

**Files:**
- Modify: src/components/Reader.tsx
- Modify: src/features/reader/state.ts
- Modify: src/features/reader/data.ts
- Modify: src/App.tsx
- Modify: src/styles/index.css
- Create or modify: src/components/reader/ReaderLibrary.tsx
- Create or modify: src/components/reader/ReaderContentCard.tsx
- Create or modify: src/components/reader/ReaderToolbar.tsx
- Create or modify: src/components/reader/WordInspector.tsx

**Interfaces:**
- Reader content supports title, text, level, track, topic, kind, estimatedMinutes, and optional audio metadata.
- Existing reader-document and reader-interactions are migrated without losing current text, progress, or looked-up words.
- Desktop uses a right-side inspector; mobile uses a bottom sheet with a visible close action.

- [ ] **Step 1: Add content metadata without breaking the current document**

Keep the current sample text and custom editor. Add metadata defaults for A2, daily, a topic, and estimated reading time.

- [ ] **Step 2: Add a compact Reader library header**

Show continue reading first, then a small row of recommended local content cards, followed by level/track/topic filters. Keep custom text as a secondary action.

- [ ] **Step 3: Improve the reading toolbar**

Show title, A2/track metadata, progress, settings, and current-sentence playback controls. Keep the toolbar compact.

- [ ] **Step 4: Improve the word inspector**

Show word, level, part of speech, primary meaning, current sentence, Chinese translation, pronunciation, add-to-learning, and expandable meanings/collocations.

- [ ] **Step 5: Add the completion handoff**

When reading reaches completion, show reading time, words encountered, saved words, and actions for reviewing this article or continuing to another article. If the current content cannot calculate a metric, omit it instead of fabricating it.

### Task 5: Add regression tests

**Owner:** test_worker

**Files:**
- Modify: tests/learning/placement.node.ts
- Modify or create: tests/learning/reader.node.ts
- Modify or create: tests/learning/exercises.node.ts

**Interfaces:**
- Tests should exercise exported pure functions and state helpers, not snapshots of CSS.

- [ ] **Step 1: Test non-blocking placement state helpers**

Cover valid profile reuse, invalid profile fallback, and preservation of existing learning data at the state-helper boundary.

- [ ] **Step 2: Test keyboard-relevant answer behavior**

Cover normalized answer matching, empty-input rejection, exact-answer acceptance, and no duplicate submission behavior where the pure handler is exposed.

- [ ] **Step 3: Test Reader metadata and migration**

Cover default A2 metadata, custom text preservation, progress preservation, token interaction preservation, and saved phrase state if added.

- [ ] **Step 4: Run the focused tests**

Run:

~~~bash
npm run test:domain
~~~

Expected: all domain tests pass, including the new regression cases.

### Task 6: Main-thread integration and verification

**Owner:** main orchestrator

**Files:**
- No additional files unless a review finding requires a scoped fix.

- [ ] **Step 1: Review agent diffs**

Confirm frontend_worker changed only src/ and test_worker changed only tests/. Confirm the final design document and implementation plan are included.

- [ ] **Step 2: Run complete verification**

Run:

~~~bash
npm run verify
~~~

Expected: domain tests, module tests, Vitest tests, TypeScript compilation, and Vite production build all pass.

- [ ] **Step 3: Run browser smoke checks**

Verify first render opens Home without placement, first formal learning opens placement, completion continues into learning, Enter submits and advances, context layout is readable, A2 Chinese content is visible, Reader opens on desktop and mobile, and existing Review/My/Words navigation remains available.

- [ ] **Step 4: Check responsive and accessibility basics**

Check 390px width for overflow, visible focus, button labels, dialog close behavior, aria-live feedback, and reduced-motion behavior.

- [ ] **Step 5: Commit and push**

Use an imperative commit message describing the V3 UI and Reader change, then push the current branch to origin. Verify local and remote commit IDs match.
