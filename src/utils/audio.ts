class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext is initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.1); // C5
    playNote(659.25, now + 0.1, 0.1); // E5
    playNote(783.99, now + 0.2, 0.25); // G5
  }

  playElimination() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(293.66, now, 0.15); // D4
    playNote(220.00, now + 0.15, 0.3); // A3
  }

  playCrown() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(880.00, now, 0.08); // A5
    playNote(987.77, now + 0.08, 0.08); // B5
    playNote(1046.50, now + 0.16, 0.2); // C6
  }
}

export const sounds = new SoundEffects();