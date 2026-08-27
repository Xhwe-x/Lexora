# Lexora UI System 与学习/阅读体验优化 V3

> 版本：Draft v3.0
> 基准用户：A2 英语学习者
> 方向：简洁、清晰、有新意的学习工具界面
> 关联文档：docs/LEXORA_A2_LEARNING_AND_READER_UX_OPTIMIZATION.md

## 1. 改版目标

本次改版同时解决产品流程和视觉问题：

1. 用户进入网站后先看到首页，不再被测评页面拦截；
2. 第一次正式学习时才进入 A2 起点测评；
3. 语境理解题改成题型、句子、选项、确认四层结构；
4. 输入题、选择题和测评支持 Enter；
5. 中文释义增加词性、常见义项、搭配和语境；
6. Reader 从单篇文本工具升级为内容入口；
7. 小组件摆脱“AI 生成模板感”，形成 Lexora 自己的组件系统；
8. 所有页面使用同一套视觉令牌、状态规则和响应式行为。

## 2. 组件研究后的取舍

### shadcn/ui

借鉴“组件源代码属于项目自己”的方式：组件放在本地，能够按 Lexora 的内容和交互需求修改，不安装一套无法摆脱的固定皮肤。[shadcn/ui](https://ui.shadcn.com/)

### Magic UI

借鉴“动画组件建立在已有设计系统之上”的方式。动效只用于学习完成、进度变化和阅读播放，不把光效铺到每张题卡。[Magic UI](https://magicui.design/)

### Aceternity UI

借鉴页面焦点和微交互的控制方式，只在空状态、完成页或品牌区域使用一处视觉记忆点，不使用发光边框、粒子和持续漂移装饰学习过程。[Aceternity UI](https://ui.aceternity.com/)

### Naive UI

不直接引入，因为 Lexora 是 React 项目而 Naive UI 是 Vue 组件库。借鉴它的主题令牌、控件状态、表单密度和完整交互边界。[Naive UI](https://github.com/tusen-ai/naive-ui)

## 3. Lexora 新视觉系统

### 3.1 配色

主色不再只有单一绿色，使用三种有明确语义的颜色：

| 语义 | 颜色 | 使用场景 |
|---|---|---|
| Ink | 深墨绿 | 文字、主按钮、主路径 |
| Tide | 青蓝色 | Reader、阅读进度、内容入口 |
| Amber | 琥珀色 | 考试路径、提醒、需要注意 |
| Canvas | 暖灰白 | 页面背景 |

建议令牌：

~~~css
:root {
  --page: #f3f5f2;
  --surface: #ffffff;
  --surface-muted: #f8faf8;
  --ink: #19352c;
  --ink-muted: #6f7d76;
  --line: #dce5df;
  --line-strong: #c6d4ca;
  --primary: #1d624d;
  --primary-hover: #164f3d;
  --tide: #176b78;
  --tide-soft: #e4f2f3;
  --amber: #a76a16;
  --amber-soft: #f8eedc;
  --danger: #985148;
  --danger-soft: #f8e9e5;
  --focus: #278a86;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-soft: 0 8px 24px rgba(25, 53, 44, .045);
}
~~~

### 3.2 组件视觉

- 页面背景使用平面暖灰白，不使用整页渐变；
- 卡片圆角集中在 8、12、16px；
- 默认使用细边框，只有浮层和主任务使用轻阴影；
- 主按钮使用实色，次按钮使用白底边框；
- 标签使用小尺寸色块，不使用一整排胶囊；
- 标题使用清晰的内容层级，减少大号装饰文字；
- 视觉重点由颜色和间距产生，而不是由光晕产生；
- 保留米白基调，但用青蓝 Reader 和琥珀 Exam 建立识别度。

## 4. 首次进入与第一次学习

### 4.1 首页不再被测评拦截

没有 placement profile 时仍然显示首页：

~~~text
今天先做什么？
开始第一组 A2 学习

第一次正式学习时，Lexora 会用几分钟了解你的起点。
~~~

用户可以浏览今日、单词、阅读、复习和我的。

### 4.2 测评进入 Session

用户第一次点击开始学习后：

1. 打开学习 Session；
2. 在 Session 内进入 A2 起点测评；
3. 完成 24 题；
4. 显示简短学习起点；
5. 自动继续刚才的学习动作；
6. 保存 profile，不清除已有学习、阅读和复习数据。

已有旧数据但没有 profile 时，使用：

~~~text
这是一次新的学习起点测评。
你之前的学习记录会保留，测评只用于安排之后的内容。
~~~

### 4.3 测评不应成为独立的营销页

测评界面应复用学习 Session 的结构：

- 顶部进度；
- 中央题卡；
- 底部操作；
- 清晰的键盘提示；
- 同一套按钮、输入框、选项和反馈组件。

测评和正式学习可以有不同的 eyebrow 文案，但不能像两个完全不同的网站。

## 5. 语境理解题重构

### 5.1 新布局

~~~text
┌──────────────────────────────────────┐
│ 语境理解                              │
│ 选择最适合当前句子的表达                │
│                                      │
│  I want to ______ my English.        │
│                                      │
│  语境提示：希望让英语变得更好。         │
│                                      │
│  A  improve          B  invite        │
│  C  explain          D  repeat        │
│                                      │
│  确认答案 · Enter                      │
└──────────────────────────────────────┘
~~~

信息顺序固定为：

1. 题型标签；
2. 简短任务；
3. 大号英文句子；
4. 明确空缺；
5. 中文语境提示；
6. 选项；
7. 确认按钮。

等级、轨道和详细词典信息放到辅助区域，不挤占题目中心。

### 5.2 交互状态

- 点击选项只表示选择，不自动跳题；
- 选项支持默认、悬停、聚焦、选中、正确、错误和禁用；
- 提交后锁定选项；
- 正确反馈展示完整句子和中文解释；
- 错误反馈展示用户选项、正确选项、错误原因和重练提示；
- 提交后按 Enter 等同于点击继续。

## 6. Enter 与焦点

统一规则：

~~~text
输入有内容 + 未提交 + Enter → 提交
输入为空 + Enter → 不提交
已选择选项 + Enter → 提交
已提交 + Enter → 继续
~~~

实现要求：

- 提交函数防止重复调用；
- 输入题桌面端自动聚焦，移动端不强制唤起键盘；
- 提交后焦点进入继续按钮；
- 下一题出现后焦点进入第一个可操作控件；
- 弹窗、词卡和编辑器支持 Escape；
- 关闭 Reader 词卡后焦点回到触发词。

按钮文案统一为：

- 确认答案 · Enter
- 检查答案 · Enter
- 继续 · Enter
- 查看结果

## 7. A2 中文释义和词条内容

当前单一中文字符串逐步扩展为：

~~~ts
type WordMeaning = {
  text: string
  partOfSpeech?: string
  usageNote?: string
}

type WordContent = {
  primaryMeaning: string
  meanings?: WordMeaning[]
  collocations?: string[]
  dailyExample?: string
  dailyExampleZh?: string
  examExample?: string
  examExampleZh?: string
}
~~~

单词卡默认显示：

~~~text
improve
提高；改善
动词

常见用法：improve + 名词
Reading can improve your vocabulary.
阅读可以提高你的词汇量。
~~~

中文 → 英文题显示：

~~~text
请写出英文：

阅读可以提高你的词汇量。
这里表达的是“让某种能力变得更好”。
目标词性：动词
~~~

多义词使用“本题义项 + 其他常见义项”的分层，不在答题前暴露完整英文答案。

## 8. Reader 重新设计

### 8.1 Reader 首页

Reader 改为三层：

~~~text
阅读

继续阅读
The Small Habit
A2 · 日常英语 · 还剩 6 分钟

推荐给你
[A2 日常对话] [A2 工作邮件] [A2 短故事]

筛选
A2 · 日常 · 5～10 分钟
~~~

筛选项：

- 难度：A1、A2、B1；
- 方向：日常、考试、共享；
- 主题：生活、工作、旅行、学习、观点；
- 时长：5 分钟内、5～10 分钟、10 分钟以上；
- 类型：短文、对话、邮件、故事、新闻、音频文本。

### 8.2 文章详情

文章开始前显示：

~~~text
介绍自己与表达观点
A2 · 日常英语 · 约 8 分钟

你将练习：
表达观点、同意和不同意

预计遇到：
4 个新词 · 2 个重点表达

开始阅读
~~~

不在开始前显示整页词表。

### 8.3 Reading Canvas

桌面端：

- 顶部显示标题、难度、方向、进度和播放；
- 中央显示正文；
- 右侧固定 Word Inspector；
- 点击单词或短语后显示当前语境、中文义项、发音和保存。

移动端：

- 保持正文阅读宽度；
- 点击词语后打开底部词卡；
- 词卡支持关闭、滚动和下拉关闭；
- 不使用遮挡句子的悬浮气泡。

词卡信息顺序：

~~~text
interesting
A1 · 形容词

有趣的；引起兴趣的

当前语境
Read something interesting.
阅读一些有趣的内容。

播放发音    加入学习
~~~

### 8.4 阅读播放与完成

P0 支持播放当前句、暂停和当前句高亮。

P1 增加全文播放、0.8x/1.0x/1.2x、自动滚动和关闭自动滚动。

读完文章后显示：

~~~text
阅读完成

A2 · 日常英语 · 介绍自己与表达观点
阅读用时 8 分钟
新遇到 5 个词 · 已保存 2 个词

复习本文词汇    继续读下一篇
~~~

## 9. 本地组件目录

~~~text
src/components/ui/
  Button.tsx Input.tsx Badge.tsx Progress.tsx
  SegmentedControl.tsx Dialog.tsx Drawer.tsx
  EmptyState.tsx StatusMessage.tsx

src/components/learning/
  StudyShell.tsx ContextQuestion.tsx AnswerOption.tsx
  AnswerFeedback.tsx TrackCard.tsx LearningSummary.tsx

src/components/reader/
  ReaderLibrary.tsx ReaderContentCard.tsx ReaderToolbar.tsx
  ReaderCanvas.tsx WordInspector.tsx ReaderCompletion.tsx
~~~

这套组件借鉴 shadcn/ui 的本地可拥有方式、Magic UI 的受控动效方式、Aceternity UI 的焦点控制方式和 Naive UI 的主题/状态控制方式，但不直接混装四套库。

## 10. 执行顺序

### P0：入口和练习

1. 移除 App 对 placement 的全局阻塞；
2. 第一次开始学习时进入测评；
3. 测评结束自动回到正式学习；
4. 统一按钮、输入、标签、进度和反馈组件；
5. 重排语境题；
6. 接入 Enter 和焦点；
7. 扩充 A2 词条中文内容；
8. 替换当前明显的 AI 模板式组件视觉。

### P1：Reader

1. Reader 首页增加继续阅读和推荐卡；
2. 内置内容增加难度、方向、主题和时长；
3. 优化 Word Inspector 和移动底部词卡；
4. 支持当前句播放；
5. 增加阅读完成页和本文复习入口；
6. 支持保存短语。

### P2：句子学习

1. 新增 Sentence 模型；
2. 句子排序、中译英和听写；
3. 词、词形、搭配和语序反馈；
4. 句子级复习。

## 11. 验收标准

### 风格

- 页面保持暖灰白背景；
- 深墨绿、青蓝、琥珀色分别代表主路径、阅读、考试；
- 组件不使用整页渐变、发光边框和持续粒子；
- 控件具有 hover、focus-visible、disabled、success、error 状态；
- 组件使用统一圆角、边框、间距和阴影令牌。

### 可用性

- 所有交互控件有 hover、focus-visible、disabled 状态；
- 输入题支持 Enter；
- 选择题支持键盘确认；
- 反馈区有 aria-live；
- 弹窗和抽屉有 Escape、焦点进入和焦点返回；
- 移动端没有横向溢出；
- 长句和长释义不会被固定高度截断。

### Reader

- 可以继续当前文章；
- 文章能够显示 A2/路径/主题/预计时长；
- 点击单词能看到当前语境；
- 词卡可以播放、加入学习和关闭；
- 移动端词卡不会遮挡或破坏正文阅读；
- 第一阶段不承诺尚未实现的 URL、视频或跨设备导入。

## 12. 参考资料

- [shadcn/ui](https://ui.shadcn.com/)
- [Magic UI](https://magicui.design/)
- [Aceternity UI](https://ui.aceternity.com/)
- [Naive UI](https://github.com/tusen-ai/naive-ui)
- [句乐部帮助文档](https://julebu.co/docs/)
- [British Council Reading](https://learnenglish.britishcouncil.org/free-resources/reading)
- [Readlang](https://readlang.com/)
- [LingQ](https://www.lingq.com/en/learn-english-online/)
- [BBC Learning English](https://feeds.bbci.co.uk/learningenglish)
