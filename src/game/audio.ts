// ============================================================
// Little Italy: Turf Wars — Audio Manager
// Procedural audio using Web Audio API
// ============================================================

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicInterval: number | null = null;
  private masterVolume = 0.7;
  private sfxVolume = 0.8;
  private musicVolume = 0.4;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.updateVolumes();
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  setMasterVolume(v: number) { this.masterVolume = v; this.updateVolumes(); }
  setSfxVolume(v: number) { this.sfxVolume = v; this.updateVolumes(); }
  setMusicVolume(v: number) { this.musicVolume = v; this.updateVolumes(); }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;
    this.masterGain.gain.value = this.masterVolume;
    this.sfxGain.gain.value = this.sfxVolume;
    this.musicGain.gain.value = this.musicVolume;
  }

  // ---- SFX ----

  playGunshot(auto: boolean = false) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * (auto ? 0.06 : 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(auto ? 3000 : 2000, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (auto ? 0.08 : 0.15));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(t);
    noise.stop(t + 0.2);

    // Low thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playShotgunBlast() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(t);
    noise.stop(t + 0.3);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playEnemyHit() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playEnemyDeath() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  playPlayerHurt() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  playDoorOpen() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  playReload() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [200, 400, 300].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.1, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.15);
    });
  }

  playEmpty() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // ---- Background Music (Noir/Jazz inspired) ----

  startMusic(tempo: number = 100) {
    this.stopMusic();
    if (!this.ctx || !this.musicGain) return;

    // Minor blues progression in Cm
    const chords = [
      [130.81, 155.56, 196.00], // Cm
      [174.61, 207.65, 261.63], // Fm
      [130.81, 155.56, 196.00], // Cm
      [146.83, 174.61, 220.00], // G7-ish
    ];

    const beatDuration = 60 / tempo;
    let chordIndex = 0;
    let beatIndex = 0;

    const playBeat = () => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const chord = chords[chordIndex % chords.length];

      // Bass note
      const bass = this.ctx.createOscillator();
      bass.type = 'sine';
      bass.frequency.value = chord[0] / 2;
      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatDuration * 1.8);
      bass.connect(bassGain);
      bassGain.connect(this.musicGain!);
      bass.start(t);
      bass.stop(t + beatDuration * 2);

      // Chord tones (quiet)
      if (beatIndex % 2 === 0) {
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const gain = this.ctx!.createGain();
          gain.gain.setValueAtTime(0.03, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + beatDuration * 1.5);
          osc.connect(gain);
          gain.connect(this.musicGain!);
          osc.start(t);
          osc.stop(t + beatDuration * 2);
        });
      }

      // Hi-hat on every beat
      const noiseLen = this.ctx.sampleRate * 0.03;
      const buf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const hpf = this.ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 8000;
      const hhGain = this.ctx.createGain();
      hhGain.gain.setValueAtTime(0.04, t);
      hhGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      noise.connect(hpf);
      hpf.connect(hhGain);
      hhGain.connect(this.musicGain!);
      noise.start(t);
      noise.stop(t + 0.06);

      // Walking bass line on odd beats
      if (beatIndex % 4 < 2) {
        const walk = this.ctx.createOscillator();
        walk.type = 'sine';
        walk.frequency.value = chord[beatIndex % 2 === 0 ? 0 : 1] * 1.5;
        const walkGain = this.ctx.createGain();
        walkGain.gain.setValueAtTime(0.06, t);
        walkGain.gain.exponentialRampToValueAtTime(0.001, t + beatDuration * 0.8);
        walk.connect(walkGain);
        walkGain.connect(this.musicGain!);
        walk.start(t);
        walk.stop(t + beatDuration);
      }

      beatIndex++;
      if (beatIndex % 8 === 0) chordIndex++;
    };

    playBeat();
    this.musicInterval = window.setInterval(playBeat, beatDuration * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicOscillators.forEach((o) => { try { o.stop(); } catch {} });
    this.musicOscillators = [];
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
