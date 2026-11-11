# Ambient Beat metronome integration

Source: C:/Users/HenDaSheng/Desktop/ambient-beat/shared/metronome/

metronome.js, metronome-panel.js and metronome-panel.css are copied from the shared implementation. LICENSE preserves the source license. Metronome.tsx only connects React lifecycle, panel controls, engine updates and the original panel visibility behavior. embedded.css supplies theme variables; it does not stretch or embed the floating panel.

The panel retains its bottom floating placement, 520px maximum width and responsive source layout. It is initially visible, auto-hides during playback, remains visible while hovered/focused, can be toggled by page click, and reappears when the pointer approaches the bottom. Key/Scale and the rest of the 0.1 layout are restored.

No changes to the source Ambient Beat project or Xiaohongshu minitool are included.

Portrait screens raise the floating panel at least 44px from the bottom, accounting for the system safe area plus 24px. Landscape keeps the source default. Placement changes use the shared --metronome-panel-bottom variable.
