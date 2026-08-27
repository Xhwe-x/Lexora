# Lexora optional local service

这是一个可选的、无新增依赖的 Node 服务，为 Reader 提供受限的文本/字幕导入，以及显式开启后的跨设备同步。前端仍然可以只使用本地数据；服务不会自动上传学习数据。

## 启动

需要 Node.js 18 或更高版本。服务默认只监听本机 `127.0.0.1:8787`：

```powershell
npm run sync:server
```

启用同步时，必须在进程环境中配置令牌。同步数据目录应放在项目目录之外：

```powershell
$env:SYNC_TOKEN = "replace-with-a-long-random-secret"
$env:SYNC_DATA_DIR = "C:\LexoraData\sync"
npm run sync:server
```

一个 `SYNC_TOKEN` 对应一个同步账户；服务用令牌的稳定摘要生成内部命名空间，因此同一令牌可在不同设备访问同一状态。令牌拥有该账户的读写删除权限，不要把它暴露给第三方、前端公开代码、浏览器扩展或日志。

生产环境请由运维负责强令牌保管、HTTPS、网络暴露范围、出站网络控制和备份；服务默认只监听 localhost，不应直接暴露到公网。

## 配置

| 环境变量 | 默认值 | 作用 |
| --- | --- | --- |
| `SYNC_HOST` | `127.0.0.1` | 监听地址 |
| `SYNC_PORT` | `8787` | 监听端口 |
| `SYNC_TOKEN` | 未配置 | 同步鉴权令牌；未配置时同步接口返回 `503` |
| `SYNC_DATA_DIR` | 用户数据目录下的 `Lexora/sync` | 同步文件目录，建议显式配置到项目目录之外 |
| `IMPORT_TIMEOUT_MS` | `8000` | 单次远程文本请求超时 |
| `IMPORT_MAX_BYTES` | `2000000` | 单次远程文本响应最大字节数 |
| `SUBTITLE_MAX_BYTES` | `1000000` | 字幕输入最大字节数 |
| `SYNC_MAX_BYTES` | `512000` | 单个同步 payload 最大字节数 |
| `REQUEST_TIMEOUT_MS` | `15000` | 服务端请求超时 |
| `SYNC_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 浏览器跨端口请求允许的 Origin，逗号分隔；留空表示不允许带 Origin 的跨域请求 |

## 接口

### `GET /health`

返回非敏感状态：

```json
{ "ok": true, "status": "ok" }
```

### `POST /api/import/text`

请求必须是 `Content-Type: application/json`，格式为：

```json
{ "url": "https://example.com/article" }
```

只接受 `http`/`https` URL，并拒绝 URL 用户名/密码、`localhost`、回环/私网/链路本地/metadata IPv4 或 IPv6 地址。公网域名会先通过 DNS 解析检查；每次重定向前都会重新执行目标校验。远程响应必须声明以下内容类型之一：`text/html`、`application/xhtml+xml`、`text/plain`、`text/markdown`。服务限制响应字节数、请求超时，并最多跟随 3 次 `http`/`https` 重定向；不代理视频、音频或其他二进制内容。对外部署时仍应配置出站网络白名单或其他 SSRF 防护策略。

HTML 导入会移除 `script`、`style`、`nav`、`head`、`header`、`footer`、`aside`、表单、媒体和嵌入元素，再返回纯文本：

```json
{ "title": "Article title", "text": "Readable article text", "format": "html" }
```

纯文本和 Markdown 返回 `format: "text"`。

### `POST /api/import/subtitles`

请求体为：

```json
{
  "text": "1\n00:00:00,000 --> 00:00:01,500\nHello",
  "format": "srt"
}
```

`format` 可省略，服务会根据 `WEBVTT` 头自动识别，否则按 SRT 解析。支持标准 SRT 和 VTT cue，返回：

```json
{
  "format": "srt",
  "cues": [{ "startMs": 0, "endMs": 1500, "text": "Hello" }]
}
```

输入过大、时间戳无效、结束时间不晚于开始时间、空 cue 或结构 malformed 时会拒绝请求。视频导入只接收字幕/转写文本，不抓取任意视频二进制。

### `GET/PUT/DELETE /api/sync/state`

同步接口同时要求：

```text
Authorization: Bearer <SYNC_TOKEN>
```

`SYNC_TOKEN` 是同步账户身份，也是唯一命名空间依据；同一个 token 在多台设备上访问同一状态。旧版 `X-Lexora-User-ID` header 会被忽略，不能切换账户或文件命名空间。

`PUT` 的 JSON 必须是版本 1 的对象，并包含且只包含一个 `data` 或 `state` 对象字段，例如：

```json
{ "version": 1, "data": { "learning": {}, "reader": {} } }
```

服务会限制 payload 大小，先写入同一数据目录内的临时文件、同步文件内容，再原子替换账户文件。`GET` 返回同一个 payload；不存在时返回 `404`；`DELETE` 删除当前账户文件并返回 `204`。令牌未配置时三个同步路由均返回 `503`，错误 token 返回 `401`。

错误响应只返回固定的公开错误文案，不包含令牌、异常堆栈或文件系统路径。
