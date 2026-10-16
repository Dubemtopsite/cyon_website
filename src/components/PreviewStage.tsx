import { useCallback, useEffect, useRef, useState } from 'react';
import { ASPECTS, type FlyerImage, type FlyerState } from '../types';
import { BASE_W, clampTransform, computeLogoBox, defaultTransform, zoomAt } from '../lib/draw';
import { drawFlyer, getTemplate } from '../lib/templates';
import { IconUpload } from './ui';

interface Props {
  st: FlyerState;
  patch: (p: Partial<FlyerState>) => void;
  image: FlyerImage | null;
  logo: FlyerImage | null;
  onFile: (file: File | null | undefined) => void;
  onLoadSample?: () => void;
  fontsReady: boolean;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function PreviewStage({ st, patch, image, logo, onFile, onLoadSample, fontsReady }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const dragModeRef = useRef<'photo' | 'logo' | null>(null);
  const stRef = useRef(st);
  stRef.current = st;
  const imageRef = useRef(image);
  imageRef.current = image;
  /** Photo slot of the current template, in preview CSS pixels. */
  const regionRef = useRef<Rect>({ x: 0, y: 0, w: 1, h: 1 });
  const logoBoxRef = useRef<Rect>({ x: 0, y: 0, w: 1, h: 1 });

  const [box, setBox] = useState({ w: 640, h: 720 });
  const [dropActive, setDropActive] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setBox({ w: rect.width, h: rect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const def = ASPECTS[st.aspect];
  const tpl = getTemplate(st.template);
  const pad = 28;
  const fit = Math.min((box.w - pad) / def.w, (box.h - pad) / def.h);
  const cssW = Math.max(80, Math.floor(def.w * fit));
  const cssH = Math.max(80, Math.floor(def.h * fit));

  // design units -> preview CSS pixels
  const scaleCss = cssW / def.w;
  const designRegion = tpl.photoRegion(def.w, def.h, def.w / BASE_W);
  const region: Rect = {
    x: designRegion.x * scaleCss,
    y: designRegion.y * scaleCss,
    w: Math.max(8, designRegion.w * scaleCss),
    h: Math.max(8, designRegion.h * scaleCss),
  };
  regionRef.current = region;

  const defaultLogoPos = tpl.id === 'deanery' || tpl.id === 'deanery-blue' ? 'tl' : 'tc';
  const designLogoBox = computeLogoBox(def.w, def.h, def.w / BASE_W, st, logo?.img ?? null, defaultLogoPos);
  const logoBoxCss: Rect = {
    x: designLogoBox.x * scaleCss,
    y: designLogoBox.y * scaleCss,
    w: designLogoBox.w * scaleCss,
    h: designLogoBox.h * scaleCss,
  };
  logoBoxRef.current = logoBoxCss;

  const isPointInLogo = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const r = canvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const b = logoBoxRef.current;
    const touchPad = 12;
    return px >= b.x - touchPad && px <= b.x + b.w + touchPad && py >= b.y - touchPad && py <= b.y + b.h + touchPad;
  };

  /* render */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssW < 20 || cssH < 20) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFlyer(ctx, pw, ph, st, image?.img ?? null, logo?.img ?? null);
  }, [st, image, logo, fontsReady, cssW, cssH]);

  /* wheel zoom around the cursor, scoped to the photo slot */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      const img = imageRef.current;
      if (!img) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const reg = regionRef.current;
      const rw = Math.max(1, reg.w);
      const rh = Math.max(1, reg.h);
      const cx = (e.clientX - rect.left - reg.x) / rw;
      const cy = (e.clientY - rect.top - reg.y) / rh;
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const cur = stRef.current;
      const transform = zoomAt(
        cur.transform,
        factor,
        cx,
        cy,
        img.img.naturalWidth,
        img.img.naturalHeight,
        rw,
        rh,
        cur.fitMode,
      );
      stRef.current = { ...cur, transform };
      patch({ transform });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [patch]);

  const startPan = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPointInLogo(e.clientX, e.clientY)) {
      dragModeRef.current = 'logo';
      setIsDraggingLogo(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      return;
    }
    if (!imageRef.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer; pan still works */
    }
    dragModeRef.current = 'photo';
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const movePan = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragModeRef.current === 'logo') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        const curW = r.width || cssW;
        const curH = r.height || cssH;
        const nx = Math.max(0.04, Math.min(0.96, px / curW));
        const ny = Math.max(0.04, Math.min(0.96, py / curH));
        patch({ logoPos: 'free', logoX: nx, logoY: ny });
        return;
      }

      if (!dragModeRef.current) {
        setIsHoveringLogo(isPointInLogo(e.clientX, e.clientY));
      }

      if (dragModeRef.current === 'photo') {
        const img = imageRef.current;
        const drag = dragRef.current;
        if (!img || !drag) return;
        const reg = regionRef.current;
        const rw = Math.max(1, reg.w);
        const rh = Math.max(1, reg.h);
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        dragRef.current = { x: e.clientX, y: e.clientY };
        const t = stRef.current.transform;
        const transform = clampTransform(
          { ...t, ox: t.ox + dx / rw, oy: t.oy + dy / rh },
          img.img.naturalWidth,
          img.img.naturalHeight,
          rw,
          rh,
          stRef.current.fitMode,
        );
        stRef.current = { ...stRef.current, transform };
        patch({ transform });
      }
    },
    [patch, cssW, cssH],
  );

  const endPan = useCallback(() => {
    dragModeRef.current = null;
    dragRef.current = null;
    setIsDraggingLogo(false);
  }, []);

  const zoomSlider = Math.round(st.transform.zoom * 100);
  const compactEmpty = region.h < 260 || region.w < 240;

  return (
    <div className="order-1 flex min-h-0 flex-col bg-[radial-gradient(1200px_600px_at_50%_-10%,#10203c_0%,#070b16_60%)] lg:order-2">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-[#0a1122] p-1">
          {(Object.keys(ASPECTS) as Array<keyof typeof ASPECTS>).map((id) => {
            const a = ASPECTS[id];
            const active = st.aspect === id;
            return (
              <button
                key={id}
                type="button"
                title={a.hint}
                onClick={() => patch({ aspect: id })}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#e8c36a] text-[#0b1b33] shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-slate-700/70 bg-[#0a1122] px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 sm:inline-block">
            {tpl.name} template
          </span>
          <div className="flex w-40 items-center gap-2 rounded-lg border border-slate-700/70 bg-[#0a1122] px-3 py-1.5 sm:w-52">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Zoom
            </span>
            <input
              type="range"
              min={st.fitMode === 'fit' ? 35 : 100}
              max={400}
              value={zoomSlider}
              disabled={!image}
              aria-label="Photo zoom"
              onChange={(e) => {
                if (!image) return;
                const reg = regionRef.current;
                const transform = zoomAt(
                  st.transform,
                  Number(e.target.value) / 100 / st.transform.zoom,
                  0.5,
                  0.5,
                  image.img.naturalWidth,
                  image.img.naturalHeight,
                  Math.max(1, reg.w),
                  Math.max(1, reg.h),
                  st.fitMode,
                );
                stRef.current = { ...stRef.current, transform };
                patch({ transform });
              }}
              className="!h-1"
            />
            <span className="w-9 text-right text-[10px] font-semibold tabular-nums text-[#e8c36a]">
              {zoomSlider}%
            </span>
          </div>
          <button
            type="button"
            disabled={!image}
            onClick={() => patch({ transform: defaultTransform() })}
            className="rounded-lg border border-slate-700/70 bg-[#0a1122] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-40"
            title="Re-fit the photo to the slot"
          >
            Fit
          </button>
        </div>
      </div>

      {/* canvas area */}
      <div
        ref={wrapRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropActive(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className="relative flex min-h-[340px] sm:min-h-[440px] flex-1 items-center justify-center overflow-hidden p-3 sm:p-4 lg:min-h-0"
      >
        <div
          className="relative shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
          style={{ width: cssW, height: cssH }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: cssW, height: cssH, touchAction: 'none' }}
            className={`block ${
              isDraggingLogo || isHoveringLogo
                ? 'cursor-move'
                : image
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-default'
            }`}
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onPointerLeave={() => {
              if (!dragModeRef.current) setIsHoveringLogo(false);
            }}
            onDoubleClick={() => image && patch({ transform: defaultTransform() })}
          />

          {/* movable logo bounding highlight */}
          <div
            className={`pointer-events-none absolute transition-all duration-150 ${
              isDraggingLogo
                ? 'rounded-xl border-2 border-[#e8c36a] bg-[#e8c36a]/15 shadow-[0_0_20px_rgba(232,195,106,0.35)] ring-2 ring-[#e8c36a]/40'
                : isHoveringLogo
                ? 'rounded-xl border-2 border-[#e8c36a]/90 bg-[#e8c36a]/10 ring-1 ring-[#e8c36a]/30'
                : st.logoPos === 'free'
                ? 'rounded-xl border border-dashed border-[#e8c36a]/30'
                : 'opacity-0'
            }`}
            style={{
              left: Math.max(0, logoBoxCss.x - 4),
              top: Math.max(0, logoBoxCss.y - 4),
              width: logoBoxCss.w + 8,
              height: logoBoxCss.h + 8,
            }}
          >
            {(isHoveringLogo || isDraggingLogo) && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#070e1c]/95 px-2.5 py-0.5 text-[10px] font-bold text-[#e8c36a] shadow ring-1 ring-[#e8c36a]/40 backdrop-blur-sm">
                ✥ Move CYON Logo
              </div>
            )}
          </div>

          {/* empty state — sits exactly on the template's photo slot */}
          {!image ? (
            <div
              className="absolute flex items-center justify-center p-3"
              style={{ left: region.x, top: region.y, width: region.w, height: region.h }}
            >
              <div
                className={`overflow-hidden rounded-2xl border border-dashed border-slate-400/80 bg-black/60 text-center backdrop-blur-sm ${
                  compactEmpty ? 'px-3 py-3' : 'max-w-[300px] px-6 py-7'
                }`}
              >
                <div
                  className={`mx-auto flex items-center justify-center rounded-full bg-[#e8c36a]/20 text-[#e8c36a] ${
                    compactEmpty ? 'mb-2 h-9 w-9' : 'mb-3 h-12 w-12'
                  }`}
                >
                  <IconUpload className={compactEmpty ? 'h-4 w-4' : 'h-6 w-6'} />
                </div>
                <p className={`font-bold text-white ${compactEmpty ? 'text-xs' : 'text-sm'}`}>
                  Upload the celebrant's photo
                </p>
                {!compactEmpty ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                    Drop an image here or use step 1. You can adjust how it fits afterwards.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`rounded-lg bg-gradient-to-b from-[#f2d491] to-[#e8c36a] font-bold text-[#0b1b33] shadow-lg shadow-[#e8c36a]/20 transition hover:brightness-105 ${
                    compactEmpty ? 'mt-2 px-3 py-1.5 text-[10px]' : 'mt-4 px-4 py-2 text-xs'
                  }`}
                >
                  Choose photo
                </button>
                {onLoadSample ? (
                  <button
                    type="button"
                    onClick={onLoadSample}
                    className={`block mx-auto text-slate-300 hover:text-white underline font-medium transition ${
                      compactEmpty ? 'mt-1 text-[9px]' : 'mt-2 text-[11px]'
                    }`}
                  >
                    Or try sample celebrant photo
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {dropActive ? (
            <div className="pointer-events-none absolute inset-0 rounded-sm border-2 border-[#e8c36a] bg-[#e8c36a]/15" />
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {/* footer tip */}
      <div className="border-t border-slate-800/70 px-4 py-2.5 text-center text-[11px] text-slate-400">
        <span className="text-[#e8c36a] font-semibold">✥ Drag Logo</span> anywhere on flyer ·{' '}
        {image ? (
          <>
            <span className="text-slate-200 font-semibold">Drag Photo</span> inside frame ·{' '}
            <span className="text-slate-200 font-semibold">Scroll</span> to zoom ·{' '}
            <span className="text-slate-200 font-semibold">Double-click</span> to re-fit
          </>
        ) : (
          <span>Upload photo to adjust frame & zoom</span>
        )}
      </div>
    </div>
  );
}
