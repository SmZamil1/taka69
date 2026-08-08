/**
 * Lightweight WebAudio SFX engine (no external assets).
 * Used by Aviator crash + other games.
 */

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slide?: number;
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicTimer: number | null = null;
  private unlocked = false;
  muted = false;
  musicOn = true;
  sfxOn = true;
  private volume = 0.55;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.sfxGain.gain.value = 0.7;
      this.master.gain.value = this.volume;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.unlocked = true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
    if (m) this.stopMusic();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && !this.muted) this.master.gain.value = this.volume;
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

  private noise(dur: number, gain = 0.12) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || this.muted || !this.sfxOn) return;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 900;
    g.gain.value = gain;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  click() {
    this.tone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 });
  }

  bet() {
    this.tone({ freq: 420, dur: 0.1, type: "triangle", gain: 0.14, slide: 660 });
    this.tone({ freq: 660, dur: 0.12, type: "sine", gain: 0.1 });
  }

  countdown() {
    this.tone({ freq: 520, dur: 0.12, type: "square", gain: 0.12 });
  }

  takeoff() {
    this.tone({ freq: 180, dur: 0.45, type: "sawtooth", gain: 0.1, slide: 520 });
    this.noise(0.25, 0.08);
  }

  /** Rising whoosh while flying — call periodically */
  flyTick(mult: number) {
    const f = 220 + Math.min(900, Math.log(Math.max(1, mult)) * 180);
    this.tone({ freq: f, dur: 0.08, type: "sine", gain: 0.035 });
  }

  cashout() {
    this.tone({ freq: 523, dur: 0.12, type: "sine", gain: 0.16 });
    this.tone({ freq: 659, dur: 0.14, type: "sine", gain: 0.14 });
    this.tone({ freq: 784, dur: 0.18, type: "triangle", gain: 0.12 });
  }

  crash() {
    this.noise(0.35, 0.2);
    this.tone({ freq: 220, dur: 0.35, type: "sawtooth", gain: 0.16, slide: 60 });
    this.tone({ freq: 90, dur: 0.4, type: "square", gain: 0.1, slide: 40 });
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tone({ freq: f, dur: 0.14, type: "triangle", gain: 0.12 }), i * 70);
    });
  }

  lose() {
    this.tone({ freq: 300, dur: 0.25, type: "triangle", gain: 0.12, slide: 120 });
  }

  spin() {
    this.tone({ freq: 300, dur: 0.08, type: "square", gain: 0.06, slide: 500 });
  }

  startMusic() {
    if (this.muted || !this.musicOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    this.stopMusic();
    // soft ambient pad loop
    const notes = [110, 138.59, 164.81, 196];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      g.gain.value = 0.03;
      osc.connect(g);
      g.connect(this.musicGain!);
      osc.start();
      this.musicNodes.push(osc);
    });
    // gentle pulse
    const pulse = () => {
      if (!this.musicOn || this.muted) return;
      this.tone({ freq: 55, dur: 0.4, type: "sine", gain: 0.04 }, "music");
      this.musicTimer = window.setTimeout(pulse, 1800);
    };
    pulse();
  }

  stopMusic() {
    this.musicNodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* */
      }
    });
    this.musicNodes = [];
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted && this.musicOn) this.startMusic();
    return this.muted;
  }
}

export const sound = new SoundEngine();
