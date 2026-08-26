# Sources & Feature Mapping

> 记录日期：2026-08-26。用于告诉后续开发者：每个模块借鉴了什么产品思路，以及上游哪里值得继续研究。

## 1. Earthworm → `modules/sentence-trainer`

仓库：https://github.com/cuixueshe/earthworm

产品思路：通过中文提示，让学习者自己构造英文句子；提供提示、答案反馈、练习进度等。

已检查的上游位置：

- `apps/client/pages/game/[coursePackId]/[id].vue`：游戏页编排、课程切换、进度入口。
- `apps/client/components/main/MainGame.vue`：主练习区域。
- `apps/client/components/main/QuestionInput/`：输入、提示、答案反馈相关组件。
- `apps/client/components/main/QuestionInput/questionInputHelper.ts`：提示层级、成功/失败状态等逻辑。

本包对应实现：

- `modules/sentence-trainer/src/sentence-trainer.mjs`
- `example-app` 的“句子”页面。

本包没有复制上述实现，只保留“中译英 → 判题 → 逐步提示 → 连击/下一题”这一产品机制。

## 2. basic_english → `modules/basic-core`

仓库：https://github.com/mythquan/basic_english

公开 README 描述的能力包括：基础单词、词卡、浏览器发音、间隔复习、基础语法、语法练习、AI 会话、PWA/本地学习记录等。

已检查的目录：

- `docs/js/850words.js`
- `docs/js/grammar.js`
- `docs/js/grammar-rules.js`
- `docs/js/grammar-srs.js`
- `docs/js/ai-conversation.js`
- `docs/js/learning-path.js`

授权处理：仓库根目录未发现明确 LICENSE，所以本包没有复制这些文件，也没有复制其 850 词数据。

本包对应实现：

- `modules/basic-core/src/speech.mjs`：Web Speech API。
- `modules/basic-core/src/srs.mjs`：简化 SRS。
- `modules/basic-core/src/word-card.mjs`：词卡状态。
- `modules/basic-core/src/grammar.mjs`：语法题判题。
- `modules/basic-core/data/`：本包自行编写的少量演示数据。

## 3. Lector → `modules/reader`

仓库：https://github.com/heuwels/lector

README 明确描述：导入文本、点击单词、翻译/保存、new-learning-known 单词状态、Cloze 练习、SRS、SQLite、Anki、TTS 等。

本包对应实现：

- `modules/reader/src/tokenizer.mjs`：把英文文本拆成可点击单词，保留原标点。
- `modules/reader/src/word-state.mjs`：new / learning / known。
- `modules/reader/src/cloze.mjs`：从阅读句子生成完形填空。
- `modules/reader/src/vocabulary.mjs`：收藏生词并进入复习。
- `example-app` 的“阅读”和“复习”页面。

本包刻意没有加入 EPUB、YouTube、Podcast、Anki、云端翻译等能力，以维持 V1 轻量化。
