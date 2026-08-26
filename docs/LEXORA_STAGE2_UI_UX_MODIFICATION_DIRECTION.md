# Lexora 第二阶段 UI / UX 优化方向（Stage 2）

> 目标：在 P0 已经完成“今日学习主入口 + 统一 Learn Session + Retry Queue + 五项导航”的基础上，不继续堆功能，而是把 **学习反馈、语音反馈、阅读、复习、我的** 五个体验做成真正完整、统一、耐用的产品界面。
>
> 本文只定义 **修改方向、页面结构、交互规则、视觉规范、数据要求、优先级与验收标准**，暂不写实现代码。
>
> 设计关键词：**克制、沉浸、连续、可解释、有反馈、低打扰。**

---

# 0. 结论先行

Lexora 当前第一阶段已经解决了“能不能顺畅开始学习”的问题，第二阶段应该解决的是：

```text
现在：
能开始学习
↓
能得到正确 / 错误反馈
↓
能进入阅读 / 复习 / 我的

第二阶段：
反馈要有质量
↓
声音要有状态感
↓
阅读要真正沉浸并产生词汇
↓
复习要告诉用户为什么现在要练这些
↓
“我的”要让用户看见自己的长期成长
```

本轮最核心的 5 个目标：

1. **学习反馈不再只是红 / 绿提示块，而是成为“下一步学习动作”的一部分。**
2. **所有发音按钮拥有明确的播放状态与轻量动态反馈。**
3. **Reader 从“文本 + 点击发音的小工具”升级为真正的阅读工作区。**
4. **Review 从“一个开始复习按钮”升级为有优先级、有记忆状态、有空态引导的复习中心。**
5. **“我的”从 Settings 页面升级为成长主页，Settings 下沉为其中一部分。**

不建议本轮加入：

- XP 排行榜；
- Hearts / 体力；
- 大量徽章；
- 社交系统；
- 强制 streak 焦虑；
- 大面积角色动画；
- 为了“显得高级”加入复杂玻璃拟态；
- 无数据支撑却展示“记忆力 86%”一类伪精确指标。

Lexora 的方向仍然应该是：

> **比 Duolingo 更安静，比 Anki 更友好，比普通词卡网站更连续。**

---

# 1. 当前版本状态审计

本方案针对当前 P0 重构后的源码，而不是针对最初版本。

当前与本轮相关的主要文件：

```text
src/
├── pages/
│   ├── Home.tsx
│   └── LearnSession.tsx
│
├── components/
│   ├── Reader.tsx
│   ├── Review.tsx
│   ├── Settings.tsx
│   ├── Sidebar.tsx
│   ├── WordCard.tsx
│   └── exercise/
│       ├── ExerciseShell.tsx
│       ├── IntroExercise.tsx
│       ├── ChoiceExercise.tsx
│       └── TypingExercise.tsx
│
├── learning/
│   ├── sessionQueue.ts
│   ├── reviewHistory.ts
│   └── ...
│
├── lib/
│   ├── speech.ts
│   └── storage.ts
│
└── styles/
    └── index.css
```

P0 已经完成：

- 今日页单一主 CTA；
- Daily / Review 共用 Learn Session；
- Intro → Choice → Typing；
- Session Retry Queue；
- Retry 不改变主进度；
- Review Event History；
- Session 隐藏导航；
- 五项导航；
- reduced-motion；
- focus-visible；
- Settings 数字输入修复。

因此第二阶段不要再次推翻这些结构，而是在其上继续演进。

---

# 2. 竞品研究：真正应该借鉴什么

本轮主要参考：

- Duolingo
- Readlang
- LingQ
- Busuu
- Quizlet Learn

不是复制视觉皮肤，而是抽取已经被验证的产品原则。

---

## 2.1 Duolingo：反馈必须“马上有用”，而不是只说对错

值得借鉴：

- 正确 / 错误反馈在当前题结束后立即出现；
- 错误反馈能继续进入更深入解释；
- 用户可以选择是否查看 Explain，而不是强制阅读一大段说明；
- 练习入口有明确的目标，例如 Words、Mistakes、Listen、Speak；
- Tab 之间采用统一框架，但每个 Tab 仍有自己的目的与视觉身份。

对 Lexora 的启发：

```text
正确
不是：
绿色卡片 + 正确

而是：
状态确认 + 必要信息 + 继续
```

```text
错误
不是：
红色卡片 + 正确答案

而是：
哪里错了
+ 正确形式
+ 可选解释
+ 系统会如何再练
```

Duolingo 的设计经验也说明：

> 一致性要服务于用途，而不是为了“一样”让所有页面拥有完全相同的大卡片结构。

---

## 2.2 Readlang：Reader 第一原则是“不打扰阅读”

值得借鉴：

- 点击单词立即得到帮助；
- 主阅读区优先，工具退居侧边 / 浮层；
- 页面导航减少多余箭头和视觉噪音；
- 主按钮触控面积要足够大；
- 阅读进度本身可以成为导航入口；
- 可调字体、行高、列宽；
- 词义最好考虑上下文，而不是永远显示脱离句子的裸翻译；
- 保存词时保留完整上下文句子。

对 Lexora 的启发：

> Reader 不是词典页面，也不是 textarea 编辑器。它首先应该像一本舒服的数字书。

---

## 2.3 LingQ：阅读发现的词必须流回学习系统

值得借鉴：

- 阅读中点击词后形成学习状态；
- 新词 / 学习中 / 已知有视觉区分；
- 词汇不是一次查询后消失；
- Reader 可以直接进入 Review；
- 词汇复习支持不同活动；
- 再次在真实语境中看到一个词，本身就是有价值的 exposure。

不建议 Lexora 直接复制：

- 大面积把文章中所有词染成多种高饱和颜色；
- 过多状态按钮常驻正文；
- 复杂词典来源选择器。

Lexora 更适合：

```text
新词：默认正文
查询过：非常轻的底纹 / 下划线
加入学习：小型状态点 / 柔和强调
已掌握：恢复普通正文
```

让信息存在，但不破坏阅读。

---

## 2.4 Busuu：用户需要看到“记忆强度”，而不是底层算法

Busuu 将词汇抽象为：

```text
Weak
Medium
Strong
```

并优先让用户复习 Weak，再到 Medium / Strong。

对 Lexora 的启发不是照搬英文标签，而是：

```text
需加强
学习中
较稳定
```

用户没有必要看到：

```text
nextReviewAt = 2026...
streak = 2
wrong = 4
interval = ...
```

UI 应把算法压缩成能理解的“学习状态”。

重要：如果当前数据不足以可靠计算“较稳定”，就不要假装精确。

---

## 2.5 Quizlet Learn：复习不是“同一种题反复做”

值得借鉴：

- 根据学习状态改变题型；
- 多选、输入、拼写等共用一套学习路径；
- 题目会从更容易逐渐过渡到更困难；
- 可实时看到学习进度；
- 错误可以被重新处理。

这与 Lexora P0 的 Exercise Engine 方向完全一致。

因此 Review 页应该展示的是：

> **“今天系统建议你复习什么”**

而不是：

> “请选择一个复习模式，然后自己决定怎么学。”

---

# 3. 第二阶段统一视觉方向

当前 Lexora 的奶白 / 植物绿方向可以继续保留，不建议突然变成 Duolingo 式高饱和卡通风。

建议定义为：

## Quiet Learning UI

关键词：

- 温和；
- 有纸张 / 阅读感；
- 深绿是品牌色；
- 状态色只在反馈时出现；
- 大量留白；
- 英语学习内容比 UI 本身更突出；
- 动画有原因，不做装饰性持续运动。

---

## 3.1 页面层级统一，但不强求页面完全相同

所有普通一级页面统一：

```text
页面标题
一句目的说明
↓
页面自己的核心模块
↓
次级信息
```

但是：

```text
Reader ≠ Review ≠ 我的
```

Reader 应更像阅读器。
Review 应更像任务中心。
我的应更像成长仪表板。

---

## 3.2 卡片只保留 3 个层级

### Level A：Hero / Primary Task

用于：

- 今日学习；
- 今日复习；
- 学习计划。

建议：

```text
border-radius: 22–28px
padding: 28–36px
轻微背景渐变
非常弱的 shadow
```

### Level B：Section Card

用于：

- 学习状态分布；
- 周学习记录；
- 阅读词卡 Drawer 内容。

建议：

```text
border-radius: 16–20px
轻量 surface
不要所有卡都带边框 + 阴影
```

### Level C：Row / Inline Item

用于：

- 设置；
- 错词列表；
- 阅读生词列表；
- 最近学习记录。

优先 flat row，而不是再次套一层白色 card。

---

## 3.3 状态色建议

```text
Brand Green   #205F45   主操作
Success       柔和森林绿
Error         温和珊瑚红
Warning       暖琥珀
Learning      青灰 / 鼠尾草
Canvas        米灰
Surface       暖白
```

错误色不要使用大面积纯红。

目标：

> 错误需要清楚，但不能让用户产生“考试失败页”的感觉。

---

# 4. Learn Session：正确 / 错误反馈 UI 重构

这是本轮优先级最高的 UI 改进之一。

当前 `LearnSession.tsx` 在答题后会追加一个：

```text
.sessionFeedback
```

目前的问题是：

- 反馈区域和上面的题卡视觉关系不够完整；
- “正确 / 错误”之后信息组织比较平；
- 错误页没有明显突出“你的答案 vs 正确答案”；
- 反馈不像当前 Exercise 的自然下一步，更像额外插入的一张卡；
- Session 完成页信息也偏少。

---

## 4.1 改成 Feedback Dock，而不是第二张普通 Card

推荐桌面结构：

```text
┌────────────────────────────────────┐
│ 当前 Exercise                     │
│                                    │
│            ability                 │
│                                    │
│        [ 用户完成回答区域 ]        │
└────────────────────────────────────┘

        ↓ 160–220ms

┌────────────────────────────────────┐
│ ✓  回忆正确                        │
│                                    │
│ ability · 能力                     │
│                                    │
│                       [继续 →]      │
└────────────────────────────────────┘
```

错误：

```text
┌────────────────────────────────────┐
│ ×  这次差一点                      │
│                                    │
│ 你的答案        abilty             │
│ 正确答案        ability            │
│                       ↑            │
│                  少了一个 i         │
│                                    │
│ ↻ 本词稍后会再出现                 │
│                                    │
│ [为什么？]              [继续 →]   │
└────────────────────────────────────┘
```

视觉上它应该和 Exercise Card 形成一组，而不是两个等权卡片。

---

## 4.2 正确反馈：更轻、更快

正确时用户最需要的是：

```text
我答对了
↓
下一题
```

不要每次都让用户阅读大量说明。

推荐：

- 绿色只占反馈 Dock 的局部状态区；
- check icon 做一次 `scale .88 → 1`；
- 标题：`回忆正确` / `答对了`；
- 如为 Typing，可轻量显示标准拼写；
- 主按钮始终在固定位置；
- `Enter` 直接下一题。

如果答案只是允许的小拼写误差：

```text
基本正确
标准拼写：ability
```

此时颜色可用 Success + Warning 的中间状态，而不是错误红。

---

## 4.3 错误反馈：强调“纠正”，不是惩罚

错误页必须优先回答三个问题：

```text
1. 我刚才答了什么？
2. 正确答案是什么？
3. 接下来系统会怎么处理？
```

推荐信息权重：

### 第一层

```text
这次差一点
```

比：

```text
错误！
```

更符合 Lexora 的产品语气。

### 第二层

```text
你的答案
正确答案
```

用等宽或清晰英文 serif 做对照。

### 第三层

如果能可靠得到差异：

```text
abilty
abi·lity
```

或者单字符强调。

不要在第一阶段做复杂 NLP 错误解释。

### 第四层

```text
↻ 稍后会再次练到这个词
```

让用户理解错误没有“丢掉”，系统会处理。

---

## 4.4 “为什么？”作为可选二级展开

借鉴 Duolingo Explain My Answer 的交互原则，但第一阶段不要接 AI。

对词汇题：

```text
为什么？
↓
显示：
词性
中文义
当前例句
简单词形提示
```

例如：

```text
ability
n. 能力；才能

Practice improves your ability to speak.
```

不要默认展开，避免每道错题变成阅读页面。

---

## 4.5 Feedback Motion

正确：

```text
Dock: opacity 0 → 1
translateY: 6px → 0
180–220ms
Check: scale .88 → 1
```

错误：

```text
Dock: opacity 0 → 1
translateY: 6px → 0
200ms
错误答案区域：一次极轻 horizontal 2–3px shift
```

禁止：

- 整张页面剧烈 shake；
- 连续红色闪烁；
- 每答对一道题大量粒子动画；
- 影响点击下一题的长动画。

---

# 5. Session 完成页重构

当前完成页只告诉用户：

```text
这一组完成了
有 N 个词出现过错误
```

第二阶段应该把它变成一个非常轻量的学习总结。

---

## 5.1 推荐结构

```text
              ✓

        今天这一组完成了

      12 个核心练习 · 约 6 分钟

┌──────────┬──────────┬──────────┐
│ 9        │ 3        │ 2        │
│ 首次答对 │ 曾答错   │ 已重试   │
└──────────┴──────────┴──────────┘

需要再留意
ability · achieve · improve

          [返回今日]
        再练错词  →
```

注意：

- `返回今日` 仍然是唯一 Primary；
- `再练错词` 只在确实存在错词时显示为 Secondary / Text action；
- 不建议让“再练一次”成为默认 CTA，否则容易鼓励同日过度刷题。

---

## 5.2 完成动画

只允许一次短完成反馈：

```text
Icon reveal 300–450ms
数字 count-up 可选，最多 500ms
```

不建议：

- 3 秒 confetti；
- autoplay 音效；
- 强制等待动画结束。

---

# 6. 语音发音图标：加入真实播放状态动画

用户点击发音按钮以后，目前 UI 几乎没有状态反馈。

建议统一所有：

```text
IntroExercise
WordCard
Reader
未来 ListeningExercise
```

的声音按钮为同一个交互组件。

建议组件概念：

```text
SpeechButton
```

---

## 6.1 状态

必须至少有：

```text
idle
playing
error / unavailable
```

未来可以扩展：

```text
loading
paused
```

浏览器 SpeechSynthesis 当前不需要真正 loading。

---

## 6.2 Playing 动画：广播扩散

推荐效果正是用户提出的“扩张显示”，但需要克制。

```text
        ○       外圈 2
      ○   ○
        🔊       主按钮
      ○   ○
        ○       外圈 1
```

实际视觉：

- 圆形声音按钮本体保持稳定；
- 2 个同心 ring 从 `scale(.82)` 向 `scale(1.45)` 扩散；
- opacity 从 `.24 → 0`；
- 两个 ring 错开约 300ms；
- 只在真正开始播放后运行；
- 播放结束立即停止。

建议节奏：

```text
ring duration: 900–1100ms
loop while playing
button scale: 1 → 1.035 → 1
```

不要让整个图标不断弹跳。

---

## 6.3 动画必须跟真实 TTS 状态同步

当前 `speech.ts` 只调用：

```text
speechSynthesis.speak(...)
```

第二阶段需要让调用方知道：

```text
onStart
onEnd
onError
```

UI 动画不能：

```text
点击 → 固定播放动画 2 秒
```

因为不同单词播放时长不同。

正确逻辑：

```text
click
↓
SpeechSynthesisUtterance start
↓
isSpeaking = true
↓
广播 ring 开始
↓
end / error
↓
isSpeaking = false
↓
广播 ring 停止
```

---

## 6.4 重复点击

播放中再次点击：

推荐第一阶段：

```text
cancel 当前发音
↓
重新播放当前词
```

并重新启动 ring。

不要产生多个 SpeechSynthesisUtterance 排队。

---

## 6.5 Reduced Motion

用户系统开启减少动画时：

```text
不显示扩张 ring
```

替代为：

- button 背景轻微变深；
- speaker icon 状态颜色变化；
- 可使用静态 `playing` 标识。

---

# 7. Reader：从“轻量工具”升级为真正阅读器

这是本轮最大的页面级改造。

当前 Reader 的核心问题不是样式，而是结构：

```text
textarea
+
rendered text
+
右侧只显示 selected word + 发音
```

这让页面同时在承担：

- 编辑器；
- 阅读器；
- 词卡。

三个角色互相抢注意力。

---

# 8. Reader 推荐信息架构

推荐把 Reader 分为两种状态：

```text
A. 阅读模式（默认）
B. 编辑 / 导入文本（次级动作）
```

不要永久同时展示 textarea。

---

## 8.1 Desktop 推荐布局

```text
┌─────────────────────────────────────────────────────────┐
│ 阅读                                                     │
│ A short story · 32%                Aa   ↕   编辑文本      │
├───────────────────────────────────────┬─────────────────┤
│                                       │                 │
│       Reading Canvas                  │ Word Inspector  │
│                                       │                 │
│  Practice improves your ability      │ ability         │
│  to speak. Learning a language...     │ /əˈbɪləti/       │
│                                       │ n. 能力；才能   │
│                                       │                 │
│  [正常连续正文]                       │ 🔊  +加入学习   │
│                                       │                 │
│                                       │ 当前上下文      │
│                                       │ Practice...     │
│                                       │                 │
└───────────────────────────────────────┴─────────────────┘
│                    32%                                 → │
└─────────────────────────────────────────────────────────┘
```

---

## 8.2 Reader 顶栏

不继续使用普通页面的大标题 + 大段描述。

进入 Reader 后顶部更像工具栏：

```text
← / 阅读
文章标题
32%
Aa
更多
```

如果仍然只支持用户粘贴文本：

标题可显示：

```text
我的阅读
```

并允许用户重命名以后再做。

---

## 8.3 编辑文本入口

当前 textarea 改成：

```text
编辑文本
```

点击后：

Desktop：

```text
Modal / Side Sheet
```

Mobile：

```text
Full-screen editor
```

编辑完成：

```text
保存并阅读
```

这样用户开始阅读以后，不会一直看到一个巨大的输入框。

---

# 9. Reader 主阅读区

## 9.1 阅读宽度

Desktop 最舒服的正文列宽建议：

```text
620–760px
```

不要无限铺满宽屏。

---

## 9.2 Typography

英语正文：

```text
Literata / Georgia / Source Serif / serif fallback
19–21px desktop
18–20px mobile
line-height 1.8–1.95
```

UI：

```text
Inter / system-ui
```

正文与 UI 字体必须明显分层。

---

## 9.3 阅读设置

点击 `Aa` 打开轻量 Popover：

```text
字号       −  20  +
行距       紧凑 / 舒适 / 宽松
正文宽度   窄 / 标准 / 宽
字体       Serif / Sans
```

P1 再增加：

```text
Dark reader mode
```

不要第一阶段加入 15 个字体。

---

# 10. Reader 单词点击交互

当前点击只做：

```text
selected = part
```

应该升级为一个完整但轻量的 Word Inspector。

---

## 10.1 Desktop：Sticky Inspector

用户点击：

```text
ability
```

正文中：

- 当前词得到轻背景；
- 右侧 Inspector 内容更新；
- 页面不跳动；
- focus 正确移动但不抢阅读位置。

Inspector：

```text
ABILITY

ability                     🔊
/əˈbɪləti/

n. 能力；才能

Practice improves your ability to speak.

[ + 加入学习 ]

学习状态
未加入
```

如果已经学习：

```text
学习中 · 下次复习 明天
```

---

## 10.2 Mobile：Bottom Sheet

手机不要压缩成：

```text
正文
↓
整个右栏
```

点击词后用 Bottom Sheet：

```text
┌────────────────────┐
│ ─                  │
│ ability        🔊   │
│ /əˈbɪləti/          │
│ 能力；才能          │
│                    │
│ 当前句子            │
│ Practice...        │
│                    │
│ [加入学习]          │
└────────────────────┘
```

Sheet 初始高度 45–55vh。
可拖动关闭。

---

## 10.3 点击同一个词再次播放？

不要。

点击正文词 = 选词 / 查词。

播放必须显式点击 🔊。

避免用户只是想查词时突然出声。

---

# 11. Reader 词汇状态视觉

不建议模仿 LingQ 大面积蓝 / 黄铺满全文。

Lexora 使用更克制状态：

```text
未查询
普通正文

当前选中
极浅绿色背景 + 4px radius

已经加入学习
浅色 underline / 小圆点

本篇多次查询
可保留浅米色底纹

已掌握
普通正文
```

状态不能损害阅读流畅性。

---

# 12. Reader → Vocabulary 闭环

这是 Reader 是否真正有价值的关键。

目标流：

```text
Reader
↓
点击词
↓
查看释义与上下文
↓
加入学习
↓
Vocabulary Inbox
↓
Daily Session
↓
Review
```

加入学习成功以后，不要弹 Toast：

```text
已加入！🎉🎉🎉
```

建议按钮原位变成：

```text
✓ 已加入学习
```

持续 600–1000ms 后显示状态：

```text
学习中
```

减少打断。

---

# 13. Reader 阅读进度

第一阶段建议记录：

```text
文本 ID / hash
最后阅读位置
阅读百分比
本篇已加入词数量
```

底部可以显示：

```text
←             32%              →
```

短文本无需真正分页时：

可以使用 scroll progress，但不要做一直追着滚动的巨大进度条。

推荐：

```text
细线 progress + percentage
```

点击 percentage 可以未来扩展：

```text
回到开头
回到上次位置
```

---

# 14. Reader 空态

用户没有文本时不要只给一个 textarea。

推荐：

```text
          📖

      开始一段英语阅读

粘贴一篇你真正想读的英文。
Lexora 会帮你在阅读时处理生词，
但不会打断你的阅读。

       [粘贴 / 编辑文本]

示例文章：A Small Habit
```

可以内置 2–3 篇短示例文章。

不要接大型内容库作为本轮前置条件。

---

# 15. Review：从空白入口升级为复习中心

当前 Review 页：

```text
标题
↓
N 个单词已经到期
↓
开始复习
```

学习逻辑是对的，但页面信息密度太低。

第二阶段 Review 页要回答：

```text
1. 我现在最该复习什么？
2. 为什么是这些？
3. 我的词总体处于什么状态？
4. 如果没有到期内容，我还能做什么？
```

---

# 16. Review 推荐页面结构

```text
复习
让快要忘记的内容及时回来。

┌──────────────────────────────────┐
│ TODAY REVIEW                     │
│                                  │
│ 12 个词现在值得复习              │
│ 约 5 分钟                         │
│                                  │
│ 8 个到期 · 4 个最近易错          │
│                                  │
│                 [开始复习 →]     │
└──────────────────────────────────┘

记忆状态
需加强  12  ███████
学习中  36  █████████████
较稳定  54  █████████████████

专项复习
[最近错词]   [阅读生词]   [听力]*

最近复习
今天     12 次
昨天     18 次
周一      9 次
```

`听力` 没实现前不要显示为可用按钮。

---

# 17. Review Hero：仍然只有一个主 CTA

借鉴 Duolingo Practice / Busuu Review，但保持 Lexora 的“单主任务”原则。

Hero 内容：

```text
12 个词现在值得复习
```

比：

```text
DUE NOW
```

更自然。

副信息：

```text
约 5 分钟
8 个到期
4 个最近易错
```

Primary：

```text
开始复习
```

不要同时放：

```text
开始复习
复习弱词
复习全部
随机复习
立即测试
```

造成选择负担。

---

# 18. Review 记忆状态

建议显示：

```text
需加强
学习中
较稳定
```

不要直接把累计 `wrong` 数量当 strength。

建议未来由以下证据综合：

```text
recent pass / fail
最近复习时间
连续成功
题型难度
是否主动回忆成功
```

第一版如果算法还没升级，可以保守映射：

```text
近期失败 / retry 较多 → 需加强
learning               → 学习中
known + 近期成功        → 较稳定
```

并避免显示伪精确百分比。

推荐：

```text
需加强  12 个
```

而不是：

```text
记忆强度 42.817%
```

---

# 19. Review 专项入口

推荐只保留真正有数据和学习意义的入口。

### 最近错词

条件：

```text
最近 ReviewEvent 中存在 fail
```

显示：

```text
最近错词
7 个
```

### 阅读生词

Reader 与 Vocabulary 打通以后显示：

```text
阅读生词
5 个待巩固
```

### 听力

只有 ListeningExercise 真正上线以后才显示。

不要用 disabled 卡片长期占位。

---

# 20. Review 空态必须有下一步

当前：

```text
当前没有到期复习
下一批到期后会自动出现
```

方向正确，但用户会遇到“然后呢？”

推荐：

```text
            ✓

       今天没有到期复习

说明你的复习队列现在很干净。
不需要为了完成数字继续刷旧词。

[去阅读一会儿]

或者
看看最近学过的词 →
```

Primary 可以根据业务判断：

```text
去阅读一会儿
```

这样 Review 空态能自然导向 Reader。

---

# 21. “我的”：从 Settings 升级为成长主页

当前导航名已经叫：

```text
我的
```

但页面本质仍是 Settings。

这是体验上明显不一致的地方。

用户点“我的”通常期待看到：

```text
我的学习
我的进步
我的计划
我的设置
```

而不是直接看到：

```text
每日新词数量
重置记录
```

因此本轮建议正式拆分概念：

```text
My / Profile Page
└── Settings Section
```

---

# 22. 我的页面推荐结构

```text
┌─────────────────────────────────────┐
│  J                                  │
│  我的学习                           │
│  Learning locally with Lexora       │
│                                     │
│  🔥 7 天   ✓ 86 已学习   ↻ 142 复习 │
└─────────────────────────────────────┘

本周
一  二  三  四  五  六  日
●   ●   ●   ○   ●   ●   ●

学习计划
每天 8 个新词 · 约 10 分钟
[调整计划]

词汇成长
未学习        120
学习中         46
较稳定         38

最近里程碑
连续学习 7 天
完成 100 次主动回忆

设置
声音                         开
减少动画                     跟随系统
每日新词                     8
数据与隐私                     →
```

---

# 23. 我的顶部身份区

Lexora 当前没有账号系统，不要假装存在云端 Profile。

推荐显示：

```text
圆形字母头像：L / 用户自定义首字母
我的学习
本地学习者
```

不要显示：

```text
Username: User123456
```

也不要强制用户创建昵称。

可以未来提供：

```text
编辑显示名称
```

作为纯本地偏好。

---

# 24. 我的核心统计：只显示有学习意义的数字

推荐：

```text
连续学习天数
已学习词数
累计有效复习
本周学习天数
```

不建议：

```text
XP
Level 42
Global Rank
Coins
```

除非未来产品真的决定走游戏化路线。

---

# 25. 周学习记录

推荐使用非常轻的 7-day consistency strip：

```text
一  二  三  四  五  六  日
●   ●   ○   ●   ●   ●   ○
```

比大型 GitHub heatmap 更适合第一阶段。

点击某天可选显示：

```text
8 个新词
12 次复习
6 分钟
```

但是当前数据模型还没有完整 Daily History。

因此实现这块之前必须先新增真实记录：

```text
LearningDayRecord
```

不能用“今天是否完成”推测过去 7 天。

---

# 26. Streak：有，但不要制造焦虑

可以借鉴 Duolingo / Busuu 的“连续学习”概念，但不要复制其强运营化压力。

推荐文案：

```text
连续学习 7 天
```

断掉以后：

```text
这周已经学习 4 天
```

而不是：

```text
你的 52 天连续记录毁了！
```

Lexora 应强调：

> 一次中断不会抹掉长期进步。

---

# 27. 学习计划：借鉴 Busuu，但保持轻量

“我的”中增加：

```text
学习计划
每日 8 个新词
约 10 分钟
```

可以调整：

```text
每日新词数量
```

P1 再考虑：

```text
期望学习日
提醒时间
每天计划分钟
```

当前 local-first Web 不应承诺可靠系统通知，除非后续做 Notifications 权限和 service worker。

---

# 28. 我的成就：只做“里程碑”，不做收集游戏

可以有：

```text
第一次完成 Learn Session
连续学习 7 天
完成 100 次主动回忆
累计学习 100 个词
完成 10 次阅读
```

设计成非常轻的：

```text
Milestone row
```

而不是 40 个彩色 badge 填满页面。

例如：

```text
✦ 100 次主动回忆
  8 月 23 日达成
```

---

# 29. Settings 下沉

当前 Settings 页面保留的逻辑可以继续用，但改成“我的”中的设置 section。

结构：

```text
设置
────────────────
每日新词                8       >
声音                    开      >
动画                    跟随系统 >
阅读偏好                        >
数据与隐私                      >
```

不要继续把：

```text
每日新词数量
重置本地记录
```

放成两个同等级的大白卡。

---

# 30. 数据与隐私页

Lexora local-first 其实是一个优势，应该明确表达。

推荐：

```text
数据与隐私

你的学习数据目前只保存在这个浏览器。
Lexora 不会自动上传到服务器。

[导出学习数据]
[导入学习数据]

危险操作
重置所有记录
```

`重置所有记录` 不要长期暴露在“我的”主页面显眼位置。

未来导出 / 导入 JSON 是非常值得做的小功能。

---

# 31. 三大板块之间必须互相连通

第二阶段不应让 Reader、Review、我的各自漂亮但互相孤立。

推荐闭环：

```text
今日
↓
Learn Session
↓
错误进入 Review History
↓
Review 显示“最近易错”
↓
我的显示本周练习 / 成长
```

以及：

```text
Reader
↓
加入学习
↓
Vocabulary
↓
Daily / Review
↓
我的增加阅读 / 词汇成长记录
```

空态之间也要相互导流：

```text
Review 没有到期
→ 去阅读

Reader 暂无文本
→ 使用示例阅读

我的本周 0 天
→ 开始今日学习
```

---

# 32. 全局 Motion System v2

当前已有：

```css
--motion-fast: 120ms;
--motion-normal: 200ms;
--motion-slow: 320ms;
```

继续保留。

建议增加语义，而不是继续加很多时长：

```text
press
feedback
enter
expand
speechPulse
```

映射：

```text
press        80–120ms
feedback     180–220ms
page enter   200–260ms
sheet        240–320ms
speech ring  900–1100ms loop only while playing
```

---

# 33. 页面切换动画

普通一级页面：

```text
opacity 0 → 1
translateY 4px → 0
160–200ms
```

不要做：

```text
整个 Reader 从右边滑入 600px
```

Bottom Sheet 是唯一适合明显 translateY 的主要组件。

---

# 34. Hover / Press

Desktop hover：

```text
background / border / icon color
```

不要所有 card hover 都：

```text
translateY(-8px)
shadow 巨大增加
```

学习工具不是电商商品卡。

Press：

```text
scale(.98)
```

可继续保留。

---

# 35. Accessibility

第二阶段动画更多，所以无障碍要求必须同步加强。

### SpeechButton

- `aria-label="播放 ability 发音"`
- playing 时可以更新为：`正在播放 ability 发音`
- 不依赖 ring 作为唯一状态反馈。

### Feedback

- `role="status"`
- `aria-live="polite"`
- 正确 / 错误颜色以外必须有 icon + 文本。

### Bottom Sheet

- 打开时 focus 进入 sheet；
- Esc 关闭；
- 关闭后 focus 返回刚刚点击的单词。

### Reader word button

正文里的词不要因为 button 默认样式破坏排版。

Keyboard：

```text
Tab 选词
Enter 打开词卡
Esc 关闭 Inspector / Sheet
```

### Reduced Motion

Speech ring、反馈 shake、页面 enter 都必须被降低 / 移除。

---

# 36. Mobile 优化方向

第二阶段三个页面必须首先按 390px 宽度检查。

---

## 36.1 Reader Mobile

- Bottom Nav 保持；
- 阅读正文不被底部导航遮挡；
- word inspector 使用 Bottom Sheet；
- 阅读工具 `Aa` 放顶部；
- textarea editor 单独 full-screen；
- 正文左右 padding 18–22px；
- 词点击 hit target 不强制 44px 高，否则会破坏排版；通过行高与 inline padding 提升可点击性。

---

## 36.2 Review Mobile

Hero 单列：

```text
到期数量
时间
来源
按钮 100%
```

状态分布不要做三列很窄的小卡。

用：

```text
需加强      12   █████
学习中      36   █████████
较稳定      54   ███████████
```

---

## 36.3 My Mobile

统计区：

Desktop 可以 3–4 列。

Mobile：

```text
2 × 2
```

或者一行横向 scroll，但第一阶段更推荐 2 × 2。

设置使用 list rows。

---

# 37. 数据模型需求（设计层）

第二阶段想把 UI 做好，不能只改 CSS。

需要增加最少量、真实的数据模型。

---

## 37.1 SessionResult Summary

为了完成页展示：

```text
首次答对
曾答错
retry 次数
```

需要 Session 内形成结果摘要，而不是只保留 `wrongWords: Set`。

概念：

```text
SessionWordResult
- wordId
- coreAttempts
- retryAttempts
- hadError
- finalState
```

---

## 37.2 Speech State

`speech.ts` 需要从：

```text
fire-and-forget
```

变成：

```text
可反馈 start / end / error
```

但仍保持纯浏览器 API。

---

## 37.3 Reader State

至少需要：

```text
ReaderDocument
- id
- text
- updatedAt
- scroll / progress

ReaderWordInteraction
- token / lemma
- contextSentence
- lookedUpAt
- savedToVocabulary
```

第一阶段不需要复杂文章数据库。

---

## 37.4 Learning Day History

“我的”如果展示：

```text
连续学习
本周
学习天数
```

必须记录：

```text
LearningDayRecord
- date
- coreExercises
- reviewEvents
- learnedWords
- minutes?（如有可靠计时）
```

如果没有真实计时，不要显示“学习 13.4 小时”。

---

# 38. 预计文件级修改范围（后续真正实施时）

本 MD 不实施代码，但后续大概率涉及：

```text
src/pages/LearnSession.tsx
src/components/exercise/ExerciseShell.tsx
src/components/exercise/IntroExercise.tsx
src/components/WordCard.tsx
src/components/Reader.tsx
src/components/Review.tsx
src/components/Settings.tsx
src/components/Sidebar.tsx
src/lib/speech.ts
src/learning/reviewHistory.ts
src/lib/storage.ts
src/styles/index.css
```

建议新增：

```text
src/components/audio/SpeechButton.tsx
src/components/feedback/ExerciseFeedback.tsx
src/components/reader/ReaderToolbar.tsx
src/components/reader/WordInspector.tsx
src/components/reader/ReaderSettingsPopover.tsx
src/pages/My.tsx
src/components/profile/WeeklyActivity.tsx
src/components/profile/LearningPlanCard.tsx
```

是否真的拆这么多文件，要在实施时根据当前组件大小决定，不应为了目录漂亮而过度拆分。

---

# 39. 第二阶段推荐开发优先级

建议不要一次性并行改四个页面。

---

## P0.5-A：反馈 + SpeechButton

优先完成：

- [ ] 正确 / 错误 Feedback Dock
- [ ] 错误答案对照
- [ ] 可选“为什么”展开
- [ ] Session Summary 改版
- [ ] SpeechButton 统一组件
- [ ] speech start / end 状态
- [ ] 广播 ring 动画
- [ ] reduced-motion fallback

原因：

这是用户每次学习都会反复看到的最高频体验。

---

## P1-A：Reader 体验重构

- [ ] textarea 从默认阅读界面移除
- [ ] Reader Toolbar
- [ ] Reading Canvas
- [ ] Word Inspector
- [ ] Mobile Bottom Sheet
- [ ] 当前词状态样式
- [ ] 阅读设置 Aa
- [ ] 加入学习状态反馈
- [ ] 阅读进度 / 恢复位置

随后再做：

- [ ] Reader → Vocabulary 真闭环

---

## P1-B：Review Center

- [ ] Today Review Hero
- [ ] Review 来源拆分
- [ ] 记忆状态分布
- [ ] 最近错词入口
- [ ] Reader 生词入口
- [ ] Review 空态导向 Reader
- [ ] 最近复习摘要

---

## P1-C：My / Profile

- [ ] 新建 My 页面
- [ ] 学习统计
- [ ] Weekly Activity
- [ ] 学习计划
- [ ] 词汇成长
- [ ] Settings 下沉
- [ ] 数据与隐私

---

## P2

后续才考虑：

- [ ] phrase selection
- [ ] context-aware dictionary provider
- [ ] 同步音频文本高亮
- [ ] ListeningExercise
- [ ] Dictation
- [ ] Cloze
- [ ] 导出 / 导入完整学习数据
- [ ] 更长期 activity calendar
- [ ] AI Explain（必须可选）

---

# 40. 验收标准

---

## Feedback

- 正确后 1 秒内用户知道自己答对并能继续；
- 错误后不用阅读大段文本即可看到“我的答案 / 正确答案”；
- 错误反馈明确告诉用户该词稍后会重新出现；
- Feedback 不导致主页面布局剧烈跳动；
- Enter 可以继续；
- 颜色不是唯一状态表达方式。

---

## SpeechButton

- 点击后只有当前按钮显示 playing；
- 动画在声音真正 start 后开始；
- 声音 end / error 后停止；
- 连续点击不会堆积多个语音；
- reduced-motion 下没有扩张 ring；
- Intro / WordCard / Reader 视觉与逻辑一致。

---

## Reader

- 用户进入 Reader 首屏看到的是阅读内容，而不是 textarea；
- 用户点击词后 300ms 内能得到明确词卡反馈；
- Desktop 查词不遮挡正文；
- Mobile 使用 Bottom Sheet；
- 点击词不会自动发音；
- 用户可以一键把有效词汇加入学习；
- 加入学习后当前按钮原位反馈，而不是打断式弹窗；
- 字号 / 行距 / 阅读宽度可调；
- 阅读位置可恢复。

---

## Review

- 首屏只有一个主要复习 CTA；
- 用户能理解为什么现在有 N 个词值得复习；
- 复习状态不暴露底层算法参数；
- 没有到期词时页面仍给出有意义的下一步；
- 最近错词和阅读生词不会和 Today Review 争抢主视觉。

---

## 我的

- “我的”不再等同于 Settings；
- 首屏能看到真实学习进度；
- 每个统计都能从实际数据推导；
- 不展示虚假分钟数 / 百分比；
- Settings 和危险操作降低视觉权重；
- 用户能够理解数据当前是 local-first。

---

# 41. 明确不建议采用的设计

以下看起来“更丰富”，但不建议：

### 1. 每个页面都放 4 个 KPI 白色卡片

会重新变回 Dashboard。

### 2. Reader 全文大量彩色高亮

会破坏阅读本身。

### 3. Review 首页摆 8 种练习模式

会让用户重新承担“我该学什么”的决策。

### 4. 我的页面堆 XP、等级、金币、排行榜

Lexora 当前产品价值不在竞技。

### 5. 每次答对都撒花

高频反馈应快速、轻量。

### 6. 错误时巨大红色界面 + 强 shake

让学习变成惩罚。

### 7. Speech 图标永远 pulse

只有播放时才能动画。

### 8. 没有真实数据却展示高级分析

例如：

```text
记忆效率 93%
英语能力 +7.5%
脑科学学习指数 86
```

全部不建议。

---

# 42. 推荐的最终产品气质

第二阶段完成后，Lexora 不应该让用户感觉：

```text
“这里又多了几个漂亮页面。”
```

而应该感觉：

```text
今天页告诉我该学什么；
学习页专心让我完成它；
答错后我知道哪里错；
发音按钮真的像在播放；
阅读时工具不会打断我；
阅读里的词会回到学习；
复习页知道我最该复习什么；
我的页面让我看见自己真的在变强。
```

这才是第二阶段真正的“UI 优化”。

---

# 43. 推荐实施顺序

```text
1. Feedback UI
↓
2. Stateful SpeechButton
↓
3. Session Summary
↓
4. Reader 阅读模式重构
↓
5. Reader Word Inspector
↓
6. Reader → Vocabulary
↓
7. Review Center
↓
8. LearningDayHistory
↓
9. My / Profile
↓
10. Settings 下沉
↓
11. 全站 Responsive QA
↓
12. Accessibility QA
↓
13. Motion / reduced-motion QA
```

不要先做“我的统计图”，再回头补数据；数据记录必须先于统计 UI。

---

# 44. 竞品资料与研究依据

## Duolingo

- Core tabs redesign：统一视觉系统，同时强调 consistency 需要服从页面 purpose；简化需要兼顾 clarity。
- Practice Tab：把 Words / Mistakes / Listen / Speak 等专项复习组织在明确的练习入口下。
- Explain My Answer：答题以后提供可选的更深入解释，而不是默认强制展开。
- Streak / Achievements：长期进步可见，但 Lexora 只借鉴“成长反馈”，不复制强游戏化。

## Readlang

- Click-to-translate 是阅读时的即时辅助。
- 阅读界面明确追求 distraction-free。
- 通过减少多余箭头、扩大真正重要按钮 hit-area 降低界面噪音。
- 支持字体、行距、列宽与翻译行为等阅读设置。
- 保存词汇时保留上下文。

## LingQ

- Reader 是核心体验。
- 点击词形成可持续的 vocabulary state。
- 新词 / 学习中 / 已知状态会跨文章持续。
- Reader 与 Review / Vocabulary 直接相连。
- Review 支持多种活动。

## Busuu

- Vocabulary Review 将词汇呈现为 Weak / Medium / Strong，而不是暴露复杂调度参数。
- 系统优先推荐较弱词汇。
- Study Plan 将目标、学习频率、每日时间集中在一个可理解的计划中。

## Quizlet Learn

- 根据熟悉程度形成个性化路径。
- Multiple Choice → Written 等题型逐渐增强难度。
- 同一学习内容使用多种题型。
- 学习进度可见。

## Web Platform

- Web Speech API 的 SpeechSynthesisUtterance 提供 start / end 等事件，可以让声音按钮动画与真正播放状态同步。
- `prefers-reduced-motion` 应继续作为所有非必要动态效果的约束。

---

# 45. 本轮设计决策一句话总结

> **保留 P0 已经建立的学习引擎；第二阶段不靠堆更多功能，而是让反馈更有用、声音更有生命感、阅读更沉浸、复习更聪明、“我的”更能体现长期成长。**

---

# 46. 参考链接（官方 / 原始资料优先）

- Duolingo — Core Tabs Redesign: https://blog.duolingo.com/core-tabs-redesign/
- Duolingo — Practice Tab: https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- Duolingo — Explain My Answer: https://blog.duolingo.com/explain-my-answer-now-free/
- Duolingo — Achievement Badges: https://blog.duolingo.com/achievement-badges/
- Duolingo — Streak Design: https://blog.duolingo.com/streak-milestone-design-animation/
- Readlang — Learn by Reading: https://readlang.com/
- Readlang — Reading Interface Improvements: https://blog.readlang.com/2023/07/04/reader-improvements.html
- Readlang — Context-aware translations & synchronized transcription: https://blog.readlang.com/2024/12/04/context-aware-translations-and-two-other-features.html
- LingQ — Vocabulary Review: https://www.lingq.com/blog/reviewing-vocabulary/
- LingQ — iOS Reader Support: https://www.lingq.com/en/ios-app-support/
- Busuu — Vocabulary Review: https://help.busuu.com/hc/en-us/articles/16911730266513-What-is-Vocabulary-Review
- Busuu — Review specific words: https://help.busuu.com/hc/en-gb/articles/16941530623249-How-do-I-review-specific-words-in-Vocabulary-Review
- Busuu — Study Plan: https://help.busuu.com/hc/en-us/articles/16097312171153-What-s-a-Study-Plan-How-do-I-make-one
- Quizlet — Learn: https://quizlet.com/features/learn
- Quizlet — Studying with Learn: https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn
- MDN — SpeechSynthesisUtterance start event: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/start_event
- MDN — prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion
