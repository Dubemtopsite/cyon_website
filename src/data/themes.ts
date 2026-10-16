export interface Theme {
  id: string;
  name: string;
  /** Part of the "official" preset group shown first */
  official?: boolean;
  /** Gradient top colour behind the photo */
  top: string;
  /** Scrim / panel colour used at the bottom of the flyer */
  bottom: string;
  accent: string;
  /** Softer accent for secondary text */
  sub: string;
  text: string;
  /** Colour wash blended over the photo */
  wash: string;
  /** Small swatches for the theme picker */
  swatches: [string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: 'cyon-blue',
    name: 'CYON Blue & White',
    official: true,
    top: '#0e4c92',
    bottom: '#062748',
    accent: '#ffffff',
    sub: '#bfe0ff',
    text: '#ffffff',
    wash: '#0e4c92',
    swatches: ['#062748', '#ffffff', '#7fc4ff'],
  },
  {
    id: 'naija-green',
    name: 'CYON Green & White',
    official: true,
    top: '#0a5c3e',
    bottom: '#012a1c',
    accent: '#ffffff',
    sub: '#cdeede',
    text: '#ffffff',
    wash: '#046a38',
    swatches: ['#012a1c', '#ffffff', '#046a38'],
  },
  {
    id: 'vatican',
    name: 'Vatican White & Gold',
    official: true,
    top: '#57430f',
    bottom: '#231a03',
    accent: '#ffffff',
    sub: '#f3e6c2',
    text: '#fffef7',
    wash: '#8a6a1a',
    swatches: ['#231a03', '#fffef7', '#d9b544'],
  },
  {
    id: 'royal-navy',
    name: 'Royal Navy & Gold',
    official: true,
    top: '#0b1b33',
    bottom: '#071224',
    accent: '#e8c36a',
    sub: '#e6cf9d',
    text: '#ffffff',
    wash: '#0b1b33',
    swatches: ['#071224', '#e8c36a', '#ffffff'],
  },
  {
    id: 'crimson',
    name: 'Crimson Grace',
    top: '#5a0e1e',
    bottom: '#2a0410',
    accent: '#f2c14e',
    sub: '#f3d5b8',
    text: '#ffffff',
    wash: '#5a0e1e',
    swatches: ['#2a0410', '#f2c14e', '#a3122b'],
  },
  {
    id: 'emerald',
    name: 'Emerald Blessing',
    top: '#064e3b',
    bottom: '#022c22',
    accent: '#f5d78e',
    sub: '#cbe9d9',
    text: '#ffffff',
    wash: '#064e3b',
    swatches: ['#022c22', '#f5d78e', '#10b981'],
  },
  {
    id: 'rose',
    name: 'Rose Celebration',
    top: '#4a0e33',
    bottom: '#26041c',
    accent: '#ffd9e8',
    sub: '#f7c3d9',
    text: '#ffffff',
    wash: '#4a0e33',
    swatches: ['#26041c', '#ffd9e8', '#e879a8'],
  },
  {
    id: 'mono',
    name: 'Mono Elegance',
    top: '#161616',
    bottom: '#050505',
    accent: '#ffffff',
    sub: '#c9c9c9',
    text: '#ffffff',
    wash: '#000000',
    swatches: ['#050505', '#ffffff', '#6b6b6b'],
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const OFFICIAL_THEMES = THEMES.filter((t) => t.official);
export const EXTRA_THEMES = THEMES.filter((t) => !t.official);
