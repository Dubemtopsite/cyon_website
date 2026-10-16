export type AspectId = 'portrait' | 'story' | 'square';

/** How the photo is fitted into the frame. */
export type FitMode = 'cover' | 'fit';

/** Layout template id — resolved through the template registry. */
export type TemplateId = string;

export type LogoPos = 'tl' | 'tc' | 'tr' | 'free';

export interface Transform {
  /** Cover scale multiplier, always >= 1 */
  zoom: number;
  /** Horizontal offset as a fraction of frame width */
  ox: number;
  /** Vertical offset as a fraction of frame height */
  oy: number;
}

export interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  wash: number;
}

export interface FlyerState {
  template: TemplateId;
  fitMode: FitMode;
  logoPos: LogoPos;
  logoScale: number;
  logoX: number;
  logoY: number;
  headline: string;
  headlineStyle: 'caps' | 'script';
  name: string;
  age: string;
  showAgeBadge: boolean;
  ageBadgeText: string;
  title: string;
  parish: string;
  date: string;
  showDate: boolean;
  /** Optional banner line, e.g. the deanery or chapter name. */
  banner: string;
  message: string;
  pro: string;
  decor: boolean;
  showBalloons: boolean;
  showCross: boolean;
  themeId: string;
  aspect: AspectId;
  transform: Transform;
  filters: Filters;
}

export interface FlyerImage {
  dataUrl: string;
  img: HTMLImageElement;
}

export interface AspectDef {
  id: AspectId;
  label: string;
  hint: string;
  w: number;
  h: number;
}

export const ASPECTS: Record<AspectId, AspectDef> = {
  portrait: { id: 'portrait', label: 'Portrait 4:5', hint: 'WhatsApp & Facebook post', w: 1080, h: 1350 },
  story: { id: 'story', label: 'Story 9:16', hint: 'WhatsApp & Instagram status', w: 1080, h: 1920 },
  square: { id: 'square', label: 'Square 1:1', hint: 'Grid post', w: 1080, h: 1080 },
};
