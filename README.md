# Lexora

> **把“背单词”变成一段每天愿意回来的学习旅程。**

Lexora 是一款本地优先的连续英语学习器：用短而有节奏的学习 Session 帮你认识新词、主动回忆、及时复习，再把词汇带回真实句子与阅读场景中。

它不要求账号、不依赖数据库，也不强制接入 AI API。学习数据保存在当前浏览器里，项目可以直接作为静态站点部署。

## ✦ 核心体验

### Learn Session · 每天学一点

- Daily 与 Review 共用同一套 Session Engine；
- 新词遵循“理解 → 识别 → 主动回忆”的渐进路径；
- 错题通过 delayed retry 回到学习流，最多重试 2 次，不制造虚假的进度；
- 每次作答后给出清晰的答案对照与即时反馈；
- 完成页展示核心练习、首次答对、曾答错、retry 与需留意词。

### Reader · 在语境里记住

- 沉浸式 Reading Canvas，编辑文本收纳到次级编辑器中；
- 可调整字号、行距、正文宽度与 Serif / Sans 阅读风格；
- 点击正文单词即可查词，本地词库命中后可以加入学习计划；
- 文档、阅读偏好与滚动进度保存在浏览器本地。

### Review Center · 知道现在该复习什么

- 以唯一主行动引导复习，减少选择负担；
- 聚合到期词与仍未纠正的近期错词；
- 用“需加强 / 学习中 / 较稳定”呈现可解释的词汇状态；
- 没有到期内容时，自然引导回到 Reader，而不是制造刷题压力。

### My · 看见自己的成长

- 连续学习、已学习词、有效复习与本周学习天数；
- 真实的 7-day consistency strip；
- 每日新词计划与词汇成长分层；
- 设置与危险操作保持克制，并明确提示数据只保存在当前浏览器。

### Speech · 轻量而及时的发音

统一的 `SpeechButton` 服务于 Learn Session、WordCard 与 Reader：只有真正开始播放时才出现动效，播放结束、取消或出错后立即收敛；在减少动效偏好下自动关闭扩散动画。

## ▣ 快速开始

环境要求：**Node.js 20+**。

```bash
npm install
npm run dev
```

然后打开终端提示的本地地址即可开始体验。

> 请不要跨 Windows、macOS、Linux 复制 `node_modules`。Rollup、esbuild 等依赖包含平台相关的可选原生包，请在目标系统重新执行 `npm install`。

## ◌ 验证命令

```bash
# 领域级 Node 测试
npm run test:domain

# 模块级 Node 测试
npm run test:modules

# 完整测试
npm test

# 类型检查与生产构建
npm run build

# 一次执行全部验证
npm run verify
```

## ◫ 项目结构

```text
Lexora/
├── src/
│   ├── components/        # 卡片、练习、反馈、阅读与设置组件
│   ├── data/              # 本地词汇与句子数据
│   ├── features/          # Reader 等领域特性
│   ├── learning/          # Session、复习、历史与学习状态
│   ├── lib/               # 本地存储、语音等基础能力
│   └── pages/             # Home、LearnSession、My
├── modules/               # 可复用的词卡、SRS、阅读与句子训练模块
├── tests/                 # 学习流程与领域行为测试
├── docs/                  # 架构、设计、实施记录与集成说明
├── index.html             # Vite 入口
└── package.json           # 开发、测试与构建脚本
```

## ◇ 本地数据

Lexora 使用浏览器 `localStorage` 保存学习状态，主要包括：

```text
lexora:word-progress
lexora:settings
lexora:daily-plan
lexora:review-history
lexora:daily-completion
lexora:learning-day-history
lexora:reader-interactions
lexora:reader-document
```

旧版 `english-garden:*` 数据的兼容迁移仍然保留。清除浏览器站点数据会同时清除本地学习记录，请谨慎操作。

## ▤ 设计与实施记录

- [UI/UX Refactor V2](docs/LEXORA_UI_UX_REFACTOR_V2.md)
- [Stage 2 UI/UX 修改方向](docs/LEXORA_STAGE2_UI_UX_MODIFICATION_DIRECTION.md)
- [Stage 2 实施计划](docs/STAGE2_IMPLEMENTATION_PLAN.md)
- [Stage 2 实施说明](docs/STAGE2_IMPLEMENTATION_NOTES.md)
- [架构说明](docs/ARCHITECTURE.md)
- [集成说明](docs/INTEGRATION.md)

## ▧ 许可与来源

项目代码与上游素材的说明见：

- [SOURCES.md](SOURCES.md)
- [LICENSES/UPSTREAM-NOTICE.md](LICENSES/UPSTREAM-NOTICE.md)
- [docs/LICENSE-NOTES.md](docs/LICENSE-NOTES.md)
- [LICENSE](LICENSE)

---

**Lexora** · Learn words in context. Keep the streak gentle.<br>
Made for small, consistent progress.
