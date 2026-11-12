import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ASSETS, assetPath } from '../src/assets.js';

const source = resolve('src'), output = resolve('build');
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
const read = file => readFile(resolve(source, file), 'utf8');
const files = ['assets.js', 'events.js', 'game.js', 'art.js', 'scene.js', 'app.js'];
const bundled = {};
for (const path of [ASSETS.background, ASSETS.character, ASSETS.clover, ASSETS.currency, ...Object.values(ASSETS.items)].filter(Boolean)) {
  assetPath(path);
  const mime = { png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', jpg: 'image/jpeg' }[path.split('.').pop()];
  bundled[path] = `data:${mime};base64,${(await readFile(resolve(source, path))).toString('base64')}`;
}
const code = (await Promise.all(files.map(read))).join('\n')
  .replace('export const BUNDLED_ASSETS = {};', `export const BUNDLED_ASSETS = ${JSON.stringify(bundled)};`)
  .replace(/^import .+;\r?\n/gm, '').replace(/^export /gm, '');
// Substitute through callbacks so literal dollar signs in source stay intact.
const css = await read('styles.css');
const favicon = (await readFile(resolve(source, 'assets/leaf.svg'))).toString('base64');
const html = (await read('index.html'))
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>${css}</style>`)
  .replace('href="./assets/leaf.svg"', () => `href="data:image/svg+xml;base64,${favicon}"`)
  .replace('<script type="module" src="./app.js"></script>', () => `<script type="module">\n${code}\n</script>`);
await writeFile(resolve(output, 'standalone.html'), html);
console.log('Built build/index.html and build/standalone.html');
