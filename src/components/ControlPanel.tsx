import { useRef, useState } from 'react';
import { ASPECTS, type FlyerImage, type FlyerState } from '../types';
import { EXTRA_THEMES, OFFICIAL_THEMES, type Theme } from '../data/themes';
import { defaultTransform, zoomAt } from '../lib/draw';
import { TEMPLATES, getTemplate } from '../lib/templates';
import { BIRTHDAY_PRAYERS, MINISTRY_ROLES, AGE_BADGES } from '../data/prayers';
import TemplateGallery from './TemplateGallery';
import {
  Button,
  Field,
  IconBook,
  IconCheck,
  IconCopy,
  IconDownload,
  IconPalette,
  IconPhoto,
  IconRotate,
  IconShare,
  IconShield,
  IconSparkle,
  IconTemplate,
  IconTrash,
  IconUpload,
  IconUser,
  IconWhatsApp,
  Segmented,
  Slider,
  TextArea,
  Toggle,
} from './ui';

export type Busy = 'download' | 'share' | 'copy' | null;

export type ToolTab = 'templates' | 'celebrant' | 'photo' | 'wishes' | 'styles' | 'branding' | 'export';

interface Props {
  st: FlyerState;
  patch: (p: Partial<FlyerState>) => void;
  image: FlyerImage | null;
  logo: FlyerImage | null;
  onFile: (file: File | null | undefined) => void;
  onLogoFile: (file: File | null | undefined) => void;
  onClearLogo: () => void;
  onRotate: () => void;
  onClearImage: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCopy?: () => void;
  onLoadSample?: () => void;
  busy: Busy;
  format: 'png' | 'jpeg';
  setFormat: (f: 'png' | 'jpeg') => void;
  exportScale: 1 | 2;
  setExportScale: (s: 1 | 2) => void;
}

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  wash: 18,
};

const FILTER_PRESETS: Array<{ name: string; filters: typeof DEFAULT_FILTERS }> = [
  { name: 'Original', filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, wash: 0 } },
  { name: 'Radiant Gold', filters: { brightness: 108, contrast: 108, saturate: 115, grayscale: 0, wash: 18 } },
  { name: 'Studio Crisp', filters: { brightness: 105, contrast: 115, saturate: 108, grayscale: 0, wash: 0 } },
  { name: 'Warm Sunset', filters: { brightness: 104, contrast: 102, saturate: 125, grayscale: 0, wash: 24 } },
  { name: 'B&W Classic', filters: { brightness: 106, contrast: 120, saturate: 0, grayscale: 100, wash: 0 } },
];

export default function ControlPanel({
  st,
  patch,
  image,
  logo,
  onFile,
  onLogoFile,
  onClearLogo,
  onRotate,
  onClearImage,
  onDownload,
  onShare,
  onCopy,
  onLoadSample,
  busy,
  format,
  setFormat,
  exportScale,
  setExportScale,
}: Props) {
  const [activeTab, setActiveTab] = useState<ToolTab>('templates');
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const activeTemplate = getTemplate(st.template);

  const themeCard = (theme: Theme) => {
    const active = st.themeId === theme.id;
    return (
      <button
        key={theme.id}
        type="button"
        onClick={() => patch({ themeId: theme.id })}
        className={`group rounded-xl border p-2.5 text-left transition ${
          active
            ? 'border-[#e8c36a] bg-[#e8c36a]/15 ring-2 ring-[#e8c36a]/40 shadow-md shadow-[#e8c36a]/10'
            : 'border-slate-800 bg-[#070e1c] hover:border-slate-600'
        }`}
      >
        <span className="mb-2 flex gap-1.5">
          {theme.swatches.map((c) => (
            <span key={c} className="h-5 w-5 rounded-full ring-1 ring-white/20" style={{ background: c }} />
          ))}
        </span>
        <span className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold leading-tight text-slate-300">{theme.name}</span>
          {active ? <IconCheck className="h-3.5 w-3.5 shrink-0 text-[#e8c36a]" /> : null}
        </span>
      </button>
    );
  };

  const imgDims = image ? `${image.img.naturalWidth} × ${image.img.naturalHeight}px` : '';

  const navItems: Array<{ id: ToolTab; label: string; icon: React.ReactNode }> = [
    { id: 'templates', label: 'Templates', icon: <IconTemplate className="h-4 w-4" /> },
    { id: 'celebrant', label: 'Celebrant', icon: <IconUser className="h-4 w-4" /> },
    { id: 'photo', label: 'Photo Fit', icon: <IconPhoto className="h-4 w-4" /> },
    { id: 'wishes', label: 'Wishes', icon: <IconBook className="h-4 w-4" /> },
    { id: 'styles', label: 'Styles', icon: <IconPalette className="h-4 w-4" /> },
    { id: 'branding', label: 'Branding', icon: <IconShield className="h-4 w-4" /> },
    { id: 'export', label: 'Export', icon: <IconShare className="h-4 w-4" /> },
  ];

  return (
    <div className="order-2 flex min-h-0 flex-col border-slate-800 bg-[#080d1a] lg:order-1 lg:h-full lg:border-r">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={logoRef}
        type="file"
        accept="image/png,image/webp,image/svg+xml,image/*"
        className="hidden"
        onChange={(e) => {
          onLogoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* Canva Tool Rail / Tab Selector */}
      <div className="flex shrink-0 items-center overflow-x-auto border-b border-slate-800/80 bg-[#050914] px-2 py-1.5 scrollbar-none">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-[#e8c36a] text-[#071224] shadow'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {/* ---------------- 1: TEMPLATES ---------------- */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Flyer Templates
                </h2>
                <p className="text-[11px] text-slate-400">
                  Pick from official CYON Deanery and church birthday flyer designs
                </p>
              </div>
              <span className="rounded bg-[#e8c36a]/15 px-2 py-0.5 text-[10px] font-bold text-[#e8c36a]">
                {TEMPLATES.length} Designs
              </span>
            </div>

            <TemplateGallery
              st={st}
              image={image}
              logo={logo}
              onSelect={(id) => patch({ template: id })}
            />

            <div className="rounded-xl border border-slate-800 bg-[#0a1224] p-3 text-[11px] leading-relaxed text-slate-300">
              <span className="font-bold text-[#e8c36a]">Active: {activeTemplate.name}</span>
              <p className="mt-0.5 text-slate-400">{activeTemplate.blurb}</p>
            </div>
          </div>
        )}

        {/* ---------------- 2: CELEBRANT DETAILS ---------------- */}
        {activeTab === 'celebrant' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Celebrant Details
              </h2>
              <p className="text-[11px] text-slate-400">
                Enter the birthday member’s name, ministry office, and parish details
              </p>
            </div>

            <Field
              label="Celebrant Full Name"
              value={st.name}
              maxLength={40}
              onChange={(v) => patch({ name: v })}
              placeholder="e.g. Blessing Chidinma Eze"
            />

            {/* Birthday Date with Shortcuts */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className="text-xs font-medium text-slate-300">Birthday Date</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      patch({ date: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` });
                    }}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      patch({ date: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` });
                    }}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={st.date}
                onChange={(e) => patch({ date: e.target.value })}
                placeholder="e.g. Sunday, 12 October 2026 or 14th Jul"
                className="w-full rounded-xl border border-slate-700/80 bg-[#070e1c] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#e8c36a] focus:outline-none"
              />
            </div>

            <Toggle
              label="Display date badge on flyer"
              checked={st.showDate}
              onChange={(v) => patch({ showDate: v })}
            />

            {/* Ministry Role with Quick Suggestions */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className="text-xs font-medium text-slate-300">Ministry / Office Role</label>
                <span className="text-[10px] text-slate-500">Pick quick pill below</span>
              </div>
              <input
                type="text"
                value={st.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. Parish President or Member, Choir"
                className="w-full rounded-xl border border-slate-700/80 bg-[#070e1c] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#e8c36a] focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MINISTRY_ROLES.slice(0, 8).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => patch({ title: role })}
                    className="rounded-md border border-slate-800 bg-[#050b16] px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:border-slate-600 hover:text-white"
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Parish / Station Name"
              value={st.parish}
              maxLength={60}
              onChange={(v) => patch({ parish: v })}
              placeholder="e.g. St. Patrick Parish, Afaha Inang"
              hint="Appears in the header banner, parish ribbon, and attribution."
            />

            <Field
              label="Deanery / Chapter / Diocese Banner"
              value={st.banner}
              maxLength={40}
              onChange={(v) => patch({ banner: v })}
              placeholder="e.g. Uyo Deanery or Archdiocese of Lagos"
              hint="Shown in the header strip of the Deanery and official templates."
            />

            {/* Age & Celebration Badge */}
            <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Age Celebration Badge</span>
                <Toggle
                  label=""
                  checked={st.showAgeBadge}
                  onChange={(v) => patch({ showAgeBadge: v })}
                />
              </div>

              {st.showAgeBadge ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Age number"
                      value={st.age}
                      maxLength={10}
                      onChange={(v) => patch({ age: v })}
                      placeholder="e.g. 21"
                    />
                    <Field
                      label="Badge text"
                      value={st.ageBadgeText || '+1 Today'}
                      maxLength={20}
                      onChange={(v) => patch({ ageBadgeText: v })}
                      placeholder="+1 Today"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AGE_BADGES.map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => patch({ ageBadgeText: badge })}
                        className="rounded-md border border-slate-700/60 bg-[#091224] px-2 py-0.5 text-[10px] font-semibold text-[#e8c36a] hover:bg-[#e8c36a]/20"
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ---------------- 3: PHOTO STUDIO ---------------- */}
        {activeTab === 'photo' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Celebrant Photo Studio
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload portrait, adjust zoom and fit, or try the sample celebrant
              </p>
            </div>

            {!image ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragOver
                    ? 'border-[#e8c36a] bg-[#e8c36a]/10'
                    : 'border-slate-700 bg-[#060b16] hover:border-slate-500'
                }`}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8c36a]/20 text-[#e8c36a]">
                  <IconUpload className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-white">Upload Celebrant Photo</p>
                <p className="mb-4 mt-1 text-[11px] text-slate-400">
                  Drop a photo here or choose from your phone / computer
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button variant="primary" onClick={() => fileRef.current?.click()} className="!py-2.5">
                    <IconUpload /> Choose from files
                  </Button>
                  {onLoadSample ? (
                    <Button variant="outline" onClick={onLoadSample} className="!py-2.5">
                      <IconSparkle /> Try Sample Photo
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3.5 space-y-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={image.dataUrl}
                    alt="Celebrant"
                    className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">Photo loaded</p>
                    <p className="text-[10px] text-slate-400">{imgDims}</p>
                    {onLoadSample ? (
                      <button
                        type="button"
                        onClick={onLoadSample}
                        className="mt-1 text-[10px] font-semibold text-[#e8c36a] hover:underline"
                      >
                        Reset to sample
                      </button>
                    ) : null}
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" className="!px-2.5 !py-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                      Replace
                    </Button>
                    <Button variant="danger" className="!px-2.5 !py-1.5 text-xs" onClick={onClearImage} title="Remove photo">
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-[#050b16] px-3 py-2 text-[11px] leading-relaxed text-slate-300">
                  💡 <span className="font-semibold text-[#e8c36a]">Drag on the live canvas</span> to position the face perfectly, or use the sliders below.
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-300">Frame Fit Mode</p>
                  <Segmented
                    value={st.fitMode}
                    onChange={(v) => patch({ fitMode: v, transform: defaultTransform() })}
                    options={[
                      { value: 'cover', label: 'Fill Frame' },
                      { value: 'fit', label: 'Show Whole Photo' },
                    ]}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 !py-2 text-xs" onClick={onRotate} disabled={!image}>
                    <IconRotate className="h-3.5 w-3.5" /> Rotate 90°
                  </Button>
                  <Button variant="outline" className="flex-1 !py-2 text-xs" onClick={() => patch({ transform: defaultTransform() })} disabled={!image}>
                    Re-fit Center
                  </Button>
                </div>

                <Slider
                  label="Zoom Level"
                  min={st.fitMode === 'fit' ? 35 : 100}
                  max={350}
                  value={Math.round(st.transform.zoom * 100)}
                  format={(v) => `${v}%`}
                  onChange={(v) => {
                    const def = ASPECTS[st.aspect];
                    patch({
                      transform: zoomAt(
                        st.transform,
                        v / 100 / st.transform.zoom,
                        0.5,
                        0.5,
                        image.img.naturalWidth,
                        image.img.naturalHeight,
                        def.w,
                        def.h,
                        st.fitMode,
                      ),
                    });
                  }}
                />

                {/* Filter Presets */}
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-300">Photo Filters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_PRESETS.map((fp) => (
                      <button
                        key={fp.name}
                        type="button"
                        onClick={() => patch({ filters: { ...fp.filters } })}
                        className="rounded-lg border border-slate-700/70 bg-[#091224] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-[#e8c36a] hover:text-white"
                      >
                        {fp.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Slider
                    label="Brightness"
                    min={60}
                    max={140}
                    value={st.filters.brightness}
                    format={(v) => `${v}%`}
                    onChange={(v) => patch({ filters: { ...st.filters, brightness: v } })}
                  />
                  <Slider
                    label="Contrast"
                    min={60}
                    max={140}
                    value={st.filters.contrast}
                    format={(v) => `${v}%`}
                    onChange={(v) => patch({ filters: { ...st.filters, contrast: v } })}
                  />
                  <Slider
                    label="Vibrance"
                    min={0}
                    max={180}
                    value={st.filters.saturate}
                    format={(v) => `${v}%`}
                    onChange={(v) => patch({ filters: { ...st.filters, saturate: v } })}
                  />
                  <Slider
                    label="Theme Wash"
                    min={0}
                    max={50}
                    value={st.filters.wash}
                    format={(v) => `${v}%`}
                    onChange={(v) => patch({ filters: { ...st.filters, wash: v } })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- 4: WISHES & PRAYERS ---------------- */}
        {activeTab === 'wishes' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Catholic Birthday Prayers & Wishes
              </h2>
              <p className="text-[11px] text-slate-400">
                Pick an inspiring Catholic prayer preset or write a custom wish
              </p>
            </div>

            <TextArea
              label="Flyer Birthday Wish / Scripture"
              value={st.message}
              maxLength={220}
              rows={4}
              onChange={(v) => patch({ message: v })}
              placeholder="Write the birthday prayer or wish…"
            />

            <Field
              label="Courtesy / Sent by (PRO Signature)"
              value={st.pro}
              maxLength={70}
              onChange={(v) => patch({ pro: v })}
              placeholder="Courtesy: Catholic Youth Organisation of Nigeria (CYON) Uyo Deanery"
              hint="Shown in the footer strip of the flyer and in WhatsApp share posts."
            />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#e8c36a]">
                Quick Prayer Library (1-Tap Insert)
              </p>
              <div className="space-y-2">
                {BIRTHDAY_PRAYERS.map((prayer) => (
                  <button
                    key={prayer.id}
                    type="button"
                    onClick={() => patch({ message: prayer.text })}
                    className="w-full rounded-xl border border-slate-800 bg-[#070e1c] p-2.5 text-left transition hover:border-[#e8c36a]/70 hover:bg-[#0c162e]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{prayer.title}</span>
                      <span className="rounded bg-[#e8c36a]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#e8c36a]">
                        {prayer.tag}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                      {prayer.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 5: STYLES & THEME ---------------- */}
        {activeTab === 'styles' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Styles, Accents & Themes
              </h2>
              <p className="text-[11px] text-slate-400">
                Customize colors, headline typography, and celebratory decorations
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-300">Headline Typography</p>
              <Field
                label="Headline text"
                value={st.headline}
                maxLength={30}
                onChange={(v) => patch({ headline: v })}
                placeholder="Happy Birthday"
              />
              <div className="mt-2.5">
                <Segmented
                  value={st.headlineStyle}
                  onChange={(v) => patch({ headlineStyle: v })}
                  options={[
                    { value: 'caps', label: 'CLASSIC BOLD CAPS' },
                    { value: 'script', label: 'Calligraphy script' },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3 space-y-3">
              <p className="text-xs font-bold text-white">Celebratory Accents</p>
              <Toggle
                label="Sparkles, confetti & corner stars"
                checked={st.decor}
                onChange={(v) => patch({ decor: v })}
              />
              <Toggle
                label="Floating celebration balloons"
                checked={st.showBalloons}
                onChange={(v) => patch({ showBalloons: v })}
              />
              <Toggle
                label="Catholic Cross & liturgical motifs"
                checked={st.showCross}
                onChange={(v) => patch({ showCross: v })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium text-slate-300">Color Palette</p>
                <span className="text-[10px] text-slate-500">Theme presets</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {OFFICIAL_THEMES.map(themeCard)}
              </div>
              <p className="!mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                More Color Themes
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EXTRA_THEMES.map(themeCard)}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 6: CYON BRANDING ---------------- */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                CYON Emblem & Parish Logo
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Catholic Youth crest is built-in; you can move it anywhere or upload your parish logo
              </p>
            </div>

            {/* Direct canvas tip */}
            <div className="rounded-xl border border-[#e8c36a]/30 bg-[#e8c36a]/10 p-3 text-xs text-[#f2d491] flex items-start gap-2.5">
              <span className="text-base leading-none">✥</span>
              <div>
                <p className="font-bold">Interactive Drag & Drop</p>
                <p className="mt-0.5 text-[11px] text-[#e8c36a]/80 leading-relaxed">
                  You can click and drag the CYON logo directly on the flyer preview to place it anywhere on screen.
                </p>
              </div>
            </div>

            {/* Logo file upload / status card */}
            {!logo ? (
              <div className="rounded-2xl border border-slate-800 bg-[#070e1c] p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b522c]/30 text-[#e8c36a]">
                  <IconShield className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-white">Official CYON Emblem Active</p>
                <p className="mb-3 mt-1 text-[11px] text-slate-400">
                  The authentic CYON crest is rendered with vector fidelity. You can also upload a custom parish seal.
                </p>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="rounded-lg border border-dashed border-[#e8c36a]/60 bg-[#e8c36a]/10 px-3.5 py-2 text-xs font-bold text-[#e8c36a] hover:bg-[#e8c36a]/20 transition"
                >
                  <IconUpload className="mr-1.5 inline h-3.5 w-3.5" /> Upload Custom Parish Logo (PNG)
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={logo.dataUrl}
                    alt="Logo"
                    className="h-12 w-12 rounded-lg bg-white/90 object-contain p-1 ring-1 ring-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">Custom Parish Logo Active</p>
                    <p className="text-[10px] text-slate-400">Transparent PNG</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Change
                    </button>
                    <Button variant="danger" className="!px-2 !py-1 text-[10px]" onClick={onClearLogo}>
                      Use CYON Crest
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Position Anchor Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Logo Anchor Position</label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { id: 'tl', label: 'Top-Left' },
                  { id: 'tc', label: 'Top-Center' },
                  { id: 'tr', label: 'Top-Right' },
                  { id: 'free', label: '✥ Free Move' },
                ].map((pos) => {
                  const active = st.logoPos === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        if (pos.id === 'tl') patch({ logoPos: 'tl' });
                        else if (pos.id === 'tc') patch({ logoPos: 'tc' });
                        else if (pos.id === 'tr') patch({ logoPos: 'tr' });
                        else patch({ logoPos: 'free', logoX: st.logoX ?? 0.5, logoY: st.logoY ?? 0.05 });
                      }}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-[#e8c36a] bg-[#e8c36a]/15 text-[#e8c36a] shadow-sm'
                          : 'border-slate-800 bg-[#070e1c] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale and Position Sliders */}
            <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3.5 space-y-3.5">
              <Slider
                label="Logo Scale (Size)"
                min={40}
                max={220}
                value={Math.round((st.logoScale || 1) * 100)}
                format={(v) => `${v}%`}
                onChange={(v) => patch({ logoScale: v / 100 })}
              />

              <div className="space-y-2 pt-1 border-t border-slate-800/70">
                <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                  <span>Fine Position Adjustments</span>
                  <span className="text-[10px] text-slate-400">
                    X: {Math.round((st.logoX ?? 0.5) * 100)}% · Y: {Math.round((st.logoY ?? 0.05) * 100)}%
                  </span>
                </div>

                <Slider
                  label="Horizontal Position (X)"
                  min={4}
                  max={96}
                  value={Math.round((st.logoX ?? 0.5) * 100)}
                  format={(v) => `${v}%`}
                  onChange={(v) => patch({ logoPos: 'free', logoX: v / 100 })}
                />

                <Slider
                  label="Vertical Position (Y)"
                  min={2}
                  max={96}
                  value={Math.round((st.logoY ?? 0.05) * 100)}
                  format={(v) => `${v}%`}
                  onChange={(v) => patch({ logoPos: 'free', logoY: v / 100 })}
                />
              </div>

              {/* Nudge D-Pad */}
              <div className="pt-2 border-t border-slate-800/70">
                <span className="block mb-2 text-[11px] font-semibold text-slate-400 text-center">
                  Directional Nudge Pad
                </span>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        logoPos: 'free',
                        logoY: Math.max(0.02, (st.logoY ?? 0.05) - 0.02),
                      })
                    }
                    className="w-14 rounded-md border border-slate-700 bg-slate-800/80 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition"
                    title="Nudge Up"
                  >
                    ▲ Up
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          logoPos: 'free',
                          logoX: Math.max(0.04, (st.logoX ?? 0.5) - 0.02),
                        })
                      }
                      className="w-14 rounded-md border border-slate-700 bg-slate-800/80 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition"
                      title="Nudge Left"
                    >
                      ◀ Left
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ logoPos: 'free', logoX: 0.5 })}
                      className="w-16 rounded-md border border-slate-700 bg-[#0d182e] py-1 text-[11px] font-semibold text-[#e8c36a] hover:bg-[#122345] active:scale-95 transition"
                      title="Center Horizontally"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          logoPos: 'free',
                          logoX: Math.min(0.96, (st.logoX ?? 0.5) + 0.02),
                        })
                      }
                      className="w-14 rounded-md border border-slate-700 bg-slate-800/80 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition"
                      title="Nudge Right"
                    >
                      Right ▶
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        logoPos: 'free',
                        logoY: Math.min(0.96, (st.logoY ?? 0.05) + 0.02),
                      })
                    }
                    className="w-14 rounded-md border border-slate-700 bg-slate-800/80 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition"
                    title="Nudge Down"
                  >
                    ▼ Down
                  </button>
                </div>

                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        logoPos: 'tc',
                        logoX: 0.5,
                        logoY: 0.045,
                        logoScale: 1,
                      })
                    }
                    className="text-[11px] font-medium text-slate-400 hover:text-white underline transition"
                  >
                    Reset Logo to Template Default
                  </button>
                </div>
              </div>
            </div>

            {/* Liturgical & Celebration Accents */}
            <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3.5 space-y-3">
              <span className="block text-xs font-bold text-white">Liturgical & Festive Accents</span>
              <Toggle
                label="Liturgical Gold Crucifix watermark"
                checked={st.showCross}
                onChange={(v) => patch({ showCross: v })}
              />
              <Toggle
                label="Festive Star Balloons & Floating Sparkles"
                checked={st.showBalloons}
                onChange={(v) => patch({ showBalloons: v })}
              />
              <Toggle
                label="Ornate Corner Filigree & Flourishes"
                checked={st.decor}
                onChange={(v) => patch({ decor: v })}
              />
            </div>
          </div>
        )}

        {/* ---------------- 7: EXPORT & SHARE ---------------- */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Export & Share Flyer
              </h2>
              <p className="text-[11px] text-slate-400">
                Download high-resolution flyer or share directly to your CYON WhatsApp group
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-300">File Type</p>
                <Segmented
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: 'png', label: 'PNG (Sharp)' },
                    { value: 'jpeg', label: 'JPG' },
                  ]}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-300">Quality</p>
                <Segmented
                  value={String(exportScale)}
                  onChange={(v) => setExportScale(v === '2' ? 2 : 1)}
                  options={[
                    { value: '1', label: 'Standard HD' },
                    { value: '2', label: 'Ultra HD 2x' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                onClick={onDownload}
                disabled={!image || busy !== null}
                className="w-full !py-3.5 text-sm font-bold shadow-lg shadow-[#e8c36a]/20"
              >
                <IconDownload className={busy === 'download' ? 'animate-bounce' : undefined} />
                {busy === 'download' ? 'Generating Flyer…' : 'Download High-Res Flyer'}
              </Button>

              <button
                type="button"
                onClick={onShare}
                disabled={!image || busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-40"
              >
                <IconWhatsApp className="h-4 w-4" />
                {busy === 'share' ? 'Preparing WhatsApp…' : 'Share to CYON WhatsApp Group'}
              </button>

              {onCopy ? (
                <Button
                  variant="outline"
                  onClick={onCopy}
                  disabled={!image || busy !== null}
                  className="w-full !py-2.5 text-xs font-bold"
                >
                  <IconCopy className="h-3.5 w-3.5" />
                  {busy === 'copy' ? 'Copying…' : 'Copy Flyer Image to Clipboard'}
                </Button>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070e1c] p-3 text-[11px] leading-relaxed text-slate-400">
              📱 <span className="font-semibold text-slate-300">WhatsApp Sharing Tip:</span> On mobile phones, tapping <span className="text-emerald-400">Share</span> opens WhatsApp directly with the downloaded flyer and pre-composed celebration message ready to post to your parish or deanery group!
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Quick Export Bar */}
      <div className="shrink-0 border-t border-slate-800/80 bg-[#050914] p-3">
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={onDownload}
            disabled={!image || busy !== null}
            className="flex-1 !py-2.5 text-xs font-bold"
          >
            <IconDownload /> Download
          </Button>
          <button
            type="button"
            onClick={onShare}
            disabled={!image || busy !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-500 disabled:opacity-40"
          >
            <IconWhatsApp className="h-3.5 w-3.5" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
