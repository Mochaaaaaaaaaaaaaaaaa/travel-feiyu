import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EVENTS, validateEvents, parseEvents, planEvent, escapeText } from '../src/events.js';
import { createState, depart, tick, restore, fastForward, claim } from '../src/game.js';
import { ASSETS, assetPath } from '../src/assets.js';
import { icon, itemArt, frogMarkup } from '../src/art.js';
import { homeArt, sceneLayout } from '../src/scene.js';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('event authoring validates every field, duplicate IDs, limits and malformed input', () => {
  const base = DEFAULT_EVENTS[0];
  assert.deepEqual(parseEvents(JSON.stringify(DEFAULT_EVENTS)), DEFAULT_EVENTS);
  assert.deepEqual(validateEvents([]), []);
  const invalid = [null, {}, [base, base], Array(101).fill(base), [{...base,id:'<script>'}], [{...base,title:''}], [{...base,text:123}], [{...base,theme:'moon'}], [{...base,tool:'fake'}], [{...base,coins:-1}], [{...base,coins:101}], [{...base,weight:0}], [{...base,at:Infinity}], [{...base,at:1}], [{...base,script:'alert(1)'}]];
  for (const value of invalid) assert.throws(() => validateEvents(value));
  assert.throws(() => parseEvents('bad json'));
  assert.throws(() => parseEvents(' '.repeat(100001)));
  assert.equal(escapeText('</textarea><script>"&'), '&lt;/textarea&gt;&lt;script&gt;&quot;&amp;');
});

test('weighted event matching respects destination and owned packed tool', () => {
  const events = [
    {...DEFAULT_EVENTS[0], id:'a', theme:'any', weight:1},
    {...DEFAULT_EVENTS[0], id:'b', tool:'map', weight:3},
  ];
  const pick = (theme, tool, roll) => planEvent(events, theme, tool, 100, 1100, 'trip', () => roll);
  assert.equal(pick('hill','map',0).id, 'a');
  assert.equal(pick('hill','map',0.25).id, 'b');
  assert.equal(pick('lake','map',0.9).id, 'a');
  assert.equal(pick('hill',null,0.9).id, 'a');
  assert.equal(planEvent([], 'hill', null, 0, 100, 'trip'), null);
  assert.equal(pick('hill','map',0).occurredAt, 600);
});

test('trip freezes custom event; reload, offline settlement and repeated claim never reroll or duplicate coins', () => {
  const events = [{...DEFAULT_EVENTS[0], id:'my-story', title:'自编故事', coins:23}];
  const state = createState(1000);
  depart(state, 1000, () => 0, events);
  events[0].coins = 99;
  let restored = restore(JSON.stringify(state), 100000);
  assert.equal(restored.tripEvent.coins, 23);
  assert.equal(restored.status, 'returned');
  tick(restored, 100000); tick(restored, 500);
  assert.equal(restored.status, 'returned');
  assert.equal(restored.lastSettledAt, 100000);
  assert.equal(restored.coins, 80);
  assert.equal(claim(restored), 'hill-1');
  assert.equal(restored.coins, 103);
  restored = restore(JSON.stringify(restored), 200000);
  assert.equal(claim(restored), null);
  assert.equal(restored.coins, 103);
  assert.equal(restored.eventHistory.length, 1);
});

test('invalid content is rejected before consuming food and invalid snapshots are rejected', () => {
  const state = createState(0), original = structuredClone(state);
  assert.throws(() => depart(state, 0, () => 0, [{}]));
  assert.deepEqual(state, original);
  depart(state, 0, () => 0);
  state.tripEvent.coins = -1;
  assert.deepEqual(restore(JSON.stringify(state), 1), createState(1));
});

test('fast forward reveals event, history stays bounded, empty content allows complete loop', () => {
  const state = createState(0); state.inventory.rice = 102;
  for (let i=0; i<102; i++) { depart(state, i*50000, () => 0); fastForward(state, i*50000+1000); claim(state); }
  assert.equal(state.eventHistory.length, 100);
  assert.equal(new Set(state.eventHistory.map(event=>event.eventId)).size, 100);
  const empty = createState(0); depart(empty, 0, () => 0, []); fastForward(empty, 1000); claim(empty);
  assert.equal(empty.coins, 80); assert.equal(empty.eventHistory.length, 0);
});

test('art slots replace character, currency, clovers, backdrop and items with local files', () => {
  for (const path of ['https://example.com/a.png','./assets/../secret.svg','javascript:alert(1)','./other/a.png']) assert.throws(()=>assetPath(path));
  assert.equal(assetPath('./assets/test.webp'), './assets/test.webp');
  try {
    ASSETS.character = ASSETS.currency = ASSETS.clover = ASSETS.background = ASSETS.items.rice = './assets/leaf.svg';
    for (const markup of [frogMarkup(), icon('clover'), itemArt('rice'), homeArt(sceneLayout(1440,900)), homeArt(sceneLayout(390,844))]) assert.match(markup, /<image href="\.\/assets\/leaf.svg"/);
  } finally { ASSETS.character = ASSETS.currency = ASSETS.clover = ASSETS.background = ASSETS.items.rice = null; }
});

test('prototype builds reproducibly; independent HTML compiles and retains authoring hooks', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs']);
  const first = await readFile('build/standalone.html', 'utf8');
  execFileSync(process.execPath, ['scripts/build.mjs']);
  assert.equal(await readFile('build/standalone.html','utf8'), first);
  assert.doesNotMatch(first, /<script[^>]+src=|<link[^>]+rel="stylesheet"|^import /m);
  const code = first.match(/<script type="module">([\s\S]*)<\/script>/)[1];
  // Compile the actual single-file module, catching collisions after imports are removed.
  new Function(code);
  assert.match(first, /data-action="save-events"/);
  assert.match(first, /id="event-file"/);
});
