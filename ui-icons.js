/* 讲解页共用:把按钮里的字符图标(▶ ❚❚ ■ ⟳ ◀)换成同一套线条的 SVG;按钮文字被脚本改写时自动再换一次 */
(function () {
  const P = 'width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" style="vertical-align:-1px;flex:none"';
  const ICON = {
    '▶': `<svg ${P}><path d="M3 1.8v8.4L10 6z" fill="currentColor"/></svg>`,
    '❚❚': `<svg ${P}><path d="M3.2 2v8M8.8 2v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    '■': `<svg ${P}><rect x="2.5" y="2.5" width="7" height="7" rx="1.2" fill="currentColor"/></svg>`,
    '⟳': `<svg ${P}><path d="M9.8 6a3.8 3.8 0 1 1-1.2-2.8M9.6 1.4v2.4H7.2" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '◀': `<svg ${P}><path d="M9 1.8v8.4L2 6z" fill="currentColor"/></svg>`,
  };
  const RE = /❚❚|[▶■⟳◀]/g;
  function fix(el) {
    if (!el || el.dataset.iconFixing) return;
    const txt = el.textContent; if (!RE.test(txt)) return; RE.lastIndex = 0;
    el.dataset.iconFixing = '1';
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    el.innerHTML = esc(txt).replace(RE, m => ICON[m]).replace(/\s*(<svg[^>]*>.*?<\/svg>)\s*/g, ' $1 ').trim();
    el.style.display = el.style.display || ''; el.classList.add('has-icon');
    delete el.dataset.iconFixing;
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('button, .fval, .lab') : []).forEach(fix); }
  const st = document.createElement('style');
  st.textContent = 'button.has-icon{display:inline-flex;align-items:center;gap:7px;justify-content:center}';
  document.head.appendChild(st);
  const go = () => {
    scan(document);
    new MutationObserver(ms => ms.forEach(m => {
      const t = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (t && t.closest) { const b = t.closest('button, .fval, .lab'); if (b) fix(b); }
      m.addedNodes && m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches && n.matches('button')) fix(n); scan(n); } });
    })).observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
