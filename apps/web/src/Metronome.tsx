import { useEffect, useRef } from "react";
import "./ambient-metronome/metronome-panel.js";
import "./ambient-metronome/metronome.js";
import "./ambient-metronome/metronome-panel.css";
import "./ambient-metronome/embedded.css";

type Engine = { state: { running:boolean; bpm:number; beatsPerBar:number; beatUnit:number; beatIndex:number; bar:number; countingIn:boolean }; update:(now:number)=>void; start:()=>void; pause:()=>void; reset:()=>void; ensureAudio:()=>AudioContext; setBpm:(v:number)=>number; setMeter:(n:number,d:number)=>void; setSubdivision:(v:string)=>void; setCountInBars:(v:number)=>void; setClickVolume:(v:number)=>void };
const api = window as unknown as { AmbientMetronome: {createMetronome:(options:object)=>Engine}; AmbientMetronomePanel:{render:(el:HTMLElement)=>void;setPlaying:(el:HTMLElement|null,running:boolean)=>void;pulse:(el:HTMLElement|null)=>void} };
export function Metronome() {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current!;
  api.AmbientMetronomePanel.render(el);
  const find=(id:string)=>el.querySelector<HTMLElement>("#"+id)!;
  const input=(id:string)=>find(id) as HTMLInputElement;
  const play=find("playPauseButton");
  const strip=find("beatStrip");
  const engine=api.AmbientMetronome.createMetronome({bpm:100,beatsPerBar:4,beatUnit:4,clickVolume:.45,onBeat:()=>api.AmbientMetronomePanel.pulse(play)});
  let frame=0, disposed=false;
  const paint=()=>{
   const s=engine.state;
   if(strip.children.length!==s.beatsPerBar) strip.innerHTML=Array.from({length:s.beatsPerBar},(_,i)=>`<span class="beat-dot${i===0?' downbeat':''}"></span>`).join("");
   Array.from(strip.children).forEach((dot,i)=>dot.classList.toggle("active",s.running&&s.beatIndex===i));
   find("tempoLabel").textContent=s.bpm+" BPM";
   find("meterLabel").textContent=`${s.beatsPerBar}/${s.beatUnit} · ${s.countingIn?'预备拍':'第 '+(s.beatIndex+1)+' 拍'} · ${s.bar} 小节`;
   api.AmbientMetronomePanel.setPlaying(play,s.running);
  };
  let rhythmPanelDismissed = false;
  let rhythmPanelHideTimer = 0;
  let lastRhythmPointerMove = 0;
function showRhythmPanel(duration = 2400) {
  rhythmPanelDismissed = false;
  if (!engine.state.running) {
    syncRhythmPanelVisibility();
    return;
  }

  document.body.classList.add("rhythm-visible");
  window.clearTimeout(rhythmPanelHideTimer);
  if (duration <= 0) {
    return;
  }
  rhythmPanelHideTimer = window.setTimeout(() => {
    if (!engine.state.running) {
      syncRhythmPanelVisibility();
      return;
    }
    if (el?.matches(":hover") || document.activeElement?.closest?.(".rhythm-panel")) {
      showRhythmPanel(1600);
      return;
    }
    document.body.classList.remove("rhythm-visible");
  }, duration);
}

function syncRhythmPanelVisibility() {
  window.clearTimeout(rhythmPanelHideTimer);
  document.body.classList.toggle("rhythm-pinned", !engine.state.running && !rhythmPanelDismissed);
  if (!engine.state.running) {
    document.body.classList.remove("rhythm-visible");
  }
}

function hideRhythmPanel() {
  rhythmPanelDismissed = true;
  document.body.classList.remove("rhythm-visible");
  syncRhythmPanelVisibility();
}

function handleRhythmPointerDown(event: PointerEvent) {
  if (el?.contains(event.target as Node)) {
    showRhythmPanel(0);
    return;
  }

  const isVisible = document.body.classList.contains("rhythm-visible") ||
    document.body.classList.contains("rhythm-pinned");
  if (isVisible) {
    hideRhythmPanel();
    return;
  }

  showRhythmPanel(0);
}

function handleRhythmPointerMove(event: PointerEvent) {
  if (event.pointerType && event.pointerType !== "mouse") {
    return;
  }

  const now = performance.now();
  if (now - lastRhythmPointerMove < 80) {
    return;
  }
  lastRhythmPointerMove = now;

  const proximity = window.innerWidth <= 680 ? 230 : 170;
  if (window.innerHeight - event.clientY <= proximity) {
    showRhythmPanel(engine.state.running ? 2200 : 0);
  }
}

  const events=new AbortController();
  const on=(id:string,event:string,fn:()=>void)=>find(id).addEventListener(event,fn,{signal:events.signal});
  window.addEventListener("pointerdown",handleRhythmPointerDown,{signal:events.signal});
  window.addEventListener("pointermove",handleRhythmPointerMove,{signal:events.signal});
  el.addEventListener("pointerenter",()=>showRhythmPanel(2600),{signal:events.signal});
  el.addEventListener("focusin",()=>showRhythmPanel(0),{signal:events.signal});
  el.addEventListener("focusout",()=>showRhythmPanel(1800),{signal:events.signal});
  el.addEventListener("pointerleave",()=>showRhythmPanel(1800),{signal:events.signal});
  el.addEventListener("input",()=>showRhythmPanel(0),{signal:events.signal});
  on("bpmInput","change",()=>{input("bpmInput").value=String(engine.setBpm(Number(input("bpmInput").value)));paint();});
  find("bpmInput").addEventListener("keydown",e=>{if((e as KeyboardEvent).key==="Enter") input("bpmInput").blur();},{signal:events.signal});
  on("meterSelect","change",()=>{const [n,d]=input("meterSelect").value.split("/").map(Number);engine.setMeter(n,d);paint();});
  on("subdivisionSelect","change",()=>engine.setSubdivision(input("subdivisionSelect").value));
  on("countInSelect","change",()=>engine.setCountInBars(Number(input("countInSelect").value)));
  on("clickVolumeInput","input",()=>{engine.setClickVolume(Number(input("clickVolumeInput").value)/100);find("clickVolumeLabel").textContent=input("clickVolumeInput").value+"%";});
  on("playPauseButton","click",()=>{if(engine.state.running){engine.pause();paint();syncRhythmPanelVisibility();}else{const context=engine.ensureAudio();void context.resume().then(()=>{if(!disposed){engine.start();paint();syncRhythmPanelVisibility();showRhythmPanel(1800);}});}});
  on("rhythmResetButton","click",()=>{engine.reset();paint();});
  const tick=(now:number)=>{engine.update(now);const s=engine.state;Array.from(strip.children).forEach((dot,i)=>dot.classList.toggle("active",s.running&&s.beatIndex===i));find("meterLabel").textContent=`${s.beatsPerBar}/${s.beatUnit} · ${s.countingIn?'预备拍':'第 '+(s.beatIndex+1)+' 拍'} · ${s.bar} 小节`;frame=requestAnimationFrame(tick);};
  paint();syncRhythmPanelVisibility();frame=requestAnimationFrame(tick);
  return()=>{disposed=true;window.clearTimeout(rhythmPanelHideTimer);document.body.classList.remove("rhythm-visible","rhythm-pinned");events.abort();cancelAnimationFrame(frame);engine.pause();const context=engine.ensureAudio();void context.close();el.innerHTML="";};
 },[]);
 return <section className="ambient-metronome-section" aria-label="节拍器"><div ref={host} data-metronome-panel data-bpm="100" data-meters="simple" data-locale="zh-CN" /></section>;
}
