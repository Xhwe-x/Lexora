# 如何整合到你的项目

## 推荐方案：新建轻量 Web 壳

不要继续把 Read Frog 的 WXT 扩展壳当网站框架。新建一个 Vite React 项目，把本包 `modules/` 复制进去：

```bash
npm create vite@latest free-english -- --template react-ts
cd free-english
npm install
cp -R /path/to/english-learning-integration-kit/modules ./src/learning
```

然后建立 6 个页面：

```text
/home
/words
/sentences
/grammar
/reader
/review
```

对应关系：

| 页面 | 模块 |
|---|---|
| `/words` | `basic-core` |
| `/sentences` | `sentence-trainer` |
| `/grammar` | `basic-core` |
| `/reader` | `reader` |
| `/review` | `basic-core/srs` + `reader/vocabulary` |

## 如果一定要塞进 Read Frog

可以，但不要碰 WXT content-script / background 体系。

1. 在 Read Frog 根目录建立 `web/` 或单独 workspace。
2. `modules/` 放到共享包，如 `packages/learning-core/`。
3. Web 项目只 import 纯函数，不 import `browser.*`、WXT、content-script。
4. Read Frog 原本的翻译 Prompt、AI provider 以后通过适配器接到 Reader，而不是让 Reader 直接依赖扩展代码。

建议结构：

```text
read-frog-main/
├─ packages/
│  └─ learning-core/
│     ├─ sentence-trainer/
│     ├─ basic-core/
│     ├─ reader/
│     └─ shared/
├─ web/                 # 新的 Vite/React 网站
└─ src/                 # 原浏览器扩展，暂时不动
```

## React 包装示例

核心模块不是 React 组件，这是有意设计。React 层只负责展示：

```tsx
const session = useMemo(() => new SentenceSession(lessons), [lessons]);
const result = session.submit(input);
```

不要把判题、SRS、Cloze 再写一遍到组件里。

## 数据整合

建议统一三个模块的数据 ID：

```text
wordId      = lowercase English lemma
sentenceId  = stable lesson id
grammarId   = stable rule id
articleId   = uuid or content hash
```

学习记录统一保存在一个存储层：

```text
progress.words
progress.sentences
progress.grammar
vocabulary
readerWordStates
settings
```

V1 使用 IndexedDB/localStorage；真正需要多设备同步时，再加后端。

## 添加新功能的顺序

1. 先写数据结构。
2. 先写纯函数和测试。
3. 再做 UI。
4. 最后做持久化。
5. 只有实际需要时才引入网络 API。

不要反过来先装一堆依赖。
