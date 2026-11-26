/* Canvas text uses the site's own faces, read from the CSS variables next/font sets on <html>. */

export function fontVars() {
  const cs = getComputedStyle(document.documentElement);
  return {
    serif: cs.getPropertyValue("--font-newsreader").trim() || "Georgia, serif",
    sans: cs.getPropertyValue("--font-geist").trim() || "system-ui, sans-serif",
    mono: cs.getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace",
  };
}

/**
 * Resolves once every face the canvases draw with is loaded. Faces load lazily on first use, so they
 * are requested explicitly (the italic Newsreader may not be used anywhere else on the page yet).
 */
export function whenFontsReady(): Promise<void> {
  const { serif, mono } = fontVars();
  const faces = [`400 40px ${serif}`, `300 40px ${serif}`, `italic 400 40px ${serif}`, `italic 300 40px ${serif}`, `400 20px ${mono}`, `500 20px ${mono}`];
  return Promise.all(faces.map((f) => document.fonts.load(f)))
    .then(() => document.fonts.ready)
    .then(() => undefined)
    .catch(() => undefined);
}
