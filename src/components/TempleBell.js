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
  }

  playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0008, now + 3.8);
      masterGain.connect(this.ctx.destination);

      // Authentic Temple Bell partials (Hum tone, Prime, Tierce, Quint, Nominal, Strike transient)
      const harmonics = [
        { freq: 220, gain: 0.45, decay: 3.6 },   // Hum tone
        { freq: 440, gain: 0.90, decay: 3.2 },   // Fundamental prime tone
        { freq: 528, gain: 0.65, decay: 2.6 },   // Tierce (minor 3rd)
        { freq: 660, gain: 0.50, decay: 2.2 },   // Quint (5th)
        { freq: 880, gain: 0.70, decay: 1.8 },   // Nominal octave
        { freq: 1320, gain: 0.35, decay: 1.2 },  // Upper harmonic
        { freq: 1760, gain: 0.40, decay: 0.9 },  // Super octave
        { freq: 2640, gain: 0.30, decay: 0.35 }, // Clapper metallic strike
        { freq: 3520, gain: 0.18, decay: 0.12 }  // High sparkle ping
      ];

      harmonics.forEach(({ freq, gain, decay }) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // Slight frequency spread for rich brass resonance
        const detune = (Math.random() - 0.5) * 3.5;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + detune, now);

        oscGain.gain.setValueAtTime(gain, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay);
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
          
          <span class="text-[10px] text-[var(--muted)] font-medium tracking-tight">
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
