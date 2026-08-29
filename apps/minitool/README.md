# Loudroom 小工具版

这里维护 **Loudroom / 大声练琴 0.1** 的小红书小工具变体。它是独立的离线分发版本，不替代 `apps/web` 中的 GitHub Pages 在线版。

## 发布信息

```text
名称：大声练琴
简介：帮助你更清晰地认识吉他指板
```

名称、容器内标题、可访问性名称以及后续发布物料应保持一致。简介是当前平台发布文案，调整时需同步检查本文件和版本说明。

## 目录职责

```text
apps/minitool/
  public/index.html   小工具离线入口模板
  src/                小工具专用 React、音频与样式源码
  dist/0.1/           本地构建产物，不提交仓库
  package.json        独立 workspace 脚本
  vite.config.ts      IIFE 经典脚本构建配置
```

小工具源码与在线版分开维护。产品逻辑变更时，应明确判断是否同时同步两个版本，不能默认修改其中一个就会自动影响另一个。

## 开发

从仓库根目录运行：

```bash
npm run dev:minitool
npm run build:minitool
```

开发服务器仅用于普通浏览器预览。最终上传内容来自：

```text
apps/minitool/dist/0.1/
```

该目录构建后应直接包含根入口 `index.html` 和本地 `assets/`。打包时压缩它的**内容**，不要把 `0.1` 文件夹本身作为 ZIP 的第一层。

只有用户明确要求生成上传包时才创建 ZIP；ZIP 不纳入仓库。

## 容器约束

- 所有资源必须在包内，并使用 `./` 相对路径。
- `index.html` 必须位于 ZIP 根目录。
- 页面只加载经典外链脚本；禁止内联脚本、行内事件和 `type="module"`。
- 禁止网络请求、外部资源、动态 import、Worker、WASM、iframe 和新窗口。
- 不调用 fullscreen、屏幕共享、设备枚举、MIDI、定位、剪贴板或传感器能力。
- Web Audio 必须由用户点击触发，并复用共享 `AudioContext`。
- 页面同时处理容器顶部/底部避让和系统安全区。
- 如未来增加 Native 能力，只能使用容器提供的 `window.xhs.miniTool.*` 正式 API。

## 当前与在线版的差异

- 保留 Key、Scale、scale strip、CAGED、标签模式、指板试听、整段播放和循环播放。
- 移除桌面 `F` 全屏快捷键，因为小工具容器禁止 fullscreen。
- React、React DOM 与 Lucide 在构建时写入本地 `app.js`，运行时不访问网络。
- 小工具顶部和底部额外预留容器控件空间。

## 交付前检查

1. 运行 `npm run build:minitool`。
2. 确认 `dist/0.1/index.html` 使用经典相对脚本，没有内联脚本。
3. 对生成的 `assets/app.js` 运行 `node --check`。
4. 扫描网络请求、fullscreen、Worker、iframe、动态执行等禁用能力。
5. 在窄屏和竖屏检查指板、顶部容器按钮及底部手势区是否重叠。
6. 确认最终 ZIP 小于 10 MB，且解压后根层直接出现 `index.html`。
