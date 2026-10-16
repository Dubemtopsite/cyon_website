import type { FlyerState } from '../types';
import { getTheme, type Theme } from '../data/themes';
import * as D from './draw';

/* ------------------------------------------------------------------ *
 * Template registry
 * ------------------------------------------------------------------ */

export interface PhotoRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}

export interface TemplateCtx {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  s: number;
  theme: Theme;
  st: FlyerState;
  img: HTMLImageElement | null;
  logo: HTMLImageElement | null;
}

export interface FlyerTemplate {
  id: string;
  name: string;
  blurb: string;
  category?: 'all' | 'official' | 'luxury' | 'youth' | 'floral' | 'classic';
  badge?: string;
  /** Theme-driven templates follow the colour picker; fixed ones keep official colours. */
  usesTheme: boolean;
  /** Swatches shown in the template gallery. */
  colors: [string, string, string];
  photoRegion(W: number, H: number, s: number): PhotoRegion;
  draw(c: TemplateCtx): void;
}

/* ------------------------------------------------------------------ *
 * Shared decorations
 * ------------------------------------------------------------------ */

function confettiDots(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  color: string,
  alpha = 0.5,
): void {
  const dots: Array<[number, number, number]> = [
    [0.08, 0.14, 6],
    [0.93, 0.2, 5],
    [0.16, 0.42, 4],
    [0.88, 0.52, 6],
    [0.06, 0.68, 5],
    [0.95, 0.74, 4],
    [0.5, 0.06, 4],
    [0.62, 0.955, 5],
    [0.3, 0.97, 4],
  ];
  ctx.save();
  ctx.fillStyle = D.hexA(color, alpha);
  for (const [fx, fy, r] of dots) {
    ctx.beginPath();
    ctx.arc(fx * W, fy * H, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function balloons(ctx: CanvasRenderingContext2D, W: number, s: number, colors: string[]): void {
  const spots: Array<[number, number, number, string]> = [
    [W * 0.74, 74 * s, 30 * s, colors[0]],
    [W * 0.84, 44 * s, 26 * s, colors[1]],
    [W * 0.92, 84 * s, 22 * s, colors[2]],
  ];
  ctx.save();
  for (const [cx, cy, r, color] of spots) {
    ctx.strokeStyle = 'rgba(60,60,60,0.55)';
    ctx.lineWidth = Math.max(1, 1.6 * s);
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 1.25);
    ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 2.6, cx - r * 0.2, cy + r * 3.8);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.82, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.26, cy - r * 0.32, r * 0.2, r * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.14, cy + r);
    ctx.lineTo(cx + r * 0.14, cy + r);
    ctx.lineTo(cx, cy + r * 1.28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function berries(ctx: CanvasRenderingContext2D, W: number, H: number, s: number): void {
  // Kept in the bottom-right corner so the footer wording stays legible.
  const clusters: Array<[number, number, number]> = [
    [W * 0.95, H * 0.94, 0.95],
    [W * 1.0, H * 1.01, 1.05],
    [W * 0.82, H * 0.995, 0.75],
  ];
  const offsets: Array<[number, number, number]> = [
    [0, 0, 13], [26, 12, 10], [12, 30, 12], [-16, 22, 11],
    [42, 30, 9], [20, 52, 12], [54, 8, 8], [66, 34, 10],
    [-8, 58, 8], [32, 74, 11], [74, 58, 9], [88, 24, 7],
  ];
  ctx.save();
  // leaves
  ctx.fillStyle = '#2f6b3a';
  for (const [cx, cy, k] of clusters) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.6;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * 60 * s * k, cy + Math.sin(a) * 52 * s * k);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 * s * k, 8 * s * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  // berries
  for (const [cx, cy, k] of clusters) {
    for (const [dx, dy, r] of offsets) {
      const x = cx + dx * s * k;
      const y = cy + dy * s * k;
      const radius = r * s * k;
      if (x > W + 20 * s || y > H + 20 * s) continue;
      ctx.fillStyle = '#c1121f';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Simple crest used when the parish has not uploaded a logo yet. */
function crestMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  green: string,
  gold: string,
): void {
  const w = h * 0.88;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.14);
  ctx.quadraticCurveTo(x, y, x + w * 0.16, y);
  ctx.lineTo(x + w * 0.84, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.14);
  ctx.lineTo(x + w, y + h * 0.58);
  ctx.quadraticCurveTo(x + w, y + h, x + w / 2, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h * 0.58);
  ctx.closePath();
  ctx.fillStyle = green;
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.stroke();
  D.drawCross(ctx, x + w / 2, y + h * 0.44, h * 0.42, gold);
  ctx.restore();
}

function drawPhotoOrPlaceholder(c: TemplateCtx, region: PhotoRegion, tint: string): void {
  const { ctx, s, img, st } = c;
  if (img && img.naturalWidth > 0) {
    D.drawPhotoRegion(ctx, region.x, region.y, region.w, region.h, region.radius, st, img, s);
    return;
  }
  ctx.save();
  D.roundedRectPath(ctx, region.x, region.y, region.w, region.h, region.radius);
  ctx.fillStyle = D.hexA(tint, 0.5);
  ctx.fill();
  ctx.setLineDash([12 * s, 10 * s]);
  ctx.strokeStyle = D.hexA(tint, 0.9);
  ctx.lineWidth = Math.max(1, 2 * s);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.font = `700 ${26 * s}px ${D.FONTS.sans}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Photo', region.x + region.w / 2, region.y + region.h / 2);
  ctx.restore();
}

function drawLogoIn(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  box: { x: number; y: number; h: number; maxW: number },
): number {
  if (!logo || !logo.naturalWidth) return 0;
  const ratio = logo.naturalWidth / logo.naturalHeight;
  let h = box.h;
  let w = h * ratio;
  if (w > box.maxW) {
    w = box.maxW;
    h = w / ratio;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.drawImage(logo, box.x, box.y, w, h);
  ctx.restore();
  return w;
}

/* ------------------------------------------------------------------ *
 * Theme-driven layouts (existing designs)
 * ------------------------------------------------------------------ */

const fullFrame = (W: number, H: number): PhotoRegion => ({ x: 0, y: 0, w: W, h: H, radius: 0 });

const classicTemplate: FlyerTemplate = {
  id: 'classic',
  name: 'Classic',
  blurb: 'Photo fills the flyer, wording floats over a gradient at the bottom.',
  usesTheme: true,
  colors: ['#0b1b33', '#e8c36a', '#ffffff'],
  photoRegion: (W, H) => fullFrame(W, H),
  draw: (c) => D.drawThemeLayout(c.ctx, c.W, c.H, c.st, c.img, c.logo),
};

const galleryTemplate: FlyerTemplate = {
  id: 'gallery',
  name: 'Gallery',
  blurb: 'Full photo with the wording in a frosted panel — great for busy backgrounds.',
  usesTheme: true,
  colors: ['#0b1b33', '#7fc4ff', '#ffffff'],
  photoRegion: (W, H) => fullFrame(W, H),
  draw: (c) => D.drawThemeLayout(c.ctx, c.W, c.H, c.st, c.img, c.logo),
};

const spotlightTemplate: FlyerTemplate = {
  id: 'spotlight',
  name: 'Spotlight',
  blurb: 'Photo in a card on top, wording on a clean panel below — the face is never covered.',
  usesTheme: true,
  colors: ['#12294a', '#e8c36a', '#ffffff'],
  photoRegion: (W, H, s) => {
    const card = D.spotlightCard(W, H, s);
    return { ...card, radius: 22 * s };
  },
  draw: (c) => D.drawThemeLayout(c.ctx, c.W, c.H, c.st, c.img, c.logo),
};

/* ------------------------------------------------------------------ *
 * Deanery banner layout (green / blue official variants)
 * ------------------------------------------------------------------ */

interface DeaneryColors {
  main: string;
  dark: string;
  deep: string;
  gold: string;
  orange: string;
  pill: string;
  pattern: string;
}

function deaneryTemplate(
  id: string,
  name: string,
  palette: DeaneryColors,
): FlyerTemplate {
  const PAD = 40;
  const bannerTop = 104;
  const bannerH = 96;
  const barH = 72;

  const region = (W: number, H: number, s: number): PhotoRegion => {
    const top = (bannerTop + bannerH + 28) * s;
    const bottomLimit = H - (barH + 24) * s;
    const h = Math.min(H * 0.46, bottomLimit - top - 90 * s);
    return { x: PAD * s, y: top, w: W * 0.5, h, radius: 26 * s };
  };

  return {
    id,
    name,
    blurb: 'Official banner style with the photo on the left and the name beside it.',
    usesTheme: false,
    colors: ['#ffffff', palette.main, palette.gold],
    photoRegion: region,
    draw: (c) => {
      const { ctx, W, H, s, st, logo } = c;
      const padX = PAD * s;
      const barY = H - barH * s;
      const area = region(W, H, s);

      // white background + patterned rings
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.strokeStyle = D.hexA(palette.pattern, 0.13);
      ctx.lineWidth = Math.max(1, 2 * s);
      for (let iy = 0; iy < 11; iy++) {
        for (let ix = 0; ix < 6; ix++) {
          ctx.beginPath();
          ctx.arc((ix + 0.5) * (W / 6), (iy + 0.4) * (H / 10.5), 11 * s, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = palette.main;
      ctx.beginPath();
      ctx.arc(W * 0.86, H * 0.36, W * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W * 0.16, H * 0.82, W * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (st.decor) confettiDots(ctx, W, H, s, palette.main, 0.4);
      balloons(ctx, W, s, [palette.gold, palette.orange, palette.main]);

      // ---- movable logo & authentic clean top header (matching sample images 1, 2, 3)
      D.drawMovableLogo(ctx, W, H, s, st, logo, palette.main, palette.gold, 'tc');

      ctx.save();
      ctx.textAlign = 'center';
      const headerCx = W / 2;
      const headY = 96 * s;

      // Green rule lines framing the header text
      ctx.strokeStyle = D.hexA(palette.main, 0.45);
      ctx.lineWidth = Math.max(1, 1.8 * s);
      const ruleW = W * 0.42;
      ctx.beginPath();
      ctx.moveTo(headerCx - ruleW / 2, headY - 14 * s);
      ctx.lineTo(headerCx + ruleW / 2, headY - 14 * s);
      ctx.moveTo(headerCx - ruleW / 2, headY + 38 * s);
      ctx.lineTo(headerCx + ruleW / 2, headY + 38 * s);
      ctx.stroke();

      ctx.fillStyle = palette.main;
      ctx.font = `800 ${17 * s}px ${D.FONTS.sans}`;
      ctx.fillText('CATHOLIC YOUTH ORGANIZATION OF NIGERIA', headerCx, headY + 6 * s);

      const bannerLine = (st.banner || 'UYO DEANERY').toUpperCase();
      ctx.font = `800 ${15 * s}px ${D.FONTS.sans}`;
      ctx.fillStyle = palette.dark;
      ctx.fillText(`(CYON) ${bannerLine}`, headerCx, headY + 28 * s);
      ctx.restore();

      // ---- date badge (top right)
      const [dayLabel, monthLabel] = D.parseDateBadge(st.showDate ? st.date : '');
      if (dayLabel) {
        const bw = 118 * s;
        const bh = 92 * s;
        const bx = W - padX - bw;
        const by = 8 * s;
        D.roundedRectPath(ctx, bx, by, bw, bh, 12 * s);
        ctx.fillStyle = '#101010';
        ctx.fill();
        ctx.strokeStyle = D.hexA(palette.gold, 0.8);
        ctx.lineWidth = Math.max(1, 2 * s);
        ctx.stroke();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${34 * s}px ${D.FONTS.sans}`;
        ctx.fillText(dayLabel, bx + bw / 2, by + bh * 0.5);
        if (monthLabel) {
          ctx.font = `700 ${24 * s}px ${D.FONTS.sans}`;
          ctx.fillStyle = palette.gold;
          ctx.fillText(monthLabel, bx + bw / 2, by + bh * 0.82);
        }
        ctx.restore();
      }

      // ---- photo with orange accent + white frame
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = 18 * s;
      ctx.shadowOffsetY = 6 * s;
      D.roundedRectPath(ctx, area.x + 10 * s, area.y + 12 * s, area.w, area.h, area.radius);
      ctx.fillStyle = palette.orange;
      ctx.fill();
      ctx.restore();

      D.roundedRectPath(ctx, area.x, area.y, area.w, area.h, area.radius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = palette.orange;
      ctx.lineWidth = Math.max(1, 4 * s);
      ctx.stroke();

      const inner: PhotoRegion = {
        x: area.x + 12 * s,
        y: area.y + 12 * s,
        w: area.w - 24 * s,
        h: area.h - 24 * s,
        radius: area.radius - 8 * s,
      };
      drawPhotoOrPlaceholder(c, inner, palette.main);

      // corner rings like the sample's curved frame
      ctx.save();
      ctx.strokeStyle = palette.orange;
      ctx.lineWidth = Math.max(1, 7 * s);
      ctx.beginPath();
      ctx.arc(area.x + area.w * 0.28, area.y + area.h + 6 * s, 34 * s, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = palette.gold;
      ctx.lineWidth = Math.max(1, 4 * s);
      ctx.beginPath();
      ctx.arc(area.x + area.w * 0.28, area.y + area.h + 6 * s, 48 * s, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ---- right column (self-scaling so nothing ever overlaps or overflows)
      const colX = area.x + area.w + 30 * s;
      const colW = W - colX - padX;
      const colAvail = barY - 44 * s - area.y;

      const roleLine = st.title.trim().toUpperCase();
      const nameFit = D.fitTextLines(ctx, st.name.trim() || 'Celebrant Name', {
        size: 52 * s,
        maxW: colW - 40 * s,
        maxLines: 3,
        minSize: 22 * s,
        font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
        lineHeight: 1.1,
      });
      const parishFit = D.fitTextLines(ctx, st.parish.trim() || 'Parish name', {
        size: 27 * s,
        maxW: colW,
        maxLines: 2,
        font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
        lineHeight: 1.22,
      });
      const gapBadge = 24 * s;
      const gapBox = 22 * s;
      const gapPill = 16 * s;
      const gapAge = 14 * s;
      const boxPadY0 = 20 * s;
      const roleH0 = roleLine ? 30 * s : 0;
      const badgeH0 = Math.min(252 * s, area.h * 0.55);
      const boxH0 = nameFit.lines.length * nameFit.lineH + boxPadY0 * 2 + roleH0;
      const pillH0 = 36 * s;
      const parishH0 = parishFit.lines.length * parishFit.lineH;
      const ageH0 = st.age.trim() ? 26 * s : 0;
      const colNatural =
        badgeH0 + gapBadge + boxH0 + gapBox + pillH0 + gapPill + parishH0 + gapAge + ageH0;
      const kCol = Math.min(1, colAvail / Math.max(1, colNatural));

      // script birthday badge
      const badgeY = area.y;
      const badgeH = badgeH0 * kCol;
      ctx.save();
      ctx.translate(colX + colW / 2, badgeY + badgeH / 2);
      ctx.rotate(-0.02);
      const bg = ctx.createLinearGradient(-colW / 2, -badgeH / 2, colW / 2, badgeH / 2);
      bg.addColorStop(0, palette.main);
      bg.addColorStop(1, palette.dark);
      D.roundedRectPath(ctx, -colW / 2, -badgeH / 2, colW, badgeH, 30 * s);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = D.hexA(palette.gold, 0.75);
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.min(64 * s, badgeH * 0.3)}px ${D.FONTS.script}`;
      const happySize = Math.min(64 * s, badgeH * 0.3);
      const bdaySize = Math.min(92 * s, badgeH * 0.43);
      ctx.font = `700 ${happySize}px ${D.FONTS.script}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(st.headline.trim() || 'Happy', 0, -badgeH * 0.06);
      ctx.font = `700 ${bdaySize}px ${D.FONTS.script}`;
      ctx.fillStyle = palette.gold;
      ctx.fillText('Birthday', 0, badgeH * 0.2);
      // gold "to you" pill
      const pillW = Math.min(colW * 0.62, 220 * s);
      const pillH = Math.max(20 * s * kCol, badgeH * 0.16);
      D.roundedRectPath(ctx, -pillW / 2, badgeH * 0.24, pillW, pillH, pillH / 2);
      ctx.fillStyle = palette.gold;
      ctx.fill();
      ctx.fillStyle = palette.deep;
      ctx.font = `700 ${pillH * 0.52}px ${D.FONTS.sans}`;
      ctx.fillText('TO YOU', 0, badgeH * 0.24 + pillH * 0.68);
      ctx.restore();

      // name block
      let cursor = badgeY + badgeH + gapBadge * kCol;
      const boxPadY = boxPadY0 * kCol;
      const boxH = boxH0 * kCol;

      D.roundedRectPath(ctx, colX, cursor, colW, boxH, 16 * s);
      ctx.fillStyle = D.hexA(palette.deep, 0.94);
      ctx.fill();
      ctx.strokeStyle = D.hexA(palette.gold, 0.6);
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.stroke();

      // golden pointer triangle matching sample images
      ctx.save();
      ctx.fillStyle = palette.gold;
      const triY = cursor + 24 * s * kCol;
      ctx.beginPath();
      ctx.moveTo(colX - 18 * s, triY - 14 * s * kCol);
      ctx.lineTo(colX - 4 * s, triY);
      ctx.lineTo(colX - 18 * s, triY + 14 * s * kCol);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${nameFit.size * kCol}px ${D.FONTS.sans}`;
      D.drawLinesCentered(
        ctx,
        nameFit.lines,
        colX + colW / 2,
        cursor + boxPadY,
        nameFit.size * kCol,
        nameFit.lineH * kCol,
      );
      if (roleLine) {
        const roleFit = D.fitTrackedLines(ctx, roleLine, {
          size: 15 * s * kCol,
          maxW: colW - 32 * s,
          maxLines: 1,
          spacing: 2 * s,
          font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
          lineHeight: 1.2,
        });
        const pillH = 26 * s * kCol;
        const pillTextW = D.spacedWidth(ctx, roleFit.lines[0], 2 * s);
        const pillW = Math.min(colW, pillTextW + 24 * s * kCol);
        const pillY = cursor + boxPadY + nameFit.lines.length * nameFit.lineH * kCol + 6 * s * kCol;
        D.roundedRectPath(ctx, colX + colW / 2 - pillW / 2, pillY, pillW, pillH, 5 * s);
        ctx.fillStyle = palette.pill;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${roleFit.size}px ${D.FONTS.sans}`;
        D.drawSpaced(
          ctx,
          roleFit.lines[0],
          colX + colW / 2,
          pillY + pillH * 0.72,
          2 * s,
          'center',
        );
      }
      ctx.restore();
      cursor += boxH + gapBox * kCol;

      // parish pill + white name text
      const parishLabel = 'PARISH';
      ctx.save();
      ctx.font = `800 ${18 * s * kCol}px ${D.FONTS.sans}`;
      const pillTextW = D.spacedWidth(ctx, parishLabel, 2 * s * kCol);
      const parishPillW = pillTextW + 26 * s * kCol;
      const pillH2 = pillH0 * kCol;
      D.roundedRectPath(ctx, colX, cursor, parishPillW, pillH2, 5 * s);
      ctx.fillStyle = palette.pill;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      D.drawSpaced(
        ctx,
        parishLabel,
        colX + parishPillW / 2,
        cursor + pillH2 * 0.72,
        2 * s * kCol,
        'center',
      );
      ctx.restore();
      cursor += pillH2 + gapPill * kCol;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${parishFit.size * kCol}px ${D.FONTS.sans}`;
      let py = cursor + parishFit.size * kCol * 0.85;
      for (const line of parishFit.lines) {
        ctx.fillText(line, colX, py);
        py += parishFit.lineH * kCol;
      }
      ctx.restore();
      cursor += parishH0 * kCol + gapAge * kCol;

      if (st.age.trim()) {
        const ageFit = D.fitTrackedLines(ctx, `CELEBRATING ${st.age.trim()} YEARS`, {
          size: 20 * s * kCol,
          maxW: colW,
          maxLines: 1,
          spacing: 3 * s,
          font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
          lineHeight: 1.2,
        });
        ctx.save();
        ctx.fillStyle = palette.main;
        ctx.font = `700 ${ageFit.size}px ${D.FONTS.sans}`;
        D.drawSpaced(
          ctx,
          ageFit.lines[0],
          colX,
          cursor + 16 * s * kCol,
          3 * s,
          'left',
        );
        ctx.restore();
        cursor += ageH0 * kCol;
      }
      const colBottom = cursor;

      // ---- message, placed below whichever column ends lowest
      const msg = st.message.trim();
      if (msg) {
        const msgTop = Math.max(area.y + area.h + 36 * s, colBottom + 18 * s);
        const msgAvail = barY - 14 * s - msgTop;
        if (msgAvail > 18 * s) {
          const msgFit = D.fitTextLines(ctx, msg, {
            size: 24 * s,
            maxW: W - padX * 2 - 120 * s,
            maxLines: msgAvail < 74 * s ? 1 : 2,
            minSize: 12 * s,
            font: (sz) => `italic 400 ${sz}px ${D.FONTS.display}`,
            lineHeight: 1.4,
          });
          const shrink = Math.min(1, msgAvail / Math.max(1, msgFit.lines.length * msgFit.lineH));
          const size = msgFit.size * shrink;
          ctx.save();
          ctx.fillStyle = '#22402f';
          ctx.font = `italic 400 ${size}px ${D.FONTS.display}`;
          D.drawLinesCentered(ctx, msgFit.lines, W / 2, msgTop, size, msgFit.lineH * shrink);
          ctx.restore();
        }
      }

      // ---- bottom bar
      const barGrad = ctx.createLinearGradient(0, barY, W, H);
      barGrad.addColorStop(0, palette.main);
      barGrad.addColorStop(1, palette.dark);
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, barY, W, H - barY);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      const courtesy = `Courtesy: Catholic Youth Organisation of Nigeria (CYON)${st.banner ? ` · ${st.banner}` : ''}`;
      ctx.font = `600 ${19 * s}px ${D.FONTS.sans}`;
      const fullW = Math.max(1, ctx.measureText(courtesy).width);
      const csize = Math.max(10 * s, Math.min(19 * s, (19 * s * (W - padX * 2)) / fullW));
      ctx.font = `600 ${csize}px ${D.FONTS.sans}`;
      ctx.textAlign = 'center';
      ctx.fillText(courtesy, W / 2, barY + (H - barY) * 0.62);
      ctx.restore();
    },
  };
}

/* ------------------------------------------------------------------ *
 * Parish herald (cream + green/gold, photo band on top)
 * ------------------------------------------------------------------ */

const heraldTemplate: FlyerTemplate = {
  id: 'herald',
  name: 'Parish Herald',
  blurb: 'Cream parish style with the photo band on top and a gold name plate below.',
  usesTheme: false,
  colors: ['#fdfaf1', '#0b4d2c', '#c9a227'],
  photoRegion: (W, H) => ({ x: 0, y: 0, w: W, h: H * 0.48, radius: 0 }),
  draw: (c) => {
    const { ctx, W, H, s, st, logo } = c;
    const green = '#0b4d2c';
    const greenMid = '#12703f';
    const gold = '#c9a227';
    const cream = '#fdfaf1';
    const bandH = H * 0.48;

    ctx.fillStyle = cream;
    ctx.fillRect(0, 0, W, H);

    // photo band + fade into the cream panel
    drawPhotoOrPlaceholder(c, { x: 0, y: 0, w: W, h: bandH, radius: 0 }, greenMid);
    const fade = ctx.createLinearGradient(0, bandH * 0.55, 0, bandH);
    fade.addColorStop(0, D.hexA(cream, 0));
    fade.addColorStop(1, D.hexA(cream, 1));
    ctx.fillStyle = fade;
    ctx.fillRect(0, bandH * 0.55, W, bandH * 0.45);

    // logos (both corners if uploaded, otherwise a small crest)
    const logoH = 74 * s * (st.logoScale || 1);
    if (logo) {
      drawLogoIn(ctx, logo, { x: 42 * s, y: 34 * s, h: logoH, maxW: W * 0.22 });
      drawLogoIn(ctx, logo, { x: W - 42 * s - 40 * s, y: 34 * s, h: logoH * 0.5, maxW: W * 0.1 });
    } else {
      crestMark(ctx, 42 * s, 34 * s, logoH, greenMid, gold);
    }

    // decorative frame
    D.roundedRectPath(ctx, 20 * s, 20 * s, W - 40 * s, H - 40 * s, 16 * s);
    ctx.strokeStyle = D.hexA(gold, 0.95);
    ctx.lineWidth = Math.max(1, 3.5 * s);
    ctx.stroke();
    D.roundedRectPath(ctx, 30 * s, 30 * s, W - 60 * s, H - 60 * s, 12 * s);
    ctx.strokeStyle = D.hexA(green, 0.5);
    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.stroke();

    if (st.decor) confettiDots(ctx, W, H, s, gold, 0.35);

    // ---- content block (auto-scaled to the space below the photo)
    const startY = bandH + 18 * s;
    const avail = H - startY - 34 * s;

    const orgLine = `CYON ${st.parish || 'Parish'}`.trim();
    const orgFit = D.fitTrackedLines(ctx, orgLine, {
      size: 34 * s,
      maxW: W - 150 * s,
      maxLines: 2,
      spacing: 1.5 * s,
      font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.18,
    });
    const nameFit = D.fitTextLines(ctx, st.name.trim() || 'Celebrant Name', {
      size: 44 * s,
      maxW: W - 220 * s,
      maxLines: 2,
      font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.14,
    });
    const msgFit = D.fitTextLines(ctx, st.message.trim() || 'Wishing you many more blessed years!', {
      size: 24 * s,
      maxW: W * 0.78,
      maxLines: 3,
      font: (sz) => `italic 400 ${sz}px ${D.FONTS.display}`,
      lineHeight: 1.4,
    });

    const needs = () =>
      orgFit.lines.length * orgFit.lineH +
      12 * s +
      54 * s + // "wishes You" rule
      26 * s +
      108 * s + // Happy (script)
      92 * s + // Birthday
      30 * s + // gaps
      (nameFit.lines.length * nameFit.lineH + 78 * s) + // gold plate
      24 * s +
      msgFit.lines.length * msgFit.lineH +
      20 * s +
      (st.showDate && st.date.trim() ? 34 * s : 0) +
      60 * s + // footer rule + signature
      (st.age.trim() ? 30 * s : 0);

    const need = needs();
    const k = Math.min(1, avail / Math.max(1, need));
    let y = startY + Math.max(0, (avail - need * k) / 2);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // org + parish
    ctx.fillStyle = green;
    ctx.font = `800 ${orgFit.size * k}px ${D.FONTS.sans}`;
    y += D.drawLinesCentered(ctx, orgFit.lines, W / 2, y, orgFit.size * k, orgFit.lineH * k, 1.5 * s);
    y += 12 * s * k;

    // “wishes You”
    const wishesSize = 46 * s * k;
    ctx.font = `italic 700 ${wishesSize}px ${D.FONTS.script}`;
    ctx.fillStyle = greenMid;
    const wishesW = ctx.measureText('wishes You').width;
    ctx.strokeStyle = D.hexA(gold, 0.9);
    ctx.lineWidth = Math.max(1, 2 * s);
    const wy = y + wishesSize * 0.82;
    ctx.beginPath();
    ctx.moveTo(W / 2 - wishesW / 2 - 110 * s, wy - wishesSize * 0.24);
    ctx.lineTo(W / 2 - wishesW / 2 - 20 * s, wy - wishesSize * 0.24);
    ctx.moveTo(W / 2 + wishesW / 2 + 20 * s, wy - wishesSize * 0.24);
    ctx.lineTo(W / 2 + wishesW / 2 + 110 * s, wy - wishesSize * 0.24);
    ctx.stroke();
    ctx.fillText('wishes You', W / 2, wy);
    y += wishesSize * 1.18 + 26 * s * k;

    // Happy (script) + Birthday
    const happySize = 104 * s * k;
    ctx.font = `700 ${happySize}px ${D.FONTS.script}`;
    ctx.fillStyle = green;
    ctx.fillText(st.headline.trim() || 'Happy', W / 2, y + happySize * 0.78);
    y += happySize * 0.84;
    const bdaySize = 86 * s * k;
    ctx.font = `800 ${bdaySize}px ${D.FONTS.sans}`;
    ctx.fillStyle = green;
    D.drawSpaced(ctx, 'Birthday', W / 2, y + bdaySize * 0.85, 2 * s, 'center');
    y += bdaySize * 1.0 + 30 * s * k;

    // gold name plate
    const plateH = nameFit.lines.length * nameFit.lineH * k + 78 * s * k;
    const plateW = W - 180 * s;
    const plateX = (W - plateW) / 2;
    const plateGrad = ctx.createLinearGradient(plateX, y, plateX + plateW, y + plateH);
    plateGrad.addColorStop(0, '#f0dd9a');
    plateGrad.addColorStop(1, gold);
    D.roundedRectPath(ctx, plateX, y, plateW, plateH, plateH / 2);
    ctx.fillStyle = plateGrad;
    ctx.fill();
    ctx.strokeStyle = green;
    ctx.lineWidth = Math.max(1, 3 * s);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = green;
    ctx.font = `800 ${nameFit.size * k}px ${D.FONTS.sans}`;
    const nameTop = y + 22 * s * k;
    D.drawLinesCentered(ctx, nameFit.lines, W / 2, nameTop, nameFit.size * k, nameFit.lineH * k, 1 * s);
    const roleLine = st.title.trim();
    if (roleLine) {
      ctx.font = `600 ${24 * s * k}px ${D.FONTS.sans}`;
      ctx.fillStyle = '#1f4a2f';
      ctx.fillText(
        roleLine,
        W / 2,
        nameTop + nameFit.lines.length * nameFit.lineH * k + 30 * s * k,
      );
    }
    ctx.restore();
    y += plateH + 24 * s * k;

    // message
    ctx.fillStyle = '#3f3a2c';
    ctx.font = `italic 400 ${msgFit.size * k}px ${D.FONTS.display}`;
    y += D.drawLinesCentered(ctx, msgFit.lines, W / 2, y, msgFit.size * k, msgFit.lineH * k);
    y += 20 * s * k;

    if (st.age.trim()) {
      ctx.fillStyle = greenMid;
      ctx.font = `700 ${22 * s * k}px ${D.FONTS.sans}`;
      D.drawSpaced(ctx, `CELEBRATING ${st.age.trim()} YEARS`, W / 2, y + 18 * s * k, 4 * s, 'center');
      y += 30 * s * k;
    }

    if (st.showDate && st.date.trim()) {
      ctx.fillStyle = '#6b5a1f';
      ctx.font = `600 ${21 * s * k}px ${D.FONTS.sans}`;
      D.drawSpaced(ctx, st.date.toUpperCase(), W / 2, y + 16 * s * k, 3 * s, 'center');
      y += 34 * s * k;
    }

    // footer: rule, social pips, signature
    y += 8 * s * k;
    ctx.strokeStyle = D.hexA(gold, 0.9);
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.beginPath();
    ctx.moveTo(W / 2 - W * 0.14, y);
    ctx.lineTo(W / 2 + W * 0.14, y);
    ctx.stroke();
    y += 26 * s * k;

    const pips: Array<[string, string]> = [
      ['f', '#1877f2'],
      ['G', '#db4437'],
      ['W', '#25d366'],
      ['X', '#111111'],
    ];
    const pipR = 15 * s * k;
    const pipGap = 46 * s * k;
    const pipsW = (pips.length - 1) * pipGap;
    ctx.save();
    for (let i = 0; i < pips.length; i++) {
      const px = W / 2 - pipsW / 2 + i * pipGap;
      const py = y + pipR;
      ctx.fillStyle = pips[i][1];
      ctx.beginPath();
      ctx.arc(px, py, pipR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${16 * s * k}px ${D.FONTS.sans}`;
      ctx.textAlign = 'center';
      ctx.fillText(pips[i][0], px, py + 5.5 * s * k);
    }
    ctx.restore();
    y += pipR * 2 + 22 * s * k;

    ctx.fillStyle = green;
    ctx.font = `700 ${22 * s * k}px ${D.FONTS.sans}`;
    const signature = st.pro.trim() || 'CYON Public Relations Officer';
    D.drawSpaced(ctx, signature, W / 2, y + 12 * s * k, 1 * s, 'center');

    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Minimal gift style (white, red caps, script name)
 * ------------------------------------------------------------------ */

const minimalTemplate: FlyerTemplate = {
  id: 'minimal',
  name: 'Minimal Gift',
  blurb: 'Bright white design with a gift-wrapped photo card and a script name in gold.',
  usesTheme: false,
  colors: ['#ffffff', '#d32029', '#e0a92b'],
  photoRegion: (W, H, s) => ({
    x: 44 * s,
    y: H * 0.2,
    w: W * 0.46,
    h: H * 0.5,
    radius: 8 * s,
  }),
  draw: (c) => {
    const { ctx, W, H, s, st, logo } = c;
    const red = '#d32029';
    const green = '#0f6b3f';
    const pink = '#f2a0bc';
    const gold = '#e0a92b';
    const ink = '#1a1a1a';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (st.decor) confettiDots(ctx, W, H, s, red, 0.28);
    berries(ctx, W, H, s);

    // ---- header
    const headY = 34 * s;
    const crestH = 70 * s;
    if (logo) {
      drawLogoIn(ctx, logo, { x: 40 * s, y: headY, h: crestH * (st.logoScale || 1), maxW: W * 0.2 });
    } else {
      crestMark(ctx, 40 * s, headY, crestH, green, gold);
    }
    ctx.save();
    ctx.fillStyle = ink;
    ctx.font = `700 ${20 * s}px ${D.FONTS.sans}`;
    D.drawSpaced(
      ctx,
      'CATHOLIC YOUTH ORGANIZATION OF NIGERIA',
      40 * s + crestH * 0.88 + 20 * s,
      headY + crestH * 0.66,
      2 * s,
      'left',
    );
    if (st.showDate && st.date.trim()) {
      ctx.fillStyle = '#6b6b6b';
      ctx.font = `600 ${19 * s}px ${D.FONTS.sans}`;
      D.drawSpaced(ctx, st.date.trim(), W - 40 * s, headY + crestH * 0.66, 1 * s, 'right');
    }
    ctx.restore();

    // ---- photo card with gift ribbon
    const area = minimalRegion(W, H, s);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 22 * s;
    ctx.shadowOffsetY = 8 * s;
    ctx.fillStyle = '#ffffff';
    D.roundedRectPath(ctx, area.x, area.y, area.w, area.h, area.radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    D.roundedRectPath(ctx, area.x, area.y, area.w, area.h, area.radius);
    ctx.clip();
    drawPhotoOrPlaceholder(c, { ...area, radius: 0 }, green);
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = Math.max(1, 1.5 * s);
    D.roundedRectPath(ctx, area.x, area.y, area.w, area.h, area.radius);
    ctx.stroke();

    // ribbon bows above the card
    ctx.save();
    ctx.translate(area.x + area.w * 0.44, area.y - 4 * s);
    ctx.rotate(-0.05);
    D.roundedRectPath(ctx, -area.w * 0.4, -22 * s, area.w * 0.8, 26 * s, 8 * s);
    ctx.fillStyle = pink;
    ctx.fill();
    D.roundedRectPath(ctx, -area.w * 0.28, -38 * s, area.w * 0.56, 22 * s, 8 * s);
    ctx.fillStyle = green;
    ctx.fill();
    ctx.restore();

    // ---- right column
    const colX = area.x + area.w + 40 * s;
    const colW = W - colX - 40 * s;
    let y = area.y;

    ctx.save();
    ctx.textBaseline = 'alphabetic';
    const headWords = (st.headline.trim() || 'Happy Birthday').toUpperCase().split(/\s+/);
    const capsLine1 = headWords[0] ?? 'HAPPY';
    const capsLine2 = headWords.slice(1).join(' ') || 'BIRTHDAY';
    const fitCaps = (text: string): number => {
      ctx.font = `900 ${76 * s}px ${D.FONTS.sans}`;
      const base = Math.max(1, D.spacedWidth(ctx, text, 3 * s));
      return Math.min(76 * s, (76 * s * colW) / base);
    };
    const capsSize = Math.min(fitCaps(capsLine1), fitCaps(capsLine2));
    ctx.font = `900 ${capsSize}px ${D.FONTS.sans}`;
    ctx.fillStyle = red;
    D.drawSpaced(ctx, capsLine1, colX, y + capsSize * 0.86, 3 * s, 'left');
    y += capsSize * 1.05;
    D.drawSpaced(ctx, capsLine2, colX, y + capsSize * 0.86, 3 * s, 'left');
    y += capsSize * 1.2;

    const nameFit = D.fitTextLines(ctx, st.name.trim() || 'Celebrant Name', {
      size: 84 * s,
      maxW: colW,
      maxLines: 3,
      minSize: 34 * s,
      font: (sz) => `700 ${sz}px ${D.FONTS.script}`,
      lineHeight: 1.05,
    });
    ctx.font = `700 ${nameFit.size}px ${D.FONTS.script}`;
    let ny = y + nameFit.size * 0.86;
    for (const line of nameFit.lines) {
      ctx.lineWidth = Math.max(1, nameFit.size * 0.05);
      ctx.strokeStyle = '#8a5a12';
      ctx.strokeText(line, colX, ny);
      ctx.fillStyle = gold;
      ctx.fillText(line, colX, ny);
      ny += nameFit.lineH;
    }
    y = ny + 6 * s;

    if (st.age.trim()) {
      const ageFit = D.fitTrackedLines(ctx, `CELEBRATING ${st.age.trim()} YEARS`, {
        size: 20 * s,
        maxW: colW,
        maxLines: 1,
        spacing: 3 * s,
        font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
        lineHeight: 1.2,
      });
      ctx.fillStyle = '#b08a1f';
      ctx.font = `700 ${ageFit.size}px ${D.FONTS.sans}`;
      D.drawSpaced(ctx, ageFit.lines[0], colX, y + 14 * s, 3 * s, 'left');
      y += 34 * s;
    }

    // quoted message with corner brackets
    const msg = st.message.trim();
    if (msg) {
      const msgFit = D.fitTextLines(ctx, msg, {
        size: 22 * s,
        maxW: colW - 40 * s,
        maxLines: 4,
        font: (sz) => `italic 400 ${sz}px ${D.FONTS.display}`,
        lineHeight: 1.45,
      });
      const boxH = msgFit.lines.length * msgFit.lineH + 28 * s;
      const bx = colX;
      const byTop = y + 16 * s;
      const bracket = 24 * s;
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath();
      ctx.moveTo(bx, byTop + bracket);
      ctx.lineTo(bx, byTop);
      ctx.lineTo(bx + bracket, byTop);
      ctx.moveTo(bx + colW - bracket, byTop);
      ctx.lineTo(bx + colW, byTop);
      ctx.lineTo(bx + colW, byTop + bracket);
      ctx.moveTo(bx, byTop + boxH - bracket);
      ctx.lineTo(bx, byTop + boxH);
      ctx.lineTo(bx + bracket, byTop + boxH);
      ctx.moveTo(bx + colW - bracket, byTop + boxH);
      ctx.lineTo(bx + colW, byTop + boxH);
      ctx.lineTo(bx + colW, byTop + boxH - bracket);
      ctx.stroke();

      ctx.fillStyle = '#3a3a3a';
      ctx.font = `italic 400 ${msgFit.size}px ${D.FONTS.display}`;
      D.drawLinesCentered(ctx, msgFit.lines, colX + colW / 2, byTop + 14 * s, msgFit.size, msgFit.lineH);
      y = byTop + boxH;
    }
    ctx.restore();

    // ---- footer: From …
    const footY = H - 132 * s;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#8a8a8a';
    const fromSize = 76 * s;
    ctx.font = `700 ${fromSize}px ${D.FONTS.script}`;
    ctx.fillText('From', 44 * s, footY);
    const fromW = ctx.measureText('From').width;
    // Fit the EXACT string that gets drawn (uppercase is wider than mixed case).
    const footerText = `CYON ${st.parish || 'Parish'}${st.banner ? ` · ${st.banner}` : ''}`.toUpperCase();
    const parishFit = D.fitTrackedLines(ctx, footerText, {
      size: 30 * s,
      maxW: W - (44 * s + fromW + 24 * s) - 44 * s,
      maxLines: 2,
      spacing: 2 * s,
      font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.2,
    });
    ctx.fillStyle = ink;
    ctx.font = `700 ${parishFit.size}px ${D.FONTS.sans}`;
    let fy = footY - 6 * s;
    for (const line of parishFit.lines) {
      D.drawSpaced(ctx, line, 44 * s + fromW + 24 * s, fy, 2 * s, 'left');
      fy += parishFit.lineH;
    }
    if (st.pro.trim()) {
      const sigFit = D.fitTrackedLines(ctx, st.pro.trim(), {
        size: 19 * s,
        maxW: W - 88 * s,
        maxLines: 1,
        spacing: 1 * s,
        font: (sz) => `600 ${sz}px ${D.FONTS.sans}`,
        lineHeight: 1.2,
      });
      ctx.fillStyle = '#6b6b6b';
      ctx.font = `600 ${sigFit.size}px ${D.FONTS.sans}`;
      D.drawSpaced(ctx, sigFit.lines[0], 44 * s, footY + 34 * s, 1 * s, 'left');
    }
    ctx.restore();
  },
};

function minimalRegion(W: number, H: number, s: number): PhotoRegion {
  return { x: 44 * s, y: H * 0.2, w: W * 0.46, h: H * 0.5, radius: 8 * s };
}

/* ------------------------------------------------------------------ *
 * St. Dominic Parish Fegge Onitsha (Gift Box & Red Headline Style)
 * ------------------------------------------------------------------ */

const onitshaFeggeTemplate: FlyerTemplate = {
  id: 'onitsha-fegge',
  name: 'Onitsha Festive (St. Dominic)',
  blurb: 'Inspired by CYON St. Dominic Parish Fegge Onitsha: bold red headline, golden name, and gift bow accents.',
  category: 'youth',
  badge: 'ONITSHA',
  usesTheme: false,
  colors: ['#0b4d2c', '#d32029', '#e8c36a'],
  photoRegion: (W, H, s) => ({
    x: 48 * s,
    y: H * 0.3,
    w: W * 0.44,
    h: H * 0.48,
    radius: 20 * s,
  }),
  draw: (c) => {
    const { ctx, W, H, s, st, logo } = c;
    const region = onitshaFeggeTemplate.photoRegion(W, H, s);

    // Pristine white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Top CYON Banner & Movable Logo
    D.drawMovableLogo(ctx, W, H, s, st, logo, '#0b4d2c', '#e8c36a', 'tl');

    ctx.save();
    ctx.fillStyle = '#0b4d2c';
    ctx.font = `800 ${19 * s}px ${D.FONTS.sans}`;
    const headerTitle = 'CATHOLIC YOUTH ORGANIZATION OF NIGERIA';
    ctx.fillText(headerTitle, 116 * s, 48 * s);
    ctx.restore();

    // Gift bow ribbon accent at top center-left
    ctx.save();
    ctx.fillStyle = '#0b4d2c';
    ctx.beginPath();
    ctx.moveTo(region.x + region.w * 0.2, region.y - 48 * s);
    ctx.lineTo(region.x + region.w * 0.5, region.y - 12 * s);
    ctx.lineTo(region.x + region.w * 0.8, region.y - 48 * s);
    ctx.lineTo(region.x + region.w * 0.5, region.y - 30 * s);
    ctx.closePath();
    ctx.fill();

    // Red horizontal banner ribbon behind photo
    ctx.fillStyle = '#d32029';
    ctx.fillRect(region.x - 14 * s, region.y - 16 * s, region.w + 28 * s, 20 * s);
    ctx.restore();

    // Photo card with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 20 * s;
    ctx.shadowOffsetY = 8 * s;
    D.roundedRectPath(ctx, region.x, region.y, region.w, region.h, region.radius);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.restore();

    drawPhotoOrPlaceholder(c, region, '#0b4d2c');

    // Photo border
    ctx.strokeStyle = '#0b4d2c';
    ctx.lineWidth = Math.max(1, 3.5 * s);
    D.roundedRectPath(ctx, region.x, region.y, region.w, region.h, region.radius);
    ctx.stroke();

    // Right Column — Typography
    const rightX = region.x + region.w + 36 * s;
    const rightW = W - rightX - 44 * s;

    // "HAPPY BIRTHDAY" in bold stacked crimson
    ctx.save();
    ctx.fillStyle = '#c1121f';
    ctx.font = `900 ${64 * s}px ${D.FONTS.sans}`;
    ctx.textAlign = 'left';
    ctx.fillText('HAPPY', rightX, region.y + 64 * s);
    ctx.fillText('BIRTHDAY', rightX, region.y + 130 * s);

    // Celebrant Name in large golden-orange
    const nameFit = D.fitTextLines(ctx, st.name.trim() || 'Celebrant Name', {
      size: 56 * s,
      maxW: rightW,
      maxLines: 2,
      font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.15,
    });
    ctx.fillStyle = '#ea580c';
    let ny = region.y + 205 * s;
    for (const line of nameFit.lines) {
      ctx.fillText(line, rightX, ny);
      ny += nameFit.lineH;
    }

    // Role badge
    if (st.title.trim()) {
      const rw = Math.min(rightW, ctx.measureText(st.title.trim().toUpperCase()).width + 24 * s);
      D.roundedRectPath(ctx, rightX, ny + 10 * s, rw, 28 * s, 6 * s);
      ctx.fillStyle = '#0b4d2c';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${13 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.title.trim().toUpperCase(), rightX + 12 * s, ny + 29 * s);
      ny += 46 * s;
    }

    // Wish / Quote Box
    const wishText = `“${(st.message.trim() || 'MANY MORE YEARS TO CELEBRATE').toUpperCase()}”`;
    const wishFit = D.fitTextLines(ctx, wishText, {
      size: 22 * s,
      maxW: rightW - 24 * s,
      maxLines: 3,
      font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.3,
    });
    D.roundedRectPath(ctx, rightX, ny + 14 * s, rightW, wishFit.lines.length * wishFit.lineH + 24 * s, 10 * s);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = `700 ${wishFit.size}px ${D.FONTS.sans}`;
    let wy = ny + 14 * s + wishFit.size + 4 * s;
    for (const line of wishFit.lines) {
      ctx.fillText(line, rightX + 12 * s, wy);
      wy += wishFit.lineH;
    }
    ctx.restore();

    // Footer Attribution: "From CYON ST DOMINIC PARISH FEGGE ONITSHA"
    const parishText = st.parish.trim() || 'CYON ST DOMINIC PARISH FEGGE ONITSHA';
    const footY = H - 64 * s;
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(48 * s, footY - 18 * s);
    ctx.lineTo(W - 48 * s, footY - 18 * s);
    ctx.stroke();

    ctx.font = `700 ${30 * s}px ${D.FONTS.script}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText('From ', 48 * s, footY + 18 * s);
    const fromW = ctx.measureText('From ').width;

    ctx.font = `800 ${22 * s}px ${D.FONTS.sans}`;
    ctx.fillStyle = '#0b4d2c';
    ctx.fillText(parishText.toUpperCase(), 48 * s + fromW, footY + 16 * s);

    if (st.pro.trim()) {
      ctx.font = `600 ${15 * s}px ${D.FONTS.sans}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(st.pro.trim(), 48 * s, footY + 44 * s);
    }
    ctx.restore();

    // Festive baubles in bottom right
    ctx.save();
    const bx = W - 90 * s;
    const by = H - 90 * s;
    ctx.fillStyle = '#e8c36a';
    ctx.beginPath();
    ctx.arc(bx, by, 34 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.arc(bx + 40 * s, by + 20 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Cathedral Regal (Awka Diocese / St. Thomas Aquinas Style)
 * ------------------------------------------------------------------ */

const awkaDioceseTemplate: FlyerTemplate = {
  id: 'awka-cathedral',
  name: 'Cathedral Regal (Awka Style)',
  blurb: 'Inspired by CYON Awka: liturgical green and gold filigree, calligraphic headline, and prayer plaque.',
  category: 'official',
  badge: 'LITURGICAL',
  usesTheme: false,
  colors: ['#0b4d2c', '#f3c14a', '#ffffff'],
  photoRegion: (W, H, s) => ({
    x: W * 0.25,
    y: H * 0.13,
    w: W * 0.5,
    h: H * 0.42,
    radius: 20 * s,
  }),
  draw: (c) => {
    const { ctx, W, H, s, st, logo } = c;
    const region = awkaDioceseTemplate.photoRegion(W, H, s);

    // Pristine white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Triple Liturgical Border: Green + Gold + Inset Filigree
    const inset = 24 * s;
    D.roundedRectPath(ctx, inset, inset, W - inset * 2, H - inset * 2, 16 * s);
    ctx.strokeStyle = '#0b4d2c';
    ctx.lineWidth = Math.max(1, 4 * s);
    ctx.stroke();

    D.roundedRectPath(ctx, inset + 8 * s, inset + 8 * s, W - (inset + 8 * s) * 2, H - (inset + 8 * s) * 2, 12 * s);
    ctx.strokeStyle = '#f3c14a';
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.stroke();

    // Top CYON & Catholic Badges (Movable logo anywhere on the flyer)
    D.drawMovableLogo(ctx, W, H, s, st, logo, '#0b4d2c', '#f3c14a', 'tl');

    // Top Right Cross Icon
    if (st.logoPos !== 'tr') {
      D.drawCross(ctx, W - 72 * s, 68 * s, 32 * s, '#f3c14a');
    }

    // Header Title: "CYON [PARISH] Wishes You"
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b4d2c';
    ctx.font = `800 ${22 * s}px ${D.FONTS.sans}`;
    const parishHeader = `CYON ${st.parish.trim() || 'ST. THOMAS AQUINAS PARISH, AWKA'}`.toUpperCase();
    ctx.fillText(parishHeader, W / 2, 60 * s);
    ctx.font = `600 italic ${20 * s}px ${D.FONTS.display}`;
    ctx.fillStyle = '#073d22';
    ctx.fillText('Wishes You', W / 2, 88 * s);
    ctx.restore();

    // Photo Card (Centered Hero with drop shadow and gold border)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 24 * s;
    ctx.shadowOffsetY = 8 * s;
    D.roundedRectPath(ctx, region.x, region.y, region.w, region.h, region.radius);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.restore();

    drawPhotoOrPlaceholder(c, region, '#0b4d2c');

    ctx.strokeStyle = '#f3c14a';
    ctx.lineWidth = Math.max(1, 3.5 * s);
    D.roundedRectPath(ctx, region.x, region.y, region.w, region.h, region.radius);
    ctx.stroke();

    // "Happy Birthday" in Grand Calligraphy + Serif
    const bdayY = region.y + region.h + 46 * s;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b4d2c';
    ctx.font = `700 ${56 * s}px ${D.FONTS.script}`;
    ctx.fillText('Happy', W / 2, bdayY);

    ctx.font = `900 ${68 * s}px ${D.FONTS.sans}`;
    ctx.fillText('Birthday', W / 2, bdayY + 60 * s);

    // Golden leaf flourishes on either side
    D.drawLaurelWreath(ctx, W / 2, bdayY + 30 * s, W * 0.32, 40 * s, s, '#f3c14a');
    ctx.restore();

    // Celebrant Plaque (Green Ribbon with Gold Trim)
    const plaqueY = bdayY + 95 * s;
    const plaqueW = W * 0.78;
    const plaqueH = 68 * s;
    const plaqueX = (W - plaqueW) / 2;

    D.roundedRectPath(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 12 * s);
    ctx.fillStyle = '#073d22';
    ctx.fill();
    ctx.strokeStyle = '#f3c14a';
    ctx.lineWidth = Math.max(1, 2.5 * s);
    ctx.stroke();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${28 * s}px ${D.FONTS.sans}`;
    ctx.fillText(st.name.trim() || 'Celebrant Name', W / 2, plaqueY + 32 * s);

    if (st.title.trim()) {
      ctx.fillStyle = '#f3c14a';
      ctx.font = `700 ${18 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.title.trim().toUpperCase(), W / 2, plaqueY + 56 * s);
    }
    ctx.restore();

    // Catholic Birthday Prayer Text
    const prayerY = plaqueY + plaqueH + 28 * s;
    ctx.save();
    ctx.textAlign = 'center';
    const prayerText =
      st.message.trim() ||
      'May God, the Good Shepherd, continue to guide you, give you sound health, strength and joy, and keep you fruitful in your mission.';
    const prayerFit = D.fitTextLines(ctx, prayerText, {
      size: 19 * s,
      maxW: W * 0.76,
      maxLines: 4,
      font: (sz) => `italic 500 ${sz}px ${D.FONTS.display}`,
      lineHeight: 1.35,
    });
    ctx.fillStyle = '#1e293b';
    ctx.font = `italic 500 ${prayerFit.size}px ${D.FONTS.display}`;
    let py = prayerY + prayerFit.size;
    for (const line of prayerFit.lines) {
      ctx.fillText(line, W / 2, py);
      py += prayerFit.lineH;
    }

    if (st.pro.trim()) {
      ctx.font = `700 ${16 * s}px ${D.FONTS.sans}`;
      ctx.fillStyle = '#0b4d2c';
      ctx.fillText(st.pro.trim(), W / 2, py + 18 * s);
    }
    ctx.restore();

    // Bottom Social handles watermark
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `600 ${13 * s}px ${D.FONTS.sans}`;
    ctx.fillStyle = '#64748b';
    const cleanHandle = (st.parish || 'nigeria').toLowerCase().replace(/[^a-z0-9]/g, '');
    const handle = `@cyon_${cleanHandle || 'youth'}`;
    ctx.fillText(handle, W / 2, H - 36 * s);
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Royal Sovereign Gold & Navy (Luxury Cathedral Arch Style)
 * ------------------------------------------------------------------ */

const royalGoldTemplate: FlyerTemplate = {
  id: 'royal-gold',
  name: 'Royal Sovereign Gold',
  blurb: 'Majestic cathedral arch with gold double foil, royal midnight velvet backdrop, and golden celebration seal.',
  category: 'luxury',
  badge: 'POPULAR',
  usesTheme: false,
  colors: ['#071224', '#f3c14a', '#ffffff'],
  photoRegion: (W, H) => ({
    x: W * 0.24,
    y: H * 0.16,
    w: W * 0.52,
    h: Math.min(H * 0.44, W * 0.68),
    radius: W * 0.26,
  }),
  draw: (c) => {
    const { ctx, W, H, s, st, logo } = c;
    const region = royalGoldTemplate.photoRegion(W, H, s);

    // Deep royal midnight velvet gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#060d1b');
    bg.addColorStop(0.5, '#0b162c');
    bg.addColorStop(1, '#040810');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Floating gold bokeh & dust
    D.drawGoldDust(ctx, W, H, s, 0.65);

    // Double Gold Frame Border with Corner Stars
    const inset = 26 * s;
    D.roundedRectPath(ctx, inset, inset, W - inset * 2, H - inset * 2, 20 * s);
    ctx.strokeStyle = '#f3c14a';
    ctx.lineWidth = Math.max(1, 3 * s);
    ctx.stroke();

    D.roundedRectPath(ctx, inset + 8 * s, inset + 8 * s, W - (inset + 8 * s) * 2, H - (inset + 8 * s) * 2, 14 * s);
    ctx.strokeStyle = 'rgba(243, 193, 74, 0.35)';
    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.stroke();

    D.star4(ctx, inset + 8 * s, inset + 8 * s, 8 * s);
    D.star4(ctx, W - inset - 8 * s, inset + 8 * s, 8 * s);
    D.star4(ctx, inset + 8 * s, H - inset - 8 * s, 8 * s);
    D.star4(ctx, W - inset - 8 * s, H - inset - 8 * s, 8 * s);

    // Top CYON Banner & Movable Logo
    D.drawMovableLogo(ctx, W, H, s, st, logo, '#071224', '#f3c14a', 'tc');

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${18 * s}px ${D.FONTS.sans}`;
    ctx.fillText('CATHOLIC YOUTH ORGANISATION OF NIGERIA', W / 2, 58 * s);
    if (st.parish.trim()) {
      ctx.fillStyle = '#f3c14a';
      ctx.font = `700 ${16 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.parish.trim().toUpperCase(), W / 2, 84 * s);
    }
    ctx.restore();

    // Cathedral Arch Photo Frame
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30 * s;
    ctx.shadowOffsetY = 12 * s;
    D.archPath(ctx, region.x, region.y, region.w, region.h);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.restore();

    if (c.img) {
      D.drawArchPhotoRegion(ctx, region.x, region.y, region.w, region.h, st, c.img, s);
    } else {
      drawPhotoOrPlaceholder(c, region, '#f3c14a');
    }

    // Dual Gold Foil Arch Border
    D.archPath(ctx, region.x, region.y, region.w, region.h);
    ctx.strokeStyle = '#f3c14a';
    ctx.lineWidth = Math.max(1, 4 * s);
    ctx.stroke();

    D.archPath(ctx, region.x + 8 * s, region.y + 8 * s, region.w - 16 * s, region.h - 16 * s);
    ctx.strokeStyle = 'rgba(255, 235, 170, 0.7)';
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.stroke();

    // Golden Age Seal (+1 Today / Age)
    if (st.showAgeBadge) {
      const sealX = region.x + region.w - 12 * s;
      const sealY = region.y + region.h - 20 * s;
      D.drawAgeSeal(ctx, sealX, sealY, 42 * s, st.ageBadgeText || '+1 TODAY', s, '#f3c14a', '#060d1b');
    }

    // "Happy Birthday" in Playfair Display with Gold Shine
    const textStartY = region.y + region.h + 44 * s;
    ctx.save();
    ctx.textAlign = 'center';
    const goldGrad = ctx.createLinearGradient(0, textStartY, 0, textStartY + 60 * s);
    goldGrad.addColorStop(0, '#ffffff');
    goldGrad.addColorStop(0.4, '#ffe699');
    goldGrad.addColorStop(1, '#e8c36a');
    ctx.fillStyle = goldGrad;
    ctx.font = `900 ${52 * s}px ${D.FONTS.display}`;
    ctx.fillText('HAPPY BIRTHDAY', W / 2, textStartY + 40 * s);

    // Celebrant Name
    const nameFit = D.fitTextLines(ctx, st.name.trim() || 'Celebrant Name', {
      size: 60 * s,
      maxW: W * 0.82,
      maxLines: 2,
      font: (sz) => `800 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.15,
    });
    ctx.fillStyle = '#ffffff';
    let ny = textStartY + 105 * s;
    for (const line of nameFit.lines) {
      ctx.fillText(line, W / 2, ny);
      ny += nameFit.lineH;
    }

    // Role / Office in Gold Ribbon Plaque
    if (st.title.trim()) {
      const rw = Math.min(W * 0.7, ctx.measureText(st.title.trim().toUpperCase()).width + 36 * s);
      D.roundedRectPath(ctx, (W - rw) / 2, ny + 8 * s, rw, 32 * s, 16 * s);
      ctx.fillStyle = 'rgba(243, 193, 74, 0.15)';
      ctx.fill();
      ctx.strokeStyle = '#f3c14a';
      ctx.lineWidth = Math.max(1, 1.8 * s);
      ctx.stroke();

      ctx.fillStyle = '#f3c14a';
      ctx.font = `800 ${15 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.title.trim().toUpperCase(), W / 2, ny + 30 * s);
      ny += 54 * s;
    }

    // Birthday Message
    const prayerText =
      st.message.trim() ||
      'May the Almighty God grant you divine wisdom, sound health, and boundless joy in this new age. Congratulations!';
    const prayerFit = D.fitTextLines(ctx, prayerText, {
      size: 19 * s,
      maxW: W * 0.78,
      maxLines: 3,
      font: (sz) => `500 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.38,
    });
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `500 ${prayerFit.size}px ${D.FONTS.sans}`;
    let my = ny + 16 * s;
    for (const line of prayerFit.lines) {
      ctx.fillText(line, W / 2, my);
      my += prayerFit.lineH;
    }

    // Footer signature & date
    if (st.pro.trim()) {
      ctx.fillStyle = '#f3c14a';
      ctx.font = `600 ${15 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.pro.trim(), W / 2, H - 42 * s);
    }
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Sample 1: Executive Alumni Arc Template (St. Charles Style)
 * ------------------------------------------------------------------ */
const alumniArcTemplate: FlyerTemplate = {
  id: 'alumni-arc',
  name: 'Executive Alumni Arc',
  blurb: 'Executive minimalist portrait with circular right-side arc, top shadow header, metallic sparkles, and bold editorial typography.',
  category: 'official',
  usesTheme: false,
  colors: ['#ffffff', '#0f7a3f', '#1b2a4a'],
  photoRegion: (W, H, s) => {
    const size = Math.min(W * 0.58, H * 0.52);
    const x = W - size - 24 * s;
    const y = H * 0.14;
    return {
      x,
      y,
      w: size,
      h: size,
      radius: size / 2,
    };
  },
  draw: (c) => {
    const { ctx, W, H, s, st, img, logo } = c;
    const area = alumniArcTemplate.photoRegion(W, H, s);

    // 1. Crisp white/pearl background
    ctx.fillStyle = '#fafafc';
    ctx.fillRect(0, 0, W, H);

    // Top header card with soft drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 16 * s;
    ctx.shadowOffsetY = 6 * s;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 88 * s);
    ctx.restore();

    // Subtle hairline border under top header
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 88 * s);
    ctx.lineTo(W, 88 * s);
    ctx.stroke();

    // Bottom soft shadow card
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 14 * s;
    ctx.shadowOffsetY = -4 * s;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, H - 42 * s, W, 42 * s);
    ctx.restore();

    // 2. Movable primary Logo / Crest
    D.drawMovableLogo(ctx, W, H, s, st, logo, '#0b522c', '#d4af37', 'tl');

    // 3. Four-point metallic star glints (matching sample 1)
    if (st.decor) {
      D.drawFourPointStar(ctx, W * 0.48, 140 * s, 14 * s, '#7d7972');
      D.drawFourPointStar(ctx, W * 0.53, 172 * s, 8 * s, '#9e9992');
      D.drawFourPointStar(ctx, W * 0.12, H * 0.83, 16 * s, '#7d7972');
      D.drawFourPointStar(ctx, W * 0.18, H * 0.88, 10 * s, '#a8a299');
    }

    // 4. Hero Circular Photo Region with dual accent rim & drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 28 * s;
    ctx.shadowOffsetX = 4 * s;
    ctx.shadowOffsetY = 8 * s;
    ctx.beginPath();
    ctx.arc(area.x + area.w / 2, area.y + area.h / 2, area.radius + 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Render photo inside circular clipping region
    D.drawPhotoRegion(ctx, area.x, area.y, area.w, area.h, area.radius, st, img, s);

    // Sleek dual-tone circular rim (lime-gold accent matching sample 1)
    ctx.save();
    ctx.lineWidth = Math.max(1.5, 3.5 * s);
    ctx.strokeStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(area.x + area.w / 2, area.y + area.h / 2, area.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(area.x + area.w / 2, area.y + area.h / 2, area.radius - 2.5 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Left-side Typography
    const textX = 42 * s;
    const textMaxW = W * 0.42;

    // Greeting statement banner: "We the [ORGANISATION] WISH TO SAY"
    const rawOrg = (st.banner.trim() || st.parish.trim() || 'SAINT CHARLES OLD BOYS ASSOCIATION').toUpperCase();
    const orgStatement = `We the ${rawOrg} WISH TO SAY`;
    const orgFit = D.fitTextLines(ctx, orgStatement, {
      size: 14.5 * s,
      maxW: textMaxW,
      maxLines: 3,
      font: (sz) => `italic 800 ${sz}px ${D.FONTS.display}`,
      lineHeight: 1.25,
    });

    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `italic 800 ${orgFit.size}px ${D.FONTS.display}`;
    let textY = H * 0.31;
    for (const line of orgFit.lines) {
      ctx.fillText(line, textX, textY);
      textY += orgFit.lineH;
    }

    // Headline: "Happy" (script) + "Birthday" (high-contrast editorial serif)
    textY += 18 * s;
    ctx.fillStyle = '#262626';
    ctx.font = `italic 400 ${46 * s}px ${D.FONTS.display}`;
    ctx.fillText('Happy', textX, textY);

    textY += 56 * s;
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `700 ${68 * s}px ${D.FONTS.display}`;
    ctx.fillText('Birthday', textX, textY);

    // Celebrant Name block
    textY += 52 * s;

    // Optional Title / Prefix (e.g. "RT.HON." or Ministry Role)
    if (st.title.trim()) {
      ctx.fillStyle = '#0a0a0a';
      ctx.font = `italic 900 ${20 * s}px ${D.FONTS.display}`;
      ctx.fillText(st.title.trim().toUpperCase(), textX, textY);
      textY += 28 * s;
    }

    // Celebrant Name
    const nameFit = D.fitTextLines(ctx, st.name.trim().toUpperCase(), {
      size: 27 * s,
      maxW: W * 0.46,
      maxLines: 2,
      font: (sz) => `italic 900 ${sz}px ${D.FONTS.display}`,
      lineHeight: 1.18,
    });
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `italic 900 ${nameFit.size}px ${D.FONTS.display}`;
    for (const line of nameFit.lines) {
      ctx.fillText(line, textX, textY);
      textY += nameFit.lineH;
    }

    // Nickname / alias in parenthesis (e.g. "( AUSTINO )")
    const alias = st.ageBadgeText.trim() && st.ageBadgeText !== '+1 Today'
      ? `( ${st.ageBadgeText.toUpperCase()} )`
      : st.parish.trim()
      ? `( ${st.parish.toUpperCase()} )`
      : '';
    if (alias) {
      textY += 6 * s;
      ctx.fillStyle = '#111111';
      ctx.font = `italic 900 ${22 * s}px ${D.FONTS.display}`;
      ctx.fillText(alias, textX, textY);
    }

    // Optional Date
    if (st.showDate && st.date.trim()) {
      ctx.fillStyle = '#6b7280';
      ctx.font = `600 ${13 * s}px ${D.FONTS.sans}`;
      ctx.fillText(st.date.trim(), textX, H - 18 * s);
    }
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Sample 2: Polaroid Noir & Scrapbook Template (Maria Ines Style)
 * ------------------------------------------------------------------ */
const polaroidNoirTemplate: FlyerTemplate = {
  id: 'polaroid-noir',
  name: 'Polaroid Noir & Scrapbook',
  blurb: 'Aesthetic matte black scrapbook with authentic Polaroid photo card, torn deckle paper edges, scotch tape, and handwritten typography.',
  category: 'youth',
  usesTheme: false,
  colors: ['#09090b', '#f4f3ef', '#ffffff'],
  photoRegion: (W, H, s) => {
    const cardW = Math.min(W * 0.48, 480 * s);
    const cardX = 36 * s;
    const cardY = H * 0.16;
    const pad = 18 * s;
    const photoW = cardW - pad * 2;
    const photoH = photoW * 1.08;
    return {
      x: cardX + pad,
      y: cardY + pad,
      w: photoW,
      h: photoH,
      radius: 4 * s,
    };
  },
  draw: (c) => {
    const { ctx, W, H, s, st, img, logo } = c;
    const photoArea = polaroidNoirTemplate.photoRegion(W, H, s);
    const cardW = Math.min(W * 0.48, 480 * s);
    const cardX = 36 * s;
    const cardY = H * 0.16;
    const pad = 18 * s;
    const cardH = photoArea.h + pad * 2 + 76 * s;

    // 1. Deep matte obsidian black background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // 2. Layered torn paper scraps
    // Top-left kraft / parchment scrap corner (matching sample 2)
    ctx.save();
    ctx.fillStyle = '#dfdbd2';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(84 * s, 0);
    ctx.lineTo(0, 84 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e8e5dc';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(60 * s, 0);
    ctx.lineTo(0, 60 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bottom horizontal torn paper deckle edge
    D.drawTornPaperBottom(ctx, W, H, 110 * s, '#141418', '#38383e');

    // 3. Top Banner: "COURTESY : [BANNER / PARISH / PRO]"
    const courtesyOrg = (st.pro.trim() || st.banner.trim() || st.parish.trim() || 'MARIA INES 2007 SET').toUpperCase();
    const courtesyLine = `COURTESY : ${courtesyOrg}.`;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = `500 ${15 * s}px ${D.FONTS.display}`;
    D.drawSpaced(ctx, courtesyLine, 42 * s, 54 * s, 3 * s, 'left');
    ctx.restore();

    // 4. Movable Logo (defaults top-right)
    D.drawMovableLogo(ctx, W, H, s, st, logo, '#ffffff', '#f3c14a', 'tr');

    // 5. Authentic Polaroid Card on left
    ctx.save();
    // Heavy realistic drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 32 * s;
    ctx.shadowOffsetX = 6 * s;
    ctx.shadowOffsetY = 16 * s;

    // Vintage eggshell Polaroid body
    ctx.fillStyle = '#f4f3ef';
    D.roundedRectPath(ctx, cardX, cardY, cardW, cardH, 6 * s);
    ctx.fill();
    ctx.restore();

    // Inset photo border / matting
    ctx.save();
    ctx.strokeStyle = '#e0ded8';
    ctx.lineWidth = 1;
    ctx.strokeRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
    ctx.restore();

    // Render photo inside Polaroid photo window
    D.drawPhotoRegion(ctx, photoArea.x, photoArea.y, photoArea.w, photoArea.h, photoArea.radius, st, img, s);

    // Celebrant name on Polaroid chin
    ctx.save();
    const chinName = st.name.trim().split(' ')[0] || st.name.trim() || 'CELEBRANT';
    const chinFit = D.fitTrackedLines(ctx, chinName.toUpperCase(), {
      size: 24 * s,
      maxW: cardW - 32 * s,
      maxLines: 1,
      spacing: 2.5 * s,
      font: (sz) => `700 ${sz}px ${D.FONTS.display}`,
      lineHeight: 1,
    });
    ctx.fillStyle = '#111111';
    ctx.font = `700 ${chinFit.size}px ${D.FONTS.display}`;
    D.drawSpaced(
      ctx,
      chinFit.lines[0],
      cardX + pad,
      cardY + photoArea.h + pad + 48 * s,
      2.5 * s,
      'left',
    );
    ctx.restore();

    // Semi-transparent frosted scotch tape on bottom-left corner of Polaroid
    D.drawTapeStrip(ctx, cardX + 16 * s, cardY + cardH - 12 * s, 68 * s, 22 * s, -0.16);

    // Date below Polaroid (e.g. "3RD MAY")
    if (st.showDate && st.date.trim()) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${26 * s}px ${D.FONTS.display}`;
      const rawDate = st.date.trim().toUpperCase();
      ctx.fillText(rawDate, cardX + 4 * s, cardY + cardH + 46 * s);
      ctx.restore();
    }

    // 6. Right-side Typography
    const rightX = W * 0.56;
    const rightMaxW = W * 0.38;

    // Handwritten "Happy"
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = `italic 700 ${52 * s}px ${D.FONTS.handwritten}`;
    let rightY = H * 0.28;
    ctx.fillText('Happy', rightX, rightY);

    // Signature brush script "Birthday"
    rightY += 72 * s;
    ctx.font = `italic 700 ${88 * s}px ${D.FONTS.handwritten}`;
    ctx.fillText('Birthday', rightX, rightY);
    ctx.restore();

    // Editorial Wish / Prayer Box (tracked uppercase modern block)
    const quoteText =
      st.message.trim() ||
      'MAY YOU HAVE ALL THE JOY YOUR HEART CAN HOLD. WE WISH YOU THE HAPPIEST AND BRIGHTEST DAY EVER!';
    const quoteFit = D.fitTrackedLines(ctx, quoteText.toUpperCase(), {
      size: 13.5 * s,
      maxW: rightMaxW,
      maxLines: 7,
      spacing: 1.8 * s,
      font: (sz) => `700 ${sz}px ${D.FONTS.sans}`,
      lineHeight: 1.55,
    });

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${quoteFit.size}px ${D.FONTS.sans}`;
    let qy = rightY + 54 * s;
    for (const line of quoteFit.lines) {
      D.drawSpaced(ctx, line, rightX, qy, 1.8 * s, 'left');
      qy += quoteFit.lineH;
    }
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ *
 * Registry + dispatcher
 * ------------------------------------------------------------------ */

export const TEMPLATES: FlyerTemplate[] = [
  deaneryTemplate('deanery', 'Deanery Green (Uyo Flagship)', {
    main: '#0f7a3f',
    dark: '#0a5c33',
    deep: '#073d22',
    gold: '#f3c14a',
    orange: '#f39c2e',
    pill: '#d32029',
    pattern: '#0f7a3f',
  }),
  deaneryTemplate('deanery-blue', 'Deanery Blue Edition', {
    main: '#1565c0',
    dark: '#0d47a1',
    deep: '#072c5e',
    gold: '#f3c14a',
    orange: '#00a3e0',
    pill: '#d32029',
    pattern: '#1565c0',
  }),
  alumniArcTemplate,
  polaroidNoirTemplate,
  royalGoldTemplate,
  awkaDioceseTemplate,
  onitshaFeggeTemplate,
  heraldTemplate,
  minimalTemplate,
  classicTemplate,
  spotlightTemplate,
  galleryTemplate,
];

export function getTemplate(id: string): FlyerTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? classicTemplate;
}

/** Renders a complete flyer for the selected template. */
export function drawFlyer(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  st: FlyerState,
  img: HTMLImageElement | null,
  logo: HTMLImageElement | null = null,
): void {
  const tpl = getTemplate(st.template);
  const s = W / D.BASE_W;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  tpl.draw({ ctx, W, H, s, theme: getTheme(st.themeId), st, img, logo });
  ctx.restore();
}
