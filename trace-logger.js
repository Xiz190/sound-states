/* ============================================================
   Sound States · 记录器 / trace logger
   只在网址带 ?log 时出现(产品页保持干净)。每秒记录一行:心率(原始+平滑)、基线、唤醒、
   当前板块/曲目、通透度与低通、各声部实际增益、音色预设;工作/睡眠记录引擎参数。
   可随时打「标记」(如"开始跳绳""停下")。导出 JSON + CSV,用来画真实数据图。
   诚实约束:每行都记 mode —— 只有 mode=auto 且 connected=true 的行才是真实心率。
   ============================================================ */
(function () {
  if (!/[?&]log\b/.test(location.search)) return;

  const rows = [], marks = [];
  window.__ssTrace = { rows, marks };   // 方便在控制台查看 / inspect in console
  let timer = null, t0 = 0;

  function num(x, d) { return (typeof x === 'number' && isFinite(x)) ? +x.toFixed(d) : null; }

  function sample() {
    const t = (performance.now() - t0) / 1000;
    const r = { t: num(t, 1), clock: new Date().toISOString() };
    try {
      r.mode      = heartMode;
      r.connected = !!_heartConnected;
      r.bpm_raw   = (typeof window._hrLastRaw === 'number') ? window._hrLastRaw : null;
      r.bpm       = num(_heartSmooth, 1);
      r.baseline  = restingBPM;
      r.arousal   = _heartSmooth > 0 ? num(_bpmToArousal(_heartSmooth), 3) : null;
      r.board     = (typeof currentSceneId !== 'undefined' && currentSceneId) || null;
      r.playing   = !!isPlaying;
      r.gen       = !!genMode;
      if (!genMode && currentScene) {
        const song = currentSong();
        r.song      = song ? (song.name.en || '') : null;
        r.openness  = num(+atmosSlider.value, 1);                 // 氛围 0–100
        r.cutoff_hz = Math.round(sliderToFreq(+atmosSlider.value)); // 低通截止
        r.character = currentEQPreset;
        if (song && song.stems) {
          const a = curArousal();
          song.stems.layers.forEach(L => { r['layer_' + L.key] = num(stemGainFor(L.curve, a), 3); });
        }
      } else if (genMode && sceneEng) {
        ['tone', 'radius', 'reverb'].forEach(k => { r['eng_' + k] = num(sceneEng.getParam(k), 3); });
      }
    } catch (e) { r.err = String(e).slice(0, 80); }
    rows.push(r);
    ui.count.textContent = rows.length + ' 行 · ' + fmt(t) + (marks.length ? ' · 标记 ' + marks.length + '（最新：' + marks[marks.length - 1].label + '）' : '');
    if (rows.length % 10 === 0) { try { localStorage.setItem('ss_trace_autosave', JSON.stringify({ rows, marks })); } catch (e) {} }
  }

  function fmt(s) { const m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + String(x).padStart(2, '0'); }

  function start() {
    rows.length = 0; marks.length = 0; t0 = performance.now();
    sample(); timer = setInterval(sample, 1000);
    ui.rec.textContent = '■ 停止'; ui.rec.classList.add('on');
  }
  function stop() {
    clearInterval(timer); timer = null;
    ui.rec.textContent = '● 开始记录'; ui.rec.classList.remove('on');
  }
  function mark() {
    if (!timer) return;
    const label = (ui.label.value || ('标记 ' + (marks.length + 1))).trim();
    marks.push({ t: num((performance.now() - t0) / 1000, 1), label });
    ui.label.value = '';
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function exportAll() {
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    download(`trace-${stamp}.json`, JSON.stringify({ recorded: new Date().toISOString(), marks, rows }, null, 1), 'application/json');
    const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => r[k] == null ? '' : JSON.stringify(r[k])).join(','))).join('\n');
    const mcsv = ['t,label'].concat(marks.map(m => `${m.t},${JSON.stringify(m.label)}`)).join('\n');
    download(`trace-${stamp}.csv`, csv, 'text/csv');
    download(`trace-${stamp}-marks.csv`, mcsv, 'text/csv');
  }

  // ---- 小面板 / small panel (左下角) ----
  const box = document.createElement('div');
  box.id = 'traceLogger';
  box.innerHTML = `
    <div class="tl-row"><button class="tl-rec">● 开始记录</button><button class="tl-exp">导出</button><button class="tl-png">导出肖像</button></div>
    <div class="tl-row"><input class="tl-label" placeholder="标记名，如：开始跳绳" /><button class="tl-mark">标记</button></div>
    <div class="tl-count">未开始 · 只有「实时心率」且已连接的行才算真实数据</div>`;
  const css = document.createElement('style');
  css.textContent = `
    #traceLogger{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9999;
      background:rgba(12,14,20,.92);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px;
      font:12px -apple-system,"PingFang SC",sans-serif;color:#e7e3da;width:260px}
    #traceLogger .tl-row{display:flex;gap:6px;margin-bottom:6px}
    #traceLogger button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);color:#e7e3da;
      border-radius:6px;padding:4px 8px;cursor:pointer;font:inherit}
    #traceLogger .tl-rec.on{border-color:#d9727a;color:#f0a0a6}
    #traceLogger input{flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);
      color:#e7e3da;border-radius:6px;padding:4px 6px;font:inherit}
    #traceLogger .tl-count{color:#8b8a96;line-height:1.45}`;
  document.head.appendChild(css); document.body.appendChild(box);
  const ui = { rec: box.querySelector('.tl-rec'), exp: box.querySelector('.tl-exp'),
               label: box.querySelector('.tl-label'), mark: box.querySelector('.tl-mark'), count: box.querySelector('.tl-count') };
  ui.rec.onclick = () => (timer ? stop() : start());
  ui.exp.onclick = exportAll;
  // 导出当前页面上所有「实时声音肖像」为 PNG(给 PDF 用:一次真实聆听的记录)
  box.querySelector('.tl-png').onclick = () => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    document.querySelectorAll('canvas.live-portrait, #genPortrait').forEach((cv, i) => {
      if (!cv.width) return; const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
      const g = out.getContext('2d'); g.fillStyle = '#0c0e14'; g.fillRect(0, 0, out.width, out.height); g.drawImage(cv, 0, 0);
      const a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download = `portrait-${stamp}-${i}.png`; document.body.appendChild(a); a.click(); a.remove(); });
  };
  ui.mark.onclick = mark;
  ui.label.addEventListener('keydown', e => { if (e.key === 'Enter') mark(); });
})();
