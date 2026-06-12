# 可复用提示词

你可以把下面这段提示词直接丢给 AI，让它继续维护这个项目。

```txt
你是一个资深 TypeScript 前端架构师。请基于当前项目 `@vndmea/html-visual-diff` 继续开发。

项目目标：
把两个 HTML 字符串解析成 DOM，输出左右两栏的“渲染后可视化对比视图”，不是源码文本 diff。它需要同时支持 npm 安装的包和 browser sdk.js 直接引入。

技术要求：
1. TypeScript + ES2022 + Vite 8 library mode。
2. 输出 ESM、CJS、IIFE SDK：
   - dist/html-visual-diff.js
   - dist/html-visual-diff.cjs
   - dist/sdk.js
   - dist/style.css
   - dist/index.d.ts
3. 对外 API：
   - class HtmlVisualDiffViewer
   - function createHtmlVisualDiffViewer(options)
4. 输入参数：
   - oldHtml: string
   - newHtml: string
   - el: string | HTMLElement
   - matchThreshold
   - inlineTextDiff
   - compareAttributes
   - ignoreAttributes
   - ignoreTags
   - syncScroll
   - allowUnsafeHtml
   - getChangeLabel
   - onRender
   - onChangeSelect
   - theme
5. 功能要求：
   - 左右双栏
   - 新增、删除、修改高亮
   - 行内文本差异
   - 属性变化识别
   - 差异导航
   - 同步滚动
   - 可销毁 destroy
   - 可重新 render
6. 工程要求：
   - Vitest + jsdom 测试用例
   - README 包含 npm 使用、sdk.js 使用、GitHub 初始化、npm 发布说明
   - 代码结构要易扩展，diff、renderer、utils、types 分层清楚
7. 注意：
   - 不要做源码字符串对比为主；核心是 DOM/渲染视图对比。
   - 默认过滤 script/style/iframe/object/embed 等危险标签。
   - 默认过滤 inline event handler，比如 onclick。
   - 不能强绑定 Vue/React，必须是纯 DOM SDK。
   - 样式需要通过 classPrefix 可隔离。
   - 保持 public API 稳定，内部实现可以重构。
```

后续增强提示词：

```txt
请在当前项目中增加自定义节点渲染器能力。要求：
- options.nodeRenderers 支持按 tagName 注册 renderer
- renderer 可以接收 oldNode/newNode/changeType/context
- 默认 renderer 保持现有行为
- 增加测试用例
- 更新 README
```

```txt
请在当前项目中增加 accept/reject change 能力。要求：
- 每个 ChangeRecord 能定位对应节点
- API 增加 acceptChange(id) / rejectChange(id)
- 支持批量 acceptAll/rejectAll
- 不破坏原有只读 diff viewer 使用方式
- 增加测试用例和 demo
```

```txt
请把 diffChildren 的 LCS 匹配算法抽象成 strategy。要求：
- 默认 strategy 保持现有行为
- options.diffStrategy 可传入自定义函数
- 增加单元测试
- README 给出自定义 strategy 示例
```
