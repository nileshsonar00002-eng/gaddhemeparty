import { t, getLanguage } from '../utils/i18n';

/**
 * Animated Pothole Drive & Party Strip
 * Features continuous right-to-left vehicles (Bike, Auto, Car, Scooter)
 * that comically hit the central pothole, bounce, splash water & party confetti!
 */
export function initPotholeCartoonAnimation(mountId = 'pothole-animation-mount') {
  const container = document.getElementById(mountId);
  if (!container) return;

  const isHindi = getLanguage() === 'hindi';

  container.innerHTML = `
    <div class="w-full relative overflow-hidden select-none border-t border-[var(--border)]">
      <!-- Animation Stage Card (Full Width Edge-to-Edge) -->
      <div class="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-b from-[#3A1712] via-[#2A100C] to-[#1C0A08] flex flex-col justify-end">
        
        <!-- Sky & City Skyline Silhouette Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <!-- Moon / Sun -->
          <div class="absolute top-4 right-10 w-10 h-10 rounded-full bg-[#F2D9BD]/40 blur-[2px] border border-[#F2D9BD]/50"></div>
          
          <!-- Distant Trees & Buildings SVG -->
          <svg class="absolute bottom-16 left-0 right-0 w-full h-20 text-[#240C08]/90 fill-current preserve-3d" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0 120 L0 70 L30 70 L30 40 L60 40 L60 80 L90 80 L110 50 L140 50 L140 90 L180 90 L200 30 L240 30 L240 85 L280 85 L310 60 L350 60 L380 95 L420 95 L450 45 L490 45 L520 80 L560 80 L590 35 L630 35 L660 75 L700 75 L730 55 L770 55 L800 90 L840 90 L870 40 L910 40 L940 85 L980 85 L1010 60 L1050 60 L1090 90 L1130 50 L1170 50 L1200 80 L1200 120 Z"/>
          </svg>

          <!-- Streetlights -->
          <div class="absolute bottom-16 left-1/4 flex flex-col items-center opacity-70">
            <div class="w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_12px_#F59E0B]"></div>
            <div class="w-0.5 h-16 bg-[#521F17]"></div>
          </div>
          <div class="absolute bottom-16 right-1/4 flex flex-col items-center opacity-70">
            <div class="w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_12px_#F59E0B]"></div>
            <div class="w-0.5 h-16 bg-[#521F17]"></div>
          </div>
        </div>

        <!-- Warning Road Signboard -->
        <div class="absolute top-4 left-4 sm:left-8 z-10 bg-amber-500 text-[#3A1712] px-2.5 py-1 rounded-lg font-heading font-black text-[10px] sm:text-xs shadow-lg border-2 border-[#EBD9C3] flex items-center gap-1.5 animate-pulse">
          <span>⚠️</span>
          <span>${isHindi ? 'आगे गड्ढा है: पार्टी स्पॉट!' : 'CAUTION: POTHOLE PARTY AHEAD!'}</span>
        </div>

        <!-- The Road Track (Asphalt #3A1712 with Lane Dashes #F2D9BD) -->
        <div class="relative w-full h-24 sm:h-28 bg-[#3A1712] border-t-4 border-[#DCCFBF]/60 overflow-hidden shadow-inner flex flex-col justify-center">
          <!-- Animated Road Dashed Centerlines (Moving effect) -->
          <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 flex gap-6 overflow-hidden road-stripes-move">
            <div class="w-full flex-shrink-0 flex gap-8">
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
              <span class="w-12 h-1.5 bg-[#F2D9BD] rounded-full flex-shrink-0 opacity-90"></span>
            </div>
          </div>

          <!-- THE EPIC POTHOLE (Stationed at Center ~48%-52%) -->
          <div id="central-pothole-target" class="absolute left-1/2 -translate-x-1/2 bottom-2 sm:bottom-3 z-20 cursor-pointer group" title="Click for party explosion!">
            <!-- Dark Mud Hole with Ripple Rings -->
            <div class="relative w-28 sm:w-36 h-9 sm:h-11 bg-[#1A0805] rounded-[100%] border-2 border-[#DCCFBF]/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-visible">
              <!-- Mud Water -->
              <div class="absolute inset-1 rounded-[100%] bg-[#3B1A12]/90 backdrop-blur-xs flex items-center justify-center">
                <span class="text-[9px] font-mono font-black text-[#F2D9BD] tracking-widest uppercase select-none">#GDDP</span>
              </div>

              <!-- Pothole Party Flags -->
              <div class="absolute -top-3 left-2 text-xs animate-bounce" style="animation-duration: 1.2s">🚩</div>
              <div class="absolute -top-4 right-3 text-sm animate-bounce" style="animation-duration: 0.9s">🎉</div>
              <div class="absolute -bottom-1 text-xs">🕳️</div>

              <!-- Water Splash Particles Ring -->
              <div id="pothole-splash-emitter" class="absolute -top-6 inset-x-0 flex justify-center items-center pointer-events-none opacity-0">
                <span class="text-lg animate-ping">💦</span>
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- VEHICLES (Moving Right to Left continuously) -->
          <!-- ============================================== -->

          <!-- 1. BIKE / SCOOTER (Starts at 0s of 16s loop) -->
          <div class="vehicle-runner vehicle-bike absolute bottom-4 z-30 pointer-events-none flex flex-col items-center">
            <!-- Comic Bubble -->
            <div class="comic-bubble text-[10px] font-heading font-black bg-[#FFF6EC] text-[#3A1712] px-2 py-0.5 rounded-full border border-[#521F17] shadow-md mb-1 whitespace-nowrap opacity-0">
              DHADAM! 💥
            </div>
            <!-- Bike Graphic SVG (Facing Left) -->
            <svg class="w-14 sm:w-16 h-10 sm:h-12 drop-shadow-lg" viewBox="0 0 80 50" fill="none">
              <!-- Wheels -->
              <circle cx="20" cy="38" r="9" fill="#240C08" stroke="#6B5A52" stroke-width="2.5"/>
              <circle cx="20" cy="38" r="4" fill="#F9F2E8"/>
              <circle cx="62" cy="38" r="9" fill="#240C08" stroke="#6B5A52" stroke-width="2.5"/>
              <circle cx="62" cy="38" r="4" fill="#F9F2E8"/>
              <!-- Body Frame -->
              <path d="M20 38 L32 24 L52 24 L62 38 Z" fill="#D97706" stroke="#92400E" stroke-width="2"/>
              <path d="M32 24 L24 14" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
              <path d="M22 14 L28 14" stroke="#521F17" stroke-width="2.5" stroke-linecap="round"/>
              <!-- Seat -->
              <rect x="36" y="20" width="22" height="5" rx="2.5" fill="#1C0A08"/>
              <!-- Rider Body & Helmet (Bouncing) -->
              <circle cx="38" cy="8" r="6" fill="#C62828"/> <!-- Red Helmet -->
              <rect x="34" y="14" width="12" height="10" rx="3" fill="#7A2315"/> <!-- Rust Jacket -->
              <path d="M42 18 L26 15" stroke="#7A2315" stroke-width="2.5" stroke-linecap="round"/>
              <!-- Headlight -->
              <polygon points="12,18 4,14 4,22" fill="#FEF08A" opacity="0.8"/>
            </svg>
          </div>

          <!-- 2. AUTO RICKSHAW (Starts at 4s of 16s loop) -->
          <div class="vehicle-runner vehicle-auto absolute bottom-4 z-30 pointer-events-none flex flex-col items-center">
            <!-- Comic Bubble -->
            <div class="comic-bubble text-[10px] font-heading font-black bg-amber-400 text-[#3A1712] px-2 py-0.5 rounded-full border border-[#521F17] shadow-md mb-1 whitespace-nowrap opacity-0">
              OYE HOYE! 🎉
            </div>
            <!-- Auto Rickshaw SVG (Facing Left) -->
            <svg class="w-16 sm:w-20 h-12 sm:h-14 drop-shadow-xl" viewBox="0 0 90 60" fill="none">
              <!-- Wheels -->
              <circle cx="22" cy="46" r="10" fill="#240C08" stroke="#6B5A52" stroke-width="3"/>
              <circle cx="22" cy="46" r="4" fill="#F9F2E8"/>
              <circle cx="70" cy="46" r="10" fill="#240C08" stroke="#6B5A52" stroke-width="3"/>
              <circle cx="70" cy="46" r="4" fill="#F9F2E8"/>
              <!-- Body Yellow-Green Base -->
              <path d="M14 36 L18 16 L45 16 L80 18 L82 46 L22 46 Z" fill="#D97706" stroke="#92400E" stroke-width="2"/>
              <path d="M22 36 L82 36 L82 46 L22 46 Z" fill="#2E7D4F"/>
              <!-- Windshield & Canopy Top -->
              <path d="M18 16 L45 16 L78 18 L78 10 L30 10 L16 16 Z" fill="#1C0A08"/>
              <rect x="20" y="18" width="16" height="14" rx="2" fill="#E2E8F0" opacity="0.7"/>
              <!-- Driver with Mustache -->
              <circle cx="34" cy="24" r="5" fill="#F87171"/>
              <path d="M30 26 Q34 29 38 26" stroke="#1C0A08" stroke-width="1.5"/>
              <!-- Luggage Carrier on top -->
              <rect x="42" y="6" width="30" height="4" rx="1" fill="#6B5A52"/>
              <rect x="46" y="2" width="12" height="5" rx="1" fill="#C2410C"/>
              <rect x="60" y="3" width="10" height="4" rx="1" fill="#7A2315"/>
            </svg>
          </div>

          <!-- 3. FAMILY CAR / SEDAN (Starts at 8s of 16s loop) -->
          <div class="vehicle-runner vehicle-car absolute bottom-4 z-30 pointer-events-none flex flex-col items-center">
            <!-- Comic Bubble -->
            <div class="comic-bubble text-[10px] font-heading font-black bg-[#C62828] text-white px-2 py-0.5 rounded-full border border-[#521F17] shadow-md mb-1 whitespace-nowrap opacity-0">
              GADDHE ME PARTY! 🕺
            </div>
            <!-- Sedan Car SVG (Facing Left) -->
            <svg class="w-20 sm:w-24 h-12 sm:h-14 drop-shadow-xl" viewBox="0 0 110 55" fill="none">
              <!-- Wheels -->
              <circle cx="28" cy="42" r="10" fill="#240C08" stroke="#6B5A52" stroke-width="3"/>
              <circle cx="28" cy="42" r="4" fill="#F9F2E8"/>
              <circle cx="84" cy="42" r="10" fill="#240C08" stroke="#6B5A52" stroke-width="3"/>
              <circle cx="84" cy="42" r="4" fill="#F9F2E8"/>
              <!-- Car Body (Warm Rust Red) -->
              <path d="M8 38 L16 28 L36 28 L50 16 L82 16 L98 28 L104 38 L102 44 L10 44 Z" fill="#7A2315" stroke="#521F17" stroke-width="2"/>
              <!-- Windows -->
              <path d="M50 18 L78 18 L78 28 L40 28 Z" fill="#EFE5D6" opacity="0.8"/>
              <path d="M82 18 L94 28 L82 28 Z" fill="#EFE5D6" opacity="0.8"/>
              <!-- Headlight & Tail Light -->
              <polygon points="6,34 0,30 0,38" fill="#FEF08A" opacity="0.8"/>
              <rect x="100" y="30" width="4" height="6" rx="1" fill="#C62828"/>
              <!-- Passengers inside waving -->
              <circle cx="60" cy="23" r="4" fill="#FCD34D"/>
              <circle cx="72" cy="23" r="4" fill="#F472B6"/>
            </svg>
          </div>

          <!-- 4. THAR / JEEP / TRUCK (Starts at 12s of 16s loop) -->
          <div class="vehicle-runner vehicle-jeep absolute bottom-4 z-30 pointer-events-none flex flex-col items-center">
            <!-- Comic Bubble -->
            <div class="comic-bubble text-[10px] font-heading font-black bg-[#521F17] text-[#FFF6EC] px-2 py-0.5 rounded-full border border-[#DDD0C2] shadow-md mb-1 whitespace-nowrap opacity-0">
              SUSPENSION TESTED! 🛠️
            </div>
            <!-- Thar/Jeep SVG (Facing Left) -->
            <svg class="w-18 sm:w-22 h-14 sm:h-16 drop-shadow-xl" viewBox="0 0 100 65" fill="none">
              <!-- Big Off-road Wheels -->
              <circle cx="26" cy="50" r="12" fill="#1C0A08" stroke="#521F17" stroke-width="4"/>
              <circle cx="26" cy="50" r="5" fill="#DDD0C2"/>
              <circle cx="78" cy="50" r="12" fill="#1C0A08" stroke="#521F17" stroke-width="4"/>
              <circle cx="78" cy="50" r="5" fill="#DDD0C2"/>
              <!-- Rugged Dark Burgundy Body -->
              <path d="M10 44 L16 32 L36 32 L40 18 L86 18 L92 44 L92 52 L12 52 Z" fill="#3B1712" stroke="#240C08" stroke-width="2.5"/>
              <!-- Front Grill -->
              <rect x="12" y="34" width="6" height="12" fill="#D97706"/>
              <!-- Windows -->
              <rect x="44" y="22" width="22" height="10" rx="1" fill="#F1E6D8" opacity="0.8"/>
              <rect x="70" y="22" width="14" height="10" rx="1" fill="#F1E6D8" opacity="0.8"/>
              <!-- Roof Carrier with Party Speaker -->
              <rect x="42" y="14" width="40" height="4" fill="#6B5A52"/>
              <rect x="52" y="8" width="12" height="6" rx="2" fill="#C62828"/>
              <circle cx="56" cy="11" r="2" fill="#1C0A08"/>
            </svg>
          </div>

        </div>

        <!-- Road Base Curb Strip -->
        <div class="w-full h-3 bg-gradient-to-r from-[#7A2315] via-[#A83D29] to-[#7A2315] border-t border-[#3A1712] flex justify-between px-2">
          <span class="text-[8px] font-mono font-bold text-[#FFF6EC]">✦ Jaha Gaddha, Waha Party ✦</span>
          <span class="text-[8px] font-mono font-bold text-[#FFF6EC] hidden sm:inline">✦ Live Indian Road Simulation ✦</span>
        </div>
      </div>
    </div>
  `;

  // Interactive Click on Pothole to create confetti and splash
  const pothole = container.querySelector('#central-pothole-target');
  const splashBtn = container.querySelector('#btn-trigger-party-splash');
  const splashEmitter = container.querySelector('#pothole-splash-emitter');

  const triggerParty = () => {
    if (!splashEmitter) return;
    splashEmitter.classList.remove('opacity-0');
    splashEmitter.innerHTML = `
      <div class="flex items-center gap-2 -translate-y-4 transition-all duration-500">
        <span class="text-2xl animate-bounce">💦</span>
        <span class="text-2xl animate-bounce" style="animation-delay: 100ms">🎉</span>
        <span class="text-2xl animate-bounce" style="animation-delay: 200ms">💥</span>
        <span class="text-2xl animate-bounce" style="animation-delay: 300ms">💃</span>
      </div>
    `;
    setTimeout(() => {
      splashEmitter.classList.add('opacity-0');
      splashEmitter.innerHTML = '<span class="text-lg animate-ping">💦</span>';
    }, 1200);
  };

  pothole?.addEventListener('click', triggerParty);
  splashBtn?.addEventListener('click', triggerParty);
}
