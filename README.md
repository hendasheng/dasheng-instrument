# Loudroom / 大声练琴

**Loudroom** 是一个面向个人音乐练习的交互式工具项目。中文名是 **大声练琴**。

Current version: **0.1**.

The repository also contains an independent Xiaohongshu minitool variant under `apps/minitool`. Its source, build configuration and development notes are kept separate from the online app.

Live demo: [Open Loudroom / 大声练琴](https://hendasheng.github.io/dasheng-instrument/)

项目先从吉他练习开始，但不会限定在 Guitar。长期方向是把音阶、和弦、指板、音程、节奏、听力、MIDI 和实际演奏连接成一个可以直接操作的练习环境。

## Why

Loudroom 不是传统课程网站，也不是单纯的乐理查询工具。它更像一个可以直接玩的音乐练习面板：

- 看得到
- 点得到
- 听得到
- 可以马上拿真实乐器验证
- 能把乐理、指板、听觉和手上的动作连接起来

核心目标是让这些关系变得可操作：

```text
Note
↓
Interval
↓
Scale
↓
Fretboard
↓
Sound
↓
Hands
↓
Music
```

## 0.1 Scope

0.1 聚焦第一条可玩的练习闭环：

```text
Key / Scale
↓
Scale Notes
↓
Fretboard Mapping
↓
Click-to-play Audio
```

当前已实现：

- 12 个 Key 快速选择
- Scale 下拉选择
- 音阶音摘要，使用音名和 Roman degree
- 0-15 品吉他指板
- CAGED 把位高亮：保留完整音阶作为上下文，并可选择 `C`、`A`、`G`、`E`、`D` 形状聚焦练习区域
- 指板上方由独占一行的 scale-strip 和下一行左右分布的 Position / Labels 控件组成；Position 使用独立的 `All` 按钮和一组 `C / A / G / E / D` CAGED 分段按钮
- 手机竖屏使用纵向指板布局，6 根弦横向排列、品位从上到下延伸
- 移动端隐藏重复的当前 Key / Scale 摘要，并保持工作台标题、播放控制和 scale-strip 为紧凑单行布局
- 移动端播放按钮与 `Play scale` 提示保持一致的控件宽度
- 移动端隐藏 Position / Labels 组标题，两组按钮保持在同一行且文字不换行
- 移动端缩小 workbench 内边距，为指板和控制区释放更多宽度
- 标准调弦 `E A D G B E`
- 指板高亮当前音阶音
- 普通音阶标记使用柔和浅灰，避免压过 Root 和主要控制信息
- Root note 使用独立颜色
- 指板显示模式：
  - `Note`
  - `Degree`
  - `Root`
- 点击音阶音或指板标记点试听
- `Play scale` 可播放 / 停止，连续点击不会叠加
- 播放按钮右下角的绿色信号灯随每个音符节奏闪烁
- 播放 scale 时，scale-strip 中当前播放的音会同步显示点击反馈
- Loop 开启时会循环播放当前 scale，每轮之间停顿两个音的时间；关闭时只播放一次
- 音频播放复用单个 Web Audio context，支持移动端持续循环播放
- 深色实底 UI，避免半透明荧光质感
- 桌面端按 `F` 可进入或退出浏览器全屏

当前 Scale 集合：

- Major
- Minor
- Dorian
- Phrygian
- Lydian
- Mixolydian
- Locrian
- Major Pentatonic
- Minor Pentatonic

## Not In 0.1

这些暂不属于当前版本：

- 完整 chord library
- Blues scale
- Chord diagrams
- Triads / inversions
- Guitar samples
- MIDI input
- Ear training
- Rhythm trainer
- Saved practice sessions
- User accounts

## Audio

当前音频使用 Web Audio API 的轻量 oscillator 预览。

当前 oscillator 使用正常试听音量，并保留短促淡入淡出以避免点击爆音。

后续可以逐步替换或扩展为 Tone.js sampler 与 guitar samples：

```ts
playNote("C4");
```

更进一步可以按 string/fret 组织采样：

```ts
play({
  string: 5,
  fret: 3,
});
```

因为吉他中相同音高在不同弦和不同位置上会有不同音色。

## Development

Install dependencies:

```bash
npm install
```

Start the web app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

The app lives in `apps/web`, but the root package provides workspace scripts, so normal commands should be run from the repository root.

## Deployment

The live demo is deployed with GitHub Pages through GitHub Actions.

- Workflow: `.github/workflows/pages.yml`
- Build command: `npm run build`
- Published directory: `apps/web/dist`
- Latest demo URL: `/dasheng-instrument/`
- Current version URL: `/dasheng-instrument/0.1/`
- Vite base path: `/dasheng-instrument/0.1/`

GitHub repository setting:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

## Project Structure

```text
apps/
  web/              Loudroom web app
  minitool/         Offline Xiaohongshu minitool variant
docs/
  versions/         Version scopes and release planning
packages/           Future shared music/audio libraries
AGENTS.md           Notes for coding agents and future collaborators
```

Version notes start at `docs/versions/0.1.md`.

## References

- [muted.io Guitar Scales](https://muted.io/guitar-scales/) — CAGED 全指板音阶与把位聚焦交互的产品参考。
