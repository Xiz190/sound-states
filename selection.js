/* ============================================================
   Sound States · 选择页 v2 / selection page
   左:圆盘(按 Russell 角度分区,扇区用各板块原封面色缓缓流动)
   右:舞台 —— 开场问句 → 悬停预览(名字+一句)→ 点击确认(画出数据图+心率改什么)→ 数据图飞进播放页,变成「此刻的声音」
   「不确定」= 圆盘原地可拖(取代旧导航器页);引导区 = 四种策略由你选
   依赖 script.js:STATES · t · lang · UI · openScene · showScreen · ensureAudio · renderNow
   ============================================================ */
(function () {
  const disc = document.getElementById('selDisc');
  if (!disc) return;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches;
  if (TOUCH) document.body.classList.add('sel-touch');
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const cls = (c, on) => document.body.classList.toggle(c, on);
  const has = c => document.body.classList.contains(c);

  // 与 script.js NAV_SECTORS 同一张表(画的 = 算的)
  const SECT = [{ b: 'cinematic', f: 0, t: 45 }, { b: 'motion', f: 45, t: 100 }, { b: 'guide', f: 100, t: 225 }, { b: 'sleep', f: 225, t: 300 }, { b: 'relax', f: 300, t: 360 }];
  const R = 235, R0 = R * 0.3;
  const st = id => STATES.find(s => s.id === id);
  const COL = id => id === 'guide' ? '190,165,120' : st(id).glow;
  const COVERS = id => id === 'guide' ? [['#15130f', '#3a3326'], ['#141210', '#2e2a22'], ['#17140f', '#40372a']] : st(id).covers;
  // 每块:属于哪一层、心率在这里改什么、小图形状 —— 与事实表 A7–A11 一致
  const META = {
    relax:     { melodic: true,  kind: 'stems',   vals: [.93, .62, .38], chg: { en: 'Your heart rate moves the instrument layers in and out.', zh: '心率让各个声部进进出出。' } },
    cinematic: { melodic: true,  kind: 'open',    vals: [.7],            chg: { en: 'Your heart rate opens and closes the sound.', zh: '心率让声音打开或收拢。' } },
    motion:    { melodic: true,  kind: 'open',    vals: [.82],           chg: { en: 'Your heart rate opens and closes the sound.', zh: '心率让声音打开或收拢。' } },
    focus:     { melodic: false, kind: 'plateau', vals: [],              chg: { en: 'A level plateau — your heart rate nudges brightness, distance and density.', zh: '一条恒定的平台——心率微调亮度、距离和密度。' } },
    sleep:     { melodic: false, kind: 'arc',     vals: [],              chg: { en: 'A two-minute descending arc — darker, farther, sparser.', zh: '两分钟的下行弧——更暗、更远、更稀。' } },
  };

  /* ---------- 数据图:同一套几何,任意尺寸(预览 / 飞行 / 落点) ---------- */
  function figure(k, w = 340, h = 64) {
    const m = META[k], c = COL(k), s = `rgb(${c})`;
    const svg = mk('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', height: '100%', preserveAspectRatio: 'none' });
    const track = (y, v) => {
      mk('line', { x1: 0, y1: y, x2: w, y2: y, stroke: 'rgba(255,255,255,.07)', 'stroke-width': 3, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, svg);
      mk('line', { x1: 0, y1: y, x2: w * v, y2: y, stroke: s, 'stroke-width': 3, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke', class: 'bar' }, svg);
    };
    if (m.kind === 'stems') m.vals.forEach((v, i) => track(h * (i + .5) / m.vals.length, v));
    else if (m.kind === 'open') track(h / 2, m.vals[0]);
    else {
      let d = ''; for (let i = 0; i <= 48; i++) { const x = i / 48, e = x * x * (3 - 2 * x), y = m.kind === 'arc' ? h * (.2 + .62 * e) : h * .45; d += (i ? 'L' : 'M') + (x * w).toFixed(1) + ' ' + y.toFixed(1) + ' '; }
      mk('path', { d: d + ` L${w} ${h} L0 ${h}Z`, fill: `rgba(${c},.14)`, class: 'area' }, svg);
      mk('path', { d, stroke: s, 'stroke-width': 2, fill: 'none', 'vector-effect': 'non-scaling-stroke', pathLength: 1, class: 'curve' }, svg);
    }
    return svg;
  }

  /* ---------- 圆盘 ---------- */
  const defs = mk('defs', {}, disc), secEls = {}, labEls = {}, timers = [];
  const arcPath = (f, t2) => { const p = (a, r) => [r * Math.cos(a * Math.PI / 180), -r * Math.sin(a * Math.PI / 180)];
    const [x0, y0] = p(f, R), [x1, y1] = p(t2, R), [x2, y2] = p(t2, R0), [x3, y3] = p(f, R0), lg = t2 - f > 180 ? 1 : 0;
    return `M${x0} ${y0} A${R} ${R} 0 ${lg} 0 ${x1} ${y1} L${x2} ${y2} A${R0} ${R0} 0 ${lg} 1 ${x3} ${y3}Z`; };
  let gid = 0;
  function addSec(k, shapeFn, xy) {
    const g = mk('g', { class: 'sec', 'data-k': k, tabindex: 0, role: 'button' }, disc);
    const layers = COVERS(k).map((c, i) => { const id = 'selcv' + (gid++);
      const lg = mk('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);       // ≈150°,同原卡片
      mk('stop', { offset: 0, 'stop-color': c[0] }, lg); mk('stop', { offset: 1, 'stop-color': c[1] }, lg);
      const el = shapeFn({ fill: `url(#${id})`, class: 'cov' + (i === 0 ? ' show' : '') }); g.appendChild(el); return el; });
    const vg = mk('radialGradient', { id: 'selvg' + k, cx: 0, cy: 0, r: R, gradientUnits: 'userSpaceOnUse' }, defs);
    mk('stop', { offset: .25, 'stop-color': '#0c0e14', 'stop-opacity': .75 }, vg); mk('stop', { offset: 1, 'stop-color': '#0c0e14', 'stop-opacity': 0 }, vg);
    g.appendChild(shapeFn({ fill: `url(#selvg${k})`, class: 'vig' }));
    g.appendChild(shapeFn({ fill: 'none', stroke: 'rgba(255,255,255,.07)', 'stroke-width': 1, class: 'edge' }));
    labEls[k] = mk('text', { x: xy[0], y: xy[1], 'text-anchor': 'middle', fill: `rgb(${COL(k)})`, class: 'lab' }, g);
    secEls[k] = g;
    // 封面色缓缓流动:沿用原卡片节奏(3.6–5.2s 错开,1.6s 交叉淡入);减少动态效果时不轮播
    if (!REDUCE && layers.length > 1) { let idx = 0;
      timers.push(setInterval(() => { if (!document.getElementById('selection').classList.contains('active')) return;
        layers[idx].classList.remove('show'); idx = (idx + 1) % layers.length; layers[idx].classList.add('show'); }, 3600 + Math.random() * 1600)); }
  }
  SECT.forEach(s => { const m = (s.f + s.t) / 2 * Math.PI / 180; addSec(s.b, a => mk('path', { d: arcPath(s.f, s.t), ...a }), [R * .66 * Math.cos(m), -R * .66 * Math.sin(m) + 5]); });
  addSec('focus', a => mk('circle', { r: R0, ...a }), [0, 5]);
  mk('circle', { r: R, fill: 'none', stroke: 'rgba(255,255,255,.16)', 'stroke-width': 1.2, 'pointer-events': 'none' }, disc);
  const axisEls = [['hi', 0, -R - 16, 'middle'], ['lo', 0, R + 26, 'middle'], ['neg', -R - 12, 4, 'end'], ['pos', R + 12, 4, 'start']]
    .map(([k, x, y, a]) => ({ k, el: mk('text', { x, y, 'text-anchor': a, class: 'axis' }, disc) }));
  const dot = mk('g', { id: 'selDot' }, disc); mk('circle', { r: 22, fill: 'rgba(185,161,107,.18)' }, dot); mk('circle', { r: 7, fill: '#b9a16b', stroke: '#fff', 'stroke-width': 1.4 }, dot);
  const boardAt = (x, y) => { const v = x / R, a = -y / R; if (Math.hypot(v, a) < .3) return 'focus'; let th = Math.atan2(a, v) * 180 / Math.PI; if (th < 0) th += 360; return (SECT.find(s => th >= s.f && th < s.t) || { b: 'relax' }).b; };

  /* ---------- 文案(跟随语言) ---------- */
  function applySelLang() {
    Object.entries(labEls).forEach(([k, el]) => { el.textContent = k === 'guide' ? t(UI.selGuideName) : t(st(k).name); secEls[k].setAttribute('aria-label', el.textContent); });
    const AX = { hi: ['HIGH AROUSAL', '高唤醒'], lo: ['LOW AROUSAL', '低唤醒'], neg: ['NEG', '负面'], pos: ['POS', '正面'] };
    axisEls.forEach(({ k, el }) => { el.textContent = lang === 'zh' ? AX[k][1] : AX[k][0]; el.style.letterSpacing = lang === 'zh' ? '.1em' : ''; });
    $('selLede').innerHTML = t(UI.selLede);
    setHint();
    if (previewK && previewK !== 'guide') fillPreview(previewK);
  }
  function setHint() { $('selHint').querySelector('span').textContent = t(has('sel-unsure') ? UI.selHintDrag : TOUCH ? UI.selHintTap : UI.selHintExplore); }

  /* ---------- 舞台:开场 → 预览 → 确认 → 飞行 ---------- */
  let shown = 'selIntro', previewK = null, committing = false, pinned = false;
  function showLayer(id) { if (shown === id) return; const old = $(shown); old.classList.add('leave'); old.classList.remove('show');
    setTimeout(() => old.classList.remove('leave'), 220); $(id).classList.add('show'); shown = id; }
  function fillPreview(k) {
    const m = META[k];
    $('selPvDot').style.background = `rgb(${COL(k)})`; $('selPvGrp').textContent = t(m.melodic ? UI.selWith : UI.selWithout);
    $('selPvName').textContent = t(st(k).name); $('selPvDesc').textContent = t(st(k).desc); $('selPvChg').textContent = t(m.chg);
    $('selPvEnterTxt').textContent = t(UI.selEnter) + ' ' + t(st(k).name);
    $('selPvFig').innerHTML = ''; $('selPvFig').appendChild(figure(k));
  }
  function preview(k, force) {
    if (committing) return; if (pinned && !force) return; previewK = k;
    Object.entries(secEls).forEach(([kk, g]) => g.classList.toggle('on', kk === k));
    if (window.selTint) selTint(k);   // 背后光晕染成当前板块色(走背景动画同一套 tint)
    if (!k) { showLayer('selIntro'); return; }
    if (k === 'guide') { showLayer('selGuide'); return; }
    fillPreview(k);
    if (shown === 'selPreview' && !REDUCE) $('selPreview').animate([{ opacity: .4, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out' });
    showLayer('selPreview');
  }
  function commit(k) {
    if (committing || !META[k]) return;
    pinned = false; if (previewK !== k || shown !== 'selPreview') preview(k, true);
    committing = true; cls('sel-committing', true);
    setTimeout(() => fly(k), REDUCE ? 150 : 1150);      // 数据图画出来(≈0.8s)+ 短暂停留,再跳转
  }

  /* ---------- 跳转:数据图飞进播放页,变成「此刻的声音」 ---------- */
  function landingTarget(k) {
    if (!META[k].melodic) return $('genFig');
    if (typeof renderNow === 'function') renderNow();
    const tracks = [...document.querySelectorAll('#nowRows .now-track')];
    if (!tracks.length) return null;
    return tracks;
  }
  function rectOf(t2) { if (!t2) return null; const list = Array.isArray(t2) ? t2 : [t2];
    const rs = list.map(e => e.getBoundingClientRect()); const l = Math.min(...rs.map(r => r.left)), tp = Math.min(...rs.map(r => r.top)), r2 = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
    return { left: l, top: tp, width: r2 - l, height: b - tp }; }
  function fly(k) {
    const a = $('selPvFig').getBoundingClientRect();
    ensureAudio(); openScene(k);
    requestAnimationFrame(() => {
      const tgt = landingTarget(k), list = tgt ? (Array.isArray(tgt) ? tgt : [tgt]) : [];
      let b = rectOf(tgt);
      // 落点在屏幕下方时,先把页面滚到让面板处在视线里(约 70% 高度处),再飞过去
      if (b && b.height > 0 && b.top + b.height > innerHeight - 24) { window.scrollTo(0, scrollY + (b.top + b.height - innerHeight * 0.72)); b = rectOf(tgt); }
      const visible = b && b.height > 0 && b.top >= 0 && b.top + b.height <= innerHeight;
      const done = () => { list.forEach(e => e.classList.remove('sel-landing')); reset(); };
      if (REDUCE || !visible) { done(); return; }                         // 落点不在屏内(如手机)或减少动态:直接淡入
      list.forEach(e => e.classList.add('sel-landing'));
      const el = document.createElement('div'); el.className = 'sel-fly';
      el.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
      el.appendChild(figure(k)); document.body.appendChild(el);
      const anim = el.animate([{ left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' },
                               { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' }],
                              { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      anim.onfinish = () => { done(); el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = () => el.remove(); };
    });
  }
  function reset() { committing = false; pinned = false; cls('sel-committing', false); if (has('sel-unsure')) unsure(false); else preview(null, true); }

  /* ---------- 交互 ---------- */
  Object.entries(secEls).forEach(([k, g]) => {
    g.addEventListener('pointerenter', () => { if (!has('sel-unsure') && !TOUCH) preview(k); });
    g.addEventListener('focus', () => { if (!has('sel-unsure')) preview(k); });
    const act = () => { if (has('sel-unsure')) return;
      if (k === 'guide') { pinned = true; preview('guide', true); return; }         // 固定引导区:移开鼠标也不消失
      pinned = false;
      if (TOUCH && previewK !== k) { preview(k, true); return; }                    // 触屏:第一下预览,第二下进入
      commit(k); };
    g.addEventListener('click', act);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  });
  // 离开圆盘不清空(方便移到右边细看);点空白处才回到开场
  $('selection').addEventListener('click', e => {
    if (committing || has('sel-unsure')) return;
    if (e.target.closest('.sec') || e.target.closest('.sel2-stage button') || e.target.closest('.sel2-stage a') || e.target.closest('.top-bar')) return;
    if (e.target.closest('.sel2-layer.show') && !e.target.closest('#selIntro')) return;
    pinned = false; preview(null, true);
  });
  $('selPvEnter').addEventListener('click', () => commit(previewK));
  document.querySelectorAll('#selGuide [data-go-board]').forEach(b => b.addEventListener('click', () => commit(b.dataset.goBoard)));

  /* ---------- 不确定:圆盘原地可拖 ---------- */
  function placeDot(x, y) { const d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d; } dot.setAttribute('transform', `translate(${x} ${y})`); preview(boardAt(x, y), true); }
  function unsure(on, v = .35, a = -.3) { cls('sel-unsure', on); setHint(); if (on) placeDot(v * R, -a * R); else preview(null, true); }
  $('selUnsureBtn').addEventListener('click', e => { e.stopPropagation(); unsure(true); });
  let drag = false; const toSvg = e => { const p = disc.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(disc.getScreenCTM().inverse()); };
  disc.addEventListener('pointerdown', e => { if (!has('sel-unsure')) return; drag = true; disc.setPointerCapture(e.pointerId); const p = toSvg(e); placeDot(p.x, p.y); });
  disc.addEventListener('pointermove', e => { if (drag) { const p = toSvg(e); placeDot(p.x, p.y); } });
  disc.addEventListener('pointerup', () => drag = false);

  /* ---------- 封面:板块色渐变缓缓流动 + 照片以明度叠在上面(照片的形,板块的色) ---------- */
  const coverTimers = new WeakMap();
  window.flowCover = function (el, sceneId, c) {
    const s2 = st(sceneId); if (!s2) return;
    el.classList.add('fc'); el.style.background = 'none'; el.style.backgroundImage = 'none';
    el.querySelectorAll('.fc-layer').forEach(x => x.remove());
    const off = Math.floor(Math.random() * s2.covers.length);            // 每张从不同的一组颜色开始,避免同一板块整齐划一
    const layers = s2.covers.map((g, i) => { const d = document.createElement('div'); d.className = 'fc-layer fc-tone' + (i === off ? ' show' : '');
      d.style.background = `linear-gradient(150deg, ${g[0]}, ${g[1]})`; el.prepend(d); return d; });
    if (c && c.img) { const im = document.createElement('div'); im.className = 'fc-layer fc-photo' + (c.transparent ? ' fc-contain' : '');
      im.style.backgroundImage = `url('${c.img}')`; layers[layers.length - 1].after(im); }
    if (!REDUCE && layers.length > 1) { let idx = off;
      const tm = setInterval(() => { if (!el.isConnected) { clearInterval(tm); return; }
        layers[idx].classList.remove('show'); idx = (idx + 1) % layers.length; layers[idx].classList.add('show'); }, 3600 + Math.random() * 1600);
      coverTimers.set(el, tm); }
  };

  /* ---------- 背景颜色 = 正中那张封面此刻流动到的颜色(光晕 + 颗粒同源) ---------- */
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lift = (c, f) => c.map(v => Math.min(255, Math.round(v * f)));
  let lastTintKey = '';
  function applyTintColors(a, b, force) {
    const key = a + b; if (!force && key === lastTintKey) return; lastTintKey = key;
    const A = hex(a), Bc = hex(b), pal = [];
    for (let i = 0; i < 64; i++) { const t2 = .35 + .65 * (i / 63), c = A.map((v, k) => v + (Bc[k] - v) * t2); pal.push(lift(c, 1.5).join(',')); }   // 深色渐变提亮一点,颗粒才看得见
    palette = pal; window.__mist = null;
    const top = lift(Bc, 1.25); tintTarget = { r: top[0], g: top[1], b: top[2] };
  }
  window.flowTintNow = function (force) {
    const tone = document.querySelector('#coverflow .cover.center .fc-tone.show') || document.querySelector('#coverflow .cover .fc-tone.show');
    if (!tone) return false;
    const m = tone.style.background.match(/rgb\((\d+), (\d+), (\d+)\)[^r]*rgb\((\d+), (\d+), (\d+)\)/);
    if (!m) return false;
    const toHex = (r, g, b) => '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join('');
    applyTintColors(toHex(m[1], m[2], m[3]), toHex(m[4], m[5], m[6]), force);
    return true;
  };
  setInterval(() => { if (!genMode && $('scene').classList.contains('active')) flowTintNow(); }, 500);
  // 选择页:光晕染成悬停的板块色(直接改 tintTarget,不会被背景动画覆盖)
  window.selTint = k => { const c = (k ? COL(k) : '150,150,170').split(',').map(Number); tintTarget = { r: c[0], g: c[1], b: c[2] }; };

  /* ---------- 实时声音肖像:播放时,把「此刻实际听到的声音」一圈圈画在正中封面上 ----------
     时间 = 绕圆一周(按播放进度),音高 = 向外,亮度 = 能量。读的是 analyser(混音之后),
     所以放松板块声部随心率进出、通透度变化,都会如实画进去 —— 每个人、每次听都不同。 */
  const portraits = new Map();                      // key = 板块:曲目 → { canvas, lastA }
  const BANDS = 24;
  function portraitFor(coverEl) {
    const key = currentSceneId + ':' + currentIndex;
    let p = portraits.get(key);
    if (!p) { const cv = document.createElement('canvas'); cv.className = 'live-portrait'; p = { cv, lastA: null }; portraits.set(key, p); }
    if (p.cv.parentNode !== coverEl) coverEl.appendChild(p.cv);
    const S = Math.round(coverEl.clientWidth * Math.min(devicePixelRatio || 1, 2));
    if (p.cv.width !== S) { const old = p.cv.width ? p.cv : null; const img = old && p.cv.width ? (() => { const c = document.createElement('canvas'); c.width = p.cv.width; c.height = p.cv.height; c.getContext('2d').drawImage(p.cv, 0, 0); return c; })() : null;
      p.cv.width = p.cv.height = S; if (img) p.cv.getContext('2d').drawImage(img, 0, 0, S, S); }
    return p;
  }
  function drawPortrait() {
    requestAnimationFrame(drawPortrait);
    if (genMode || !isPlaying || !$('scene').classList.contains('active') || typeof freqData === 'undefined' || !freqData) return;
    const cover = document.querySelector('#coverflow .cover.center'); const seek = $('seekBar');
    if (!cover || !seek || !+seek.max) return;
    const p = portraitFor(cover); cover.classList.add('portrait-on');
    const LAP = Math.min(90, +seek.max);                                  // 一圈 = 90 秒(短于 90 秒的曲子 = 整首);画满后旧的一圈淡下去再画
    const a = ((+seek.value % LAP) / LAP) * Math.PI * 2 - Math.PI / 2;    // 12 点钟开始,顺时针
    if (p.lastA != null && a < p.lastA - .5) { const g0 = p.cv.getContext('2d'); g0.globalCompositeOperation = 'destination-out'; g0.fillStyle = 'rgba(0,0,0,.55)'; g0.fillRect(0, 0, p.cv.width, p.cv.height); g0.globalCompositeOperation = 'source-over'; p.lastA = a - .012; }
    if (p.lastA == null || a < p.lastA || a - p.lastA > .3) { p.lastA = a - .012; }
    if (a - p.lastA < .004) return;
    const g = p.cv.getContext('2d'), S = p.cv.width, cx = S / 2, cy = S / 2, r0 = S * .15, r1 = S * .45;
    const tc = [tint.r, tint.g, tint.b].map(v => Math.min(255, Math.round(v * 1.15)));
    const nb = freqData.length, top = Math.max(8, Math.floor(nb * .55));   // 约到 12 kHz
    for (let b = 0; b < BANDS; b++) {
      const i0 = Math.floor(Math.pow(top, b / BANDS)), i1 = Math.max(i0 + 1, Math.floor(Math.pow(top, (b + 1) / BANDS)));
      let e = 0; for (let i = i0; i < i1 && i < nb; i++) e = Math.max(e, freqData[i]);
      const v = Math.pow(e / 255, 1.8); if (v < .03) continue;
      const ra = r0 + (r1 - r0) * b / BANDS, rb = ra + (r1 - r0) / BANDS * .8;
      g.beginPath(); g.arc(cx, cy, rb, p.lastA, a); g.arc(cx, cy, ra, a, p.lastA, true); g.closePath();
      g.fillStyle = `rgba(${Math.min(255, tc[0] + 70 * v)},${Math.min(255, tc[1] + 55 * v)},${Math.min(255, tc[2] + 45 * v)},${Math.min(1, .15 + v)})`; g.fill();
    }
    p.lastA = a;
  }
  if (!REDUCE) requestAnimationFrame(drawPortrait);

  /* 工作 / 睡眠的实时肖像:读引擎的旁路分析器。睡眠 = 一圈就是 120 秒入睡弧;工作 = 一圈 2 分钟,画满后淡出重来 */
  let genArcPct = null, genT0 = null, genLastA = null, genBuf = null, genKey = '';
  const _setGenArc = window.setGenArc;
  window.setGenArc = function (pct) { genArcPct = pct; if (typeof _setGenArc === 'function') _setGenArc(pct); };
  function drawGenPortrait() {
    requestAnimationFrame(drawGenPortrait);
    const cv = $('genPortrait'); if (!cv || !genMode || !sceneEng || !sceneEng.isRunning || !sceneEng.isRunning()) { genT0 = null; return; }
    const anl = sceneEng.getAnalyser && sceneEng.getAnalyser(); if (!anl) return;
    const key = currentSceneId + ':' + (currentScene && currentScene.covers[currentIndex] && currentScene.covers[currentIndex].scene);
    const S = Math.round(cv.clientWidth * Math.min(devicePixelRatio || 1, 2)); if (!S) return;
    if (cv.width !== S || key !== genKey) { cv.width = cv.height = S; genKey = key; genLastA = null; genT0 = null; }
    if (!genBuf || genBuf.length !== anl.frequencyBinCount) genBuf = new Uint8Array(anl.frequencyBinCount);
    anl.getByteFrequencyData(genBuf);
    const now = performance.now(); if (genT0 == null) genT0 = now;
    const frac = (currentSceneId === 'sleep' && genArcPct != null) ? genArcPct / 100 : (((now - genT0) / 1000) % 120) / 120;
    const a = frac * Math.PI * 2 - Math.PI / 2, g = cv.getContext('2d');
    if (genLastA == null) { g.clearRect(0, 0, S, S); genLastA = a - .012; }
    else if (a < genLastA - .5) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; genLastA = a - .012; }   // 新的一圈:旧的一圈淡下去
    if (a - genLastA < .004) return;
    const cx = S / 2, cy = S / 2, r0 = S * .15, r1 = S * .46, c = COL(currentSceneId).split(',').map(Number);
    const nb = genBuf.length, top = Math.max(8, Math.floor(nb * .55));
    for (let b = 0; b < BANDS; b++) {
      const i0 = Math.floor(Math.pow(top, b / BANDS)), i1 = Math.max(i0 + 1, Math.floor(Math.pow(top, (b + 1) / BANDS)));
      let e = 0; for (let i = i0; i < i1 && i < nb; i++) e = Math.max(e, genBuf[i]);
      const v = Math.pow(e / 255, 1.6); if (v < .03) continue;
      const ra = r0 + (r1 - r0) * b / BANDS, rb = ra + (r1 - r0) / BANDS * .8;
      g.beginPath(); g.arc(cx, cy, rb, genLastA, a); g.arc(cx, cy, ra, a, genLastA, true); g.closePath();
      g.fillStyle = `rgba(${Math.min(255, c[0] + 80 * v)},${Math.min(255, c[1] + 70 * v)},${Math.min(255, c[2] + 60 * v)},${Math.min(1, .15 + v)})`; g.fill();
    }
    genLastA = a;
  }
  if (!REDUCE) requestAnimationFrame(drawGenPortrait);

  /* ---------- 工作 / 睡眠:「此刻的声音」里的形状图(也是转场落点) ---------- */
  function renderGenFig(id) { const el = $('genFig'); if (!el || !META[id]) return; el.innerHTML = ''; el.appendChild(figure(id, 340, 56)); }

  /* ---------- 接入旧流程(包一层,不改 script.js 的调用点) ---------- */
  const _openScene = openScene;
  openScene = function (id) { const r = _openScene.apply(this, arguments); if (id === 'sleep' || id === 'focus') renderGenFig(id); return r; };
  const _showScreen = showScreen;
  showScreen = function (id) { _showScreen.apply(this, arguments); if (id === 'selection' && !committing) { pinned = false; if (has('sel-unsure')) unsure(false); else preview(null, true); } };
  /* ---------- About 排版:首段大字导语 · 三问加粗成小标题 · 过程段落拆出「序号 · 标题」 ---------- */
  const esc = x => x.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function formatAbout() {
    // 关于:第一段的第一句做导语
    const p1 = document.querySelector('#panel-about [data-i18n="aboutP1"]');
    if (p1) { const txt = p1.textContent, m = txt.match(/^(.+?[.。])\s*([\s\S]*)$/);
      if (m) p1.innerHTML = `<span class="lead">${esc(m[1])}</span>${esc(m[2])}`; }
    // 关于:三个问题成小标题
    const p2 = document.querySelector('#panel-about [data-i18n="aboutP2"]');
    if (p2) p2.innerHTML = esc(p2.textContent).replace(/(^|\n)(What should change\?|How should it change\?|Who decides\?|什么该变？|怎么变？|由谁决定？)/g, '$1<span class="q">$2</span>');
    // 过程:「1 · 标题 —— 正文」
    document.querySelectorAll('#panel-process .prose p').forEach(p => {
      const m = p.textContent.match(/^(\d+)\s*·\s*(.+?)\s*(?:——|—)\s*([\s\S]*)$/);
      if (m) { const body = m[3].charAt(0).toUpperCase() + m[3].slice(1);   // 英文正文首字母大写
        p.innerHTML = `<span class="ph"><small>${m[1].padStart(2, '0')}</small>${esc(m[2])}</span>${esc(body)}`; }
    });
  }
  const _applyLang = applyLang;
  applyLang = function () { _applyLang.apply(this, arguments); applySelLang(); formatAbout(); };
  formatAbout();
  // 首屏「帮我找」和菜单「情绪导航器」→ 选择页并打开「不确定」(旧导航器页已合并)
  const noBtn = $('landingNoBtn'); if (noBtn) { const nb = noBtn.cloneNode(true); noBtn.replaceWith(nb); nb.addEventListener('click', () => { ensureAudio(); showScreen('selection'); unsure(true); }); }
  $('menuNavigator')?.addEventListener('click', () => { showScreen('selection'); unsure(true); document.getElementById('menu')?.classList.remove('open'); });

  /* ---------- 首屏光晕 + 「开始」的过渡 ---------- */
  const halo = $('landHalo');
  if (halo) {
    const order = ['relax', 'cinematic', 'motion', 'focus', 'sleep'];
    const els = order.map((id, i) => { const e = document.createElement('i'); e.style.setProperty('--c', COL(id)); if (i === 0) e.classList.add('show'); halo.appendChild(e); return e; });
    if (!REDUCE) { let i = 0; setInterval(() => { if (!$('landing').classList.contains('active')) return; els[i].classList.remove('show'); i = (i + 1) % els.length; els[i].classList.add('show'); }, 4200); }
  }
  const yes = $('landingYesBtn');
  if (yes) { const nb = yes.cloneNode(true); yes.replaceWith(nb);
    nb.addEventListener('click', () => { ensureAudio();
      if (REDUCE || !halo) { showScreen('selection'); return; }
      $('landing').classList.add('leaving'); halo.classList.add('opening');           // 光晕放大散开 → 圆盘浮现
      setTimeout(() => { showScreen('selection'); $('landing').classList.remove('leaving'); halo.classList.remove('opening'); }, 520);
    }); }

  /* ---------- 心率面板:模拟心率读数 + 基线刻度;静息基线「修改」展开 ---------- */
  function refreshHr() {
    const sim = $('heartSimSlider'), rest = typeof restingBPM === 'number' ? restingBPM : 70;
    if ($('hrRestVal')) $('hrRestVal').textContent = rest;
    const mark = $('hrBaseMark');
    if (sim && mark) { const lo = +sim.min, hi = +sim.max; mark.style.left = ((rest - lo) / (hi - lo) * 100) + '%'; mark.dataset.l = t(UI.restingLabel) + ' ' + rest; }
    if (sim && $('hrSimRel')) { const d = +sim.value - rest; $('hrSimRel').textContent = (lang === 'zh' ? '相对基线 ' : 'vs baseline ') + (d === 0 ? '±0' : (d > 0 ? '+' : '−') + Math.abs(d)); }
    if (sim && $('heartSimBPM')) $('heartSimBPM').textContent = sim.value;
  }
  $('heartSimSlider')?.addEventListener('input', () => setTimeout(refreshHr, 0));
  $('restingBPMInput')?.addEventListener('change', () => setTimeout(refreshHr, 0));
  $('hrRestEdit')?.addEventListener('click', () => { const r = $('heartRestingBar'); const on = !r.classList.contains('editing');
    r.classList.toggle('editing', on); $('hrRestEdit').textContent = t(on ? UI.restDone : UI.restEdit); if (on) $('restingBPMInput').focus(); });
  const _aL2 = applyLang; applyLang = function () { _aL2.apply(this, arguments); refreshHr(); };

  applySelLang();
  // 截图/测试用:?sel=relax 预览 · ?selgo=relax 直接走转场 · ?selunsure
  const q = new URLSearchParams(location.search);
  if (q.get('sel') || q.get('selgo') || q.has('selunsure')) setTimeout(() => { showScreen('selection');
    if (q.get('sel')) preview(q.get('sel'), true); if (q.get('selgo')) commit(q.get('selgo')); if (q.has('selunsure')) unsure(true, -.45, .5); }, 400);
  window.__sel = { preview, commit, unsure };
})();
