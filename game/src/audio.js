// AeroStrike X-35 Valkyrie - Procedural Web Audio Sound Synthesizer
// Zero external sound assets needed: 100% synthesized in Web Audio API.

export class FlightAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    
    // Nodes
    this.engineGain = null;
    this.turbineOsc = null;
    this.turbineGain = null;
    this.rumbleSource = null;
    this.rumbleFilter = null;
    
    this.afterburnerSource = null;
    this.afterburnerFilter = null;
    this.afterburnerGain = null;
    
    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;
    
    this.stallOsc = null;
    this.stallGain = null;
    this.stallTimer = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      // Master engine bus
      this.masterBus = this.ctx.createGain();
      this.masterBus.gain.value = 0.6;
      this.masterBus.connect(this.ctx.destination);
      
      // 1. Jet Turbine Whine (Dual Sine / Triangle)
      this.turbineOsc = this.ctx.createOscillator();
      this.turbineOsc.type = 'sawtooth';
      this.turbineOsc.frequency.value = 120;
      
      const turbineFilter = this.ctx.createBiquadFilter();
      turbineFilter.type = 'bandpass';
      turbineFilter.frequency.value = 1800;
      turbineFilter.Q.value = 3.5;
      
      this.turbineGain = this.ctx.createGain();
      this.turbineGain.gain.value = 0.05;
      
      this.turbineOsc.connect(turbineFilter);
      turbineFilter.connect(this.turbineGain);
      this.turbineGain.connect(this.masterBus);
      this.turbineOsc.start();
      
      // 2. Engine Low Rumble (Filtered Noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      this.rumbleSource = this.ctx.createBufferSource();
      this.rumbleSource.buffer = noiseBuffer;
      this.rumbleSource.loop = true;
      
      this.rumbleFilter = this.ctx.createBiquadFilter();
      this.rumbleFilter.type = 'lowpass';
      this.rumbleFilter.frequency.value = 180;
      
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.2;
      
      this.rumbleSource.connect(this.rumbleFilter);
      this.rumbleFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterBus);
      this.rumbleSource.start();
      
      // 3. Afterburner Roar (Deep Resonant Noise)
      this.afterburnerSource = this.ctx.createBufferSource();
      this.afterburnerSource.buffer = noiseBuffer;
      this.afterburnerSource.loop = true;
      
      this.afterburnerFilter = this.ctx.createBiquadFilter();
      this.afterburnerFilter.type = 'bandpass';
      this.afterburnerFilter.frequency.value = 120;
      this.afterburnerFilter.Q.value = 1.2;
      
      this.afterburnerGain = this.ctx.createGain();
      this.afterburnerGain.gain.value = 0.0;
      
      this.afterburnerSource.connect(this.afterburnerFilter);
      this.afterburnerFilter.connect(this.afterburnerGain);
      this.afterburnerGain.connect(this.masterBus);
      this.afterburnerSource.start();
      
      // 4. Wind Rush (High-pass Noise)
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = noiseBuffer;
      this.windSource.loop = true;
      
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'highpass';
      this.windFilter.frequency.value = 600;
      
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.02;
      
      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterBus);
      this.windSource.start();
      
      this.initialized = true;
    } catch {
      // AudioContext unavailable in headless mode
    }
  }

  updateEngine(throttle, speed, afterburner) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Scale turbine pitch with throttle (100 Hz to 750 Hz)
    const targetFreq = 100 + throttle * 650;
    this.turbineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.turbineGain.gain.setTargetAtTime(0.04 + throttle * 0.12, now, 0.1);
    
    // Scale rumble with throttle
    this.rumbleFilter.frequency.setTargetAtTime(120 + throttle * 280, now, 0.1);
    this.engineGain.gain.setTargetAtTime(0.15 + throttle * 0.45, now, 0.1);
    
    // Afterburner boost sound
    const abGain = afterburner ? 0.65 : 0.0;
    this.afterburnerGain.gain.setTargetAtTime(abGain, now, 0.08);
    
    // Wind noise proportional to speed (0 to 350 m/s)
    const normSpeed = Math.min(1.0, speed / 300);
    this.windGain.gain.setTargetAtTime(normSpeed * 0.35, now, 0.15);
    this.windFilter.frequency.setTargetAtTime(400 + normSpeed * 1200, now, 0.15);
  }

  playStallWarning(active) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (active) {
      if (!this.stallOsc) {
        this.stallOsc = this.ctx.createOscillator();
        this.stallOsc.type = 'square';
        this.stallOsc.frequency.value = 820; // 820 Hz Master Caution
        
        this.stallGain = this.ctx.createGain();
        this.stallGain.gain.value = 0.18;
        
        this.stallOsc.connect(this.stallGain);
        this.stallGain.connect(this.masterBus);
        this.stallOsc.start();
      }
    } else {
      if (this.stallOsc) {
        this.stallGain.gain.setTargetAtTime(0, now, 0.05);
        setTimeout(() => {
          if (this.stallOsc) {
            this.stallOsc.stop();
            this.stallOsc.disconnect();
            this.stallOsc = null;
          }
        }, 60);
      }
    }
  }

  playRingPass() {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.connect(gain);
      gain.connect(this.masterBus);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Ignored
    }
  }

  playTouchdown() {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 4.0;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterBus);
      source.start(now);
    } catch {
      // Ignored
    }
  }

  playCrash() {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 1.2);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterBus);
      source.start(now);
    } catch {
      // Ignored
    }
  }
}
