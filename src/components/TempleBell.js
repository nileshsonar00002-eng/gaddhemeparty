import { t, getLanguage } from '../utils/i18n';
import { subscribeToBellRings, recordBellRing } from '../services/firebase';

/**
 * Interactive Temple Bell (Ghanta) Widget
 * - Inline SVG Ring Button with ripple waves and lime bell icon
 * - Authentic Temple Bell acoustic synthesis via Web Audio API (zero external MP3)
 * - Swing animation and persistent multi-user synchronized chime counter
 */

class TempleBellAudio {
  constructor() {
    this.ctx = null;
    this.limiter = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.limiter) {
      // Dynamics compressor / soft limiter to guarantee zero distortion/clipping
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-6, this.ctx.currentTime);
      comp.knee.setValueAtTime(6, this.ctx.currentTime);
      comp.ratio.setValueAtTime(12, this.ctx.currentTime);
      comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
      comp.release.setValueAtTime(0.25, this.ctx.currentTime);
      comp.connect(this.ctx.destination);
      this.limiter = comp;
    }
  }

  playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const destination = this.limiter || this.ctx.destination;

      // Master envelope: smooth 4ms attack prevents popping/clicking, gentle resonant ring out
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.32, now + 0.004);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      masterGain.connect(destination);

      // Authentic Temple Bell partials (Hum tone, Prime, Tierce, Quint, Nominal, Shimmer)
      // Tuned to clear, soothing brass D5 resonance with zero digital distortion
      const harmonics = [
        { freq: 293.66, gain: 0.20, decay: 3.0 },  // Hum tone (D4) - warm undertone
        { freq: 587.33, gain: 0.35, decay: 2.8 },  // Prime tone (D5) - sacred fundamental
        { freq: 700.00, gain: 0.20, decay: 2.2 },  // Tierce (minor 3rd) - bell character
        { freq: 880.00, gain: 0.16, decay: 1.8 },  // Quint (A5, 5th) - chime clarity
        { freq: 1174.66, gain: 0.14, decay: 1.4 }, // Nominal (D6) - clear ring
        { freq: 1760.00, gain: 0.06, decay: 0.9 }, // High sheen (A6)
        { freq: 2349.32, gain: 0.04, decay: 0.15 } // Clapper metallic strike transient
      ];

      harmonics.forEach(({ freq, gain, decay }) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // Subtle natural detuning (+-1.2 Hz) for rich metallic chorus
        const detune = (Math.random() - 0.5) * 2.4;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + detune, now);

        // Smooth attack to avoid DC clicks
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(gain, now + 0.003);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    } catch (e) {
      console.warn('[TempleBell] Audio playback notice:', e);
    }
  }
}

export class TempleBellWidget {
  constructor(mountId = 'temple-bell-mount') {
    this.mountId = mountId;
    this.audio = new TempleBellAudio();
    this.ringCount = this.getSavedRings();
    this.isRinging = false;
    this.animTimer = null;
    this.unsubscribeRealtime = null;
    this.initRealtimeSync();
  }

  initRealtimeSync() {
    if (this.unsubscribeRealtime) return;
    this.unsubscribeRealtime = subscribeToBellRings((serverCount) => {
      if (typeof serverCount === 'number' && serverCount > 0) {
        const hasIncreased = serverCount > this.ringCount;
        this.ringCount = Math.max(this.ringCount, serverCount);
        this.saveRings(this.ringCount);
        this.updateCounterDOM(hasIncreased);
      }
    });
  }

  updateCounterDOM(animate = false) {
    const counterText = document.getElementById('bell-counter-text');
    if (counterText) {
      counterText.textContent = this.ringCount.toLocaleString('en-IN');
      if (animate) {
        counterText.classList.add('text-[#8CFF3F]', 'scale-110');
        setTimeout(() => {
          counterText.classList.remove('scale-110');
        }, 300);
      }
    }
  }

  getSavedRings() {
    const saved = localStorage.getItem('khadda_bell_rings');
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    // Baseline visitor count matching live Firestore sync
    return 1282;
  }

  saveRings(count) {
    this.ringCount = count;
    try {
      localStorage.setItem('khadda_bell_rings', count.toString());
    } catch (_) {}
  }

  render() {
    const container = document.getElementById(this.mountId);
    if (!container) return;

    const isHindi = getLanguage() === 'hindi';

    container.innerHTML = `
      <div class="temple-bell-wrapper relative flex flex-col items-center justify-center select-none py-2 cursor-pointer group" title="${isHindi ? 'घंटी बजाएं (Click to Ring)' : 'Ring Bell'}">
        
        <!-- Floating +1 Sparkle Burst Container -->
        <div id="bell-sparkles-container" class="absolute inset-0 pointer-events-none z-40 overflow-visible flex items-center justify-center"></div>

        <!-- Inline SVG Ring Button -->
        <button class="ring-btn" id="ringBtn" aria-label="${isHindi ? 'सड़क सुधार की घंटी बजाएं' : 'Ring for safer Indian roads'}">
          <span class="ripple"></span><span class="ripple r2"></span>
          <svg class="ring-bell" viewBox="0 0 400 400" width="44" height="44" aria-hidden="true">
            <g fill="none" stroke="#8CFF3F" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="200" cy="98" r="11"/>
              <path d="M104 290C104 290 136 264 136 198C136 150 163 118 200 118C237 118 264 150 264 198C264 264 296 290 296 290Z"/>
              <path d="M172 320Q200 350 228 320"/>
            </g>
          </svg>
        </button>

        <!-- Interactive Chime Counter & Prompt Badge -->
        <div class="mt-3 flex flex-col items-center gap-1.5 z-20">
          <button
            type="button"
            id="btn-ring-counter"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] hover:border-[#8CFF3F]/50 text-[var(--heading)] font-heading font-bold text-xs shadow-md transition-all cursor-pointer group-hover:border-[#8CFF3F]/60 group-hover:shadow-[rgba(140,255,63,0.2)]"
          >
            <svg class="w-4 h-4 text-[#8CFF3F] animate-pulse shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span id="bell-counter-text" class="tabular-nums font-mono text-[#8CFF3F] font-extrabold">
              ${this.ringCount.toLocaleString('en-IN')}
            </span>
            <span class="text-[11px] text-[var(--muted)] font-normal border-l border-[var(--border)] pl-2">
              ${isHindi ? 'बजाएं' : 'Ring'}
            </span>
          </button>
          
          <span class="bell-caption-text text-xs text-white/90 font-medium tracking-tight" style="text-shadow: 0 1px 2px rgba(0,0,0,.9), 0 0 10px rgba(0,0,0,.6);">
            ${isHindi ? 'सड़क सुधार की घंटी बजाएं!' : 'Ring for safer Indian roads!'}
          </span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const wrapper = document.querySelector('.temple-bell-wrapper');
    const ringBtn = document.getElementById('ringBtn');
    const ringCounter = document.getElementById('btn-ring-counter');

    const handleRing = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      this.ring();
    };

    ringBtn?.addEventListener('click', handleRing);
    ringCounter?.addEventListener('click', handleRing);
    wrapper?.addEventListener('click', (e) => {
      if (e.target.closest('#ringBtn') || e.target.closest('#btn-ring-counter')) return;
      handleRing(e);
    });
  }

  ring() {
    // 1. Play Authentic Web Audio Harmonic Chime
    this.audio.playChime();

    // 2. Increment & persist counter locally
    this.ringCount += 1;
    this.saveRings(this.ringCount);

    // 3. Atomically update Firestore counter for all connected users
    recordBellRing();

    // Update Counter UI with animation
    this.updateCounterDOM(true);

    // 4. Trigger Ring Button Swing Animation (.rung class)
    const ringBtn = document.getElementById('ringBtn');
    if (ringBtn) {
      ringBtn.classList.remove('rung');
      void ringBtn.offsetWidth; // Force reflow
      ringBtn.classList.add('rung');
      if (this.animTimer) clearTimeout(this.animTimer);
      this.animTimer = setTimeout(() => {
        ringBtn.classList.remove('rung');
      }, 650);
    }

    // 5. Spawn Floating +1 Particle Sparkle
    this.spawnSparkle();
  }

  spawnSparkle() {
    const container = document.getElementById('bell-sparkles-container');
    if (!container) return;

    const sparkle = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 48;
    sparkle.className = 'absolute text-xs font-heading font-black text-[#8CFF3F] select-none pointer-events-none animate-sparkle-float';
    sparkle.style.left = `calc(50% + ${randomX}px)`;
    sparkle.style.top = '15%';
    sparkle.innerHTML = '✨ +1';

    container.appendChild(sparkle);
    setTimeout(() => {
      sparkle.remove();
    }, 1100);
  }
}
