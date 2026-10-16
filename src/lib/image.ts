import type { FlyerImage } from '../types';

const MAX_SIDE = 2600;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file could not be opened as an image.'));
    img.src = src;
  });
}

/**
 * Reads an uploaded photo, validates it and downscales very large images
 * (keeps memory and localStorage usage sane while staying sharp for export).
 */
export async function processFile(file: File): Promise<FlyerImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG or PNG).');
  }
  let src = await readFileAsDataUrl(file);
  let img = await loadImage(src);
  const maxSide = Math.max(img.naturalWidth, img.naturalHeight);
  if (maxSide > MAX_SIDE) {
    const scale = MAX_SIDE / maxSide;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      src = canvas.toDataURL('image/jpeg', 0.94);
      img = await loadImage(src);
    }
  }
  return { dataUrl: src, img };
}

/** Bakes a 90° clockwise rotation into the stored photo (keeps alpha for PNGs). */
export async function rotateImage(current: FlyerImage): Promise<FlyerImage> {
  const img = current.img;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const keepPng = current.dataUrl.startsWith('data:image/png');
  const dataUrl = canvas.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.94);
  const next = await loadImage(dataUrl);
  return { dataUrl, img: next };
}
