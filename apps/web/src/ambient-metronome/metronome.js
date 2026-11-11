(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const offbeatSound = {
    type: "triangle",
    frequency: 740,
    level: 0.38,
    attack: 0.003,
    decay: 0.055,
    stop: 0.076,
  };

  function createMetronome(options = {}) {
    const state = {
      running: false,
      bpm: clamp(Math.round(Number(options.bpm) || 120), 40, 240),
      beatsPerBar: clamp(Math.round(Number(options.beatsPerBar) || 4), 1, 12),
      beatUnit: clamp(Math.round(Number(options.beatUnit) || 4), 1, 16),
      subdivision: options.subdivision || "auto",
      countInBars: clamp(Math.round(Number(options.countInBars) || 0), 0, 2),
      countingIn: false,
      countInBeatsRemaining: 0,
      countInTotalBeats: 0,
      beatIndex: 0,
      bar: 1,
      startAt: performance.now(),
      nextBeatAt: 0,
      nextOffbeatAt: 0,
      lastBeatAt: performance.now(),
      audioContext: null,
      masterGain: null,
      clickVolume: clamp(Number(options.clickVolume) || 0, 0, 1),
      offbeatEnabled: Boolean(options.offbeatEnabled),
      suspended: false,
      suspendedAt: 0,
    };

    const onChange = typeof options.onChange === "function" ? options.onChange : null;
    const onBeat = typeof options.onBeat === "function" ? options.onBeat : null;
    const onState = typeof options.onState === "function" ? options.onState : null;
    const outputState = Boolean(options.outputState);
    const beatClickEnabled = options.beatClickEnabled !== false;

    function getOutput(now = performance.now(), event = "frame", accent = state.beatIndex === 0) {
      if (!outputState) {
        return null;
      }

      return Object.freeze({
        event,
        timestamp: now,
        running: state.running,
        suspended: state.suspended,
        bpm: state.bpm,
        intervalMs: intervalMs(),
        beatsPerBar: state.beatsPerBar,
        beatUnit: state.beatUnit,
        subdivision: state.subdivision,
        offbeatEnabled: state.offbeatEnabled,
        clickVolume: state.clickVolume,
        countingIn: state.countingIn,
        countInBars: state.countInBars,
        countInTotalBeats: state.countInTotalBeats,
        countInBeatsRemaining: state.countInBeatsRemaining,
        beatIndex: state.beatIndex,
        beatNumber: state.beatIndex + 1,
        bar: state.bar,
        accent,
        beatProgress: beatProgress(now),
        pulse: pulse(now),
        startAt: state.startAt,
        lastBeatAt: state.lastBeatAt,
        nextBeatAt: state.nextBeatAt,
        nextOffbeatAt: state.nextOffbeatAt,
      });
    }

    function emitState(event, now = performance.now(), accent = state.beatIndex === 0) {
      if (outputState && onState) {
        onState(getOutput(now, event, accent));
      }
    }

    function emitChange() {
      if (onChange) {
        onChange(state);
      }
      emitState("change");
    }

    function emitBeat(accent) {
      if (onBeat) {
        onBeat(state, accent);
      }
      emitState("beat", state.lastBeatAt, accent);
    }

    function intervalMs() {
      return 60000 / state.bpm;
    }

    function ensureAudio() {
      if (state.audioContext) {
        return state.audioContext;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = state.clickVolume;
      state.masterGain.connect(state.audioContext.destination);
      return state.audioContext;
    }

    function scheduleClick(accent, offbeat = false) {
      if (!state.audioContext || !state.masterGain) {
        return;
      }

      const now = state.audioContext.currentTime;
      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      const frequency = offbeat ? offbeatSound.frequency : accent ? 1320 : 880;
      const level = offbeat ? offbeatSound.level : accent ? 0.9 : 0.58;

      osc.type = offbeat ? offbeatSound.type : "square";
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + (offbeat ? offbeatSound.attack : 0.004));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (offbeat ? offbeatSound.decay : 0.055));
      osc.connect(gain);
      gain.connect(state.masterGain);
      osc.start(now);
      osc.stop(now + (offbeat ? offbeatSound.stop : 0.07));
    }

    function stepOffbeat() {
      scheduleClick(false, true);
      emitState("offbeat");
    }

    function advanceCountInBeat(now) {
      const countIndex = state.countInTotalBeats - state.countInBeatsRemaining;
      state.beatIndex = countIndex % state.beatsPerBar;
      state.bar = 1;
      state.lastBeatAt = now;
      state.countInBeatsRemaining -= 1;
      const accent = state.beatIndex === 0;
      if (beatClickEnabled) scheduleClick(accent);
      emitBeat(accent);
    }

    function stepBeat(now = performance.now()) {
      if (state.countingIn) {
        if (state.countInBeatsRemaining <= 0) {
          state.countingIn = false;
          state.beatIndex = 0;
          state.bar = 1;
          state.startAt = now;
          state.lastBeatAt = now;
          if (beatClickEnabled) scheduleClick(true);
          emitBeat(true);
          emitChange();
          return;
        }

        advanceCountInBeat(now);
        emitChange();
        return;
      }

      state.beatIndex += 1;
      if (state.beatIndex >= state.beatsPerBar) {
        state.beatIndex = 0;
        state.bar += 1;
      }

      state.lastBeatAt = now;
      const accent = state.beatIndex === 0;
      if (beatClickEnabled) scheduleClick(accent);
      emitBeat(accent);
      emitChange();
    }

    function update(now = performance.now()) {
      if (!state.running) {
        return;
      }

      while (now >= state.nextBeatAt || (state.offbeatEnabled && now >= state.nextOffbeatAt)) {
        if (state.offbeatEnabled && state.nextOffbeatAt < state.nextBeatAt) {
          stepOffbeat();
          state.nextOffbeatAt += intervalMs();
          continue;
        }

        stepBeat(now);
        state.nextBeatAt += intervalMs();
        if (state.nextOffbeatAt < state.nextBeatAt - intervalMs() * 0.5) {
          state.nextOffbeatAt = state.nextBeatAt - intervalMs() * 0.5;
        }
      }
    }

    function start(now = performance.now()) {
      state.running = true;
      state.suspended = false;
      state.lastBeatAt = now;
      state.nextBeatAt = now + intervalMs();
      state.nextOffbeatAt = now + intervalMs() * 0.5;
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      state.countInBeatsRemaining = state.countInTotalBeats;
      state.countingIn = state.countInTotalBeats > 0;

      if (state.countingIn) {
        state.startAt = now + state.countInTotalBeats * intervalMs();
        advanceCountInBeat(now);
      } else {
        state.startAt = now;
        const accent = state.beatIndex === 0;
        if (beatClickEnabled) scheduleClick(accent);
        emitBeat(accent);
      }
      emitChange();
    }

    function pause() {
      state.running = false;
      state.suspended = false;
      state.countingIn = false;
      state.countInBeatsRemaining = 0;
      emitChange();
    }

    function suspend(now = performance.now()) {
      if (!state.running) return;
      state.running = false;
      state.suspended = true;
      state.suspendedAt = now;
      emitChange();
    }

    function resume(now = performance.now()) {
      if (!state.suspended) return;
      const offset = Math.max(0, now - state.suspendedAt);
      state.running = true;
      state.suspended = false;
      state.startAt += offset;
      state.lastBeatAt += offset;
      state.nextBeatAt += offset;
      state.nextOffbeatAt += offset;
      emitChange();
    }

    function reset(now = performance.now()) {
      state.beatIndex = 0;
      state.bar = 1;
      state.countingIn = false;
      state.suspended = false;
      state.countInBeatsRemaining = 0;
      state.lastBeatAt = now;
      state.startAt = now;
      state.nextBeatAt = now;
      state.nextOffbeatAt = now + intervalMs() * 0.5;
      emitChange();
    }

    function setBpm(value) {
      state.bpm = clamp(Math.round(Number(value) || state.bpm), 40, 240);
      emitChange();
      return state.bpm;
    }

    function setBeatsPerBar(value, now = performance.now()) {
      state.beatsPerBar = clamp(Math.round(Number(value) || state.beatsPerBar), 1, 12);
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;

      if (!state.running) {
        state.beatIndex = 0;
        state.bar = 1;
        state.countingIn = false;
        state.countInBeatsRemaining = 0;
        state.startAt = now;
        state.lastBeatAt = now;
        emitChange();
        return state.beatsPerBar;
      }

      state.lastBeatAt = now;
      state.nextBeatAt = now + intervalMs();
      state.nextOffbeatAt = now + intervalMs() * 0.5;

      if (state.countingIn) {
        state.countInBeatsRemaining = state.countInTotalBeats;
        state.bar = 1;
        state.startAt = now + state.countInTotalBeats * intervalMs();
        advanceCountInBeat(now);
      } else {
        state.beatIndex = 0;
        state.bar = 1;
        state.startAt = now;
        if (beatClickEnabled) scheduleClick(true);
        emitBeat(true);
      }

      emitChange();
      return state.beatsPerBar;
    }

    function setSubdivision(value) {
      state.subdivision = value || "auto";
      emitChange();
      return state.subdivision;
    }

    function setMeter(beatsPerBar, beatUnit = state.beatUnit, now = performance.now()) {
      state.beatUnit = clamp(Math.round(Number(beatUnit) || state.beatUnit), 1, 16);
      return setBeatsPerBar(beatsPerBar, now);
    }

    function setCountInBars(value) {
      state.countInBars = clamp(Math.round(Number(value) || 0), 0, 2);
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      emitChange();
      return state.countInBars;
    }

    function setClickVolume(value) {
      state.clickVolume = clamp(Number(value) || 0, 0, 1);
      if (state.masterGain) {
        state.masterGain.gain.value = state.clickVolume;
      }
      emitChange();
      return state.clickVolume;
    }

    function setOffbeatEnabled(value) {
      state.offbeatEnabled = Boolean(value);
      const now = performance.now();
      const interval = intervalMs();
      state.nextOffbeatAt = state.lastBeatAt + interval * 0.5;
      while (state.running && state.nextOffbeatAt <= now) {
        state.nextOffbeatAt += interval;
      }
      emitChange();
      return state.offbeatEnabled;
    }

    function beatProgress(now = performance.now()) {
      if (!state.running) {
        return 0;
      }
      return clamp((now - state.lastBeatAt) / intervalMs(), 0, 1);
    }

    function pulse(now = performance.now()) {
      return Math.max(0, 1 - (now - state.lastBeatAt) / 180);
    }

    return {
      state,
      intervalMs,
      ensureAudio,
      update,
      start,
      pause,
      suspend,
      resume,
      reset,
      setBpm,
      setBeatsPerBar,
      setMeter,
      setSubdivision,
      setCountInBars,
      setClickVolume,
      setOffbeatEnabled,
      beatProgress,
      pulse,
      getOutput,
    };
  }

  window.AmbientMetronome = {
    createMetronome,
  };
}());
