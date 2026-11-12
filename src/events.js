export const EVENT_KEY = 'traveling-feiyv-events-v1';
export const DEFAULT_EVENTS = [
  { id: 'hill-breeze', title: '山风的礼物', text: '沿着山路捡到几片闪亮的三叶草。', theme: 'hill', tool: null, weight: 1, at: 0.5, coins: 8 },
  { id: 'town-tea', title: '街角热茶', text: '小店老板请小满喝茶，还送了一点路费。', theme: 'town', tool: null, weight: 1, at: 0.5, coins: 6 },
  { id: 'lake-light', title: '湖边微光', text: '小满在芦苇旁找到了一枚三叶草金币。', theme: 'lake', tool: null, weight: 1, at: 0.5, coins: 10 },
];
export const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function validateEvents(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('事件必须是数组，最多 100 条。');
  const ids = new Set();
  return value.map(event => {
    if (!event || typeof event !== 'object' || Object.keys(event).some(key => !['id','title','text','theme','tool','weight','at','coins'].includes(key))) throw new Error('事件包含未知字段。');
    const { id, title, text, theme, tool, weight, at, coins } = event;
    if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(id) || ids.has(id)) throw new Error('事件 ID 必须唯一，使用小写字母、数字和连字符。');
    if (typeof title !== 'string' || !title.trim() || title.length > 60 || typeof text !== 'string' || !text.trim() || text.length > 500) throw new Error('事件需要标题（1–60 字）和正文（1–500 字）。');
    if (!['any','hill','town','lake'].includes(theme) || ![null,'map','cup'].includes(tool)) throw new Error('目的地或所需道具无效。');
    if (!Number.isInteger(weight) || weight < 1 || weight > 100 || !Number.isFinite(at) || at < 0.1 || at > 0.9 || !Number.isInteger(coins) || coins < 0 || coins > 100) throw new Error('权重须为 1–100，发生进度为 0.1–0.9，金币为 0–100。');
    ids.add(id);
    return { id, title, text, theme, tool, weight, at, coins };
  });
}
export function parseEvents(raw) {
  if (typeof raw !== 'string' || raw.length > 100000) throw new Error('事件 JSON 不能超过 100000 字符。');
  return validateEvents(JSON.parse(raw));
}
export function planEvent(events, theme, tool, start, end, tripId, random = Math.random) {
  const candidates = validateEvents(events).filter(event => (event.theme === 'any' || event.theme === theme) && (!event.tool || event.tool === tool));
  const total = candidates.reduce((sum, event) => sum + event.weight, 0);
  let roll = random() * total;
  const event = candidates.find(event => (roll -= event.weight) < 0);
  return event ? { ...event, eventId: `${tripId}:0`, occurredAt: start + Math.floor((end - start) * event.at), rewarded: false } : null;
}
