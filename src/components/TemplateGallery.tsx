import { useEffect, useMemo, useRef, useState } from 'react';
import type { FlyerImage, FlyerState } from '../types';
import { TEMPLATES, drawFlyer } from '../lib/templates';
import { IconCheck } from './ui';

const THUMB_W = 240;
const THUMB_H = Math.round(THUMB_W * 1.25);

interface Props {
  st: FlyerState;
  image: FlyerImage | null;
  logo: FlyerImage | null;
  onSelect: (id: string) => void;
}

type CategoryTab = 'all' | 'official' | 'luxury' | 'youth';

const CATEGORIES: Array<{ id: CategoryTab; label: string }> = [
  { id: 'all', label: 'All Templates' },
  { id: 'official', label: 'CYON Official' },
  { id: 'luxury', label: 'Royal & Gold' },
  { id: 'youth', label: 'Modern & Festive' },
];

export default function TemplateGallery({ st, image, logo, onSelect }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [search, setSearch] = useState('');
  const canvases = useRef<Record<string, HTMLCanvasElement | null>>({});
  const timer = useRef<number | undefined>(undefined);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((tpl) => {
      if (activeCategory === 'official') {
        if (
          tpl.id !== 'deanery' &&
          tpl.id !== 'deanery-blue' &&
          tpl.id !== 'alumni-arc' &&
          tpl.id !== 'awka-cathedral' &&
          tpl.id !== 'herald'
        ) {
          return false;
        }
      } else if (activeCategory === 'luxury') {
        if (tpl.id !== 'royal-gold' && tpl.id !== 'classic' && tpl.id !== 'gallery') {
          return false;
        }
      } else if (activeCategory === 'youth') {
        if (
          tpl.id !== 'polaroid-noir' &&
          tpl.id !== 'onitsha-fegge' &&
          tpl.id !== 'spotlight' &&
          tpl.id !== 'minimal'
        ) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return tpl.name.toLowerCase().includes(q) || tpl.blurb.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, search]);

  useEffect(() => {
    const drawOne = (id: string) => {
      const canvas = canvases.current[id];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const preview: FlyerState = { ...st, template: id, aspect: 'portrait' };
      drawFlyer(ctx, canvas.width, canvas.height, preview, image?.img ?? null, logo?.img ?? null);
    };

    drawOne(st.template);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      for (const tpl of filteredTemplates) {
        if (tpl.id !== st.template) drawOne(tpl.id);
      }
    }, 120);
    return () => window.clearTimeout(timer.current);
  }, [st, image, logo, filteredTemplates]);

  return (
    <div className="space-y-3">
      {/* Search & Category Pills */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flyer templates…"
            className="w-full rounded-lg border border-slate-700/80 bg-[#070d1a] px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition focus:border-[#e8c36a] focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-[#e8c36a] text-[#0b1b33] shadow-sm'
                    : 'border border-slate-700/70 bg-[#0a1122] text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredTemplates.map((tpl) => {
          const active = st.template === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              title={tpl.blurb}
              onClick={() => onSelect(tpl.id)}
              className={`group relative rounded-xl border p-1.5 text-left transition ${
                active
                  ? 'border-[#e8c36a] bg-[#e8c36a]/15 ring-2 ring-[#e8c36a]/50 shadow-lg shadow-[#e8c36a]/10'
                  : 'border-slate-700/80 bg-[#0a1122] hover:border-slate-500'
              }`}
            >
              <span className="relative block overflow-hidden rounded-lg bg-slate-900 ring-1 ring-black/40">
                <canvas
                  ref={(el) => {
                    canvases.current[tpl.id] = el;
                  }}
                  width={THUMB_W}
                  height={THUMB_H}
                  className="block h-auto w-full transition group-hover:scale-[1.02]"
                />
                {active ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#e8c36a] text-[#0b1b33] shadow">
                    <IconCheck className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : null}
              </span>

              <span className="mt-1.5 flex items-center justify-between gap-1">
                <span className="truncate text-[11px] font-bold leading-tight text-slate-200">
                  {tpl.name}
                </span>
                {tpl.badge ? (
                  <span className="shrink-0 rounded bg-[#e8c36a]/20 px-1 py-0.5 text-[8px] font-black tracking-wider text-[#e8c36a]">
                    {tpl.badge}
                  </span>
                ) : !tpl.usesTheme ? (
                  <span className="shrink-0 rounded bg-[#e8c36a]/15 px-1 py-0.5 text-[8px] font-bold tracking-wide text-[#e8c36a]">
                    OFFICIAL
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No templates match "{search}". Try searching "Deanery", "Awka", or "Gold".
        </div>
      ) : null}
    </div>
  );
}
