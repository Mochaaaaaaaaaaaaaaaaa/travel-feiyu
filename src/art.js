import { ASSETS, assetPath, imageArt } from './assets.js';
const paths = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="m9 3 6 0 .7 3 2.5 1.4 3-.8 2 5-2.6 1.7-.6 2.8 1.6 2.6-4.5 3-2.2-2-2.9.1-2.1 2-4.7-2.8 1.4-2.7-.7-2.8L1 11l2-5 3 .8L8.4 5 9 3Z"/>',
  leaf: '<path d="M5 17C2 7 12 3 21 3c0 10-5 16-13 14M4 21 16 8"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  bag: '<rect x="5" y="7" width="14" height="14" rx="4"/><path d="M8 7V5a4 4 0 0 1 8 0v2M5 11h14M9 15h6v4H9z"/>',
  shop: '<path d="M3 9h18l-2-6H5L3 9Zm1 0v12h16V9M3 9c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0M9 21v-7h6v7"/>',
  card: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="m4 17 5-5 4 4 3-3 5 4M16 8h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  'sound-off': '<path d="M11 4 6 8H3v8h3l5 4V4Zm5 5 6 6m0-6-6 6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4V4Zm5 4c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  clover: '<path d="M12 12C0 11 3 0 9 4c2 1 3 5 3 8 1-12 12-9 8-3-1 2-5 3-8 3 12 1 9 12 3 8-2-1-3-5-3-8-1 12-12 9-8 3 1-2 5-3 8-3Zm0 0 6 10"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  wind: '<path d="M3 8h12c7 0 4-8 0-5M3 12h17M3 16h10c7 0 4 8 0 5"/>',
  heart: '<path d="M12 21 3 12C-3 4 8 0 12 7c4-7 15-3 9 5l-9 9Z"/>',
  sprout: '<path d="M12 22V10M12 15C1 15 2 6 3 5c9 0 9 6 9 10Zm0-4C12 2 21 2 22 3c0 8-6 8-10 8Z"/>',
  flower: '<path d="M12 8c-6-12-13 1-5 4-12 6 1 13 5 5 6 12 13-1 5-5 12-6-1-13-5-4Z"/><circle cx="12" cy="12" r="3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16 7-3 7-6 3 3-7 6-3Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  forward: '<path d="m3 5 8 7-8 7V5Zm9 0 8 7-8 7V5Zm9 0v14"/>',
  refresh: '<path d="M20 7V2m0 5h-5M4 17v5m0-5h5M4 9a8 8 0 0 1 14-4l2 2M4 17l2 2a8 8 0 0 0 14-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  mail: '<rect x="2" y="5" width="20" height="15" rx="2"/><path d="m2 6 10 8L22 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
};
export function icon(name, cls = '') { if (name === 'clover' && ASSETS.currency) return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><image href="${assetPath(ASSETS.currency)}" width="24" height="24"/></svg>`; return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`; }

export function frogMarkup(x = 0, y = 0, scale = 1, reading = false) {
  if (ASSETS.character) return `<g transform="translate(${x} ${y}) scale(${scale})"><image href="${assetPath(ASSETS.character)}" width="120" height="120" preserveAspectRatio="xMidYMid meet"/></g>`;
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#536c43" stroke-width="2.5" stroke-linejoin="round"><ellipse cx="52" cy="109" rx="47" ry="9" fill="#526548" opacity=".12" stroke="none"/><ellipse cx="52" cy="75" rx="37" ry="34" fill="#a8bd7d"/><ellipse cx="25" cy="99" rx="19" ry="9" fill="#a8bd7d"/><ellipse cx="80" cy="99" rx="19" ry="9" fill="#a8bd7d"/><path d="M20 54C3 25 21 11 37 23 48 16 62 16 73 23c20-14 37 5 20 32 0 39-75 39-73-1Z" fill="#b3c98d"/><ellipse cx="28" cy="38" rx="5" ry="7" fill="#414b36" stroke="none"/><ellipse cx="79" cy="38" rx="5" ry="7" fill="#414b36" stroke="none"/><circle cx="26" cy="36" r="1.7" fill="#fff" stroke="none"/><circle cx="77" cy="36" r="1.7" fill="#fff" stroke="none"/><ellipse cx="18" cy="53" rx="8" ry="4" fill="#ddaaa0" stroke="none" opacity=".7"/><ellipse cx="89" cy="53" rx="8" ry="4" fill="#ddaaa0" stroke="none" opacity=".7"/><path d="M47 53q6 7 12 0" fill="none"/><path d="m20 69 30 8 32-8-5 13-26 7-26-8Z" fill="#d49b63" stroke="#a3774d"/>${reading ? '<path d="m15 78 36 8 36-8-3 29-33 5-33-5Z" fill="#f8edc9" stroke="#937c55"/><path d="M51 86v26m-24-20 14 3m20 0 14-3" fill="none" stroke="#bfa676"/><ellipse cx="19" cy="87" rx="8" ry="10" fill="#b3c98d"/><ellipse cx="84" cy="87" rx="8" ry="10" fill="#b3c98d"/>' : '<path d="M27 80q-12 12-2 15m52-15q12 12 2 15" fill="none"/>'}</g>`;
}
export function avatar() { return `<svg viewBox="0 0 120 120" aria-hidden="true">${frogMarkup(5, 5, 1)}</svg>`; }
export function itemArt(id) {
  if (ASSETS.items[id]) return imageArt(ASSETS.items[id], '');
  const illustrations = {
    rice: '<path d="M26 70 50 24q6-10 12 0l27 46q8 14-7 16H33q-17 0-7-16Z" fill="#fff9e5"/><path d="M43 62h25v24H43Z" fill="#64785b"/><circle cx="57" cy="47" r="7" fill="#c77f6a"/><path d="m39 50 3-4m27 11 3 2m-34 7 2 3" stroke="#d9cfae"/>',
    sandwich: '<path d="m24 76 29-51q3-5 7 0l31 51Z" fill="#e2bd7e"/><path d="m28 70 28-46 29 46Z" fill="#fff1cb"/><path d="M27 74h60v7H27Z" fill="#91a36d"/><path d="M30 81h55v5H30Z" fill="#c9805d"/><path d="m40 61 13-7m6 7 8-5" stroke="#dcb97c"/>',
    cake: '<path d="M32 49h50l-5 38H37Z" fill="#e4bc7b"/><path d="M34 58h47M43 63l2 19m13-19v19m12-19-2 19" stroke="#ba915e"/><path d="M28 47c-1-9 8-14 16-11-1-12 15-16 21-6 9-5 21 4 17 13 13 1 13 16 1 16H32c-10-1-12-9-4-12Z" fill="#fff1d0"/><circle cx="57" cy="28" r="6" fill="#c77f6a"/>',
    map: '<path d="m20 31 24-8 24 8 24-8v57l-24 8-24-8-24 8Z" fill="#f1e4b7"/><path d="M44 23v57m24-49v57" stroke="#b8a278"/><path d="m27 66 12-19 14 12 20-17 10 10" fill="none" stroke="#7e9668" stroke-dasharray="4 4"/><path d="m73 65 5-9 5 9Z" fill="#8d9f76"/>',
    cup: '<path d="M76 42h12c17 1 13 28-2 27H76" fill="none" stroke="#7e9e8e" stroke-width="6"/><path d="M29 37h49v40c0 17-49 17-49 0Z" fill="#b0c9b7"/><ellipse cx="53" cy="37" rx="25" ry="6" fill="#e9eee1"/><path d="M42 22q-7-8 0-15m15 15q-7-8 0-15" fill="none" stroke="#b8b6a0"/><path d="m48 59 7-8 7 8-7 8Z" fill="#f4edcf"/>',
  };
  return `<svg viewBox="0 0 112 112" aria-hidden="true"><g stroke="#8c795a" stroke-width="1.6" stroke-linejoin="round">${illustrations[id] || illustrations.map}</g></svg>`;
}
const cloud = (x, y, scale = 1) => `<path transform="translate(${x} ${y}) scale(${scale})" d="M0 23C-8 6 10-2 23 7 30-12 58-5 59 13c19-5 29 14 12 18H7Z" fill="#fffcf0" opacity=".8"/>`;
const clover = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q2 15-2 23" fill="none" stroke="#668259" stroke-width="3"/><path d="M0 0C-24 2-17-20-6-13c5-17 22-7 15 5C26-6 17 13 5 5-2 22-20 9 0 0Z" fill="#83a564" stroke="#668259" stroke-width="1.5"/></g>`;
export function landscape(theme = 'hill', withFrog = true) {
  let scene;
  if (theme === 'town') scene = `<rect width="480" height="290" fill="#eadfbe"/>${cloud(330, 35, 1)}<path d="M0 240 480 222v68H0Z" fill="#d6c3a3"/><g stroke="#a18c6c" stroke-width="2"><path d="M20 121h135v123H20Z" fill="#f0d6a4"/><path d="m8 121 30-56h102l29 56Z" fill="#bb8565"/><path d="M54 177h42v67H54Z" fill="#8f9b7b"/><path d="M112 145h22v34h-22Z" fill="#99b8ad"/><path d="M201 103h145v133H201Z" fill="#ece4bf"/><path d="m189 103 30-50h111l30 50Z" fill="#a9af87"/><path d="M222 131h38v35h-38Zm64 0h37v35h-37Z" fill="#9dbbae"/><path d="M228 236v-49h87v49" fill="#c59f77"/><path d="m214 187 11-21h96l12 21Z" fill="#c4906d"/><path d="M398 218V90m-12 26h24v30h-24Z" fill="#f4dc9e"/></g><path d="M0 263q200-17 480-14" stroke="#b6a58a" stroke-width="2" fill="none"/>`;
  else if (theme === 'lake') scene = `<rect width="480" height="290" fill="#e2e8d7"/><circle cx="365" cy="62" r="30" fill="#edce90"/>${cloud(63, 35, 1.3)}<path d="M0 150q70-103 172-13 111-94 200-16 54-64 108-11v102H0Z" fill="#aebfa0"/><path d="M0 174q200-37 480-15v131H0Z" fill="#acc8bd"/><path d="M0 242q157-9 258 48H0Z" fill="#c5cf9e"/><g stroke="#e0e8ce" stroke-width="2"><path d="M269 185h82m-145 27h69m84 17h67m-190 30h55m48-6h25"/></g><g stroke="#84936c" stroke-width="3"><path d="M39 233v-74m12 80 5-65m-31 60-6-52"/><path d="M38 175v-24m18 37v-20m-38 22v-17" stroke="#b5a17b" stroke-width="6"/></g><path d="m112 253 100-17 40 16-107 23Z" fill="#b6a078" stroke="#8e815e" stroke-width="2"/>`;
  else scene = `<rect width="480" height="290" fill="#e5ecda"/>${cloud(42, 37, 1.2)}${cloud(309, 28, .9)}<circle cx="376" cy="70" r="28" fill="#ecd79d"/><path d="M0 187 118 75l99 115L335 103l145 92v95H0Z" fill="#b6c7a7"/><path d="m74 115 44-40 33 39-32-11Z" fill="#e2e6cc"/><path d="M0 204q139-102 279 9 96-46 201-13v90H0Z" fill="#9fb98b"/><path d="M0 258q151-118 326 32H0Z" fill="#c1d0a0"/><path d="M280 290q-90-74-33-101c-11 46 85 47 103 101" fill="#e8dfba"/><g stroke="#789165" stroke-width="2"><path d="M393 181v65"/><path d="M356 197c-19-24 2-58 26-49 20-30 62-4 49 22 28 25-1 53-21 42-19 20-57 5-54-15Z" fill="#829e71"/></g><g fill="#f6edcc"><circle cx="60" cy="257" r="3"/><circle cx="80" cy="251" r="3"/><circle cx="332" cy="236" r="3"/></g>`;
  return `<svg viewBox="0 0 480 290" aria-hidden="true">${scene}${withFrog ? frogMarkup(theme === 'town' ? 160 : 142, theme === 'lake' ? 198 : 187, .68) : ''}<g fill="none" stroke="#859578" stroke-width="1.5"><path d="m224 49 7 4 7-4m16 8 6 3 6-3"/></g></svg>`;
}
export function routeArt() { return `<svg viewBox="0 0 320 125" aria-hidden="true"><path d="M39 92c40-89 85 51 133-8s61-53 107-30" fill="none" stroke="#b9baa0" stroke-width="2" stroke-dasharray="4 6"/><g stroke="#8c9c76" stroke-width="1.7" stroke-linejoin="round"><path d="m12 58 26-36 27 36Z" fill="#c6d1af"/><path d="m28 37 10-15 11 15-11-4Z" fill="#f3f0d7"/><path d="m139 103 18-24 18 24Z" fill="#c7d2b0"/><path d="M253 72V41h40v31Z" fill="#e8d7ab"/><path d="m245 41 28-24 28 24Z" fill="#bd9876"/><path d="M268 72V55h10v17" fill="#b4bea0"/><path d="M102 35c-15-17 6-29 11-13 8-16 28-3 12 11l-11 10Z" fill="#d4b29a" stroke="#c19b83"/></g><circle cx="39" cy="91" r="6" fill="#8d9f77"/><circle cx="278" cy="56" r="6" fill="#b89b71"/>${cloud(194, 12, .43)}</svg>`; }
