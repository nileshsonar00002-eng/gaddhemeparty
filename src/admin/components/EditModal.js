// Edit Landmark / Pin Details Modal

export function openEditModal(pin, onSave) {
  let modal = document.getElementById('admin-edit-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-edit-modal';
  modal.className = 'fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150';

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
            ✏️
          </div>
          <div>
            <h3 class="font-heading font-bold text-base text-white">Edit Pothole Details</h3>
            <p class="text-[11px] text-slate-400">ID: ${pin.id}</p>
          </div>
        </div>
        <button id="btn-close-edit-modal" class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition">✕</button>
      </div>

      <div class="space-y-3">
        <div class="space-y-1">
          <label for="edit-landmark-input" class="block text-xs font-bold uppercase tracking-wider text-slate-400">Landmark / Description</label>
          <textarea
            id="edit-landmark-input"
            rows="3"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          >${pin.landmark || ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-400">
          <div><span class="text-slate-500">City:</span> ${pin.cityNameEnglish || pin.cityNameHindi || 'Unknown'}</div>
          <div><span class="text-slate-500">State:</span> ${pin.cityState || 'India'}</div>
          <div><span class="text-slate-500">Lat:</span> ${Number(pin.latitude || 0).toFixed(5)}</div>
          <div><span class="text-slate-500">Lng:</span> ${Number(pin.longitude || 0).toFixed(5)}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          type="button"
          id="btn-cancel-edit"
          class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          id="btn-confirm-edit"
          class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-heading shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
        >
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector('#btn-close-edit-modal')?.addEventListener('click', close);
  modal.querySelector('#btn-cancel-edit')?.addEventListener('click', close);
  modal.addEventListener('click', close);

  modal.querySelector('#btn-confirm-edit')?.addEventListener('click', () => {
    const landmark = modal.querySelector('#edit-landmark-input')?.value.trim();
    close();
    if (onSave) onSave(landmark);
  });
}
