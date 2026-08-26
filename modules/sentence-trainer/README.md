# Sentence Trainer

轻量中译英练习核心，产品交互参考 Earthworm，但代码为独立实现。

## 能力

- 英文答案规范化（忽略大小写、常见标点、多余空格）。
- 逐 token 比较，定位第一个错误位置。
- 渐进式提示。
- 连击、正确数、练习索引。
- 不依赖 Vue/React/数据库。

## 主要 API

- `normalizeEnglish(text)`
- `evaluateSentence(input, expected)`
- `buildHint(expected, revealCount)`
- `new SentenceSession(lessons)`

课程数据只需要：

```js
{ id: 's1', prompt: '我每天学习英语。', answer: 'I study English every day.', note: '...' }
```

后续可增加：多答案、关键词评分、语音输入、错句本，但 V1 不建议加入 AI 判题。
