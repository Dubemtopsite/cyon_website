import { ASPECTS, type AspectId, type FlyerState, type FlyerImage } from '../types';
import { drawFlyer } from './templates';
import { ensureFonts } from './fonts';

/** Renders the flyer at export resolution on a fresh canvas. */
export async function renderFlyer(
  st: FlyerState,
  image: FlyerImage | null,
  logo: FlyerImage | null,
  aspectId: AspectId,
  scale = 1,
): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const def = ASPECTS[aspectId];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(def.w * scale);
  canvas.height = Math.round(def.h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  drawFlyer(ctx, canvas.width, canvas.height, st, image?.img ?? null, logo?.img ?? null);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode the flyer image.'));
      },
      type,
      quality,
    );
  });
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'celebrant'
  );
}

export function flyerFilename(name: string, ext: 'png' | 'jpeg'): string {
  return `CYON-birthday-${slugify(name)}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

/**
 * Uses the Web Share API with the image file when available (phones),
 * otherwise downloads the flyer so it can be posted to the group.
 */
export async function shareFlyer(blob: Blob, filename: string, text: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      /* fall through to download */
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Formats an authentic, inspiring Nigerian CYON WhatsApp birthday wish message */
export function buildWhatsAppWish(st: FlyerState): string {
  const parishLine = st.parish.trim() ? ` · ${st.parish.trim()}` : '';
  const deaneryLine = st.banner.trim() ? ` (${st.banner.trim()})` : '';
  const roleLine = st.title.trim() ? `\n🏷️ *Office/Role:* ${st.title.trim()}` : '';
  const ageLine = st.age.trim() && st.showAgeBadge ? `\n🎂 *Celebrating:* ${st.age.trim()} years (+1 Today)` : '';
  const dateLine = st.showDate && st.date.trim() ? `\n📅 *Date:* ${st.date.trim()}` : '';

  return `🎉🎂 *HAPPY BIRTHDAY CELEBRATION!* 🎂🎉
*Catholic Youth Organisation of Nigeria (CYON)*${parishLine}${deaneryLine}

Today we joyfully celebrate our dear member, *${st.name.trim() || 'Celebrant'}*! ✨🙏${roleLine}${ageLine}${dateLine}

“${st.message.trim()}”

May the Almighty God shower you with divine wisdom, unending joy, sound health, and favor in this new age. Amen! 🥂🌟

— *${st.pro.trim() || 'CYON PRO'}*
_For God and for Youth... Through Christ!_`;
}

/** Copies the generated flyer image directly to the system clipboard */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
  try {
    let clipBlob = blob;
    if (blob.type !== 'image/png') {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        clipBlob = await canvasToBlob(c, 'image/png');
      }
      URL.revokeObjectURL(url);
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': clipBlob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

