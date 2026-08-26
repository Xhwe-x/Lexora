# Basic Core

轻量基础英语模块。功能方向参考 basic_english 的公开 README，代码和演示数据均为本包独立实现。

## 能力

- `speech.mjs`：浏览器 Web Speech API 免费 TTS。
- `srs.mjs`：简化间隔重复。
- `word-card.mjs`：单词卡状态和复习。
- `grammar.mjs`：基础语法题判题。
- `progress-store.mjs`：本地学习记录。
- `data/`：本包自行编写的少量演示数据。

## 为什么不直接放 850 词数据

检查 `mythquan/basic_english` 时没有发现明确根 LICENSE。为避免把授权不清晰的数据/代码重新分发，本包只实现功能框架。正式项目建议使用有明确许可的词典、CEFR 词表或你自己整理的数据。
