let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  gain = 0.16,
  type: OscillatorType = "sine",
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  correct(enabled: boolean) {
    if (!enabled) return;
    tone(660, 0, 0.12);
    tone(880, 0.08, 0.16);
  },
  snap(enabled: boolean) {
    if (!enabled) return;
    tone(587, 0, 0.08, 0.2, "sine");
    tone(880, 0.06, 0.14, 0.22, "triangle");
    tone(1175, 0.12, 0.2, 0.24, "sine");
  },
  place(enabled: boolean) {
    if (!enabled) return;
    tone(320, 0, 0.08, 0.12, "triangle");
  },
  wrong(enabled: boolean) {
    if (!enabled) return;
    tone(220, 0, 0.14, 0.1, "triangle");
  },
  click(enabled: boolean) {
    if (!enabled) return;
    tone(520, 0, 0.08, 0.1, "triangle");
  },
  win(enabled: boolean) {
    if (!enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.24, 0.18));
  },
  badge(enabled: boolean) {
    if (!enabled) return;
    [784, 988, 1319].forEach((f, i) => tone(f, i * 0.1, 0.2, 0.14, "triangle"));
  },
};

/* --- Simple looping cheerful background melody built with WebAudio --- */
let musicTimer: ReturnType<typeof setInterval> | null = null;

const MELODY = [523, 587, 659, 784, 659, 587, 523, 587, 659, 523, 784, 659];

export function startMusic() {
  if (musicTimer) return;
  const c = getCtx();
  if (!c) return;
  let i = 0;
  const step = () => {
    tone(MELODY[i % MELODY.length], 0, 0.35, 0.05, "sine");
    tone(MELODY[i % MELODY.length] / 2, 0, 0.4, 0.03, "triangle");
    i++;
  };
  step();
  musicTimer = setInterval(step, 420);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
