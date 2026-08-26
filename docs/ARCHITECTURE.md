# Lexora 架构说明

## 目标

Lexora 第一阶段是一个 local-first 的连续英语学习器：打开即可开始，学习过程中不需要在“新词 / 复习 / 句子”等多个功能页之间频繁切换。

## 当前主数据流

```text
App / localStorage
      │
      ├── Home ──> LearnSession <── Review launcher
      │                │
      │                ├── IntroExercise
      │                ├── ChoiceExercise
      │                └── TypingExercise
      │                │
      │                ├── Session Queue / Retry
      │                ├── WordProgress / scheduler.ts
      │                └── Review Event History
      │
      ├── Vocabulary
      ├── Reader
      └── Settings
```

## 两层调度

### Session Queue

解决“刚才没学会，当前这一组是否需要再提取一次”。

- 新词使用 micro-batch：Intro → Choice → Typing；
- 错误先显示纠正信息；
- retry 设置最低间隔，在有其他题时不立即重复；
- 每个词当前 Session 最多额外 retry 2 次；
- retry 不增加核心进度分母。

### Long-term SRS

解决“未来什么时候再看到这个词”。当前继续由 `features/words/scheduler.ts` 维护 `nextReviewAt`，与 Session Retry 分离。

## 状态所有权

`App.tsx` 继续作为 P0 的持久化边界：

- `WordProgress`；
- daily plan；
- daily completion；
- review history；
- settings。

复杂 Session 状态暂时留在 `LearnSession` 内部。Active Session 刷新恢复属于 P1，不在本轮引入全局状态库。

## LocalStorage 迁移

新版 key 使用 `lexora:*`。首次启动时若新版不存在，则读取旧 `english-garden:*` 并写入新版 key，旧 key 暂不删除。

## 技术原则

1. 学习调度尽量保持纯函数，并有无浏览器依赖的 domain tests。
2. React 组件负责交互与呈现，不在组件里重复 SRS 规则。
3. 保持 local-first，无后端、账号、付费 API 强依赖。
4. P0 不引入 XState、Redux、FSRS 或大型 UI 框架。
5. Reader / Vocabulary 之后接入时仍进入同一 Session / Review Event 体系。
