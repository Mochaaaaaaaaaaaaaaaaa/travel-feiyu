import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(join(root, 'dist', file), 'utf8');

test('all HTML and module asset references resolve locally without dependencies', async () => {
  for (const file of ['index.html', 'app.js', 'game.js', 'art.js', 'styles.css']) {
    const source = await read(file);
    for (const match of source.matchAll(/(?:src|href)="(\.\/[^"#]+)"|from '(\.\/[^']+)'/g)) {
      await access(join(root, 'dist', match[1] || match[2]));
    }
    assert.doesNotMatch(source, /(?:src|href)="https?:\/\/|@import|url\(['"]?https?:/);
  }
});

test('UI update hooks refer to existing HTML or illustrated scene elements', async () => {
  const [app, html, art] = await Promise.all(['app.js', 'index.html', 'art.js'].map(read));
  const ids = new Set([...`${html}\n${art}`.matchAll(/\bid="([\w-]+)"/g)].map(match => match[1]));
  for (const [, id] of app.matchAll(/\$\('#([\w-]+)'\)/g)) assert.ok(ids.has(id), `Missing UI element #${id}`);
});

test('standalone artifact is reproducible and has no module or stylesheet fetches', async () => {
  const before = await read('standalone.html');
  execFileSync(process.execPath, [join(root, 'build.mjs')]);
  const after = await read('standalone.html');
  assert.equal(after, before);
  assert.doesNotMatch(after, /<script[^>]+src=|<link[^>]+rel="stylesheet"|^import /m);
  assert.match(after, /data:image\/svg\+xml;base64,/);
  assert.match(after, /function depart\(/);
  assert.match(after, /function homeArt\(/);
});
