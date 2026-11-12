// Use local relative files, e.g. ./assets/character.webp. Keep null for built-in art.
export const ASSETS = {
  background: null, // Landscape backdrop; house and interactive props remain separate.
  character: null,
  clover: null,
  currency: null,
  items: { rice: null, sandwich: null, cake: null, map: null, cup: null },
};
export const BUNDLED_ASSETS = {};
export function assetPath(path) {
  if (typeof path !== 'string' || !/^\.\/assets\/[a-zA-Z0-9_./-]+\.(png|webp|svg|jpg)$/.test(path) || path.includes('..')) throw new Error('美术必须使用 assets 下的本地图片。');
  return BUNDLED_ASSETS[path] || path;
}
export function imageArt(path, fallback, viewBox = '0 0 120 120') {
  if (!path) return fallback;
  return `<svg viewBox="${viewBox}" aria-hidden="true"><image href="${assetPath(path)}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"/></svg>`;
}
