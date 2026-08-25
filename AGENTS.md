# AGENTS.md

This file is for coding agents and future collaborators working on Loudroom / 大声练琴.

## Project Status

Current baseline: **0.1**.

The current app is a focused interactive Scale + Fretboard prototype. Keep changes scoped to this version unless the user explicitly asks to start a broader 0.2 direction.

## Repository Shape

This is an npm workspace.

```text
apps/web/           React + Vite + TypeScript app
docs/versions/      Version notes
packages/           Reserved for future shared libraries
```

Run commands from the repository root:

```bash
npm install
npm run dev
npm run build
```

Do not move app code back into the root directory. The root should stay as the workspace and documentation layer.

## Current Web App

Main files:

```text
apps/web/src/main.tsx
apps/web/src/styles.css
apps/web/src/vite-env.d.ts
```

## Libraries

Current runtime libraries:

- `react`: UI rendering.
- `react-dom`: DOM mounting.
- `lucide-react`: icons.
- `tone`: planned audio/sampler layer; current 0.1 audio still uses Web Audio API directly.

Current build/tooling libraries:

- `vite`: dev server and build.
- `@vitejs/plugin-react`: React support for Vite.
- `typescript`: type checking.
- `@types/react`: React type declarations.
- `@types/react-dom`: React DOM type declarations.

Icon rules:

- Use `lucide-react` for UI icons.
- Do not hand-write SVG icons unless there is no suitable lucide icon.
- Current playback icons:
  - Play: `Play`
  - Stop/pause playback state: `Pause`
  - Loop: `Repeat`

Current interaction model:

- Key is expanded as 12 direct buttons.
- Scale is a compact select, because the list will grow.
- Fretboard label mode is local to the fretboard.
- `Note` mode shows note names.
- `Degree` mode shows scale degrees.
- `Root` mode only labels root notes.
- Non-scale notes do not render marker dots.
- Scale notes and fretboard markers are clickable and must provide hover/click/focus feedback.
- `Play scale` must behave as a play/stop toggle and must not stack playback queues.
- Loop playback is controlled by a separate icon button beside play; when loop is off, playback runs once.

Current scales:

- Major
- Minor
- Dorian
- Phrygian
- Lydian
- Mixolydian
- Locrian
- Major Pentatonic
- Minor Pentatonic

## UI Direction

The visual direction is a dark, solid, component-library-like tool UI. It should feel closer to ChordKit's theory pages than to a glowing music visualizer.

Prefer:

- solid dark surfaces
- subtle borders
- compact controls
- clear hierarchy
- low-noise interaction states
- fretboard as the main visual object

Avoid:

- translucent neon panels
- glow effects
- huge rectangular controls where compact controls work
- repeating the same active style everywhere
- forcing controls to fill a row when their content does not need it
- excessive numbers on the fretboard

Specific current choices:

- Fret numbers are hidden; fret markers use dots at 3, 5, 7, 9 and double dots at 12.
- Scale summary uses centered circular note dots and Roman degrees.
- Scale summary root is not specially highlighted, because the current key is already emphasized elsewhere.
- Fretboard grid lines should be weaker than guitar string lines.
- Root markers and normal markers must keep distinct normal, hover, and click states.
- Hover/click transitions should be short and subtle.

## Documentation

Keep README aimed at humans using or understanding the project.

Keep AGENTS.md aimed at coding agents and contributors making changes.

Keep version-specific scope in `docs/versions/`.

When current behavior changes, update:

- `README.md` for user-facing project state
- `docs/versions/0.1.md` for version scope
- `AGENTS.md` for development and UI rules
