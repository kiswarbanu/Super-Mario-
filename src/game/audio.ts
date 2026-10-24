/**
 * Procedural 8-bit Web Audio Sound Synthesizer
 * Provides authentic retro sound effects and background tune without external audio files.
 */

class SoundChip {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicPlaying: boolean = false;
  private musicTimeout: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        this.musicGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGain && this.sfxGain && this.ctx) {
      const targetGain = muted ? 0 : 0.18;
      const sfxTarget = muted ? 0 : 0.35;
      this.musicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(sfxTarget, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playJump(isSuper: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    const startFreq = isSuper ? 180 : 140;
    const endFreq = isSuper ? 650 : 540;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    // B5 (987.77 Hz) to E6 (1318.51 Hz)
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playStomp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playKick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playBump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBreak() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [330, 392, 659, 523, 587, 784];
    const step = 0.06;
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * step;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + step);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + step);
    });
  }

  public playPowerDown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [600, 520, 460, 400, 340, 280, 220];
    const step = 0.05;
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * step;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + step);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + step);
    });
  }

  public playFireball() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playOneUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [330, 392, 659, 523, 587, 784, 988, 1046];
    const step = 0.07;
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * step;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + step);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + step);
    });
  }

  public playDie() {
    if (this.isMuted) return;
    this.stopMusic();
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    // Iconic Mario death motif
    const notes = [
      { f: 500, d: 0.12 },
      { f: 450, d: 0.12 },
      { f: 400, d: 0.14 },
      { f: 300, d: 0.14 },
      { f: 260, d: 0.14 },
      { f: 220, d: 0.18 },
      { f: 180, d: 0.3 },
    ];

    let t = this.ctx.currentTime;
    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.05;
    }
  }

  public playFlagpole() {
    if (this.isMuted) return;
    this.stopMusic();
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 1.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playStageClear() {
    if (this.isMuted) return;
    this.stopMusic();
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    // Victory fanfare notes: G4, C5, E5, G5, C6, E6, G6, E6, G#4, C5, D#5, G#5, C6, D#6, G#6, D#6 ...
    const fanfare = [
      { f: 392, d: 0.1 },
      { f: 523, d: 0.1 },
      { f: 659, d: 0.1 },
      { f: 784, d: 0.1 },
      { f: 1046, d: 0.1 },
      { f: 1318, d: 0.15 },
      { f: 1568, d: 0.35 },
    ];

    let t = this.ctx.currentTime + 0.3;
    for (const note of fanfare) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.1;
    }
  }

  /**
   * Start 8-bit overworld melody loop in the background
   */
  public startMusic() {
    if (this.musicPlaying) return;
    this.init();
    if (!this.ctx || !this.musicGain) return;

    this.musicPlaying = true;
    this.scheduleMelodyLoop();
  }

  private scheduleMelodyLoop() {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

    // Classic Mario overworld opening motif: E5, E5, rest, E5, rest, C5, E5, rest, G5, rest, G4
    const melody = [
      { f: 659.25, d: 0.12, pause: 0.05 },
      { f: 659.25, d: 0.12, pause: 0.15 },
      { f: 659.25, d: 0.12, pause: 0.15 },
      { f: 523.25, d: 0.12, pause: 0.05 },
      { f: 659.25, d: 0.15, pause: 0.15 },
      { f: 783.99, d: 0.25, pause: 0.35 },
      { f: 392.00, d: 0.25, pause: 0.45 },

      // Second phrase
      { f: 523.25, d: 0.18, pause: 0.2 },
      { f: 392.00, d: 0.18, pause: 0.2 },
      { f: 329.63, d: 0.18, pause: 0.2 },
      { f: 440.00, d: 0.15, pause: 0.12 },
      { f: 493.88, d: 0.15, pause: 0.12 },
      { f: 466.16, d: 0.15, pause: 0.08 },
      { f: 440.00, d: 0.18, pause: 0.15 },
      { f: 392.00, d: 0.16, pause: 0.12 },
      { f: 659.25, d: 0.16, pause: 0.12 },
      { f: 783.99, d: 0.16, pause: 0.12 },
      { f: 880.00, d: 0.2,  pause: 0.15 },
      { f: 698.46, d: 0.15, pause: 0.1 },
      { f: 783.99, d: 0.2,  pause: 0.15 },
      { f: 659.25, d: 0.2,  pause: 0.15 },
      { f: 523.25, d: 0.15, pause: 0.1 },
      { f: 587.33, d: 0.15, pause: 0.1 },
      { f: 493.88, d: 0.25, pause: 0.4 },
    ];

    let t = this.ctx.currentTime + 0.05;
    for (const note of melody) {
      if (!this.musicPlaying) break;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d + note.pause;
    }

    const totalDuration = (t - this.ctx.currentTime) * 1000;
    this.musicTimeout = window.setTimeout(() => {
      if (this.musicPlaying) {
        this.scheduleMelodyLoop();
      }
    }, Math.max(1000, totalDuration));
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }
}

export const soundChip = new SoundChip();
