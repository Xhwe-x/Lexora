# Lexora 学习体验重构方案 v2.0

> 本文不是对原建议的简单润色，而是结合当前 Lexora 代码结构、现有交互问题、学习科学，以及 Duolingo / Quizlet / Busuu / LingQ / Anki 等产品的成熟做法后重新整理的产品与实现方案。
>
> 核心目标：把 Lexora 从“几个英语学习功能页面的集合”，重构为一个 **打开即可继续、学习不中断、题型会变化、错误会被重新处理、阅读与词汇能互相流动** 的本地优先英语学习系统。

---

## 0. 结论先行

Lexora 下一阶段不应该继续优先“增加页面和功能”，而应该先完成一件更重要的事：

```text
Dashboard / 功能入口集合
        ↓
今日学习任务
        ↓
连续学习 Session
        ↓
理解 → 识别 → 主动回忆 → 语境应用
        ↓
当前 Session 纠错
        ↓
长期 SRS 复习
        ↓
Reader / Vocabulary 再把新内容送回同一套系统
```

第一轮改版真正要解决的不是“页面够不够漂亮”，而是以下 6 个问题：

1. 用户打开网站后，不知道最应该先做什么。
2. 新词刚展示完就立即拼写，测到的更多是短时记忆。
3. 新词、复习、句子使用不同交互逻辑，学习被切成多个页面。
4. 答错后只进入长期复习，没有在当前 Session 内得到恰当纠正。
5. Reader、Vocabulary、Sentence 彼此独立，没有成为统一学习闭环。
6. 当前数据结构只记录“对/错/连续正确”，不足以支撑后续更合理的题型与调度。

因此，**P0 应优先重构学习状态和 Session，而不是先加更多功能。**

---

# 1. 当前项目真实状态审计

本次方案基于当前项目源码，而不是只根据截图判断。

当前核心文件：

```text
src/
├── App.tsx
├── components/
│   ├── DailyWords.tsx
│   ├── Review.tsx
│   ├── Sentences.tsx
│   ├── Reader.tsx
│   ├── WordCard.tsx
│   ├── Settings.tsx
│   └── Sidebar.tsx
├── features/words/
│   ├── scheduler.ts
│   ├── scheduler.test.ts
│   └── types.ts
└── styles/index.css
```

## 1.1 当前做得好的地方

这些部分建议保留：

- Vite + React + TypeScript，足够轻量。
- local-first，不强制账号、数据库、付费 API。
- 新词与到期复习已经分开。
- 每日新词计划会固定，不会刷新后随机换词。
- 已经有主动回忆意识，而不是只让用户翻卡片。
- 浏览器 Speech API 足够支持第一阶段发音与听力题。
- `scheduler.ts` 已经把部分学习逻辑放在 UI 外，方向正确。
- 已有 Vitest，可以继续坚持算法先测试。

这些基础意味着下一步 **不需要换技术栈，也不需要引入后端**。

---

## 1.2 当前必须修正的问题

### A. DailyWords：新词展示后立刻主动回忆

当前流程大致是：

```text
展示 ability + 中文 + 例句
        ↓
选择熟悉度
        ↓
立即隐藏 ability
        ↓
要求输入 ability
```

问题不是“主动回忆”本身，而是 **回忆发生得太近**。

用户刚看到完整答案，立刻输入成功，不足以证明已经形成可长期提取的记忆。

### B. 熟悉度目前只是记录，不是真正的自适应输入

当前：

```text
不认识 / 有点印象 / 认识
```

但后续无论选什么，都进入同一个 `recall`。

这使熟悉度变成额外点击，而不是有价值的信息。

### C. 答错后仍然直接进入下一个词

当前新词主动回忆答错以后：

```text
显示答案
↓
点击下一词
↓
该词被写入 learning
↓
约 10 分钟后长期复习
```

缺少当前学习 Session 内的纠错重现。

### D. Review 仍主要依赖自评

当前：

```text
看到问题
↓
脑内回答
↓
显示答案
↓
没回忆出来 / 回忆正确
```

这个模式可以作为一种复习方式，但不应该是唯一方式。

### E. Sentence 的判分模型不适合开放式翻译

当前只做标准化后的字符串完全匹配。

这会把合法表达判错。

但如果简单改成 token-level 宽松匹配，也可能反过来把语法错误、词序错误判成正确。

因此这里不能只“放宽字符串比较”，而应该重新设计题型。

### F. “听答案”会在提交前泄题

当前 Sentence 可以在答题前播放完整目标英文句子。

对中译英任务来说，这相当于直接提供答案。

### G. Reader 还没有形成学习闭环

当前 Reader：

```text
点击词
↓
显示词
↓
播放发音
```

尚未真正连接：

```text
Reader → Vocabulary → Daily Session → Review
```

### H. Mobile 导航存在标签消失风险

Desktop 缩窄时会隐藏 `.sidebar nav span`，而 Mobile 又复用了同一套导航结构。

在底部导航模式下应该明确恢复 label，而不是只留下图标。

### I. Settings 数字输入有典型受控 input 问题

`Number('') === 0`。

如果用户清空输入准备重新输入，父层马上 clamp，输入框会立刻被改回最小值。

### J. 品牌命名还不一致

当前代码仍大量使用：

```text
English Garden
english-garden:settings
english-garden:word-progress
```

如果 **Lexora 已经确定为正式产品名**，UI、页面 title、文档应该统一。

注意：localStorage key 不建议直接硬改，否则可能丢失现有学习记录。应做一次向后兼容迁移。

---

# 2. 从成熟产品中应该学什么，而不应该抄什么

本项目不需要复制任何一个产品完整形态，只借鉴其已经被验证的交互原则。

## 2.1 Duolingo：借鉴“下一步很明确”

值得借鉴：

- 首页/路径始终告诉用户下一步是什么。
- 复习不是一个完全独立的“旧内容页面”，而是重新嵌入学习路径。
- 课程中主动混合旧内容和新内容。
- 每次练习很短，可以快速开始。
- 正确、错误、完成都有明确反馈。

不建议复制：

- Hearts / 能量系统。
- 过强 XP 驱动。
- 为了 streak 制造焦虑。
- 与 Lexora 第一阶段无关的大量游戏化层。

Lexora 应该做到的是：

> **像 Duolingo 一样明确下一步，但比 Duolingo 更克制。**

---

## 2.2 Quizlet Learn：借鉴“同一内容，多种提取方式”

值得借鉴：

- 同一学习集使用多种题型。
- 根据熟悉程度调整练习。
- 写词、拼写、选择等模式共享同一学习目标。
- 判分严格度可以根据任务不同而变化。
- 错题可以要求重新输入正确答案。

Lexora 不需要复制“模式菜单”，而应该让题型自动进入同一个 Session。

---

## 2.3 Busuu：借鉴“词汇强度”而不是裸次数

值得借鉴：

```text
Weak
Medium
Strong
```

用户并不需要知道：

```text
correct = 7
wrong = 3
correctStreak = 2
```

用户需要知道的是：

```text
待学习
学习中
容易忘
较稳固
待复习
```

内部可以保留原始数据，但前端应该展示一个更有意义的“学习状态”。

---

## 2.4 LingQ：最值得 Lexora 借鉴的闭环

LingQ 最有价值的不是 Flashcard 本身，而是：

```text
阅读
↓
遇到未知词 / 短语
↓
保存
↓
之后在其他语境再次遇到
↓
必要时进入 SRS / Cloze / Dictation
```

Lexora 的 Reader 应成为 **词汇来源之一**，而不是独立小工具。

---

## 2.5 Anki / FSRS：借鉴调度纪律，不复制 UI

值得借鉴：

- 长期记忆需要独立的 SRS 调度。
- 当前 Session 的错误重试和长期 SRS 是两种不同机制。
- 学习步骤不应该在同一天无限重复。
- 复习强度存在“记住多少”和“每天工作量”的权衡。
- 更先进算法需要可靠复习历史，而不是只看累计对错。

因此：

> 第一阶段先把 **review event history** 记录正确，再考虑 FSRS。

不要为了“高级算法”过早增加复杂度。

---

# 3. Lexora v2 核心产品原则

## 原则 1：一个 Session 优先于六个功能入口

用户不应该每天思考：

```text
我先去复习？
还是新词？
还是句子？
还是阅读？
```

系统应该默认帮用户组织好。

首页只需要解决：

1. 今天主要要学什么？
2. 大约还要多久？
3. 点哪里继续？

---

## 原则 2：新词先理解，再逐步撤掉支架

新词第一次出现时，用户的任务不是证明会，而是建立表征。

建议采用：

```text
理解
↓
低难度识别
↓
主动回忆
↓
语境应用
```

但不要把它做成每个词都严格执行固定 4 步。

应允许调度器根据表现跳过或补充。

---

## 原则 3：初期适度集中，之后再交错

不要从第一秒开始把所有新词完全随机交错。

更适合的是 **micro-batch + interleave**：

```text
先介绍 2～3 个词
↓
在这几个词之间做识别
↓
再混入之前词的主动回忆
↓
最后和到期复习 / 句子题交错
```

这样兼顾：

- 新知识最初编码需要一定稳定性；
- 又避免“刚看完立刻背答案”。

---

## 原则 4：错误必须得到反馈，但不能无限惩罚

答错时：

```text
错
↓
立即看到纠正信息
↓
隔若干其他题再次出现
↓
再次失败则标记“需要重学”
↓
退出当前高频循环
↓
由后续 Session / SRS 接管
```

不要让一个难词在同一 Session 里出现 8～10 次。

建议：

- 当前 Session 额外 retry 1～2 次即可；
- 同一词连续失败后降低题型难度；
- 再失败就交给短期 SRS，而不是继续卡住用户。

---

## 原则 5：进度条必须单调前进

Retry Queue 会动态增加题目。

因此不要把进度直接定义成：

```text
已做题数 / 当前 queue.length
```

否则答错后 queue 变长，进度可能倒退。

推荐：

```text
核心任务完成度
=
到期复习核心项
+ 新词达到最低学习门槛
+ 当日语境强化任务
```

Retry 只影响学习结果，不增加主要进度分母。

这会让用户感受到：

> “答错只是多练一下，不是系统把终点往后拖。”

---

## 原则 6：题型用于测不同能力，不只是制造变化

不同题型应该有明确目的：

| 题型 | 主要测试 |
|---|---|
| 英→中选择 | 意义识别 |
| 中→英选择 | 词形识别 |
| 中→英输入 | 生产性词汇 |
| 听音选词 | 语音识别 |
| 听写 | 音形映射 |
| Cloze | 语境中的调用 |
| 句子重组 | 基本词序 / 结构 |
| 自评卡 | 只作为辅助，不作为唯一证据 |

---

# 4. 首页重构

## 4.1 首页只保留一个主入口

建议首屏：

```text
┌─────────────────────────────────────┐
│ Lexora                              │
│                                     │
│ 下午好                              │
│ 今天先完成这一组                    │
│                                     │
│ 复习 6 · 新词 8 · 约 8 分钟         │
│                                     │
│ ███████░░░  今日进度 7 / 12         │
│                                     │
│          [ 继续今日学习 ]           │
│                                     │
│ 容易忘：ability · improve · achieve │
└─────────────────────────────────────┘
```

如果尚未开始：

```text
[ 开始今日学习 ]
```

如果存在未完成 Session：

```text
[ 继续今日学习 ]
```

如果已完成：

```text
今日目标已完成
[ 自由复习 ]
```

---

## 4.2 首页不建议第一轮展示 Streak

原方案把 streak 放进首页示例，但又把 streak 放到 P2，这会造成范围矛盾。

第一轮建议删除。

等以后已经有：

- 每日完成历史；
- 跨天状态；
- 可靠的完成定义；

再引入 streak。

否则它只是一个视觉装饰数字。

---

## 4.3 首页统计不要做成 KPI Dashboard

不建议：

```text
3 个大卡
每个一个数字
```

建议变成一行 compact summary：

```text
复习 6     新词 8     约 8 分钟
```

用户最关心的是负担和下一步，而不是运营指标。

---

# 5. 统一 Daily Learning Session（P0 核心）

建议建立：

```text
LearnSession
```

它负责组织：

```text
Due Review
New Vocabulary
Retry
Cloze / Sentence Reinforcement
Listening
```

用户无需在不同页面之间反复跳转。

---

## 5.1 推荐 Session 结构

一个常规 Session：

```text
1. Warm-up
   2～4 个到期复习

2. New Word Micro Batch
   一次介绍 2～3 个新词

3. Recognition
   在 micro-batch 中穿插识别

4. Mixed Recall
   混入之前新词的主动回忆

5. Retry
   把刚才错误的词隔开后重新出现

6. Context
   用 Cloze / 听写 / 简短句子强化

7. Wrap-up
   显示今天完成情况和需要继续关注的词
```

这是默认结构，不是固定死顺序。

---

## 5.2 新词第一次出现

建议 UI：

```text
ability                         🔊
/əˈbɪləti/

能力；才能

Practice improves your ability to speak.
练习能提高你的口语能力。

[ 不太熟 ]                 [ 继续 ]
```

这里的核心任务是理解。

不要求立刻输入。

---

## 5.3 熟悉度按钮重新设计

### 推荐方案：只保留 2 个入口

```text
[ 不太熟 ]      [ 继续 ]
```

理由：

三档熟悉度会制造伪精确，而且当前没有必要让用户在每个词上思考太久。

### 如果未来保留 3 档，必须影响调度

```text
不熟悉
→ 保留识别题 + 主动回忆

有印象
→ 识别题可减少一次

很熟悉
→ 跳过额外教学，但必须通过一次主动验证
```

“我很熟悉”不能直接把词标成已掌握。

---

# 6. Session Queue：不要使用固定“第 2～4 道题”规则

原方案中的 retry queue 思路应该保留，但实现需要更通用。

建议：

```ts
SessionItem {
  wordId
  exerciseType
  source
  attempt
  earliestStep
  priority
}
```

其中：

```text
source:
new | due | retry | context
```

---

## 6.1 最低间隔而不是绝对位置

例如主动回忆：

```text
intro ability
↓
至少经过 2 个其他有效学习事件
↓
才允许 productive recall
```

错误重试：

```text
failed recall
↓
至少经过 2 个其他题
↓
retry eligible
```

但最后具体第几题出现，由 selector 决定。

这样未来才能根据：

- 用户是否连续答错；
- 当前 queue 长度；
- 是否有其他到期词；
- 上一题题型；
- 词的学习阶段；

动态调整。

---

## 6.2 Retry 上限

建议：

```text
第一次失败
→ corrective feedback
→ retry 1

retry 1 失败
→ 降低一级难度
→ retry 2

retry 2 仍失败
→ needsRelearn
→ 结束当前高频重试
→ 短期复习
```

避免“无限直到做对”。

---

# 7. 统一 Exercise 系统

建议组件：

```text
components/exercise/
├── ExerciseShell.tsx
├── IntroExercise.tsx
├── ChoiceExercise.tsx
├── TypingExercise.tsx
├── ListeningExercise.tsx
├── DictationExercise.tsx
├── ClozeExercise.tsx
├── SentenceOrderExercise.tsx
├── ExerciseFeedback.tsx
└── ExerciseProgress.tsx
```

所有题共享：

- 顶部进度；
- 提交方式；
- 键盘行为；
- 正确 / 错误反馈；
- 下一题动画；
- audio 控件；
- reduced-motion；
- session state。

---

# 8. 题型选择策略

不要只写：

```text
掌握阶段 → 某一种题型
```

更好的选择条件是：

```text
学习阶段
+ 最近表现
+ 上一次题型
+ 是否失败
+ 本次 Session 已出现次数
```

建议第一版规则：

| 状态 | 优先题型 |
|---|---|
| 刚介绍 | 英→中 / 中→英选择 |
| 识别正确 | 中→英 Typing |
| Typing 失败 | 展示纠正 → 稍后再 Typing 或降级选择 |
| 已学习、到期 | Typing / 听写 / Cloze 轮换 |
| 容易忘 | 识别 + Typing，减少复杂 Cloze |
| 较稳固 | Cloze / Dictation / 低频主动回忆 |

额外规则：

- 同一个词不要连续使用完全相同题型超过 2 次；
- 同一个 Session 不要对一个词过度重复；
- 生产性题型比识别题更有证据价值；
- 错误后先纠正，再重新提取，而不是只显示红色。

---

# 9. Feedback 系统

## 9.1 正确反馈

不要占满整屏。

推荐：

```text
✓ 正确
```

短暂高亮后继续。

如果用户输入有轻微拼写问题但可接受：

```text
基本正确
标准拼写：ability
```

---

## 9.2 错误反馈

需要告诉用户“哪里错”，而不是只告诉“错了”。

单词输入建议：

```text
你的答案：abilty
正确答案：ability
              ↑
缺少 i
```

第一阶段不一定需要复杂 diff library，简单字符差异即可。

---

## 9.3 反馈后再重试

错误发生后不建议立刻弹一个：

```text
再输入一次 ability
```

这更像机械抄写。

应该：

```text
反馈
↓
其他题
↓
重新提取
```

---

# 10. Sentence：重新定义任务，而不是只放宽判分

这是原建议需要明显修改的一部分。

## 10.1 不建议把开放式中译英作为 P1 主判分题型

例如：

```text
我每天通常晚饭后学习。
```

可能合法表达包括很多：

```text
I usually study after dinner every day.
I usually study after dinner.
Usually, I study after dinner.
Every day, I usually study after dinner.
```

如果只维护 `acceptedAnswers`：

- 数据维护成本高；
- 仍然无法覆盖全部合理表达。

如果做 token-level 宽松匹配：

- 可能接受词序错误；
- 可能接受语法错误；
- 对“表达正确”没有可靠语义判断。

---

## 10.2 P1 推荐改成“受控产出”

### Cloze

```text
I usually ____ after dinner.

[ study ]
```

### Sentence Order

```text
usually / I / after dinner / study
```

### Dictation

播放：

```text
I usually study after dinner.
```

用户输入完整句子。

### Keyword Guided Production

```text
关键词：usually / study / after dinner
```

这比完全开放翻译更容易给出可靠反馈。

---

## 10.3 如果仍保留开放翻译

建议判分优先级：

```text
1. exact normalized match
2. curated accepted answers
3. 轻微 typo 检测
4. 其余不直接判“错误表达”
```

UI 可以显示：

```text
与你的目标句不同
参考答案：...
```

而不是武断显示：

```text
错误
```

如果未来接入可选 AI，开放翻译才适合升级成语义与语法反馈。

---

# 11. “听答案”重构

提交前不播放完整答案。

按题型区分：

### 中译英 / Cloze

答题前：

```text
[ 听提示 ]
```

最多提供：

- 目标词音频；
- 首词；
- 一个关键词；
- 句型提示。

提交后：

```text
[ 听完整句子 ]
```

### Dictation

音频本身就是题目，因此允许完整播放，并提供：

```text
0.75× / 1×
重复播放
```

---

# 12. Review：从“自评页”并入 Exercise Engine

建议不要长期维护：

```text
DailyWords 一套题
Review 一套题
Sentences 又一套题
```

最终：

```text
LearnSession
   ↓
Exercise Engine
   ↓
根据 source = new / due / retry / context
决定题型和调度
```

Review 页面仍可以保留，作为：

```text
手动开始专项复习
```

但它启动的也应该是同一个 Session Engine。

---

# 13. 长期调度：Session Retry ≠ SRS

必须明确区分：

```text
Session Retry
```

和：

```text
Long-term SRS
```

## Session Retry 解决

> “我刚才没学会，今天还需要再尝试一次吗？”

## SRS 解决

> “这个词未来什么时候再出现，长期最合适？”

两者不能共用同一个 `nextReviewAt` 逻辑。

---

# 14. 第一阶段暂不急着直接上 FSRS

当前 `scheduler.ts` 使用固定间隔：

```text
10 分钟
1 天
3 天
7 天
14 天
30 天
```

它不够先进，但当前最大问题还不是这里。

更重要的是先记录完整 review history。

建议先新增：

```ts
type ReviewEvent = {
  id: string
  wordId: string
  at: string
  source: 'new' | 'due' | 'retry' | 'reader'
  exerciseType: ExerciseType
  result: 'fail' | 'pass'
  attempt: number
}
```

可选再记录：

```text
responseTimeMs
hintUsed
```

但不要让它影响 P0 进度。

当以后已有稳定历史，再考虑：

```text
ts-fsrs / FSRS
```

这样迁移会更可靠。

---

# 15. Word Progress 数据结构建议

现有：

```ts
status: 'new' | 'learning' | 'known'
correct
wrong
correctStreak
familiarity
nextReviewAt
lastReviewedAt
```

建议演进为：

```ts
type LearningStage =
  | 'unseen'
  | 'introduced'
  | 'learning'
  | 'stable'

type WordProgress = {
  stage: LearningStage
  correct: number
  wrong: number
  lapses: number
  lastSeenAt?: string
  lastReviewedAt?: string
  nextReviewAt?: string
  lastExerciseType?: ExerciseType
  recentFailures?: number
}
```

用户界面映射成：

```text
未学习
学习中
容易忘
较稳固
待复习
```

不要直接显示内部 streak 或计数。

---

# 16. Home 与 Session 的导航关系

建议一级导航最终为：

```text
今日
单词
阅读
复习
我的
```

### 为什么移除“句子训练”一级入口

句子应该是学习题型和专项训练，而不是每天都要用户自己选择的一级模块。

可以在：

```text
我的 / 更多 / 专项练习
```

中保留独立 Sentence Drill。

---

# 17. 沉浸式 Session UI

进入学习以后：

- 隐藏 Desktop Sidebar；
- 隐藏 Mobile Bottom Nav；
- 顶部只保留退出、进度、必要的 audio；
- 当前题占据主要视觉中心；
- Mobile 主操作按钮固定在安全区域上方。

示例：

```text
×                     3 / 12

██████████░░░░░░░░


            ability          🔊
          /əˈbɪləti/

              能力

Practice improves your ability to speak.


      [ 不太熟 ]      [ 继续 ]
```

题型切换后保持同一个 Shell，避免视觉跳跃。

---

# 18. Mobile Navigation

底部最多 5 个：

```text
今日
单词
阅读
复习
我的
```

每个必须：

```text
icon
label
```

不要只靠图标记忆。

建议 touch target：

```text
≥ 44 × 44 px
```

学习 Session 中底部导航完全隐藏。

---

# 19. Word Library 重构

Word Library 的定位应该是：

> “查看和管理学习状态”

而不是单纯展示漂亮卡片。

顶部：

```text
搜索：英文 / 中文 / 例句
```

筛选：

```text
全部
未学习
学习中
容易忘
待复习
较稳固
```

等级：

```text
A1 / A2 / B1
```

排序：

```text
最近学习
最需要复习
字母顺序
```

---

## 19.1 List 优先于大卡片 Grid

Desktop 大量词汇时，建议默认使用更紧凑的 list/table-like layout：

```text
ability     能力     A2     学习中     明天复习      🔊
achieve     达到     A2     容易忘     今天复习      🔊
```

点击后打开 Drawer：

- 音标；
- 完整释义；
- 例句；
- 学习阶段；
- 下次复习；
- 最近错误；
- 最近练习题型；
- 加入 / 移出今日专项复习。

Mobile 再使用 card/list hybrid。

---

# 20. Reader 重构

## 20.1 当前内置词库词

点击：

```text
ability
/əˈbɪləti/

n. 能力；才能

Practice improves your ability to speak.

🔊 发音
＋ 加入学习
```

如果已经在学习：

```text
学习中 · 明天复习
```

---

## 20.2 词库中不存在的词

这一点不要在 UI 上“假装已经有词典能力”。

第一阶段可以显示：

```text
当前本地词库尚未收录
```

之后 P1/P2 接入明确许可的本地词典数据。

只有具备：

- lemma；
- 释义；
- 最基本例句或上下文；

以后，才正式进入统一学习队列。

否则仅保存一个裸 token，很难产生高质量复习题。

---

## 20.3 Reader 的长期闭环

```text
Reader
↓
选词 / 选短语
↓
Vocabulary Inbox
↓
确认释义
↓
进入 Daily Session
↓
Review / SRS
↓
未来阅读再次遇到
↓
自动强化熟悉度
```

“再次在真实语境遇到”应该被视为有价值的 exposure，但不直接等价于主动回忆成功。

---

# 21. Settings 重构

第一阶段只保留真正需要用户控制的参数：

```text
每日新词数量
声音开关
复习方向偏好（如果仍保留）
减少动画（也遵从系统设置）
```

不要暴露大量算法参数。

---

## 21.1 数字输入修复

组件内部：

```ts
const [draft, setDraft] = useState(String(dailyCount))
```

输入时只更新字符串。

仅在：

```text
blur
Enter
保存
```

时：

```text
parse
validate
clamp
commit
```

如果输入非法：

- 恢复上一个合法值；
- 或显示轻量错误提示。

不要在用户每输入一个字符时强制 clamp。

---

# 22. 动画系统

Motion Token 可保留：

```css
--motion-fast: 120ms;
--motion-normal: 200ms;
--motion-slow: 320ms;
```

推荐：

| 场景 | 动画 |
|---|---|
| 下一题 | opacity + translateY 6–8px |
| 进度变化 | 250ms 左右 ease-out |
| 正确 | check scale 0.9 → 1 |
| 错误 | 很轻的 horizontal shake |
| Button press | scale 0.98 |
| Session 完成 | 一次短暂完成反馈 |

禁止：

- 常驻漂浮动画；
- 每道题撒花；
- 大面积背景不停运动；
- 错误动画过强。

---

# 23. 无障碍：原方案需要补强

原方案只提到 reduced motion，不够。

第一阶段建议同时完成：

## Keyboard

```text
Enter = 提交 / 下一题
1～4 = 选择题选项
Esc = 退出 Session（需二次确认）
```

## Focus

- 所有交互都有 `:focus-visible`；
- focus ring 不得被 outline:none 全局移除。

## Screen Reader

正确 / 错误反馈使用：

```text
aria-live="polite"
```

## Color

不能只用绿色 / 红色表达结果，必须同时有：

- icon；
- 文本。

## Touch

主要操作至少约 44px 高。

## Motion

继续支持：

```css
@media (prefers-reduced-motion: reduce) {
  /* 显著缩短或取消非必要 motion */
}
```

---

# 24. 视觉系统

## 24.1 字体

UI：

```text
Inter / system-ui / PingFang SC
```

学习英文内容：

```text
Literata / Georgia / Source Serif
```

原则保留：

> Serif 用于“正在学习的语言内容”，而不是所有页面标题。

---

## 24.2 卡片

减少：

```text
所有内容 = 白卡 + 1px 灰边
```

页面层级建议：

```text
Canvas Background
↓
Primary Surface
↓
Interactive Surface
↓
Feedback Surface
```

边框不是默认装饰，只在需要分组或可点击时使用。

---

## 24.3 色彩

建议 token：

```text
Brand
Text
Muted
Surface
Surface Elevated
Border Subtle
Success
Warning
Error
Focus
```

品牌绿可继续使用。

高饱和颜色只在：

- 答对；
- 错误；
- 完成；
- 重要提醒；

短暂出现。

---

# 25. 状态管理：建议从多个 useState 转向 Session Reducer

当前单个组件里的：

```text
index
phase
answer
result
revealed
```

随着题型增加会迅速变复杂。

P0 建议不用引入 XState，先使用 React `useReducer`。

例如：

```text
idle
↓
answering
↓
feedback
↓
transitioning
↓
completed
```

Session reducer 统一处理：

```text
START
ANSWER
SHOW_FEEDBACK
NEXT
EXIT
COMPLETE
```

好处：

- 不容易出现 impossible state；
- 更容易测试；
- 各 Exercise 组件更轻。

---

# 26. 推荐代码结构 v2

```text
src/
├── app/
│   └── App.tsx
│
├── components/
│   ├── exercise/
│   │   ├── ExerciseShell.tsx
│   │   ├── IntroExercise.tsx
│   │   ├── ChoiceExercise.tsx
│   │   ├── TypingExercise.tsx
│   │   ├── ListeningExercise.tsx
│   │   ├── DictationExercise.tsx
│   │   ├── ClozeExercise.tsx
│   │   ├── SentenceOrderExercise.tsx
│   │   ├── ExerciseFeedback.tsx
│   │   └── ExerciseProgress.tsx
│   │
│   ├── navigation/
│   │   ├── Sidebar.tsx
│   │   └── MobileBottomNav.tsx
│   │
│   └── vocabulary/
│       ├── WordList.tsx
│       ├── WordDrawer.tsx
│       └── WordPopover.tsx
│
├── pages/
│   ├── Home.tsx
│   ├── LearnSession.tsx
│   ├── Vocabulary.tsx
│   ├── Reader.tsx
│   ├── Review.tsx
│   └── Settings.tsx
│
├── learning/
│   ├── sessionQueue.ts
│   ├── exerciseSelector.ts
│   ├── grading.ts
│   ├── sessionReducer.ts
│   ├── scheduler.ts
│   └── types.ts
│
├── data/
│   └── words.ts
│
├── lib/
│   ├── storage.ts
│   └── speech.ts
│
└── styles/
    └── index.css
```

不需要一次全部移动。

先创建 `learning/` 新逻辑，再逐步迁移旧组件。

---

# 27. Storage 与数据迁移

如果品牌改成 Lexora，不要直接把：

```text
english-garden:word-progress
```

改掉后就不管。

建议增加 schema version：

```ts
{
  version: 2,
  data: ...
}
```

启动时：

```text
读取 v2
↓
没有则读取旧 English Garden key
↓
迁移
↓
写入 Lexora v2 key
↓
确认成功后保留旧数据一个版本周期
```

这样不会因为 UI 重构导致用户学习记录消失。

---

# 28. Session 恢复

P1 建议增加：

```text
activeSession
```

保存：

- Session id；
- 当前核心任务；
- queue；
- 已完成核心项；
- retry 状态。

用户刷新后：

```text
继续今日学习
```

而不是重新开始。

输入框里尚未提交的临时文本不必持久化。

---

# 29. Backlog Protection

随着词库扩大，某一天可能出现：

```text
到期复习 73
今日新词 20
```

如果系统机械地全部塞入，会造成负担爆炸。

建议 P1 增加：

```text
Review Backlog Protection
```

例如：

- 到期量正常：照常加入新词；
- 到期量明显过高：自动减少当天新词；
- 严重积压：默认“先恢复复习”，新词作为次级选项。

用户永远可以手动继续学新词，但默认应该保护长期记忆和完成感。

---

# 30. 不建议第一阶段加入的功能

为了避免再次变成“大而全 Dashboard”，以下内容暂时不要进入 P0：

- 社交排行榜；
- XP 商店；
- Hearts；
- 复杂徽章系统；
- AI 对话作为主流程；
- 后端账号；
- 云数据库；
- 复杂学习数据 Dashboard；
- 20 个可调算法参数；
- 全量词典在线 API 强依赖；
- 视频课程系统。

Lexora 第一阶段应该先成为一个 **非常顺滑的学习器**。

---

# 31. P0 / P1 / P2 新优先级

## P0-A：学习引擎基础

- [ ] 新建统一 `ExerciseType`
- [ ] 新建 `SessionItem`
- [ ] 新建 `sessionQueue.ts`
- [ ] 新建 `exerciseSelector.ts`
- [ ] 新建 `sessionReducer.ts`
- [ ] 新增 Session Retry
- [ ] 新增 retry 上限
- [ ] 新增长期 review event 记录
- [ ] 为 queue / selector / retry 写单元测试

## P0-B：LearnSession

- [ ] 新建统一 `ExerciseShell`
- [ ] 新词 Intro 不再立刻拼写
- [ ] 加入 Choice
- [ ] 加入 Typing
- [ ] Review 改为复用同一 Exercise 组件
- [ ] 错误 feedback + delayed retry
- [ ] 进度条改成核心任务进度，不随 retry 倒退
- [ ] 完成 Session summary

## P0-C：首页与导航

- [ ] 首页只保留一个主 CTA
- [ ] KPI 卡压缩
- [ ] 去掉首页学习机制说明
- [ ] Session 中隐藏 Sidebar / Bottom Nav
- [ ] Mobile Bottom Nav = icon + label
- [ ] 一级导航 ≤ 5
- [ ] Sentence 从主导航降级为专项练习

## P0-D：当前明确 bug / UX debt

- [ ] 熟悉度按钮不再使用“认识=主按钮”的暗示
- [ ] 如果熟悉度暂不影响调度，删除多档熟悉度
- [ ] Settings 数字输入使用 draft state
- [ ] “听答案”提交前不再泄题
- [ ] 品牌 UI 统一为 Lexora
- [ ] storage 做兼容迁移，不丢历史记录

---

## P1-A：题型丰富

- [ ] Dictation
- [ ] Cloze
- [ ] Sentence Order
- [ ] 题型轮换
- [ ] 根据近期失败调整难度
- [ ] Keyboard shortcuts
- [ ] 完整 a11y feedback

## P1-B：Vocabulary

- [ ] 搜索
- [ ] 状态筛选
- [ ] Level 筛选
- [ ] 按到期 / 掌握排序
- [ ] Word Drawer
- [ ] 最近错误 / 最近题型

## P1-C：Reader 闭环

- [ ] 点击本地词条显示释义
- [ ] 显示当前学习状态
- [ ] 加入学习
- [ ] Reader 来源进入统一 Session
- [ ] 为未收录词提供明确 fallback

## P1-D：连续性

- [ ] Active Session 恢复
- [ ] Backlog Protection
- [ ] 简单弱项列表
- [ ] Motion System

---

## P2

- [ ] FSRS / ts-fsrs 评估与迁移
- [ ] IndexedDB（review history 变大后）
- [ ] 有明确许可证的更大词典 / 词库
- [ ] Phrase 学习
- [ ] Streak
- [ ] Daily Goal
- [ ] 轻量成就
- [ ] 图片记忆
- [ ] 词根词缀
- [ ] 可选 AI 句子反馈
- [ ] 可选登录与云同步

---

# 32. 第一轮建议修改文件

第一轮不建议同时重构 Reader、Word Library、FSRS。

优先：

```text
src/App.tsx
src/components/DailyWords.tsx
src/components/Review.tsx
src/components/Sidebar.tsx
src/components/Settings.tsx
src/features/words/types.ts
src/features/words/scheduler.ts
src/features/words/scheduler.test.ts
src/styles/index.css
```

新增：

```text
src/learning/sessionQueue.ts
src/learning/sessionQueue.test.ts
src/learning/exerciseSelector.ts
src/learning/exerciseSelector.test.ts
src/learning/sessionReducer.ts
src/components/exercise/ExerciseShell.tsx
src/components/exercise/ChoiceExercise.tsx
src/components/exercise/TypingExercise.tsx
src/pages/LearnSession.tsx
```

等 P0 稳定后再迁移剩余组件。

---

# 33. 第一轮开发顺序

推荐严格按以下顺序：

```text
1. 定义状态与 Session 数据结构
↓
2. 先写 Queue / Retry 测试
↓
3. 实现纯函数调度
↓
4. 实现 ExerciseShell
↓
5. 把 DailyWords 迁移进去
↓
6. 把 Review 迁移进去
↓
7. 首页改成单 CTA
↓
8. Session 沉浸模式
↓
9. Mobile Nav 修复
↓
10. Settings / TTS 等明确 UX bug
↓
11. npm test
↓
12. npm run build
```

不要先重做整套 CSS，再来接学习逻辑。

先把状态流跑通，再做视觉 polish。

---

# 34. 必须新增的测试

## Session Queue

- [ ] 新词 Intro 后不会马上出现 productive recall
- [ ] productive recall 前至少经过指定最小事件间隔
- [ ] 错误会加入 retry
- [ ] retry 不会立即下一题再次出现
- [ ] retry 次数达到上限后不再无限加入
- [ ] retry 不增加主进度分母

## Exercise Selector

- [ ] 新词不会直接进入高难 Cloze
- [ ] 稳定词可以出现 Cloze / Dictation
- [ ] 错误后允许降级题型
- [ ] 避免连续完全相同题型

## Progress

- [ ] Retry 插入后进度不会倒退
- [ ] 错误不会被误判为掌握
- [ ] “很熟悉”本身不会直接标记 known

## Storage Migration

- [ ] 能读取旧 `english-garden:*` 数据
- [ ] 成功转换到新版 schema
- [ ] 旧用户不会失去 progress

---

# 35. 验收标准 v2

## 首页

- 用户进入 3 秒内能知道下一步。
- 首屏只有一个主 CTA。
- 不需要阅读“学习机制说明”才能开始。
- 如果已有未完成 Session，明确显示“继续”。

## 新词

- 新词第一次出现不立刻要求复述完整词形。
- 新词至少先经过一次理解阶段。
- 主动回忆与首次展示之间有其他学习事件。
- 熟悉度如果存在，必须改变后续流程。

## 错误

- 每次错误都提供纠正信息。
- 错误词会在当前 Session 再出现。
- 不会连续立即重复同一道题。
- 同一词不会无限 retry。

## 复习

- 不再完全依赖自评。
- 至少具备 Choice + Typing 两种客观题。
- 复习复用统一 Exercise Engine。

## Session

- Desktop 和 Mobile 学习时都没有主导航干扰。
- 主要进度单调递增。
- 用户可以退出。
- 退出后学习记录不会错误标记为全部完成。

## Mobile

- Bottom Nav 同时显示 icon + label。
- 一级入口不超过 5 个。
- 主操作 touch target 足够大。

## Sentence

- 提交前不会播放完整目标答案，除非题型本身是 Dictation。
- 不用简单 token overlap 直接判定开放翻译正确。

## Reader

- 点击已收录词可以看到释义与学习状态。
- 可以加入统一学习系统。
- 未收录词不会伪造释义或假装已进入完整学习闭环。

## Accessibility

- 可纯键盘完成主要学习流程。
- focus 可见。
- 正误不只依赖颜色。
- feedback 可被 screen reader 感知。
- 支持 reduced motion。

---

# 36. 产品指标：以后判断“改版有没有真的变好”

即使完全 local-first，也可以先在本地统计，不上传服务器。

建议指标：

```text
Session start → complete rate
平均 Session 时长
平均每个新词 retry 次数
首次主动回忆正确率
次日到期复习正确率
7 天后复习正确率（数据足够后）
Session 中途退出位置
提示使用率
各题型正确率
```

重点不是追求“答对率越高越好”。

如果用户永远 98% 正确，题目可能太简单；如果长期 50% 正确，负担又过高。

以后可根据数据调整难度，而不是凭感觉继续加功能。

---

# 37. 对原方案的最终处理结论

## 保留

- 首页任务化，而不是 Dashboard 化。
- 统一 Exercise 系统。
- Session Retry Queue。
- Session 隐藏 Sidebar。
- Mobile Bottom Navigation。
- Reader → Vocabulary → Review 闭环。
- Word Library 搜索 / 筛选 / 排序。
- Motion Token。
- Settings 输入修复。
- 降低卡片边框密度。
- 学习内容与 UI 字体分层。

## 修改

### “理解 → 隔 2～3 词 → 识别 → 回忆”

改成：

```text
micro-batch + minimum gap + adaptive selector
```

避免写死固定序列。

### “熟悉度三档”

第一阶段优先简化成二选一；若保留三档，必须影响题型。

### “答错隔 2～4 道再出现”

改成最小间隔 + retry priority，而不是硬编码数组位置。

### “Sentence token-level 宽松匹配”

不作为主要方案。

优先受控产出题型。

### “Streak 首页展示”

推迟到 P2，避免第一轮范围膨胀。

### “马上切 FSRS”

先建立 review event history，再评估切换。

---

# 38. 最终推荐的第一轮目标

第一轮完成以后，Lexora 应该从：

```text
首页
↓
今日新词页
↓
复习页
↓
句子页
↓
阅读页
```

变成：

```text
首页：
今天还有什么 → 一个按钮开始

↓

Learn Session：
复习 + 新词 + 回忆 + Retry + Context

↓

完成页：
今天完成了什么
哪些词还容易忘
下一次什么时候回来
```

同时：

```text
Word Library
Reader
Review
```

都逐步变成同一个学习系统的入口，而不再是互相独立的小产品。

这比继续加 5 个新功能，对 Lexora 的整体质量提升更大。

---

# 39. 参考产品与学习科学来源

本方案主要参考以下公开资料中的产品原则，不复制其具体视觉或受版权保护内容：

- Duolingo Blog：Spaced Repetition for Learning
- Duolingo Blog：The Science Behind the Home Screen / Learning Path Redesign
- Duolingo Blog：The Duolingo Teaching Method
- Quizlet Help Center：Studying with Learn
- Quizlet Help Center：Using Grading Options
- Busuu Support：Vocabulary Review / Weak-Medium-Strong word strength
- LingQ：Vocabulary Review / Reader Vocabulary / SRS activities
- Anki Manual：Deck Options / FSRS / Learning and Relearning Steps
- Karpicke & Blunt (2011)：Retrieval practice and long-term learning
- Kim & Webb (2022)：Meta-analysis of spaced practice in second-language learning
- Nakata 等关于 L2 vocabulary retrieval / spacing 的研究
- Hwang (2025)：初期 blocked practice 与后续 interleaving 的组合价值

---

# 40. 一句话版本

> **Lexora 下一步不要继续做“更多学习页面”，而要做“一条真正会教、会考、会纠错、会复习、还能从阅读里继续长出内容的学习路径”。**
