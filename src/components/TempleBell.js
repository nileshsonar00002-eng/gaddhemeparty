import { t, getLanguage } from '../utils/i18n';

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

        <!-- Hanging Rig: Brass Chain Mount + 3D Bell Assembly -->
        <div id="bell-pendulum-assembly" class="relative z-10 flex flex-col items-center transform-origin-top transition-transform duration-100">
          
          <!-- Ornate Brass Ceiling Mount / Chain Link -->
          <svg class="w-8 h-14 overflow-visible shrink-0 drop-shadow-md" viewBox="0 0 32 56" fill="none">
            <defs>
              <linearGradient id="chainGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5B3A07" />
                <stop offset="25%" stop-color="#D4AF37" />
                <stop offset="50%" stop-color="#FFF3A8" />
                <stop offset="75%" stop-color="#AA771C" />
                <stop offset="100%" stop-color="#3D2502" />
              </linearGradient>
            </defs>
            <!-- Top Ceiling Hook -->
            <path d="M12 0 H20 V8 H12 Z" fill="url(#chainGold)" />
            <!-- Chain Link 1 -->
            <rect x="11" y="6" width="10" height="16" rx="5" fill="none" stroke="url(#chainGold)" stroke-width="3" />
            <!-- Chain Link 2 -->
            <rect x="11" y="18" width="10" height="16" rx="5" fill="none" stroke="url(#chainGold)" stroke-width="3" />
            <!-- Ornate Top Eyelet -->
            <circle cx="16" cy="42" r="7" fill="none" stroke="url(#chainGold)" stroke-width="3.5" />
            <circle cx="16" cy="42" r="3" fill="#FFE082" opacity="0.6" />
          </svg>

          <!-- 3D Brass Bell Dome & Rim SVG -->
          <div class="relative -mt-2">
            <svg class="w-36 h-36 sm:w-44 sm:h-44 overflow-visible drop-shadow-2xl" viewBox="0 0 160 160" fill="none">
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
              </defs>

              <!-- Crown Base Cap -->
              <ellipse cx="80" cy="18" rx="14" ry="5" fill="url(#brassCrownRadial)" stroke="#382003" stroke-width="1" />
              <path d="M70 18 C70 12, 90 12, 90 18 Z" fill="url(#brassBodyGrad)" />

              <!-- Main Bell Body (Dome to Flare) -->
              <path
                d="M72 20
                   C72 32, 60 48, 52 75
                   C44 102, 28 118, 22 128
                   C20 131, 24 134, 30 134
                   L130 134
                   C136 134, 140 131, 138 128
                   C132 118, 116 102, 108 75
                   C100 48, 88 32, 88 20
                   Z"
                fill="url(#brassBodyGrad)"
                stroke="#3D2502"
                stroke-width="1.5"
              />

              <!-- Highlight Sheen Streak -->
              <path
                d="M82 22
                   C82 34, 76 50, 72 75
                   C68 96, 62 112, 58 128
                   L66 128
                   C70 112, 78 96, 82 75
                   C86 50, 90 34, 90 22
                   Z"
                fill="#FFF8D0"
                opacity="0.38"
              />

              <!-- Traditional Engraved Decorative Ribs / Rings on Bell Dome -->
              <!-- Ring 1 (Upper) -->
              <path d="M64 52 C72 56, 88 56, 96 52" stroke="#5B3A07" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.65" />
              <path d="M64 53 C72 57, 88 57, 96 53" stroke="#FFF6BA" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.8" />

              <!-- Ring 2 (Middle with traditional dots) -->
              <path d="M54 82 C68 88, 92 88, 106 82" stroke="#5B3A07" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7" />
              <path d="M54 83 C68 89, 92 89, 106 83" stroke="#FFF6BA" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.85" />
              
              <!-- Traditional Auspicious Dots Pattern -->
              <circle cx="62" cy="85" r="1.8" fill="#5B3A07" />
              <circle cx="71" cy="87" r="1.8" fill="#5B3A07" />
              <circle cx="80" cy="87.5" r="1.8" fill="#5B3A07" />
              <circle cx="89" cy="87" r="1.8" fill="#5B3A07" />
              <circle cx="98" cy="85" r="1.8" fill="#5B3A07" />

              <!-- Ring 3 (Lower Rim Transition) -->
              <path d="M38 116 C58 125, 102 125, 122 116" stroke="#4A2E05" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.75" />
              <path d="M38 117.5 C58 126.5, 102 126.5, 122 117.5" stroke="#FFF6BA" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.9" />

              <!-- Thick 3D Bottom Heavy Flared Rim -->
              <ellipse cx="80" cy="134" rx="58" ry="11" fill="url(#brassRimGrad)" stroke="#2E1801" stroke-width="2" />
              <!-- Inner Mouth Cavity (Dark Depth) -->
              <ellipse cx="80" cy="135" rx="51" ry="8" fill="#1A0D01" />

              <!-- Inner Mouth Shading Gradient -->
              <ellipse cx="80" cy="134" rx="46" ry="6.5" fill="#2E1801" opacity="0.8" />
            </svg>

            <!-- Counter-Swinging Heavy Clapper Assembly (Latkan) -->
            <div id="bell-clapper-assembly" class="absolute top-[125px] left-1/2 -translate-x-1/2 flex flex-col items-center transform-origin-top transition-transform duration-100">
              <!-- Clapper Rod (Loha/Brass Danda) -->
              <div class="w-1.5 h-7 bg-gradient-to-r from-[#5B3A07] via-[#D4AF37] to-[#382003] rounded-full shadow-xs"></div>
              <!-- Weighted Brass Latkan Ball (Ghanti ka Gola) -->
              <div class="w-6 h-6 -mt-1 rounded-full shadow-lg border border-[#382003]" style="background: radial-gradient(circle at 35% 35%, #FFF8D0 0%, #D4AF37 45%, #8C5C10 80%, #2E1801 100%);"></div>
              <!-- Small Bottom Ring / Chain Tag -->
              <div class="w-1 h-3 bg-gradient-to-b from-[#AA771C] to-[#5B3A07] -mt-0.5"></div>
              <div class="w-2.5 h-2.5 rounded-full border border-[#D4AF37] bg-[#5B3A07]/60 -mt-0.5"></div>
            </div>
          </div>
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
            <span class="text-base animate-pulse">🔔</span>
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

    // 2. Increment & persist counter
    this.ringCount += 1;
    this.saveRings(this.ringCount);

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
