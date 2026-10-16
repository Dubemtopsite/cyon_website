import { ASPECTS, type FitMode, type FlyerState, type Transform } from '../types';
import { getTheme, type Theme } from '../data/themes';

export const BASE_W = 1080;

export const FONTS = {
  display: '"Playfair Display", Georgia, "Times New Roman", serif',
  sans: '"Montserrat", "Segoe UI", Helvetica, Arial, sans-serif',
  script: '"Dancing Script", "Segoe Script", "Bradley Hand", cursive',
  handwritten: '"Caveat", "Dancing Script", cursive',
} as const;

type FontKey = keyof typeof FONTS;

/* ------------------------------------------------------------------ *
 * Image transform maths (resolution independent: offsets are fractions)
 * ------------------------------------------------------------------ */

export function defaultTransform(): Transform {
  return { zoom: 1, ox: 0, oy: 0 };
}

export function coverScale(iw: number, ih: number, W: number, H: number): number {
  return Math.max(W / iw, H / ih);
}

export function containScale(iw: number, ih: number, W: number, H: number): number {
  return Math.min(W / iw, H / ih);
}

export function baseScale(
  iw: number,
  ih: number,
  W: number,
  H: number,
  mode: FitMode,
): number {
  return mode === 'fit' ? containScale(iw, ih, W, H) : coverScale(iw, ih, W, H);
}

export const MIN_ZOOM: Record<FitMode, number> = { cover: 1, fit: 0.35 };

/** Reused offscreen canvas for cheap blurred backings. */
let scratchCanvas: HTMLCanvasElement | null = null;
function getScratch(): HTMLCanvasElement {
  if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
  return scratchCanvas;
}

function clampNum(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function clampTransform(
  t: Transform,
  iw: number,
  ih: number,
  W: number,
  H: number,
  mode: FitMode = 'cover',
): Transform {
  const zoom = clampNum(t.zoom, MIN_ZOOM[mode], 4);
  if (mode === 'fit') {
    // A blurred backing always fills the frame, so the photo can be placed
    // freely — just keep it reachable inside the canvas.
    return { zoom, ox: clampNum(t.ox, -0.55, 0.55), oy: clampNum(t.oy, -0.55, 0.55) };
  }
  const s = coverScale(iw, ih, W, H) * zoom;
  const maxX = Math.max(0, (iw * s - W) / 2) / W;
  const maxY = Math.max(0, (ih * s - H) / 2) / H;
  return {
    zoom,
    ox: clampNum(t.ox, -maxX, maxX),
    oy: clampNum(t.oy, -maxY, maxY),
  };
}

/** Zoom while keeping the image point under (cx, cy) — given in 0..1 frame coords — fixed. */
export function zoomAt(
  t: Transform,
  factor: number,
  cx: number,
  cy: number,
  iw: number,
  ih: number,
  W: number,
  H: number,
  mode: FitMode = 'cover',
): Transform {
  const z0 = t.zoom;
  const z1 = clampNum(z0 * factor, MIN_ZOOM[mode], 4);
  if (z1 === z0) return t;
  const s = baseScale(iw, ih, W, H, mode);
  const dw0 = iw * s * z0;
  const dh0 = ih * s * z0;
  const dw1 = iw * s * z1;
  const dh1 = ih * s * z1;
  const u = (cx * W - (W / 2 + t.ox * W) + dw0 / 2) / dw0;
  const v = (cy * H - (H / 2 + t.oy * H) + dh0 / 2) / dh0;
  const ox = (cx * W - W / 2 + dw1 * (0.5 - u)) / W;
  const oy = (cy * H - H / 2 + dh1 * (0.5 - v)) / H;
  return clampTransform({ zoom: z1, ox, oy }, iw, ih, W, H, mode);
}

/**
 * Draws the photo inside a rectangular region, honouring the fit mode:
 * - 'cover' fills the region (pan/zoom crops the edges)
 * - 'fit' shows the WHOLE image on top of a blurred copy of itself, so
 *   nothing is ever cut off or letterboxed — best for awkward photos.
 */
export function drawPhotoRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  st: FlyerState,
  img: HTMLImageElement | null,
  s: number,
): void {
  if (!img || img.naturalWidth <= 0) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const t = clampTransform(st.transform, iw, ih, w, h, st.fitMode);

  ctx.save();
  // Always clip: the blurred backing is drawn overscanned, so it must never
  // spill outside the template's photo slot.
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (st.fitMode === 'fit') {
    // Blur a small copy instead of the full-resolution photo — the result is
    // identical to the eye and roughly 30x cheaper to render.
    const scratch = getScratch();
    const down = 6;
    const sw = Math.max(8, Math.round(w / down));
    const sh = Math.max(8, Math.round(h / down));
    scratch.width = sw;
    scratch.height = sh;
    const sctx = scratch.getContext('2d');
    if (sctx) {
      sctx.clearRect(0, 0, sw, sh);
      const bs = coverScale(iw, ih, sw, sh) * 1.2; // overscan hides the blur edge
      const bw = iw * bs;
      const bh = ih * bs;
      sctx.drawImage(img, sw / 2 - bw / 2, sh / 2 - bh / 2, bw, bh);
      ctx.save();
      ctx.filter = `blur(${Math.max(2, (34 * s) / down)}px) brightness(0.7) saturate(0.9)`;
      ctx.drawImage(scratch, x, y, w, h);
      ctx.restore();
    }
  }

  const f = st.filters;
  ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%)`;
  const scale = baseScale(iw, ih, w, h, st.fitMode) * t.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2 + t.ox * w;
  const cy = y + h / 2 + t.oy * h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);

  if (f.wash > 0) {
    ctx.save();
    ctx.globalAlpha = (f.wash / 100) * 0.85;
    ctx.fillStyle = getTheme(st.themeId).wash;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Small drawing helpers
 * ------------------------------------------------------------------ */

export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hasLetterSpacing(ctx: CanvasRenderingContext2D): boolean {
  return 'letterSpacing' in ctx;
}

export function spacedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  if (spacing === 0) return ctx.measureText(text).width;
  if (hasLetterSpacing(ctx)) {
    const c = ctx as CanvasRenderingContext2D & { letterSpacing: string };
    c.letterSpacing = `${spacing}px`;
    const w = ctx.measureText(text).width;
    c.letterSpacing = '0px';
    return w;
  }
  const chars = Array.from(text);
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width;
  return w + spacing * Math.max(0, chars.length - 1);
}

/** Draw text with letter-spacing, aligned around x. Returns the drawn width. */
export function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'center' | 'right',
): number {
  const w = spacedWidth(ctx, text, spacing);
  const startX = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (spacing !== 0 && hasLetterSpacing(ctx)) {
    const c = ctx as CanvasRenderingContext2D & { letterSpacing: string };
    const prevAlign = ctx.textAlign;
    c.letterSpacing = `${spacing}px`;
    ctx.textAlign = 'left';
    ctx.fillText(text, startX, y);
    c.letterSpacing = '0px';
    ctx.textAlign = prevAlign;
    return w;
  }
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  if (spacing === 0) {
    ctx.fillText(text, startX, y);
  } else {
    let cx = startX;
    for (const ch of Array.from(text)) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacing;
    }
  }
  ctx.textAlign = prevAlign;
  return w;
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const wd of words) {
      const test = cur ? `${cur} ${wd}` : wd;
      if (!cur || ctx.measureText(test).width <= maxW) {
        cur = test;
      } else {
        lines.push(cur);
        cur = wd;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines.length ? lines : [''];
}

export function trimWithEllipsis(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxW: number,
  maxLines: number,
): string[] {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last.replace(/\s+$/, '')}…`;
  return kept;
}

export function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const k = r * 0.34;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.quadraticCurveTo(x + k, y - k, x, y - r);
  ctx.quadraticCurveTo(x - k, y - k, x - r, y);
  ctx.quadraticCurveTo(x - k, y + k, x, y + r);
  ctx.quadraticCurveTo(x + k, y + k, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export function drawCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const barW = size * 0.26;
  ctx.fillStyle = color;
  roundedRectPath(ctx, cx - barW / 2, cy - size / 2, barW, size, barW / 2.5);
  ctx.fill();
  roundedRectPath(ctx, cx - size * 0.42, cy - size * 0.16, size * 0.84, barW, barW / 2.5);
  ctx.fill();
}

/* ------------------------------------------------------------------ *
 * Content blocks
 * ------------------------------------------------------------------ */

interface Block {
  kind: 'text' | 'divider';
  text?: string;
  family?: FontKey;
  weight?: number;
  style?: 'normal' | 'italic';
  size: number;
  spacing?: number;
  color?: string;
  maxLines?: number;
  lineHeight?: number;
  widthFrac?: number;
  gap: number;
  sides?: 'lines' | 'stars';
}

function buildBlocks(st: FlyerState, theme: Theme): Block[] {
  const blocks: Block[] = [];
  const headline = st.headline.trim() || 'Happy Birthday';

  if (st.headlineStyle === 'script') {
    blocks.push({
      kind: 'text',
      text: headline,
      family: 'script',
      weight: 700,
      size: 92,
      color: theme.accent,
      gap: 0,
      maxLines: 1,
      lineHeight: 1.08,
      widthFrac: 0.86,
      sides: st.decor ? 'stars' : undefined,
    });
  } else {
    blocks.push({
      kind: 'text',
      text: headline.toUpperCase(),
      family: 'sans',
      weight: 800,
      size: 40,
      spacing: 9,
      color: theme.accent,
      gap: 0,
      maxLines: 1,
      lineHeight: 1.2,
      widthFrac: 0.9,
      sides: st.decor ? 'lines' : undefined,
    });
  }

  blocks.push({
    kind: 'text',
    text: st.name.trim() || 'Celebrant Name',
    family: 'display',
    weight: 700,
    size: 88,
    spacing: 0.5,
    color: theme.text,
    gap: 26,
    maxLines: 2,
    lineHeight: 1.08,
    widthFrac: 0.86,
  });

  if (st.age.trim()) {
    blocks.push({
      kind: 'text',
      text: `CELEBRATING ${st.age.trim()} ${/^\d+$/.test(st.age.trim()) ? 'YEARS' : ''}`.trim(),
      family: 'sans',
      weight: 700,
      size: 26,
      spacing: 7,
      color: theme.accent,
      gap: 22,
      maxLines: 1,
      lineHeight: 1.3,
      widthFrac: 0.9,
      sides: st.decor ? 'stars' : undefined,
    });
  }

  if (st.title.trim()) {
    blocks.push({
      kind: 'text',
      text: st.title.trim(),
      family: 'sans',
      weight: 500,
      size: 24,
      spacing: 4,
      color: theme.sub,
      gap: 14,
      maxLines: 2,
      lineHeight: 1.35,
      widthFrac: 0.78,
    });
  }

  blocks.push({ kind: 'divider', size: 18, gap: 26 });

  blocks.push({
    kind: 'text',
    text: st.message.trim() || 'Wishing you many more blessed years!',
    family: 'display',
    weight: 400,
    style: 'italic',
    size: 28,
    color: 'rgba(255,255,255,0.94)',
    gap: 22,
    maxLines: 3,
    lineHeight: 1.5,
    widthFrac: 0.84,
  });

  if (st.showDate && st.date.trim()) {
    blocks.push({
      kind: 'text',
      text: st.date.trim(),
      family: 'sans',
      weight: 600,
      size: 22,
      spacing: 5,
      color: theme.sub,
      gap: 20,
      maxLines: 1,
      lineHeight: 1.3,
      widthFrac: 0.9,
    });
  }

  blocks.push({
    kind: 'text',
    text: 'CATHOLIC YOUTH ORGANISATION OF NIGERIA (CYON)',
    family: 'sans',
    weight: 600,
    size: 17,
    spacing: 3.5,
    color: theme.sub,
    gap: 26,
    maxLines: 1,
    lineHeight: 1.3,
    widthFrac: 0.9,
  });

  if (st.pro.trim()) {
    blocks.push({
      kind: 'text',
      text: `From: ${st.pro.trim()}`,
      family: 'sans',
      weight: 700,
      size: 24,
      color: theme.text,
      gap: 10,
      maxLines: 1,
      lineHeight: 1.3,
      widthFrac: 0.86,
    });
  }

  return blocks;
}

interface LaidBlock {
  block: Block;
  size: number;
  lines: string[];
  lineH: number;
  h: number;
  gap: number;
  width: number;
}

function measureBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  W: number,
  s: number,
  k: number,
): { items: LaidBlock[]; total: number; overflow: boolean } {
  const items: LaidBlock[] = [];
  let total = 0;
  let overflow = false;

  for (const block of blocks) {
    const gap = block.gap * s * k;
    if (block.kind === 'divider') {
      const h = block.size * s * k;
      items.push({ block, size: h, lines: [], lineH: h, h, gap, width: 0 });
      total += gap + h;
      continue;
    }
    const size = block.size * s * k;
    const family = block.family ?? 'sans';
    const weight = block.weight ?? 400;
    const style = block.style ?? 'normal';
    ctx.font = `${style} ${weight} ${size}px ${FONTS[family]}`;
    const maxW = W * (block.widthFrac ?? 0.86);
    const maxLines = block.maxLines ?? 1;
    const lineHeight = size * (block.lineHeight ?? 1.2);
    let lines = wrapText(ctx, block.text ?? '', maxW);
    if (lines.length > maxLines) {
      overflow = true;
      lines = trimWithEllipsis(ctx, lines, maxW, maxLines);
    }
    let width = 0;
    for (const l of lines) width = Math.max(width, ctx.measureText(l).width);
    const h = lines.length * lineHeight;
    items.push({ block, size, lines, lineH: lineHeight, h, gap, width });
    total += gap + h;
  }
  return { items, total, overflow };
}

/* ------------------------------------------------------------------ *
 * Flyer renderer
 * ------------------------------------------------------------------ */

export function drawThemeLayout(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  st: FlyerState,
  img: HTMLImageElement | null,
  logo: HTMLImageElement | null = null,
): void {
  // Colour-theme driven layouts (classic / spotlight / gallery).
  // New fixed-palette templates live in templates.ts.
  const s = W / BASE_W;
  const theme = getTheme(st.themeId);
  const aspect = ASPECTS[st.aspect];

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Base gradient behind everything
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, theme.top);
  base.addColorStop(1, theme.bottom);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const inset = 26 * s;

  if (st.template === 'spotlight') {
    // Photo lives in a card at the top; wording sits on a clean panel below,
    // so a face can never be covered by the text.
    const card = spotlightCard(W, H, s);
    ctx.fillStyle = theme.bottom;
    ctx.fillRect(0, card.y + card.h, W, H - (card.y + card.h));
    drawPhotoRegion(ctx, card.x, card.y, card.w, card.h, 22 * s, st, img, s);
    // top scrim inside the card keeps the parish chip readable
    ctx.save();
    roundedRectPath(ctx, card.x, card.y, card.w, card.h, 22 * s);
    ctx.clip();
    const gTop = ctx.createLinearGradient(0, card.y, 0, card.y + H * 0.16);
    gTop.addColorStop(0, 'rgba(0,0,0,0.45)');
    gTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gTop;
    ctx.fillRect(card.x, card.y, card.w, H * 0.16);
    ctx.restore();
    ctx.strokeStyle = hexA(theme.accent, 0.5);
    ctx.lineWidth = Math.max(1, 2 * s);
    roundedRectPath(ctx, card.x, card.y, card.w, card.h, 22 * s);
    ctx.stroke();
  } else {
    drawPhotoRegion(ctx, 0, 0, W, H, 0, st, img, s);

    // Top scrim so the parish chip stays readable
    const topH = H * 0.2;
    const gTop = ctx.createLinearGradient(0, 0, 0, topH);
    gTop.addColorStop(0, 'rgba(0,0,0,0.5)');
    gTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, W, topH);

    // Bottom scrim — text sits on this (gallery adds a panel on top of it)
    const scrimStart = H * 0.3;
    const gBot = ctx.createLinearGradient(0, scrimStart, 0, H);
    gBot.addColorStop(0, hexA(theme.bottom, 0));
    gBot.addColorStop(0.22, hexA(theme.bottom, 0.45));
    gBot.addColorStop(0.55, hexA(theme.bottom, 0.86));
    gBot.addColorStop(1, hexA(theme.bottom, 0.97));
    ctx.fillStyle = gBot;
    ctx.fillRect(0, scrimStart, W, H - scrimStart);
  }

  // Decorative frame
  ctx.strokeStyle = hexA(theme.accent, 0.85);
  ctx.lineWidth = Math.max(1, 3 * s);
  roundedRectPath(ctx, inset, inset, W - inset * 2, H - inset * 2, 20 * s);
  ctx.stroke();
  ctx.strokeStyle = hexA(theme.accent, 0.3);
  ctx.lineWidth = Math.max(1, s);
  roundedRectPath(ctx, inset + 10 * s, inset + 10 * s, W - (inset + 10 * s) * 2, H - (inset + 10 * s) * 2, 14 * s);
  ctx.stroke();

  // Parish chip
  drawChip(ctx, W, H, s, theme, st.parish);

  // Church / CYON logo
  drawLogo(ctx, W, H, s, logo, st);

  // Sparkle decorations
  if (st.decor) drawSparkles(ctx, W, H, s, theme);

  // Content stack (bottom-up with auto-fit)
  drawContent(ctx, W, H, s, theme, st, aspect.id);

  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Shared text utilities for the template gallery
 * ------------------------------------------------------------------ */

export interface TextFit {
  size: number;
  lines: string[];
  lineH: number;
}

/**
 * Fits text into a box: shrinks the font until it wraps into `maxLines`
 * lines that each fit inside `maxW` (never overflows the design).
 */
export function fitTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    size: number;
    maxW: number;
    maxLines: number;
    font: (size: number) => string;
    minSize?: number;
    lineHeight?: number;
  },
): TextFit {
  const { maxW, maxLines, font } = opts;
  const minSize = opts.minSize ?? opts.size * 0.55;
  const lh = opts.lineHeight ?? 1.16;
  const clean = text.trim();
  let size = opts.size;
  let lines = [clean];
  for (let i = 0; i < 26; i++) {
    ctx.font = font(size);
    lines = wrapText(ctx, clean, maxW);
    if (lines.length <= maxLines) return { size, lines, lineH: size * lh };
    if (size <= minSize) break;
    size = Math.max(minSize, size * 0.93);
  }
  ctx.font = font(size);
  return { size, lines: trimWithEllipsis(ctx, lines, maxW, maxLines), lineH: size * lh };
}

/**
 * Like fitTextLines but accounts for letter-spacing, which the tracker adds on
 * top of the measured width — without this, tracked lines can overrun the margin.
 */
export function fitTrackedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    size: number;
    maxW: number;
    maxLines: number;
    spacing: number;
    font: (size: number) => string;
    minSize?: number;
    lineHeight?: number;
  },
): TextFit {
  const { maxW, maxLines, spacing, font } = opts;
  const minSize = opts.minSize ?? opts.size * 0.5;
  const lh = opts.lineHeight ?? 1.2;
  const clean = text.trim();
  let size = opts.size;
  let lines = [clean];
  for (let i = 0; i < 26; i++) {
    ctx.font = font(size);
    lines = wrapText(ctx, clean, maxW);
    const overflows = lines.some((l) => spacedWidth(ctx, l, spacing) > maxW);
    if (!overflows && lines.length <= maxLines) return { size, lines, lineH: size * lh };
    if (size <= minSize) break;
    size = Math.max(minSize, size * 0.93);
  }
  ctx.font = font(size);
  return { size, lines: trimWithEllipsis(ctx, lines, maxW, maxLines), lineH: size * lh };
}

/** Draws several centred text lines and returns the total height used. */
export function drawLinesCentered(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  top: number,
  size: number,
  lineH: number,
  spacing = 0,
): number {
  let y = top + size * 0.82;
  for (const line of lines) {
    drawSpaced(ctx, line, cx, y, spacing, 'center');
    y += lineH;
  }
  return lines.length * lineH;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Turns a free-text date into a compact two-line badge, e.g. "12th" / "Oct". */
export function parseDateBadge(date: string): [string, string] {
  const text = date.trim();
  if (!text) return ['', ''];
  const dayMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?/);
  const day = dayMatch ? Number(dayMatch[1]) : 0;
  const ordinal = (n: number): string => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };
  const monthIdx = MONTH_SHORT.findIndex((m) => new RegExp(m, 'i').test(text));
  const month = monthIdx >= 0 ? MONTH_SHORT[monthIdx] : '';
  if (day && month) return [ordinal(day), month];
  if (month) return [month, ''];
  const words = text.split(/\s+/);
  return [words[0] ?? '', words[1] ?? ''];
}

/** Geometry of the photo card used by the Spotlight template. */
export function spotlightCard(
  W: number,
  H: number,
  s: number,
): { x: number; y: number; w: number; h: number } {
  const m = 46 * s;
  return { x: m, y: m, w: W - m * 2, h: H * 0.5 - m };
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  logo: HTMLImageElement | null,
  st: FlyerState,
): void {
  if (!logo || !logo.naturalWidth) return;
  const ratio = logo.naturalWidth / logo.naturalHeight;
  let h = 84 * s * st.logoScale;
  let w = h * ratio;
  const maxW = W * 0.24;
  const maxH = H * 0.14;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const box = computeLogoBox(W, H, s, st, logo, 'tl');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8 * s;
  ctx.drawImage(logo, box.x, box.y, box.w, box.h);
  ctx.restore();
}

export interface LogoBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Computes dynamic movable coordinates and size of the logo / crest */
export function computeLogoBox(
  W: number,
  H: number,
  s: number,
  st: FlyerState,
  logoImg: HTMLImageElement | null,
  defaultPos: 'tc' | 'tl' | 'tr' = 'tc',
): LogoBox {
  const baseH = 72 * s * (st.logoScale || 1);
  const ratio = logoImg && logoImg.naturalWidth ? logoImg.naturalWidth / logoImg.naturalHeight : 1;
  const w = baseH * ratio;
  const h = baseH;

  const pos = st.logoPos || defaultPos;
  let cx = W / 2;
  let cy = 54 * s;

  if (pos === 'free') {
    cx = (st.logoX ?? 0.5) * W;
    cy = (st.logoY ?? 0.05) * H;
  } else if (pos === 'tl') {
    cx = 48 * s + w / 2;
    cy = 40 * s + h / 2;
  } else if (pos === 'tr') {
    cx = W - 48 * s - w / 2;
    cy = 40 * s + h / 2;
  } else if (pos === 'tc') {
    cx = W / 2;
    cy = 48 * s + h / 2;
  }

  return {
    x: Math.max(6 * s, Math.min(W - w - 6 * s, cx - w / 2)),
    y: Math.max(6 * s, Math.min(H - h - 6 * s, cy - h / 2)),
    w,
    h,
  };
}

/** Draws the movable logo (or official CYON crest if no logo uploaded) anywhere on the flyer */
export function drawMovableLogo(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  st: FlyerState,
  logoImg: HTMLImageElement | null,
  primaryColor = '#0b522c',
  goldColor = '#f3c14a',
  defaultPos: 'tc' | 'tl' | 'tr' = 'tc',
): LogoBox {
  const box = computeLogoBox(W, H, s, st, logoImg, defaultPos);

  ctx.save();
  if (logoImg && logoImg.naturalWidth) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8 * s;
    ctx.drawImage(logoImg, box.x, box.y, box.w, box.h);
  } else {
    drawOfficialCrest(
      ctx,
      box.x + box.w / 2,
      box.y + box.h / 2,
      box.h / 2,
      s,
      primaryColor,
      goldColor,
    );
  }
  ctx.restore();

  return box;
}

export function drawChip(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  theme: Theme,
  parish: string,
): void {
  const text = parish.trim().toUpperCase();
  if (!text) return;

  let fontSize = 18 * s;
  const padX = 20 * s;
  const gap = 12 * s;
  const crossSize = 15 * s;
  const h = 46 * s;
  const spacing = 4 * s;

  let w = 0;
  for (let i = 0; i < 8; i++) {
    ctx.font = `600 ${fontSize}px ${FONTS.sans}`;
    const tw = spacedWidth(ctx, text, spacing);
    w = padX * 2 + crossSize + gap + tw;
    if (w <= W * 0.88) break;
    fontSize *= 0.92;
  }

  const x = (W - w) / 2;
  const y = H * 0.045;

  ctx.save();
  roundedRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();
  ctx.strokeStyle = hexA(theme.accent, 0.55);
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.stroke();

  drawCross(ctx, x + padX + crossSize / 2, y + h / 2, crossSize, theme.accent);

  ctx.font = `600 ${fontSize}px ${FONTS.sans}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  drawSpaced(ctx, text, x + padX + crossSize + gap, y + h / 2 + fontSize * 0.05, spacing, 'left');
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  theme: Theme,
): void {
  const spots: Array<[number, number, number, number]> = [
    [0.1, 0.085, 22, 0.85],
    [0.9, 0.13, 16, 0.7],
    [0.13, 0.26, 18, 0.75],
    [0.87, 0.3, 24, 0.8],
    [0.07, 0.42, 13, 0.6],
    [0.93, 0.45, 15, 0.65],
  ];
  const dots: Array<[number, number, number]> = [
    [0.19, 0.12, 5],
    [0.82, 0.08, 4],
    [0.06, 0.2, 4],
    [0.94, 0.23, 5],
    [0.24, 0.35, 3.5],
    [0.77, 0.38, 4],
  ];
  ctx.save();
  ctx.fillStyle = hexA(theme.accent, 0.85);
  for (const [fx, fy, r, a] of spots) {
    ctx.globalAlpha = a;
    star4(ctx, fx * W, fy * H, r * s);
  }
  ctx.fillStyle = hexA('#ffffff', 0.8);
  for (const [fx, fy, r] of dots) {
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(fx * W, fy * H, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawContent(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  theme: Theme,
  st: FlyerState,
  aspectId: string,
): void {
  const blocks = buildBlocks(st, theme);
  const isSpot = st.template === 'spotlight';
  const botPad = (isSpot ? 44 : 64) * s;
  const topLimit = isSpot
    ? H * 0.5 + 34 * s
    : H * (aspectId === 'story' ? 0.3 : 0.34);
  const avail = H - topLimit - botPad;

  let k = 1;
  let result = measureBlocks(ctx, blocks, W, s, k);
  let guard = 0;
  while ((result.total > avail || result.overflow) && k > 0.55 && guard < 16) {
    k -= 0.05;
    guard++;
    result = measureBlocks(ctx, blocks, W, s, k);
  }

  const { items, total } = result;
  let y = Math.max(topLimit, H - botPad - total);

  // Gallery template: a frosted panel sits behind the wording so it stays
  // readable over busy photos without covering the whole picture.
  if (st.template === 'gallery') {
    const padX = W * 0.055;
    const top = y - 26 * s;
    const bottom = H - botPad + 20 * s;
    roundedRectPath(ctx, padX, top, W - padX * 2, Math.max(40 * s, bottom - top), 24 * s);
    ctx.fillStyle = hexA(theme.bottom, 0.9);
    ctx.fill();
    ctx.strokeStyle = hexA(theme.accent, 0.45);
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.stroke();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 10 * s * k;
  ctx.shadowOffsetY = 2 * s * k;

  for (const it of items) {
    const block = it.block;
    y += it.gap;

    if (block.kind === 'divider') {
      const halfW = W * 0.17;
      ctx.strokeStyle = hexA(theme.accent, 0.85);
      ctx.lineWidth = Math.max(1, 2 * s * k);
      ctx.beginPath();
      ctx.moveTo(W / 2 - halfW, y + it.h / 2);
      ctx.lineTo(W / 2 - 16 * s * k, y + it.h / 2);
      ctx.moveTo(W / 2 + 16 * s * k, y + it.h / 2);
      ctx.lineTo(W / 2 + halfW, y + it.h / 2);
      ctx.stroke();
      ctx.fillStyle = theme.accent;
      ctx.save();
      ctx.translate(W / 2, y + it.h / 2);
      ctx.rotate(Math.PI / 4);
      const d = 7 * s * k;
      ctx.fillRect(-d, -d, d * 2, d * 2);
      ctx.restore();
      y += it.h;
      continue;
    }

    const family = block.family ?? 'sans';
    const weight = block.weight ?? 400;
    const style = block.style ?? 'normal';
    ctx.font = `${style} ${weight} ${it.size}px ${FONTS[family]}`;
    ctx.fillStyle = block.color ?? '#ffffff';

    let lineY = y + it.size * 0.8;
    for (const line of it.lines) {
      drawSpaced(ctx, line, W / 2, lineY, (block.spacing ?? 0) * s * k, 'center');
      lineY += it.lineH;
    }

    if (block.sides === 'lines') {
      const half = it.width / 2;
      const gapX = 20 * s * k;
      const len = 70 * s * k;
      const ly = y + it.size * 0.35;
      ctx.strokeStyle = hexA(theme.accent, 0.85);
      ctx.lineWidth = Math.max(1, 2 * s * k);
      ctx.beginPath();
      ctx.moveTo(W / 2 - half - gapX - len, ly);
      ctx.lineTo(W / 2 - half - gapX, ly);
      ctx.moveTo(W / 2 + half + gapX, ly);
      ctx.lineTo(W / 2 + half + gapX + len, ly);
      ctx.stroke();
    } else if (block.sides === 'stars') {
      const half = it.width / 2;
      const gapX = 30 * s * k;
      const r = 11 * s * k;
      ctx.fillStyle = theme.accent;
      const my = y + it.size * 0.3;
      star4(ctx, W / 2 - half - gapX - r, my, r);
      star4(ctx, W / 2 + half + gapX + r, my, r);
    }

    y += it.h;
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Architectural Arches & Canvas Shapes
 * ------------------------------------------------------------------ */

/** Path for a Romanesque arch (flat bottom, curved arch top) */
export function archPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  archH?: number,
): void {
  const r = archH ?? w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + r);
  ctx.arc(x + w / 2, y + r, w / 2, 0, Math.PI, true);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/** Draws photo clipped inside a Romanesque arch */
export function drawArchPhotoRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  st: FlyerState,
  img: HTMLImageElement | null,
  s: number,
  archH?: number,
): void {
  if (!img || img.naturalWidth <= 0) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const t = clampTransform(st.transform, iw, ih, w, h, st.fitMode);

  ctx.save();
  archPath(ctx, x, y, w, h, archH);
  ctx.clip();

  if (st.fitMode === 'fit') {
    const scratch = document.createElement('canvas');
    const down = 6;
    const sw = Math.max(8, Math.round(w / down));
    const sh = Math.max(8, Math.round(h / down));
    scratch.width = sw;
    scratch.height = sh;
    const sctx = scratch.getContext('2d');
    if (sctx) {
      sctx.clearRect(0, 0, sw, sh);
      const bs = coverScale(iw, ih, sw, sh) * 1.2;
      const bw = iw * bs;
      const bh = ih * bs;
      sctx.drawImage(img, sw / 2 - bw / 2, sh / 2 - bh / 2, bw, bh);
      ctx.save();
      ctx.filter = `blur(${Math.max(2, (34 * s) / down)}px) brightness(0.7) saturate(0.9)`;
      ctx.drawImage(scratch, x, y, w, h);
      ctx.restore();
    }
  }

  const f = st.filters;
  ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%)`;
  const scale = baseScale(iw, ih, w, h, st.fitMode) * t.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2 + t.ox * w;
  const cy = y + h / 2 + t.oy * h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);

  if (f.wash > 0) {
    ctx.save();
    ctx.globalAlpha = (f.wash / 100) * 0.85;
    ctx.fillStyle = getTheme(st.themeId).wash;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.restore();
}

/** Draws the authentic Catholic Youth Organisation of Nigeria (CYON) Crest */
export function drawOfficialCrest(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  s: number,
  primaryColor = '#0b522c',
  goldColor = '#f3c14a',
): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer gold scalloped / studded ring
  ctx.fillStyle = goldColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring border
  ctx.strokeStyle = '#996515';
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.stroke();

  // Inner field (Green / Navy)
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.fill();

  // Inner gold border
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = Math.max(1, 2 * s);
  ctx.stroke();

  // Radiant rays emanating from center
  ctx.strokeStyle = hexA(goldColor, 0.4);
  ctx.lineWidth = Math.max(1, 1.2 * s);
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (radius * 0.28), Math.sin(angle) * (radius * 0.28));
    ctx.lineTo(Math.cos(angle) * (radius * 0.8), Math.sin(angle) * (radius * 0.8));
    ctx.stroke();
  }

  // Open Holy Bible at the base
  const bw = radius * 0.72;
  const bh = radius * 0.38;
  const by = radius * 0.22;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-bw / 2, by + bh);
  ctx.quadraticCurveTo(-bw / 4, by + bh * 0.8, 0, by + bh);
  ctx.quadraticCurveTo(bw / 4, by + bh * 0.8, bw / 2, by + bh);
  ctx.lineTo(bw / 2, by + 4 * s);
  ctx.quadraticCurveTo(bw / 4, by - 6 * s, 0, by + 4 * s);
  ctx.quadraticCurveTo(-bw / 4, by - 6 * s, -bw / 2, by + 4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.stroke();

  // Central Catholic Cross
  const crossH = radius * 0.85;
  const crossW = crossH * 0.24;
  const crossY = -radius * 0.15;
  // Vertical beam
  ctx.fillStyle = goldColor;
  ctx.beginPath();
  roundedRectPath(ctx, -crossW / 2, crossY - crossH / 2, crossW, crossH, 3 * s);
  ctx.fill();
  // Horizontal beam
  const barW = crossH * 0.65;
  roundedRectPath(ctx, -barW / 2, crossY - crossH * 0.2, barW, crossW, 3 * s);
  ctx.fill();

  // Center cross shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, crossY - crossH * 0.08, crossW * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Curved CYON top text
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.max(9, 11 * s)}px ${FONTS.sans}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CYON', 0, -radius * 0.62);

  ctx.restore();
}

/** Draws a luxury scalloped golden age badge ("+1 Today" / "Celebrating 21") */
export function drawAgeSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  text: string,
  s: number,
  goldColor = '#f3c14a',
  textColor = '#071224',
): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Scalloped star points
  const points = 24;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.88;
    const a = (i * Math.PI) / points;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = goldColor;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10 * s;
  ctx.shadowOffsetY = 4 * s;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Inner dark/gold ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = Math.max(1, 2.5 * s);
  ctx.stroke();

  // Inner ring fill
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(0, -radius, 0, radius);
  grad.addColorStop(0, '#fff4d0');
  grad.addColorStop(1, '#e8c36a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Badge Text
  ctx.fillStyle = textColor;
  ctx.font = `800 ${Math.max(10, 15 * s)}px ${FONTS.sans}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/** Draws floating golden dust / bokeh particles */
export function drawGoldDust(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  alpha = 0.5,
): void {
  const particles: Array<[number, number, number, number]> = [
    [0.08, 0.12, 5, 0.8],
    [0.18, 0.22, 3, 0.5],
    [0.85, 0.15, 6, 0.7],
    [0.92, 0.28, 4, 0.9],
    [0.12, 0.45, 7, 0.6],
    [0.88, 0.48, 5, 0.5],
    [0.06, 0.62, 4, 0.8],
    [0.94, 0.65, 8, 0.7],
    [0.15, 0.82, 5, 0.6],
    [0.82, 0.85, 6, 0.8],
    [0.5, 0.08, 4, 0.7],
    [0.4, 0.94, 5, 0.5],
  ];

  ctx.save();
  for (const [fx, fy, r, a] of particles) {
    const x = fx * W;
    const y = fy * H;
    const rad = r * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255, 235, 170, ${a * alpha})`);
    g.addColorStop(0.5, `rgba(232, 195, 106, ${a * alpha * 0.7})`);
    g.addColorStop(1, 'rgba(232, 195, 106, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Central twinkle star
    if (r >= 5) {
      ctx.fillStyle = `rgba(255, 255, 255, ${a * alpha * 0.9})`;
      star4(ctx, x, y, rad * 0.8);
    }
  }
  ctx.restore();
}

/** Draws laurel botanical branches around a central frame */
export function drawLaurelWreath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  s: number,
  color = '#e8c36a',
): void {
  ctx.save();
  ctx.fillStyle = color;

  const count = 10;
  // Left branch
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = Math.PI * 0.6 + t * Math.PI * 0.8;
    const px = cx + Math.cos(angle) * (rx + 16 * s);
    const py = cy + Math.sin(angle) * (ry + 16 * s);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * s, 6 * s, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8 * s, -4 * s, 10 * s, 4 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Right branch
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = Math.PI * 0.4 - t * Math.PI * 0.8;
    const px = cx + Math.cos(angle) * (rx + 16 * s);
    const py = cy + Math.sin(angle) * (ry + 16 * s);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle - Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * s, 6 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-8 * s, -4 * s, 10 * s, 4 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Draws realistic editorial barcode for magazine cover template */
export function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#111111';
  let curX = x + 8 * s;
  const endX = x + w - 8 * s;
  const barH = h - 16 * s;

  let seed = 42;
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (curX < endX) {
    const barW = Math.max(1.5 * s, (pseudoRand() > 0.6 ? 3.5 : 1.8) * s);
    ctx.fillRect(curX, y + 5 * s, barW, barH);
    curX += barW + (pseudoRand() > 0.5 ? 2.5 : 4) * s;
  }

  ctx.font = `600 ${8 * s}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('CYON · 2026', x + w / 2, y + h - 3 * s);
  ctx.restore();
}

/** Draws four-point metallic sparkle star with tapered arms */
export function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color = '#7d7a75',
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r * 0.26, cy);
  ctx.lineTo(cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r * 0.26);
  ctx.lineTo(cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r * 0.26, cy);
  ctx.lineTo(cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r * 0.26);
  ctx.closePath();
  ctx.fill();

  // bright center glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, r * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws realistic jagged torn paper edge across the bottom of the canvas */
export function drawTornPaperBottom(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  height: number,
  color = '#111114',
  highlight = '#4a4a50',
): void {
  ctx.save();
  const steps = 48;
  const stepW = W / steps;
  const baseY = H - height;

  const jagged = (i: number) => {
    return Math.sin(i * 1.55) * 6 + Math.cos(i * 3.2) * 4.5 + Math.sin(i * 5.7) * 3;
  };

  // Torn paper fibrous highlight fringe
  ctx.strokeStyle = highlight;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, baseY + jagged(0));
  for (let i = 1; i <= steps; i++) {
    ctx.lineTo(i * stepW, baseY + jagged(i));
  }
  ctx.stroke();

  // Dark paper body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + jagged(0));
  for (let i = 1; i <= steps; i++) {
    ctx.lineTo(i * stepW, baseY + jagged(i));
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draws realistic scotch / masking tape strip with semi-transparent frosted texture */
export function drawTapeStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(238, 232, 218, 0.75)';
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 5;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // serrated / cut tape edge highlights
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-w / 2, -h / 2, w, 2);
  ctx.fillRect(-w / 2, h / 2 - 2, w, 2);
  ctx.restore();
}

