import { SAVE_KEY, ITEMS, CARDS, createState, restore, tick, harvest, buy, choose, depart, fastForward, claim, itemById, cardById } from './game.js';
import { icon, avatar, itemArt, homeArt, landscape, routeArt } from './art.js';

const $ = selector => document.querySelector(selector);
let storageAvailable = true;
let state;
try { state = restore(localStorage.getItem(SAVE_KEY)); } catch { state = createState(); storageAvailable = false; }
let modalView = null, albumFilter = 'all', shownCard = null, toastTimer, memorySignature = '', audio;
const modal = $('#modal');

document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
$('#scene-art').innerHTML = homeArt();
$('#status-avatar').innerHTML = avatar();
$('#route-art').innerHTML = routeArt();

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { storageAvailable = false; }
  $('#save-status').textContent = storageAvailable ? '进度保存在此浏览器' : '本次进度仅在打开期间保留';
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
  $('#toast').innerHTML = icon('leaf') + `<span>${message}</span>`;
  $('#toast').classList.add('visible'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3400);
}
const remaining = () => Math.max(0, Math.ceil((state.arrivesAt - Date.now()) / 1000));
const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
function renderHome() {
  const home = state.status === 'home', preparing = state.status === 'preparing', returned = state.status === 'returned';
  $('#coin-count').textContent = state.coins;
  $('#sound-button').innerHTML = icon(state.sound ? 'sound' : 'sound-off');
  $('#sound-button').setAttribute('aria-pressed', String(state.sound));
  $('#sound-button').setAttribute('aria-label', state.sound ? '关闭交互音效' : '开启交互音效');
  $('#status-title').textContent = home ? '小满在家' : preparing ? '小满正在准备' : returned ? '小满回来啦' : '小满在旅行';
  $('#status-tag').textContent = home ? '自在时光' : preparing ? '马上出发' : returned ? '带回一封信' : `还有 ${clock(remaining())}`;
  $('#status-description').textContent = home ? '读了三页书，又想了想远方。' : preparing ? '系好围巾，检查一下小背包。' : returned ? '口袋里有风景，还有想对你说的话。' : '不必一直等，远方的风会把它送回家。';
  $('#main-action-text').textContent = home ? '收拾行囊' : returned ? '拆开来信' : '看看旅途';
  $('#scene-caption-text').textContent = home ? '微风经过小院，小满正在读一本旧书。' : preparing ? '小满合上了书，准备去看看远方。' : returned ? '听，信箱响了。小满带着故事回家啦。' : '小屋安安静静，远方正有好风景。';
  $('#frog-at-home').style.display = home || returned || preparing ? '' : 'none';
  $('#frog-away').style.display = !home && !returned && !preparing ? '' : 'none';
  $('#scene-art>svg').setAttribute('aria-label', home || preparing ? '绿树环绕着红瓦小屋，小满在门前读书，左边是钱草田，右边是信箱。' : returned ? '小满回到了小屋门前，信箱里有一封新来信，左边的钱草在生长。' : '小满已经外出旅行，门前留着一本书，小院和信箱正在等它回家。');
  $('#frog-hotspot').hidden = !home && !returned && !preparing;
  $('#mail-envelope').style.display = returned ? '' : 'none';
  $('.mail-dot').hidden = !returned;
  $('#mail-hotspot').setAttribute('aria-label', returned ? '拆开小满带回的来信' : '查看小满的信箱');
  const ready = Date.now() >= state.gardenReadyAt;
  $('#grown-clovers').style.display = ready ? '' : 'none';
  $('#growing-clovers').style.display = ready ? 'none' : '';
  $('#garden-label').textContent = ready ? '钱草熟啦，收一收' : `生长中 · ${Math.ceil((state.gardenReadyAt - Date.now()) / 1000)} 秒`;
  $('#garden-hotspot').setAttribute('aria-label', ready ? '收取钱草，获得30钱草' : '钱草正在生长');
  $('.hotspot-label>span:last-child').textContent = ready ? '＋30' : '';
  $('#skip-button').disabled = !['preparing', 'traveling'].includes(state.status);
  const count = Object.keys(state.album).length;
  $('#album-count').textContent = count; $('#nav-album-count').textContent = count;
  $('#trip-count').textContent = state.trips ? `已旅行 ${state.trips} 次` : '还没有出发过';
  $('#album-progress').style.width = `${count / CARDS.length * 100}%`;
  $('#tip-title').textContent = returned ? '远方的风景，已经到家了' : home ? '一份小心意，一段新旅程' : '它在看风景，你也照顾好自己';
  $('#tip-description').textContent = returned ? '打开信箱，看看小满这次遇见了什么。' : home ? '给小满带上喜欢的食物吧。它会替你，去看看远方。' : '可以去小铺逛逛，收收钱草，或晚一点再回来。';
  const signature = JSON.stringify(state.album);
  if (signature !== memorySignature) {
    memorySignature = signature;
    const id = Object.keys(state.album).at(-1), card = cardById(id);
    $('#memory-preview').innerHTML = card ? `<button class="memory-card" data-action="card" data-id="${card.id}" aria-label="查看明信片：${card.title}">${landscape(card.theme)}<p class="memory-caption">${card.caption}</p></button>` : `<button class="memory-card empty" data-action="bag" aria-label="准备旅行，收集第一张明信片">${landscape('hill', false)}<span class="memory-empty-tag">${icon('mail')}等第一封来信</span><p class="memory-caption">第一段回忆，<br>还在路上。</p></button>`;
  }
}

function header(title, subtitle, eyebrow = 'A LITTLE JOURNEY', extra = '') {
  return `<div class="modal-header"><div><p class="modal-eyebrow">${eyebrow}</p><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><div>${extra}<button class="icon-button" data-action="close" aria-label="关闭弹窗">${icon('close')}</button></div></div>`;
}
function open(view, id = null) {
  modalView = view; shownCard = id; renderModal();
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
  return header('收拾小行囊', '一份喜欢的食物，一件心爱的小物。', 'PACK A LITTLE HAPPINESS') + `<div class="modal-body"><div class="gift-note">${icon('heart')}初见礼物：梅子饭团 ×2、折叠地图 ×1 已放进行囊。</div><h3 class="field-heading">路上的食物<span>必选 · 每次出发消耗 1 份</span></h3><div class="choice-grid">${ITEMS.filter(i => i.type === 'food').map(choiceButton).join('')}</div><h3 class="field-heading">心爱的小物<span>可选 · 不会消耗</span></h3><div class="choice-grid"><button class="choice empty-choice ${!state.tool ? 'selected' : ''}" data-action="choose" data-id="none" aria-pressed="${!state.tool}">${!state.tool ? `<span class="selection-check">${icon('check')}</span>` : ''}<span class="item-art">${icon('wind')}</span><strong>轻装出门</strong><small>跟着风，随心走走</small></button>${ITEMS.filter(i => i.type === 'tool').map(choiceButton).join('')}</div><div class="trip-summary"><span>${tool ? `${tool.name} · ${tool.id === 'map' ? '更容易遇见山野' : '更容易遇见小镇'}` : '目的地交给沿途的风'}</span><strong>${food ? `预计 ${food.duration / 1000} 秒后归来` : '先选一份食物吧'}</strong></div>${!canDepart ? '<p class="empty-album-message">食物用完啦。去林间小铺买一份，或收些钱草再回来。</p>' : ''}</div><div class="modal-footer"><button class="primary-button" data-action="depart" ${canDepart ? '' : 'disabled'}>${icon('bag')}准备好了，让小满出发${icon('arrow')}</button><p>行李会带来邂逅的偏向，目的地仍然有惊喜。 <button class="text-link" style="display:inline-flex" data-action="shop">去小铺补给 →</button></p></div>`;
}
function shopModal() {
  return header('林间小铺', '买一点日常，把心意装进行囊。', 'LITTLE THINGS, LONG JOURNEYS') + `<div class="modal-body"><div class="album-top"><span>给下一次出发，添点小期待</span><span class="shop-balance">${icon('clover')}${state.coins} 钱草</span></div><div class="shop-list">${ITEMS.map((item, index) => `${index === 0 || index === 3 ? `<h3 class="shop-group-title">${index === 0 ? '路上的食物 · 每次消耗 1 份' : '心爱的小物 · 永久拥有'}</h3>` : ''}<div class="shop-item"><div class="shop-art">${itemArt(item.id)}</div><div class="shop-copy"><h3>${item.name}</h3><p>${item.description}</p><small>${item.effect}</small></div><div><button class="buy-button" data-action="buy" data-id="${item.id}" ${state.coins < item.price || (item.type === 'tool' && state.inventory[item.id]) ? 'disabled' : ''}>${item.type === 'tool' && state.inventory[item.id] ? `${icon('check')}已拥有` : `${icon('clover')}${item.price} · 购买`}</button><span class="shop-owned">${item.type === 'food' ? `背包里有 ${state.inventory[item.id]} 份` : '一件就够，陪伴很久'}</span></div></div>`).join('')}</div></div><div class="modal-footer"><button class="primary-button" data-action="bag">${icon('bag')}${state.status === 'home' ? '去收拾行囊' : '查看小满的旅行'}${icon('arrow')}</button><p>钱草不够时，回到小院收一收，30 秒后又会成熟。</p></div>`;
}
const themes = [['all', '全部回忆'], ['hill', '山野'], ['town', '小镇'], ['lake', '湖畔']];
function albumModal() {
  const cards = CARDS.filter(card => albumFilter === 'all' || card.theme === albumFilter);
  return header('小满的旅行手记', '把远方的风景，珍藏成小小的日常。', 'POSTCARDS FROM SOMEWHERE') + `<div class="modal-body"><div class="album-top"><span>已珍藏 <strong>${Object.keys(state.album).length}</strong> / 9 段回忆</span><span>已旅行 ${state.trips} 次</span></div><div class="filter-row">${themes.map(([id, name]) => `<button class="filter-button ${albumFilter === id ? 'selected' : ''}" data-action="filter" data-id="${id}" aria-pressed="${albumFilter === id}">${name}</button>`).join('')}</div>${!state.trips ? `<div class="empty-album-message">第一张明信片，还在远方等着你。<br>替小满准备行囊，出发后就会有故事。</div>` : ''}<div class="album-grid">${cards.map(card => `<button class="album-card ${state.album[card.id] ? '' : 'locked'}" data-action="card" data-id="${card.id}" aria-label="${state.album[card.id] ? `查看${card.title}` : `${card.place} · 尚未收集`}">${landscape(card.theme, !!state.album[card.id])}${!state.album[card.id] ? `<span class="lock-icon">${icon('lock')}</span>` : ''}<h3>${state.album[card.id] ? card.title : '尚未抵达的风景'}</h3><small>${card.place} ${state.album[card.id] ? `· ×${state.album[card.id]}` : ''}</small></button>`).join('')}</div></div><div class="modal-footer"><button class="primary-button" data-action="bag">${icon('bag')}${state.status === 'home' ? '准备下一段回忆' : '看看这一次旅行'}${icon('arrow')}</button><p>回忆不会过期，重复的来信也会好好珍藏。</p></div>`;
}
function receiptModal() {
  const card = cardById(state.pendingCard);
  if (!card) return bagModal();
  return header('远方来信，请查收', '小满回来了，也带回了一点远方。', 'A LITTLE LETTER FOR YOU') + `<div class="modal-body"><span class="return-badge">${icon('mail')}${state.album[card.id] ? '又一次遇见 · 重复回忆也有温度' : '一段全新的回忆'}</span>${postcard(card)}</div><div class="modal-footer"><button class="primary-button" data-action="claim">${icon('heart')}把这份回忆珍藏起来${icon('arrow')}</button><p>收进旅行手记后，就可以准备下一次出发。</p></div>`;
}
function postcard(card) { return `<div class="postcard-full">${landscape(card.theme)}<h3>${card.title}</h3><div class="postcard-place">${icon('compass')}${card.place} · 小满的旅行</div></div><p class="letter">“${card.note}”</p><p class="letter-sign">—— 想念你的小满</p>`; }
function cardModal() {
  const card = cardById(shownCard);
  return header('一段远方的回忆', `${card.place} · 收到 ${state.album[card.id]} 次`, 'KEEP A LITTLE MEMORY') + `<div class="modal-body">${postcard(card)}</div><div class="modal-footer"><button class="primary-button" data-action="album">回到旅行手记</button></div>`;
}
function travelModal() {
  return header('小满在路上', '你准备的小心意，正陪它走过远方。', 'SOMEWHERE, SOMETHING LOVELY') + `<div class="modal-body travel-state"><div class="travel-landscape">${landscape(state.tool === 'cup' ? 'town' : state.tool === 'map' ? 'hill' : 'lake')}</div><h3>${state.status === 'preparing' ? '出发前，深呼吸一下' : '好风景，值得慢慢走'}</h3><div class="travel-clock" data-travel-clock>${clock(remaining())}</div><span class="trip-time-label">预计归来倒计时 · 离开页面也会继续</span><p>小满会记住沿途的小事，<br>回来再慢慢讲给你听。</p><button class="secondary-button" data-action="skip">Demo · 快进到小满归来</button></div><div class="modal-footer"><button class="primary-button" data-action="close">先去小院坐坐</button></div>`;
}
function renderModal() {
  const focused = document.activeElement;
  const action = focused?.dataset.action, id = focused?.dataset.id;
  const renderers = { bag: bagModal, shop: shopModal, album: albumModal, receipt: receiptModal, card: cardModal, reset: () => header('再认识一次小满', '从初见的那一天，重新开始。', 'START A LITTLE JOURNEY AGAIN') + '<div class="modal-body"><p class="reset-copy">这会清除当前浏览器里的 Demo 进度，包括钱草、物品和旅行手记，恢复初见礼物。</p><div class="reset-actions"><button class="secondary-button" data-action="close">保留这些回忆</button><button class="primary-button" data-action="confirm-reset">确认重新体验</button></div></div>' };
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
    case 'home': if (modal.open) close(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'close': close(); break;
    case 'bag': open('bag'); break;
    case 'shop': open('shop'); break;
    case 'album': open('album'); break;
    case 'harvest':
      if (harvest(state)) { change(); chime(); toast('收好啦！获得 30 钱草，下一次出发又近了一点。'); }
      else toast('钱草正在慢慢长大，再等一小会儿。');
      break;
    case 'pet': toast(state.status === 'returned' ? '小满：我回来啦！信箱里有送给你的风景。' : ['小满翻了一页书，又偷偷打了个哈欠。', '小满：等风轻一点，就去远方走走。', '小满朝你挥挥手。今天也要好好吃饭呀。'][Math.floor(Math.random() * 3)]); chime(); break;
    case 'mail': if (state.status === 'returned') open('receipt'); else toast('信箱还空着。等小满回来，就有远方的消息了。'); break;
    case 'choose': if (choose(state, id)) { change(); renderModal(); } break;
    case 'buy':
      if (buy(state, id)) { change(); renderModal(); chime(); toast(`${itemById(id).name}，已经放进行囊啦。`); }
      break;
    case 'depart':
      if (depart(state)) { change(); close(); chime(); toast('行囊准备好啦。小满马上出发，替你去看看远方。'); }
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
    case 'sound': state.sound = !state.sound; change(); chime(); toast(state.sound ? '交互音效已开启，听一点轻轻的好心情。' : '音效已关闭，安安静静也很好。'); break;
    case 'reset': open('reset'); break;
    case 'confirm-reset': state = createState(); memorySignature = ''; change(); close(); toast('又是初见的那天。小满已经准备好认识你啦。'); break;
  }
});
setInterval(() => {
  const before = state.status; tick(state); renderHome();
  document.querySelectorAll('[data-travel-clock]').forEach(el => { el.textContent = clock(remaining()); });
  if (before !== state.status) {
    save();
    if (state.status === 'returned') { if (modal.open && modalView === 'bag') renderModal(); toast('小满回来啦，带回了一封远方的来信。'); }
    else if (modal.open && modalView === 'bag') renderModal();
  }
}, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(state); change(); if (modal.open && modalView === 'bag') renderModal(); } });
save(); renderHome();
if (!storageAvailable) toast('浏览器暂不支持保存，仍可体验本次完整流程。');
