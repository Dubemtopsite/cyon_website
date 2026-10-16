/** Force-load every webfont face the canvas renderer needs, then resolve. */
const FACES = [
  '400 28px "Playfair Display"',
  'italic 400 28px "Playfair Display"',
  '700 88px "Playfair Display"',
  '500 24px "Montserrat"',
  '600 22px "Montserrat"',
  '700 26px "Montserrat"',
  '800 40px "Montserrat"',
  '700 92px "Dancing Script"',
  '700 80px "Caveat"',
];

export async function ensureFonts(): Promise<void> {
  try {
    if ('fonts' in document) {
      await Promise.all(FACES.map((f) => document.fonts.load(f).catch(() => null)));
      await document.fonts.ready;
    }
  } catch {
    /* fall back to system fonts silently */
  }
}
