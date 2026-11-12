import { DEFAULT_EVENTS, planEvent, validateEvents } from './events.js';
export const SAVE_KEY = 'traveling-feiyv-prototype-v1';
export const GROW_TIME = 30000;
export const ITEMS = [
  { id: 'rice', name: '梅子饭团', type: 'food', price: 20, duration: 20000, icon: 'rice', description: '朴素的一餐，也能走到喜欢的地方。', effect: '轻快散步 · 20 秒' },
  { id: 'sandwich', name: '野餐三明治', type: 'food', price: 35, duration: 30000, icon: 'sandwich', description: '带上两片阳光，去远一点的地方。', effect: '悠闲漫游 · 30 秒' },
  { id: 'cake', name: '蜂蜜小蛋糕', type: 'food', price: 50, duration: 40000, icon: 'cake', description: '把甜甜的心意，留给路上的朋友。', effect: '慢慢远行 · 40 秒' },
  { id: 'map', name: '折叠地图', type: 'tool', price: 60, icon: 'map', description: '沿着绿色的小路，山野就在前方。', effect: '更容易遇见山野风光 · 永久使用' },
  { id: 'cup', name: '搪瓷小杯', type: 'tool', price: 80, icon: 'cup', description: '在街角坐坐，听一听小镇的故事。', effect: '更容易遇见小镇风光 · 永久使用' },
];
export const CARDS = [
  { id: 'hill-1', theme: 'hill', place: '风铃山野', title: '把风装进口袋', note: '山坡上的风有青草味。我坐了一会儿，替你听了很久的风。', caption: '今天的风，刚刚好。' },
  { id: 'hill-2', theme: 'hill', place: '风铃山野', title: '云朵的慢车', note: '看见一朵像饭团的云。追了半座山，它还是慢慢地走。', caption: '跟着云朵，慢慢走。' },
  { id: 'hill-3', theme: 'hill', place: '风铃山野', title: '山间小憩', note: '在树下睡了一个午觉。醒来时，一片叶子轻轻落在帽子上。', caption: '树荫里，藏着一个好梦。' },
  { id: 'town-1', theme: 'town', place: '橘灯小镇', title: '街角的一杯暖', note: '小店的老板送了我一杯热茶。杯子很暖，故事也是。', caption: '小镇很小，温柔很多。' },
  { id: 'town-2', theme: 'town', place: '橘灯小镇', title: '面包香的小巷', note: '顺着面包的香味拐了三个弯。下次想带你一起来。', caption: '今天的路，有面包香。' },
  { id: 'town-3', theme: 'town', place: '橘灯小镇', title: '灯亮的时候', note: '天黑前，小巷的灯一盏盏亮了。忽然有点想念家里的那盏。', caption: '灯火亮起，就想回家。' },
  { id: 'lake-1', theme: 'lake', place: '月牙湖畔', title: '寄一片湖光', note: '湖面亮晶晶的，像撒了一把星星。我挑了最亮的一片寄给你。', caption: '把湖面的光，寄给你。' },
  { id: 'lake-2', theme: 'lake', place: '月牙湖畔', title: '芦苇的悄悄话', note: '芦苇沙沙地响，小鱼从桥下游过。什么都没做，也是很好的一天。', caption: '听水声，就很好。' },
  { id: 'lake-3', theme: 'lake', place: '月牙湖畔', title: '等一场日落', note: '今天走得不远，刚好赶上日落。橘色的天空，像你准备的小蛋糕。', caption: '日落之前，慢一点。' },
];
export const itemById = id => ITEMS.find(item => item.id === id);
export const cardById = id => CARDS.find(card => card.id === id);
export function createState(now = Date.now()) {
  return { version: 1, eventHistory: [], tripEvent: null, lastSettledAt: now, coins: 80, inventory: { rice: 2, sandwich: 0, cake: 0, map: 1, cup: 0 }, food: 'rice', tool: 'map', status: 'home', departedAt: null, arrivesAt: null, pendingCard: null, album: {}, trips: 0, gardenReadyAt: now, sound: false };
}
export function tick(state, now = Date.now()) {
  now = Math.max(now, state.lastSettledAt || 0); state.lastSettledAt = now;
  if (state.status === 'preparing' && now >= state.departedAt) state.status = 'traveling';
  if (state.status === 'traveling' && now >= state.arrivesAt) state.status = 'returned';
  return state;
}
export function harvest(state, now = Date.now()) {
  if (now < state.gardenReadyAt) return false;
  state.coins += 30; state.gardenReadyAt = now + GROW_TIME; return true;
}
export function buy(state, id) {
  const item = itemById(id);
  if (!item || state.coins < item.price || (item.type === 'tool' && state.inventory[id])) return false;
  state.coins -= item.price; state.inventory[id] += 1; return true;
}
export function choose(state, id) {
  if (state.status !== 'home') return false;
  if (id === 'none') { state.tool = null; return true; }
  const item = itemById(id);
  if (!item || state.inventory[id] < 1) return false;
  state[item.type === 'food' ? 'food' : 'tool'] = id; return true;
}
export function pickCard(tool, random = Math.random) {
  const roll = random();
  const themes = tool === 'map' ? ['hill', 'town', 'lake'] : tool === 'cup' ? ['town', 'hill', 'lake'] : ['lake', 'town', 'hill'];
  const theme = themes[roll < (tool ? 0.6 : 1 / 3) ? 0 : roll < (tool ? 0.8 : 2 / 3) ? 1 : 2];
  return CARDS.filter(card => card.theme === theme)[Math.min(2, Math.floor(random() * 3))].id;
}
export function depart(state, now = Date.now(), random = Math.random, events = DEFAULT_EVENTS) {
  validateEvents(events);
  const food = itemById(state.food);
  if (state.status !== 'home' || !food || state.inventory[food.id] < 1) return false;
  state.inventory[food.id] -= 1; state.status = 'preparing';
  state.departedAt = now + 2000; state.arrivesAt = state.departedAt + food.duration;
  state.pendingCard = pickCard(state.tool, random);
  state.tripEvent = planEvent(events, cardById(state.pendingCard).theme, state.tool, state.departedAt, state.arrivesAt, `${now}-${state.trips}`, random); return true;
}
export function fastForward(state, now = Date.now()) {
  if (!['preparing', 'traveling'].includes(state.status)) return false;
  state.departedAt = Math.min(state.departedAt, now); state.arrivesAt = now; if (state.tripEvent) state.tripEvent.occurredAt = Math.min(state.tripEvent.occurredAt, now); tick(state, now); return true;
}
export function claim(state) {
  if (state.status !== 'returned' || !cardById(state.pendingCard)) return null;
  const id = state.pendingCard;
  if (state.tripEvent && !state.tripEvent.rewarded) {
    state.coins += state.tripEvent.coins; state.tripEvent.rewarded = true;
    state.eventHistory = [...state.eventHistory, { ...state.tripEvent }].slice(-100);
  }
  state.tripEvent = null;
  state.album[id] = (state.album[id] || 0) + 1; state.trips += 1; state.status = 'home';
  state.pendingCard = null; state.departedAt = null; state.arrivesAt = null;
  if (!state.inventory[state.food]) state.food = ITEMS.find(item => item.type === 'food' && state.inventory[item.id])?.id || null;
  return id;
}
export function restore(raw, now = Date.now()) {
  try {
    const state = JSON.parse(raw);
    const integer = value => Number.isSafeInteger(value) && value >= 0;
    const timestamp = value => Number.isFinite(value) && value >= 0;
    if (!state || state.version !== 1 || !integer(state.coins) || !integer(state.trips) || !state.inventory || !state.album || Array.isArray(state.inventory) || Array.isArray(state.album) || typeof state.sound !== 'boolean' || !timestamp(state.gardenReadyAt)) throw new Error('Invalid save');
    if (!['home', 'preparing', 'traveling', 'returned'].includes(state.status)) throw new Error('Invalid status');
    for (const item of ITEMS) if (!integer(state.inventory[item.id]) || (item.type === 'tool' && state.inventory[item.id] > 1)) throw new Error('Invalid inventory');
    if (state.food !== null && !ITEMS.some(item => item.id === state.food && item.type === 'food')) throw new Error('Invalid food');
    if (state.tool !== null && (!ITEMS.some(item => item.id === state.tool && item.type === 'tool') || !state.inventory[state.tool])) throw new Error('Invalid tool');
    for (const [id, count] of Object.entries(state.album)) if (!cardById(id) || !integer(count) || count < 1) throw new Error('Invalid album');
    if (state.status !== 'home' && (!timestamp(state.departedAt) || !timestamp(state.arrivesAt) || state.arrivesAt < state.departedAt || !cardById(state.pendingCard))) throw new Error('Invalid trip');
    state.eventHistory ??= []; state.tripEvent ??= null; state.lastSettledAt ??= 0;
    if (!timestamp(state.lastSettledAt) || !Array.isArray(state.eventHistory) || state.eventHistory.length > 100) throw new Error('Invalid events');
    for (const event of [...state.eventHistory, ...(state.tripEvent ? [state.tripEvent] : [])]) {
      const { eventId, occurredAt, rewarded, ...definition } = event;
      validateEvents([definition]);
      if (typeof eventId !== 'string' || eventId.length > 100 || !timestamp(occurredAt) || typeof rewarded !== 'boolean') throw new Error('Invalid event snapshot');
    }
    if (state.tripEvent && (state.status === 'home' || state.tripEvent.rewarded || state.tripEvent.occurredAt < state.departedAt || state.tripEvent.occurredAt > state.arrivesAt)) throw new Error('Invalid pending event');
    if (state.eventHistory.some(event => !event.rewarded)) throw new Error('Invalid history');
    return tick(state, now);
  } catch { return createState(now); }
}
