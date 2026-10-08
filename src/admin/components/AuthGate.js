// Admin Authentication & Firebase Gatekeeper Component

import {
  signInAdminWithEmail,
  signInAdminWithGoogle,
  signOutAdmin,
  auth
} from '../services/firebase';

const STORAGE_KEY = 'khadda_admin_session_auth';
const USER_KEY = 'khadda_admin_user_info';

export function checkIsAdminAuthenticated() {
  const isStored = localStorage.getItem(STORAGE_KEY) === 'true';
  const currentUser = auth.currentUser;
  return isStored && Boolean(currentUser && !currentUser.isAnonymous);
}

export function setAdminAuthenticated(val = true, user = null) {
  if (val) {
    localStorage.setItem(STORAGE_KEY, 'true');
    if (user) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || 'Admin'
        })
      );
    }
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getCachedAdminInfo() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export async function logoutAdmin() {
  setAdminAuthenticated(false);
  await signOutAdmin();
  window.location.reload();
}

export function renderAuthGate(container, onSuccess) {
  const renderUI = () => {
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19] relative overflow-hidden">
        <!-- Background Ambient Glow -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          
          <!-- Brand Header -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-2xl shadow-inner mb-1">
              🛡️
            </div>
            <h1 class="text-2xl font-heading font-black text-white tracking-tight">
              KHADDA Moderation HQ
            </h1>
            <p class="text-xs text-slate-400">
              गड्ढे में पार्टी • Firebase Protected Admin Gateway
            </p>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Firebase Auth Connected</span>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div id="auth-error-banner" class="hidden p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed">
            <span class="text-sm shrink-0">⚠️</span>
            <div id="auth-error-text" class="break-words"></div>
          </div>

          <!-- Firebase Login Form -->
          <form id="admin-login-form" class="space-y-4">
            
            <!-- Email Input -->
            <div class="space-y-1.5">
              <label for="admin-email" class="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Authorized Admin Email
              </label>
              <div class="relative">
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@roadtok.com"
                  autocomplete="username email"
                  required
                  class="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="admin-password" class="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Firebase Admin Password
                </label>
              </div>
              <div class="relative">
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                  class="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition pr-10"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition text-sm cursor-pointer"
                  title="Toggle password view"
                >
                  👁️
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              id="btn-auth-submit"
              class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <span id="btn-submit-spinner" class="hidden w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span id="btn-submit-text">Sign In with Firebase</span>
              <span>→</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative flex items-center justify-center">
            <div class="border-t border-slate-800 w-full"></div>
            <span class="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">or</span>
          </div>

          <!-- One-Click Google Sign-In for Authorized Admins -->
          <button
            type="button"
            id="btn-google-signin"
            class="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white font-medium text-xs tracking-wide transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <!-- Google G Icon -->
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.14C3.25 21.31 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.14z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.59l4.02 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google (Authorized Admin)</span>
          </button>

          <!-- Footer Security Notice -->
          <div class="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
            <div class="font-semibold text-slate-400">Strict Moderation Access</div>
            <div class="text-[11px] opacity-75">
              Only verified administrative emails in the project whitelist can access this console.
            </div>
          </div>
        </div>
      </div>
    `;

    attachHandlers();
  };

  const attachHandlers = () => {
    const form = container.querySelector('#admin-login-form');
    const emailInput = container.querySelector('#admin-email');
    const passwordInput = container.querySelector('#admin-password');
    const togglePassBtn = container.querySelector('#toggle-password-visibility');
    const googleBtn = container.querySelector('#btn-google-signin');
    const errorBanner = container.querySelector('#auth-error-banner');
    const errorText = container.querySelector('#auth-error-text');
    const submitBtn = container.querySelector('#btn-auth-submit');
    const submitSpinner = container.querySelector('#btn-submit-spinner');
    const submitText = container.querySelector('#btn-submit-text');

    const showError = (msg) => {
      if (errorBanner && errorText) {
        errorText.textContent = msg;
        errorBanner.classList.remove('hidden');
      }
    };

    const clearError = () => {
      if (errorBanner) {
        errorBanner.classList.add('hidden');
      }
    };

    const setLoading = (loading) => {
      if (submitBtn) submitBtn.disabled = loading;
      if (googleBtn) googleBtn.disabled = loading;
      if (submitSpinner) submitSpinner.classList.toggle('hidden', !loading);
      if (submitText) {
        submitText.textContent = loading ? 'Connecting to Firebase...' : 'Sign In with Firebase';
      }
    };

    // Password view toggle
    togglePassBtn?.addEventListener('click', () => {
      if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      }
    });

    // Submit Email/Password Form
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const email = emailInput?.value?.trim();
      const password = passwordInput?.value;

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      setLoading(true);

      try {
        const user = await signInAdminWithEmail(email, password);
        setAdminAuthenticated(true, user);
        onSuccess();
      } catch (err) {
        console.error('[Admin Auth] Login failure:', err);

        let friendlyMsg = err.message || 'Authentication failed.';

        // Map Firebase error codes to helpful instructions
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          friendlyMsg = 'गलत ईमेल या पासवर्ड! Incorrect email or password.';
        } else if (err.code === 'auth/user-not-found') {
          friendlyMsg = 'एडमिन खाता नहीं मिला! Please check your email address.';
        } else if (err.code === 'auth/too-many-requests') {
          friendlyMsg = 'बहुत सारे असफल प्रयास! यह खाता अस्थायी रूप से लॉक है। कृपया कुछ मिनट बाद प्रयास करें।';
        } else if (err.code === 'auth/network-request-failed') {
          friendlyMsg = 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क चेक करें।';
        }

        showError(friendlyMsg);
      } finally {
        setLoading(false);
      }
    });

    // Google Sign-In button
    googleBtn?.addEventListener('click', async () => {
      clearError();
      setLoading(true);

      try {
        const user = await signInAdminWithGoogle();
        setAdminAuthenticated(true, user);
        onSuccess();
      } catch (err) {
        console.error('[Admin Auth] Google sign-in failure:', err);
        let msg = err.message || 'Google Sign-In failed.';
        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Sign-in cancelled. Popup was closed before completing.';
        } else if (err.code === 'auth/popup-blocked') {
          msg = 'Browser blocked popup. Please allow popups for this site.';
        }
        showError(msg);
      } finally {
        setLoading(false);
      }
    });

    setTimeout(() => emailInput?.focus(), 150);
  };

  renderUI();
}
