import { t } from '../utils/i18n';
import { modalManager } from '../utils/modalManager';

export function openAboutModal() {
  const container = document.getElementById('about-modal-container');
  if (!container) return;

  let activeTab = 'mission';

  const closeModal = (notifyManager = true) => {
    container.innerHTML = '';
    if (notifyManager) {
      modalManager.closeActiveModal();
    } else {
      modalManager.notifyClosed('about-modal');
    }
  };

  modalManager.openModal('about-modal', () => closeModal(false));

  const render = () => {
    container.innerHTML = `
      <div id="about-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-md z-[1090] flex items-center justify-center p-4 animate-fade-in">
        <div class="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-4 text-left max-h-[88dvh] overflow-y-auto">
          <!-- Close Button -->
          <button id="btn-close-about" class="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- Header -->
          <div class="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" class="w-11 h-11 rounded-2xl drop-shadow-md" />
            <div>
              <h3 class="font-heading font-extrabold text-xl text-white leading-tight">${t('appNameHindi')}</h3>
              <p class="font-heading text-xs text-amber-400 font-semibold">"${t('tagline')}"</p>
            </div>
          </div>

          <!-- Prominent Mandatory Statutory Disclaimer -->
          <div class="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-200 text-xs font-semibold space-y-1">
            <p class="font-heading font-bold text-sm text-amber-300">${t('aboutDisclaimerTitle')}</p>
            <p>${t('aboutDisclaimerHindi')}</p>
            <p class="text-slate-300 text-[11px]">${t('aboutDisclaimerEnglish')}</p>
          </div>

          <!-- Section Tabs -->
          <div class="flex items-center gap-1 bg-[#080C14] p-1 rounded-xl border border-slate-800 text-xs font-heading font-bold">
            <button id="tab-about-mission" class="flex-1 py-1.5 rounded-lg transition ${activeTab === 'mission' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}">
              ${t('tabMission')}
            </button>
            <button id="tab-about-privacy" class="flex-1 py-1.5 rounded-lg transition ${activeTab === 'privacy' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}">
              ${t('tabPrivacy')}
            </button>
            <button id="tab-about-terms" class="flex-1 py-1.5 rounded-lg transition ${activeTab === 'terms' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}">
              ${t('tabTerms')}
            </button>
            <button id="tab-about-contact" class="flex-1 py-1.5 rounded-lg transition ${activeTab === 'contact' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}">
              ${t('tabContact')}
            </button>
          </div>

          <!-- Tab Content Body -->
          <div class="text-xs text-slate-300 leading-relaxed min-h-[110px] space-y-2 p-1">
            ${activeTab === 'mission' ? `
              <p>${t('aboutMission')}</p>
              <p class="text-slate-400">हमारा लक्ष्य भारत की हर खराब सड़क को सार्वजनिक नागरिक रिपोर्टिंग के माध्यम से संबंधित पीडब्ल्यूडी (PWD), नगर निगम व एनएचएआई (NHAI) तक पहुँचाना है।</p>
            ` : ''}

            ${activeTab === 'privacy' ? `
              <div class="space-y-1.5">
                <p class="font-bold text-slate-100">🔒 गोपनीयता गारंटी (100% Privacy Guarantee):</p>
                <p>• <strong>बिना किसी लॉगिन:</strong> हम कभी भी आपका नाम, फोन नंबर या ईमेल नहीं मांगते।</p>
                <p>• <strong>EXIF प्राइवेसी:</strong> आपकी फोटो से कैमरा मॉडल, डिवाइस आईडी और ओरिजिनल टाइमस्टैम्प फोटो अपलोड करने से पहले आपके फोन में ही डिलीट कर दिए जाते हैं।</p>
                <p>• केवल सड़क के स्थान का GPS कोऑर्डिनेट सार्वजनिक मैप पर दिखता है।</p>
              </div>
            ` : ''}

            ${activeTab === 'terms' ? `
              <div class="space-y-1.5">
                <p class="font-bold text-slate-100">📜 नागरिक आचार संहिता (Terms of Use):</p>
                <p>• केवल वास्तविक क्षतिग्रस्त सड़कों व गड्ढों की फोटो अपलोड करें।</p>
                <p>• किसी भी व्यक्ति का चेहरा, निजी वाहन नंबर प्लेट या अश्लील सामग्री अपलोड करना पूर्णतः वर्जित है।</p>
                <p>• गलत या स्पैम रिपोर्ट पाए जाने पर पिन को स्वतः हटा दिया जाएगा।</p>
              </div>
            ` : ''}

            ${activeTab === 'contact' ? `
              <div class="space-y-2">
                <p class="font-bold text-slate-100">💻 ओपन सोर्स नागरिक पहल:</p>
                <p>गड्ढे में पार्टी (Gaddhe Me Party) एक 100% फ्री कम्युनिटी प्रोजेक्ट है। सर्वर और मैप खर्च नागरिक सहयोग से चलता है।</p>
                <div class="pt-1 flex items-center gap-2">
                  <span class="px-2 py-1 bg-slate-800 rounded-md text-[11px] font-mono text-amber-400">github.com/gaddhemeparty/party</span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span class="text-[11px]">${t('footerCopyright')}</span>
            <span class="text-amber-400 font-bold">जय हिन्द 🇮🇳</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-about')?.addEventListener('click', () => closeModal(true));
    document.getElementById('about-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'about-backdrop') closeModal(true);
    });

    document.getElementById('tab-about-mission')?.addEventListener('click', () => { activeTab = 'mission'; render(); });
    document.getElementById('tab-about-privacy')?.addEventListener('click', () => { activeTab = 'privacy'; render(); });
    document.getElementById('tab-about-terms')?.addEventListener('click', () => { activeTab = 'terms'; render(); });
    document.getElementById('tab-about-contact')?.addEventListener('click', () => { activeTab = 'contact'; render(); });
  };

  render();
}
