import { t, getLanguage } from '../utils/i18n';
import { resolvePinCity } from '../utils/cities';
import { modalManager } from '../utils/modalManager';

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

    this.container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Section Header with View Full Leaderboard Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-heading font-black bg-rose-500/20 text-rose-400 dark:text-rose-300 border border-rose-500/40 animate-pulse">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                ${t('liveBadge')}
              </span>
              <h2 class="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-primary)]">
                ${t('leaderboardTitle')}
              </h2>
            </div>
            <p class="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              ${t('leaderboardSubtitle')}
            </p>
          </div>

          <button
            type="button"
            id="btn-open-full-leaderboard"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-heading font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <span>🏆</span>
            <span>${isHindi ? 'पूरा लीडरबोर्ड देखें' : 'View Full Leaderboard'}</span>
            <span class="text-xs">➔</span>
          </button>
        </div>

        <!-- Top 3 Preview Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- #1 Rank Hero Card (7 Cols) -->
          ${heroPin ? `
            <div class="lg:col-span-7 rounded-3xl bg-[var(--bg-card)] border-2 border-amber-500/50 p-4 sm:p-5 shadow-xl flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md">
                    ${t('heroBadgeRank')}
                  </span>
                  <span class="text-xs font-mono font-bold text-[var(--accent-amber-text)] bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                    👑 #1 RANK
                  </span>
                </div>

                <div class="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-color)] mb-3.5 relative">
                  <img
                    src="${heroPin.thumbnailUrl || heroPin.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=60'}"
                    alt="Hero Pothole"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-300 border border-slate-700">
                    📍 ${resolvePinCity(heroPin, isHindi)}
                  </div>
                </div>

                <h3 class="font-heading font-bold text-base text-[var(--text-primary)] line-clamp-2 leading-snug">
                  ${heroPin.landmark || t('defaultLandmark')}
                </h3>

                <div class="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-secondary)] flex-wrap">
                  <span class="bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                    ${t('rankRowReports', { n: heroPin.reportCount || 1 })}
                  </span>
                  <span class="bg-amber-500/20 text-[var(--accent-amber-text)] border border-amber-500/30 px-2 py-0.5 rounded-lg">
                    ${t('daysOpenText', { n: heroPin.daysOpen || 1 })}
                  </span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.__khaddaFlyToPin('${heroPin.id}')"
                  class="flex-1 py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-[var(--accent-amber-text)] border border-amber-500/40 font-heading font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>📍</span>
                  <span>${t('tapToViewOnMap')}</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="lg:col-span-7 p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-[var(--text-muted)] text-sm">
              ${t('leaderboardEmptyTitle')}
            </div>
          `}

          <!-- #2 and #3 Runner-Ups (5 Cols) -->
          <div class="lg:col-span-5 flex flex-col justify-start gap-3.5">
            ${runnerUps.length > 0 ? runnerUps.map((pin, idx) => `
              <div
                onclick="window.__khaddaFlyToPin('${pin.id}')"
                class="flex-1 p-4 rounded-3xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-amber-500/40 transition flex items-center gap-3.5 cursor-pointer group shadow-sm"
              >
                <div class="w-9 h-9 rounded-2xl ${idx === 0 ? 'bg-slate-300 text-slate-950 font-black' : 'bg-amber-700 text-white font-black'} font-mono text-xs flex items-center justify-center flex-shrink-0">
                  #${idx + 2}
                </div>

                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex-shrink-0">
                  ${pin.thumbnailUrl || pin.imageUrl ? `
                    <img src="${pin.thumbnailUrl || pin.imageUrl}" alt="thumb" class="w-full h-full object-cover" />
                  ` : `
                    <div class="w-full h-full flex items-center justify-center text-lg">🕳️</div>
                  `}
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--accent-amber-text)] transition">
                    ${pin.landmark || t('defaultLandmark')}
                  </h4>
                  <p class="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                    📍 ${resolvePinCity(pin, isHindi)}
                  </p>
                  <div class="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--accent-amber-text)]">
                    <span>🚨 ${pin.reportCount || 1} reps</span>
                    <span>👍 ${pin.upvotes || 0} votes</span>
                  </div>
                </div>
              </div>
            `).join('') : ''}
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
        class="fixed z-[1035] transition-all duration-300 ease-out bg-[var(--bg-surface)] backdrop-blur-md border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden opacity-0 pointer-events-none hidden
               bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-3xl border-t md:bottom-6 md:top-20 md:right-4 md:left-auto md:w-[410px] md:max-h-[calc(100dvh-104px)] md:rounded-3xl md:border"
      >
        <!-- Header & Drag Handle -->
        <div class="flex-shrink-0 pt-2.5 pb-2 px-4 border-b border-[var(--border-color)]">
          <!-- Mobile Drag Handle -->
          <div id="lb-drag-handle" class="w-full pb-2 flex items-center justify-center cursor-grab active:cursor-grabbing md:hidden">
            <div class="w-12 h-1.5 rounded-full bg-[var(--text-muted)] opacity-50"></div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏆</span>
              <div>
                <h3 class="font-heading font-extrabold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
                  ${t('leaderboardTitle')}
                </h3>
                <p class="text-[11px] text-[var(--text-muted)] leading-none mt-0.5">
                  ${t('leaderboardSubtitle')}
                </p>
              </div>
            </div>

            <!-- Close Button with direct onclick fallback -->
            <button
              id="btn-close-lb"
              type="button"
              onclick="window.__khaddaCloseLeaderboard && window.__khaddaCloseLeaderboard()"
              class="p-2 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] active:scale-95 transition cursor-pointer"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- 2 Main Tabs: Pothole of Week, Top Cities -->
          <div class="flex items-center gap-1.5 mt-3 bg-[var(--bg-card-subtle)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              id="tab-btn-week"
              type="button"
              class="flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg transition-all text-center ${this.activeTab === 'week' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
            >
              ${t('tabPotholeOfWeek')}
            </button>
            <button
              id="tab-btn-cities"
              type="button"
              class="flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg transition-all text-center ${this.activeTab === 'cities' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
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
          btn.className = 'flex-1 py-1.5 px-2 text-[11px] font-heading font-extrabold rounded-lg bg-amber-500 text-slate-950 shadow-sm transition-all text-center';
        } else {
          btn.className = 'flex-1 py-1.5 px-2 text-[11px] font-heading font-bold rounded-lg text-slate-400 hover:text-slate-200 transition-all text-center';
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
      const whatsappText = `👑 ${isHindi ? 'गड्ढा ऑफ द वीक!' : 'Pothole of the Week!'}\n📍 ${isHindi ? 'जगह' : 'Location'}: ${area} (${city})\n👥 ${reports} ${isHindi ? 'रिपोर्ट्स' : 'reports'} | 👍 ${upvotes} ${isHindi ? 'वोट्स' : 'upvotes'}\n⏳ ${days} ${isHindi ? 'दिन से बिना मरम्मत के खुला है!' : 'days without repair!'}\n👉 ${isHindi ? 'लाइव मैप पर देखें' : 'View on live map'}: ${shareUrl}`;
      const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

      html += `
        <div class="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border-2 border-amber-500/50 p-3.5 shadow-lg group">
          <!-- Hero Badge -->
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm">
              ${t('heroBadgeRank')}
            </span>
            <span class="text-[11px] font-mono font-bold text-[var(--accent-amber-text)] bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
              #1 RANK
            </span>
          </div>

          <!-- Hero Image & Info Grid -->
          <div class="flex gap-3">
            <div class="w-24 h-24 rounded-xl overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex-shrink-0 relative">
              <img src="${photo}" alt="Hero Pothole" class="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>

            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p class="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
                  ${area}
                </p>
                <p class="text-[11px] text-[var(--accent-amber-text)] font-semibold mt-0.5">
                  📍 ${city}
                </p>
              </div>

              <div class="flex items-center gap-2 text-[10px] font-mono text-[var(--text-secondary)] mt-1">
                <span class="bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                  ${t('rankRowReports', { n: reports })}
                </span>
                <span class="bg-amber-500/20 text-[var(--accent-amber-text)] border border-amber-500/30 px-1.5 py-0.5 rounded">
                  ${t('daysOpenText', { n: days })}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions: Fly to map & WhatsApp Share -->
          <div class="mt-3 pt-2.5 border-t border-[var(--border-color)] flex items-center gap-2">
            <button
              type="button"
              onclick="window.__khaddaFlyToPin('${heroPin.id}')"
              class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-heading font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>📍</span>
              <span>${t('tapToViewOnMap')}</span>
            </button>

            <a
              href="${whatsappHref}"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 px-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-heading font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 active:scale-95"
            >
              <span>💬</span>
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
          <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
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
            onclick="window.__khaddaFlyToPin('${pin.id}')"
            class="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] active:scale-[0.99] transition cursor-pointer group"
          >
            <!-- Rank Number -->
            <div class="w-7 h-7 rounded-xl bg-[var(--bg-card-subtle)] group-hover:bg-amber-500 group-hover:text-slate-950 font-mono font-black text-xs text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0 transition">
              #${rankNum}
            </div>

            <!-- Thumbnail -->
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex-shrink-0">
              ${thumb ? `
                <img src="${thumb}" alt="thumb" class="w-full h-full object-cover" />
              ` : `
                <div class="w-full h-full flex items-center justify-center text-sm">🕳️</div>
              `}
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-amber-text)] transition">
                ${area}
              </p>
              <p class="text-[10px] text-[var(--text-muted)]">
                📍 ${city}
              </p>
            </div>

            <!-- Counts -->
            <div class="text-right flex-shrink-0">
              <div class="text-xs font-heading font-extrabold text-[var(--accent-amber-text)]">
                ${t('rankRowReports', { n: reports })}
              </div>
              <div class="text-[10px] text-[var(--text-muted)]">
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
    const cities = this.leaderboardData?.topCities || [];

    if (cities.length === 0) {
      this.content.innerHTML = this.renderEmptyState();
      return;
    }

    let html = `
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
          ${t('tabTopCities')} (Active Road Hazards)
        </h4>
    `;

    cities.forEach((city, idx) => {
      const cityName = isHindi ? city.nameHindi : city.nameEnglish;
      const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

      html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 transition">
          <div class="flex items-center gap-3">
            <span class="text-base font-mono font-bold w-6 text-center">${rankBadge}</span>
            <div>
              <p class="font-heading font-bold text-sm text-[var(--text-primary)]">${cityName}</p>
              <p class="text-[10px] text-[var(--text-muted)]">${city.totalUpvotes || 0} नागरिक सत्यापन</p>
            </div>
          </div>

          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-heading font-extrabold bg-amber-500/15 text-[var(--accent-amber-text)] border border-amber-500/30">
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
    const pins = this.leaderboardData?.allTimeRankings || this.leaderboardData?.weekRankings || [];

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
          onclick="window.__khaddaFlyToPin('${pin.id}')"
          class="flex items-center gap-3 p-2.5 rounded-2xl bg-[#080C14] hover:bg-[#131C2E] border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition cursor-pointer group"
        >
          <div class="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-rose-500 group-hover:text-white font-mono font-black text-xs text-slate-300 flex items-center justify-center flex-shrink-0 transition">
            #${rankNum}
          </div>

          <div class="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
            ${thumb ? `
              <img src="${thumb}" alt="thumb" class="w-full h-full object-cover" />
            ` : `
              <div class="w-full h-full flex items-center justify-center text-sm">🕳️</div>
            `}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-rose-300 transition">
              ${area}
            </p>
            <p class="text-[10px] text-slate-400">📍 ${city}</p>
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
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
          🕳️
        </div>
        <h4 class="font-heading font-bold text-base text-white">${t('leaderboardEmptyTitle')}</h4>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">${t('leaderboardEmptyDesc')}</p>
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
      modalManager.closeActiveModal();
    } else {
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
