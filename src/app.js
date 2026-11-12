import { DEFAULT_EVENTS, EVENT_KEY, parseEvents, escapeText } from './events.js';
import { SAVE_KEY, ITEMS, CARDS, createState, restore, tick, harvest, buy, choose, depart, fastForward, claim, itemById, cardById } from './game.js';
import { icon, itemArt, landscape, routeArt } from './art.js';
import { homeArt, sceneLayout } from './scene.js';

const $ = selector => document.querySelector(selector);
let storageAvailable = true;
let state;
try { state = restore(localStorage.getItem(SAVE_KEY)); } catch { state = createState(); storageAvailable = false; }
let eventDefinitions = DEFAULT_EVENTS, eventLoadError = false;
try { const raw = localStorage.getItem(EVENT_KEY); if (raw) eventDefinitions = parseEvents(raw); }
catch { eventLoadError = true; }
let modalView = null, albumFilter = 'all', shownCard = null, toastTimer, audio;
let hintDismissed = state.trips > 0 || state.status !== 'home', lastAnnouncement = '';
let showObjectLabels = false;
const modal = $('#modal');

document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
window.addEventListener('resize', renderScene);

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { storageAvailable = false; }
  document.querySelectorAll('[data-save-status]').forEach(el => { el.textContent = storageAvailable ? '进度自动保存在当前浏览器，不会同步到其他设备。' : '当前浏览器无法保存，本次进度仅在页面打开期间保留。'; });
}
function chime() {
  if (!state.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + .12);
    gain.gain.setValueAtTime(.045, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .35);
    oscillator.start(); oscillator.stop(audio.currentTime + .36);
  } catch { /* Sound is optional on unsupported browsers. */ }
}
function toast(message) {
  const target = modal.open ? $('#dialog-feedback') : $('#toast');
  document.querySelectorAll('.toast,.dialog-feedback').forEach(el => el.classList.remove('visible'));
  target.innerHTML = icon('leaf') + `<span>${message}</span>`;
  target.classList.add('visible'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => target.classList.remove('visible'), 3400);
}
const remaining = () => Math.max(0, Math.ceil((state.arrivesAt - Date.now()) / 1000));
const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
function renderScene() {
  const bounds = $('#home-scene').getBoundingClientRect();
  const layout = sceneLayout(bounds.width, bounds.height);
  $('#scene-art').innerHTML = homeArt(layout);
  $('#home-scene').classList.toggle('portrait', layout.portrait);
  for (const [id, [x,y,w,h]] of Object.entries(layout.objects)) {
    const button = document.querySelector(`[data-object="${id}"]`);
    button.style.left = `${(x + layout.offsetX) / layout.worldWidth * 100}%`;
    button.style.top = `${(y + layout.offsetY) / layout.worldHeight * 100}%`;
    button.style.width = `${w / layout.worldWidth * 100}%`;
    button.style.height = `${h / layout.worldHeight * 100}%`;
  }
  const [x,y,w,h] = layout.objects.bag;
  $('#first-hint').style.left = `${(x+w/2+layout.offsetX)/layout.worldWidth*100}%`;
  $('#first-hint').style.top = `${(y+h+layout.offsetY)/layout.worldHeight*100}%`;
  renderHome();
}
function renderHome() {
  const home = state.status === 'home', preparing = state.status === 'preparing', returned = state.status === 'returned';
  $('#coin-count').textContent = state.coins;
  $('#frog-at-home').style.display = home || returned || preparing ? '' : 'none';
  $('#frog-away').style.display = home || returned || preparing ? 'none' : '';
  $('#bag-at-home').style.display = home || returned || preparing ? '' : 'none';
  // The peg remains a usable travel shortcut when the bag is away.
  $('#bag-hotspot').classList.toggle('away', !home && !returned && !preparing);
  $('#bag-hotspot').setAttribute('aria-label', home ? '门边背包：收拾行囊' : returned ? '门边背包：查看来信' : preparing ? '门边背包：正在准备' : '门边挂钩：查看旅行');
  $('#frog-hotspot').hidden = !home && !returned && !preparing;
  $('#frog-label').textContent = returned ? '小满回来啦' : preparing ? '小满在整理行囊' : '小满正在读书';
  $('#mail-envelope').style.display = returned ? '' : 'none';
  $('.mail-dot').hidden = !returned;
  $('#mail-hotspot').classList.toggle('has-letter', returned);
  $('#mail-hotspot').setAttribute('aria-label', returned ? '信箱有新来信：拆开小满带回的明信片' : '查看小满的信箱');
  $('#map-label').textContent = home ? '旅行地图' : returned ? '小满已经回家' : preparing ? '准备出发' : `归来还有 ${clock(remaining())}`;
  const ready = Date.now() >= state.gardenReadyAt;
  $('#grown-clovers').style.display = ready ? '' : 'none';
  $('#growing-clovers').style.display = ready ? 'none' : '';
  $('#garden-label').textContent = ready ? '三叶草金币熟啦 · ＋30' : `慢慢生长 · ${Math.ceil((state.gardenReadyAt-Date.now())/1000)} 秒`;
  $('#garden-hotspot').classList.toggle('ripe', ready);
  $('#garden-hotspot').setAttribute('aria-label', ready ? '收取三叶草金币，获得30三叶草金币' : '三叶草金币正在生长');
  document.querySelectorAll('[data-action="skip"]').forEach(el => { el.disabled = !['preparing','traveling'].includes(state.status); });
  const count = Object.keys(state.album).length;
  $('#album-count').textContent = count;
  $('#board-empty').style.display = count ? 'none' : '';
  $('#board-memories').style.display = count ? '' : 'none';
  $('#first-hint').hidden = hintDismissed || !home;
  $('#bag-hotspot').classList.toggle('hinted', !hintDismissed && home);
  $('#home-scene').classList.toggle('show-labels', showObjectLabels);
  const announcement = home ? '小满在家读书。点点屋里的背包，准备一次旅行。' : preparing ? '小满正在准备，马上出发。' : returned ? '小满回家了，信箱里有一封新的来信。' : '小满正在旅行。可以点桌上的地图查看归来时间。';
  if (announcement !== lastAnnouncement) { $('#scene-announcement').textContent = announcement; lastAnnouncement = announcement; }
  $('#scene-art>svg').setAttribute('aria-label', announcement + '屋内有背包、旅行地图和明信片板，庭院里有三叶草田、信箱和林间小铺。');
}

function header(title, subtitle, eyebrow = 'A LITTLE JOURNEY', extra = '') {
  return `<div class="modal-header"><div><p class="modal-eyebrow">${eyebrow}</p><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><div>${extra}<button class="icon-button" data-action="close" aria-label="关闭弹窗">${icon('close')}</button></div></div>`;
}
function open(view, id = null) {
  modalView = view; shownCard = id;
  $('#dialog-feedback').classList.remove('visible');
  renderModal();
  if (!modal.open) modal.showModal();
  setTimeout(() => $('#modal-content [data-action="close"]')?.focus(), 0);
}
function close() { modal.close(); modalView = null; }
modal.addEventListener('close', () => { modalView = null; });
modal.addEventListener('click', event => { if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } });
function choiceButton(item) {
  const selected = state[item.type === 'food' ? 'food' : 'tool'] === item.id;
  return `<button class="choice ${selected ? 'selected' : ''}" data-action="choose" data-id="${item.id}" aria-pressed="${selected}" ${state.inventory[item.id] ? '' : 'disabled'}><span class="quantity">${item.type === 'tool' ? state.inventory[item.id] ? '已拥有' : '未拥有' : `×${state.inventory[item.id]}`}</span>${selected ? `<span class="selection-check">${icon('check')}</span>` : ''}<span class="item-art">${itemArt(item.id)}</span><strong>${item.name}</strong><small>${item.type === 'food' ? item.effect : item.id === 'map' ? '偏向山野 · 永久使用' : '偏向小镇 · 永久使用'}</small></button>`;
}
function bagModal() {
  if (state.status === 'returned') return receiptModal();
  if (state.status !== 'home') return travelModal();
  const food = itemById(state.food), tool = itemById(state.tool), canDepart = food && state.inventory[food.id] > 0;
  return header('收拾小行囊', '一份喜欢的食物，一件心爱的小物。', 'PACK A LITTLE HAPPINESS') + `<div class="modal-body"><div class="gift-note">${icon('heart')}初见礼物：梅子饭团 ×2、折叠地图 ×1 已放进行囊。</div><h3 class="field-heading">路上的食物<span>必选 · 每次出发消耗 1 份</span></h3><div class="choice-grid">${ITEMS.filter(i => i.type === 'food').map(choiceButton).join('')}</div><h3 class="field-heading">心爱的小物<span>可选 · 不会消耗</span></h3><div class="choice-grid"><button class="choice empty-choice ${!state.tool ? 'selected' : ''}" data-action="choose" data-id="none" aria-pressed="${!state.tool}">${!state.tool ? `<span class="selection-check">${icon('check')}</span>` : ''}<span class="item-art">${icon('wind')}</span><strong>轻装出门</strong><small>跟着风，随心走走</small></button>${ITEMS.filter(i => i.type === 'tool').map(choiceButton).join('')}</div><div class="trip-summary"><span>${tool ? `${tool.name} · ${tool.id === 'map' ? '更容易遇见山野' : '更容易遇见小镇'}` : '目的地交给沿途的风'}</span><strong>${food ? `预计 ${food.duration / 1000} 秒后归来` : '先选一份食物吧'}</strong></div>${!canDepart ? '<p class="empty-album-message">食物用完啦。去林间小铺买一份，或收些三叶草金币再回来。</p>' : ''}</div><div class="modal-footer"><button class="primary-button" data-action="depart" ${canDepart ? '' : 'disabled'}>${icon('bag')}准备好了，让小满出发${icon('arrow')}</button><p>行李会带来邂逅的偏向，目的地仍然有惊喜。 <button class="text-link" style="display:inline-flex" data-action="shop">去小铺补给 →</button></p></div>`;
}
function shopModal() {
  return header('林间小铺', '买一点日常，把心意装进行囊。', 'LITTLE THINGS, LONG JOURNEYS') + `<div class="modal-body"><div class="album-top"><span>给下一次出发，添点小期待</span><span class="shop-balance">${icon('clover')}${state.coins} 三叶草金币</span></div><div class="shop-list">${ITEMS.map((item, index) => `${index === 0 || index === 3 ? `<h3 class="shop-group-title">${index === 0 ? '路上的食物 · 每次消耗 1 份' : '心爱的小物 · 永久拥有'}</h3>` : ''}<div class="shop-item"><div class="shop-art">${itemArt(item.id)}</div><div class="shop-copy"><h3>${item.name}</h3><p>${item.description}</p><small>${item.effect}</small></div><div><button class="buy-button" data-action="buy" data-id="${item.id}" ${state.coins < item.price || (item.type === 'tool' && state.inventory[item.id]) ? 'disabled' : ''}>${item.type === 'tool' && state.inventory[item.id] ? `${icon('check')}已拥有` : `${icon('clover')}${item.price} · 购买`}</button><span class="shop-owned">${item.type === 'food' ? `背包里有 ${state.inventory[item.id]} 份` : '一件就够，陪伴很久'}</span></div></div>`).join('')}</div></div><div class="modal-footer"><button class="primary-button" data-action="bag">${icon('bag')}${state.status === 'home' ? '去收拾行囊' : '查看小满的旅行'}${icon('arrow')}</button><p>三叶草金币不够时，回到小院收一收，30 秒后又会成熟。</p></div>`;
}
const themes = [['all', '全部回忆'], ['hill', '山野'], ['town', '小镇'], ['lake', '湖畔']];
function albumModal() {
  const cards = CARDS.filter(card => albumFilter === 'all' || card.theme === albumFilter);
  return header('小满的旅行手记', '把远方的风景，珍藏成小小的日常。', 'POSTCARDS FROM SOMEWHERE') + `<div class="modal-body"><div class="album-top"><span>已珍藏 <strong>${Object.keys(state.album).length}</strong> / 9 段回忆</span><span>已旅行 ${state.trips} 次</span></div><div class="filter-row">${themes.map(([id, name]) => `<button class="filter-button ${albumFilter === id ? 'selected' : ''}" data-action="filter" data-id="${id}" aria-pressed="${albumFilter === id}">${name}</button>`).join('')}</div>${!state.trips ? `<div class="empty-album-message">第一张明信片，还在远方等着你。<br>替小满准备行囊，出发后就会有故事。</div>` : ''}<div class="album-grid">${cards.map(card => `<button class="album-card ${state.album[card.id] ? '' : 'locked'}" data-action="card" data-id="${card.id}" aria-label="${state.album[card.id] ? `查看${card.title}` : `${card.place} · 尚未收集`}">${landscape(card.theme, !!state.album[card.id])}${!state.album[card.id] ? `<span class="lock-icon">${icon('lock')}</span>` : ''}<h3>${state.album[card.id] ? card.title : '尚未抵达的风景'}</h3><small>${card.place} ${state.album[card.id] ? `· ×${state.album[card.id]}` : ''}</small></button>`).join('')}</div></div><div class="modal-footer"><button class="primary-button" data-action="bag">${icon('bag')}${state.status === 'home' ? '准备下一段回忆' : '看看这一次旅行'}${icon('arrow')}</button><p>回忆不会过期，重复的来信也会好好珍藏。</p></div>`;
}
function receiptModal() {
  const card = cardById(state.pendingCard);
  if (!card) return bagModal();
  return header('远方来信，请查收', '小满回来了，也带回了一点远方。', 'A LITTLE LETTER FOR YOU') + `<div class="modal-body"><span class="return-badge">${icon('mail')}${state.album[card.id] ? '又一次遇见 · 重复回忆也有温度' : '一段全新的回忆'}</span>${postcard(card)}${eventLog()}</div><div class="modal-footer"><button class="primary-button" data-action="claim">${icon('heart')}把这份回忆珍藏起来${icon('arrow')}</button><p>收进旅行手记后，就可以准备下一次出发。</p></div>`;
}
function postcard(card) { return `<div class="postcard-full">${landscape(card.theme)}<h3>${card.title}</h3><div class="postcard-place">${icon('compass')}${card.place} · 小满的旅行</div></div><p class="letter">“${card.note}”</p><p class="letter-sign">—— 想念你的小满</p>`; }
function cardModal() {
  const card = cardById(shownCard);
  return header('一段远方的回忆', `${card.place} · 收到 ${state.album[card.id]} 次`, 'KEEP A LITTLE MEMORY') + `<div class="modal-body">${postcard(card)}</div><div class="modal-footer"><button class="primary-button" data-action="album">回到旅行手记</button></div>`;
}
function travelModal() {
  return header('小满在路上', '你准备的小心意，正陪它走过远方。', 'SOMEWHERE, SOMETHING LOVELY') + `<div class="modal-body travel-state"><div class="travel-landscape">${landscape(state.tool === 'cup' ? 'town' : state.tool === 'map' ? 'hill' : 'lake')}</div><h3>${state.status === 'preparing' ? '出发前，深呼吸一下' : '好风景，值得慢慢走'}</h3><div class="travel-clock" data-travel-clock>${clock(remaining())}</div><span class="trip-time-label">预计归来倒计时 · 离开页面也会继续</span><p>小满会记住沿途的小事，<br>回来再慢慢讲给你听。</p>${eventLog()}<button class="secondary-button" data-action="skip">Demo · 快进到小满归来</button></div><div class="modal-footer"><button class="primary-button" data-action="close">先去小院坐坐</button></div>`;
}
function mapModal() {
  if (state.status === 'returned') return receiptModal();
  if (state.status !== 'home') return travelModal();
  return header('小满的旅行地图', '下一站，就交给沿途的风吧。', 'FOLLOW THE LITTLE WIND') + `<div class="modal-body map-modal"><div class="route-art">${routeArt()}</div><p>山野、湖畔，或一座陌生的小镇。<br>带上一份食物，就可以准备出发。</p><div class="map-destinations">${[['hill','风铃山野'],['town','橘灯小镇'],['lake','月牙湖畔']].map(([theme,name]) => `<div>${landscape(theme,false)}<span>${name}</span></div>`).join('')}</div></div><div class="modal-footer"><button class="primary-button" data-action="bag">${icon('bag')}去准备行囊${icon('arrow')}</button><p>点击小屋墙上的背包，也可以收拾行囊。</p></div>`;
}
function eventLog() {
  const current = state.tripEvent;
  const visible = current && Date.now() >= current.occurredAt ? [current] : [];
  const entries = [...visible, ...state.eventHistory.slice().reverse()].slice(0, 10);
  return `<section class="event-log"><h3>沿途小事</h3>${entries.length ? entries.map(event => `<article><strong>${escapeText(event.title)}</strong><p>${escapeText(event.text)}</p><small>＋${event.coins} 三叶草金币 · ${event.rewarded ? '已领取' : '归来拆信时领取'}</small></article>`).join('') : '<p>还没有沿途消息，出发后再来看看。</p>'}</section>`;
}
function eventsModal() {
  return header('事件工坊', '编辑事件 JSON，保存后从下一趟旅行生效。', 'YOUR LITTLE STORIES') + `<div class="modal-body"><p>每趟从符合目的地和道具条件的事件中，按权重抽取一条。空数组表示不发生事件。</p><label for="event-json">事件配置</label><textarea id="event-json" spellcheck="false">${escapeText(JSON.stringify(eventDefinitions, null, 2))}</textarea><p>theme：any / hill / town / lake；tool：null / map / cup；at：旅行进度 0.1–0.9；coins：0–100；weight：1–100。</p><div class="event-actions"><button class="primary-button" data-action="save-events">保存事件</button><button class="secondary-button" data-action="export-events">导出 JSON</button><label class="secondary-button">导入 JSON<input id="event-file" type="file" accept=".json,application/json"></label><button class="secondary-button" data-action="default-events">填入示例</button></div><p id="event-feedback" role="status">配置只保存在当前浏览器；导出 JSON 可备份。更改不影响已出发的旅行。</p></div>`;
}
function settingsModal() {
  return header('小屋里的小设置', '让日子，按自己喜欢的样子慢慢过。', 'MAKE YOURSELF AT HOME') + `<div class="modal-body settings-body"><div class="setting-row"><div><strong>轻轻的交互音效</strong><p>收三叶草金币、出发时的一点好心情。</p></div><button class="secondary-button" data-action="sound" aria-pressed="${state.sound}">${icon(state.sound?'sound':'sound-off')}${state.sound?'已开启':'已关闭'}</button></div><div class="setting-row"><div><strong>看看屋里有什么</strong><p>显示背包、地图、小摊等物品的名称。</p></div><button class="secondary-button" data-action="labels">${showObjectLabels?'收起名称':'显示名称'}</button></div><p class="save-explanation" data-save-status>${storageAvailable?'进度自动保存在当前浏览器，不会同步到其他设备。':'当前浏览器无法保存，本次进度仅在页面打开期间保留。'}</p><button class="secondary-button" data-action="events">事件工坊 · 自己写故事</button><button class="secondary-button" data-action="journal">查看沿途小事</button><div class="experience-tools"><span class="modal-eyebrow">DEMO · 体验工具</span><p>旅行已缩短为 20–40 秒。出发后，点桌上的地图可以快进旅行。</p><button class="secondary-button" data-action="skip" ${['preparing','traveling'].includes(state.status)?'':'disabled'}>${icon('forward')}快进这次旅行</button><button class="text-link" data-action="reset">重新体验初见的那一天</button></div></div>`;
}
function renderModal() {
  const focused = document.activeElement;
  const action = focused?.dataset.action, id = focused?.dataset.id;
  const renderers = { events: eventsModal, journal: () => header('沿途小事', '最近十条旅途消息；已领取历史最多保存一百条。') + `<div class="modal-body">${eventLog()}</div>`, map: mapModal, settings: settingsModal, bag: bagModal, shop: shopModal, album: albumModal, receipt: receiptModal, card: cardModal, reset: () => header('再认识一次小满', '从初见的那一天，重新开始。', 'START A LITTLE JOURNEY AGAIN') + '<div class="modal-body"><p class="reset-copy">这会清除当前浏览器里的 Demo 进度，包括三叶草金币、物品和旅行手记，恢复初见礼物。</p><div class="reset-actions"><button class="secondary-button" data-action="close">保留这些回忆</button><button class="primary-button" data-action="confirm-reset">确认重新体验</button></div></div>' };
  $('#modal-content').innerHTML = renderers[modalView]();
  if (modal.open && action) {
    const match = [...$('#modal-content').querySelectorAll('button')].find(button => button.dataset.action === action && button.dataset.id === id && !button.disabled);
    (match || $('#modal-content [data-action="close"]'))?.focus();
  }
}
function change() { save(); renderHome(); }
document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const { action, id } = button.dataset;
  switch (action) {
    case 'events': open('events'); break;
    case 'journal': open('journal'); break;
    case 'default-events': $('#event-json').value = JSON.stringify(DEFAULT_EVENTS, null, 2); $('#event-feedback').textContent = '示例已填入，点击保存事件后生效。'; break;
    case 'save-events':
      try {
        const candidate = parseEvents($('#event-json').value);
        localStorage.setItem(EVENT_KEY, JSON.stringify(candidate));
        eventDefinitions = candidate;
        $('#event-feedback').textContent = '已保存！下一次出发会使用这些事件。';
      } catch (error) { $('#event-feedback').textContent = `未保存：${error.message}`; }
      break;
    case 'export-events':
      try {
        const candidate = parseEvents($('#event-json').value);
        const url = URL.createObjectURL(new Blob([JSON.stringify(candidate, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'travel-events.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { $('#event-feedback').textContent = `不能导出：${error.message}`; }
      break;
    case 'home': if (modal.open) close(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'close': close(); break;
    case 'bag': hintDismissed = true; renderHome(); open('bag'); break;
    case 'map': open('map'); break;
    case 'settings': open('settings'); break;
    case 'dismiss-hint': hintDismissed = true; renderHome(); break;
    case 'labels': showObjectLabels = !showObjectLabels; change(); close(); toast(showObjectLabels ? '物品名称已显示。点点这些东西，就能打开对应功能。' : '已收起物品名称，回到安静的小屋。'); break;
    case 'shop': open('shop'); break;
    case 'album': open('album'); break;
    case 'harvest':
      if (harvest(state)) { change(); chime(); toast('收好啦！获得 30 三叶草金币，下一次出发又近了一点。'); }
      else toast('三叶草金币正在慢慢长大，再等一小会儿。');
      break;
    case 'pet': toast(state.status === 'returned' ? '小满：我回来啦！信箱里有送给你的风景。' : ['小满翻了一页书，又偷偷打了个哈欠。', '小满：等风轻一点，就去远方走走。', '小满朝你挥挥手。今天也要好好吃饭呀。'][Math.floor(Math.random() * 3)]); chime(); break;
    case 'mail': if (state.status === 'returned') open('receipt'); else toast('信箱还空着。等小满回来，就有远方的消息了。'); break;
    case 'choose': if (choose(state, id)) { change(); renderModal(); } break;
    case 'buy':
      if (buy(state, id)) { change(); renderModal(); chime(); toast(`${itemById(id).name}，已经放进行囊啦。`); }
      break;
    case 'depart':
      if (depart(state, Date.now(), Math.random, eventDefinitions)) { change(); close(); chime(); toast('行囊准备好啦。小满马上出发，替你去看看远方。'); }
      break;
    case 'skip':
      if (fastForward(state)) { change(); chime(); if (modal.open) open('receipt'); else toast('小满回来啦！打开信箱，收下远方的来信。'); }
      break;
    case 'claim': {
      const cardId = claim(state);
      if (cardId) { change(); chime(); open('card', cardId); toast('已珍藏进旅行手记。每段回忆，都好好收着。'); }
      break;
    }
    case 'card': if (state.album[id]) open('card', id); else toast('这段风景还未遇见，下一次出发也许就会收到。'); break;
    case 'filter': albumFilter = id; renderModal(); break;
    case 'sound': state.sound = !state.sound; change(); if (modalView === 'settings') renderModal(); chime(); toast(state.sound ? '交互音效已开启，听一点轻轻的好心情。' : '音效已关闭，安安静静也很好。'); break;
    case 'reset': open('reset'); break;
    case 'confirm-reset': state = createState(); hintDismissed = false; showObjectLabels = false; change(); close(); toast('又是初见的那天。小满已经准备好认识你啦。'); break;
  }
});
document.addEventListener('change', async event => {
  if (event.target.id !== 'event-file') return;
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 300000) throw new Error('文件太大。');
    const definitions = parseEvents(await file.text());
    if (modalView !== 'events') return;
    $('#event-json').value = JSON.stringify(definitions, null, 2);
    $('#event-feedback').textContent = '已导入编辑区，请检查后点击保存事件。';
  } catch (error) { if (modalView === 'events') $('#event-feedback').textContent = `未导入：${error.message}`; }
});
setInterval(() => {
  const before = state.status; tick(state); renderHome();
  document.querySelectorAll('[data-travel-clock]').forEach(el => { el.textContent = clock(remaining()); });
  if (before !== state.status) {
    save();
    if (state.status === 'returned') { if (modal.open && ['bag', 'map'].includes(modalView)) renderModal(); toast('小满回来啦，带回了一封远方的来信。'); }
    else if (modal.open && ['bag', 'map'].includes(modalView)) renderModal();
  }
}, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(state); change(); if (modal.open && ['bag', 'map'].includes(modalView)) renderModal(); } });
renderScene(); save();
if (eventLoadError) toast('事件配置无法读取，临时使用内置示例；原配置未覆盖。');
if (!storageAvailable) toast('浏览器暂不支持保存，仍可体验本次完整流程。');
