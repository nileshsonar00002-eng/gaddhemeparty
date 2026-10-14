import { t, getLanguage } from '../utils/i18n';
import { subscribeToBellRings, recordBellRing } from '../services/firebase';

/**
 * Interactive Neon Line Bell Widget
 * - Clean, lightweight inline SVG matching RoadTok neon lime brand identity
 * - Left and right sound wave arcs radiating on ring
 * - Authentic Temple Bell acoustic synthesis via Web Audio API (zero external MP3)
 * - Tactile ring animation & real-time synchronized chime counter across all users
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
        counterText.classList.add('text-lime-400', 'scale-110');
        setTimeout(() => {
          counterText.classList.remove('text-lime-400', 'scale-110');
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
        
        <!-- Ambient Neon Glow & Shockwave Emitter -->
        <div id="bell-glow-emitter" class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div class="bell-neon-aura w-44 h-44 rounded-full bg-lime-400/20 blur-xl opacity-0 transition-opacity duration-300"></div>
          <div id="bell-shockwave" class="absolute w-20 h-20 rounded-full border-2 border-lime-400/80 opacity-0 pointer-events-none"></div>
        </div>

        <!-- Floating +1 Sparkle Burst Container -->
        <div id="bell-sparkles-container" class="absolute inset-0 pointer-events-none z-40 overflow-visible flex items-center justify-center"></div>

        <!-- Neon Line Bell Interactive Ring Button -->
        <button
          type="button"
          id="btn-neon-bell"
          class="relative z-10 flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-slate-950/70 hover:bg-slate-950/90 border border-lime-400/40 hover:border-lime-400/80 shadow-lg shadow-lime-500/10 hover:shadow-lime-500/25 transition-all duration-200 cursor-pointer active:scale-90 group-hover:scale-105"
          aria-label="${isHindi ? 'घंटी बजाएं' : 'Ring Bell'}"
        >
          <svg
            id="neon-bell-svg"
            class="w-24 h-24 sm:w-32 sm:h-32 overflow-visible select-none"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Left Sound Wave Arc -->
            <path
              id="soundwave-left"
              d="M 18 42 A 26 26 0 0 0 18 78"
              class="neon-soundwave"
              stroke="#a3e635"
              stroke-width="4.5"
              stroke-linecap="round"
            />

            <!-- Right Sound Wave Arc -->
            <path
              id="soundwave-right"
              d="M 102 42 A 26 26 0 0 1 102 78"
              class="neon-soundwave"
              stroke="#a3e635"
              stroke-width="4.5"
              stroke-linecap="round"
            />

            <!-- Main Neon Bell Body Assembly -->
            <g id="neon-bell-body" class="neon-bell-graphic">
              <!-- Top Loop Handle -->
              <circle
                cx="60"
                cy="20"
                r="7"
                stroke="#a3e635"
                stroke-width="4.5"
                stroke-linecap="round"
                fill="none"
              />

              <!-- Bell Dome Body -->
              <path
                d="M 53 27
                   C 53 45, 45 56, 41 68
                   C 38 76, 31 78, 30 81
                   C 29 83.5, 31 85, 34 85
                   L 86 85
                   C 89 85, 91 83.5, 90 81
                   C 89 78, 82 76, 79 68
                   C 75 56, 67 45, 67 27
                   Z"
                stroke="#a3e635"
                stroke-width="4.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="rgba(163, 230, 53, 0.05)"
              />

              <!-- Bottom Clapper Arc -->
              <path
                id="neon-bell-clapper"
                d="M 50 91 A 10 10 0 0 0 70 91"
                stroke="#a3e635"
                stroke-width="4.5"
                stroke-linecap="round"
                fill="none"
              />
            </g>
          </svg>
        </button>

        <!-- Interactive Chime Counter & Prompt Badge -->
        <div class="mt-3 flex flex-col items-center gap-1.5 z-20">
          <button
            type="button"
            id="btn-ring-bell"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] hover:border-lime-400/50 text-[var(--heading)] font-heading font-bold text-xs shadow-md transition-all cursor-pointer group-hover:border-lime-400/60 group-hover:shadow-lime-500/20"
          >
            <svg class="w-4 h-4 text-lime-400 animate-pulse shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span id="bell-counter-text" class="tabular-nums font-mono text-lime-400 font-extrabold">
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
    const neonBellBtn = document.getElementById('btn-neon-bell');
    const ringBtn = document.getElementById('btn-ring-bell');

    const handleRing = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      this.ring();
    };

    neonBellBtn?.addEventListener('click', handleRing);
    ringBtn?.addEventListener('click', handleRing);
    wrapper?.addEventListener('click', (e) => {
      if (e.target.closest('#btn-neon-bell') || e.target.closest('#btn-ring-bell')) return;
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

    // 4. Trigger Neon Bell Ring & Soundwave Pulse Animations
    const bellBody = document.getElementById('neon-bell-body');
    const waveLeft = document.getElementById('soundwave-left');
    const waveRight = document.getElementById('soundwave-right');
    const aura = document.querySelector('.bell-neon-aura');
    const shockwave = document.getElementById('bell-shockwave');

    if (bellBody) {
      bellBody.classList.remove('animate-neon-bell-ring');
      void bellBody.offsetWidth; // Force reflow
      bellBody.classList.add('animate-neon-bell-ring');
    }

    if (waveLeft && waveRight) {
      waveLeft.classList.remove('animate-soundwave-pulse');
      waveRight.classList.remove('animate-soundwave-pulse');
      void waveLeft.offsetWidth;
      void waveRight.offsetWidth;
      waveLeft.classList.add('animate-soundwave-pulse');
      waveRight.classList.add('animate-soundwave-pulse');
    }

    if (this.animTimer) clearTimeout(this.animTimer);
    this.animTimer = setTimeout(() => {
      bellBody?.classList.remove('animate-neon-bell-ring');
      waveLeft?.classList.remove('animate-soundwave-pulse');
      waveRight?.classList.remove('animate-soundwave-pulse');
    }, 850);

    // 5. Neon Aura Flash & Shockwave Ripple Burst
    if (aura) {
      aura.classList.add('opacity-100', 'scale-125');
      setTimeout(() => {
        aura.classList.remove('opacity-100', 'scale-125');
      }, 500);
    }

    if (shockwave) {
      shockwave.classList.remove('animate-shockwave-burst');
      void shockwave.offsetWidth;
      shockwave.classList.add('animate-shockwave-burst');
    }

    // 6. Spawn Floating +1 Particle Sparkle
    this.spawnSparkle();
  }

  spawnSparkle() {
    const container = document.getElementById('bell-sparkles-container');
    if (!container) return;

    const sparkle = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 48;
    sparkle.className = 'absolute text-xs font-heading font-black text-lime-400 select-none pointer-events-none animate-sparkle-float';
    sparkle.style.left = `calc(50% + ${randomX}px)`;
    sparkle.style.top = '40%';
    sparkle.innerHTML = '✨ +1';

    container.appendChild(sparkle);
    setTimeout(() => {
      sparkle.remove();
    }, 1100);
  }
}
