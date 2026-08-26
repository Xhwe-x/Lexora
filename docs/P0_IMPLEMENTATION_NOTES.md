# Lexora P0 Implementation Notes

Implemented on 2026-08-26 from `LEXORA_UI_UX_REFACTOR_V2.md`.

## Included

- Single-CTA Today home.
- Shared immersive `LearnSession` for Daily and Review.
- New-word micro-batch order: Intro → Choice → Typing.
- Delayed Session Retry with a per-word total budget of 2 retries.
- Retry-independent monotonic core progress.
- Review Event History.
- `english-garden:*` → `lexora:*` localStorage compatibility migration.
- Five-item labeled navigation and hidden navigation inside sessions.
- Settings draft numeric input fix.
- Sentence pre-submit audio no longer reveals the full target sentence.
- Focus-visible, reduced-motion and mobile touch-target improvements.

## Verification in this workspace

- `npm run test:domain`: 12 tests passed.
- `node node_modules/typescript/bin/tsc -b`: passed.
- `npm test` and the Vite stage of `npm run build` cannot start with the uploaded `node_modules`, because those dependencies were copied from another platform and do not contain `@rollup/rollup-linux-x64-gnu`; esbuild also reports that only the Windows binary is present.

The delivery ZIP intentionally excludes `node_modules`. Run `npm install` after extracting on the target machine, then run `npm run verify`.
