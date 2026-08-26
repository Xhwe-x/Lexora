# Integration Runbook — Vite / React version

## 1. 安装并记录基线

```bash
npm install
npm test
npm run build
```

## 2. 本地开发

```bash
npm run dev
```

默认打开：

```text
http://localhost:5173/
```

根地址就是网站。

## 3. 每次只合并一个功能域

建议顺序：

```text
words core
→ daily plan
→ review
→ sentence trainer
→ reader vocabulary
→ optional dictionary
```

## 4. 内容数据单独管理

词库、例句、句子数据必须和学习算法分开。新增外部数据前确认许可证，并更新 `SOURCES.md`。

## 5. 手工 smoke test

1. 首页出现“今日学习单词”；
2. 点击“自定义数量”，设成 5；
3. 回首页确认今日计划为 5；
4. 学会至少一个单词；
5. 打开复习页，确认词条出现；
6. 切换 英→中 / 中→英；
7. 刷新浏览器，确认设置与进度仍在；
8. 句子训练完成一次正确判题；
9. 阅读页点击单词并播放发音。

## 6. 发布前验证

```bash
npm run verify
```

再部署 `dist/` 到静态托管平台。
