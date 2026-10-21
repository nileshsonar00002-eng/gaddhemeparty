// KHADDA Admin Panel - Main Application Controller

import './style.css';
import {
  initAdminAuth,
  subscribeToModerationQueue,
  subscribeToGlobalStats,
  getTodayDateKeyIST,
  approvePin,
  rejectPin,
  bulkApprovePins,
  bulkRejectPins,
  bulkArchivePins,
  bulkDeletePins,
  updatePinLandmark,
  archivePin,
  hardDeletePin,
  deletePinPhoto,
  fetchAllPinCommentsForAdmin,
  toggleHidePinComment,
  deletePinCommentAdmin,
  observeAdminAuthState,
  auth
} from './services/firebase';
import { checkIsAdminAuthenticated, setAdminAuthenticated, renderAuthGate } from './components/AuthGate';
import { renderNavbar } from './components/Navbar';
import { renderStatsBar } from './components/StatsBar';
import { renderQueueFilter } from './components/QueueFilter';
import { renderCommentsPanel, formatCommentDateKey } from './components/CommentsPanel';
import { createReportCardHtml } from './components/ReportCard';
import { openLightbox } from './components/ImageLightbox';
import { openRejectModal } from './components/RejectModal';
import { openEditModal } from './components/EditModal';
import { openImageEditModal } from './components/ImageEditModal';
import { showToast } from './components/Toast';
import { playNewPendingChime, playApprovePing, playRejectWoosh } from './utils/audio';
import { initMiniMap, cleanupAllMiniMaps } from './utils/leafletMap';

// Global Exposure for inline HTML onclick handlers
window.__khaddaAdminOpenLightbox = (images, title, initialIndex = 0) => openLightbox(images, title, initialIndex);

class AdminApp {
  constructor() {
    this.appEl = document.getElementById('app');
    this.allPins = [];
    this.allComments = [];
    this.commentSort = 'new'; // 'new' | 'old'
    this.commentDate = ''; // 'YYYY-MM-DD'
    this.isCommentsLoading = false;
    this.activeTab = 'pending';
    this.selectedCity = 'all';
    this.sortBy = 'newest';
    this.searchQuery = '';
    this.selectedPinIds = new Set();
    this.isAudioEnabled = true;
    this.isConnected = true;
    this.initialLoadDone = false;
    this.previousPendingIds = new Set();
    this.unsubscribeFirestore = null;
    this.unsubscribeGlobalStats = null;
    this.globalStats = {};
    this.storageListenerBound = false;
  }

  async init() {
    this.renderLoadingAuth();

    // Listen to live Firebase Authentication state & verify authorization
    observeAdminAuthState(async (user, isAuthorized) => {
      if (user && isAuthorized) {
        setAdminAuthenticated(true, user);
        if (!this.initialLoadDone) {
          await this.startDashboard();
        }
      } else {
        setAdminAuthenticated(false);
        this.initialLoadDone = false;
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
        if (this.unsubscribeGlobalStats) {
          this.unsubscribeGlobalStats();
          this.unsubscribeGlobalStats = null;
        }
        renderAuthGate(this.appEl, async () => {
          await this.startDashboard();
        });
      }
    });
  }

  renderLoadingAuth() {
    this.appEl.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0B0F19] text-slate-300 gap-4">
        <div class="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-sm font-semibold tracking-wide flex items-center gap-2">
          <span>🛡️</span>
          <span>Connecting to Firebase Auth...</span>
        </div>
      </div>
    `;
  }

  async startDashboard() {
    this.renderSkeleton();
    await initAdminAuth();

    if (!this.storageListenerBound && typeof window !== 'undefined') {
      this.storageListenerBound = true;
      window.addEventListener('storage', (e) => {
        if (!e.key || e.key.startsWith('khadda_comments_') || e.key.includes('comment')) {
          this.loadAllComments(false);
        }
      });
    }

    // Setup Realtime Firestore Global Stats Listener
    this.unsubscribeGlobalStats = subscribeToGlobalStats(
      (stats) => {
        this.globalStats = stats || {};
        if (this.initialLoadDone) {
          this.renderStatsBarSection();
        }
      },
      (error) => {
        console.warn('[Admin] Global stats subscription notice:', error);
      }
    );

    // Setup Realtime Firestore Listener
    this.unsubscribeFirestore = subscribeToModerationQueue(
      (pins) => {
        this.handlePinsUpdated(pins);
      },
      (error) => {
        console.error('[Admin] Firestore subscription error:', error);
        this.isConnected = false;
        this.render();
      }
    );
  }

  renderSkeleton() {
    this.appEl.innerHTML = `
      <div id="admin-navbar-mount"></div>
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div id="admin-stats-mount"></div>
        <div id="admin-filter-mount"></div>
        <div id="admin-comments-mount"></div>
        <div id="admin-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div class="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-semibold">Connecting to live Firestore queue...</p>
          </div>
        </div>
      </main>
    `;
  }

  handlePinsUpdated(pins) {
    this.isConnected = true;

    // Detect new incoming pending reports for audio chime
    if (this.initialLoadDone && this.isAudioEnabled) {
      const currentPendingIds = new Set(
        pins.filter((p) => this.getPhotoStatus(p) === 'pending').map((p) => p.id)
      );

      let newCount = 0;
      currentPendingIds.forEach((id) => {
        if (!this.previousPendingIds.has(id)) {
          newCount++;
        }
      });

      if (newCount > 0) {
        playNewPendingChime();
        showToast(`🔔 ${newCount} new pothole report received in queue!`, 'warning', 4000);
      }
    }

    this.allPins = pins.filter((p) => p.status !== 'archived');
    this.previousPendingIds = new Set(
      this.allPins.filter((p) => this.getPhotoStatus(p) === 'pending').map((p) => p.id)
    );
    this.initialLoadDone = true;

    this.render();
    this.loadAllComments(!this.allComments.length);
  }

  async loadAllComments(showSpinner = false) {
    if (showSpinner) {
      this.isCommentsLoading = true;
      this.renderCommentsSection();
    }
    try {
      const comments = await fetchAllPinCommentsForAdmin(this.allPins);
      this.allComments = comments;
    } catch (err) {
      console.warn('[Admin] Error loading comments:', err);
    } finally {
      this.isCommentsLoading = false;
      this.renderCommentsSection();
      // Update comment badge count in tab button if present
      const commentTabBadge = document.querySelector('[data-tab="comments"] span:last-child');
      if (commentTabBadge) {
        commentTabBadge.textContent = String(this.allComments.length);
      }
    }
  }

  getFilteredComments() {
    return this.allComments
      .filter((c) => {
        // City filter (if active)
        if (this.selectedCity !== 'all') {
          if (c.pinCity !== this.selectedCity) return false;
        }
        // Date filter (YYYY-MM-DD)
        if (this.commentDate) {
          const itemDateKey = formatCommentDateKey(c.createdAt);
          if (itemDateKey !== this.commentDate) return false;
        }
        // Search query filter
        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase();
          const text = (c.text || '').toLowerCase();
          const landmark = (c.pinLandmark || '').toLowerCase();
          const city = (c.pinCity || '').toLowerCase();
          const pinId = (c.pinId || '').toLowerCase();
          if (!text.includes(q) && !landmark.includes(q) && !city.includes(q) && !pinId.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (this.commentSort === 'old') {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
        // Default 'new': Newest first
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }

  renderCommentsSection() {
    const commentsMount = document.getElementById('admin-comments-mount');
    if (!commentsMount) return;

    const filteredComments = this.getFilteredComments();
    const visibleCount = this.allComments.filter((c) => !c.hidden).length;
    const hiddenCount = this.allComments.filter((c) => c.hidden).length;

    renderCommentsPanel(commentsMount, {
      comments: filteredComments,
      allCommentsCount: this.allComments.length,
      visibleCount,
      hiddenCount,
      commentSort: this.commentSort,
      commentDate: this.commentDate,
      isLoading: this.isCommentsLoading,
      onSortChange: (newSort) => {
        this.commentSort = newSort;
        this.renderCommentsSection();
      },
      onDateChange: (newDate) => {
        this.commentDate = newDate;
        this.renderCommentsSection();
      },
      onRefresh: async () => {
        await this.loadAllComments(true);
        showToast('💬 Comments synced with Firestore!', 'info', 2000);
      },
      onToggleHide: async (pinId, commentId, shouldHide) => {
        // Optimistic UI update
        this.allComments = this.allComments.map((c) =>
          c.id === commentId ? { ...c, hidden: shouldHide } : c
        );
        this.renderCommentsSection();

        try {
          await toggleHidePinComment(pinId, commentId, shouldHide);
          showToast(
            shouldHide
              ? '🙈 Comment hidden from main panel'
              : '👁️ Comment unhidden & visible on main panel',
            shouldHide ? 'warning' : 'success'
          );
        } catch (err) {
          showToast('Failed to update comment visibility', 'error');
        }
      },
      onDeleteComment: async (pinId, commentId) => {
        if (!confirm('Are you sure you want to permanently delete this comment from both Admin Panel and Main Panel?')) {
          return;
        }

        // Optimistic UI removal
        this.allComments = this.allComments.filter((c) => c.id !== commentId);
        this.renderCommentsSection();
        const commentTabBadge = document.querySelector('[data-tab="comments"] span:last-child');
        if (commentTabBadge) {
          commentTabBadge.textContent = String(this.allComments.length);
        }

        try {
          await deletePinCommentAdmin(pinId, commentId);
          showToast('🗑️ Comment deleted from Admin Panel & Main Panel!', 'info');
        } catch (err) {
          showToast('Failed to delete comment', 'error');
        }
      }
    });
  }

  getPhotoStatus(pin) {
    const hasPhoto = Boolean(pin.imageUrl || (Array.isArray(pin.images) && pin.images.length > 0));
    if (pin.photoStatus) return pin.photoStatus;
    if (pin.photoApproved === true) return 'approved';
    if (pin.photoApproved === false && hasPhoto) return 'pending';
    return hasPhoto ? 'approved' : 'none';
  }

  getFilteredPins() {
    return this.allPins.filter((pin) => {
      const status = this.getPhotoStatus(pin);

      // 1. Tab Filter
      if (this.activeTab === 'pending' && status !== 'pending') return false;
      if (this.activeTab === 'approved' && status !== 'approved') return false;
      if (this.activeTab === 'rejected' && status !== 'rejected') return false;

      // 2. City Filter
      if (this.selectedCity !== 'all') {
        const city = pin.cityNameEnglish || pin.cityNameHindi || '';
        if (city !== this.selectedCity) return false;
      }

      // 3. Search Filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const landmark = (pin.landmark || '').toLowerCase();
        const city = (pin.cityNameEnglish || pin.cityNameHindi || '').toLowerCase();
        const state = (pin.cityState || '').toLowerCase();
        const id = (pin.id || '').toLowerCase();

        if (!landmark.includes(q) && !city.includes(q) && !state.includes(q) && !id.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === 'newest') {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      }
      if (this.sortBy === 'oldest') {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return tA - tB;
      }
      if (this.sortBy === 'reports') {
        return (b.reportCount || 1) - (a.reportCount || 1);
      }
      if (this.sortBy === 'upvotes') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      return 0;
    });
  }

  renderStatsBarSection() {
    const statsMount = document.getElementById('admin-stats-mount');
    if (!statsMount) return;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    this.allPins.forEach((pin) => {
      const status = this.getPhotoStatus(pin);
      if (status === 'pending') pendingCount++;
      else if (status === 'approved') approvedCount++;
      else if (status === 'rejected') rejectedCount++;
    });

    const todayKey = getTodayDateKeyIST();
    const todayNewUsersCount = this.globalStats?.dailyNewUsers?.[todayKey] || 0;
    const todayTotalVisitors = this.globalStats?.dailyVisitors?.[todayKey] || 0;
    const totalVisitorsCount = this.globalStats?.visitorCount || 0;

    renderStatsBar(statsMount, {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount: this.allPins.length,
      todayNewUsersCount,
      todayTotalVisitors,
      totalVisitorsCount,
      activeTab: this.activeTab
    }, (selectedTab) => {
      this.activeTab = selectedTab;
      this.render();
    });
  }

  render() {
    const navbarMount = document.getElementById('admin-navbar-mount');
    const statsMount = document.getElementById('admin-stats-mount');
    const filterMount = document.getElementById('admin-filter-mount');
    const commentsMount = document.getElementById('admin-comments-mount');
    const gridEl = document.getElementById('admin-cards-grid');

    if (!navbarMount || !statsMount || !filterMount || !commentsMount || !gridEl) {
      this.renderSkeleton();
      return this.render();
    }

    // 1. Calculate Analytics & Counts
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    const citiesSet = new Set();

    this.allPins.forEach((pin) => {
      const status = this.getPhotoStatus(pin);
      if (status === 'pending') pendingCount++;
      else if (status === 'approved') approvedCount++;
      else if (status === 'rejected') rejectedCount++;

      const c = pin.cityNameEnglish || pin.cityNameHindi;
      if (c) citiesSet.add(c);
    });

    const citiesList = Array.from(citiesSet).sort();
    const filteredPins = this.getFilteredPins();
    const isAllSelected = filteredPins.length > 0 && filteredPins.every((p) => this.selectedPinIds.has(p.id));

    // 2. Render Navbar
    renderNavbar(navbarMount, {
      adminUser: auth.currentUser,
      isConnected: this.isConnected,
      isAudioEnabled: this.isAudioEnabled,
      onToggleAudio: () => {
        this.isAudioEnabled = !this.isAudioEnabled;
        showToast(this.isAudioEnabled ? '🔔 Audio alerts enabled' : '🔕 Audio alerts muted', 'info');
        this.render();
      },
      onSearch: (q) => {
        this.searchQuery = q.trim();
        this.renderCommentsSection();
        if (this.activeTab !== 'comments') {
          this.renderCardsGrid(this.getFilteredPins());
        }
      }
    });

    // 3. Render Stats Bar
    const todayKey = getTodayDateKeyIST();
    const todayNewUsersCount = this.globalStats?.dailyNewUsers?.[todayKey] || 0;
    const todayTotalVisitors = this.globalStats?.dailyVisitors?.[todayKey] || 0;
    const totalVisitorsCount = this.globalStats?.visitorCount || 0;

    renderStatsBar(statsMount, {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount: this.allPins.length,
      todayNewUsersCount,
      todayTotalVisitors,
      totalVisitorsCount,
      activeTab: this.activeTab
    }, (selectedTab) => {
      this.activeTab = selectedTab;
      this.render();
    });

    // 4. Render Filters & Tabs
    renderQueueFilter(filterMount, {
      activeTab: this.activeTab,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: this.allPins.length,
        comments: this.allComments.length
      },
      cities: citiesList,
      selectedCity: this.selectedCity,
      sortBy: this.sortBy,
      selectedCount: this.selectedPinIds.size,
      totalVisible: this.activeTab === 'comments' ? 0 : filteredPins.length,
      isAllSelected,
      onTabChange: (tab) => {
        this.activeTab = tab;
        this.selectedPinIds.clear();
        this.render();
      },
      onCityChange: (city) => {
        this.selectedCity = city;
        this.selectedPinIds.clear();
        this.render();
      },
      onSortChange: (sort) => {
        this.sortBy = sort;
        if (this.activeTab !== 'comments') {
          this.renderCardsGrid(this.getFilteredPins());
        }
      },
      onSelectAll: (checked) => {
        if (checked) {
          filteredPins.forEach((p) => this.selectedPinIds.add(p.id));
        } else {
          this.selectedPinIds.clear();
        }
        this.render();
      },
      onBulkApprove: async () => {
        const ids = Array.from(this.selectedPinIds);
        if (ids.length === 0) return;
        if (confirm(`Approve photos for ${ids.length} selected reports?`)) {
          try {
            await bulkApprovePins(ids);
            playApprovePing();
            showToast(`✓ Successfully approved ${ids.length} photos!`, 'success');
            this.selectedPinIds.clear();
          } catch (err) {
            showToast('Failed to bulk approve', 'error');
          }
        }
      },
      onBulkReject: async () => {
        const ids = Array.from(this.selectedPinIds);
        if (ids.length === 0) return;
        const reason = prompt('Enter rejection reason for selected photos:', 'Photo does not meet guidelines');
        if (reason) {
          try {
            await bulkRejectPins(ids, reason);
            playRejectWoosh();
            showToast(`✕ Rejected ${ids.length} photos`, 'warning');
            this.selectedPinIds.clear();
          } catch (err) {
            showToast('Failed to bulk reject', 'error');
          }
        }
      },
      onBulkDelete: async () => {
        const ids = Array.from(this.selectedPinIds);
        if (ids.length === 0) return;
        if (confirm(`Are you sure you want to delete / archive ${ids.length} selected reports?`)) {
          try {
            // Attempt permanent deletion
            await bulkDeletePins(ids);
            showToast(`🗑️ Successfully deleted ${ids.length} reports!`, 'info');
            this.selectedPinIds.clear();
          } catch (err) {
            console.warn('[Admin] Direct delete restricted, falling back to bulk archive:', err);
            try {
              // Fallback to bulk soft-archive
              await bulkArchivePins(ids);
              showToast(`🗑️ Archived ${ids.length} reports!`, 'info');
              this.selectedPinIds.clear();
            } catch (fallbackErr) {
              showToast('Failed to delete selected reports', 'error');
            }
          }
        }
      }
    });

    // 5. Render User Comments Row Section
    this.renderCommentsSection();

    // 6. Render Cards Grid (hidden when exclusively on the 'comments' tab)
    if (this.activeTab === 'comments') {
      cleanupAllMiniMaps();
      gridEl.classList.add('hidden');
      gridEl.innerHTML = '';
    } else {
      gridEl.classList.remove('hidden');
      this.renderCardsGrid(filteredPins);
    }
  }

  renderCardsGrid(pins) {
    const gridEl = document.getElementById('admin-cards-grid');
    if (!gridEl) return;

    cleanupAllMiniMaps();

    if (pins.length === 0) {
      gridEl.innerHTML = `
        <div class="col-span-full py-16 px-4 flex flex-col items-center justify-center text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <span class="text-4xl">🎉</span>
          <h3 class="font-heading font-bold text-lg text-white">Queue is clear!</h3>
          <p class="text-xs text-slate-400 max-w-sm">
            No pothole reports found matching the selected filters.
          </p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = pins
      .map((pin) => createReportCardHtml(pin, this.selectedPinIds.has(pin.id)))
      .join('');

    // Wire Card Event Listeners
    pins.forEach((pin) => {
      const card = document.getElementById(`pin-card-${pin.id}`);
      if (!card) return;

      // Extract all unique images for this pin
      const images = [];
      if (Array.isArray(pin.images)) {
        pin.images.forEach((img) => {
          if (img && typeof img === 'string' && !images.includes(img)) images.push(img);
        });
      }
      if (pin.imageUrl && typeof pin.imageUrl === 'string' && !images.includes(pin.imageUrl)) {
        images.unshift(pin.imageUrl);
      }
      if (pin.thumbnailUrl && typeof pin.thumbnailUrl === 'string' && !images.includes(pin.thumbnailUrl)) {
        if (images.length === 0) images.push(pin.thumbnailUrl);
      }

      let cardActiveImgIndex = 0;
      const cardImgEl = card.querySelector(`#card-img-${pin.id}`);

      const triggerLightbox = () => {
        if (images.length > 0) {
          openLightbox(
            images,
            pin.landmark || 'Pothole Image',
            cardActiveImgIndex,
            (targetIdx) => {
              openImageEditModal(pin, targetIdx);
            },
            async (targetIdx) => {
              const photoNum = targetIdx + 1;
              const totalPhotos = images.length;
              const confirmMsg = totalPhotos > 1
                ? `Are you sure you want to delete Photo #${photoNum} out of ${totalPhotos}? The remaining photo(s) will be kept.`
                : `Are you sure you want to delete this photo from report #${pin.id.slice(0, 6)}?`;

              if (confirm(confirmMsg)) {
                try {
                  await deletePinPhoto(pin.id, targetIdx);
                  showToast(`🗑️ Photo #${photoNum} deleted successfully!`, 'info');
                } catch (err) {
                  showToast('Failed to delete photo', 'error');
                }
              }
            }
          );
        }
      };

      // Open Lightbox on main photo or Zoom button click
      card.querySelectorAll('[data-action="open-lightbox"]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          triggerLightbox();
        });
      });

      // Edit Image Button click handler
      card.querySelectorAll('[data-action="edit-image"]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          openImageEditModal(pin, cardActiveImgIndex);
        });
      });

      // Delete Single Photo Button click handler
      card.querySelectorAll('[data-action="delete-single-photo"]').forEach((el) => {
        el.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetPhotoNum = cardActiveImgIndex + 1;
          const totalPhotos = images.length;
          const confirmMsg = totalPhotos > 1
            ? `Are you sure you want to delete Photo #${targetPhotoNum} out of ${totalPhotos}? The remaining photo(s) will be kept.`
            : `Are you sure you want to delete this photo from report #${pin.id.slice(0, 6)}?`;

          if (confirm(confirmMsg)) {
            try {
              await deletePinPhoto(pin.id, cardActiveImgIndex);
              showToast(`🗑️ Photo #${targetPhotoNum} deleted successfully!`, 'info');
            } catch (err) {
              showToast('Failed to delete photo', 'error');
            }
          }
        });
      });

      // Switch active photo preview on card thumbnail click
      card.querySelectorAll('[data-card-thumb]').forEach((thumbBtn) => {
        thumbBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = Number(thumbBtn.getAttribute('data-card-thumb'));
          if (!isNaN(idx) && images[idx]) {
            cardActiveImgIndex = idx;
            if (cardImgEl) cardImgEl.src = images[idx];
            card.querySelectorAll('[data-card-thumb]').forEach((btn, bIdx) => {
              if (bIdx === idx) {
                btn.className = 'card-thumb-btn w-5 h-5 rounded-md overflow-hidden border border-amber-400 ring-1 ring-amber-400 scale-105 transition cursor-pointer';
              } else {
                btn.className = 'card-thumb-btn w-5 h-5 rounded-md overflow-hidden border border-slate-700 opacity-60 hover:opacity-100 transition cursor-pointer';
              }
            });
          }
        });
      });

      // Checkbox
      card.querySelector(`[data-select-id="${pin.id}"]`)?.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedPinIds.add(pin.id);
        } else {
          this.selectedPinIds.delete(pin.id);
        }
        this.render();
      });

      // Approve Button
      card.querySelector('[data-action="approve"]')?.addEventListener('click', async () => {
        try {
          await approvePin(pin.id);
          playApprovePing();
          showToast(`✓ Photo for #${pin.id.slice(0, 6)} approved & is now live on map!`, 'success');
        } catch (err) {
          showToast('Failed to approve photo', 'error');
        }
      });

      // Reject Button
      card.querySelector('[data-action="reject"]')?.addEventListener('click', () => {
        openRejectModal(pin, async (reason) => {
          try {
            await rejectPin(pin.id, reason);
            playRejectWoosh();
            showToast(`✕ Photo rejected (${reason})`, 'warning');
          } catch (err) {
            showToast('Failed to reject photo', 'error');
          }
        });
      });

      // Edit Button
      card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        openEditModal(pin, async (landmark) => {
          try {
            await updatePinLandmark(pin.id, landmark);
            showToast('✓ Landmark updated successfully!', 'success');
          } catch (err) {
            showToast('Failed to update landmark', 'error');
          }
        });
      });

      // Delete Button
      card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        if (confirm('Do you want to archive / remove this pin from the system?')) {
          try {
            await archivePin(pin.id);
            showToast('Pin archived', 'info');
          } catch (err) {
            showToast('Failed to archive pin', 'error');
          }
        }
      });

      // Initialize Leaflet Mini-Map
      const lat = Number(pin.latitude || 0);
      const lng = Number(pin.longitude || 0);
      setTimeout(() => {
        initMiniMap(`mini-map-${pin.id}`, lat, lng);
      }, 50);
    });
  }
}

// Bootstrap Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AdminApp();
    app.init();
  });
} else {
  const app = new AdminApp();
  app.init();
}
