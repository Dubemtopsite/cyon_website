import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import ControlPanel, { type Busy } from './components/ControlPanel';
import PreviewStage from './components/PreviewStage';
import { ASPECTS, type AspectId, type FlyerImage, type FlyerState } from './types';
import { clearDraft, loadDraft, saveDraft } from './lib/storage';
import { loadImage, processFile, rotateImage } from './lib/image';
import { ensureFonts } from './lib/fonts';
import { defaultTransform } from './lib/draw';
import { drawFlyer } from './lib/templates';
import {
  buildWhatsAppWish,
  canvasToBlob,
  copyBlobToClipboard,
  downloadBlob,
  flyerFilename,
  renderFlyer,
  shareFlyer,
  whatsappUrl,
} from './lib/export';
import { getSampleCelebrantDataUrl } from './data/sampleCelebrant';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function todayLabel(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function defaultState(): FlyerState {
  return {
    template: 'deanery',
    fitMode: 'cover',
    logoPos: 'tc',
    logoScale: 1,
    logoX: 0.5,
    logoY: 0.045,
    headline: 'Happy Birthday',
    headlineStyle: 'caps',
    name: 'Blessing Chidinma Eze',
    age: '21',
    showAgeBadge: true,
    ageBadgeText: '+1 Today',
    title: 'Parish President',
    parish: "St. Patrick Parish, Afaha Inang",
    banner: 'Uyo Deanery',
    date: todayLabel(),
    showDate: true,
    message:
      'May the Almighty God grant you divine wisdom, sound health, and boundless joy in this new age. Congratulations and happy celebrations!',
    pro: 'Courtesy: Catholic Youth Organisation of Nigeria (CYON) Uyo Deanery',
    decor: true,
    showBalloons: true,
    showCross: true,
    themeId: 'royal-navy',
    aspect: 'portrait',
    transform: defaultTransform(),
    filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, wash: 18 },
  };
}

function initialState(): FlyerState {
  const base = defaultState();
  const draft = loadDraft();
  if (!draft?.state) return base;
  const merged: FlyerState = { ...base, ...draft.state };
  if (!ASPECTS[merged.aspect as AspectId]) merged.aspect = base.aspect;
  if (merged.headlineStyle !== 'caps' && merged.headlineStyle !== 'script') {
    merged.headlineStyle = base.headlineStyle;
  }
  merged.showAgeBadge = merged.showAgeBadge ?? true;
  merged.ageBadgeText = merged.ageBadgeText ?? '+1 Today';
  merged.showBalloons = merged.showBalloons ?? true;
  merged.showCross = merged.showCross ?? true;
  merged.logoX = typeof merged.logoX === 'number' ? merged.logoX : 0.5;
  merged.logoY = typeof merged.logoY === 'number' ? merged.logoY : 0.045;
  merged.transform = {
    ...base.transform,
    ...(merged.transform ?? {}),
  };
  merged.filters = { ...base.filters, ...(merged.filters ?? {}) };
  return merged;
}

export default function App() {
  const [st, setSt] = useState<FlyerState>(initialState);
  const [image, setImage] = useState<FlyerImage | null>(null);
  const [logo, setLogo] = useState<FlyerImage | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [exportScale, setExportScale] = useState<1 | 2>(1);
  const toastTimer = useRef<number | undefined>(undefined);

  const patch = useCallback((p: Partial<FlyerState>) => {
    setSt((s) => ({ ...s, ...p }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  /* restore draft photo + make sure canvas fonts are loaded before first draw */
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.dataUrl) {
      loadImage(draft.dataUrl)
        .then((img) => setImage({ dataUrl: draft.dataUrl as string, img }))
        .catch(() => undefined);
    } else {
      // Auto-load sample celebrant on first launch so the canvas is full of life!
      const sampleUrl = getSampleCelebrantDataUrl();
      loadImage(sampleUrl)
        .then((img) => setImage({ dataUrl: sampleUrl, img }))
        .catch(() => undefined);
    }
    if (draft?.logoDataUrl) {
      loadImage(draft.logoDataUrl)
        .then((img) => setLogo({ dataUrl: draft.logoDataUrl as string, img }))
        .catch(() => undefined);
    }
    void ensureFonts().then(() => setFontsReady(true));
  }, []);

  /* autosave draft */
  useEffect(() => {
    const t = window.setTimeout(
      () => saveDraft(st, image?.dataUrl ?? null, logo?.dataUrl ?? null),
      600,
    );
    return () => window.clearTimeout(t);
  }, [st, image, logo]);

  const handleLoadSample = useCallback(async () => {
    try {
      const url = getSampleCelebrantDataUrl();
      const img = await loadImage(url);
      setImage({ dataUrl: url, img });
      setSt((s) => ({
        ...s,
        transform: defaultTransform(),
        name: 'Blessing Chidinma Eze',
        age: '21',
        showAgeBadge: true,
        ageBadgeText: '+1 Today',
        title: 'Parish President',
        parish: "St. Patrick Parish, Afaha Inang",
        banner: 'Uyo Deanery',
        pro: 'Courtesy: Catholic Youth Organisation of Nigeria (CYON) Uyo Deanery',
      }));
      showToast('Sample celebrant loaded! Ready to customize or export 🎉');
    } catch {
      showToast('Could not load sample celebrant.');
    }
  }, [showToast]);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      try {
        const processed = await processFile(file);
        setImage(processed);
        setSt((s) => ({ ...s, transform: defaultTransform() }));
        showToast('Photo added — drag it on the preview to fit the frame.');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not open that image.');
      }
    },
    [showToast],
  );

  const handleClearImage = useCallback(() => {
    setImage(null);
    showToast('Photo removed. Upload a new one when ready.');
  }, [showToast]);

  const handleLogoFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      try {
        const processed = await processFile(file);
        setLogo(processed);
        showToast('Logo added — position and size it in the Branding tab.');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not open that logo.');
      }
    },
    [showToast],
  );

  const handleClearLogo = useCallback(() => setLogo(null), []);

  const handleRotate = useCallback(async () => {
    if (!image) return;
    try {
      const next = await rotateImage(image);
      setImage(next);
      setSt((s) => ({ ...s, transform: defaultTransform() }));
      showToast('Photo rotated 90°.');
    } catch {
      showToast('Could not rotate that photo.');
    }
  }, [image, showToast]);

  const buildBlob = useCallback(async () => {
    const canvas = await renderFlyer(st, image, logo, st.aspect, exportScale);
    return canvasToBlob(canvas, format === 'png' ? 'image/png' : 'image/jpeg', 0.94);
  }, [st, image, logo, exportScale, format]);

  const handleDownload = useCallback(async () => {
    if (!image || busy) return;
    setBusy('download');
    try {
      const blob = await buildBlob();
      downloadBlob(blob, flyerFilename(st.name, format === 'png' ? 'png' : 'jpeg'));
      showToast('Flyer downloaded! Send it to the CYON group 🎉');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not generate the flyer.');
    } finally {
      setBusy(null);
    }
  }, [image, busy, buildBlob, st.name, format, showToast]);

  const handleCopy = useCallback(async () => {
    if (!image || busy) return;
    setBusy('copy');
    try {
      const blob = await buildBlob();
      const success = await copyBlobToClipboard(blob);
      if (success) {
        showToast('Flyer copied to clipboard! Paste directly into WhatsApp 📋');
      } else {
        downloadBlob(blob, flyerFilename(st.name, format === 'png' ? 'png' : 'jpeg'));
        showToast('Flyer downloaded! (Clipboard not supported in this browser)');
      }
    } catch {
      showToast('Could not copy flyer image.');
    } finally {
      setBusy(null);
    }
  }, [image, busy, buildBlob, st.name, format, showToast]);

  const handleShare = useCallback(async () => {
    if (!image || busy) return;
    setBusy('share');
    try {
      const blob = await buildBlob();
      const filename = flyerFilename(st.name, format === 'png' ? 'png' : 'jpeg');
      const text = buildWhatsAppWish(st);
      const outcome = await shareFlyer(blob, filename, text);
      if (outcome === 'shared') {
        showToast('Shared — wishes sent to WhatsApp! 🎉');
      } else if (outcome === 'downloaded') {
        showToast('Flyer saved — opening WhatsApp with celebration wishes…');
        window.open(whatsappUrl(text), '_blank', 'noopener');
      } else {
        showToast('Sharing cancelled.');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not share the flyer.');
    } finally {
      setBusy(null);
    }
  }, [image, busy, buildBlob, st, format, showToast]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Start a new flyer? This clears the photo and all details.')) return;
    clearDraft();
    setImage(null);
    setLogo(null);
    setSt(defaultState());
    setFormat('png');
    setExportScale(1);
    showToast('Fresh flyer ready — upload the next celebrant’s photo.');
  }, [showToast]);

  /* dev-only hook used by the browser smoke test */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__flyer = {
      getState: () => st,
      render: async (scale = 1) => {
        const canvas = await renderFlyer(st, image, logo, st.aspect, scale);
        const dataUrl = canvas.toDataURL('image/png');
        return { w: canvas.width, h: canvas.height, len: dataUrl.length };
      },
      /** Draw cost only (no PNG encoding) — used to check interaction smoothness. */
      drawTime: (scale = 1) => {
        const def = ASPECTS[st.aspect];
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(def.w * scale);
        canvas.height = Math.round(def.h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return -1;
        const t0 = performance.now();
        drawFlyer(ctx, canvas.width, canvas.height, st, image?.img ?? null, logo?.img ?? null);
        return +(performance.now() - t0).toFixed(2);
      },
    };
  }, [st, image, logo]);

  return (
    <div className="flex min-h-screen flex-col bg-[#070b16] text-slate-200 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <Header
        hasImage={!!image}
        busy={busy === 'download'}
        onDownload={handleDownload}
        onShare={handleShare}
        onCopy={handleCopy}
        onReset={handleReset}
        onLoadSample={handleLoadSample}
      />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[28rem_1fr] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
        <ControlPanel
          st={st}
          patch={patch}
          image={image}
          logo={logo}
          onFile={handleFile}
          onLogoFile={handleLogoFile}
          onClearLogo={handleClearLogo}
          onRotate={handleRotate}
          onClearImage={handleClearImage}
          onDownload={handleDownload}
          onShare={handleShare}
          onCopy={handleCopy}
          onLoadSample={handleLoadSample}
          busy={busy}
          format={format}
          setFormat={setFormat}
          exportScale={exportScale}
          setExportScale={setExportScale}
        />
        <PreviewStage
          st={st}
          patch={patch}
          image={image}
          logo={logo}
          onFile={handleFile}
          onLoadSample={handleLoadSample}
          fontsReady={fontsReady}
        />
      </main>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="animate-rise max-w-md rounded-xl border border-[#e8c36a]/40 bg-[#0d1424]/95 px-5 py-3 text-center text-sm font-semibold text-slate-100 shadow-2xl shadow-black/60 backdrop-blur">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
