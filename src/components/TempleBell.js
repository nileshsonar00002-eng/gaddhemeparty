import { t, getLanguage } from '../utils/i18n';
import { subscribeToBellRings, recordBellRing } from '../services/firebase';

/**
 * Interactive 3D Animated Temple Bell (Ghanta) Widget
 * - Pure SVG & CSS 3D metallic brass textures (zero external image assets)
 * - Authentic Temple Bell acoustic synthesis via Web Audio API (zero external MP3)
 * - Realistic counter-swing pendulum physics (dome + clapper counter-motion)
 * - Divine shockwave ripples & persistent visitor chime counter
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
        this.ringCount = Math.max(this.ringCount, serverCount);
        this.saveRings(this.ringCount);
        this.updateCounterDOM();
      }
    });
  }

  updateCounterDOM() {
    const counterText = document.getElementById('bell-counter-text');
    if (counterText) {
      counterText.textContent = this.ringCount.toLocaleString('en-IN');
    }
  }

  getSavedRings() {
    const saved = localStorage.getItem('khadda_bell_rings');
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    // Realistic default baseline visitor count
    return 1248;
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
      <div class="temple-bell-wrapper relative flex flex-col items-center justify-center select-none py-2 cursor-pointer group" title="${isHindi ? 'घंटी बजाएं (Click to Ring)' : 'Ring Temple Bell'}">
        
        <!-- Divine Golden Glow & Shockwave Emitter -->
        <div id="bell-glow-emitter" class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div class="bell-divine-aura w-44 h-44 rounded-full bg-amber-400/20 blur-xl opacity-0 transition-opacity duration-300"></div>
          <div id="bell-shockwave" class="absolute w-20 h-20 rounded-full border-2 border-amber-300/80 opacity-0 pointer-events-none"></div>
        </div>

        <!-- Floating +1 Sparkle Burst Container -->
        <div id="bell-sparkles-container" class="absolute inset-0 pointer-events-none z-40 overflow-visible flex items-center justify-center"></div>

        <!-- Hanging Rig: Unified 3D Brass Chain + Bell Dome + Internal Clapper Assembly -->
        <div id="bell-pendulum-assembly" class="relative z-10 flex flex-col items-center transform-origin-top transition-transform duration-100">
          <svg class="w-40 h-52 sm:w-48 sm:h-60 overflow-visible drop-shadow-2xl" viewBox="0 0 160 210" fill="none">
            <defs>
              <!-- 3D Cylindrical Brass Body Gradient -->
              <linearGradient id="brassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#4A2E05" />
                <stop offset="15%" stop-color="#9C6B17" />
                <stop offset="35%" stop-color="#D4AF37" />
                <stop offset="52%" stop-color="#FFF6BA" />
                <stop offset="70%" stop-color="#D4AF37" />
                <stop offset="88%" stop-color="#8C5C10" />
                <stop offset="100%" stop-color="#382003" />
              </linearGradient>

              <!-- Flared Rim Bevel Gradient -->
              <linearGradient id="brassRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#331A02" />
                <stop offset="20%" stop-color="#B8860B" />
                <stop offset="50%" stop-color="#FFF8D0" />
                <stop offset="80%" stop-color="#B8860B" />
                <stop offset="100%" stop-color="#241201" />
              </linearGradient>

              <!-- Chain Gold Gradient -->
              <linearGradient id="chainGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5B3A07" />
                <stop offset="25%" stop-color="#D4AF37" />
                <stop offset="50%" stop-color="#FFF3A8" />
                <stop offset="75%" stop-color="#AA771C" />
                <stop offset="100%" stop-color="#3D2502" />
              </linearGradient>

              <!-- Crown Ring Radial -->
              <radialGradient id="brassCrownRadial" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stop-color="#FFF6BA" />
                <stop offset="60%" stop-color="#D4AF37" />
                <stop offset="100%" stop-color="#5B3A07" />
              </radialGradient>

              <!-- Clapper Ball Radial Gradient -->
              <radialGradient id="clapperBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#FFF8D0" />
                <stop offset="45%" stop-color="#D4AF37" />
                <stop offset="80%" stop-color="#8C5C10" />
                <stop offset="100%" stop-color="#2E1801" />
              </radialGradient>

              <!-- Clapper Rod Gradient -->
              <linearGradient id="clapperRodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#4A2E05" />
                <stop offset="40%" stop-color="#D4AF37" />
                <stop offset="70%" stop-color="#FFF3A8" />
                <stop offset="100%" stop-color="#382003" />
              </linearGradient>

              <!-- Dark Inner Cavity Gradient -->
              <radialGradient id="innerCavityGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#080400" />
                <stop offset="65%" stop-color="#180C02" />
                <stop offset="100%" stop-color="#361C04" />
              </radialGradient>
            </defs>

            <!-- 1. Top Chain Links (Unified directly with bell crown) -->
            <!-- Top Ceiling Hook -->
            <path d="M68 0 H92 V6 H68 Z" fill="url(#chainGold)" />
            <!-- Chain Link 1 -->
            <rect x="74" y="5" width="12" height="17" rx="6" fill="none" stroke="url(#chainGold)" stroke-width="3" />
            <!-- Chain Link 2 -->
            <rect x="74" y="18" width="12" height="17" rx="6" fill="none" stroke="url(#chainGold)" stroke-width="3" />
            <!-- Crown Top Ring Loop (Interlocked with Link 2 and Crown Cap) -->
            <circle cx="80" cy="38" r="8" fill="none" stroke="url(#chainGold)" stroke-width="3.5" />
            <circle cx="80" cy="38" r="4" fill="#FFE082" opacity="0.5" />

            <!-- 2. Crown Base Cap & Upper Neck -->
            <path d="M72 46 C72 40, 88 40, 88 46 Z" fill="url(#brassBodyGrad)" />
            <ellipse cx="80" cy="46" rx="13" ry="4.5" fill="url(#brassCrownRadial)" stroke="#382003" stroke-width="1" />

            <!-- 3. Main Bell Dome Body -->
            <path
              d="M72 46
                 C72 62, 58 84, 50 106
                 C42 124, 28 135, 24 138
                 C22 140, 25 142, 30 142
                 L130 142
                 C135 142, 138 140, 136 138
                 C132 135, 118 124, 110 106
                 C102 84, 88 62, 88 46
                 Z"
              fill="url(#brassBodyGrad)"
              stroke="#3D2502"
              stroke-width="1.5"
            />

            <!-- Specular Highlight Sheen -->
            <path
              d="M81 48
                 C81 62, 75 82, 71 106
                 C67 122, 60 133, 56 140
                 L64 140
                 C68 133, 76 122, 80 106
                 C84 82, 88 62, 88 48
                 Z"
              fill="#FFF8D0"
              opacity="0.35"
            />

            <!-- Traditional Decorative Ribs & Auspicious Dots -->
            <!-- Ring 1 (Upper) -->
            <path d="M63 72 C71 76, 89 76, 97 72" stroke="#5B3A07" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.65" />
            <path d="M63 73 C71 77, 89 77, 97 73" stroke="#FFF6BA" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.8" />

            <!-- Ring 2 (Middle) -->
            <path d="M54 98 C68 104, 92 104, 106 98" stroke="#5B3A07" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7" />
            <path d="M54 99 C68 105, 92 105, 106 99" stroke="#FFF6BA" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.85" />
            
            <!-- Auspicious Embossed Dots Pattern -->
            <circle cx="62" cy="101" r="1.8" fill="#5B3A07" />
            <circle cx="71" cy="103" r="1.8" fill="#5B3A07" />
            <circle cx="80" cy="103.5" r="1.8" fill="#5B3A07" />
            <circle cx="89" cy="103" r="1.8" fill="#5B3A07" />
            <circle cx="98" cy="101" r="1.8" fill="#5B3A07" />

            <!-- Ring 3 (Lower Waist) -->
            <path d="M38 126 C58 134, 102 134, 122 126" stroke="#4A2E05" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.75" />
            <path d="M38 127.5 C58 135.5, 102 135.5, 122 127.5" stroke="#FFF6BA" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.9" />

            <!-- 4. Deep Hollow Cavity (Interior Dark Depth) -->
            <ellipse cx="80" cy="142" rx="55" ry="12" fill="#120801" />
            <ellipse cx="80" cy="142" rx="50" ry="9" fill="url(#innerCavityGrad)" />

            <!-- 5. Clapper Assembly (Latkan) - SUSPENDED FROM INSIDE THE HOLLOW CAVITY -->
            <g id="bell-clapper-assembly" class="transition-transform duration-100">
              <!-- Internal Hanging Joint Loop inside dark cavity -->
              <circle cx="80" cy="137" r="2.5" fill="#4A2E05" />
              
              <!-- Clapper Brass Rod (Originates inside the dark hollow cavity) -->
              <rect x="78" y="137" width="4" height="30" rx="2" fill="url(#clapperRodGrad)" stroke="#2E1801" stroke-width="0.75" />
              
              <!-- Weighted Brass Latkan Ball (Ghanti ka Gola) -->
              <circle cx="80" cy="168" r="10.5" fill="url(#clapperBallGrad)" stroke="#2E1801" stroke-width="1.2" />
              <!-- Specular Light Reflection on Ball -->
              <ellipse cx="77" cy="164" rx="4" ry="2.5" fill="#FFFDE0" opacity="0.7" />
              
              <!-- Bottom Pendant Ring & Tag -->
              <rect x="78.5" y="178" width="3" height="8" rx="1.5" fill="url(#clapperRodGrad)" stroke="#2E1801" stroke-width="0.5" />
              <circle cx="80" cy="189" r="4.5" fill="url(#clapperBallGrad)" stroke="#382003" stroke-width="1" />
              <circle cx="80" cy="189" r="1.8" fill="#1A0D01" />
            </g>

            <!-- 6. Front Lower Rim (Foreground Lip: sits in front of the clapper root) -->
            <path
              d="M24 140
                 C28 152, 132 152, 136 140
                 C136 145, 132 156, 80 156
                 C28 156, 24 145, 24 140
                 Z"
              fill="url(#brassRimGrad)"
              stroke="#2E1801"
              stroke-width="1.5"
            />
            <!-- Front Rim Top Highlight Streak -->
            <path
              d="M27 141
                 C48 150, 112 150, 133 141
                 C112 147, 48 147, 27 141
                 Z"
              fill="#FFF9D6"
              opacity="0.9"
            />
          </svg>
        </div>

        <!-- Dynamic Ground Contact Shadow (Synchronizes with swing) -->
        <div id="bell-ground-shadow" class="w-28 h-4 rounded-full bg-amber-950/20 blur-[3px] transition-all duration-300 -mt-2"></div>

        <!-- Interactive Chime Counter & Prompt Badge -->
        <div class="mt-3 flex flex-col items-center gap-1.5 z-20">
          <button
            type="button"
            id="btn-ring-bell"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] text-[var(--heading)] font-heading font-bold text-xs shadow-md transition-all cursor-pointer group-hover:border-[var(--primary)] group-hover:shadow-lg"
          >
            <svg class="w-4 h-4 text-amber-500 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
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
    // 1. Play Authentic Web Audio Harmonic Chime
    this.audio.playChime();

    // 2. Increment & persist counter locally
    this.ringCount += 1;
    this.saveRings(this.ringCount);

    // 3. Atomically update Firestore counter for all connected users
    recordBellRing();

    // Update Counter UI
    const counterText = document.getElementById('bell-counter-text');
    if (counterText) {
      counterText.textContent = this.ringCount.toLocaleString('en-IN');
      counterText.classList.add('text-[var(--primary)]', 'scale-110');
      setTimeout(() => {
        counterText.classList.remove('text-[var(--primary)]', 'scale-110');
      }, 300);
    }

    // 3. Trigger Physics Pendulum Swing Animation on Bell Assembly & Clapper
    const bellAssembly = document.getElementById('bell-pendulum-assembly');
    const clapper = document.getElementById('bell-clapper-assembly');
    const aura = document.querySelector('.bell-divine-aura');
    const shockwave = document.getElementById('bell-shockwave');

    if (bellAssembly && clapper) {
      // Clear ongoing animation class to allow rapid re-triggers
      bellAssembly.classList.remove('animate-bell-swing');
      clapper.classList.remove('animate-clapper-counter-swing');
      void bellAssembly.offsetWidth; // Force reflow
      void clapper.offsetWidth;

      bellAssembly.classList.add('animate-bell-swing');
      clapper.classList.add('animate-clapper-counter-swing');

      if (this.animTimer) clearTimeout(this.animTimer);
      this.animTimer = setTimeout(() => {
        bellAssembly.classList.remove('animate-bell-swing');
        clapper.classList.remove('animate-clapper-counter-swing');
      }, 2400);
    }

    // 4. Divine Aura Flash & Ripple Shockwave Burst
    if (aura) {
      aura.classList.add('opacity-100', 'scale-125');
      setTimeout(() => {
        aura.classList.remove('opacity-100', 'scale-125');
      }, 600);
    }

    if (shockwave) {
      shockwave.classList.remove('animate-shockwave-burst');
      void shockwave.offsetWidth;
      shockwave.classList.add('animate-shockwave-burst');
    }

    // 5. Spawn Floating +1 Particle Sparkle
    this.spawnSparkle();
  }

  spawnSparkle() {
    const container = document.getElementById('bell-sparkles-container');
    if (!container) return;

    const sparkle = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 48;
    sparkle.className = 'absolute text-xs font-heading font-black text-amber-500 select-none pointer-events-none animate-sparkle-float';
    sparkle.style.left = `calc(50% + ${randomX}px)`;
    sparkle.style.top = '45%';
    sparkle.innerHTML = '✨ +1';

    container.appendChild(sparkle);
    setTimeout(() => {
      sparkle.remove();
    }, 1100);
  }
}
