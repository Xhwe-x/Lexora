# Lexora Content, Sync and Exam Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the old home copy, improve the Duolingo-style learning loop, and add honest foundations for URL/transcript import, audio-sentence sync, cross-device sync, article-specific review, and concrete exam routes.

**Architecture:** Keep the React/Vite client local-first. Add a small optional Node service under server/ for sync and remote text/subtitle fetching, protected by a bearer token and disabled unless configured. Reader content, sentence cues, exam routes, and article review packs stay typed and serializable. The client falls back to local behavior when the optional service is unavailable.

**Tech Stack:** React 19, TypeScript, Vite, Node built-in http/fs/url APIs, localStorage, Vitest, Node test runner.

**Spec:** docs/LEXORA_UI_SYSTEM_AND_READER_OPTIMIZATION_V3.md and docs/LEXORA_A2_LEARNING_AND_READER_UX_OPTIMIZATION.md

## Global Constraints

- A2 remains the default entry level.
- Remove the exact home headline “复习旧词，再把新词真正想起来。”.
- Follow Duolingo’s principle of a clear current step, mixed practice, built-in review, and explicit next action; do not copy its brand assets or proprietary UI.
- Keep local-first behavior and preserve existing localStorage data.
- URL import must validate protocol, response size, content type, and timeout.
- Video import means transcript/subtitle import; do not claim to extract arbitrary video audio without a supported transcript or subtitle source.
- Cross-device sync is opt-in and must not silently transmit learning data.
- No secrets, user tokens, or personal data in the repository.
- Frontend changes belong under src/, backend changes under server/, tests under tests/.

---

### Task 1: Rebuild the learning interaction and copy

**Owner:** frontend_worker

**Files:**
- Modify: src/pages/Home.tsx
- Modify: src/pages/LearnSession.tsx
- Modify: src/components/exercise/ChoiceExercise.tsx
- Modify: src/components/exercise/TypingExercise.tsx
- Modify: src/components/exercise/IntroExercise.tsx
- Modify: src/components/feedback/ExerciseFeedback.tsx
- Modify: src/components/PlacementOnboarding.tsx
- Modify: src/styles/index.css

**Interfaces:**
- A lesson exposes one current task, one primary next action, a compact top progress indicator, and feedback that remains visible until continued.
- Input and selected-answer interactions support Enter without duplicate submission.
- Context questions show sentence, blank, hint, options, and feedback in separate visual layers.

- [ ] Remove the exact old headline and replace it with a short action-oriented A2 message.
- [ ] Make the Home primary card expose “当前目标 / 现在这一步 / 下一步” without adding noisy dashboard widgets.
- [ ] Keep mixed review in the Session queue and make the next action obvious after every answer.
- [ ] Add explicit correct/wrong context feedback and preserve focus across question changes.
- [ ] Keep all new controls keyboard and mobile accessible.

### Task 2: Add content import, audio cues, article review, and exam routes

**Owner:** frontend_worker

**Files:**
- Modify: src/features/reader/catalog.ts
- Modify: src/features/reader/state.ts
- Modify: src/components/Reader.tsx
- Modify: src/components/reader/ReaderLibrary.tsx
- Modify: src/components/reader/ReaderToolbar.tsx
- Modify: src/components/reader/ReaderCompletion.tsx
- Create: src/features/reader/importers.ts
- Create: src/features/reader/audioSync.ts
- Create: src/features/reader/reviewPack.ts
- Create: src/features/exams/routes.ts
- Create: src/components/reader/ReaderImportDialog.tsx
- Create: src/components/reader/ReaderAudioControls.tsx
- Create: src/components/reader/ArticleReviewPack.tsx
- Modify: src/styles/index.css

**Interfaces:**
- ReaderContent supports optional examId, audioUrl, and sentence cues while keeping existing content valid.
- importers expose safe parsing for plain text, HTML, SRT, and VTT; remote fetch is delegated to an optional server endpoint.
- audioSync exposes sentence selection from current playback time and progress from cue ranges.
- reviewPack creates a serializable article package containing contentId, saved word IDs, comprehension prompts, and completion metadata.
- exam routes include general, cet4, cet6, kaoyan, and ielts with user-facing labels and local A2/B1 starter content.

- [ ] Add a Reader import dialog for pasted URL, local text, SRT, and VTT; show a clear unsupported/CORS message rather than pretending arbitrary pages work.
- [ ] Add audio controls with play/pause, rate, current-sentence highlighting, cue-based progress, and a speech fallback only when no audio URL exists.
- [ ] Add article completion and article-specific review package entry; use general review only when no article package can be built.
- [ ] Add exam route selector and route metadata to Reader and Home without duplicating WordProgress.
- [ ] Keep content and review data local by default.

### Task 3: Add optional sync and import service

**Owner:** backend_worker

**Files:**
- Create: server/index.mjs
- Create: server/store.mjs
- Create: server/import.mjs
- Create: server/README.md
- Modify: package.json

**Interfaces:**
- GET /health returns a non-sensitive status.
- POST /api/import/text accepts a validated URL and returns normalized title/text/format metadata.
- POST /api/import/subtitles accepts SRT/VTT text and returns normalized sentence cues.
- GET /api/sync/state requires bearer authorization and returns the user’s stored state.
- PUT /api/sync/state requires bearer authorization, validates a versioned payload, and stores it atomically.
- DELETE /api/sync/state requires bearer authorization and deletes only the configured user namespace.

- [ ] Validate URL protocol, request timeout, maximum response bytes, content type, and HTML-to-text conversion.
- [ ] Parse SRT/VTT into cue objects with start/end milliseconds and sentence text.
- [ ] Require SYNC_TOKEN for sync routes; return a clear configuration error when absent.
- [ ] Store sync state in a configured data directory, never in source-controlled files.
- [ ] Add npm scripts for starting the optional service and document that deployment/authentication remains operator-owned.
- [ ] Do not fetch or proxy arbitrary video bytes; accept subtitle/transcript input only.

### Task 4: Add regression tests

**Owner:** test_worker

**Files:**
- Create: tests/learning/reader-import.node.ts
- Create: tests/learning/audio-sync.node.ts
- Create: tests/learning/review-pack.node.ts
- Create: tests/learning/exam-routes.node.ts
- Create: tests/server/import.node.mjs
- Create: tests/server/sync.node.mjs
- Modify: tests/learning/placement.node.ts

**Interfaces:**
- Test pure client functions and isolated server handlers with temporary directories.

- [ ] Test plain text, HTML, SRT, VTT parsing and malformed input rejection.
- [ ] Test sentence cue selection at 0, middle, end, and out-of-range playback times.
- [ ] Test article package creation, saved-word filtering, and empty-package fallback.
- [ ] Test all five exam routes and their labels/content metadata.
- [ ] Test sync authorization, version validation, atomic write/read, and namespace isolation.
- [ ] Run focused tests before implementation to capture RED, then run npm run verify after implementation.

### Task 5: Main-thread integration and release verification

**Owner:** main orchestrator

**Files:**
- No additional files unless a scoped review fix is needed.

- [ ] Review each worker’s actual diff and reject out-of-scope changes.
- [ ] Run npm run verify.
- [ ] Start the Vite app and optional service separately for browser smoke checks.
- [ ] Verify Home opens before placement, first formal learning still starts placement, and the old headline is absent.
- [ ] Verify Enter submit/continue, context feedback, Reader import dialog, Reader filters, audio fallback/cues, article review handoff, and exam route selection.
- [ ] Verify 390px layout has no horizontal overflow and focus remains visible.
- [ ] Verify optional sync is opt-in and fails closed without SYNC_TOKEN.
- [ ] Commit and push the final branch; verify local and remote commit IDs match.
