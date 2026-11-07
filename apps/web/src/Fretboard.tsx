import type { CSSProperties } from "react";
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
type NoteName = typeof NOTE_NAMES[number];
export const GUITAR_STRINGS: Array<{ string: number; open: NoteName; midi: number }> = [
  { string: 1, open: "E", midi: 64 },
  { string: 2, open: "B", midi: 59 },
  { string: 3, open: "G", midi: 55 },
  { string: 4, open: "D", midi: 50 },
  { string: 5, open: "A", midi: 45 },
  { string: 6, open: "E", midi: 40 },
];

export type Marker = { label: string; root?: boolean; muted?: boolean };
export function Fretboard({ frets = Array.from({length:16},(_,i)=>i), getMarker, onPlay, voicing = false, barre, mutedStrings = [], openStrings = [], label = "Guitar fretboard" }: {
 barre?: { fret:number; from:number; to:number }; frets?: number[]; getMarker: (string:number, fret:number, midi:number, note:NoteName)=>Marker | null;
 onPlay:(midi:number)=>void; voicing?:boolean; mutedStrings?:number[]; openStrings?:number[]; label?:string;
}) {
 return (
          <div className={`fretboard ${voicing ? "voicing-board" : ""}`} style={{ "--fret-count": frets.length } as CSSProperties} role="grid" aria-label={label}>
            <div className="fret-header" aria-hidden="true">
              <span />
              {frets.map((fret) => (
                <span
                  className={fret === 0 ? "fret-marker open-string" : "fret-marker"}
                  key={fret}
                  style={{ "--fret-row": frets.indexOf(fret) + 2 } as CSSProperties}
                >
                  {fret === 0 ? "0" : null}
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

            {GUITAR_STRINGS.map((guitarString) => (
              <div
                className="string-row"
                key={guitarString.string}
                role="row"
                style={{ "--string-column": 8 - guitarString.string } as CSSProperties}
              >
                <div className="string-label">
                  <span>{voicing ? (mutedStrings.includes(guitarString.string) ? "×" : openStrings.includes(guitarString.string) ? "○" : "") : guitarString.string}</span>
                  {!voicing && <small>{guitarString.open}</small>}
                </div>
                {frets.map((fret) => {
                  const midi = guitarString.midi + fret;
                  const note = NOTE_NAMES[midi % 12];
                  const marker = getMarker(guitarString.string, fret, midi, note);
                  const inScale = !!marker;
                  const isRoot = marker?.root;
                  const inSelectedPosition = !marker?.muted;
                  const fretLabel = marker?.label;

                  return (
                    <button
                      className={[
                        "fret-cell",
                        barre && fret === barre.fret && guitarString.string >= barre.from && guitarString.string <= barre.to ? "barre-cell" : "",
                        barre && guitarString.string === barre.from ? "barre-first" : "",
                        barre && guitarString.string === barre.to ? "barre-last" : "",
                        fret === 0 ? "open-string" : "",
                        inScale ? "in-scale" : "",
                        isRoot ? "root" : "",
                        inScale && !inSelectedPosition ? "position-muted" : "",
                      ].join(" ")}
                      key={`${guitarString.string}-${fret}`}
                      style={{ "--fret-row": frets.indexOf(fret) + 2 } as CSSProperties}
                      type="button"
                      onClick={() => onPlay(guitarString.midi + fret)}
                      disabled={voicing && !marker}
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
 );
}
