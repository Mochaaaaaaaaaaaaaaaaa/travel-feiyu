import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const read = file => readFile(join(root, file), 'utf8');
const [html, css, game, art, scene, app, favicon] = await Promise.all(['index.html', 'styles.css', 'game.js', 'art.js', 'scene.js', 'app.js', 'assets/leaf.svg'].map(read));
const code = [game, art, scene, app].join('\n').replace(/^import .+;\r?\n/gm, '').replace(/^export /gm, '');
const bundle = html
  .replace('<link rel="stylesheet" href="./styles.css">', `<style>\n${css}\n</style>`)
  .replace('href="./assets/leaf.svg"', `href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"`)
  .replace('<script type="module" src="./app.js"></script>', `<script type="module">\n${code}\n</script>`);
await writeFile(join(root, 'standalone.html'), bundle, 'utf8');
console.log('Built demo/dist/standalone.html — self-contained, no network dependencies.');
