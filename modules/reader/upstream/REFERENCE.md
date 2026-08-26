# Lector Reference

来源：https://github.com/heuwels/lector
授权：AGPL-3.0。

README 中值得借鉴的产品机制：

- Reader：导入文本后点词。
- Word states：new / learning / known。
- Vocabulary：保存单词和短语。
- Cloze practice：句中挖空、选择或输入。
- SRS：根据掌握程度安排复习。
- 本地优先：self-host 使用 SQLite。

当前模块只重做 Reader + word state + vocabulary + cloze + SRS 的最小版本，没有复制上游源文件。
