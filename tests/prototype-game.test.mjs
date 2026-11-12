import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, harvest, buy, choose, depart, tick, fastForward, claim, restore, pickCard, CARDS } from '../src/game.js';

test('a garden harvest gives 30 coins once, then regrows without banking offline cycles', () => {
  const state = createState(1000);
  assert.equal(harvest(state, 1000), true);
  assert.equal(state.coins, 110);
  assert.equal(harvest(state, 1000), false);
  assert.equal(harvest(state, 30999), false);
  assert.equal(harvest(state, 31000), true);
  assert.equal(state.coins, 140);
  harvest(state, 9999999);
  assert.equal(state.coins, 170);
});

test('food purchases debit once and insufficient funds cannot make balance negative', () => {
  const state = createState(0);
  assert.equal(buy(state, 'cake'), true);
  assert.equal(state.coins, 30);
  assert.equal(state.inventory.cake, 1);
  assert.equal(buy(state, 'cake'), false);
  assert.equal(state.coins, 30);
  assert.equal(buy(state, 'unknown'), false);
});

test('permanent tools cannot be purchased twice', () => {
  const state = createState(0);
  assert.equal(buy(state, 'map'), false);
  assert.equal(buy(state, 'cup'), true);
  assert.equal(state.inventory.cup, 1);
  state.coins = 100;
  assert.equal(buy(state, 'cup'), false);
  assert.equal(state.coins, 100);
});

test('only owned food and tools may be selected and tool can be omitted', () => {
  const state = createState(0);
  assert.equal(choose(state, 'cake'), false);
  assert.equal(choose(state, 'cup'), false);
  assert.equal(choose(state, 'unknown'), false);
  assert.equal(choose(state, 'none'), true);
  assert.equal(state.tool, null);
  assert.equal(choose(state, 'rice'), true);
});

test('trip goes through preparation, traveling, return and one-time claiming', () => {
  const state = createState(1000);
  assert.equal(depart(state, 1000, () => 0), true);
  assert.equal(state.status, 'preparing');
  assert.equal(state.inventory.rice, 1);
  assert.equal(state.inventory.map, 1);
  assert.equal(depart(state, 1000), false);
  assert.equal(choose(state, 'none'), false);
  assert.equal(claim(state), null);
  tick(state, 2999); assert.equal(state.status, 'preparing');
  tick(state, 3000); assert.equal(state.status, 'traveling');
  tick(state, 22999); assert.equal(state.status, 'traveling');
  tick(state, 23000); assert.equal(state.status, 'returned');
  const id = claim(state);
  assert.equal(id, 'hill-1'); assert.equal(state.status, 'home');
  assert.equal(state.album[id], 1); assert.equal(state.trips, 1);
  assert.equal(claim(state), null); assert.equal(state.trips, 1);
});

test('each food uses its own travel duration', () => {
  for (const [food, duration] of [['rice', 20000], ['sandwich', 30000], ['cake', 40000]]) {
    const state = createState(0); state.inventory[food] = 1; choose(state, food);
    depart(state, 100);
    assert.equal(state.arrivesAt - state.departedAt, duration);
  }
});

test('no food prevents departure, last meal clears selection, and purchased food can restart loop', () => {
  const state = createState(0); state.inventory.rice = 1;
  depart(state, 0); fastForward(state, 5000); claim(state);
  assert.equal(state.food, null);
  assert.equal(depart(state, 6000), false);
  assert.equal(buy(state, 'rice'), true); choose(state, 'rice');
  assert.equal(depart(state, 6000), true);
});

test('repeated memories increment count without duplicating collection slots', () => {
  const state = createState(0);
  for (let i = 0; i < 2; i++) { depart(state, i * 50000, () => 0); fastForward(state, i * 50000 + 3000); claim(state); }
  assert.equal(Object.keys(state.album).length, 1);
  assert.equal(state.album['hill-1'], 2); assert.equal(state.trips, 2);
});

test('fast forward works during preparation or travel but cannot skip home or claim automatically', () => {
  const state = createState(0);
  assert.equal(fastForward(state, 100), false);
  depart(state, 1000); assert.equal(fastForward(state, 1100), true);
  assert.equal(state.status, 'returned'); assert.equal(state.trips, 0);
  assert.equal(fastForward(state, 1200), false);
});

test('destination bias still allows all themes and all nine cards', () => {
  assert.equal(pickCard('map', () => .5).split('-')[0], 'hill');
  assert.equal(pickCard('cup', () => .5).split('-')[0], 'town');
  for (const tool of ['map', 'cup', null]) {
    const ids = new Set();
    for (const roll of [.1, .7, .95]) for (const cardRoll of [.1, .5, .9]) {
      let count = 0; ids.add(pickCard(tool, () => count++ ? cardRoll : roll));
    }
    // For no tool choose one sample inside each equal third.
    if (!tool) for (const roll of [.1, .5, .9]) for (const cardRoll of [.1, .5, .9]) {
      let count = 0; ids.add(pickCard(tool, () => count++ ? cardRoll : roll));
    }
    assert.equal(ids.size, CARDS.length);
  }
});

test('offline restore advances an elapsed trip, preserves resources and does not auto-claim', () => {
  const state = createState(1000); buy(state, 'sandwich'); depart(state, 1000, () => 0);
  const loaded = restore(JSON.stringify(state), 1000000);
  assert.equal(loaded.status, 'returned'); assert.equal(loaded.coins, 45);
  assert.equal(loaded.inventory.rice, 1); assert.equal(loaded.inventory.sandwich, 1);
  assert.equal(loaded.pendingCard, 'hill-1'); assert.equal(loaded.trips, 0);
  claim(loaded);
  const again = restore(JSON.stringify(loaded), 2000000);
  assert.equal(again.status, 'home'); assert.equal(again.album['hill-1'], 1);
  assert.equal(claim(again), null); assert.equal(again.inventory.rice, 1);
});

test('a valid in-progress save and empty-food save are preserved', () => {
  const state = createState(0); depart(state, 0);
  assert.equal(restore(JSON.stringify(state), 2500).status, 'traveling');
  fastForward(state, 3000); claim(state); state.inventory.rice = 0; state.food = null;
  assert.equal(restore(JSON.stringify(state), 5000).food, null);
});

test('malformed, old and tampered saves safely fall back to starter state', () => {
  const cases = [null, '', '{}', 'null', 'broken', JSON.stringify({ ...createState(0), coins: -4 }), JSON.stringify({ ...createState(0), version: 99 }), JSON.stringify({ ...createState(0), status: 'traveling' }), JSON.stringify({ ...createState(0), album: { fake: 2 } }), JSON.stringify({ ...createState(0), food: '<script>' }), JSON.stringify({ ...createState(0), tool: 'cup' })];
  for (const raw of cases) assert.deepEqual(restore(raw, 12345), createState(12345));
});

test('array-shaped collections cannot silently lose future claimed memories', () => {
  const state = createState(0); state.album = [];
  assert.deepEqual(restore(JSON.stringify(state), 123), createState(123));
});
