# Sound States — 进度 & 待办

## 已完成 ✅

### 视觉 & 交互
- 5 块状态命名定稿：想象 / 运动 / 工作 / 放松 / 催眠
- 状态卡片 3+2 布局（max-width: 642px，flex-wrap）
- 5 套独立 canvas 视觉系统：drawCinematic / drawMotion / drawFocus / drawRelax / drawSleep
- 背景：封面图颜色采样 → burst mist 粒子（paletteToMistCols），全局移除 mandala 圆
- Dawn Scene 黑边修复（drawBlurredBg 加 Math.max(1, sc) 保底）
- A/B/C 重定义为「沉浸深度」：预设 [18, 58, 100]，视觉+音频同步变化

### 移动端
- 768px / 480px 两级断点，全页面重排
  - 卡片 → 2 列，封面 → 140px / 120px
  - 播放器、浏览页、内容页均适配
- Coverflow 触摸左右滑动（swipe > 40px 切歌）
- layoutCovers() 间距随屏幕宽度动态计算

### 全局 UI
- 声音开关并入 langToggle 固定栏（全页面统一一个元素）
  - 显示效果：`🔇 Sound Off | EN | 中`
  - 桌面 & 移动端均生效

---

## 待完成 ❌

### 音频内容（核心）
- [ ] **导入剩余约 8 首 Suno WAV + 封面**
  - 需要：文件名 → 对应板块（想象/运动/放松/工作/催眠）
  - 导入后：在 SCENES 里添加对应 cover 对象（audio / img / grad / mistCols 等字段）
- [ ] **激活 工作 / 放松 / 催眠 三块**
  - script.js STATES 里把 `active: false` 改 `active: true`
  - 为每块添加 SCENES 条目（参考 cinematic/motion 格式）
- [ ] **移除 placeholderNote**（等真实音频全部接入后删掉）

### 播放体验
- [ ] **WAV 加载状态**：大文件播放前加 loading 提示（转圈或文字）
- [ ] **varNotes 文案更新**：A/B/C 描述还是旧版"softer/more distant"语言
  - 改成：A = 初入状态 / B = 逐渐沉浸 / C = 完全进入

### 内容页文字（用户写，Claude 格式化插入）
- [ ] **Process 页**：加入 Sethares 音色理论背景 + Pure Data 实验 + Sound States 作为设计应用的叙述
- [ ] **About 页**：目前文字可用，可考虑精简或补充
- [ ] **Reflection 页**：目前文字可用，可补充个人见解

### 上线
- [ ] **部署**：获取公开 URL（推荐 Vercel / Netlify，直接拖文件夹即可，无需构建）

---

## 技术备忘

- 本地启动：`cd ~/Desktop/voice/sound-states-demo && python3 -m http.server 8080`
- 必须用 http 访问，file:// 会导致音频静默（Chrome MediaElementSource 限制）
- 两首现有音频：`glass-grid.wav`（Dawn Scene）、`glass2.wav`（Lonely City）
- 封面图：cover-cinematic.jpg / cover-dawn-bg.jpg / cover-lonely.jpg / cover-neon.png
