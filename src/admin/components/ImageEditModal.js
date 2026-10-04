// Image Editor Modal for Admin Panel (Blur sensitive areas & Draw with pen)

import { uploadAdminEditedPhoto, updatePinImage } from '../services/firebase';
import { showToast } from './Toast';

export function openImageEditModal(pin, targetImageIndex = 0, onSaved = null) {
  // Extract target image URL
  const images = [];
  if (Array.isArray(pin.images)) {
    pin.images.forEach((img) => {
      if (img && typeof img === 'string' && !images.includes(img)) images.push(img);
    });
  }
  if (pin.imageUrl && !images.includes(pin.imageUrl)) {
    images.unshift(pin.imageUrl);
  }
  if (pin.thumbnailUrl && !images.includes(pin.thumbnailUrl)) {
    if (images.length === 0) images.push(pin.thumbnailUrl);
  }

  const currentImageUrl = images[targetImageIndex] || pin.imageUrl || pin.thumbnailUrl;

  if (!currentImageUrl) {
    showToast('No image available to edit', 'error');
    return;
  }

  let modal = document.getElementById('admin-image-edit-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-image-edit-modal';
  modal.className = 'fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200';

  modal.innerHTML = `
    <!-- Top Header -->
    <div class="w-full max-w-5xl flex items-center justify-between gap-3 text-white border-b border-slate-800 pb-3 z-10">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
          🎨
        </div>
        <div>
          <h3 class="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
            <span>Image Editor</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono border border-slate-700">#${(pin.id || '').slice(0, 6)}</span>
          </h3>
          <p class="text-[11px] text-slate-400 hidden sm:block">Blur sensitive areas (faces, number plates) or draw annotations</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          id="btn-close-edit-modal"
          type="button"
          class="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Main Canvas Working Area -->
    <div class="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center my-3 overflow-hidden">
      <!-- Loading Indicator -->
      <div id="editor-loading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 text-slate-300 gap-3">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-semibold">Loading photo into editor...</p>
      </div>

      <!-- Canvas Container -->
      <div id="canvas-container" class="relative max-w-full max-h-[62vh] flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <canvas id="editor-canvas" class="max-w-full max-h-[62vh] object-contain touch-none cursor-crosshair"></canvas>
      </div>
    </div>

    <!-- Toolbar & Control Panel -->
    <div class="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl space-y-3 z-10">
      
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <!-- Tools Segmented Control -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            id="tool-btn-blur"
            type="button"
            class="editor-tool-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-amber-500 text-slate-950 shadow-md"
            data-tool="blur"
          >
            <span>💧 Blur / धुंधला</span>
          </button>
          <button
            id="tool-btn-pen"
            type="button"
            class="editor-tool-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white"
            data-tool="pen"
          >
            <span>✏️ Pen / पेन</span>
          </button>
        </div>

        <!-- Color Palette (Visible when Pen active) -->
        <div id="pen-color-palette" class="hidden items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase font-bold px-1">Color:</span>
          ${['#ef4444', '#f59e0b', '#84cc16', '#3b82f6', '#ffffff', '#000000'].map((color, idx) => `
            <button
              type="button"
              data-color="${color}"
              class="pen-color-btn w-6 h-6 rounded-full border-2 transition cursor-pointer ${idx === 0 ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'}"
              style="background-color: ${color}"
            ></button>
          `).join('')}
        </div>

        <!-- Brush Size Slider -->
        <div class="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase font-bold">Size:</span>
          <input
            id="brush-size-slider"
            type="range"
            min="5"
            max="80"
            value="30"
            class="w-24 sm:w-32 accent-amber-500 cursor-pointer"
          />
          <span id="brush-size-val" class="text-xs font-mono font-bold text-amber-400 w-8 text-right">30px</span>
        </div>

        <!-- Action Controls: Undo & Reset -->
        <div class="flex items-center gap-2">
          <button
            id="btn-editor-undo"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <span>↩️ Undo</span>
          </button>
          <button
            id="btn-editor-reset"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <span>🧹 Reset</span>
          </button>
        </div>
      </div>

      <!-- Footer Bar with Cancel and Save Buttons -->
      <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <p class="text-[11px] text-slate-400 flex items-center gap-1">
          <span>💡 Tip: Drag cursor or finger over sensitive areas to blur</span>
        </p>

        <div class="flex items-center gap-2">
          <button
            id="btn-cancel-image-edit"
            type="button"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-save-image-edit"
            type="button"
            class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>💾 Save Edited Photo</span>
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Editor Internal State
  let currentTool = 'blur';
  let penColor = '#ef4444';
  let brushSize = 30;
  let historyStack = [];
  let isDrawing = false;
  let canvas, ctx;
  let baseImage = null;
  let blurredOffscreenCanvas = null;

  const loadingEl = modal.querySelector('#editor-loading');
  canvas = modal.querySelector('#editor-canvas');
  ctx = canvas.getContext('2d', { willReadFrequently: true });

  const close = () => {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.remove(), 150);
  };

  modal.querySelector('#btn-close-edit-modal')?.addEventListener('click', close);
  modal.querySelector('#btn-cancel-image-edit')?.addEventListener('click', close);

  // Tool Buttons Switcher
  const toolBtns = modal.querySelectorAll('.editor-tool-btn');
  const penColorPalette = modal.querySelector('#pen-color-palette');

  toolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      currentTool = tool;
      toolBtns.forEach((b) => {
        if (b.getAttribute('data-tool') === tool) {
          b.className = 'editor-tool-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-amber-500 text-slate-950 shadow-md';
        } else {
          b.className = 'editor-tool-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white';
        }
      });

      if (tool === 'pen') {
        penColorPalette.classList.remove('hidden');
        penColorPalette.classList.add('flex');
      } else {
        penColorPalette.classList.add('hidden');
        penColorPalette.classList.remove('flex');
      }
    });
  });

  // Pen Color Buttons
  const colorBtns = modal.querySelectorAll('.pen-color-btn');
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      penColor = btn.getAttribute('data-color');
      colorBtns.forEach((b) => {
        if (b.getAttribute('data-color') === penColor) {
          b.className = 'pen-color-btn w-6 h-6 rounded-full border-2 border-white scale-110 shadow-md transition cursor-pointer';
        } else {
          b.className = 'pen-color-btn w-6 h-6 rounded-full border-2 border-transparent hover:scale-105 transition cursor-pointer';
        }
      });
    });
  });

  // Brush Size Slider
  const slider = modal.querySelector('#brush-size-slider');
  const sliderVal = modal.querySelector('#brush-size-val');
  slider.addEventListener('input', (e) => {
    brushSize = Number(e.target.value);
    sliderVal.textContent = `${brushSize}px`;
  });

  // Undo button
  const undoBtn = modal.querySelector('#btn-editor-undo');
  const updateUndoState = () => {
    if (undoBtn) undoBtn.disabled = historyStack.length <= 1;
  };

  const pushState = () => {
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStack.push(imageData);
    if (historyStack.length > 25) historyStack.shift();
    updateUndoState();
  };

  undoBtn.addEventListener('click', () => {
    if (historyStack.length > 1) {
      historyStack.pop();
      const prevState = historyStack[historyStack.length - 1];
      ctx.putImageData(prevState, 0, 0);
      updateUndoState();
    }
  });

  // Reset button
  modal.querySelector('#btn-editor-reset')?.addEventListener('click', () => {
    if (baseImage && canvas && ctx) {
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      historyStack = [];
      pushState();
      showToast('Image reset to original', 'info');
    }
  });

  // Load Image onto Canvas
  const initCanvasImage = async () => {
    try {
      baseImage = await loadImageForCanvas(currentImageUrl);

      canvas.width = baseImage.naturalWidth || baseImage.width || 800;
      canvas.height = baseImage.naturalHeight || baseImage.height || 600;

      // Draw base image
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Create offscreen blurred canvas for Blur Tool
      blurredOffscreenCanvas = document.createElement('canvas');
      blurredOffscreenCanvas.width = canvas.width;
      blurredOffscreenCanvas.height = canvas.height;
      const bCtx = blurredOffscreenCanvas.getContext('2d', { willReadFrequently: true });

      // Apply heavy Gaussian blur onto offscreen canvas
      bCtx.filter = 'blur(18px)';
      bCtx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      bCtx.filter = 'none';

      // Save initial state to history stack
      pushState();

      loadingEl.classList.add('hidden');
    } catch (err) {
      console.error('[Image Editor] Error loading image:', err);
      showToast('Failed to load image for editing', 'error');
      close();
    }
  };

  // Drawing Handlers
  let lastX = 0;
  let lastY = 0;

  const getCanvasCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawPointOrLine = (x1, y1, x2, y2) => {
    if (currentTool === 'blur') {
      const radius = brushSize / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.4)));

      for (let i = 0; i <= steps; i++) {
        const cx = x1 + (dx * i) / steps;
        const cy = y1 + (dy * i) / steps;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          blurredOffscreenCanvas,
          cx - radius,
          cy - radius,
          radius * 2,
          radius * 2,
          cx - radius,
          cy - radius,
          radius * 2,
          radius * 2
        );
        ctx.restore();
      }
    } else if (currentTool === 'pen') {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing = true;
    const coords = getCanvasCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    drawPointOrLine(lastX, lastY, lastX, lastY);
  };

  const moveDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    drawPointOrLine(lastX, lastY, coords.x, coords.y);
    lastX = coords.x;
    lastY = coords.y;
  };

  const stopDraw = () => {
    if (isDrawing) {
      isDrawing = false;
      pushState();
    }
  };

  // Pointer & Touch Listeners
  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw);
  canvas.addEventListener('pointerup', stopDraw);
  canvas.addEventListener('pointercancel', stopDraw);
  canvas.addEventListener('pointerleave', stopDraw);

  // Save Event Listener
  modal.querySelector('#btn-save-image-edit')?.addEventListener('click', async () => {
    const saveBtn = modal.querySelector('#btn-save-image-edit');
    if (!canvas || !ctx) return;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Saving...`;

      // Convert Canvas to Blob JPEG
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));

      let newPhotoUrl = null;

      // 1. Try uploading to Firebase Storage
      if (blob) {
        newPhotoUrl = await uploadAdminEditedPhoto(blob);
      }

      // 2. Fallback to Data URL if Storage fails or is restricted
      if (!newPhotoUrl) {
        newPhotoUrl = canvas.toDataURL('image/jpeg', 0.82);
      }

      // 3. Update Firestore Document
      await updatePinImage(pin.id, newPhotoUrl, targetImageIndex);

      showToast('✓ Photo edited & saved successfully!', 'success');
      close();

      if (onSaved) onSaved(newPhotoUrl);
    } catch (err) {
      console.error('[Image Editor] Save error:', err);
      showToast('Failed to save edited photo', 'error');
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span>💾 Save Edited Photo</span>`;
    }
  });

  initCanvasImage();
}

// Helper to load image for canvas without tainting
async function loadImageForCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = async () => {
      try {
        const response = await fetch(src, { mode: 'cors' });
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const img2 = new Image();
        img2.onload = () => resolve(img2);
        img2.onerror = () => reject(new Error('Failed to load image'));
        img2.src = objectUrl;
      } catch (err) {
        const img3 = new Image();
        img3.onload = () => resolve(img3);
        img3.onerror = (e) => reject(e);
        img3.src = src;
      }
    };
    img.src = src;
  });
}
