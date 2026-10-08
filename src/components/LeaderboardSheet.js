import { t, getLanguage } from '../utils/i18n';
import { resolvePinCity } from '../utils/cities';
import { modalManager } from '../utils/modalManager';
import { getLucideIcon } from '../utils/icons';

export class LeaderboardSection {
  constructor(containerId = 'leaderboard-mount') {
    this.container = document.getElementById(containerId);
    this.activeTab = 'week'; // 'week' | 'month' | 'all' | 'cities'
    this.leaderboardData = null;
    this.lastUpdatedMinutes = 2;
  }

  setData(data) {
    this.leaderboardData = data;
    this.render();
  }

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  render() {
    if (!this.container) return;
    const isHindi = getLanguage() === 'hindi';

    const weekRankings = this.leaderboardData?.weekRankings || [];
    const top3Rankings = (weekRankings || []).slice(0, 3);
    const heroPin = top3Rankings[0] || null;
    const runnerUps = top3Rankings.slice(1, 3);

    const getCleanLabels = (pin) => {
      if (!pin) return { title: '', city: '' };
      const city = resolvePinCity(pin, isHindi);
      const rawLandmark = (pin.landmark || '').trim();
      const genericList = [
        'सड़क पर गहरा गड्ढा',
        'सड़क का गड्ढा',
        'सड़क पर गंभीर गड्ढा',
        'सड़क पर गड्ढा',
        'सड़क गड्ढा',
        'गड्ढा',
        'damaged road / pothole',
        'damaged road pothole',
        'damaged road',
        'pothole road',
        'pothole',
        'road pothole'
      ];
      const isGeneric = !rawLandmark || genericList.includes(rawLandmark.toLowerCase());
      if (isGeneric) {
        return { title: city, city };
      }
      return { title: rawLandmark, city };
    };

    const heroLabels = heroPin ? getCleanLabels(heroPin) : { title: '', city: '' };

    this.container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Section Header with View Full Leaderboard Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-heading font-black bg-rose-500/20 text-rose-400 dark:text-rose-300 border border-rose-500/40 animate-pulse">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                ${t('liveBadge')}
              </span>
              <h2 class="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text)]">
                ${t('leaderboardTitle')}
              </h2>
            </div>
            <p class="text-xs sm:text-sm text-[var(--muted)] mt-1">
              ${t('leaderboardSubtitle')}
            </p>
          </div>

          <button
            type="button"
            id="btn-open-full-leaderboard"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-none btn-primary text-xs sm:text-sm font-heading font-extrabold shadow-md transition cursor-pointer"
          >
            ${getLucideIcon('trophy', 'w-4 h-4 text-inherit shrink-0')}
            <span>${isHindi ? 'पूरा लीडरबोर्ड देखें' : 'View Full Leaderboard'}</span>
            <span class="text-xs">➔</span>
          </button>
        </div>

        <!-- Top 3 Preview Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- #1 Rank Hero Card (7 Cols) -->
          ${heroPin ? `
            <div class="card-lime tilt-card lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-[var(--primary)] text-[var(--primary-ink)] shadow-xs">
                    ${t('heroBadgeRank')}
                  </span>
                  <span class="badge-rank-gold text-xs tabular-nums font-mono font-bold px-3 py-0.5 rounded-lg flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-amber-900 fill-current" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
                    <span>#1 RANK</span>
                  </span>
                </div>

                <div class="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] mb-3.5 relative shadow-inner">
                  <img
                    src="${heroPin.thumbnailUrl || heroPin.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=60'}"
                    alt="Hero Pothole"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white border border-white/20 shadow-xs flex items-center gap-1">
                    <svg class="w-3 h-3 text-amber-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>${heroLabels.city}</span>
                  </div>
                </div>

                <h3 class="font-heading font-bold text-base text-[var(--text)] line-clamp-2 leading-snug">
                  ${heroLabels.title}
                </h3>

                <div class="flex items-center gap-2 mt-2 text-xs tabular-nums font-mono text-[var(--muted)] flex-wrap">
                  <span class="bg-[#D93025]/15 text-[#D93025] border border-[#D93025]/30 px-2 py-0.5 rounded-lg font-bold shadow-xs">
                    ${t('rankRowReports', { n: heroPin.reportCount || 1 })}
                  </span>
                  <span class="bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] px-2 py-0.5 rounded-lg shadow-xs">
                    ${t('daysOpenText', { n: heroPin.daysOpen || 1 })}
                  </span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.__khaddaFlyToPin('${heroPin.id}')"
                  class="btn-primary flex-1 py-2.5 px-3 text-xs rounded-none flex items-center justify-center gap-1.5 shadow-md cursor-pointer font-bold"
                >
                  <svg class="w-3.5 h-3.5 text-inherit shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>${t('tapToViewOnMap')}</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="card-lime lg:col-span-7 p-8 text-center text-[var(--muted)] text-sm">
              ${t('leaderboardEmptyTitle')}
            </div>
          `}

          <!-- #2 and #3 Runner-Ups (5 Cols) -->
          <div class="lg:col-span-5 flex flex-col justify-start gap-3.5">
            ${runnerUps.length > 0 ? runnerUps.map((pin, idx) => {
              const pinLabels = getCleanLabels(pin);
              return `
              <div
                onclick="window.__khaddaFlyToPin('${pin.id}')"
                class="card-lime tilt-card flex-1 p-4 flex items-center gap-3.5 cursor-pointer group"
              >
                <div class="${idx === 0 ? 'badge-rank-silver' : 'badge-rank-bronze'} w-9 h-9 rounded-2xl font-bold tabular-nums font-mono text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                  #${idx + 2}
                </div>

                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0 shadow-xs">
                  ${pin.thumbnailUrl || pin.imageUrl ? `
                    <img src="${pin.thumbnailUrl || pin.imageUrl}" alt="thumb" class="w-full h-full object-cover" />
                  ` : `
                    <div class="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    </div>
                  `}
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="font-heading font-bold text-xs sm:text-sm text-[var(--text)] truncate group-hover:text-[var(--primary)] transition">
                    ${pinLabels.title}
                  </h4>
                  <p class="text-[11px] text-[var(--muted)] mt-0.5 truncate flex items-center gap-1">
                    <svg class="w-3 h-3 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>${pinLabels.city}</span>
                  </p>
                  <div class="flex items-center gap-2 mt-1 text-[10px] tabular-nums font-mono text-[var(--primary)]">
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3 text-rose-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      <span>${pin.reportCount || 1} reps</span>
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                      <span>${pin.upvotes || 0} votes</span>
                    </span>
                  </div>
                </div>
              </div>
            `;
            }).join('') : ''}
          </div>
        </div>
      </div>
    `;

    // Attach Click listener to open full leaderboard panel
    document.getElementById('btn-open-full-leaderboard')?.addEventListener('click', () => {
      window.location.hash = '#/leaderboard';
    });
  }
}

export class LeaderboardSheet {
  constructor(options = {}) {
    this.container = document.getElementById('leaderboard-container');
    this.onSelectPin = options.onSelectPin || null;
    this.onCloseCallback = options.onClose || null;
    this.activeTab = 'week'; // 'week' | 'cities' | 'most'
    this.timeFilter = 'week'; // 'week' | 'month' | 'all'
    this.isOpen = false;
    this.snapState = 'half'; // 'peek' | 'half' | 'full'
    this.leaderboardData = options.initialData || null;
    this.isLoading = false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <!-- Desktop & Mobile Backdrop -->
      <div id="lb-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1030] opacity-0 pointer-events-none transition-opacity duration-300"></div>

      <!-- Responsive Leaderboard: Bottom Sheet on Mobile (< 768px), Right Drawer on Desktop (>= 768px) -->
      <div
        id="lb-panel"
        class="fixed z-[1035] transition-all duration-300 ease-out bg-[var(--surface)] backdrop-blur-md border-[var(--border)] shadow-2xl flex flex-col overflow-hidden opacity-0 pointer-events-none hidden
               bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-3xl border-t md:bottom-6 md:top-20 md:right-4 md:left-auto md:w-[410px] md:max-h-[calc(100dvh-104px)] md:rounded-2xl md:border"
      >
        <!-- Header & Drag Handle -->
        <div class="flex-shrink-0 pt-2.5 pb-2 px-4 border-b border-[var(--border)]">
          <!-- Mobile Drag Handle -->
          <div id="lb-drag-handle" class="w-full pb-2 flex items-center justify-center cursor-grab active:cursor-grabbing md:hidden">
            <div class="w-12 h-1.5 rounded-full bg-[var(--text-muted)] opacity-50"></div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[var(--accent)] shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15l-2 5l-1-2l-2 1l1-3l-2-1l3-1l-1-3l3 2l2-3l1 3l3-1l-1 3l2 1l-3 1l1 3l-2-1z"/></svg>
              </div>
              <div>
                <h3 class="font-heading font-extrabold text-base sm:text-lg text-[var(--text)] leading-tight">
                  ${t('leaderboardTitle')}
                </h3>
                <p class="text-[11px] text-[var(--muted)] leading-none mt-0.5">
                  ${t('leaderboardSubtitle')}
                </p>
              </div>
            </div>

            <!-- Close Button with direct onclick fallback -->
            <button
              id="btn-close-lb"
              type="button"
              onclick="window.__khaddaCloseLeaderboard && window.__khaddaCloseLeaderboard()"
              class="p-2 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition cursor-pointer"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- 2 Main Tabs: Pothole of Week, Top Cities -->
          <div class="flex items-center gap-1.5 mt-3 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
            <button
              id="tab-btn-week"
              type="button"
              class="flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg transition-all text-center ${this.activeTab === 'week' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-bold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
            >
              ${t('tabPotholeOfWeek')}
            </button>
            <button
              id="tab-btn-cities"
              type="button"
              class="flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg transition-all text-center ${this.activeTab === 'cities' ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-bold shadow-xs' : 'text-[var(--muted)] hover:text-[var(--text)]'}"
            >
              ${t('tabTopCities')}
            </button>
          </div>
        </div>

        <!-- Scrollable Content -->
        <div id="lb-content" class="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain">
          <!-- Dynamically populated via renderContent() -->
        </div>
      </div>
    `;

    this.backdrop = document.getElementById('lb-backdrop');
    this.panel = document.getElementById('lb-panel');
    this.content = document.getElementById('lb-content');
    this.dragHandle = document.getElementById('lb-drag-handle');

    this.attachEventListeners();
  }

  attachEventListeners() {
    this.backdrop?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

    const closeBtn = document.getElementById('btn-close-lb');
    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

    // Tab Listeners
    document.getElementById('tab-btn-week')?.addEventListener('click', () => this.switchTab('week'));
    document.getElementById('tab-btn-cities')?.addEventListener('click', () => this.switchTab('cities'));

    // Touch dragging & Snap points on Mobile
    let startY = 0;
    let currentY = 0;

    this.dragHandle?.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    this.dragHandle?.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        this.panel.style.transform = `translateY(${diff}px)`;
      }
    }, { passive: true });

    this.dragHandle?.addEventListener('touchend', () => {
      const diff = currentY - startY;
      if (diff > 100) {
        this.close();
      } else {
        this.panel.style.transform = 'translateY(0)';
      }
      startY = 0;
      currentY = 0;
    });
  }

  setData(data) {
    this.leaderboardData = data;
    this.isLoading = false;
    if (this.isOpen) {
      this.renderContent();
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    // Update Tab Button Styles
    ['week', 'cities'].forEach((tKey) => {
      const btn = document.getElementById(`tab-btn-${tKey}`);
      if (btn) {
        if (tKey === tab) {
          btn.className = 'flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg bg-[var(--primary)] text-[var(--primary-ink)] shadow-xs transition-all text-center';
        } else {
          btn.className = 'flex-1 py-1.5 px-2 text-[11px] font-heading font-medium rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-all text-center';
        }
      }
    });
    this.renderContent();
  }

  renderContent() {
    if (!this.content) return;

    if (this.isLoading) {
      this.content.innerHTML = this.renderSkeletons();
      return;
    }

    if (this.activeTab === 'week') {
      this.renderWeekTab();
    } else if (this.activeTab === 'cities') {
      this.renderCitiesTab();
    }
  }

  renderWeekTab() {
    const isHindi = getLanguage() === 'hindi';
    const heroPin = this.leaderboardData?.heroPotholeOfWeek || this.leaderboardData?.weekRankings?.[0];
    const ranks = (this.leaderboardData?.weekRankings || []).slice(1, 10);

    if (!heroPin && ranks.length === 0) {
      this.content.innerHTML = this.renderEmptyState();
      return;
    }

    let html = '';

    // Hero Card: "गड्ढा ऑफ द वीक"
    if (heroPin) {
      const area = heroPin.landmark || (isHindi ? 'सड़क पर गंभीर गड्ढा' : 'Damaged Road Pothole');
      const city = resolvePinCity(heroPin, isHindi);
      const photo = heroPin.thumbnailUrl || heroPin.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=320&auto=format&fit=crop&q=60';
      const days = heroPin.daysOpen || 12;
      const reports = heroPin.reportCount || 7;
      const upvotes = heroPin.upvotes || 35;

      const shareOrigin = window.location.origin;
      const shareUrl = `${shareOrigin}/#pin=${heroPin.id}`;
      const whatsappText = `${isHindi ? 'गड्ढा ऑफ द वीक!' : 'Pothole of the Week!'}\n📍 ${isHindi ? 'जगह' : 'Location'}: ${area} (${city})\n👥 ${reports} ${isHindi ? 'रिपोर्ट्स' : 'reports'} | 👍 ${upvotes} ${isHindi ? 'वोट्स' : 'upvotes'}\n⏳ ${days} ${isHindi ? 'दिन से बिना मरम्मत के खुला है!' : 'days without repair!'}\n👉 ${isHindi ? 'लाइव मैप पर देखें' : 'View on live map'}: ${shareUrl}`;
      const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

      html += `
        <div class="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3.5 shadow-sm group">
          <!-- Hero Badge -->
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-bold bg-[var(--primary)] text-[var(--primary-ink)] shadow-xs">
              ${t('heroBadgeRank')}
            </span>
            <span class="text-[11px] tabular-nums font-mono font-bold text-[var(--primary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)] flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-amber-600 fill-current" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
              <span>#1 RANK</span>
            </span>
          </div>

          <!-- Hero Image & Info Grid -->
          <div class="flex gap-3">
            <div class="w-24 h-24 rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0 relative">
              <img src="${photo}" alt="Hero Pothole" class="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>

            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p class="font-heading font-bold text-xs sm:text-sm text-[var(--text)] line-clamp-2 leading-snug">
                  ${area}
                </p>
                <p class="text-[11px] text-[var(--primary)] font-semibold mt-0.5 flex items-center gap-1">
                  <svg class="w-3 h-3 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>${city}</span>
                </p>
              </div>

              <div class="flex items-center gap-2 text-[10px] tabular-nums font-mono text-[var(--muted)] mt-1">
                <span class="bg-[#D93025]/15 text-[#D93025] border border-[#D93025]/30 px-1.5 py-0.5 rounded">
                  ${t('rankRowReports', { n: reports })}
                </span>
                <span class="bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                  ${t('daysOpenText', { n: days })}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions: Fly to map & WhatsApp Share -->
          <div class="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center gap-2">
            <button
              type="button"
              onclick="window.__khaddaFlyToPin('${heroPin.id}', 1)"
              class="btn-primary flex-1 py-2 px-3 text-xs rounded-none flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-bold"
            >
              <svg class="w-3.5 h-3.5 text-inherit shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>${t('tapToViewOnMap')}</span>
            </button>

            <a
              href="${whatsappHref}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary py-2 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer font-medium"
            >
              <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              <span class="hidden xs:inline">${t('shareHeroWhatsapp')}</span>
            </a>
          </div>
        </div>
      `;
    }

    // Ranks 2 - 10
    if (ranks.length > 0) {
      html += `
        <div class="space-y-2 pt-1">
          <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
            Top Contenders (Ranks 2 - 10)
          </h4>
      `;

      ranks.forEach((pin, index) => {
        const rankNum = index + 2;
        const area = pin.landmark || (isHindi ? 'सड़क पर गहरा गड्ढा' : 'Pothole Road');
        const city = resolvePinCity(pin, isHindi);
        const thumb = pin.thumbnailUrl || pin.imageUrl || '';
        const reports = pin.reportCount || 1;
        const upvotes = pin.upvotes || 0;

        html += `
          <div
            onclick="window.__khaddaFlyToPin('${pin.id}', ${rankNum})"
            class="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] active:scale-[0.99] transition cursor-pointer group"
          >
            <!-- Rank Number -->
            <div class="w-7 h-7 rounded-xl bg-[var(--surface-2)] group-hover:bg-amber-500 group-hover:text-slate-950 tabular-nums font-mono font-black text-xs text-[var(--muted)] flex items-center justify-center flex-shrink-0 transition">
              #${rankNum}
            </div>

            <!-- Thumbnail -->
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0">
              ${thumb ? `
                <img src="${thumb}" alt="thumb" class="w-full h-full object-cover" />
              ` : `
                <div class="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                </div>
              `}
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition">
                ${area}
              </p>
              <p class="text-[10px] text-[var(--muted)] flex items-center gap-1">
                <svg class="w-3 h-3 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>${city}</span>
              </p>
            </div>

            <!-- Counts -->
            <div class="text-right flex-shrink-0">
              <div class="text-xs font-heading font-extrabold text-[var(--accent)]">
                ${t('rankRowReports', { n: reports })}
              </div>
              <div class="text-[10px] text-[var(--muted)]">
                +${upvotes} votes
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    this.content.innerHTML = html;
  }

  renderCitiesTab() {
    const isHindi = getLanguage() === 'hindi';
    const cities = (this.leaderboardData?.topCities || []).slice(0, 10);

    if (cities.length === 0) {
      this.content.innerHTML = this.renderEmptyState();
      return;
    }

    let html = `
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
          ${t('tabTopCities')} (Active Road Hazards)
        </h4>
    `;

    cities.forEach((city, idx) => {
      const cityName = isHindi ? city.nameHindi : city.nameEnglish;
      const rankBadgeHtml = idx === 0 ? `<span class="badge-rank-gold px-2 py-0.5 rounded text-[11px] font-bold">#1</span>` : idx === 1 ? `<span class="badge-rank-silver px-2 py-0.5 rounded text-[11px] font-bold">#2</span>` : idx === 2 ? `<span class="badge-rank-bronze px-2 py-0.5 rounded text-[11px] font-bold">#3</span>` : `<span class="text-xs font-mono font-bold text-[var(--muted)]">#${idx + 1}</span>`;

      html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500/40 transition">
          <div class="flex items-center gap-3">
            <span class="tabular-nums font-mono font-bold w-7 text-center flex items-center justify-center">${rankBadgeHtml}</span>
            <div>
              <p class="font-heading font-bold text-sm text-[var(--text)]">${cityName}</p>
              <p class="text-[10px] text-[var(--muted)]">${city.totalUpvotes || 0} नागरिक सत्यापन</p>
            </div>
          </div>

          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-heading font-extrabold bg-amber-500/15 text-[var(--accent)] border border-amber-500/30">
              ${t('cityReportsCount', { n: city.count })}
            </span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.content.innerHTML = html;
  }

  renderMostReportedTab() {
    const isHindi = getLanguage() === 'hindi';
    const pins = (this.leaderboardData?.allTimeRankings || this.leaderboardData?.weekRankings || []).slice(0, 10);

    if (pins.length === 0) {
      this.content.innerHTML = this.renderEmptyState();
      return;
    }

    let html = `
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          ${t('tabMostReported')} (All Time)
        </h4>
    `;

    pins.forEach((pin, index) => {
      const rankNum = index + 1;
      const area = pin.landmark || (isHindi ? 'सड़क पर गहरा गड्ढा' : 'Damaged Road Pothole');
      const city = resolvePinCity(pin, isHindi);
      const thumb = pin.thumbnailUrl || pin.imageUrl || '';
      const reports = pin.reportCount || 1;
      const upvotes = pin.upvotes || 0;

      html += `
        <div
          onclick="window.__khaddaFlyToPin('${pin.id}', ${rankNum})"
          class="flex items-center gap-3 p-2.5 rounded-2xl bg-[#080C14] hover:bg-[#131C2E] border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition cursor-pointer group"
        >
          <div class="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-rose-500 group-hover:text-white tabular-nums font-mono font-black text-xs text-slate-300 flex items-center justify-center flex-shrink-0 transition">
            #${rankNum}
          </div>

          <div class="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
            ${thumb ? `
              <img src="${thumb}" alt="thumb" class="w-full h-full object-cover" />
            ` : `
              <div class="w-full h-full flex items-center justify-center text-sm">
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
            `}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-rose-300 transition">
              ${area}
            </p>
            <p class="text-[10px] text-slate-400 font-medium">${city}</p>
          </div>

          <div class="text-right flex-shrink-0">
            <div class="text-xs font-heading font-extrabold text-rose-400">
              ${t('rankRowReports', { n: reports })}
            </div>
            <div class="text-[10px] text-slate-400">
              +${upvotes} votes
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.content.innerHTML = html;
  }

  renderSkeletons() {
    return `
      <div class="space-y-3 animate-pulse">
        <div class="h-32 bg-slate-800/60 rounded-2xl border border-slate-700/40"></div>
        <div class="h-14 bg-slate-800/40 rounded-2xl border border-slate-800"></div>
        <div class="h-14 bg-slate-800/40 rounded-2xl border border-slate-800"></div>
        <div class="h-14 bg-slate-800/40 rounded-2xl border border-slate-800"></div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12 px-4 space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <h4 class="font-heading font-bold text-base text-[var(--text)]">${t('leaderboardEmptyTitle')}</h4>
        <p class="text-xs text-[var(--muted)] max-w-xs mx-auto">${t('leaderboardEmptyDesc')}</p>
      </div>
    `;
  }

  open() {
    if (!this.panel || !this.backdrop) return;
    this.isOpen = true;

    modalManager.openModal('leaderboard-sheet', () => this.close(false));

    this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
    this.backdrop.classList.add('opacity-100', 'pointer-events-auto');

    // Make panel visible and slide in
    this.panel.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
    this.panel.style.transform = 'translate(0, 0)';

    this.renderContent();
  }

  close(notifyManager = true) {
    if (!this.panel || !this.backdrop) return;
    this.isOpen = false;

    if (notifyManager) {
      modalManager.notifyClosed('leaderboard-sheet');
    }

    this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    this.backdrop.classList.add('opacity-0', 'pointer-events-none');

    // Shift panel off-screen and hide
    this.panel.classList.add('opacity-0', 'pointer-events-none');
    this.panel.style.transform = window.innerWidth >= 768 ? 'translateX(120%)' : 'translateY(120%)';

    setTimeout(() => {
      if (!this.isOpen && this.panel) {
        this.panel.classList.add('hidden');
      }
    }, 300);

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
