# @vndmea/html-visual-diff

Rendered HTML/CSS visual diff viewer.

这个项目聚焦一件事：把两份 HTML/CSS 分别做真实渲染，再以双栏方式展示差异结果。

当前能力：

- 左右两栏真实 HTML/CSS 渲染视图
- 基于渲染结果的差异高亮
- 文本差异子区间高亮
- block 级 spacer 对齐
- 左右同步滚动
- TypeScript 类型
- 浏览器 `sdk.js` 直接接入

不包含：

- toolbar
- header
- summary
- change list
- 差异导航按钮
- 编辑器能力

> 基于 Vite 8 library mode。Node.js 需要 `20.19+` 或 `22.12+`。

## 安装

```bash
npm install @vndmea/html-visual-diff
```

## npm / bundler 使用

```ts
import { createHtmlVisualDiff } from '@vndmea/html-visual-diff';
import '@vndmea/html-visual-diff/style.css';

const viewer = await createHtmlVisualDiff({
  container: '#viewer',
  old: {
    html: '<article><h1>Old</h1><p>Hello</p></article>',
    css: 'article { padding: 16px; }'
  },
  new: {
    html: '<article><h1>New</h1><p>Hello world</p><p>Added</p></article>',
    css: 'article { padding: 20px; background: #f8fbff; }'
  },
  options: {
    viewportWidth: 960,
    syncScroll: true,
    align: true,
    compareText: true,
    compareStyle: true,
    compareLayout: true
  }
});

await viewer.refresh();
viewer.destroy();
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
  window.HtmlVisualDiff.createHtmlVisualDiff({
    container: '#viewer',
    old: {
      html: '<p>Hello</p>'
    },
    new: {
      html: '<p>Hello world</p>'
    }
  });
</script>
```

## API

### `createHtmlVisualDiff(options)`

```ts
interface HtmlVisualDiffSource {
  html: string;
  css?: string;
  baseUrl?: string;
}

interface HtmlVisualDiffOptions {
  viewportWidth?: number;
  syncScroll?: boolean;
  align?: boolean;
  compareText?: boolean;
  compareStyle?: boolean;
  compareLayout?: boolean;
  layoutThreshold?: number;
}

interface CreateHtmlVisualDiffOptions {
  container: string | HTMLElement;
  old: HtmlVisualDiffSource;
  new: HtmlVisualDiffSource;
  options?: HtmlVisualDiffOptions;
}

interface HtmlVisualDiffViewer {
  root: HTMLElement;
  destroy(): void;
  refresh(): Promise<void>;
}
```

## 本地开发

```bash
npm install
npm run dev
```

## 测试

```bash
npm run test
npm run typecheck
```

## 构建

```bash
npm run build
```

输出：

```txt
dist/html-visual-diff.js
dist/html-visual-diff.cjs
dist/sdk.js
dist/style.css
dist/index.d.ts
```

## GitHub Pages

仓库已配置 `main` 分支 push 后自动部署 Pages。

工作流会执行：

```bash
npm ci
npm run typecheck
npm run test
npm run build:pages
```

首次启用时请在 GitHub 仓库 `Settings -> Pages` 中确认 `Source` 为 `GitHub Actions`。
