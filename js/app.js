/* ═══════════════════════════════════════════
   丹尼实验室 — 交互核心
   D 数 → 透明度 / 光泽 / 针织密度 实时映射
   i18n：中文为源文案，英文覆盖见 js/i18n.js
   ═══════════════════════════════════════════ */

const MATERIALS = {
  nylon:  { label: '锦纶',   full: '锦纶 / 尼龙', opMul: 1.00, gloss: 1.00, lwMul: 1.00, blur: 0,
            note: '缎面光泽最亮，同 D 数下最透。纱线可以细到个位数丹尼，是"透明感"的本体。' },
  velvet: { label: '天鹅绒', full: '天鹅绒',       opMul: 1.32, gloss: 0.22, lwMul: 1.35, blur: 0.8,
            note: '绒面哑光、视觉更收敛——同 D 数下比锦纶显厚一档，秋冬款的主力。' },
  cotton: { label: '棉',     full: '棉',           opMul: 1.22, gloss: 0.10, lwMul: 1.15, blur: 0,
            note: '完全不反光，纹理感强、透气亲肤，但弹性有限、易松弛。' },
  wool:   { label: '羊毛',   full: '羊毛',         opMul: 1.55, gloss: 0.05, lwMul: 1.5,  blur: 1.4,
            note: '纤维蓬松锁住空气层，最厚最暖。同样的数字，羊毛要"实在"得多。' },
};

const COLORS = [
  { name: '经典黑',   hex: '#17151A' },
  { name: '石墨灰',   hex: '#3B3B44' },
  { name: '雾灰',     hex: '#8A8A93' },
  { name: '奶油白',   hex: '#EFE6DC' },
  { name: '咖啡棕',   hex: '#6B4A38' },
  { name: '深藏青',   hex: '#232B45' },
  { name: '酒红',     hex: '#5E1F2E' },
  { name: '自然裸肤', hex: '#E3BFA4' },
  { name: '浅裸肤',   hex: '#EDD3BE' },
  { name: '小麦肤色', hex: '#BC8E6D' },
];

const CATS = [
  { max: 15,  label: '透如薄纱', short: '超薄', hint: '几乎裸感的第二层皮肤，夏日通勤与正式场合的安全选择，但易勾丝、寿命短。' },
  { max: 45,  label: '半透自然', short: '薄透', hint: '若隐若现的日常主力——修饰腿色，又保留皮肤质感，耐穿度也上来了。' },
  { max: 85,  label: '半哑过渡', short: '过渡', hint: '透与不透的临界点。秋初裙装到深秋办公室之间的万能厚度。' },
  { max: 165, label: '全不透',   short: '不透', hint: '完全遮盖腿色，视觉更收敛显瘦，是秋冬通勤的标配厚度。' },
  { max: 999, label: '加厚保暖', short: '加厚', hint: '密织如一条薄裤，寒冷天气里风度与温度兼得，深色最显瘦。' },
];

const state = { d: 40, mat: 'nylon', color: COLORS[0].hex, colorName: COLORS[0].name };

/* ── i18n ── */
let lang = 'zh';
const zhStash = new WeakMap();      // [data-i18n] 的中文原文
const zhStashAria = new WeakMap();  // [data-i18n-aria] 的中文原文
const zhDoc = {};                   // title / meta description 原文

const enHtml = () => (typeof I18N !== 'undefined' ? I18N.en.html : {});
const enKey = (key) => enHtml()[key];
/* 取词：中文取源对象，英文取覆盖词典，缺失时回退中文 */
const L = (zh, en) => (lang === 'en' && en != null ? en : zh);
const matText = (key, field) => L(MATERIALS[key][field], I18N?.en.mat[key]?.[field]);
const catText = (cat, field) => L(cat[field], I18N?.en.cats[cat.label]?.[field]);
const colorLabel = (name) => L(name, I18N?.en.colorNames[name]);

function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'zh') return q;
  let saved = null;
  try { saved = localStorage.getItem('denier-lang'); } catch {}
  if (saved === 'en' || saved === 'zh') return saved;
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh';
}

function stashZh() {
  zhDoc.title = document.title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) zhDoc.desc = meta.getAttribute('content');
  document.querySelectorAll('[data-i18n]').forEach((el) => zhStash.set(el, el.innerHTML));
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => zhStashAria.set(el, el.getAttribute('aria-label')));
}

function applyLang(l) {
  lang = l;
  try { localStorage.setItem('denier-lang', l); } catch {}
  document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
  document.title = L(zhDoc.title, I18N?.en.doc.title);
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', L(zhDoc.desc, I18N?.en.doc.desc));

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = L(zhStash.get(el), enKey(el.getAttribute('data-i18n')));
    if (typeof v === 'string') el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const v = L(zhStashAria.get(el), enKey(el.getAttribute('data-i18n-aria')));
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });

  buildMatTabs();
  buildSwatches();
  buildDScale();
  buildColorGrid();
  buildGallery();
  render();
}

/* ── 工具 ── */
const $ = (s) => document.querySelector(s);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mixHex(hex, other, t) {
  const a = hexToRgb(hex), b = hexToRgb(other);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/* 同一材质下：D 数 → 覆盖不透明度（幂曲线模拟视觉上的"渐进变实"） */
const alphaFor = (d, mat) => clamp(Math.pow(d / 200, 0.5) * mat.opMul, 0.06, 0.96);
/* 越透越亮：光泽随 D 数升高而消退（哑光化） */
const glossFor = (d, mat) => clamp(0.45 * mat.gloss * (1 - d / 150), 0, 0.45);
const catFor   = (d) => CATS.find((c) => d < c.max);

/* 深色织物用 multiply 混合（像真实染色），浅色织物用普通覆盖 */
function blendFor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55 ? 'multiply' : 'normal';
}

/* ── DOM ── */
const legSvg   = $('#legSvg');
const dRange   = $('#dRange');
const dValue   = $('#dValue');
const dCatEl   = $('#dCategory');
const dHintEl  = $('#dHint');
const specMat  = $('#specMat');
const specColor= $('#specColor');
const matTabs  = $('#matTabs');
const matNote  = $('#matNote');
const swWrap   = $('#swatches');
const knitCv   = $('#knitCanvas');
const kctx     = knitCv.getContext('2d');

/* ── 针织密度透镜 ── */
function drawKnit() {
  const S = 312;
  const mat = MATERIALS[state.mat];
  kctx.clearRect(0, 0, S, S);
  kctx.fillStyle = '#120C18';
  kctx.fillRect(0, 0, S, S);

  const n = Math.round(6 + state.d / 5.2);        // 5D → 7 根，200D → 44 根
  const sp = S / n;
  const lw = Math.max(1, sp * 0.5) * mat.lwMul;
  const thread = mixHex(state.color, '#E8DCC8', 0.3);

  kctx.strokeStyle = thread;
  kctx.lineWidth = lw;
  kctx.globalAlpha = 0.95;
  if (mat.blur) kctx.filter = `blur(${mat.blur}px)`;

  kctx.beginPath();                                // 经线（竖）
  for (let x = sp / 2; x < S; x += sp) { kctx.moveTo(x, 0); kctx.lineTo(x, S); }
  kctx.stroke();
  kctx.globalAlpha = 0.7;                          // 纬线（横）
  kctx.beginPath();
  for (let y = sp / 2; y < S; y += sp * 1.15) { kctx.moveTo(0, y); kctx.lineTo(S, y); }
  kctx.stroke();

  kctx.filter = 'none';
  if (mat.gloss > 0.5) {                           // 锦纶缎面反光
    const g = kctx.createLinearGradient(0, S, S, 0);
    g.addColorStop(0.42, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.14 * (1 - state.d / 180)})`);
    g.addColorStop(0.58, 'rgba(255,255,255,0)');
    kctx.fillStyle = g;
    kctx.fillRect(0, 0, S, S);
  }
}

/* ── 主渲染 ── */
function render() {
  const mat = MATERIALS[state.mat];
  const a = alphaFor(state.d, mat);
  const cat = catFor(state.d);

  legSvg.style.setProperty('--stock', state.color);
  legSvg.style.setProperty('--stockA', a.toFixed(3));
  legSvg.style.setProperty('--stockBlend', blendFor(state.color));
  legSvg.style.setProperty('--glossO', glossFor(state.d, mat).toFixed(3));
  legSvg.style.setProperty('--toeA', (0.06 + a * 0.14).toFixed(3));

  dValue.textContent = state.d;
  dCatEl.textContent = catText(cat, 'label');
  dHintEl.textContent = catText(cat, 'hint');
  specMat.textContent = matText(state.mat, 'full');
  specColor.textContent = colorLabel(state.colorName);
  matNote.textContent = matText(state.mat, 'note');

  dRange.value = state.d;
  dRange.setAttribute('aria-valuetext', `${state.d}D ${catText(cat, 'label')}`);

  drawKnit();
}

/* ── 材质标签（可重建） ── */
const matBtnByKey = {};
function buildMatTabs() {
  matTabs.innerHTML = '';
  Object.keys(matBtnByKey).forEach((k) => delete matBtnByKey[k]);
  Object.entries(MATERIALS).forEach(([key, m]) => {
    const b = document.createElement('button');
    b.className = 'mat-btn';
    b.type = 'button';
    b.textContent = matText(key, 'label');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', key === state.mat);
    b.addEventListener('click', () => {
      state.mat = key;
      matTabs.querySelectorAll('.mat-btn').forEach((x) => x.setAttribute('aria-selected', x === b));
      render();
    });
    matBtnByKey[key] = b;
    matTabs.appendChild(b);
  });
}

/* ── 光箱色卡（可重建） ── */
function buildSwatches() {
  swWrap.innerHTML = '';
  COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'sw-btn';
    b.type = 'button';
    b.style.background = c.hex;
    b.title = colorLabel(c.name);
    b.setAttribute('aria-label', L(`颜色：${c.name}`, `Color: ${colorLabel(c.name)}`));
    b.setAttribute('aria-pressed', c.hex === state.color);
    b.addEventListener('click', () => {
      state.color = c.hex; state.colorName = c.name;
      swWrap.querySelectorAll('.sw-btn').forEach((x) => x.setAttribute('aria-pressed', x === b));
      syncColorChips(c.hex);
      render();
    });
    swWrap.appendChild(b);
  });
}

/* ── 丹尼尺色阶（可重建） ── */
const SKIN_CSS = 'linear-gradient(165deg,#F6E7DB 0%,#E8C9AC 55%,#C99772 100%)';
function buildDScale() {
  const track = $('#dscaleTrack');
  track.innerHTML = '';
  [5, 10, 20, 30, 40, 60, 80, 100, 120, 160, 200].forEach((d) => {
    const chip = document.createElement('button');
    chip.className = 'dchip';
    chip.type = 'button';
    chip.setAttribute('aria-label', L(`${d}D，载入光箱`, `${d}D — load into lightbox`));
    const a = alphaFor(d, MATERIALS.nylon);
    const dark = a > 0.42;                                   // 深色格子上标签换浅色
    chip.innerHTML = `<span class="dchip-overlay"></span><span class="dchip-tag">${catText(catFor(d), 'short')}</span><span class="dchip-label">${d}D</span>`;
    const lc = dark ? 'rgba(244,236,223,.92)' : '#2b2015';
    chip.querySelector('.dchip-overlay').style.background = rgba('#17151A', a.toFixed(3));
    chip.querySelector('.dchip-label').style.color = lc;
    chip.querySelector('.dchip-tag').style.color = dark ? 'rgba(244,236,223,.65)' : 'rgba(43,32,21,.75)';
    chip.addEventListener('click', () => {
      state.d = d;
      render();
      $('#lab').scrollIntoView({ behavior: 'smooth' });
    });
    track.appendChild(chip);
  });
}

/* ── 色彩区色卡（8D / 40D / 120D 三段试色，可重建） ── */
const CHIP_D = [8, 40, 120];
function buildColorGrid() {
  const grid = $('#colorGrid');
  grid.innerHTML = '';
  COLORS.forEach((c) => {
    const card = document.createElement('button');
    card.className = 'color-chip';
    card.type = 'button';
    card.setAttribute('aria-pressed', c.hex === state.color);
    card.setAttribute('aria-label', L(`${c.name}，应用到光箱`, `${colorLabel(c.name)} — apply to lightbox`));
    card.innerHTML =
      CHIP_D.map((d) =>
        `<div class="cc-band" style="background:linear-gradient(${rgba(c.hex, alphaFor(d, MATERIALS.nylon).toFixed(3))},${rgba(c.hex, alphaFor(d, MATERIALS.nylon).toFixed(3))}),${SKIN_CSS}"><span>${d}D</span></div>`
      ).join('') +
      `<div class="cc-meta"><span class="cc-name">${colorLabel(c.name)}</span><span class="cc-hex">${c.hex}</span></div>`;
    card.addEventListener('click', () => {
      state.color = c.hex; state.colorName = c.name;
      swWrap.querySelectorAll('.sw-btn').forEach((x) =>
        x.setAttribute('aria-pressed', x.getAttribute('aria-label') === L(`颜色：${c.name}`, `Color: ${colorLabel(c.name)}`)));
      syncColorChips(c.hex);
      render();
    });
    grid.appendChild(card);
  });
}

function syncColorChips(hex) {
  document.querySelectorAll('.color-chip').forEach((el) =>
    el.setAttribute('aria-pressed', el.querySelector('.cc-hex').textContent === hex));
}

/* ── URL 深链：?d=120&mat=wool&color=%23EF E6DC&lang=en 直达状态（仅改 state，不碰 DOM） ── */
function applyParams() {
  const p = new URLSearchParams(location.search);
  const d = parseInt(p.get('d'), 10);
  if (d >= 5 && d <= 200) state.d = d;
  const m = p.get('mat');
  if (MATERIALS[m]) state.mat = m;
  const c = p.get('color');
  if (c && /^#?[0-9a-fA-F]{6}$/.test(c)) {
    const hex = c.startsWith('#') ? c.toUpperCase() : '#' + c.toUpperCase();
    const found = COLORS.find((x) => x.hex === hex);
    if (found) { state.color = found.hex; state.colorName = found.name; }
  }
}

/* ── 实拍图库（全部来自 Wikimedia Commons，署名见 assets/img/CREDITS.md；可重建） ── */
const GALLERY = [
  { file: 'black-vs-nude-sheer.jpg', cap: '黑 vs 裸肤 · 超薄同款对比 · CC BY-SA 4.0' },
  { file: 'sheer-black-tights.jpg',  cap: '黑色超薄 · 正面产品图 · CC BY-SA 3.0' },
  { file: 'nude-sheer-tights.jpg',   cap: '肤色超薄 · 正面产品图 · CC BY-SA 4.0' },
  { file: 'knit-texture.jpg',        cap: '针织组织微距 · CC BY 4.0' },
  { file: 'colorful-tights.jpg',     cap: '锈红不透肉 · 日常穿搭 · CC0' },
  { file: 'hero-legs.jpg',           cap: '红色罗纹透肉袜 · 时尚大片 · CC BY-SA 3.0' },
  { file: 'hosiery-collection.jpg',  cap: '多色袜品 · CC BY-SA 3.0' },
];
function buildGallery() {
  if (!GALLERY.length) return;
  $('#gallery').hidden = false;
  const grid = $('#galleryGrid');
  grid.innerHTML = '';
  GALLERY.forEach((g, i) => {
    const cap = L(g.cap, I18N?.en.gallery[i]);
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = `assets/img/${g.file}`;
    img.alt = cap;
    img.loading = 'lazy';
    const figcap = document.createElement('figcaption');
    figcap.textContent = cap;
    fig.append(img, figcap);
    grid.appendChild(fig);
  });
}

/* ── 事件 ── */
dRange.addEventListener('input', () => { state.d = +dRange.value; render(); });
$('#langToggle').addEventListener('click', () => applyLang(lang === 'en' ? 'zh' : 'en'));

/* ── 启动：暂存中文原文 → 深链 → 按语言初始化并渲染 ── */
stashZh();
applyParams();
applyLang(detectLang());
