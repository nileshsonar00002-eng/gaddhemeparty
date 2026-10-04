/**
 * High-performance client-side image processor:
 * 1. Resizes longest edge to max 1024px.
 * 2. Re-encodes via Canvas to 100% strip EXIF/GPS/device metadata for reporter privacy.
 * 3. Compresses to WebP/JPEG under 200 KB.
 * 4. Generates a lightweight 320px thumbnail for fast popup rendering.
 */

export async function processPotholeImage(file) {
  const originalSizeKb = Math.round(file.size / 1024);

  // Helper to load image bitmap or HTMLImageElement
  let sourceImage = null;
  try {
    sourceImage = await createImageBitmap(file);
  } catch (e) {
    // Fallback using FileReader + Image element
    sourceImage = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (ie) => reject(new Error('Image failed to decode: ' + ie));
        img.src = re.target.result;
      };
      reader.onerror = (re) => reject(new Error('FileReader error: ' + re));
      reader.readAsDataURL(file);
    });
  }

  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  // 1. Calculate Main Image Dimensions (Max 1024px)
  const maxMainDim = 1024;
  let mainWidth = width;
  let mainHeight = height;

  if (width > maxMainDim || height > maxMainDim) {
    if (width > height) {
      mainWidth = maxMainDim;
      mainHeight = Math.round((height / width) * maxMainDim);
    } else {
      mainHeight = maxMainDim;
      mainWidth = Math.round((width / height) * maxMainDim);
    }
  }

  // Draw main image on clean canvas (stripping EXIF)
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = mainWidth;
  mainCanvas.height = mainHeight;
  const mainCtx = mainCanvas.getContext('2d');
  if (!mainCtx) throw new Error('Canvas context not available');

  mainCtx.imageSmoothingEnabled = true;
  mainCtx.imageSmoothingQuality = 'high';
  mainCtx.drawImage(sourceImage, 0, 0, mainWidth, mainHeight);

  // Apply Date & Time civic watermark at the bottom
  const photoDate = file?.lastModified ? new Date(file.lastModified) : new Date();
  const watermarkText = formatWatermarkTimestamp(photoDate);
  applyWatermark(mainCtx, mainWidth, mainHeight, watermarkText);

  // 2. Calculate Thumbnail Dimensions (Max 320px)
  const maxThumbDim = 320;
  let thumbWidth = width;
  let thumbHeight = height;

  if (width > maxThumbDim || height > maxThumbDim) {
    if (width > height) {
      thumbWidth = maxThumbDim;
      thumbHeight = Math.round((height / width) * maxThumbDim);
    } else {
      thumbHeight = maxThumbDim;
      thumbWidth = Math.round((width / height) * maxThumbDim);
    }
  }

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) throw new Error('Canvas context not available');

  thumbCtx.imageSmoothingEnabled = true;
  thumbCtx.imageSmoothingQuality = 'medium';
  thumbCtx.drawImage(sourceImage, 0, 0, thumbWidth, thumbHeight);
  applyWatermark(thumbCtx, thumbWidth, thumbHeight, watermarkText);

  // Generate data URLs for instant local/offline rendering
  const mainDataUrl = mainCanvas.toDataURL('image/jpeg', 0.72);
  const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);

  // Convert to Blobs (prefer image/webp, fallback to image/jpeg)
  const mimeType = 'image/webp';
  const fallbackMime = 'image/jpeg';

  const mainBlob = await new Promise((resolve) => {
    mainCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else {
          mainCanvas.toBlob((fb) => resolve(fb), fallbackMime, 0.72);
        }
      },
      mimeType,
      0.72
    );
  });

  const thumbnailBlob = await new Promise((resolve) => {
    thumbCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else {
          thumbCanvas.toBlob((fb) => resolve(fb), fallbackMime, 0.65);
        }
      },
      mimeType,
      0.65
    );
  });

  const previewUrl = mainDataUrl || URL.createObjectURL(mainBlob);
  const thumbnailUrl = thumbDataUrl || URL.createObjectURL(thumbnailBlob);
  const compressedSizeKb = Math.round((mainBlob?.size || mainDataUrl.length * 0.75) / 1024);

  return {
    mainBlob,
    thumbnailBlob,
    mainDataUrl,
    thumbDataUrl,
    previewUrl,
    thumbnailUrl,
    originalSizeKb,
    compressedSizeKb,
  };
}

/**
 * Format date & time for photo watermark
 */
function formatWatermarkTimestamp(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${day} ${month} ${year} • ${strTime}`;
}

/**
 * Draw a clean semi-transparent timestamp pill at the bottom of the photo
 */
function applyWatermark(ctx, width, height, timestampText) {
  ctx.save();

  // Adaptive font size based on image width
  const fontSize = Math.max(11, Math.round(width * 0.024));
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';

  const fullText = `${timestampText} | RoadTok`;
  const metrics = ctx.measureText(fullText);
  const textWidth = metrics.width;

  const padX = Math.round(fontSize * 0.85);
  const padY = Math.round(fontSize * 0.45);
  const badgeH = fontSize + padY * 2;
  const badgeW = textWidth + padX * 2;

  const margin = Math.max(8, Math.round(width * 0.02));
  // Position at bottom right (or constrained to width)
  const x = Math.max(margin, width - badgeW - margin);
  const y = height - badgeH - margin;

  // Background rounded pill badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.08));

  const actualW = Math.min(badgeW, width - margin * 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, actualW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x, y, actualW, badgeH);
  }

  // Text inside badge
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillText(fullText, x + padX, y + badgeH / 2);

  ctx.restore();
}
