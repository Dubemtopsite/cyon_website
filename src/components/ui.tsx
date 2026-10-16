import type { ReactNode, ButtonHTMLAttributes } from 'react';

/* ---------------- icons ---------------- */

type IconProps = { className?: string };

const svg = (path: ReactNode, className = 'h-4 w-4') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

export const IconUpload = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>,
    className,
  );

export const IconDownload = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5" />
      <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </>,
    className,
  );

export const IconShare = ({ className }: IconProps) =>
  svg(
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8 15.8 6.4M8.2 13.2l7.6 4.4" />
    </>,
    className,
  );

export const IconReset = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V10H9" />
    </>,
    className,
  );

export const IconPhoto = ({ className }: IconProps) =>
  svg(
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m4 17 4.8-4.4a1.5 1.5 0 0 1 2 0L16 17m1.2-1.4a1.5 1.5 0 0 1 2 0L20.5 15.5" />
    </>,
    className,
  );

export const IconTrash = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7l.8 11.4A1.7 1.7 0 0 0 9 20h6a1.7 1.7 0 0 0 1.7-1.6L17.5 7" />
    </>,
    className,
  );

export const IconSparkle = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.2 10.2 12.6 4.7 10.8 10.2 9 12 3.5Z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>,
    className,
  );

export const IconCheck = ({ className }: IconProps) =>
  svg(<path d="m5 12.5 4.5 4.5L19 7.5" />, className);

export const IconRotate = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 4.5V10H15" />
    </>,
    className,
  );

export const IconUser = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>,
    className,
  );

export const IconTemplate = ({ className }: IconProps) =>
  svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>,
    className,
  );

export const IconPalette = ({ className }: IconProps) =>
  svg(
    <>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.24-.28-.39-.62-.39-1.02 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-9.97-10-9.97Z" />
    </>,
    className,
  );

export const IconBook = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>,
    className,
  );

export const IconShield = ({ className }: IconProps) =>
  svg(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>,
    className,
  );

export const IconCopy = ({ className }: IconProps) =>
  svg(
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>,
    className,
  );

export const IconWhatsApp = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.476-.15-.677.15-.2.301-.777.98-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.631-.928-2.234-.244-.588-.493-.508-.677-.518l-.578-.01c-.2 0-.526.075-.802.376s-1.054 1.03-1.054 2.51c0 1.48 1.079 2.909 1.23 3.11.15.2 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9.119.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.006L2 22l5.133-1.314A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25a8.204 8.204 0 0 1-4.184-1.144l-.3-.178-3.106.795.83-2.98-.195-.315A8.214 8.214 0 1 1 12 20.25z" />
  </svg>
);

/* ---------------- layout ---------------- */

export function Section({
  step,
  title,
  icon,
  children,
  right,
}: {
  step: number;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="border-b border-slate-800/80 px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8c36a]/15 text-[13px] font-bold text-[#e8c36a] ring-1 ring-[#e8c36a]/40">
          {step}
        </span>
        <h2 className="flex-1 text-[13px] font-bold uppercase tracking-[0.14em] text-slate-200">
          {title}
        </h2>
        {icon ? <span className="text-[#e8c36a]/80">{icon}</span> : null}
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  id?: string;
}) {
  const fieldId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs font-medium text-slate-400">
          {label}
        </label>
        {maxLength ? (
          <span className="text-[10px] tabular-nums text-slate-600">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <input
        id={fieldId}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700/80 bg-[#0a1122] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-[#e8c36a]/70 focus:ring-2 focus:ring-[#e8c36a]/15"
      />
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  id?: string;
}) {
  const fieldId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs font-medium text-slate-400">
          {label}
        </label>
        {maxLength ? (
          <span className="text-[10px] tabular-nums text-slate-600">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={fieldId}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-slate-700/80 bg-[#0a1122] px-3 py-2.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-[#e8c36a]/70 focus:ring-2 focus:ring-[#e8c36a]/15"
      />
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-[#e8c36a]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-slate-700/80 bg-[#0a1122] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            value === opt.value
              ? 'bg-[#e8c36a] text-[#0b1b33] shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-[#0a1122] px-3 py-2.5 text-left transition hover:border-slate-600"
    >
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? 'bg-[#e8c36a]' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function Button({
  variant = 'outline',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-gradient-to-b from-[#f2d491] to-[#e8c36a] text-[#0b1b33] hover:brightness-105 shadow-lg shadow-[#e8c36a]/20',
    outline: 'border border-slate-700 bg-[#0a1122] text-slate-300 hover:border-slate-500 hover:text-slate-100',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
    danger: 'border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40',
  };
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
