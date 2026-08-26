# Lexora File Manifest — Stage 2

## 应用入口
- `src/App.tsx` — 页面状态、持久化、Daily/Review Session、Reader→Daily 闭环、真实学习历史
- `src/styles/index.css` — Quiet Learning UI、Feedback/Speech/Reader/Review/My、移动端与 reduced-motion

## Learn Session
- `src/pages/LearnSession.tsx` — 统一 Session、真实 Session Summary、错词二级加练
- `src/components/feedback/ExerciseFeedback.tsx` — Feedback Dock、答案对照、为什么、retry 说明
- `src/components/exercise/*` — Intro / Choice / Typing / Shell
- `src/learning/sessionResults.ts` — SessionWordResult 与总结指标

## Speech
- `src/components/audio/SpeechButton.tsx` — idle / playing / error 与广播扩散动画
- `src/lib/speech.ts` — SpeechSynthesis start/end/error 生命周期与全局 cancel/restart

## Reader
- `src/components/Reader.tsx` — Reading Canvas、Toolbar、Aa、Editor、Inspector、Mobile Bottom Sheet
- `src/features/reader/state.ts` — ReaderDocument、ReaderWordInteraction、上下文与进度助手

## Review
- `src/components/Review.tsx` — Review Center、唯一主 CTA、记忆状态、专项入口、最近复习、空态导流
- `src/learning/reviewInsights.ts` — 保守的需加强 / 学习中 / 较稳定映射
- `src/learning/reviewHistory.ts` — Review Event History

## My / Profile
- `src/pages/My.tsx` — 本地学习者、真实统计、周活动、学习计划、词汇成长、里程碑
- `src/components/Settings.tsx` — 下沉后的设置与数据隐私/危险操作
- `src/learning/learningHistory.ts` — LearningDayRecord、周活动与非惩罚性 streak

## 词汇 / 调度
- `src/data/words.ts`
- `src/features/words/types.ts`
- `src/features/words/scheduler.ts`
- `src/components/WordCard.tsx`

## 导航
- `src/components/Sidebar.tsx` — 今日 / 单词 / 阅读 / 复习 / 我的

## 测试
- `tests/learning/*.node.ts` — 无 Vite 依赖的领域测试（Stage 2 当前 16 项）
- `src/features/words/scheduler.test.ts` — 原 Vitest 调度测试

## 文档
- `docs/LEXORA_STAGE2_UI_UX_MODIFICATION_DIRECTION.md`
- `docs/STAGE2_IMPLEMENTATION_PLAN.md`
- `docs/STAGE2_IMPLEMENTATION_NOTES.md`
- `docs/LEXORA_UI_UX_REFACTOR_V2.md`
