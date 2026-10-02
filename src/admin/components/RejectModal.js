// Reject Reason Modal Component

export function openRejectModal(pin, onConfirm) {
  let modal = document.getElementById('admin-reject-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-reject-modal';
  modal.className = 'fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150';

  const reasons = [
    'Blurry / Unclear photo (फ़ोटो धुंधली है)',
    'Not a road pothole / Invalid hazard (सड़क का गड्ढा नहीं है)',
    'Inappropriate content / Spam (अनुचित सामग्री / स्पैम)',
    'Duplicate image (पहले से मौजूद तस्वीर)',
    'Incorrect GPS location (गलत लोकेशन)'
  ];

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100" onclick="event.stopPropagation()">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
            ✕
          </div>
          <div>
            <h3 class="font-heading font-bold text-base text-white">Reject Pothole Photo</h3>
            <p class="text-[11px] text-slate-400">Select reason for rejecting this submission</p>
          </div>
        </div>
        <button id="btn-close-reject-modal" class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition">✕</button>
      </div>

      <!-- Quick Reasons Radio -->
      <div class="space-y-2">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Select Preset Reason</label>
        <div class="space-y-1.5" id="reject-reasons-list">
          ${reasons.map((r, i) => `
            <label class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-800/50 transition cursor-pointer text-xs">
              <input type="radio" name="reject_reason" value="${r}" ${i === 0 ? 'checked' : ''} class="text-rose-500 focus:ring-rose-500" />
              <span>${r}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Custom Reason Input -->
      <div class="space-y-1.5">
        <label for="custom-reject-reason" class="block text-xs font-bold uppercase tracking-wider text-slate-400">Or custom note (Optional)</label>
        <input
          id="custom-reject-reason"
          type="text"
          placeholder="Custom rejection note..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
        />
      </div>

      <!-- Buttons -->
      <div class="flex items-center gap-3 pt-2">
        <button
          type="button"
          id="btn-cancel-reject"
          class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          id="btn-confirm-reject"
          class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5"
        >
          <span>Confirm Rejection</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector('#btn-close-reject-modal')?.addEventListener('click', close);
  modal.querySelector('#btn-cancel-reject')?.addEventListener('click', close);
  modal.addEventListener('click', close);

  modal.querySelector('#btn-confirm-reject')?.addEventListener('click', () => {
    const selectedRadio = modal.querySelector('input[name="reject_reason"]:checked')?.value;
    const customText = modal.querySelector('#custom-reject-reason')?.value.trim();
    const finalReason = customText || selectedRadio || 'Photo does not meet guidelines';

    close();
    if (onConfirm) onConfirm(finalReason);
  });
}
