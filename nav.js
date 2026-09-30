/* ============================================================
   nav.js — 浏览历史 · 返回 · 切换方向
   在 script.js + selection.js 之后加载;只包一层 showScreen,不改原调用点。
   - 每次换屏记一条浏览历史(#selection / #about …):手机侧滑返回、浏览器后退都留在站内
   - 页面上的「返回」= 回到你真正来的地方(从全部曲目进歌曲,返回回到全部曲目)
   - 后退时回到原来的滚动位置;从播放页回到圆盘时,刚才那个板块仍亮着
   - 切换方向:前进 = 内容从下方轻轻浮上;后退 = 从上方落回。只动透明度和几像素位移,不加颜色
   ============================================================ */
(function () {
  const HASHABLE = ['selection', 'browse', 'about'];
  let depth = 0, current = 'landing', fromPop = false, back = false;
  const startHash = location.hash.slice(1);   // 先读,下一行会把网址里的 # 清掉

  history.replaceState({ s: 'landing', d: 0, y: 0 }, '', location.pathname + location.search);

  const inner = showScreen;
  showScreen = function (id) {
    const leaving = current, leftScene = leaving === 'scene' ? currentSceneId : null;
    document.body.classList.toggle('nav-back', back);
    if (!fromPop && id !== current) {                       // 记下离开时的滚动位置,后退时还原
      history.replaceState(Object.assign({}, history.state, { y: window.scrollY }), '');
    }
    inner.apply(this, arguments);
    if (!fromPop && id !== current) {
      depth++;
      history.pushState({ s: id, d: depth, y: 0, scene: id === 'scene' ? currentSceneId : null }, '',
        HASHABLE.includes(id) ? '#' + id : location.pathname + location.search);
    }
    current = id;
    // 从播放页回到圆盘:把刚离开的板块留在预览里(扇区亮着),而不是回到空白开场
    if (back && id === 'selection' && leftScene && window.__sel) window.__sel.preview(leftScene, true);
  };

  // 进入播放页时记下板块,前进(浏览器「前进」)时能重新打开
  const innerOpen = openScene;
  openScene = function (id) {
    const r = innerOpen.apply(this, arguments);
    if (history.state && history.state.s === 'scene' && history.state.scene !== id)
      history.replaceState(Object.assign({}, history.state, { scene: id }), '');
    return r;
  };

  window.addEventListener('popstate', e => {
    const st = e.state; if (!st || !st.s) return;
    back = st.d < depth; depth = st.d; fromPop = true;
    try {
      document.getElementById('menu')?.classList.remove('open');
      if (st.s === 'scene' && st.scene) openScene(st.scene);
      else showScreen(st.s === 'scene' ? 'selection' : st.s);
      requestAnimationFrame(() => window.scrollTo(0, st.y || 0));
    } finally { fromPop = false; back = false; }
  });

  // 页面上的「返回」:站内有来处就真的后退;直接打开的(没有来处)才用按钮自带的去处
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.back-btn');
    if (!b || depth === 0) return;
    e.preventDefault(); e.stopPropagation();
    history.back();
  }, true);

  // 讲解页返回时带着 #about / #browse 进站:直接落到对应页
  if (HASHABLE.includes(startHash)) showScreen(startHash);
})();
