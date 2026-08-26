# Implementation Plan — V0.2

## Task 1 — Root Vite application

建立 `index.html`、`src/main.tsx`、`src/App.tsx`、Vite/TypeScript 配置，移除旧 `example-app/`。

## Task 2 — Word domain first

建立：

- `src/features/words/types.ts`
- `src/features/words/scheduler.ts`
- `src/features/words/scheduler.test.ts`
- `src/data/words.ts`

先把每日词数限制、按日期稳定选词、复习状态变化做成独立函数，再接 React。

## Task 3 — Daily Words UI

`DailyWords.tsx` 只负责展示当前学习词与上一词/下一词交互，不在组件中重复调度算法。

## Task 4 — Custom daily count

`Settings.tsx` 提供：

- 加减按钮；
- 数字输入；
- 常用数量快捷按钮。

设置通过 `storage.ts` 存储。

## Task 5 — Review direction

`Review.tsx` 使用统一的 WordProgress，支持 英→中 / 中→英；评分结果回到 `rateWord()`。

## Task 6 — Keep sentence / reader modules thin

句子和阅读保持轻量入口，暂不引入后端和 AI。

## Task 7 — Final verification

- TypeScript 源码检查；
- 调度函数 smoke test；
- 有依赖环境中执行 `npm run verify`；
- README / 修改建议 / manifest 与实际目录同步；
- ZIP 完整性检查。
