# Lexora Stage 2 Implementation Notes

Implemented from `LEXORA_STAGE2_UI_UX_MODIFICATION_DIRECTION.md` on 2026-08-26.

## Implemented

- Feedback Dock with correct/wrong hierarchy, answer comparison, light spelling-difference hint, optional “为什么？” explanation, retry promise, Enter-to-continue and reduced-motion behavior.
- Session completion summary backed by real in-session results: core attempts, first-pass correct attempts, words with errors, retry attempts, weak-word list, optional secondary wrong-word practice.
- Shared `SpeechButton` used by IntroExercise, WordCard and Reader. Broadcast rings start on real SpeechSynthesis `start` and stop on `end` / `error`; repeated clicks restart current speech.
- Reader defaults to reading mode instead of textarea, with toolbar, Aa reading preferences, secondary full editor, persisted document/progress, desktop sticky inspector and mobile bottom sheet with drag-to-close.
- Reader local dictionary uses only the existing Lexora word dataset. Unknown tokens explicitly report that the local dictionary has no entry.
- Reader words can be added to learning; saved local words are prioritized into the current/next daily plan, then can flow into later Review after they have actual learning progress.
- Review Center with one primary review CTA, due + unresolved recent-error sources, conservative memory buckets, recent-error / reader-word focus entries only when data exists, real recent review counts, and a Reader-directed empty state.
- My/Profile page replacing Settings-as-profile: local learner identity, real learned/review/week/streak statistics, 7-day activity strip, light learning plan, vocabulary growth, real milestone rows and lower-weight Settings / Data & Privacy.
- Real `LearningDayRecord`, `SessionWordResult`, Reader document/interactions, and review-insight data models.
- Page-enter, feedback, sheet, press and speech motion semantics with `prefers-reduced-motion` fallbacks.
- Mobile layouts for Feedback, Reader, Review and My follow the Stage 2 390px direction.

## Intentionally not implemented (Stage 2 MD marks these as later/P2)

- AI Explain
- external/context-aware dictionary provider
- phrase selection
- ListeningExercise / Dictation / Cloze
- dark Reader mode
- data export/import
- long-term activity calendar
- account/cloud profile, XP, coins, ranks or fake learning analytics

## Verification

- `npm run test:domain`: 16/16 tests pass.
- `tsc -b`: passes.
- `npm test` and the Vite stage of `npm run build` cannot start from the uploaded cross-platform `node_modules` because `@rollup/rollup-linux-x64-gnu` is absent. The delivery archive excludes `node_modules`; run `npm install` on the target machine before `npm run verify`.
