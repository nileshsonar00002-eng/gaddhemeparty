import { t, getLanguage } from '../utils/i18n';
import { subscribeToBellRings, recordBellRing } from '../services/firebase';

/**
 * Modern Interactive 3D Road Warning Beacon Widget
 * - Industrial amber/yellow hazard warning beacon (replaces religious temple bell)
 * - Revolving internal reflector beam & smooth pulsing amber glow
 * - Synthesized crisp electronic radar alert audio via Web Audio API
 * - Interactive click strobe flash & realtime synced community alert counter
 */

class WarningBeaconAudio {
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

  playAlert() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Crisp high-tech road hazard radar chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.32);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      // Secondary overtone for warm metallic presence
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1160, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.22);

      gain2.gain.setValueAtTime(0.16, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
      osc2.start(now);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn('[WarningBeacon] Audio playback notice:', e);
    }
  }
}

export class TempleBellWidget {
  constructor(mountId = 'temple-bell-mount') {
    this.mountId = mountId;
    this.audio = new WarningBeaconAudio();
    this.ringCount = this.getSavedRings();
    this.isAlerting = false;
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
        counterText.classList.add('text-amber-500', 'scale-110');
        setTimeout(() => {
          counterText.classList.remove('text-amber-500', 'scale-110');
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
      <div class="road-beacon-wrapper relative flex flex-col items-center justify-center select-none py-2 cursor-pointer group" title="${isHindi ? 'सड़क सुरक्षा अलर्ट (Click for Road Alert)' : 'Trigger Road Safety Alert'}">
        
        <!-- Ambient Amber Glow & Circular Warning Pulse Emitter -->
        <div id="beacon-glow-emitter" class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div class="beacon-ambient-glow w-44 h-44 rounded-full bg-amber-500/20 blur-2xl transition-opacity duration-300"></div>
          <div id="beacon-warning-wave" class="beacon-pulse-ring absolute w-24 h-24 rounded-full border-2 border-amber-400/70 pointer-events-none"></div>
          <div id="beacon-strobe-shockwave" class="absolute w-20 h-20 rounded-full border-2 border-amber-300 opacity-0 pointer-events-none"></div>
        </div>

        <!-- Floating +1 Alert Particle Burst Container -->
        <div id="beacon-sparkles-container" class="absolute inset-0 pointer-events-none z-40 overflow-visible flex items-center justify-center"></div>

        <!-- 3D Realistic Road Hazard Warning Beacon Rig -->
        <div id="beacon-assembly" class="relative z-10 flex flex-col items-center animate-beacon-float transition-transform duration-150">
          <svg class="w-36 h-44 sm:w-44 sm:h-52 overflow-visible drop-shadow-2xl" viewBox="0 0 160 180" fill="none">
            <defs>
              <!-- Amber Lens Cylindrical Gradient -->
              <linearGradient id="amberLensGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#92400E" />
                <stop offset="15%" stop-color="#D97706" />
                <stop offset="35%" stop-color="#F59E0B" />
                <stop offset="50%" stop-color="#FEF08A" />
                <stop offset="68%" stop-color="#F59E0B" />
                <stop offset="85%" stop-color="#D97706" />
                <stop offset="100%" stop-color="#78350F" />
              </linearGradient>

              <!-- Amber Dome Top Radial Gradient -->
              <radialGradient id="amberDomeGrad" cx="50%" cy="30%" r="65%">
                <stop offset="0%" stop-color="#FFFBEB" />
                <stop offset="35%" stop-color="#FEF08A" />
                <stop offset="65%" stop-color="#F59E0B" />
                <stop offset="100%" stop-color="#92400E" />
              </radialGradient>

              <!-- Revolving Core Spotlight Beam Gradient -->
              <linearGradient id="revolvingBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="50%" stop-color="rgba(255, 255, 255, 0.95)" />
                <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
              </linearGradient>

              <!-- Dark Metallic Heavy Industrial Base Gradient -->
              <linearGradient id="metalBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0F172A" />
                <stop offset="15%" stop-color="#1E293B" />
                <stop offset="45%" stop-color="#334155" />
                <stop offset="58%" stop-color="#475569" />
                <stop offset="85%" stop-color="#1E293B" />
                <stop offset="100%" stop-color="#090E17" />
              </linearGradient>

              <!-- Industrial Hex Bolt Radial -->
              <radialGradient id="hexBoltGrad" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stop-color="#F1F5F9" />
                <stop offset="50%" stop-color="#64748B" />
                <stop offset="100%" stop-color="#0F172A" />
              </radialGradient>

              <!-- Internal Central Bulb Glow -->
              <radialGradient id="internalBulbGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFFFFF" />
                <stop offset="30%" stop-color="#FEF08A" />
                <stop offset="70%" stop-color="#F59E0B" />
                <stop offset="100%" stop-color="#B45309" />
              </radialGradient>
            </defs>

            <!-- 1. HEAVY INDUSTRIAL MOUNTING BASE (Dark Slate / Charcoal) -->
            <!-- Lower Mounting Flange -->
            <path d="M18 132 C18 126, 142 126, 142 132 L140 148 C140 156, 20 156, 20 148 Z" fill="url(#metalBaseGrad)" stroke="#090D16" stroke-width="1.5" />
            <!-- Flange Top Bevel Ellipse -->
            <ellipse cx="80" cy="132" rx="61" ry="11" fill="url(#metalBaseGrad)" stroke="#475569" stroke-width="1" />

            <!-- Industrial Hex Bolts (4 Rugged Screws on the Base Flange) -->
            <circle cx="32" cy="132" r="3.5" fill="url(#hexBoltGrad)" stroke="#090D16" stroke-width="0.8" />
            <circle cx="58" cy="137" r="3.5" fill="url(#hexBoltGrad)" stroke="#090D16" stroke-width="0.8" />
            <circle cx="102" cy="137" r="3.5" fill="url(#hexBoltGrad)" stroke="#090D16" stroke-width="0.8" />
            <circle cx="128" cy="132" r="3.5" fill="url(#hexBoltGrad)" stroke="#090D16" stroke-width="0.8" />

            <!-- Middle Collar Stepped Ring -->
            <rect x="28" y="112" width="104" height="15" fill="url(#metalBaseGrad)" stroke="#090D16" stroke-width="1" />
            <ellipse cx="80" cy="112" rx="52" ry="8" fill="url(#metalBaseGrad)" stroke="#475569" stroke-width="1" />
            <!-- Micro Amber Safety Accent Line -->
            <path d="M30 119 C50 125, 110 125, 130 119" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" opacity="0.9" />

            <!-- 2. INTERNAL REFLECTOR CORE & BULB (Behind Fresnel Lens) -->
            <g id="beacon-core-reflector" class="animate-beacon-core-pulse">
              <!-- Central Halogen / LED Strobe Lamp Column -->
              <rect x="74" y="52" width="12" height="52" rx="6" fill="url(#internalBulbGrad)" />
              <circle cx="80" cy="74" r="10" fill="#FFFBEB" opacity="0.95" />
              <!-- Rotating Reflector Mirror Simulation -->
              <ellipse cx="80" cy="74" rx="34" ry="26" fill="url(#revolvingBeamGrad)" class="animate-beacon-reflector-spin" />
            </g>

            <!-- 3. AMBER POLYCARBONATE FRESNEL LENS CYLINDER -->
            <!-- Main Transparent Amber Cylinder Shell -->
            <path
              d="M32 46
                 C32 34, 128 34, 128 46
                 L128 112
                 C128 124, 32 124, 32 112
                 Z"
              fill="url(#amberLensGrad)"
              opacity="0.88"
              stroke="#B45309"
              stroke-width="1.8"
            />

            <!-- Optical Fresnel Horizontal Ribs (Distinctive Hazard Warning Grooves) -->
            <path d="M34 54 C52 61, 108 61, 126 54" stroke="#FFFBEB" stroke-width="1.8" fill="none" opacity="0.75" />
            <path d="M33 66 C52 73, 108 73, 127 66" stroke="#FEF08A" stroke-width="2" fill="none" opacity="0.70" />
            <path d="M33 67.5 C52 74.5, 108 74.5, 127 67.5" stroke="#78350F" stroke-width="1" fill="none" opacity="0.6" />

            <path d="M32 79 C52 86, 108 86, 128 79" stroke="#FFFBEB" stroke-width="2" fill="none" opacity="0.75" />
            <path d="M32 80.5 C52 87.5, 108 87.5, 128 80.5" stroke="#78350F" stroke-width="1" fill="none" opacity="0.6" />

            <path d="M33 92 C52 99, 108 99, 127 92" stroke="#FEF08A" stroke-width="2" fill="none" opacity="0.70" />
            <path d="M33 93.5 C52 100.5, 108 100.5, 127 93.5" stroke="#78350F" stroke-width="1" fill="none" opacity="0.6" />

            <path d="M34 104 C52 111, 108 111, 126 104" stroke="#FFFBEB" stroke-width="1.8" fill="none" opacity="0.75" />

            <!-- 4. TOP DOME CAP (Smooth Amber Rounded Polycarbonate Crown) -->
            <ellipse cx="80" cy="46" rx="48" ry="14" fill="url(#amberDomeGrad)" stroke="#B45309" stroke-width="1.2" />
            <path
              d="M32 46
                 C32 20, 128 20, 128 46
                 Z"
              fill="url(#amberDomeGrad)"
              stroke="#B45309"
              stroke-width="1.5"
            />

            <!-- Top Glossy Curved Glass Reflection -->
            <path
              d="M44 42
                 C44 26, 116 26, 116 42
                 C100 34, 60 34, 44 42
                 Z"
              fill="#FFFFFF"
              opacity="0.55"
            />

            <!-- Side Vertical Glass Specular Sheen Streaks -->
            <path
              d="M42 46
                 C42 40, 52 40, 52 46
                 L50 112
                 C50 115, 41 115, 41 112
                 Z"
              fill="#FFFFFF"
              opacity="0.45"
            />
            <path
              d="M72 40
                 C72 36, 88 36, 88 40
                 L86 114
                 C86 117, 72 117, 72 114
                 Z"
              fill="#FFFBEB"
              opacity="0.30"
            />
          </svg>
        </div>

        <!-- Realistic Soft Ground Drop Shadow -->
        <div id="beacon-ground-shadow" class="w-32 sm:w-40 h-4 rounded-full bg-slate-950/25 blur-[4px] transition-all duration-300 -mt-2"></div>

        <!-- Interactive Road Alert Counter & Trigger Badge -->
        <div class="mt-3 flex flex-col items-center gap-1.5 z-20">
          <button
            type="button"
            id="btn-ring-bell"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] text-[var(--heading)] font-heading font-bold text-xs shadow-md transition-all cursor-pointer group-hover:border-amber-500 group-hover:shadow-lg"
          >
            <!-- Road Hazard Alert Beacon Icon -->
            <svg class="w-4 h-4 text-amber-500 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span id="bell-counter-text" class="tabular-nums font-mono text-[var(--text)] font-extrabold">
              ${this.ringCount.toLocaleString('en-IN')}
            </span>
            <span class="text-[11px] text-[var(--muted)] font-normal border-l border-[var(--border)] pl-2">
              ${isHindi ? 'अलर्ट' : 'Alert'}
            </span>
          </button>
          
          <span class="text-[10px] text-[var(--muted)] font-medium tracking-tight">
            ${isHindi ? 'सड़क सुरक्षा अलर्ट दर्ज करें!' : 'Alert for safer Indian roads!'}
          </span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const wrapper = document.querySelector('.road-beacon-wrapper');
    const ringBtn = document.getElementById('btn-ring-bell');

    const handleAlert = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      this.ring();
    };

    wrapper?.addEventListener('click', handleAlert);
    ringBtn?.addEventListener('click', handleAlert);
  }

  ring() {
    // 1. Play Modern Electronic Road Safety Radar Chirp
    this.audio.playAlert();

    // 2. Increment & persist counter locally
    this.ringCount += 1;
    this.saveRings(this.ringCount);

    // 3. Atomically update Firestore counter for all connected users
    recordBellRing();

    // Update Counter UI with animation
    this.updateCounterDOM(true);

    // 4. Trigger High-Intensity Strobe Flash on Beacon
    const assembly = document.getElementById('beacon-assembly');
    const strobeWave = document.getElementById('beacon-strobe-shockwave');
    const ambientGlow = document.querySelector('.beacon-ambient-glow');

    if (assembly) {
      assembly.classList.remove('animate-beacon-strobe-burst');
      void assembly.offsetWidth; // Force reflow
      assembly.classList.add('animate-beacon-strobe-burst');

      if (this.animTimer) clearTimeout(this.animTimer);
      this.animTimer = setTimeout(() => {
        assembly.classList.remove('animate-beacon-strobe-burst');
      }, 800);
    }

    if (ambientGlow) {
      ambientGlow.classList.add('opacity-100', 'scale-135', 'bg-amber-400/40');
      setTimeout(() => {
        ambientGlow.classList.remove('opacity-100', 'scale-135', 'bg-amber-400/40');
      }, 550);
    }

    if (strobeWave) {
      strobeWave.classList.remove('animate-beacon-shockwave-burst');
      void strobeWave.offsetWidth;
      strobeWave.classList.add('animate-beacon-shockwave-burst');
    }

    // 5. Spawn Floating +1 Alert Particle
    this.spawnSparkle();
  }

  spawnSparkle() {
    const container = document.getElementById('beacon-sparkles-container');
    if (!container) return;

    const sparkle = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 44;
    sparkle.className = 'absolute text-xs font-heading font-black text-amber-500 select-none pointer-events-none animate-sparkle-float';
    sparkle.style.left = `calc(50% + ${randomX}px)`;
    sparkle.style.top = '40%';
    sparkle.innerHTML = '⚠️ +1';

    container.appendChild(sparkle);
    setTimeout(() => {
      sparkle.remove();
    }, 1100);
  }
}
