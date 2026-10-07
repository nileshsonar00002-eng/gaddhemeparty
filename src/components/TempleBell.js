import { t, getLanguage } from '../utils/i18n';
import { subscribeToBellRings, recordBellRing } from '../services/firebase';

/**
 * Interactive Authentic Brass Handbell Widget
 * - Exact uploaded brass handbell image layers (zero AI regeneration)
 * - True top-loop rotation pivot (63.3% 18.0%) with pendulum physics
 * - Independent delayed counter-momentum clapper hitting the inside bell wall
 * - Synchronized metallic "ding" acoustic synthesis via Web Audio API
 * - Post-impact micro-vibration & persistent Firestore community sync
 */

class HandbellAudio {
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

  playDing() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master output gain with natural brass ring exponential decay (~1.4s)
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.88, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0005, now + 1.45);
      masterGain.connect(this.ctx.destination);

      // 1. Sharp metallic impact transient (clapper striking the inner rim)
      const strikeFrequencies = [2450, 3180, 4320, 5800];
      strikeFrequencies.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
      });

      // 2. Authentic Brass Handbell Partials (Pure clear metallic "ding" tone)
      const bellHarmonics = [
        { freq: 1046.5, gain: 0.85, decay: 1.40 }, // Bright fundamental C6 note
        { freq: 523.25, gain: 0.35, decay: 1.45 }, // Resonant hum undertone
        { freq: 1244.5, gain: 0.55, decay: 1.15 }, // Tierce (minor 3rd harmonic richness)
        { freq: 1568.0, gain: 0.50, decay: 0.95 }, // Quint
        { freq: 2093.0, gain: 0.60, decay: 0.80 }, // Bright upper chime octave
        { freq: 2790.0, gain: 0.30, decay: 0.45 }, // Upper shimmer
        { freq: 3350.0, gain: 0.20, decay: 0.25 }  // High sparkle ping
      ];

      bellHarmonics.forEach(({ freq, gain, decay }) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        // Subtle natural detune for shimmer
        const detune = (Math.random() - 0.5) * 2.2;
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
      console.warn('[HandbellAudio] Playback note:', e);
    }
  }
}

export class TempleBellWidget {
  constructor(mountId = 'temple-bell-mount') {
    this.mountId = mountId;
    this.audio = new HandbellAudio();
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
        counterText.classList.add('text-[var(--primary)]', 'scale-110');
        setTimeout(() => {
          counterText.classList.remove('text-[var(--primary)]', 'scale-110');
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
      <div class="temple-bell-wrapper relative flex flex-col items-center justify-center select-none py-2 cursor-pointer group" title="${isHindi ? 'घंटी बजाएं (Click to Ring)' : 'Ring Handbell'}">
        
        <!-- Divine Golden Glow Aura & Shockwave Emitter -->
        <div id="bell-glow-emitter" class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div class="bell-divine-aura w-44 h-44 rounded-full bg-amber-400/20 blur-xl opacity-0 transition-opacity duration-300"></div>
          <div id="bell-shockwave" class="absolute w-20 h-20 rounded-full border-2 border-amber-300/80 opacity-0 pointer-events-none"></div>
        </div>

        <!-- Floating +1 Sparkle Burst Container -->
        <div id="bell-sparkles-container" class="absolute inset-0 pointer-events-none z-40 overflow-visible flex items-center justify-center"></div>

        <!-- Hanging Handbell Interactive Rig (Pivots at the top loop of the supplied image) -->
        <div id="brass-bell-rig" class="relative z-10 flex flex-col items-center select-none">
          
          <!-- Outer Bell Swinger (Pivots around TOP LOOP/HANDLE: 63.3% 18.0%) -->
          <div
            id="brass-bell-swinger"
            class="relative w-44 h-44 sm:w-52 sm:h-52 select-none transform-origin-bell-loop will-change-transform"
          >
            <!-- 1. Handbell Body (Supplied authentic image with transparent background & continuous cavity) -->
            <img
              src="/assets/bell-body.png"
              alt="Brass Handbell"
              draggable="false"
              class="absolute inset-0 w-full h-full object-contain pointer-events-none select-none drop-shadow-xl"
            />

            <!-- 2. Independent Clapper Assembly (Suspended inside bell cavity: pivots at 45.7% 63.7%) -->
            <div
              id="brass-clapper-swinger"
              class="absolute inset-0 w-full h-full select-none transform-origin-bell-clapper will-change-transform pointer-events-none"
            >
              <img
                src="/assets/bell-clapper.png"
                alt="Bell Clapper"
                draggable="false"
                class="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          </div>
        </div>

        <!-- Dynamic Ground Contact Shadow (Synchronizes with swing) -->
        <div id="bell-ground-shadow" class="w-32 sm:w-36 h-3.5 rounded-full bg-amber-950/20 blur-[3px] transition-all duration-300 -mt-1.5 pointer-events-none"></div>

        <!-- Interactive Chime Counter & Prompt Badge -->
        <div class="mt-3 flex flex-col items-center gap-1.5 z-20">
          <button
            type="button"
            id="btn-ring-bell"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] text-[var(--heading)] font-heading font-bold text-xs shadow-md transition-all cursor-pointer group-hover:border-[var(--primary)] group-hover:shadow-lg"
          >
            <svg class="w-4 h-4 text-amber-500 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span id="bell-counter-text" class="tabular-nums font-mono text-[var(--text)] font-extrabold">
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
    const ringBtn = document.getElementById('btn-ring-bell');

    const handleRing = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      this.ring();
    };

    wrapper?.addEventListener('click', handleRing);
    ringBtn?.addEventListener('click', handleRing);
  }

  ring() {
    // Prevent overlapping taps while animation is active (allow tap again once settled)
    if (this.isRinging) return;
    this.isRinging = true;

    // 1. Trigger realistic compound physical pendulum swing
    const bellSwinger = document.getElementById('brass-bell-swinger');
    const clapperSwinger = document.getElementById('brass-clapper-swinger');
    const shadow = document.getElementById('bell-ground-shadow');
    const aura = document.querySelector('.bell-divine-aura');
    const shockwave = document.getElementById('bell-shockwave');

    if (bellSwinger && clapperSwinger) {
      bellSwinger.classList.remove('animate-handbell-swing');
      clapperSwinger.classList.remove('animate-handbell-clapper');
      if (shadow) shadow.classList.remove('animate-handbell-shadow');

      void bellSwinger.offsetWidth; // Force reflow
      void clapperSwinger.offsetWidth;

      bellSwinger.classList.add('animate-handbell-swing');
      clapperSwinger.classList.add('animate-handbell-clapper');
      if (shadow) shadow.classList.add('animate-handbell-shadow');
    }

    // 2. Play realistic short metal bell "ding" sound EXACTLY when clapper hits inside wall (t = 165ms)
    setTimeout(() => {
      this.audio.playDing();

      if (aura) {
        aura.classList.add('opacity-100', 'scale-115');
        setTimeout(() => aura.classList.remove('opacity-100', 'scale-115'), 400);
      }

      if (shockwave) {
        shockwave.classList.remove('animate-shockwave-burst');
        void shockwave.offsetWidth;
        shockwave.classList.add('animate-shockwave-burst');
      }

      // Spawn floating +1 sparkle burst
      this.spawnSparkle();
    }, 165);

    // 3. Increment counter once per completed tap/ring
    this.ringCount += 1;
    this.saveRings(this.ringCount);

    // Atomically sync to Firestore community database
    recordBellRing();

    // Update Counter UI with subtle spring pop
    this.updateCounterDOM(true);

    // 4. Reset after approximately 1.5s so user can tap again
    if (this.animTimer) clearTimeout(this.animTimer);
    this.animTimer = setTimeout(() => {
      if (bellSwinger) bellSwinger.classList.remove('animate-handbell-swing');
      if (clapperSwinger) clapperSwinger.classList.remove('animate-handbell-clapper');
      if (shadow) shadow.classList.remove('animate-handbell-shadow');
      this.isRinging = false;
    }, 1520);
  }

  spawnSparkle() {
    const container = document.getElementById('bell-sparkles-container');
    if (!container) return;

    const sparkle = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 44;
    sparkle.className = 'absolute text-xs font-heading font-black text-amber-500 select-none pointer-events-none animate-sparkle-float';
    sparkle.style.left = `calc(50% + ${randomX}px)`;
    sparkle.style.top = '40%';
    sparkle.innerHTML = '✨ +1';

    container.appendChild(sparkle);
    setTimeout(() => {
      sparkle.remove();
    }, 1100);
  }
}
