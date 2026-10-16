import { Button, IconCopy, IconDownload, IconReset, IconSparkle, IconWhatsApp } from './ui';

export default function Header({
  hasImage,
  busy,
  onDownload,
  onShare,
  onCopy,
  onReset,
  onLoadSample,
}: {
  hasImage: boolean;
  busy: boolean;
  onDownload: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onReset: () => void;
  onLoadSample?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070c18]/95 backdrop-blur">
      <div className="flex h-[66px] items-center gap-3 px-3 sm:px-6">
        {/* Brand Crest Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#0b522c] to-[#042814] ring-1 ring-[#e8c36a]/50 shadow-md shadow-black/40">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f3c14a]" aria-hidden="true">
            <path d="M12 2v20M5 8h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[14px] font-extrabold tracking-tight text-white sm:text-base">
              CYON Birthday Flyer Studio
            </h1>
            <span className="hidden rounded bg-[#0b522c]/60 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#e8c36a] ring-1 ring-[#e8c36a]/30 sm:inline-block">
              PRO Studio
            </span>
          </div>
          <p className="truncate text-[10px] font-medium tracking-wide text-slate-400 sm:text-[11px]">
            Catholic Youth Organisation of Nigeria · Create &amp; share birthday flyers in seconds
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onLoadSample ? (
            <button
              type="button"
              onClick={onLoadSample}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0a1224] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-[#e8c36a] hover:text-white md:flex"
              title="Load realistic sample celebrant for quick testing"
            >
              <IconSparkle className="h-3.5 w-3.5 text-[#e8c36a]" />
              <span>Sample</span>
            </button>
          ) : null}

          {onCopy ? (
            <button
              type="button"
              onClick={onCopy}
              disabled={!hasImage || busy}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0a1224] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-40 lg:flex"
              title="Copy flyer image to clipboard"
            >
              <IconCopy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </button>
          ) : null}

          <Button variant="ghost" onClick={onReset} className="hidden !px-2.5 !py-1.5 text-xs sm:inline-flex" title="Start a fresh flyer">
            <IconReset className="h-3.5 w-3.5" /> Start over
          </Button>

          {onShare ? (
            <button
              type="button"
              onClick={onShare}
              disabled={!hasImage || busy}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-40"
              title="Share flyer with formatted post to WhatsApp"
            >
              <IconWhatsApp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          ) : null}

          <Button
            variant="primary"
            onClick={onDownload}
            disabled={!hasImage || busy}
            className="!px-3.5 !py-2 text-xs font-bold shadow-md shadow-[#e8c36a]/20"
            title={hasImage ? 'Download high-res flyer' : 'Upload photo first'}
          >
            <IconDownload className={`h-3.5 w-3.5 ${busy ? 'animate-bounce' : ''}`} />
            <span>{busy ? 'Saving…' : 'Download'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
