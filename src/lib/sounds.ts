/**
 * Game audio — real Aviator crash assets + WebAudio fallbacks.
 */

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slide?: number;
};

const ASSETS = {
  takeOff: "/aviator/sound/take_off.mp3",
  cashout: "/aviator/sound/cashout.mp3",
  flewAway: "/aviator/sound/flew_away.mp3",
  main: "/aviator/sound/main.wav",
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private cache = new Map<string, HTMLAudioElement>();
  muted = false;
  musicOn = true;
  sfxOn = true;
  private volume = 0.65;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.28;
      this.sfxGain.gain.value = 0.85;
      this.master.gain.value = this.volume;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getAudio(src: string) {
    let a = this.cache.get(src);
    if (!a) {
      a = new Audio(src);
      a.preload = "auto";
      this.cache.set(src, a);
    }
    return a;
  }

  private playFile(src: string, vol = 0.7) {
    if (this.muted || !this.sfxOn || typeof window === "undefined") return;
    try {
      const a = this.getAudio(src).cloneNode(true) as HTMLAudioElement;
      a.volume = Math.max(0, Math.min(1, vol * this.volume));
      void a.play().catch(() => null);
    } catch {
      /* */
    }
  }

  async unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* */
      }
    }
    Object.values(ASSETS).forEach((s) => {
      try {
        this.getAudio(s);
      } catch {
        /* */
      }
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
    if (this.musicAudio) this.musicAudio.muted = m;
    if (m) this.stopMusic();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && !this.muted) this.master.gain.value = this.volume;
    if (this.musicAudio) this.musicAudio.volume = 0.28 * this.volume;
  }

  private tone(t: Tone, bus: "sfx" | "music" = "sfx") {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.musicGain || this.muted) return;
    if (bus === "sfx" && !this.sfxOn) return;
    if (bus === "music" && !this.musicOn) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = t.type || "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(t.freq, now);
    if (t.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, t.slide), now + t.dur);
    const peak = t.gain ?? 0.18;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
    osc.connect(g);
    g.connect(bus === "music" ? this.musicGain : this.sfxGain);
    osc.start(now);
    osc.stop(now + t.dur + 0.02);
  }

  click() {
    this.tone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 });
  }

  bet() {
    this.tone({ freq: 420, dur: 0.1, type: "triangle", gain: 0.14, slide: 660 });
  }

  countdown() {
    this.tone({ freq: 520, dur: 0.12, type: "square", gain: 0.12 });
  }

  takeoff() {
    this.playFile(ASSETS.takeOff, 0.9);
  }

  flyTick(mult: number) {
    const f = 220 + Math.min(900, Math.log(Math.max(1, mult)) * 180);
    this.tone({ freq: f, dur: 0.05, type: "sine", gain: 0.015 });
  }

  cashout() {
    this.playFile(ASSETS.cashout, 0.95);
  }

  crash() {
    this.playFile(ASSETS.flewAway, 1);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tone({ freq: f, dur: 0.12, type: "triangle", gain: 0.1 }), i * 60);
    });
  }

  lose() {
    this.tone({ freq: 300, dur: 0.25, type: "triangle", gain: 0.12, slide: 120 });
  }

  spin() {
    this.tone({ freq: 300, dur: 0.07, type: "square", gain: 0.05, slide: 500 });
  }

  startMusic() {
    if (this.muted || !this.musicOn || typeof window === "undefined") return;
    try {
      if (!this.musicAudio) {
        this.musicAudio = new Audio(ASSETS.main);
        this.musicAudio.loop = true;
        this.musicAudio.volume = 0.28 * this.volume;
        this.musicAudio.preload = "auto";
      }
      this.musicAudio.muted = this.muted;
      void this.musicAudio.play().catch(() => null);
    } catch {
      /* */
    }
  }

  stopMusic() {
    if (this.musicAudio) {
      try {
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
      } catch {
        /* */
      }
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const sound = new SoundEngine();
