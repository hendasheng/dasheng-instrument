import { StrictMode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { Music2, Pause, Play, Repeat } from "lucide-react";
import "./styles.css";

type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

type ScalePattern = {
  name: string;
  intervals: number[];
  degrees: string[];
};

type FretboardLabelMode = "note" | "degree" | "root";
type FretboardPositionMode = "all" | "caged";
type CagedShape = "C" | "A" | "G" | "E" | "D";

const NOTE_NAMES: NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const SCALES: ScalePattern[] = [
  {
    name: "Major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
  },
  {
    name: "Minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["1", "2", "b3", "4", "5", "b6", "b7"],
  },
  {
    name: "Dorian",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["1", "2", "b3", "4", "5", "6", "b7"],
  },
  {
    name: "Phrygian",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ["1", "b2", "b3", "4", "5", "b6", "b7"],
  },
  {
    name: "Lydian",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ["1", "2", "3", "#4", "5", "6", "7"],
  },
  {
    name: "Mixolydian",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["1", "2", "3", "4", "5", "6", "b7"],
  },
  {
    name: "Locrian",
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: ["1", "b2", "b3", "4", "b5", "b6", "b7"],
  },
  {
    name: "Major Pentatonic",
    intervals: [0, 2, 4, 7, 9],
    degrees: ["1", "2", "3", "5", "6"],
  },
  {
    name: "Minor Pentatonic",
    intervals: [0, 3, 5, 7, 10],
    degrees: ["1", "b3", "4", "5", "b7"],
  },
];

const TUNING: Array<{ string: number; open: NoteName; midi: number }> = [
  { string: 1, open: "E", midi: 64 },
  { string: 2, open: "B", midi: 59 },
  { string: 3, open: "G", midi: 55 },
  { string: 4, open: "D", midi: 50 },
  { string: 5, open: "A", midi: 45 },
  { string: 6, open: "E", midi: 40 },
];

const FRETS = Array.from({ length: 16 }, (_, fret) => fret);
const SCALE_NOTE_INTERVAL_MS = 260;
const SCALE_LOOP_GAP_MS = SCALE_NOTE_INTERVAL_MS * 2;
const CAGED_SHAPES: CagedShape[] = ["C", "A", "G", "E", "D"];
const CAGED_SHAPE_STARTS: Record<CagedShape, number> = {
  C: 0,
  A: 2,
  G: 5,
  E: 7,
  D: 9,
};
const FRETBOARD_LABEL_MODES: Array<{ id: FretboardLabelMode; label: string }> = [
  { id: "note", label: "Note" },
  { id: "degree", label: "Degree" },
  { id: "root", label: "Root" },
];

function noteAt(root: NoteName, semitones: number): NoteName {
  return NOTE_NAMES[(NOTE_NAMES.indexOf(root) + semitones) % NOTE_NAMES.length];
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function isFretInCagedShape(fret: number, root: NoteName, shape: CagedShape) {
  const rootOffset = NOTE_NAMES.indexOf(root);
  let shapeStart = CAGED_SHAPE_STARTS[shape] + rootOffset;

  if (shapeStart > 12) {
    shapeStart -= 12;
  }

  return fret >= shapeStart && fret <= shapeStart + 3;
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
}

function playMidi(midi: number) {
  const audioContext = getAudioContext();
  if (!audioContext) {
    return;
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.value = midiToFrequency(midi);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1600, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
  oscillator.start(now);
  oscillator.stop(now + 0.8);
}

function getScaleNotes(root: NoteName, scale: ScalePattern) {
  return scale.intervals.map((interval, index) => ({
    note: noteAt(root, interval),
    degree: scale.degrees[index],
    romanDegree: toRomanDegree(scale.degrees[index]),
    interval,
  }));
}

function toRomanDegree(degree: string) {
  const romanByDegree: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "V",
    "6": "VI",
    "7": "VII",
    b2: "bII",
    b3: "bIII",
    "#4": "#IV",
    b5: "bV",
    b6: "bVI",
    b7: "bVII",
  };

  return romanByDegree[degree] ?? degree;
}

function App() {
  const [keyNote, setKeyNote] = useState<NoteName>("C");
  const [selectedScale, setSelectedScale] = useState(SCALES[0]);
  const [labelMode, setLabelMode] = useState<FretboardLabelMode>("note");
  const [positionMode, setPositionMode] = useState<FretboardPositionMode>("all");
  const [cagedShape, setCagedShape] = useState<CagedShape>("C");
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [isLoopingScale, setIsLoopingScale] = useState(false);
  const [playingNote, setPlayingNote] = useState<NoteName | null>(null);
  const scaleTimeouts = useRef<number[]>([]);
  const playingNoteTimeout = useRef<number | null>(null);
  const isLoopingScaleRef = useRef(false);
  const rootMidi = 60 + NOTE_NAMES.indexOf(keyNote);
  const scaleNotes = useMemo(
    () => getScaleNotes(keyNote, selectedScale),
    [keyNote, selectedScale],
  );
  const scaleNoteSet = useMemo(
    () => new Set(scaleNotes.map(({ note }) => note)),
    [scaleNotes],
  );
  const degreeByNote = useMemo(
    () => new Map(scaleNotes.map(({ note, degree }) => [note, degree])),
    [scaleNotes],
  );

  function stopScale() {
    scaleTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    scaleTimeouts.current = [];
    if (playingNoteTimeout.current !== null) {
      window.clearTimeout(playingNoteTimeout.current);
      playingNoteTimeout.current = null;
    }
    setPlayingNote(null);
    setIsPlayingScale(false);
  }

  function showPlayingNote(note: NoteName) {
    if (playingNoteTimeout.current !== null) {
      window.clearTimeout(playingNoteTimeout.current);
    }

    setPlayingNote(note);
    playingNoteTimeout.current = window.setTimeout(() => {
      setPlayingNote(null);
      playingNoteTimeout.current = null;
    }, 190);
  }

  function scheduleScalePlayback() {
    scaleTimeouts.current = selectedScale.intervals.map((interval, index) =>
      window.setTimeout(() => {
        playMidi(rootMidi + interval);
        showPlayingNote(noteAt(keyNote, interval));

        if (index === selectedScale.intervals.length - 1) {
          scaleTimeouts.current = [];

          if (isLoopingScaleRef.current) {
            scaleTimeouts.current = [
              window.setTimeout(() => {
                if (isLoopingScaleRef.current) {
                  scheduleScalePlayback();
                } else {
                  scaleTimeouts.current = [];
                  setIsPlayingScale(false);
                }
              }, SCALE_LOOP_GAP_MS),
            ];
          } else {
            setIsPlayingScale(false);
          }
        }
      }, index * SCALE_NOTE_INTERVAL_MS),
    );
  }

  function toggleScalePlayback() {
    if (isPlayingScale) {
      stopScale();
      return;
    }

    stopScale();
    setIsPlayingScale(true);
    scheduleScalePlayback();
  }

  function toggleScaleLoop() {
    setIsLoopingScale((currentValue) => {
      const nextValue = !currentValue;
      isLoopingScaleRef.current = nextValue;
      return nextValue;
    });
  }

  function selectScale(scaleName: string) {
    const nextScale = SCALES.find((scale) => scale.name === scaleName);

    if (nextScale) {
      setSelectedScale(nextScale);
    }
  }

  function getFretLabel(note: NoteName, degree?: string) {
    if (labelMode === "note") {
      return note;
    }

    if (labelMode === "degree") {
      return degree;
    }

    return note === keyNote ? note : "";
  }

  useEffect(() => stopScale, []);

  useEffect(() => {
    isLoopingScaleRef.current = isLoopingScale;
  }, [isLoopingScale]);

  useEffect(() => {
    stopScale();
  }, [keyNote, selectedScale]);

  useEffect(() => {
    function toggleFullscreen(event: KeyboardEvent) {
      const target = event.target;
      const isEditing = target instanceof HTMLElement
        && (target.matches("input, select, textarea") || target.isContentEditable);

      if (
        event.key.toLowerCase() !== "f"
        || event.repeat
        || isEditing
        || !window.matchMedia("(min-width: 821px)").matches
      ) {
        return;
      }

      event.preventDefault();

      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void document.documentElement.requestFullscreen();
      }
    }

    window.addEventListener("keydown", toggleFullscreen);
    return () => window.removeEventListener("keydown", toggleFullscreen);
  }, []);

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Project">
        <div className="brand-group">
          <div className="brand-mark">
            <Music2 size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Loudroom / 大声练琴</p>
            <h1>Scale on Fretboard</h1>
          </div>
        </div>
        <div className="current-context" aria-label="Current practice context">
          <span>{keyNote}</span>
          <strong>{selectedScale.name}</strong>
        </div>
      </section>

      <section className="practice-layout">
        <section className="control-panel" aria-label="Practice controls">
          <div className="control-row">
            <div className="control-group">
              <p className="panel-label">Key</p>
              <div className="note-grid">
                {NOTE_NAMES.map((note) => (
                  <button
                    className={note === keyNote ? "note-button active" : "note-button"}
                    key={note}
                    type="button"
                    onClick={() => {
                      setKeyNote(note);
                      playMidi(60 + NOTE_NAMES.indexOf(note));
                    }}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group scale-control">
              <p className="panel-label">Scale</p>
              <select
                className="scale-select"
                value={selectedScale.name}
                onChange={(event) => selectScale(event.target.value)}
              >
                {SCALES.map((scale) => (
                  <option key={scale.name} value={scale.name}>
                    {scale.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="workbench" aria-label="Interactive scale and fretboard">
          <div className="workbench-head">
            <div>
              <p className="panel-label">Fretboard Map</p>
              <h2>{keyNote} {selectedScale.name}</h2>
            </div>
            <div className="fretboard-tools">
              <div className="scale-playback-controls">
                <div className="play-control">
                  <button
                    className={[
                      "play-scale",
                      isPlayingScale ? "playing" : "",
                      playingNote ? "beat" : "",
                    ].join(" ")}
                    type="button"
                    onClick={toggleScalePlayback}
                    aria-label={isPlayingScale ? "Stop scale playback" : "Play scale"}
                  >
                    {isPlayingScale ? (
                      <Pause size={15} aria-hidden="true" />
                    ) : (
                      <Play size={15} aria-hidden="true" />
                    )}
                    <i className="play-signal" aria-hidden="true" />
                  </button>
                  <span>Play scale</span>
                </div>
                <button
                  className={isLoopingScale ? "loop-scale active" : "loop-scale"}
                  type="button"
                  onClick={toggleScaleLoop}
                  aria-pressed={isLoopingScale}
                  aria-label={isLoopingScale ? "Turn scale loop off" : "Turn scale loop on"}
                  title={isLoopingScale ? "Loop on" : "Loop off"}
                >
                  <Repeat size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="fretboard-prebar">
            <div className="scale-strip">
              {scaleNotes.map(({ note, degree, romanDegree, interval }) => (
                <button
                  className={[
                    "scale-note",
                    degree === "1" ? "root" : "",
                    note === playingNote ? "playing" : "",
                  ].join(" ")}
                  key={`${note}-${degree}`}
                  type="button"
                  onClick={() => playMidi(rootMidi + interval)}
                  title={`Play ${note}`}
                >
                  <span>{note}</span>
                  <small>{romanDegree}</small>
                </button>
              ))}
            </div>

            <div className="fretboard-viewbar">
              <div className="fretboard-option-row">
                <span>Position</span>
                <div className="position-list" aria-label="Fretboard position system">
                  <button
                    className={positionMode === "all" ? "position-button active" : "position-button"}
                    type="button"
                    onClick={() => setPositionMode("all")}
                  >
                    All
                  </button>
                  <div className="caged-list" aria-label="CAGED shape">
                    {CAGED_SHAPES.map((shape) => (
                      <button
                        className={positionMode === "caged" && shape === cagedShape
                          ? "caged-button active"
                          : "caged-button"}
                        key={shape}
                        type="button"
                        onClick={() => {
                          setCagedShape(shape);
                          setPositionMode("caged");
                        }}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fretboard-option-row">
                <span>Labels</span>
                <div className="mode-list" aria-label="Fretboard label mode">
                  {FRETBOARD_LABEL_MODES.map((mode) => (
                    <button
                      className={mode.id === labelMode ? "mode-button active" : "mode-button"}
                      key={mode.id}
                      type="button"
                      onClick={() => setLabelMode(mode.id)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="fretboard" role="grid" aria-label="Guitar fretboard">
            <div className="fret-header" aria-hidden="true">
              <span />
              {FRETS.map((fret) => (
                <span
                  className="fret-marker"
                  key={fret}
                  style={{ "--fret-row": fret + 2 } as CSSProperties}
                >
                  {[3, 5, 7, 9].includes(fret) ? <i /> : null}
                  {fret === 12 ? (
                    <>
                      <i />
                      <i />
                    </>
                  ) : null}
                </span>
              ))}
            </div>

            {TUNING.map((guitarString) => (
              <div
                className="string-row"
                key={guitarString.string}
                role="row"
                style={{ "--string-column": 8 - guitarString.string } as CSSProperties}
              >
                <div className="string-label">
                  <span>{guitarString.string}</span>
                  <small>{guitarString.open}</small>
                </div>
                {FRETS.map((fret) => {
                  const note = noteAt(guitarString.open, fret);
                  const inScale = scaleNoteSet.has(note);
                  const isRoot = note === keyNote;
                  const inSelectedPosition = positionMode === "all"
                    || isFretInCagedShape(fret, keyNote, cagedShape);
                  const degree = degreeByNote.get(note);
                  const fretLabel = getFretLabel(note, degree);

                  return (
                    <button
                      className={[
                        "fret-cell",
                        inScale ? "in-scale" : "",
                        isRoot ? "root" : "",
                        inScale && !inSelectedPosition ? "position-muted" : "",
                      ].join(" ")}
                      key={`${guitarString.string}-${fret}`}
                      style={{ "--fret-row": fret + 2 } as CSSProperties}
                      type="button"
                      onClick={() => playMidi(guitarString.midi + fret)}
                      role="gridcell"
                      aria-label={`String ${guitarString.string}, fret ${fret}, ${note}`}
                    >
                      {inScale ? <span>{fretLabel}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
