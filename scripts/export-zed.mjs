#!/usr/bin/env node
// Renders Zed to static assets in assets/zed/ from the built component, so
// the favicon and social icons are always the same drawing as the widget.
//
//   npm run build && npm run export:zed
//
// Writes one SVG per state (large geometry, no animation) plus favicon.svg
// (idle, small-size geometry). If Google Chrome is installed it also renders
// PNGs at 16, 32, 180 and 512 for hosts that need bitmaps (Safari favicon,
// apple-touch-icon, maskable icon). Without Chrome the PNG step is skipped
// and says so; the SVGs are still written.

import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Zed, ZED_STATES } from "../dist/index.js";

const OUT = "assets/zed";
mkdirSync(OUT, { recursive: true });

function svg(state, size) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    renderToStaticMarkup(createElement(Zed, { state, size, animate: false }))
      .replace(/ width="\d+" height="\d+"/, "")
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
}

for (const state of ZED_STATES) {
  writeFileSync(join(OUT, `zed-${state}.svg`), svg(state, 512));
}
// Favicon uses the small-size geometry: thicker outline, larger eyes.
writeFileSync(join(OUT, "favicon.svg"), svg("idle", 32));
console.log(`wrote ${ZED_STATES.length + 1} SVGs to ${OUT}/`);

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((p) => existsSync(p));

if (!CHROME) {
  console.log("Chrome not found, skipping PNG render. SVGs are enough for Chrome, Firefox and Edge favicons.");
  process.exit(0);
}

const tmp = join(OUT, ".render");
mkdirSync(tmp, { recursive: true });
for (const size of [16, 32, 180, 512]) {
  // Small sizes use the small-size geometry, large ones the standard.
  const markup = renderToStaticMarkup(createElement(Zed, { state: "idle", size, animate: false }));
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">${markup}</body>`;
  const page = join(tmp, `${size}.html`);
  writeFileSync(page, html);
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
    `--window-size=${size},${size}`, `--screenshot=${join(OUT, `zed-${size}.png`)}`, `file://${process.cwd()}/${page}`,
  ], { stdio: "ignore" });
}
rmSync(tmp, { recursive: true, force: true });
console.log(`rendered PNGs at 16, 32, 180, 512 to ${OUT}/`);
