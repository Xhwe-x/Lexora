# Lexora

> 从 A2 起步，把单词带回句子、文章和下一次复习。

Lexora 是一个本地优先的英语学习 Web 应用：用短会话建立稳定节奏，在 Reader 里阅读真实语境，再把真正有用的词带回复习。默认不需要账号、数据库或 AI API；学习数据保存在当前浏览器中，也可以按需接入一个手动同步服务。

## 学习路径

### A2 入门流程

第一次打开 Lexora 可以先浏览首页、单词库、阅读、复习和设置。第一次点击正式学习时，才会进入起点流程：

1. 选择目标：日常英语、考试英语，或两者都要；
2. 完成一组 24 题的 A2 起点测评，覆盖词义识别、语境理解、主动回忆和拼写与形式；
3. 获得 A1 强化、A2 主线或 B1 挑战的起始建议，以及日常/考试内容比例；
4. 自动进入当天的学习会话，已有本地学习记录会保留。

测评结果是内容安排建议，不是 CEFR 等级认证。选择“两者都要”时，默认比例为日常英语 60% · 考试英语 40%。

### Duolingo 风格的短会话

- Daily 与 Review 共用同一套 Session Engine，适合每天完成一小组内容；
- 新词按“理解 → 识别 → 主动回忆”推进，对应词卡、选择题和输入题；
- 到期复习优先进入队列，答错内容会延迟回到当前会话，最多重试 2 次；
- 每次作答都有即时反馈，完成页会区分首次答对、曾答错和 retry，不用为了虚假的进度反复刷题；
- 日常英语与考试英语共享词库，首页会明确当前主路径和辅助路径。

## Reader：在语境里继续学习

Reader 是 Lexora 的阅读入口，提供本地内容库、A1/A2/B1 难度筛选、日常/考试方向、主题、内容类型和预计时长。阅读时可以：

- 点击单词查看当前语境、本地词条、释义、搭配和浏览器发音；
- 把词加入学习计划，并保留查词记录、阅读进度和阅读偏好；
- 调整字号、行距、正文宽度以及 Serif / Sans 字体；
- 在阅读完成后继续下一篇，或回到本文的复习内容。

### 内容导入

Reader 的导入器覆盖以下内容形态：

- 纯文本：粘贴或编辑自己的英文；
- HTML 文本：清洗为可读正文，去除不适合阅读的脚本、样式及嵌入内容；
- SRT / VTT：解析为正文与带开始/结束时间的 subtitle cue；
- URL：仅在配置可选的 Lexora 导入服务后启用。服务支持受限的文章文本/HTML 导入，并会校验协议、响应类型、大小、超时和重定向。

视频导入的边界是字幕或转写文本：可以提供 SRT/VTT 或其他转写内容，也可以为阅读内容附加一个可选音频 URL；Lexora 服务不会下载、代理或存储视频二进制，也不负责抓取视频。

### 全文音频与 cue 同步

当内容提供音频 URL 时，Reader 支持全文播放、暂停和 0.8× / 1.0× / 1.2× 速度切换。若同时有 SRT/VTT cue，播放会定位当前片段、同步正文高亮并保存音频进度，刷新后可以继续；没有音频 URL 时，单句播放会回退到浏览器的 SpeechSynthesis。

### 文章专属复习包

读完文章且有已保存词时，可以生成与该文章绑定的复习包。复习包会保留本篇已保存的词、阅读进度和用时，并提供最小化的理解题与填空提示；内容保存在本地，可从文章完成页进入词汇复习。

## 考试路线

Reader 内置了按路线筛选的起始内容：

| 路线 | 当前起点内容 |
| --- | --- |
| 通用考试英语 | A2 |
| CET-4 | A2 |
| CET-6 | B1 |
| 考研英语 | B1 |
| IELTS | A2 |

这些路线目前提供对应的 A2/B1 starter content、阅读方向和技能提示，不代表完整官方题库、完整考试课程或成绩预测。

## 本地优先、可选同步与安全

默认情况下，词汇进度、学习历史、复习记录、Reader 文档/互动、音频进度和文章复习包都保存在浏览器 `localStorage` 中；Lexora 不会自动上传学习数据。浏览器本地存储不是加密存储，共享设备请注意浏览器配置文件的安全。

### 手动跨设备同步

跨设备同步是可选的、手动触发的：

1. 启动可选 Node 服务；
2. 在“我的 → 设置”中填写服务地址和 token；
3. 明确点击“上传状态”或“下载状态”。

同一个 `SYNC_TOKEN` 对应同一个同步状态空间，服务使用 `Authorization: Bearer <SYNC_TOKEN>` 鉴权；没有 token 时同步接口保持关闭。token 不应写入前端公开代码、浏览器扩展或日志。

```powershell
$env:SYNC_TOKEN = "replace-with-a-long-random-secret"
$env:SYNC_DATA_DIR = "C:\LexoraData\sync"
npm run sync:server
```

服务默认只监听 `127.0.0.1:8787`。生产环境应自行负责 HTTPS、强 token 保管、网络暴露范围、出站网络控制和备份；同步目录建议放在项目目录之外。完整接口说明见 [server/README.md](server/README.md)。

### 配置

前端可选配置：

```env
VITE_LEXORA_SERVICE_URL=http://localhost:8787
```

它用于 URL 文章导入，也会作为设置页中同步服务地址的初始值。未配置时，URL 导入会提示服务不可用；同步客户端仍默认指向 `http://localhost:8787`，但必须手动提供 token。

可选服务的关键环境变量：

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `SYNC_HOST` | `127.0.0.1` | 监听地址 |
| `SYNC_PORT` | `8787` | 监听端口 |
| `SYNC_TOKEN` | 未配置 | 同步鉴权 token；未配置时同步接口返回 503 |
| `SYNC_DATA_DIR` | 用户数据目录下的 `Lexora/sync` | 同步文件目录 |
| `SYNC_ALLOWED_ORIGINS` | localhost:5173 与 127.0.0.1:5173 | 允许的浏览器 Origin，逗号分隔 |
| `IMPORT_TIMEOUT_MS` | `8000` | 远程文章请求超时 |
| `IMPORT_MAX_BYTES` | `2000000` | 远程文章响应上限 |
| `SUBTITLE_MAX_BYTES` | `1000000` | 字幕输入上限 |
| `SYNC_MAX_BYTES` | `512000` | 单个同步 payload 上限 |
| `REQUEST_TIMEOUT_MS` | `15000` | 服务端请求超时 |

URL 导入会拒绝 `localhost`、回环、私网、链路本地和 metadata 地址，并在重定向前重新校验目标；远程服务只处理文本类响应，不代理视频、音频或其他二进制内容。

## 开发、测试与构建

开发服务器与构建建议使用 Node.js 20+；运行域测试和完整 `verify` 时，还需要支持 `--experimental-strip-types` 的 Node 版本。可选服务本身支持 Node.js 18+。

```bash
# 安装依赖
npm install

# 启动 Vite 开发服务器
npm run dev

# 预览生产构建
npm run preview

# 运行 Vitest
npm test

# 运行领域、服务端和模块测试
npm run test:domain
npm run test:server
npm run test:modules

# 类型检查并生成生产构建
npm run build

# 一次执行全部测试与构建
npm run verify
```

`npm run dev` 和 `npm run preview` 会监听 `0.0.0.0`，终端会输出可访问地址。

## 项目与许可

- 前端入口：`src/`
- 可复用学习模块：`modules/`
- Node 可选服务：`server/`
- 测试：`tests/`
- 架构与实施记录：`docs/`

来源与许可说明见 [SOURCES.md](SOURCES.md)、[LICENSES/UPSTREAM-NOTICE.md](LICENSES/UPSTREAM-NOTICE.md)、[docs/LICENSE-NOTES.md](docs/LICENSE-NOTES.md) 和 [LICENSE](LICENSE)。

---

**Lexora** · Learn words in context. Keep the streak gentle.
