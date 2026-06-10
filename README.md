# @vndmea/html-visual-diff

Rendered HTML visual diff viewer.

它不是 HTML 源码文本对比，而是把左右两份 HTML 解析成 DOM 后，生成左右两栏的可视化差异视图。

能力：

- 左右双栏渲染视图
- 新增、删除、修改高亮
- **行内文本差异（支持词级和字符级）**
- 属性变更识别
- 差异导航
- 同步滚动
- TypeScript 类型
- npm 包使用
- `sdk.js` 浏览器直接引入

> 基于 Vite 8 library mode。Vite 8 要求 Node.js `20.19+` 或 `22.12+`。

## 安装

```bash
npm install @vndmea/html-visual-diff
```

## npm / bundler 使用

```ts
import {
  HtmlVisualDiffViewer,
  createHtmlVisualDiffViewer
} from '@vndmea/html-visual-diff';

import '@vndmea/html-visual-diff/style.css';

const api = createHtmlVisualDiffViewer({
  el: '#viewer',
  oldHtml: '<article><h1>Old</h1><p>Hello</p></article>',
  newHtml: '<article><h1>New</h1><p>Hello world</p><p>Added</p></article>',
  matchThreshold: 0.58,
  inlineTextDiff: true,
  compareAttributes: true,
  syncScroll: true,
  ignoreAttributes: ['data-v-app'],
  ignoreTags: ['svg'],
  theme: {
    oldPaneTitle: '旧版本',
    newPaneTitle: '新版本',
    showHeader: true,
    showSummary: true,
    showChangeList: true,
    showPlaceholders: true
  }
});

api.scrollToChange(0);
```

## Browser SDK 使用

构建后会生成：

```txt
dist/sdk.js
dist/style.css
```

HTML 直接引入：

```html
<link rel="stylesheet" href="./dist/style.css" />
<div id="viewer"></div>

<script src="./dist/sdk.js"></script>
<script>
  window.HtmlVisualDiff.createHtmlVisualDiffViewer({
    el: '#viewer',
    oldHtml: '<p>Hello</p>',
    newHtml: '<p>Hello world</p>'
  });
</script>
```

## API

### `createHtmlVisualDiffViewer(options)`

返回：

```ts
interface HtmlVisualDiffViewerApi {
  root: HTMLElement;
  oldPane: HTMLElement;
  newPane: HTMLElement;
  changes: ChangeRecord[];
  scrollToChange: (idOrIndex: string | number) => void;
  destroy: () => void;
}
```

### `new HtmlVisualDiffViewer(options)`

```ts
const viewer = new HtmlVisualDiffViewer({
  el: document.getElementById('viewer')!,
  oldHtml,
  newHtml
});

viewer.render({
  el: '#viewer',
  oldHtml: nextOldHtml,
  newHtml: nextNewHtml
});

viewer.destroy();
```

## 配置参数

```ts
interface HtmlVisualDiffRenderOptions {
  oldHtml: string;
  newHtml: string;
  el: string | HTMLElement;

  mode?: 'rendered';
  matchThreshold?: number;
  textModifyThreshold?: number;
  inlineTextDiff?: boolean;
  textDiffGranularity?: 'char' | 'word';
  ignoreAttributes?: string[];
  ignoreTags?: string[];
  compareAttributes?: boolean;
  syncScroll?: boolean;
  allowUnsafeHtml?: boolean;

  getChangeLabel?: (record) => string;
  onRender?: (api) => void;
  onChangeSelect?: (change) => void;

  theme?: {
    classPrefix?: string;
    rootClassName?: string;
    oldPaneTitle?: string;
    newPaneTitle?: string;
    showHeader?: boolean;
    showSummary?: boolean;
    showChangeList?: boolean;
    showPlaceholders?: boolean;
  };
}
```

### 参数详解

- **textDiffGranularity**: `'char' | 'word'` - 行内文本差异粒度。默认为 `'word'`
  - `'word'`: 按词级进行对比（推荐），能更好地显示文本变化
  - `'char'`: 按字符级进行对比
  
```ts
// 词级对比示例（默认）
createHtmlVisualDiffViewer({
  oldHtml: '<p>The quick brown fox</p>',
  newHtml: '<p>The slow brown fox</p>',
  textDiffGranularity: 'word' // 高亮整个 'quick' -> 'slow'
});

// 字符级对比示例
createHtmlVisualDiffViewer({
  oldHtml: '<p>Hello</p>',
  newHtml: '<p>Hallo</p>',
  textDiffGranularity: 'char' // 高亮单个字符的变化
});
```

## 本地开发

```bash
npm install
npm run dev
```

打开 Vite 显示的本地地址。

## 测试

```bash
npm run test
```

## 构建

```bash
npm run build
```

输出：

```txt
dist/html-visual-diff.js     ESM
dist/html-visual-diff.cjs    CommonJS
dist/sdk.js                  Browser IIFE SDK
dist/style.css               样式
dist/index.d.ts              类型声明
```

## 发布 npm

```bash
npm login
npm publish --access public
```

如果你不想使用 scope 包名，把 `package.json` 里的：

```json
"name": "@vndmea/html-visual-diff"
```

改成：

```json
"name": "html-visual-diff"
```

## 创建 GitHub 仓库

```bash
git init
git add .
git commit -m "feat: init html visual diff viewer"
git branch -M main
git remote add origin https://github.com/vndmea/html-visual-diff.git
git push -u origin main
```

## 设计扩展点

当前版本已经拆成这些层：

```txt
src/
  diff/          DOM 匹配、节点 diff、文本 diff
  renderer/      DOM 视图生成
  utils/         DOM 工具、相似度算法
  types.ts       对外类型
  style.css      默认样式
```

后续可扩展：

- 替换 diff 算法
- 支持 ProseMirror / TipTap Node JSON 输入
- 支持 DITA / S1000D 语义节点映射
- 支持 accept / reject change
- 支持 comment / track changes
- 支持虚拟滚动
- 支持 Web Worker diff
- 支持自定义节点渲染器
