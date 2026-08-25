# Loudroom / 大声练琴

**Loudroom** 是一个面向个人音乐练习的交互式工具项目。中文名是 **大声练琴**。

Current version: **0.1**.

Live demo:

```text
https://hendasheng.github.io/dasheng-instrument/
```

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
- 0-12 品吉他指板
- 标准调弦 `E A D G B E`
- 指板高亮当前音阶音
- Root note 使用独立颜色
- 指板显示模式：
  - `Note`
  - `Degree`
  - `Root`
- 点击音阶音或指板标记点试听
- `Play scale` 可播放 / 停止，连续点击不会叠加
- Loop 开启时会循环播放当前 scale，关闭时只播放一次
- 深色实底 UI，避免半透明荧光质感

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

## Project Structure

```text
apps/
  web/              Loudroom web app
docs/
  versions/         Version scopes and release planning
packages/           Future shared music/audio libraries
AGENTS.md           Notes for coding agents and future collaborators
```

Version notes start at `docs/versions/0.1.md`.
