# Lexora Experience Refactor Design

## Goal

Turn the imported Lingo interface into a coherent Lexora product, provide a
lightweight Chinese/English experience, reduce perceived and measured click
latency, and split the largest feature files without changing the database
learning model.

## Scope

This refactor covers:

- Lexora branding in runtime UI, metadata, package metadata, repository docs,
  and Stripe product copy;
- Chinese (`zh-CN`) and English (`en`) UI strings for marketing, navigation,
  courses, learning, quests, leaderboard, shop, modals, and both Lesson modes;
- a persistent locale switch available in public and authenticated shells;
- a refreshed Lexora visual system using ink, teal, emerald, sky, and warm
  neutral surfaces while retaining the existing mascot and learning assets;
- Learn-page query consolidation and parallel vocabulary-attempt validation;
- explicit pending feedback for actions whose network round trips cannot be
  removed;
- decomposition of the vocabulary Lesson client and vocabulary query layer;
- browser QA, Web Interface Guidelines review, and a final five-axis local
  code review.

This refactor does not cover:

- locale-prefixed URLs;
- translation of user-authored or database-authored course content;
- localization of React Admin;
- Clerk-hosted component localization packages;
- FSRS, AI, full vocabulary import, Stripe setup, or new payment behavior.

## Product and visual direction

Lexora should feel like a focused study workspace rather than a literal
Duolingo copy. The interface keeps playful progress, Hearts, XP, and rounded
controls, but uses calmer surfaces and clearer information hierarchy:

- **Ink:** primary text and navigation structure;
- **Teal/Emerald:** brand, progress, success, and primary actions;
- **Sky:** active input and learning focus;
- **Amber/Rose:** warnings and mistakes;
- **Warm white/slate:** page and card surfaces.

The brand wordmark is `Lexora` everywhere. Existing mascot and learning SVGs
remain because new brand illustration is outside this scope.

## Localization architecture

Use a small internal localization layer instead of adding a dependency:

```text
lib/i18n/
  config.ts       locale types, validation, browser-language selection
  messages.ts     typed zh-CN and en dictionaries
  server.ts       request locale from lexora-locale cookie
  provider.tsx    client context, immediate switch, cookie persistence

components/locale-switcher.tsx
```

`zh-CN` is the product default. On a visitor's first client load, an English
browser may select `en`; after the user chooses a locale, the
`lexora-locale` cookie is authoritative. The switch updates client UI
immediately, writes the cookie, sets `document.documentElement.lang`, and
refreshes Server Components.

Messages use dot-separated keys and a typed dictionary. Missing keys fall back
to `zh-CN` rather than rendering an empty label. Brand names, code tokens, and
exercise answers are not translated.

## Performance architecture

### Learn page

The current Learn request queries nearly the same Unit/Lesson graph in
`getUnits`, `getCourseProgress`, and `getLessonPercentage`. Replace those three
independent reads with one cached `getLearningPath` query that returns:

```ts
type LearningPath = {
  units: NormalizedUnit[];
  activeLesson: ActiveLesson | undefined;
  activeLessonId: number | undefined;
  activeLessonPercentage: number;
};
```

Compatibility wrappers may remain temporarily for callers outside Learn, but
must delegate to the one cached result.

### Vocabulary Lesson route

Query the vocabulary Lesson directly and use non-empty `lessonWords` as the
mode signal. Only fall back to the legacy Lesson query when no vocabulary words
exist. This removes the separate mode round trip for vocabulary Lessons.

### Vocabulary attempt

Run independent reads for Lesson membership, user progress, and optional
example ownership concurrently. Keep the Neon batch transaction for writes.
The answer remains server-authoritative.

### Perceived latency

Every action button displays an explicit pending label and spinner, preserves a
visible focus state, and prevents duplicate submission only after the request
starts. Navigation continues to use real Links and prefetching.

## File decomposition

Split the current vocabulary Lesson client into:

```text
components/vocabulary-lesson/
  vocabulary-lesson.tsx          thin orchestration
  use-vocabulary-lesson.ts       state and action transitions
  vocabulary-completion.tsx     completion presentation
  vocabulary-footer.tsx         feedback and primary action
  exercise-stage.tsx             exercise-type composition
```

Move vocabulary-only database reads to `db/vocabulary-queries.ts`. Keep shared
course/user/subscription queries in `db/queries.ts`. Do not split the schema in
this change because its cross-table relations make that a separate migration
risk.

## Error handling

- Invalid locale values resolve to `zh-CN`.
- Missing translations use the Chinese message and emit no user-facing blank.
- Failed Server Actions preserve the current exercise and show a localized
  toast with a clear retry instruction.
- Missing Clerk or Stripe retains the existing safe preview/unavailable modes.
- Network latency shows a pending state rather than appearing as a dead click.

## Testing

- Unit tests for locale validation, browser-language selection, translation
  fallback, and learning-path normalization.
- Existing vocabulary domain and component tests remain green.
- Regression tests for concurrent attempt-read orchestration where practical.
- `pnpm format`, `pnpm test:run`, `pnpm lint`, `pnpm exec tsc --noEmit`, and
  `pnpm build` must pass.
- Authenticated Chrome QA covers marketing, Learn, Shop, and Vocabulary Lesson
  in both locales at desktop and 390 px width.
- Final review uses `code-review-and-quality` only on the commit range created
  by this refactor, not the full imported codebase.

## Success criteria

- No runtime UI or product metadata calls the product Lingo.
- Chinese and English can be switched without signing out.
- Core pages have no mixed-language controls in either locale.
- Warm authenticated navigation to Learn is materially faster than the recorded
  2851 ms baseline or eliminates duplicate Unit/Lesson database reads.
- Vocabulary submission validation uses one parallel read phase plus one atomic
  write phase.
- `vocabulary-lesson.tsx` is a thin composition file instead of a 379-line state
  owner.
- No Critical or Required finding remains after the local five-axis review.
