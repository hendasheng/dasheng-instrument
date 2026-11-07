import { useId, useState } from "react";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { Fretboard } from "./Fretboard";

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const OPEN: Record<string, number[]> = { C: [-1,3,2,0,1,0], D: [-1,-1,0,2,3,2], E: [0,2,2,1,0,0], F: [1,3,3,2,1,1], G: [3,2,0,0,0,3], A: [-1,0,2,2,2,0], Am: [-1,0,2,2,1,0], Dm: [-1,-1,0,2,3,1], Em: [0,2,2,0,0,0], G7: [3,2,0,0,0,1], A7: [-1,0,2,0,2,0], B7: [-1,2,1,2,0,2], C7: [-1,3,2,3,1,0], D7: [-1,-1,0,2,1,2], E7: [0,2,0,1,0,0] };
const TUNING = [40,45,50,55,59,64];
const DEGREES = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "V7"];
const OFFSETS = [0,2,4,5,7,9,11,7];
export function makeChord(key: number, index: number) {
  const root = (key + OFFSETS[index]) % 12;
  const quality = index === 6 ? "dim" : index === 7 ? "7" : [1,2,5].includes(index) ? "m" : "";
  const name = NAMES[root] + quality;
  const r = (root - 4 + 12) % 12;
  const a = (root - 9 + 12) % 12;
  const frets = OPEN[name] ?? (quality === "dim" ? [-1,a,a+1,a+2,a+1,-1] : quality === "7" ? [r,r+2,r,r+1,r,r] : quality === "m" ? [r,r+2,r+2,r,r,r] : [r,r+2,r+2,r+1,r,r]);
  const intervals = quality === "dim" ? [0,3,6] : quality === "m" ? [0,3,7] : quality === "7" ? [0,4,7,10] : [0,4,7];
  return { name, frets, notes: intervals.map(n => (root+n)%12), midi: frets.flatMap((f,i) => f < 0 ? [] : [TUNING[i]+f]) };
}
function ChordCard({ root, index, onPlay }: { root:number; index:number; onPlay:(midi:number)=>void }) {
  const chord = makeChord(root,index);
  const start = Math.max(1,Math.min(...chord.frets.filter(f=>f>0)));
  const min = Math.min(...chord.frets.filter(f=>f>0));
  const held = chord.frets.flatMap((f,i)=>f===min?[6-i]:[]);
  const barre = !chord.frets.includes(0) && held.length >= 2 ? {fret:min,from:Math.min(...held),to:Math.max(...held)} : undefined;
  const frets = [0,...Array.from({length:4},(_,i)=>start+i)];
  return <article className="chord-card">
    <header><div><small>{DEGREES[index]}</small><strong>{chord.name}</strong></div><button className="play-scale" type="button" title={`试听 ${chord.name}`} aria-label={`试听 ${chord.name}`} onClick={()=>chord.midi.forEach(onPlay)}><Play size={15} aria-hidden="true" /></button></header>
    <Fretboard voicing barre={barre} frets={frets} label={`${chord.name} 实际按法`}
      mutedStrings={chord.frets.flatMap((f,i)=>f<0?[6-i]:[])}
      openStrings={chord.frets.flatMap((f,i)=>f===0?[6-i]:[])}
      onPlay={onPlay} getMarker={(string,fret,midi,note)=>chord.frets[6-string]===fret?{label:note,root:midi%12===chord.notes[0]}:null} />
  </article>;
}
export function Chords({root,onPlay}:{root:number;onPlay:(midi:number)=>void}) {
  const [expanded,setExpanded] = useState(true);
  const contentId = useId();
  return <section className="chord-panel" aria-label="Diatonic chords">
    <div className="chord-heading"><div><p className="panel-label">Diatonic chords · Major</p><h2>{NAMES[root]} 大调和弦</h2></div><button className="chord-collapse" type="button" aria-expanded={expanded} aria-controls={contentId} aria-label={expanded ? "收起和弦" : "展开和弦"} title={expanded ? "收起和弦" : "展开和弦"} onClick={()=>setExpanded(value=>!value)}>{expanded ? <ChevronUp size={16} aria-hidden="true"/> : <ChevronDown size={16} aria-hidden="true"/>}</button></div>
    <div id={contentId} hidden={!expanded}><div className="chord-grid">{Array.from({length:7},(_,index)=><ChordCard key={index} root={root} index={index} onPlay={onPlay}/>)}</div>
    <div className="dominant-chord"><p className="panel-label">属七和弦 · V7</p><ChordCard root={root} index={7} onPlay={onPlay}/></div>
  </div></section>;
}
