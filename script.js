/* ============================================================
   Sound States — V1 Demo logic (双语版 / bilingual)
   - 语言切换 EN / 中 / language toggle
   - 屏幕路由 / screen routing
   - 数据驱动的场景 / data-driven scenes
   - 弧形封面 + 状态卡封面循环背景 / coverflow + cycling card covers
   - Web Audio 合成的环境声 + 声画映射 / synth + audio→glow mapping
   说明:文字都用 {en, zh} 成对存放,切换时用 t() 取当前语言。
   封面目前是 CSS 渐变占位,以后把 grad 换成 AI 生成的图片 url 即可。
   ============================================================ */

/* ---------- 0. 语言 / language ---------- */
let lang = 'en';
const t = obj => (obj && obj[lang] !== undefined) ? obj[lang] : obj;

// 全站静态文案 / static UI strings
const UI = {
  subtitle: { en: 'AI-generated sound environments for rest, focus, sleep, cinematic imagination and motion',
              zh: '基于 AI 生成声音的情绪与场景体验网页:放松、专注、睡前、沉浸想象与运动激活' },
  guide:    { en: 'A quiet digital space shaped by sound, mood and gentle interaction.',
              zh: '一个由声音、情绪与轻交互塑造的安静数字空间。' },
  begin:    { en: 'Begin', zh: '进入' },
  hint:     { en: 'Sound is off by default — turn it on inside.',
              zh: '声音默认关闭,进入后可手动开启。' },
  home:     { en: '← Home', zh: '← 首页' },
  states:   { en: '← States', zh: '← 状态' },
  chooseTitle: { en: 'Choose your state', zh: '选择你的状态' },
  chooseSub:   { en: 'Different sound worlds support different states. Start with what you need right now.',
                 zh: '不同的声音世界对应不同的状态。从你此刻需要的开始。' },
  gateQuestion: { en: 'Do you know what sound you need right now?', zh: '你现在知道自己需要什么样的声音吗？' },
  gateYes:      { en: 'Yes — I\'ll choose', zh: '知道，我来选' },
  gateNo:       { en: 'Not sure — help me find it', zh: '不确定，帮我找' },
  enter:    { en: 'Enter →', zh: '进入 →' },
  soon:     { en: 'Coming soon', zh: '敬请期待' },
  soundOn:  { en: '🔊 Sound On', zh: '🔊 声音开' },
  soundOff: { en: '🔇 Sound Off', zh: '🔇 声音关' },
  play:     { en: '▶ Play', zh: '▶ 播放' },
  pause:    { en: '❚❚ Pause', zh: '❚❚ 暂停' },
  loading:  { en: '· · ·', zh: '· · ·' },
  varLabel: { en: 'AI Variations', zh: 'AI 版本' },
  atmosLabel:    { en: 'Atmosphere', zh: '氛围' },
  natural:       { en: 'Natural', zh: '通透' },
  veiled:        { en: 'Veiled', zh: '朦胧' },
  eqLabel:       { en: 'Timbre', zh: '音色' },
  headphoneHint: { en: 'Best with headphones', zh: '建议佩戴耳机' },
  placeholderNote: { en: 'Cinematic now plays a real track — drag the Atmosphere slider to morph its tone in real time.',
                     zh: '沉浸场景已接入真实音轨——拖动「氛围」滑块,可实时改变这首歌的音色明暗。' },

  // 今日推荐 / daily recommendation
  dailySection: { en: "Today's Pick", zh: '今日推荐' },
  dailyBtn:     { en: 'Daily Picks', zh: '今日推荐' },
  dailyHint:    { en: 'A daily mix curated across all sound worlds', zh: '每日从所有声音世界中精选，今日不重复' },

  // 全部曲目 / browse
  navBrowse:  { en: 'All Tracks', zh: '全部曲目' },
  browseAll:  { en: 'Browse all tracks →', zh: '浏览全部曲目 →' },
  browseTitle:       { en: 'All Tracks', zh: '全部曲目' },
  browseSub:         { en: 'Every track across all sound worlds — click any to enter', zh: '所有声音世界的全部曲目，点击进入' },
  filterAll:         { en: 'All', zh: '全部' },
  searchPlaceholder: { en: 'Search tracks…', zh: '搜索曲目…' },
  searchEmpty:       { en: 'No tracks found', zh: '没有找到相关曲目' },

  // 返回 / back
  backBtn: { en: '← Back', zh: '← 返回' },

  // 导航 / navigation
  navHome:       { en: 'Home', zh: '首页' },
  navWorlds:     { en: 'Sound Worlds', zh: '声音世界' },
  navAbout:      { en: 'About', zh: '关于' },
  navProcess:    { en: 'Process', zh: '制作过程' },
  navReflection: { en: 'Reflection', zh: '反思' },

  // About 关于
  aboutTitle: { en: 'About', zh: '关于' },
  aboutP1: {
    en: 'I cannot function without music. I write it, record it, mix it, and listen to it through headphones almost every waking hour. But there are states where even music I love becomes too much — when I am exhausted or overwhelmed, melody has too much weight; what I need then is texture without arc, atmosphere without song. I noticed this in people around me too: friends pairing Pomodoro timers with rain or ocean sounds to focus; others defaulting to lofi for long study sessions; ASMR at night when the mind won\'t quiet. Everyone was already reaching for sound to manage their state — intuitively, without a system. Learning acoustic physics and psychoacoustics in college made this personal observation intellectual: I understood that frequency, timbre and tempo physically shape what the brain receives, and that these effects can be measured. In a mixing course, I saw how EQ shifts perceived tone from warm to cold, heavy to clear. The question followed: if sound can be described mathematically, can it be designed emotionally?',
    zh: '我离不开音乐。我写歌、录音、混音，几乎全天戴着耳机。但有些状态下，连我喜爱的音乐都变得太重——极度疲惫或情绪混乱时，旋律的重量让人难以承受；那时我需要的是没有走向的纹理，没有情节的氛围。我在身边的人身上也观察到这件事：朋友用番茄时钟配着雨声或海浪声专注学习；另一些人长时间学习时默认打开 lofi；睡不着时放 ASMR 让脑子安静。每个人都已经在凭直觉用声音管理自己的状态——只是没有一个系统。在大学里学习声学物理和音乐心理声学，让这个个人观察变成了一个智识问题：我了解到频率、音色与节拍在物理层面塑造大脑接收的内容，而这些影响是可以被测量的。在混音课上，我看到 EQ 如何将音色从温暖推向冰冷、从厚重推向清澈。问题随之而来：如果声音可以用数学描述，它能否被情绪地设计？',
  },
  aboutP2: {
    en: 'Sound States is the answer I built. Using Russell\'s Circumplex Model of Affect (1980) as a coordinate system — two axes: valence and arousal — I designed an algorithm that routes emotional state to a recommended sound world, EQ preset and Atmosphere level in real time. The EQ presets are grounded in timbre theory and the emotional contagion mechanism described in Juslin\'s BRECVEMA framework (2008); the Atmosphere lowpass filter targets arousal via the brain-stem-reflex pathway; BPM targets follow Karageorghis\'s recuperative music research (2012). I am a songwriter — what I cannot do alone is generate emotionally varied music in bulk at the speed a system like this requires. I use AI for that volume, then listen, select and arrange. The distinction matters: the prompts are theoretically grounded, the curation is mine.',
    zh: 'Sound States 是我构建出的答案。以 Russell（1980）情感环状模型为坐标系——效价与唤醒度两轴——我设计了一个算法，将情绪状态实时路由至推荐的声音世界、EQ 预设与氛围参数。EQ 预设基于音色理论与 Juslin BRECVEMA 框架（2008）中的情绪感染机制；氛围低通滤波器经由脑干反射通路调节唤醒水平；BPM 目标参照 Karageorghis（2012）的放松音乐研究。我平时自己写歌、唱歌、录音、混音，但当我需要快速生成大量不同情绪的音乐素材时，一个人根本来不及，有些音效也很难单独去碰到或录制。于是我和 AI 一起来完成这个量——感谢身边愿意坐下来听这些生成结果、给我反馈的朋友们，最后进入系统的每首歌，都是我和一小部分朋友一起反复听、反复挑选之后留下来的。提示词有理论依据，筛选是真实的判断。',
  },
  aboutRole: {
    en: 'Built for myself first. Then I became the user — and found the questions worth asking for others.',
    zh: '最初只是为自己做的。做完之后我成了第一个用户，从自己用的过程里，慢慢发现了值得为更多人去解决的问题。',
  },

  // Process 制作过程
  processTitle: { en: 'Process', zh: '制作过程' },
  processIntro: {
    en: 'The project grew from a personal need through academic research into a working system. These are the stages:',
    zh: '这个项目从个人需求出发，经由学术研究，长成一个可运行的系统。以下是它的过程：',
  },
  proc1: {
    en: '1 · The origin — I have written and arranged my own music for years, and I noticed I needed different kinds of sound in different states: melody when I have energy, texture and near-silence when I am depleted. In college, studying how frequency, amplitude and timbre physically shape perception — and how EQ changes those parameters in a mix — I began to think: could this be designed systematically?',
    zh: '1 · 起点 —— 我自己写歌、编曲已有多年，也注意到在不同状态下我需要不同类型的声音：有能量时要旋律，精力耗尽时要纹理和接近沉默的东西。在大学里，学习频率、振幅与音色如何在物理层面塑造听感（以及 EQ 如何在混音中调节这些参数），我开始思考：这件事能否被系统地设计？',
  },
  proc2: {
    en: '2 · Research — I studied the emotion-music relationship across several frameworks: Russell\'s (1980) Circumplex Model maps affect onto valence × arousal coordinates; Kim & André (2008) show that physiological signals — GSR for arousal and ECG for valence — can classify emotional state with high accuracy using a two-step approach; Karageorghis et al. (2012) identify 60 BPM as optimal for recuperative and sleep-inducing music; Juslin\'s BRECVEMA framework (2008) explains the physical mechanisms — including the brain-stem reflex — by which sound directly modulates how we feel before conscious cognition.',
    zh: '2 · 调研 —— 我通过多个框架研究情绪与音乐的关系：Russell（1980）情感环状模型将情感映射为效价 × 唤醒度坐标；Kim & André（2008）表明生理信号——GSR 对应唤醒度、ECG 对应效价——可用双步法以高准确率分类情绪状态；Karageorghis 等（2012）确认 60 BPM 是放松与催眠音乐的最优节拍；Juslin 的 BRECVEMA 框架（2008）解释了声音在意识介入之前直接调节感受的生理机制，包括脑干反射通路。',
  },
  proc3: {
    en: '3 · Algorithm design — translate theory into routing logic: arousal × valence space → five sound boards; EQ presets mapped to valence via the emotional contagion mechanism; the Atmosphere lowpass filter mapped to arousal via the brain-stem-reflex pathway; BPM targets per board derived from Karageorghis\'s findings (sleep: 50–60 BPM, motion: 125–140 BPM).',
    zh: '3 · 算法设计 —— 将理论转化为路由逻辑：唤醒度 × 效价空间 → 五个声音板块；EQ 预设经由情绪感染机制映射效价；氛围低通滤波器经脑干反射通路映射唤醒水平；各板块 BPM 目标基于 Karageorghis 研究（催眠：50–60 BPM，运动：125–140 BPM）。',
  },
  proc4: {
    en: '4 · Scene system — five emotional states, each with a distinct sound goal, visual character, default EQ and a theory-grounded BPM range. The states came from my own pattern of listening: not abstract categories, but the actual situations where sound changes what I can do.',
    zh: '4 · 场景系统 —— 五种情绪状态，各有独立的声音目标、视觉风格、默认 EQ 与文献支撑的 BPM 范围。这些状态来自我自己的听音习惯：不是抽象的分类，而是声音真实改变我能做什么的那些时刻。',
  },
  proc5: {
    en: '5 · Music direction — I wrote targeted prompts for Suno using mood keywords, BPM specifications and tonal descriptors derived from the research. In practice, a single track required forty to fifty generation attempts before the emotional character was right — AI generates quickly, but directing it toward a specific feeling is slow, iterative work. I am a songwriter; what AI provides is scale and variation speed. Every track that goes in has been listened to in full, tested in context, and chosen deliberately.',
    zh: '5 · 音乐指导 —— 我为 Suno 撰写提示词，包含基于研究的情绪关键词、BPM 规格与音色描述。实际操作中，一首歌往往需要四五十次生成才能找到情绪感觉对的版本——AI 生成快，但将它引导至特定的感受是缓慢、反复的工作。我自己写歌；AI 提供的是规模和变体速度。进入系统的每首歌，都被完整地听过、在场景中测试过、经过有意识的选择。',
  },
  proc6: {
    en: '6 · Web Audio API layer — EQ chain (lowshelf / peaking / highshelf) for real-time tonal control; lowpass filter for Atmosphere depth; audio-reactive glow layer driven by frequency energy. Every parameter feeds back to Russell coordinates on a mini indicator inside the scene player — so the theory is visible, not hidden.',
    zh: '6 · Web Audio API 层 —— EQ 链（低频架 / 峰值 / 高频架）实时音色控制；低通滤波器控制氛围深度；频率能量驱动发光层。每个参数都反馈至场景播放器内的迷你 Russell 坐标指示器——让理论可见，而非隐藏。',
  },
  proc7: {
    en: '7 · Biofeedback navigator — a draggable Russell circumplex maps your current emotional state to a recommended sound world, EQ and Atmosphere setting. Heart rate (BPM) is measured in real time via a MAX30102 optical sensor connected through the Web Serial API: each heartbeat sends a beat signal that pulses the bass layer; BPM drives arousal, which continuously routes atmosphere depth and EQ preset. Valence is still self-reported via the navigator slider — the arousal axis is now live physiological data.',
    zh: '7 · 生物反馈导航器 —— 可拖动的 Russell 圆盘将当前情绪状态映射至推荐声音世界、EQ 与氛围参数。心率（BPM）通过 MAX30102 光学传感器经 Web Serial API 实时读取：每一次心跳发出信号，触发低频层脉动；BPM 驱动唤醒度，持续路由氛围深度与 EQ 预设。效价仍通过导航器滑块自我报告——唤醒轴已接入真实生理数据。',
  },

  // Reflection 反思
  reflTitle:   { en: 'Reflection', zh: '反思' },
  reflWorkedH: { en: 'What worked', zh: '有效的部分' },
  reflWorked: {
    en: 'Building for myself first meant I could sense immediately when something was wrong — the wrong EQ for a tired state, a rhythm too fast for sleep. That subjective testing is what the theory alone cannot replace. The Web Audio API enables surprisingly expressive real-time emotional control: EQ creates perceptible valence shifts; the Atmosphere lowpass filter produces a clear, felt drop in arousal — consistent with BRECVEMA\'s brain-stem-reflex prediction (Juslin, 2008). Russell\'s circumplex gave the interface a framework that is both theoretically grounded and visually immediate: the mini indicator made an abstract model into something you can watch move in real time.',
    zh: '先为自己构建，意味着我可以立刻感知到什么地方不对——疲惫状态下错误的 EQ，催眠场景里过快的节奏。这种主观测试是理论单独无法替代的。Web Audio API 的实时情绪控制效果出乎意料地有说服力：EQ 带来可感知的效价变化；氛围低通滤波器产生明显的唤醒度下降——与 BRECVEMA 脑干反射机制的预测一致（Juslin, 2008）。Russell 圆盘为界面提供了一个既有理论根基又视觉直接的框架：迷你指示器让一个抽象模型变成了你可以实时看着它移动的东西。',
  },
  reflLimitH:  { en: 'Limitations', zh: '局限' },
  reflLimit: {
    en: 'Timbre perception is subjective — psychoacoustics research confirms that perception varies between individuals, bodies and listening environments. The EQ-to-valence mapping is theory-informed but not individually validated: it is a designed approximation, not a calibrated measurement. Heart rate measures arousal; valence is self-reported — a deliberate design choice that keeps the interface accessible while grounding the arousal axis in real physiological data. Only two of five sound boards have real tracks at this stage.',
    zh: '音色感知是主观的——心理声学研究证实，感知因个体、体型与听音环境不同而存在差异。EQ 对效价的映射基于理论，但未经个体验证：它是一种有设计依据的近似，而非经过校准的测量。唤醒度通过心率实时测量；效价通过自我报告输入——这是有意为之的设计选择：在唤醒轴接入真实生理数据的同时，保持界面的可及性。目前只有两个板块有真实音轨。',
  },
  reflFutureH: { en: 'Future', zh: '未来' },
  reflFuture: {
    en: 'Heart rate biofeedback is live — the arousal axis is now physiologically grounded. Next: fifteen AI-directed tracks (three per board) with theoretically grounded prompts, completing all five sound boards. Personal baseline calibration so the system learns your individual arousal range rather than assuming population averages. Longer-term: a system that adapts not just to where you are right now, but to the patterns in how you move through emotional states over time.',
    zh: '心率生物反馈已接入——唤醒轴现由真实生理数据驱动。接下来：15首经理论指导的 AI 音轨（每板块3首），补全全部五个声音板块。个体基准校准，让系统学习你个人的唤醒度范围，而非依赖通用平均值。更长远：一个不只响应你此刻状态、而是学习你随时间穿越情绪状态的规律的系统。',
  },
};

/* ---------- EQ 音色预设 / timbre EQ presets ----------
   基于 Sethares timbre theory + 老师课程频率图:
   low=低频架/high=高频架 各用 lowshelf/highshelf,mid 用 peaking bell
   -------------------------------------------------------- */
const EQ_PRESETS = {
  flat: {
    name: { en: 'Original', zh: '原声' },
    desc: { en: 'No processing · the song as recorded', zh: '无任何处理 · 原始录音直出' },
    low:  { freq: 100,  gain: 0 },
    mid:  { freq: 1000, gain: 0, Q: 1.0 },
    high: { freq: 8000, gain: 0 },
  },
  grand: {
    name: { en: 'Grand', zh: '宏大' },
    desc: { en: 'Scooped mids · soaring highs · concert hall space', zh: '挖空中频 · 高频延伸 · 像在音乐厅里听' },
    low:  { freq: 100,   gain:  2 },
    mid:  { freq: 800,   gain: -8,  Q: 0.6 },
    high: { freq: 10000, gain: 11 },
  },
  power: {
    name: { en: 'Power', zh: '力量' },
    desc: { en: 'Heavy sub · scooped mids · phonk & trap energy', zh: '超低频猛推 · V形曲线 · phonk / trap 风格' },
    low:  { freq: 55,    gain: 12 },
    mid:  { freq: 400,   gain: -8,  Q: 0.7 },
    high: { freq: 8000,  gain:  8 },
  },
  clear: {
    name: { en: 'Clear', zh: '透彻' },
    desc: { en: 'Cut low mud · boosted clarity · dry and direct', zh: '削低频浑浊 · 推清晰度 · 像把混响洗掉' },
    low:  { freq: 150,   gain: -7 },
    mid:  { freq: 4000,  gain:  3,  Q: 1.0 },
    high: { freq: 12000, gain:  3 },
  },
  warm: {
    name: { en: 'Warm', zh: '温暖' },
    desc: { en: 'Low-mid body · muffled highs · cocooned in sound', zh: '低中频包裹 · 高频被蒙住 · 像隔着一层薄布听' },
    low:  { freq: 200,   gain:  4 },
    mid:  { freq: 500,   gain:  3,  Q: 0.7 },
    high: { freq: 3500,  gain: -12 },
  },
  dark: {
    name: { en: 'Dark', zh: '深沉' },
    desc: { en: 'Deep sub · very dark · immersive sleep texture', zh: '低频沉重 · 极度压暗 · 催眠沉浸感' },
    low:  { freq: 50,    gain: 10 },
    mid:  { freq: 280,   gain: -6,  Q: 0.7 },
    high: { freq: 4000,  gain: -12 },
  },
};

/* ---------- 1. 数据 / data ---------- */
const STATES = [
  { id: 'relax', glow: '150,165,190', active: false,
    name: { en: 'Relax', zh: '放松' },
    desc: { en: 'Soft soundscapes for slowing down and being gently held by sound.',
            zh: '柔和的声景,让你慢下来,被声音温柔包裹。' },
    covers: [['#2a3242','#6b7a99'], ['#33384a','#8a8aa0'], ['#222a3a','#5a6a8a'], ['#2e2a3e','#7a6a9a']] },
  { id: 'focus', glow: '90,140,150', active: false,
    name: { en: 'Work', zh: '工作' },
    desc: { en: 'Steady, low-distraction sound for deep work and study.',
            zh: '稳定、低干扰的声音,陪你进入工作或学习的心流。' },
    covers: [['#16202a','#2a5a5a'], ['#1a242e','#3a6a6a'], ['#101820','#244a4a'], ['#18222c','#2e5a55']] },
  { id: 'sleep', glow: '90,110,170', active: false,
    name: { en: 'Sleep', zh: '催眠' },
    desc: { en: 'Slow textures and soft sound to guide you gently toward sleep.',
            zh: '缓慢的声音纹理,引导你放下意识,慢慢沉入睡眠。' },
    covers: [['#0c1020','#1a2a4a'], ['#0e0c1a','#2a2a4a'], ['#08101c','#163a5a'], ['#100a1a','#2a2050']] },
  { id: 'cinematic', glow: '120,150,200', active: true,
    name: { en: 'Imagine', zh: '想象' },
    desc: { en: 'Immersive music for imagination, inner scenes and emotional space.',
            zh: '有画面感的音乐,关于想象力、情绪氛围与内心场景。' },
    covers: [['#2a3d5c','#b98a5a'], ['#1c2333','#4a5a7a'], ['#3a2c44','#7a6a8a'], ['#22323a','#8aa0a0']] },
  { id: 'motion', glow: '205,70,95', active: true,
    name: { en: 'Motion', zh: '运动' },
    desc: { en: 'Rhythmic, high-energy environments for activation and movement.',
            zh: '强节奏、高能量的声景,用于激活状态与运动。' },
    covers: [['#1a0c12','#7a2030'], ['#0e0c1a','#5a2a7a'], ['#140c0c','#6a2a2a'], ['#160a1a','#7a3a6a']] },
];

const SCENES = {
  cinematic: {
    title: { en: 'Imagine', zh: '想象' },
    sub:   { en: 'For imagination, emotional atmosphere and inner scenes',
             zh: '关于想象力、情绪氛围与内心场景' },
    glow: '120,150,200', pulse: false, eqPreset: 'grand',
    varNotes: [
      { en: 'Version A — softer and more distant', zh: '版本 A — 更柔和、更遥远' },
      { en: 'Version B — more open and atmospheric', zh: '版本 B — 更开阔、更具空间感' },
      { en: 'Version C — richer layers with a stronger emotional arc', zh: '版本 C — 层次更丰富、情绪起伏更强' },
    ],
    covers: [
      { name: { en: 'Dawn Scene', zh: '破晓' }, desc: { en: 'A gradual emotional rise with soft hope and open space.', zh: '缓缓升起的情绪,带着柔和的希望与开阔感。' }, grad: ['#2a3d5c','#b98a5a'], root: 196, img: 'cover-cinematic.jpg', shapeSrc: 'cover-neon.png', audio: 'glass-grid.wav', bgImg: 'cover-dawn-bg.jpg', bgBlur: 0.8 },
      { name: { en: 'Lonely City', zh: '孤独城市' }, desc: { en: 'An urban night atmosphere with emotional distance.', zh: '城市夜晚的氛围,带着情绪上的疏离感。' }, grad: ['#1c2333','#4a5a7a'], root: 174, shapeSrc: 'cover-neon.png', audio: 'glass2.wav', img: 'cover-lonely.jpg', bgImg: 'cover-lonely.jpg', bgBlur: 0.15, mistCols: [[255,240,215],[255,210,130],[255,170,90],[110,210,200],[120,190,235]], mistWeights: [0.30, 0.57, 0.77, 0.87, 1.0], mistSize: 0.7, mistMode: 'burst', noMandala: true },
      { name: { en: 'Slow Memory', zh: '慢记忆' }, desc: { en: 'A nostalgic cinematic texture with a suspended feeling.', zh: '怀旧的电影质感,带着悬停般的感觉。' }, grad: ['#3a2c44','#7a6a8a'], root: 147 },
      { name: { en: 'Imagined Landscape', zh: '想象之境' }, desc: { en: 'A wider, more layered world for emotional projection.', zh: '更开阔、更有层次的声音世界,供情绪投射。' }, grad: ['#22323a','#8aa0a0'], root: 165 },
    ],
  },
  motion: {
    title: { en: 'Motion', zh: '运动' },
    sub:   { en: 'For activation, movement and rhythmic energy',
             zh: '关于激活、运动与节奏能量' },
    glow: '205,70,95', pulse: true, eqPreset: 'power',
    varNotes: [
      { en: 'Version A — tighter and cleaner', zh: '版本 A — 更紧致、更干净' },
      { en: 'Version B — darker and heavier', zh: '版本 B — 更暗、更重' },
      { en: 'Version C — more distorted and aggressive', zh: '版本 C — 更失真、更具冲击力' },
    ],
    covers: [
      { name: { en: 'Phonk Drive', zh: '暗潮驱动' }, desc: { en: 'Heavy pulse, distorted texture and forward momentum.', zh: '沉重的脉冲、失真的纹理与向前的冲劲。' }, grad: ['#1a0c12','#7a2030'], root: 110 },
      { name: { en: 'Trap Energy', zh: '能量陷阱' }, desc: { en: 'Sharper beat structure with strong low-end.', zh: '更锐利的节拍结构,强劲的低频。' }, grad: ['#0e0c1a','#5a2a7a'], root: 98 },
      { name: { en: 'Dark Cardio', zh: '暗黑有氧' }, desc: { en: 'A darker repetitive rhythm for intense movement.', zh: '更暗的重复节奏,适合高强度运动。' }, grad: ['#140c0c','#6a2a2a'], root: 130 },
      { name: { en: 'Ritual Pulse', zh: '仪式脉动' }, desc: { en: 'A hypnotic percussive loop with circular tension.', zh: '催眠般的打击循环,带着环形的张力。' }, grad: ['#160a1a','#7a3a6a'], root: 87 },
    ],
  },
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gradCss = g => `linear-gradient(150deg, ${g[0]}, ${g[1]})`;

/* ---------- 2. 屏幕路由 / screen routing ---------- */
const screens = document.querySelectorAll('.screen');
const atmosSlider = document.getElementById('atmosSlider');   // 氛围滑块 / atmosphere slider
let prevScreen = 'landing';
function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  if (id === 'browse') {
    browseQuery = '';
    const bse = document.getElementById('browseSearch');
    if (bse) bse.value = '';
    renderBrowse();
  }
  if (id === 'navigator') {
    requestAnimationFrame(() => refreshAlgoOutput());
  }
  if (id === 'about') resetAboutTabs();
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-go]').forEach(btn =>
  btn.addEventListener('click', () => showScreen(btn.dataset.go))
);

/* ---------- 导航菜单 / nav menu ---------- */
const menu = document.getElementById('menu');
document.getElementById('menuBtn').addEventListener('click', () => menu.classList.toggle('open'));
menu.addEventListener('click', (e) => {            // 点链接或点空白都关闭 / close on link or backdrop
  if (e.target === menu || e.target.tagName === 'BUTTON') menu.classList.remove('open');
});
document.getElementById('landingYesBtn').addEventListener('click', () => {
  ensureAudio();
  showScreen('selection');
});
document.getElementById('landingNoBtn').addEventListener('click', () => {
  ensureAudio();
  prevScreen = 'landing';
  showScreen('navigator');
});

/* ---------- 3. 语言切换 / language toggle ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  // 静态文案 / static strings
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(UI[el.dataset.i18n]);
  });
  // 动态部分重渲染 / re-render dynamic parts
  renderCards();
  if (document.getElementById('browse') && document.getElementById('browse').classList.contains('active')) renderBrowse();
  if (currentScene) refreshSceneText();
  refreshSoundToggle();
  refreshPlayBtn();
  if (typeof refreshEQBtns    === 'function') refreshEQBtns();
  if (typeof refreshAtmosDesc === 'function') refreshAtmosDesc(atmosSlider ? +atmosSlider.value : 100);
  if (typeof refreshAlgoOutput === 'function' && document.getElementById('navigator')?.classList.contains('active')) refreshAlgoOutput();
}
document.querySelectorAll('#langToggle button[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    lang = btn.dataset.lang;
    try { localStorage.setItem('ss_lang', lang); } catch (e) {}
    document.querySelectorAll('#langToggle button').forEach(b => b.classList.toggle('active', b === btn));
    applyLang();
  });
});

/* ---------- 4. 状态卡片 + 封面循环背景 / cards + cycling covers ---------- */
const cardsEl = document.getElementById('stateCards');
let cycleTimers = [];

function renderCards() {
  cycleTimers.forEach(clearInterval);   // 清掉旧的轮播 / clear old cyclers
  cycleTimers = [];
  cardsEl.innerHTML = '';

  STATES.forEach(st => {
    const card = document.createElement('div');
    card.className = 'card' + (st.active ? '' : ' disabled');

    // 封面层 / cover layers
    const bg = document.createElement('div');
    bg.className = 'card-bg';
    st.covers.forEach((g, i) => {
      const layer = document.createElement('div');
      layer.className = 'bg-layer' + (i === 0 ? ' show' : '');
      layer.style.background = gradCss(g);
      bg.appendChild(layer);
    });

    const scrim = document.createElement('div');
    scrim.className = 'card-scrim';

    const content = document.createElement('div');
    content.className = 'card-content';
    content.innerHTML = `
      <h3>${t(st.name)}</h3>
      <p>${t(st.desc)}</p>
      <div class="enter">${st.active ? t(UI.enter) : t(UI.soon)}</div>`;

    card.append(bg, scrim, content);
    if (st.active) card.addEventListener('click', () => openScene(st.id));
    cardsEl.appendChild(card);

    // 启动封面轮播:a→b→c→… 交叉淡入淡出 / start crossfade cycle
    if (!reduceMotion && st.covers.length > 1) {
      const layers = bg.querySelectorAll('.bg-layer');
      let idx = 0;
      const step = () => {
        layers[idx].classList.remove('show');
        idx = (idx + 1) % layers.length;
        layers[idx].classList.add('show');
      };
      // 每张卡错开节奏,避免整齐划一 / stagger so cards don't flip in sync
      const interval = 3600 + Math.random() * 1600;
      cycleTimers.push(setInterval(step, interval));
    }
  });
}

/* ---------- 4b. 全部曲目 / browse all ---------- */
let activeBrowseFilter = 'all';
let browseQuery = '';

function matchesQuery(cover, scene, q) {
  if (!q) return true;
  const hay = [
    t(cover.name), t(cover.desc), t(scene.title),
    cover.name?.en, cover.name?.zh,
    cover.desc?.en, cover.desc?.zh,
  ].filter(Boolean).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every(w => hay.includes(w));
}

function renderBrowse() {
  // ── 搜索框 placeholder / search placeholder ───────────────
  const searchEl = document.getElementById('browseSearch');
  if (searchEl) searchEl.placeholder = t(UI.searchPlaceholder);

  // ── 筛选标签 / filter tabs ────────────────────────────────
  const filtersEl = document.getElementById('browseFilters');
  filtersEl.innerHTML = '';

  const makeFilterBtn = (key, labelObj) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (activeBrowseFilter === key ? ' active' : '');
    btn.textContent = t(labelObj);
    btn.addEventListener('click', () => {
      activeBrowseFilter = key;
      renderBrowse();
    });
    filtersEl.appendChild(btn);
  };
  makeFilterBtn('all', UI.filterAll);
  Object.entries(SCENES).forEach(([id, scene]) => {
    if (id === 'daily') return;
    makeFilterBtn(id, scene.title);
  });

  // ── 歌曲网格 / song grid ──────────────────────────────────
  const grid = document.getElementById('browseGrid');
  grid.innerHTML = '';
  let totalShown = 0;

  Object.entries(SCENES).forEach(([sceneId, scene]) => {
    if (sceneId === 'daily') return;
    if (activeBrowseFilter !== 'all' && activeBrowseFilter !== sceneId) return;

    const matched = scene.covers.filter(c => matchesQuery(c, scene, browseQuery));
    if (!matched.length) return;
    totalShown += matched.length;

    if (activeBrowseFilter === 'all') {
      const label = document.createElement('div');
      label.className = 'browse-board-label';
      label.textContent = t(scene.title);
      grid.appendChild(label);
    }

    matched.forEach(cover => {
      const songIdx = scene.covers.indexOf(cover);
      const card = document.createElement('div');
      card.className = 'song-card';
      if (cover.img) {
        card.style.backgroundImage = `url('${cover.img}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
      } else {
        card.style.background = `linear-gradient(150deg, ${cover.grad[0]}, ${cover.grad[1]})`;
      }
      // highlight matching query in name
      const rawName = t(cover.name);
      const hlName = browseQuery
        ? rawName.replace(new RegExp(`(${browseQuery.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),
            '<mark>$1</mark>')
        : rawName;
      card.innerHTML =
        `<div class="song-card-board">${t(scene.title)}</div>` +
        `<div class="song-card-name">${hlName}</div>` +
        `<div class="song-card-desc">${t(cover.desc)}</div>`;
      card.addEventListener('click', () => {
        ensureAudio();
        openScene(sceneId);
        requestAnimationFrame(() => selectCover(songIdx));
      });
      grid.appendChild(card);
    });
  });

  // 无结果提示 / empty state
  const emptyEl = document.getElementById('browseEmpty');
  if (emptyEl) {
    emptyEl.textContent = (!totalShown && browseQuery) ? t(UI.searchEmpty) : '';
  }
}

// 搜索输入实时过滤 / live filter on search input
const browseSearchEl = document.getElementById('browseSearch');
if (browseSearchEl) {
  browseSearchEl.addEventListener('input', () => {
    browseQuery = browseSearchEl.value.trim();
    renderBrowse();
  });
}

// "浏览全部" 链接 / browse-all link from selection screen
document.getElementById('browseAllBtn').addEventListener('click', () => showScreen('browse'));

/* ---------- 4d. 今日推荐 / daily recommendation ---------- */
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function openDailyScene() {
  // 收集所有可用歌曲 / collect all available songs
  const allSongs = [];
  Object.entries(SCENES).forEach(([id, sc]) => {
    if (id === 'daily') return;
    sc.covers.forEach(c => allSongs.push(c));
  });
  // 当日固定随机打乱 / seeded shuffle — same result all day
  const rand = seededRand(todaySeed());
  const shuffled = allSongs.slice().sort(() => rand() - 0.5);
  const picks = shuffled.slice(0, Math.min(5, shuffled.length));

  // 动态建立"今日推荐"场景 / build the virtual daily scene
  SCENES.daily = {
    title:    { en: "Today's Pick", zh: '今日推荐' },
    sub:      { en: 'A curated mix across all sound worlds, refreshed daily',
                zh: '跨所有声音世界的今日精选，每日更新' },
    glow:     '130,160,210',
    pulse:    false,
    varNotes: SCENES.cinematic ? SCENES.cinematic.varNotes : [
      { en: 'Version A', zh: '版本 A' },
      { en: 'Version B', zh: '版本 B' },
      { en: 'Version C', zh: '版本 C' },
    ],
    covers: picks,
  };
  openScene('daily');
}

document.getElementById('dailyBtn').addEventListener('click', () => {
  ensureAudio();
  openDailyScene();
});

/* ---------- 5. 场景 + 弧形封面 / scene + coverflow ---------- */
const coverflowEl = document.getElementById('coverflow');
let currentScene = null, currentSceneId = null;
let currentIndex = 0;

function openScene(id) {
  currentSceneId = id;
  currentScene = SCENES[id];
  window.__mist = null; relaxBlobs = null; sleepCurves = null; focusDots = null; motionShapes = []; emanate = 0;
  // 今日随机起始歌曲(固定当天不变)/ daily random starting track — same all day
  const dr = seededRand(todaySeed() + id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  currentIndex = Math.floor(dr() * currentScene.covers.length);
  document.documentElement.style.setProperty('--glow-color', currentScene.glow);

  coverflowEl.innerHTML = '';
  // 每张封面 = 一首歌;每首歌有 A/B/C 版本 / each cover = a song; each song has A/B/C
  currentScene.covers.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'cover';
    if (c.img) {                              // 真实封面图 / real cover image
      el.style.backgroundImage = `url('${c.img}')`;
      if (c.transparent) {                    // 透明霓虹层:漂在背景上,无卡片底 / floats over bg, no card
        el.classList.add('cover-transparent');
      } else {
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    } else {
      el.style.background = gradCss(c.grad);
    }
    el.innerHTML = `<span>${t(c.name)}</span>`;
    el.addEventListener('click', () => selectCover(i));
    coverflowEl.appendChild(el);
  });

  layoutCovers();
  refreshSceneText();
  setTintFromSong();
  if (hasRealTrack && atmosSlider) {
    atmosSlider.value = 100;
    applyAtmos(100);
    refreshAtmosDesc(100);
  }
  applyEQ('flat');
  showScreen('scene');
  if (isPlaying) playTrack();
}

// 弧形布局 / arc layout
function layoutCovers() {
  const covers = coverflowEl.children;
  const coverW = window.innerWidth <= 480 ? 120 : (window.innerWidth <= 768 ? 140 : 180);
  const step = Math.round(coverW * 0.75);
  for (let i = 0; i < covers.length; i++) {
    const offset = i - currentIndex, abs = Math.abs(offset);
    const x = offset * step, z = -abs * step, rot = -offset * 32;
    const scale = Math.max(0.6, 1 - abs * 0.12);
    const opacity = abs > 3 ? 0 : Math.max(0, 1 - abs * 0.32);
    covers[i].style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
    covers[i].style.opacity = opacity;
    covers[i].style.zIndex = 100 - abs;
    covers[i].classList.toggle('center', offset === 0);
  }
}

function selectCover(i) {
  currentIndex = Math.max(0, Math.min(currentScene.covers.length - 1, i));
  window.__mist = null; relaxBlobs = null; sleepCurves = null; focusDots = null; motionShapes = [];
  if (seekBar) { seekBar.value = 0; if (timeCur) timeCur.textContent = '0:00'; }
  layoutCovers();
  refreshSceneText();
  setTintFromSong();
  if (isPlaying) playTrack();
}
document.getElementById('prevCover').addEventListener('click', () => selectCover(currentIndex - 1));
document.getElementById('nextCover').addEventListener('click', () => selectCover(currentIndex + 1));

// 触摸滑动切换封面 / touch swipe on coverflow
(function () {
  let tx0 = 0, ty0 = 0, dragging = false;
  coverflowEl.addEventListener('touchstart', e => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });
  coverflowEl.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - tx0;
    const dy = e.touches[0].clientY - ty0;
    if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
  }, { passive: false });
  coverflowEl.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 40) selectCover(currentIndex + (dx < 0 ? 1 : -1));
  });
})();

// 场景内所有文字按当前语言刷新 / refresh all scene text in current language
function refreshSceneText() {
  document.getElementById('sceneTitle').textContent = t(currentScene.title);
  document.getElementById('sceneSub').textContent = t(currentScene.sub);
  const c = currentScene.covers[currentIndex];
  document.getElementById('trackName').textContent = t(c.name);
  document.getElementById('trackDesc').textContent = t(c.desc);
  document.getElementById('varNote').textContent = '';
  // 封面名也要切语言 / cover labels follow language
  const covers = coverflowEl.children;
  for (let i = 0; i < covers.length; i++)
    covers[i].querySelector('span').textContent = t(currentScene.covers[i].name);
}

/* ---------- 6. 滑块 + 进度条 / sliders + seek ---------- */
const ATMOS_DESCS = [
  { min: 85, desc: { en: 'Original · unprocessed, full spectrum', zh: '通透 · 原始信号，全频无处理' } },
  { min: 65, desc: { en: 'Slightly veiled · soft and airy', zh: '略微朦胧 · 柔和透气' } },
  { min: 40, desc: { en: 'Veiled · warm and distant', zh: '朦胧 · 温暖而遥远' } },
  { min: 15, desc: { en: 'Deeply veiled · dreamlike texture', zh: '深度朦胧 · 梦幻质感' } },
  { min: 0,  desc: { en: 'Extreme veil · only low frequencies remain', zh: '极度朦胧 · 高频几乎消失' } },
];

function refreshAtmosDesc(v) {
  const el = document.getElementById('atmosDesc');
  if (!el) return;
  const entry = ATMOS_DESCS.find(d => v >= d.min);
  el.textContent = entry ? t(entry.desc) : '';
  el.classList.toggle('visible', !!entry);
}

if (atmosSlider) {
  atmosSlider.addEventListener('input', () => {
    ensureAudio();
    applyAtmos(+atmosSlider.value);
    refreshAtmosDesc(+atmosSlider.value);
    try { localStorage.setItem('ss_atmos', atmosSlider.value); } catch (e) {}
  });
}

// Atmosphere 重置 / reset atmosphere to natural
const atmosReset = document.getElementById('atmosReset');
if (atmosReset) {
  atmosReset.addEventListener('click', () => {
    if (atmosSlider) { atmosSlider.value = 100; applyAtmos(100); refreshAtmosDesc(100); }
  });
}

// 进度条 / seek bar
const seekBar = document.getElementById('seekBar');
const timeCur = document.getElementById('timeCur');
const timeDur = document.getElementById('timeDur');
let seekDragging = false;

function fmtTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function updateSeekBar() {
  if (!seekBar || seekDragging || !decks) return;
  const audio = decks[activeDeck]?.audio;
  if (!audio) return;
  const dur = audio.duration;
  if (isFinite(dur) && dur > 0) {
    seekBar.max = dur;
    seekBar.value = audio.currentTime;
    if (timeCur) timeCur.textContent = fmtTime(audio.currentTime);
    if (timeDur) timeDur.textContent = fmtTime(dur);
  }
}

if (seekBar) {
  seekBar.addEventListener('mousedown',  () => { seekDragging = true; });
  seekBar.addEventListener('touchstart', () => { seekDragging = true; }, { passive: true });
  seekBar.addEventListener('input', () => {
    if (timeCur) timeCur.textContent = fmtTime(+seekBar.value);
  });
  seekBar.addEventListener('change', () => {
    seekDragging = false;
    const audio = decks?.[activeDeck]?.audio;
    if (audio && isFinite(audio.duration)) {
      try { audio.currentTime = +seekBar.value; } catch (e) {}
    }
  });
}

// EQ 音色按钮 / timbre preset buttons
document.querySelectorAll('.eq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ensureAudio();
    applyEQ(btn.dataset.eq);
  });
});

/* ---------- 7. 播放 / play ---------- */
const playBtn = document.getElementById('playBtn');
let audioLoading = false;

function refreshPlayBtn() {
  if (audioLoading) { playBtn.textContent = t(UI.loading); return; }
  playBtn.textContent = isPlaying ? t(UI.pause) : t(UI.play);
}

function setAudioLoading(on) {
  audioLoading = on;
  playBtn.classList.toggle('loading', on);
  refreshPlayBtn();
}

// 监听 audio 元素加载状态 / watch for buffering on both decks
function watchDeckLoading(audio) {
  audio.addEventListener('waiting',  () => { if (isPlaying) setAudioLoading(true);  });
  audio.addEventListener('playing',  () => setAudioLoading(false));
  audio.addEventListener('canplay',  () => setAudioLoading(false));
  audio.addEventListener('error',    () => setAudioLoading(false));
}
playBtn.addEventListener('click', () => {
  if (isPlaying) { stopVoices(); isPlaying = false; }
  else { ensureAudio(); setSound(true); playTrack(); isPlaying = true; }
  refreshPlayBtn();
});

/* ---------- 8. 声音开关 / sound toggle ---------- */
let soundOn = false;
function refreshSoundToggle() {
  document.querySelectorAll('.sound-toggle').forEach(el => {
    el.textContent = soundOn ? t(UI.soundOn) : t(UI.soundOff);
    el.classList.toggle('on', soundOn);
  });
}
function setSound(on) { soundOn = on; applyVolume(); refreshSoundToggle(); }
document.querySelectorAll('.sound-toggle').forEach(el =>
  el.addEventListener('click', () => { ensureAudio(); setSound(!soundOn); })
);


/* ============================================================
   9. Web Audio 引擎 / audio engine
   ============================================================ */
let ctx, masterGain, atmosFilter, analyser, freqData;
let _atmosLerpTarget = 100;
let realAudio, realSource, realFilter, realGain;   // 真实音轨链路(兼容旧引用)/ legacy refs
let decks = null, activeDeck = 0;                  // 双声道(交叉淡化)/ two decks for crossfade
let eqLow, eqMid, eqHigh;                         // 3-band EQ 节点
let currentEQPreset = 'grand';
const hasRealTrack = true;     // 已接入真实音频(glass-grid.wav)/ a real track is wired in
let isPlaying = false;

function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0;                 // 默认静音 / muted by default

  // 明暗滤波器(持久):通透=高截止,朦胧=低截止 / persistent atmosphere lowpass
  atmosFilter = ctx.createBiquadFilter();
  atmosFilter.type = 'lowpass';
  atmosFilter.frequency.value = 18000;

  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  freqData = new Uint8Array(analyser.frequencyBinCount);

  // 链路 / chain: (groups/decks) → atmosFilter → masterGain → analyser → EQ(3-band) → destination
  atmosFilter.connect(masterGain);
  masterGain.connect(analyser);

  // 3-band EQ chain: analyser → eqLow → eqMid → eqHigh → destination
  eqLow  = ctx.createBiquadFilter(); eqLow.type  = 'lowshelf';
  eqMid  = ctx.createBiquadFilter(); eqMid.type  = 'peaking';
  eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf';
  analyser.connect(eqLow);
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);
  eqHigh.connect(ctx.destination);

  // 真实音轨:文件 → 独立低通(滑块控制)→ 独立增益 → analyser
  // real track: file → its own lowpass (slider) → its own gain → analyser
  // 用 try/catch 包住:即使音频接线失败,也绝不能卡住页面导航 / never let this block navigation
  try {
    decks = [];
    for (const id of ['realAudio', 'realAudio2']) {
      const audio = document.getElementById(id);
      if (!audio) continue;
      const source = ctx.createMediaElementSource(audio);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = sliderToFreq(atmosSlider ? +atmosSlider.value : 100);
      const gain = ctx.createGain();
      gain.gain.value = 0;                    // 默认静音,随 soundOn 淡入 / muted until soundOn
      source.connect(filter); filter.connect(gain); gain.connect(analyser);
      watchDeckLoading(audio);
      decks.push({ audio, source, filter, gain });
    }
    if (decks[0]) { realAudio = decks[0].audio; realFilter = decks[0].filter; realGain = decks[0].gain; }  // 兼容 / legacy
  } catch (err) {
    console.warn('real track wiring failed:', err);
  }

  // 节点建好后立即应用当前 EQ 预设 / apply current EQ preset once nodes exist
  applyEQ(currentEQPreset);

  requestAnimationFrame(glowLoop);
}

// 滑块 0→100 映射到低通截止 350Hz→18kHz(对数,听感均匀)
// map slider 0→100 to lowpass cutoff 350Hz→18kHz (log, perceptually even)
function sliderToFreq(v) {
  return 350 * Math.pow(18000 / 350, Math.max(0, Math.min(100, v)) / 100);
}

// 应用氛围:实时改变真实音轨(和合成声)的低通 + 低值时给画面加"朦胧"
// apply atmosphere: morph the lowpass on the real track (+ synth), veil visuals when low
function applyAtmos(v) {
  const f = sliderToFreq(v);
  if (ctx) {
    const now = ctx.currentTime;
    if (decks) decks.forEach(d => { d.filter.frequency.cancelScheduledValues(now); d.filter.frequency.linearRampToValueAtTime(f, now + 0.2); });
    if (atmosFilter) { atmosFilter.frequency.cancelScheduledValues(now); atmosFilter.frequency.linearRampToValueAtTime(f, now + 0.2); }
  }
  document.body.classList.toggle('veiled', v < 45);
}

// 应用 EQ 音色预设 / apply timbre EQ preset
function applyEQ(presetKey) {
  const p = EQ_PRESETS[presetKey];
  if (!p) return;
  currentEQPreset = presetKey;
  try { localStorage.setItem('ss_eq', presetKey); } catch (e) {}
  if (eqLow && ctx) {
    const now = ctx.currentTime, ramp = now + 0.5;
    eqLow.frequency.setValueAtTime(p.low.freq, now);
    eqLow.gain.linearRampToValueAtTime(p.low.gain, ramp);
    eqMid.frequency.setValueAtTime(p.mid.freq, now);
    eqMid.Q.setValueAtTime(p.mid.Q || 1.0, now);
    eqMid.gain.linearRampToValueAtTime(p.mid.gain, ramp);
    eqHigh.frequency.setValueAtTime(p.high.freq, now);
    eqHigh.gain.linearRampToValueAtTime(p.high.gain, ramp);
  }
  refreshEQBtns();
}

function refreshEQBtns() {
  document.querySelectorAll('.eq-btn').forEach(btn => {
    const p = EQ_PRESETS[btn.dataset.eq];
    if (p) btn.textContent = t(p.name);
    btn.classList.toggle('active', btn.dataset.eq === currentEQPreset);
  });
  const descEl = document.getElementById('eqDesc');
  if (descEl) {
    const active = EQ_PRESETS[currentEQPreset];
    descEl.textContent = active ? t(active.desc) : '';
    descEl.classList.toggle('visible', !!active);
  }
}

function applyVolume() {
  if (!masterGain) return;
  const target = soundOn ? 0.14 : 0.0;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.8);
  if (decks) {                                 // 真实音轨:只让当前活跃声道发声 / only the active deck sounds
    const rt = soundOn ? 0.65 : 0.0;
    decks.forEach((d, i) => {
      d.gain.gain.cancelScheduledValues(ctx.currentTime);
      d.gain.gain.linearRampToValueAtTime(i === activeDeck ? rt : 0, ctx.currentTime + 0.8);
    });
  }
}


// 当前封面对应的音频文件名 / the audio file for the current cover
function currentSongAudio() {
  const c = currentScene && currentScene.covers[currentIndex];
  return (c && c.audio) || 'glass-grid.wav';
}
// gain 渐变通用 / ramp any gain node
function rampGain(g, target, dur) {
  if (!g || !ctx) return;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
  g.gain.linearRampToValueAtTime(target, ctx.currentTime + dur);
}
const XFADE = 2.5;   // 交叉淡化秒数 / crossfade seconds
// 放当前这首歌;换歌时新歌在另一个声道起播,两首叠着做 5 秒交叉淡化
// play current song; on a change the new song plays on the OTHER deck and the two crossfade over 5s
function playRealForCurrentSong() {
  if (!decks || !decks.length) return;
  const want = currentSongAudio();
  const fullVol = soundOn ? 0.9 : 0;
  const active = decks[activeDeck];
  const isCur = active.audio.src && active.audio.src.endsWith(want);
  if (isCur) {                                    // 同一首:继续/淡入 / same song: resume/fade in
    if (active.audio.paused) active.audio.play().catch(() => {});
    rampGain(active.gain, fullVol, 0.5);
    return;
  }
  if (decks.length < 2) {                         // 单声道兜底 / single-deck fallback
    active.audio.src = want; active.audio.play().catch(() => {});
    rampGain(active.gain, fullVol, XFADE);
    return;
  }
  const other = decks[1 - activeDeck];            // 交叉淡化到另一声道 / crossfade to the other deck
  if (other._pauseT) { clearTimeout(other._pauseT); other._pauseT = null; }   // 取消旧的暂停定时器 / cancel stale pause
  if (!other.audio.src || !other.audio.src.endsWith(want)) other.audio.src = want;
  try { other.audio.currentTime = 0; } catch (e) {}
  other.audio.play().catch(() => {});
  rampGain(other.gain, fullVol, XFADE);           // 新歌渐入 / new fades in
  rampGain(active.gain, 0, XFADE);                // 旧歌渐出(同时,叠着)/ old fades out, overlapping
  active._pauseT = setTimeout(() => { try { active.audio.pause(); } catch (e) {} active._pauseT = null; }, XFADE * 1000 + 250);
  activeDeck = 1 - activeDeck;
}

function playTrack() {
  if (!ctx) return;
  playRealForCurrentSong();
}

function stopVoices() {
  if (!decks) return;
  decks.forEach(d => {
    rampGain(d.gain, 0, 0.4);
    const a = d.audio; setTimeout(() => { try { a.pause(); } catch (e) {} }, 450);
  });
}

/* ---------- 10. 声画映射:音量 → 背景发光 / audio → glow ---------- */
let smooth = 0;
function glowLoop() {
  if (analyser) {
    analyser.getByteFrequencyData(freqData);
    let sum = 0;
    for (let i = 0; i < freqData.length; i++) sum += freqData[i];
    const avg = sum / freqData.length / 255;
    smooth += (avg - smooth) * 0.15;
    document.documentElement.style.setProperty('--glow-strength', smooth.toFixed(3));
  }
  updateSeekBar();
  requestAnimationFrame(glowLoop);
}

/* ============================================================
   11. 动态背景 / dynamic background (canvas)
   想改风格就改这个 BG_CONFIG;每加一个场景在这里加一行。
   Tweak everything here — add a line per scene.
   ============================================================ */
const BG_CONFIG = {
  cinematic: { style: 'float', count: 46, speed: 0.28, size: [1, 3.5] }, // 无 shapeSrc 的歌用漂浮颗粒 / float for songs without shapeSrc
  motion:    { style: 'pulse', speed: 1.0 },                              // 鼓点脉冲圆环 / beat rings
  _default:  { style: 'float', count: 34, speed: 0.20, size: [1, 3]  },
};
const VEILED_SPEED = 0.45;     // 朦胧时速度倍数 / speed × when veiled
const VEILED_BRIGHT = 0.5;     // 朦胧时亮度倍数 / brightness × when veiled
const TINT_PALENESS = 0.22;    // 颜色调淡程度(越大越淡,但保留色相)/ paleness, keeps hue

const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
let bgW, bgH, particles = [], rings = [], beatCooldown = 0;
let tint = { r: 150, g: 150, b: 170 };
let tintTarget = { r: 150, g: 150, b: 170 };
let palette = null;            // 当前颗粒调色板(rgb 字符串数组)/ current particle palette
let lastSampledSrc = null, sampleCanvas, sampleCtx;   // 封面采样缓存 / cover-sampling cache
let shapePoints = null, lastShapeSrc = null, emanate = 0;   // 形状颗粒 + 散开进度 / shape particles + spread progress
let shapeAngle = 0, sBass = 0, sMid = 0, sTreble = 0;       // 旋转角 + 平滑的低/中/高频 / rotation + smoothed bands
// 板块专属视觉状态 / per-board visual state
let motionShapes = [], motionBeatCool = 0, motionCenterR = 0, motionRingIdx = 0;
let relaxBlobs = null;
let sleepCurves = null;
let focusDots = null;
let fogCanvas, fogCtx;                                      // 离屏迷雾层 / offscreen mist layer
let shapeImg = null, shapeImgSrc = null;                   // 用于直接绘制的霓虹图 / the neon PNG drawn directly
let mx = 0, my = 0, emx = 0, emy = 0;                      // 鼠标视差(原始+平滑)/ mouse parallax (raw + eased)
const shapeTint = '170,100,208';   // 形状背景的发光色(紫)/ glow color for the shape bg

function resizeBg() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);   // 适配高分屏,线条才锐利 / retina-crisp
  bgW = window.innerWidth; bgH = window.innerHeight;
  bgCanvas.width = bgW * dpr; bgCanvas.height = bgH * dpr;
  bgCanvas.style.width = bgW + 'px'; bgCanvas.style.height = bgH + 'px';
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeBg);
resizeBg();
// 鼠标位置 → 归一化 -1..1,用于霓虹框的视差/倾斜 / cursor → -1..1 for parallax/tilt
window.addEventListener('mousemove', e => {
  mx = (e.clientX / window.innerWidth) * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
});

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substr(0,2),16), g: parseInt(h.substr(2,2),16), b: parseInt(h.substr(4,2),16) };
}
// 调淡 + 去饱和:往浅色靠,保证"淡淡的"不浓 / lighten toward soft light
function softTint(rgb) {
  const m = TINT_PALENESS;        // 往亮处提一点但保留色相(绿仍是绿)/ lighten a touch, keep hue
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * m),
    g: Math.round(rgb.g + (255 - rgb.g) * m),
    b: Math.round(rgb.b + (255 - rgb.b) * m),
  };
}
// 背景主色 = 当前歌曲封面渐变的亮端(以后换真图可改成图片采样)/ tint from current cover
function setTintFromSong() {
  if (!currentScene) return;
  const c = currentScene.covers[currentIndex];
  if (c.img) {                                // 颗粒背景 = 封面图"打散"成的颜色 / particles = the cover dispersed
    samplePaletteFromImage(c.img);
  } else if (c.palette && c.palette.length) {
    palette = c.palette.slice();
    setTintToAverage(palette);
  } else {
    palette = null;
    tintTarget = softTint(hexToRgb(c.grad[1]));
  }
}

// 平均调色板色 → 背景发光色 / averaged palette drives the glow
function setTintToAverage(cols) {
  const avg = cols.reduce((a, s) => {
    const p = s.split(',').map(Number);
    return [a[0] + p[0], a[1] + p[1], a[2] + p[2]];
  }, [0, 0, 0]);
  tintTarget = { r: avg[0] / cols.length, g: avg[1] / cols.length, b: avg[2] / cols.length };
}

// 把 palette 里采到的封面色转成 mistCols 格式([r,g,b]数组),供雾气粒子用
// convert sampled cover palette into mistCols [[r,g,b],...] for the mist system
function paletteToMistCols() {
  if (!palette || palette.length === 0) return null;
  const N = 6;
  const step = Math.max(1, Math.floor(palette.length / N));
  return Array.from({length: N}, (_, i) => {
    const s = palette[Math.min(i * step, palette.length - 1)];
    return s.split(',').map(Number);
  });
}

// 把封面缩小采样成一批颜色,作为颗粒色 → 背景就是"这张封面打散后的样子"
// sample the cover into a set of colors → the particle field IS the cover, dispersed
function samplePaletteFromImage(src) {
  if (src === lastSampledSrc && palette) return;     // 采样过就跳过 / skip if already sampled
  const img = new Image();
  img.onload = () => {
    const S = 44;
    if (!sampleCanvas) { sampleCanvas = document.createElement('canvas'); sampleCtx = sampleCanvas.getContext('2d'); }
    sampleCanvas.width = S; sampleCanvas.height = S;
    sampleCtx.drawImage(img, 0, 0, S, S);
    let data;
    try { data = sampleCtx.getImageData(0, 0, S, S).data; }
    catch (e) { console.warn('image sample failed:', e); return; }
    const cols = [];
    for (let i = 0; i < S * S; i++) {
      const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3];
      if (a < 40) continue;                            // 跳过透明 / skip transparent
      if (Math.max(r, g, b) < 38) continue;            // 跳过近黑 / skip near-black
      cols.push(`${r},${g},${b}`);
    }
    if (!cols.length) return;
    const N = 64, picked = [];
    for (let i = 0; i < N; i++) picked.push(cols[(Math.random() * cols.length) | 0]);
    palette = picked;
    lastSampledSrc = src;
    setTintToAverage(picked);
    window.__mist = null;   // 颜色到位后强制雾气用新调色板重建 / rebuild mist with new palette
  };
  img.src = src;
}

// 颗粒颜色按"到中心的半径"渐变:里圈蓝 → 中圈紫 → 外圈粉(取自霓虹本身的色系)
// particle color by radius: inner blue → mid purple → outer pink (the neon's own palette)
function radialColor(pr) {
  const t = Math.min(1, pr / 0.5);
  let a, b, f;
  if (t < 0.5) { a = [90, 200, 255]; b = [150, 110, 245]; f = t / 0.5; }        // 青蓝 → violet
  else         { a = [150, 110, 245]; b = [255, 110, 200]; f = (t - 0.5) / 0.5; } // violet → 品红
  return `${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)}`;
}

// 读透明霓虹图,取其"形状"作为颗粒的家位置;颜色用上面的半径渐变;再加随机散布让它铺开
// read the transparent neon PNG for particle home positions; color by radius; add scatter so it spreads
function sampleShapeFromImage(src) {
  if (src === lastShapeSrc) return;            // 采样过就跳过 / skip if already sampling
  lastShapeSrc = src;
  const img = new Image();
  img.onload = () => {
    const S = 140;
    if (!sampleCanvas) { sampleCanvas = document.createElement('canvas'); sampleCtx = sampleCanvas.getContext('2d'); }
    sampleCanvas.width = S; sampleCanvas.height = S;
    sampleCtx.clearRect(0, 0, S, S);
    sampleCtx.drawImage(img, 0, 0, S, S);
    let data;
    try { data = sampleCtx.getImageData(0, 0, S, S).data; }
    catch (e) { console.warn('shape sample failed:', e); lastShapeSrc = null; return; }
    const pts = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      if (data[i+3] < 70) continue;                                 // 只要不透明的形状 / only the shape
      if (Math.max(data[i], data[i+1], data[i+2]) < 110) continue;  // 跳过太暗 / skip dark
      const nx = x / S - 0.5, ny = y / S - 0.5;
      pts.push({ nx, ny, pr: Math.hypot(nx, ny) });
    }
    if (!pts.length) { lastShapeSrc = null; return; }
    const CAP = 700;
    let chosen = pts;
    if (pts.length > CAP) { chosen = []; const step = pts.length / CAP; for (let i = 0; i < CAP; i++) chosen.push(pts[(i * step) | 0]); }
    shapePoints = chosen.map(p => ({
      nx: p.nx, ny: p.ny, col: radialColor(p.pr),
      ph: Math.random() * Math.PI * 2,                 // 局部绕圈相位 / local orbit phase
      orbR: 0.006 + Math.random() * 0.02,              // 局部绕圈半径(小 → 形状仍隐约可辨)/ small orbit keeps the shape readable
      ospd: 0.6 + Math.random() * 0.9,                 // 局部绕圈速度 / local orbit speed
      tw: Math.random() * Math.PI * 2,                 // 闪烁相位 / twinkle phase
      pf: 0.5 + Math.random() * 1.3, ox: 0, oy: 0,
    }));
  };
  img.src = src;
}

// 直接把透明霓虹图载入,用于当背景结构绘制 / load the neon PNG to draw it as the background structure
function loadShapeImg(src) {
  if (src === shapeImgSrc) return;
  shapeImgSrc = src;
  const im = new Image();
  im.onload = () => { shapeImg = im; };
  im.onerror = () => { shapeImgSrc = null; };
  im.src = src;
}
function bgConfig() { return BG_CONFIG[currentSceneId] || BG_CONFIG._default; }
function initParticles(n) {
  particles = [];
  for (let i = 0; i < n; i++)
    particles.push({ x: Math.random()*bgW, y: Math.random()*bgH, sway: Math.random()*Math.PI*2, ci: i });
}

/**
 * 3D 音乐响应式立体魔法阵渲染器(用户编写)
 * 适配所有变量,直接运行在 Canvas 2D (bgCtx) 环境中
 */
function draw3DMusicVisualizer(bgCtx, bgW, bgH, vol, sBass, sMid, sTreble, freqData, analyser, grow, emx, emy, energy, brightMul) {
    // 1. 安全容错处理与基础配置
    const volume = vol || 0;
    const bass = sBass || 0;
    const mid = sMid || 0;
    const treble = sTreble || 0;
    const intensity = energy || 1;
    const opacity = (grow || 1) * (brightMul || 1);

    const centerX = bgW / 2;
    const centerY = bgH / 2;

    const time = Date.now() * 0.001;

    const rx = -emy * 0.4 - 0.30; // 俯仰角 (Pitch),稍微正一点更对称 / a bit more frontal
    const ry = emx * 0.45 + Math.sin(time * 0.3) * 0.05; // 偏航角 (Yaw)
    window.__rot = (window.__rot || 0) + 0.004 + energy * 0.012 + sMid * 0.03;   // 转速随滑块&旋律 / spin speed follows slider & melody
    const rz = window.__rot + bass * 0.02; // 自转角 (Roll)

    const fov = Math.min(bgW, bgH) * 1.0;    // 整体大小 / overall size
    const cameraZ = 400;

    function project(x, y, z) {
        let x1 = x * Math.cos(rz) - y * Math.sin(rz);
        let y1 = x * Math.sin(rz) + y * Math.cos(rz);
        let z1 = z;
        let x2 = x1 * Math.cos(ry) + z1 * Math.sin(ry);
        let y2 = y1;
        let z2 = -x1 * Math.sin(ry) + z1 * Math.cos(ry);
        let x3 = x2;
        let y3 = y2 * Math.cos(rx) - z2 * Math.sin(rx);
        let z3 = y2 * Math.sin(rx) + z2 * Math.cos(rx);
        const scale = fov / (cameraZ + z3);
        return { x: centerX + x3 * scale, y: centerY + y3 * scale, scale: scale, depth: z3 };
    }

    function draw3DObjectCircle(cx, cy, cz, radius, segments, color, lineWidth) {
        bgCtx.beginPath();
        for (let i = 0; i <= segments; i++) {
            let angle = (i / segments) * Math.PI * 2;
            let p = project(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, cz);
            if (i === 0) bgCtx.moveTo(p.x, p.y);
            else bgCtx.lineTo(p.x, p.y);
        }
        bgCtx.strokeStyle = color;
        bgCtx.lineWidth = lineWidth;
        bgCtx.stroke();
    }

    // (旧的环绕光点已去掉,改用中心外扩雾气 / orbiting halo removed; using outward mist instead)
    // (方框已去掉 / frame removed)

    if (!window.__noMandala) {                       // 某些歌只要雾、不要曼陀罗 / some songs: mist only, no mandala
    // 图层 4：莲花 rosette —— 蓝/紫/红 交替,线条柔化发光(虚,不生硬)/ lotus, softened glowing lines
    bgCtx.save();
    const petalN = 9;                       // 3 的倍数 → 蓝紫红正好循环 / multiple of 3 so the cycle closes
    const ringR = 58;
    const petalR = 58 + mid * 8;            // ≈ringR → flower-of-life 花瓣
    const petalCols = ['70, 150, 255', '170, 80, 245', '245, 60, 110'];   // 蓝 紫 红
    for (let i = 0; i < petalN; i++) {
        const ang = (i / petalN) * Math.PI * 2 + time * 0.05;
        const col = petalCols[i % 3];
        bgCtx.shadowColor = `rgba(${col}, 0.9)`;
        bgCtx.shadowBlur = 8;               // 发光柔化 → 虚 / glow softens the line
        draw3DObjectCircle(Math.cos(ang) * ringR, Math.sin(ang) * ringR, 0, petalR, 40, `rgba(${col}, ${0.26 * opacity})`, 1.0);
    }
    bgCtx.shadowBlur = 0;
    bgCtx.restore();

    // 图层 5：同心圆(同样柔化)/ concentric rings, softened too
    bgCtx.save();
    bgCtx.shadowBlur = 7;
    bgCtx.shadowColor = 'rgba(150, 130, 245, 0.85)';
    draw3DObjectCircle(0, 0,  0, 58 + bass * 6,   72, `rgba(150, 130, 245, ${0.4 * opacity})`, 1.0);
    bgCtx.shadowColor = 'rgba(235, 120, 210, 0.85)';
    draw3DObjectCircle(0, 0, 18, 92 + bass * 10,  72, `rgba(235, 120, 210, ${0.3 * opacity})`, 1.0);
    bgCtx.shadowColor = 'rgba(130, 180, 255, 0.85)';
    draw3DObjectCircle(0, 0, 36, 120 + bass * 12, 72, `rgba(130, 180, 255, ${0.26 * opacity})`, 1.0);
    bgCtx.shadowBlur = 0;
    bgCtx.restore();
    }                                                // end mandala gate / 曼陀罗结束

    // 图层 8：从中心向外扩散的雾气(柔团 / 颜色每首歌可配 / 滑块控制扩散远近+速度)
    // mist spreading outward from center: soft blobs, blue/purple/red like the lotus, reach & speed driven by the SLIDER
    const mistCols = window.__mistCols || [[70, 150, 255], [170, 80, 245], [245, 60, 110]];   // 每首歌可定制 / per-song
    const mistW = window.__mistWeights || null;                          // 颜色占比(累积)/ cumulative color weights
    const mistSize = window.__mistSize || 1;                             // 雾团大小倍数 / size multiplier
    const reach = 110 + energy * 300;                                     // 滑块越大,雾扩得越远 / slider → reach
    if (!window.__mist) {
        window.__mist = [];
        for (let i = 0; i < 70; i++) window.__mist.push({
            a: Math.random() * Math.PI * 2,
            r: Math.random(),                                             // 0..1 归一化进度 / normalized progress
            z: (Math.random() - 0.5) * 60,
            sp: 0.0014 + Math.random() * 0.003,
            sz: 26 + Math.random() * 34,
            cw: Math.random(),                                           // 颜色随机值 / color pick value
            pk: Math.random()                                           // 粒子/雾 区分 / particle-vs-mist pick
        });
    }
    if (window.__mistMode === 'burst') {
        // 小粒子 + 雾从中心"冲出来",不转圈(2D 放射,越往外越大越快,朝观众扑面)
        // particles + mist BURST out from centre — 2D radial, no spin, faster & bigger outward
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'lighter';
        const R = Math.min(bgW, bgH) * (0.40 + energy * 0.55);          // 滑块控制冲出距离 / slider controls burst reach
        for (const m of window.__mist) {
            m.r += m.sp * (1 + sBass * 2.2 + energy * 1.6);             // 滑块/鼓点加速冲出 / slider & bass speed the burst
            if (m.r > 1) m.r -= 1;
            const rr = m.r * m.r * R;                                    // 加速外冲 / accelerate outward
            const px = centerX + Math.cos(m.a) * rr, py = centerY + Math.sin(m.a) * rr;
            const fade = Math.sin(m.r * Math.PI);
            let ci; if (mistW) { ci = 0; while (ci < mistW.length - 1 && m.cw >= mistW[ci]) ci++; } else ci = (m.cw * mistCols.length) | 0;
            const [cr, cg, cb] = mistCols[ci % mistCols.length];
            if (m.pk < 0.45) {                                           // 柔雾团 / soft mist blob
                const size = (4 + m.r * 24) * mistSize;
                const g = bgCtx.createRadialGradient(px, py, 0, px, py, size);
                g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.16 * fade * opacity})`);
                g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
                bgCtx.fillStyle = g;
                bgCtx.beginPath(); bgCtx.arc(px, py, size, 0, Math.PI * 2); bgCtx.fill();
            } else {                                                    // 清晰小粒子 / crisp small particle
                const size = Math.max(0.5, (0.6 + m.r * 2.4) * mistSize);
                bgCtx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.75 * fade * opacity})`;
                bgCtx.beginPath(); bgCtx.arc(px, py, size, 0, Math.PI * 2); bgCtx.fill();
            }
        }
        bgCtx.restore();
    } else {
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'lighter';
        for (const m of window.__mist) {
            m.r += m.sp * (1 + sBass * 2.4 + energy * 0.6);             // 鼓点+滑块 → 扩散更快 / bass & slider speed it
            if (m.r > 1) m.r -= 1;
            const rad = m.r * reach;
            const p = project(Math.cos(m.a) * rad, Math.sin(m.a) * rad, m.z);
            const fade = Math.sin(m.r * Math.PI);                        // 中心/边缘淡 / fade at both ends
            const size = Math.max(1.5, m.sz * mistSize * p.scale * (0.7 + sBass * 0.8));
            let ci; if (mistW) { ci = 0; while (ci < mistW.length - 1 && m.cw >= mistW[ci]) ci++; } else ci = (m.cw * mistCols.length) | 0;   // 选色 / pick color
            const [cr, cg, cb] = mistCols[ci % mistCols.length];
            const g = bgCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
            g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.22 * fade * opacity})`);
            g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
            bgCtx.fillStyle = g;
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }
        bgCtx.restore();
    }

    // (图层6 四节点 / 图层7 中心波形 已删除 / nodes & center waveform removed)
}

// 把一张封面缩很小再放大画出来 → 自然模糊;铺满 1.3× 屏幕,指定透明度
// draw a cover scaled tiny then big → natural blur; cover 1.3× screen at the given alpha
let bgImgCache = {};
function drawBlurredBg(src, alpha, blurAmt, sc) {
  blurAmt = blurAmt == null ? 0.2 : blurAmt;          // 0=清晰 … 1=很糊 / 0=sharp … 1=very blurry
  sc = sc == null ? 1.3 : sc;                         // 缩放(1.0=铺满,更小=缩小)/ scale (1=cover, smaller=zoom out)
  let c = bgImgCache[src];
  if (!c) {
    c = bgImgCache[src] = { ready: false };
    const im = new Image();
    im.onload = () => {
      const sw = Math.round(60 + (1 - blurAmt) * 660); // blurAmt 越大缩得越小 → 越糊 / more blur = smaller downscale
      const w = sw, h = Math.max(1, Math.round(sw * im.height / im.width));
      const off = document.createElement('canvas'); off.width = w; off.height = h;
      off.getContext('2d').drawImage(im, 0, 0, w, h);
      c.canvas = off; c.ready = true;
    };
    im.onerror = () => { c.ready = false; };
    im.src = src;
  }
  if (!c.ready) return;
  const cv = c.canvas;
  const scale = Math.max(bgW / cv.width, bgH / cv.height) * Math.max(1, sc);  // sc<1 仍铺满,不留黑边
  const dw = cv.width * scale, dh = cv.height * scale;
  bgCtx.save();
  bgCtx.globalAlpha = alpha;
  bgCtx.filter = `blur(${(2 + blurAmt * 12).toFixed(1)}px)`;
  bgCtx.drawImage(cv, (bgW - dw) / 2, (bgH - dh) / 2, dw, dh);
  bgCtx.filter = 'none';
  bgCtx.restore();
}

// ═══════════════════════════════════════════════════════════════════
// 五种板块视觉语言 / Five board visual languages
// 沉浸深度由 atmosphere 滑块控制 / immersion depth driven by atmosphere slider
// ═══════════════════════════════════════════════════════════════════

// ─── 想象:封面从粒子里浮现,深度越深封面越清晰 ──────────────────────
function drawCinematic(depth, vol, bass, mid, treble, brightMul) {
  const song = currentScene?.covers[currentIndex];
  if (!song) return;
  const bgSrc = song.bgImg || song.img;
  if (bgSrc) drawBlurredBg(bgSrc, 0.12 + depth * 0.38, 0.85 - depth * 0.3, 1.3);
  if (song.img) samplePaletteFromImage(song.img);
  window.__mistCols = song.mistCols || paletteToMistCols() || null;
  window.__mistSize = 0.55 + depth * 1.1;
  window.__mistMode = 'burst';
  window.__noMandala = true;
  emanate += ((isPlaying ? 1 : 0) - emanate) * 0.045;
  if (emanate > 0.002) {
    sBass   += (bass   - sBass)   * 0.45;
    sMid    += (mid    - sMid)    * 0.40;
    sTreble += (treble - sTreble) * 0.55;
    emx += (mx - emx) * 0.05; emy += (my - emy) * 0.05;
    const energy = 0.22 + depth * 0.78;
    const grow = emanate * emanate * (3 - 2 * emanate);
    bgCtx.globalCompositeOperation = 'source-over'; bgCtx.shadowBlur = 0; bgCtx.filter = 'none';
    draw3DMusicVisualizer(bgCtx, bgW, bgH, vol, sBass, sMid, sTreble, freqData, analyser, grow, emx, emy, energy, brightMul);
    bgCtx.globalCompositeOperation = 'source-over'; bgCtx.shadowBlur = 0; bgCtx.filter = 'none';
  }
}

// ─── 运动:鼓点触发扩散圆环,奇数环清晰偶数环模糊交替 ───────────────
function drawMotion(depth, vol, bass, brightMul, speedMul) {
  const cx = bgW / 2, cy = bgH / 2;
  const col = `${Math.round(tint.r)},${Math.round(tint.g)},${Math.round(tint.b)}`;

  // 中心呼吸光晕 / center breathing glow
  motionCenterR += (40 + vol * 110 - motionCenterR) * 0.10;
  bgCtx.save(); bgCtx.globalCompositeOperation = 'lighter';
  const cg = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, motionCenterR + 80);
  cg.addColorStop(0, `rgba(${col},${(0.18 + depth * 0.18) * brightMul})`);
  cg.addColorStop(1, `rgba(${col},0)`);
  bgCtx.fillStyle = cg;
  bgCtx.beginPath(); bgCtx.arc(cx, cy, motionCenterR + 80, 0, Math.PI * 2); bgCtx.fill();
  bgCtx.restore();

  // 鼓点触发单环,冷却期长,稀疏 / one ring per beat, long cooldown
  motionBeatCool--;
  if (bass > 0.42 - depth * 0.10 && motionBeatCool <= 0) {
    motionShapes.push({
      r: 10,
      speed: (3 + bass * 6) * speedMul,
      a: (0.55 + depth * 0.35) * brightMul,
      w: 1.8 + bass * 3 + depth * 1.2,
      idx: motionRingIdx++,   // 用于奇偶判断清晰/模糊
    });
    motionBeatCool = Math.round(22 / speedMul);
  }

  // 绘制环:每两环交替清晰→模糊→清晰 / alternate sharp/soft every 2 rings
  bgCtx.save(); bgCtx.globalCompositeOperation = 'lighter';
  motionShapes = motionShapes.filter(ring => {
    ring.r += ring.speed;
    ring.a *= 0.935;
    if (ring.a < 0.008 || ring.r > Math.max(bgW, bgH) * 0.84) return false;
    const soft = Math.floor(ring.idx / 2) % 2 === 1;  // 0,1=clear  2,3=soft  4,5=clear …
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    if (soft) {
      bgCtx.strokeStyle = `rgba(${col},${ring.a * 0.55})`;
      bgCtx.lineWidth = ring.w * 0.45;
      bgCtx.shadowColor = `rgba(${col},0.35)`;
      bgCtx.shadowBlur = 28 + depth * 18;
    } else {
      bgCtx.strokeStyle = `rgba(${col},${ring.a})`;
      bgCtx.lineWidth = ring.w;
      bgCtx.shadowColor = `rgba(${col},0.65)`;
      bgCtx.shadowBlur = 6 + depth * 8;
    }
    bgCtx.stroke();
    return true;
  });
  bgCtx.shadowBlur = 0; bgCtx.restore();
}

// ─── 工作:极简点阵,几乎静止,只有极微弱的呼吸 ──────────────────────
function drawFocus(depth, vol, bass, brightMul) {
  const spacing = 42;
  if (!focusDots) {
    focusDots = [];
    const cols = Math.ceil(bgW / spacing) + 1, rows = Math.ceil(bgH / spacing) + 1;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        focusDots.push({ x: c * spacing, y: r * spacing, ph: Math.random() * Math.PI * 2 });
  }
  const t = Date.now() * 0.00055;
  bgCtx.save();
  for (const d of focusDots) {
    const breath = 0.5 + 0.5 * Math.sin(t * 0.35 + d.ph);
    const dotR = (0.7 + breath * 0.55 + bass * 0.7) * (0.65 + depth * 0.55);
    const alpha = (0.022 + depth * 0.038 + breath * 0.012) * brightMul;
    bgCtx.beginPath();
    bgCtx.arc(d.x, d.y, dotR, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(90,140,150,${alpha})`;
    bgCtx.fill();
  }
  bgCtx.restore();
}

// ─── 放松:大面积呼吸色团缓慢漂浮 ────────────────────────────────
const RELAX_COLS = [[150,165,190],[185,155,215],[135,195,165],[200,175,150]];
function drawRelax(depth, vol, bass, brightMul, speedMul) {
  if (!relaxBlobs) {
    relaxBlobs = [];
    for (let i = 0; i < 11; i++)
      relaxBlobs.push({
        x: Math.random() * bgW, y: Math.random() * bgH,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: 75 + Math.random() * 130,
        ph: Math.random() * Math.PI * 2,
        spd: 0.022 + Math.random() * 0.028,
        ci: i % RELAX_COLS.length,
      });
  }
  const t = Date.now() * 0.00048;
  bgCtx.save(); bgCtx.globalCompositeOperation = 'lighter';
  for (const b of relaxBlobs) {
    b.x += b.vx * speedMul * 0.45; b.y += b.vy * speedMul * 0.45;
    if (b.x < -250) b.x = bgW + 120; if (b.x > bgW + 250) b.x = -120;
    if (b.y < -250) b.y = bgH + 120; if (b.y > bgH + 250) b.y = -120;
    const breath = 0.5 + 0.5 * Math.sin(t * b.spd * 5.5 + b.ph);
    const curR = b.r * (0.78 + breath * 0.44 + bass * 0.28) * (0.65 + depth * 0.55);
    const alpha = (0.038 + depth * 0.048 + breath * 0.025) * brightMul;
    const [cr, cg, cb] = RELAX_COLS[b.ci];
    const g = bgCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, curR);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    bgCtx.fillStyle = g;
    bgCtx.beginPath(); bgCtx.arc(b.x, b.y, curR, 0, Math.PI * 2); bgCtx.fill();
  }
  bgCtx.restore();
}

// ─── 催眠:横向正弦曲线,深度越深速度越趋近于静止 ────────────────────
function drawSleep(depth, vol, bass, brightMul) {
  if (!sleepCurves) {
    sleepCurves = [];
    for (let i = 0; i < 5; i++)
      sleepCurves.push({
        yBase: (i + 1) / 6 * bgH,
        amp: 28 + Math.random() * 38,
        ph: Math.random() * Math.PI * 2,
        spd: 0.00028 + Math.random() * 0.00022,
        col: i % 2 === 0 ? [90,110,170] : [115,85,165],
      });
  }
  const t = Date.now();
  const moveScale = 1 - depth * 0.88;   // C档几乎静止 / nearly still at C
  bgCtx.save(); bgCtx.globalCompositeOperation = 'lighter';
  for (const c of sleepCurves) {
    const amp = c.amp * (0.45 + vol * 1.6) * (0.55 + depth * 0.65);
    const alpha = (0.085 + depth * 0.13) * brightMul;
    const [cr, cg, cb] = c.col;
    bgCtx.beginPath();
    for (let x = 0; x <= bgW; x += 7) {
      const y = c.yBase
        + Math.sin(x * 0.0075 + t * c.spd * moveScale + c.ph) * amp
        + Math.sin(x * 0.0028 + t * c.spd * moveScale * 0.65) * amp * 0.38;
      x === 0 ? bgCtx.moveTo(x, y) : bgCtx.lineTo(x, y);
    }
    bgCtx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
    bgCtx.lineWidth = 1.4 + depth * 2.2;
    bgCtx.shadowColor = `rgba(${cr},${cg},${cb},0.65)`;
    bgCtx.shadowBlur = 7 + depth * 14;
    bgCtx.stroke();
  }
  bgCtx.shadowBlur = 0; bgCtx.restore();
}

let bgFrame = 0;
function bgLoop() {
  requestAnimationFrame(bgLoop);
  bgFrame++;
  if (!bgCtx) return;

  // 颜色平滑过渡 / lerp tint
  tint.r += (tintTarget.r - tint.r) * 0.06;
  tint.g += (tintTarget.g - tint.g) * 0.06;
  tint.b += (tintTarget.b - tint.b) * 0.06;

  // 音频能量(音量 + 低频鼓点)/ audio energy (volume + bass)
  let vol = 0, bass = 0;
  if (analyser) {
    analyser.getByteFrequencyData(freqData);
    let s = 0; for (let i = 0; i < freqData.length; i++) s += freqData[i];
    vol = s / freqData.length / 255;
    let b = 0; for (let i = 0; i < 8; i++) b += freqData[i];
    bass = b / 8 / 255;
  }

  // 算法洞察面板刷新 / algo insight panel refresh
  if (bgFrame % 30 === 0) refreshSceneAlgoPanel();

  // 心率驱动氛围缓动 / heart-rate atmosphere lerp (每10帧更新一次)
  if (atmosSlider && bgFrame % 10 === 0 && Math.abs(_atmosLerpTarget - +atmosSlider.value) > 0.5) {
    const cur = +atmosSlider.value;
    const next = cur + (_atmosLerpTarget - cur) * 0.15;
    atmosSlider.value = next;
    applyAtmos(next);
  }

  // 通透/朦胧:速度 + 亮度 / atmosphere multipliers
  const isVeiled  = document.body.classList.contains('veiled');
  const speedMul  = isVeiled ? VEILED_SPEED  : 1;
  const brightMul = isVeiled ? VEILED_BRIGHT : 1;

  bgCtx.clearRect(0, 0, bgW, bgH);
  const cfg = bgConfig();
  const col = `${Math.round(tint.r)},${Math.round(tint.g)},${Math.round(tint.b)}`;
  // 让主发光层也跟着歌曲颜色走(这才是最显眼的背景)/ drive the dominant glow with the song color
  document.documentElement.style.setProperty('--glow-color', col);

  // 频段平滑 (所有板块共用) / smoothed frequency bands shared by all boards
  let mid = 0, treble = 0;
  if (analyser) {
    let ms = 0; for (let i = 8; i < 30; i++) ms += freqData[i]; mid = ms / 22 / 255;
    let ts = 0; for (let i = 30; i < 96; i++) ts += freqData[i]; treble = ts / 66 / 255;
  }

  // 沉浸深度:atmosphere 滑块驱动 (veiled=1 最沉浸 / natural=0 最轻)
  const depth = atmosSlider ? 1 - atmosSlider.value / 100 : 0;

  // 每个板块调用专属视觉函数 / dispatch to board-specific visual
  if (currentSceneId === 'cinematic') {
    drawCinematic(depth, vol, bass, mid, treble, brightMul);
  } else if (currentSceneId === 'motion') {
    drawMotion(depth, vol, bass, brightMul, speedMul);
  } else if (currentSceneId === 'focus') {
    drawFocus(depth, vol, bass, brightMul);
  } else if (currentSceneId === 'relax') {
    drawRelax(depth, vol, bass, brightMul, speedMul);
  } else if (currentSceneId === 'sleep') {
    drawSleep(depth, vol, bass, brightMul);
  } else {
    // 兜底:漂浮颗粒 / fallback floating particles
    if (particles.length !== cfg.count) initParticles(cfg.count);
    const [smin, smax] = cfg.size;
    particles.forEach(p => {
      p.sway += 0.01;
      p.y -= cfg.speed * speedMul * (0.5 + vol);
      p.x += Math.sin(p.sway) * 0.3 * speedMul;
      if (p.y < -10) { p.y = bgH + 10; p.x = Math.random() * bgW; }
      const radius = smin + (smax - smin) * ((Math.sin(p.sway) + 1) / 2);
      bgCtx.beginPath(); bgCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      const pcol = palette ? palette[p.ci % palette.length] : col;
      bgCtx.fillStyle = `rgba(${pcol},${(0.12 + vol * 0.25) * brightMul})`;
      bgCtx.fill();
    });
  }

  // 心跳脉冲圆环 / heartbeat ripple ring
  if (window.heartPulse > 0.01) {
    const hp = window.heartPulse;
    const r = (1 - hp) * Math.max(bgW, bgH) * 0.75;
    bgCtx.beginPath();
    bgCtx.arc(bgW / 2, bgH / 2, r, 0, Math.PI * 2);
    bgCtx.strokeStyle = `rgba(255,200,200,${hp * 0.18})`;
    bgCtx.lineWidth = 2 + hp * 3;
    bgCtx.stroke();
    window.heartPulse *= 0.88;
  }
}
bgLoop();

/* ---------- 键盘快捷键 / keyboard shortcuts ---------- */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;   // 不拦截滑块/输入框
  if (e.key === ' ') {
    e.preventDefault();
    if (!currentScene) return;
    if (isPlaying) { stopVoices(); isPlaying = false; }
    else { ensureAudio(); setSound(true); playTrack(); isPlaying = true; }
    refreshPlayBtn();
  }
  if (!currentScene) return;
  if (e.key === 'ArrowLeft')  selectCover(currentIndex - 1);
  if (e.key === 'ArrowRight') selectCover(currentIndex + 1);
});

/* ============================================================
   12. 情绪导航器 / Russell Circumplex Navigator
   理论来源 / Theory: Russell (1980) + Kim & André (2008)
   两轴: X = valence (-1..1), Y = arousal (-1..1)
   算法: arousal (心率BPM) → board → EQ + Atmosphere
   ============================================================ */

// 导航器 + 算法模块文案 / i18n strings for navigator + algo section
Object.assign(UI, {
  navNavigator: { en: 'Navigator', zh: '情绪导航' },
  navTitle:     { en: 'Emotion Navigator', zh: '情绪导航器' },
  navSub:       { en: 'Not sure which sound world fits? Describe how you feel — the system will recommend one.',
                  zh: '不确定自己需要哪个声音世界？告诉系统你现在的状态，它来帮你匹配。' },
  navDragHint:  { en: 'Drag the dot · or adjust sliders on the right', zh: '拖动光点 · 或调整右侧滑块' },
  navStep1:     { en: '① Your current state', zh: '① 描述你现在的状态' },
  navStep2:     { en: '② Recommendation — updates as you move', zh: '② 实时推荐（随滑块同步更新）' },
  navStep3:     { en: '③ Enter — settings applied automatically', zh: '③ 进入声音世界 · 推荐参数自动应用' },
  navSection:   { en: 'Emotion Algorithm', zh: '情绪算法' },
  navEntryBtn:  { en: 'Auto-Select', zh: '情绪导航' },
  navEntryHint: { en: 'Map your current state to the right sound world', zh: '把你当前的情绪状态映射到对应的声音世界' },
  simArousal:   { en: 'Energy level', zh: '能量感' },
  simValence:   { en: 'Mood direction', zh: '情绪方向' },
  simLow:       { en: 'Calm', zh: '平静' },
  simHigh:      { en: 'Tense', zh: '紧张' },
  simNeg:       { en: 'Heavy', zh: '低落' },
  simPos:       { en: 'Light', zh: '愉悦' },
  simArousalNote: { en: 'Are you calm and still, or activated and tense right now?', zh: '你现在身体能量感低沉，还是感到紧绷激活？' },
  simValenceNote: { en: 'Is your mood leaning positive and light, or negative and heavy?', zh: '你现在的情绪偏向愉悦轻盈，还是低落沉重？' },
  simHardwareNote: { en: 'These sliders let you self-report your state. Connect a heart rate sensor in the scene player to drive arousal in real time.', zh: '滑块用于自我报告当前状态。在场景页连接心率传感器，可实时驱动唤醒度。' },
  algoInsightLabel:   { en: 'Algorithm Insight', zh: '算法洞察' },
  algoInsightBPM:     { en: 'Heart Rate', zh: '心率' },
  algoInsightArousal: { en: 'Arousal', zh: '唤醒度' },
  algoInsightValence: { en: 'Valence', zh: '效价' },
  algoBoard:    { en: 'Sound World', zh: '声音世界' },
  algoEQ:       { en: 'Timbre', zh: '音色' },
  algoAtmos:    { en: 'Atmosphere', zh: '氛围' },
  algoBPM:      { en: 'Rec. BPM', zh: '推荐 BPM' },
  algoCoord:    { en: 'Coordinates', zh: '坐标' },
  algoEnter:    { en: 'Enter this sound world →', zh: '进入这个声音世界 →' },
  algoSrcNote:  { en: 'Algorithm: Russell (1980) · Kim & André (2008) · arousal via real-time heart rate', zh: '算法来源：Russell (1980) · Kim & André (2008) · 心率实时驱动唤醒度' },
  algoComing:   { en: 'Board coming soon →', zh: '此板块即将上线 →' },

  // About 页外链区块 / other work links
  moreWorkTitle:     { en: 'More Work', zh: '其他作品' },
  linkOriginalMusic: { en: 'Original Music & MV ↗', zh: '原创音乐 + MV ↗' },
  linkWorldMusic:    { en: 'World Music — Chinese Instruments ↗', zh: '世界音乐：中国乐器 ↗' },
  linkIntelligence:  { en: 'Music Intelligence Platform ↗', zh: '音乐人情报台 ↗' },
  linkBilibili:      { en: 'Bilibili ↗', zh: 'Bilibili ↗' },

  // 选择页对比卡 / selection page comparison cards
  compareManual:     { en: 'Manual', zh: '自主选择' },
  compareManualDesc: { en: 'You know what you need — pick a sound world and go in.', zh: '你知道自己现在需要什么，直接选板块进入。' },
  compareAlgo:       { en: 'Algorithm', zh: '情绪算法' },
  compareAlgoDesc:   { en: 'Not sure? Map your current arousal and mood — the system routes you automatically based on Russell (1980).', zh: '不确定？输入唤醒度和情绪方向，系统根据 Russell 情绪模型自动匹配。' },
  algoSourceTag:     { en: 'Russell (1980) · Kim & André (2008) · Karageorghis (2012)', zh: 'Russell (1980) · Kim & André (2008) · Karageorghis (2012)' },
});

// Russell 圆上8个情绪锚点（用于标注）/ 8 emotion anchors for labeling
const RUSSELL_ANCHORS = [
  { angle: 0,   label: { en: 'Pleased',   zh: '愉悦' } },
  { angle: 45,  label: { en: 'Excited',   zh: '兴奋' } },
  { angle: 90,  label: { en: 'Tense',     zh: '紧张' } },
  { angle: 135, label: { en: 'Distressed',zh: '苦恼' } },
  { angle: 180, label: { en: 'Depressed', zh: '抑郁' } },
  { angle: 225, label: { en: 'Tired',     zh: '疲倦' } },
  { angle: 270, label: { en: 'Sleepy',    zh: '昏沉' } },
  { angle: 315, label: { en: 'Relaxed',   zh: '放松' } },
];

// 当前导航器状态 / current navigator state
let navValence = 0.2;  // -1..1
let navArousal = 0.0;  // -1..1
let navBoardId = 'cinematic';

// 算法：坐标 → 板块 / coord → board
function algoBoard(v, a) {
  if (a > 0.35)                   return 'motion';
  if (a > 0.05 && v >= 0)         return 'cinematic';
  if (a < -0.15)                  return v > -0.2 ? 'sleep' : 'sleep';
  if (v >= 0)                     return 'relax';
  return 'focus';
}

// 算法：唤醒 → EQ预设 / arousal → EQ preset
function algoEQPreset(v, a) {
  if (a > 0.4)          return 'power';
  if (a > 0.1)          return 'grand';
  if (a < -0.25)        return 'dark';
  if (v > 0.2)          return 'warm';
  return 'clear';
}

// 算法：唤醒 → Atmosphere值 / arousal → atmosphere 0..100
function algoAtmosVal(a) {
  return Math.round(55 + a * 45);  // -1→10, 0→55, 1→100
}

// 算法：板块 → 推荐BPM / board → recommended BPM
const BOARD_BPM = {
  sleep:     { en: '50–60 BPM', zh: '50–60 BPM' },
  relax:     { en: '60–72 BPM', zh: '60–72 BPM' },
  focus:     { en: '72–88 BPM', zh: '72–88 BPM' },
  cinematic: { en: '60–96 BPM', zh: '60–96 BPM' },
  motion:    { en: '125–140 BPM', zh: '125–140 BPM' },
};

// 刷新算法输出面板 / refresh the output panel
function refreshAlgoOutput() {
  const boardId = algoBoard(navValence, navArousal);
  navBoardId = boardId;
  const eqKey   = algoEQPreset(navValence, navArousal);
  const atmos   = algoAtmosVal(navArousal);
  const bpm     = BOARD_BPM[boardId] || { en: '—', zh: '—' };

  const boardName = STATES.find(s => s.id === boardId)?.name || { en: boardId, zh: boardId };
  const eqName    = EQ_PRESETS[eqKey]?.name || { en: eqKey, zh: eqKey };

  const bv = document.getElementById('algoBoardVal');
  const ev = document.getElementById('algoEQVal');
  const av = document.getElementById('algoAtmosVal');
  const bpm_v = document.getElementById('algoBPMVal');
  const cv = document.getElementById('algoCoordVal');
  if (bv) { bv.textContent = t(boardName); bv.classList.add('highlight'); }
  if (ev) ev.textContent = t(eqName);
  if (av) av.textContent = atmos + ' / 100';
  if (bpm_v) bpm_v.textContent = t(bpm);
  if (cv) cv.textContent = `V ${navValence >= 0 ? '+' : ''}${navValence.toFixed(2)}  A ${navArousal >= 0 ? '+' : ''}${navArousal.toFixed(2)}`;

  // 同步滑块位置 / sync sliders to match (without firing their events)
  const as = document.getElementById('simArousalSlider');
  const vs = document.getElementById('simValenceSlider');
  if (as && Math.abs(+as.value / 100 - navArousal) > 0.02) as.value = Math.round(navArousal * 100);
  if (vs && Math.abs(+vs.value / 100 - navValence) > 0.02) vs.value = Math.round(navValence * 100);

  drawCircumplex();

  // 推荐板块尚无音轨时禁用进入按钮 / disable enter btn if board has no tracks yet
  const enterBtn = document.getElementById('algoEnterBtn');
  if (enterBtn) {
    const avail = !!SCENES[boardId];
    enterBtn.disabled = !avail;
    enterBtn.textContent = avail ? t(UI.algoEnter) : t(UI.algoComing);
  }
}

/* ---------- 算法洞察面板（场景页）/ Scene algo insight panel ---------- */
function refreshSceneAlgoPanel() {
  const panel = document.getElementById('algoInsightPanel');
  if (!panel || !panel.classList.contains('open')) return;

  const bpmEl       = document.getElementById('aiBPM');
  const arousalBar  = document.getElementById('aiArousalBar');
  const arousalNum  = document.getElementById('aiArousalNum');
  const valenceBar  = document.getElementById('aiValenceBar');
  const valenceNum  = document.getElementById('aiValenceNum');
  const boardEl     = document.getElementById('aiBoard');
  const eqEl        = document.getElementById('aiEQPanel');
  const atmosEl     = document.getElementById('aiAtmosPanel');

  if (bpmEl) bpmEl.textContent = _heartSmooth > 0 ? Math.round(_heartSmooth) + ' BPM' : '--';

  // 进度条：navArousal / navValence 均为 -1..1，归一化到 0–100%
  const aPct = ((navArousal + 1) / 2 * 100).toFixed(0);
  const vPct = ((navValence + 1) / 2 * 100).toFixed(0);
  if (arousalBar) arousalBar.style.width = aPct + '%';
  if (valenceBar) valenceBar.style.width = vPct + '%';
  if (arousalNum) arousalNum.textContent = (navArousal >= 0 ? '+' : '') + navArousal.toFixed(2);
  if (valenceNum) valenceNum.textContent = (navValence >= 0 ? '+' : '') + navValence.toFixed(2);

  const boardId   = algoBoard(navValence, navArousal);
  const boardName = STATES.find(s => s.id === boardId)?.name;
  const eqKey     = algoEQPreset(navValence, navArousal);
  const eqName    = EQ_PRESETS[eqKey]?.name;
  const atmos     = algoAtmosVal(navArousal);

  if (boardEl && boardName) boardEl.textContent = t(boardName);
  if (eqEl && eqName)       eqEl.textContent    = t(eqName);
  if (atmosEl)              atmosEl.textContent  = atmos + ' / 100';
}

/* ---------- Canvas 圆圈绘制 / circumplex canvas render ---------- */
const navCanvas = document.getElementById('navCanvas');
const navCtx = navCanvas ? navCanvas.getContext('2d') : null;

// 高清屏适配 / retina-sharp canvas setup
(function initNavCanvas() {
  if (!navCanvas) return;
  const CSS_SIZE = 280;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  navCanvas.width  = CSS_SIZE * dpr;
  navCanvas.height = CSS_SIZE * dpr;
  navCanvas.style.width  = CSS_SIZE + 'px';
  navCanvas.style.height = CSS_SIZE + 'px';
  if (navCtx) navCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

function drawCircumplex() {
  if (!navCtx) return;
  // Use CSS logical size (transform already applied) / 用CSS尺寸，坐标系已缩放
  const W = parseFloat(navCanvas.style.width)  || navCanvas.width;
  const H = parseFloat(navCanvas.style.height) || navCanvas.height;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.42;          // 圆半径 / circle radius
  const dpr = window.devicePixelRatio || 1;

  navCtx.clearRect(0, 0, W, H);

  // 背景填充 / background
  navCtx.fillStyle = 'rgba(12,14,20,0.97)';
  navCtx.beginPath(); navCtx.arc(cx, cy, R + 28, 0, Math.PI * 2); navCtx.fill();

  // 四象限颜色区 / quadrant color zones (subtle)
  const quads = [
    { startAngle: -Math.PI/2, endAngle: 0,         color: 'rgba(205,70,95,0.08)'  }, // 高唤醒正 → Motion
    { startAngle: 0,          endAngle: Math.PI/2,  color: 'rgba(90,110,170,0.07)' }, // 高唤醒负
    { startAngle: Math.PI/2,  endAngle: Math.PI,    color: 'rgba(90,140,150,0.07)' }, // 低唤醒负 → Focus
    { startAngle: Math.PI,    endAngle: Math.PI*3/2,color: 'rgba(150,165,190,0.09)'}, // 低唤醒正 → Relax/Sleep
  ];
  quads.forEach(q => {
    navCtx.beginPath();
    navCtx.moveTo(cx, cy);
    navCtx.arc(cx, cy, R, q.startAngle, q.endAngle);
    navCtx.closePath();
    navCtx.fillStyle = q.color;
    navCtx.fill();
  });

  // 主圆环 / main ring
  navCtx.beginPath();
  navCtx.arc(cx, cy, R, 0, Math.PI * 2);
  navCtx.strokeStyle = 'rgba(255,255,255,0.12)';
  navCtx.lineWidth = 1.5;
  navCtx.stroke();

  // 十字轴 / crosshair axes
  navCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  navCtx.lineWidth = 1;
  navCtx.setLineDash([4, 5]);
  navCtx.beginPath(); navCtx.moveTo(cx - R, cy); navCtx.lineTo(cx + R, cy); navCtx.stroke();
  navCtx.beginPath(); navCtx.moveTo(cx, cy - R); navCtx.lineTo(cx, cy + R); navCtx.stroke();
  navCtx.setLineDash([]);

  // 轴标签 / axis labels
  const axisFontSz = Math.round(W * 0.045);
  navCtx.font = `${axisFontSz}px -apple-system, Arial, sans-serif`;
  navCtx.fillStyle = 'rgba(139,138,150,0.65)';
  navCtx.textAlign = 'center';
  navCtx.fillText(lang === 'zh' ? '高唤醒' : 'High Arousal', cx, cy - R - 10);
  navCtx.fillText(lang === 'zh' ? '低唤醒' : 'Low Arousal',  cx, cy + R + 20);
  navCtx.fillText(lang === 'zh' ? '负面' : 'Neg', cx - R - 6, cy + 4);
  navCtx.fillText(lang === 'zh' ? '正面' : 'Pos', cx + R + 6, cy + 4);

  // 8个情绪锚点 / 8 emotion anchor labels
  const anchorR = R + 18;
  const labelFontSz = Math.round(W * 0.038);
  navCtx.font = `${labelFontSz}px -apple-system, Arial, sans-serif`;
  navCtx.fillStyle = 'rgba(139,138,150,0.45)';
  RUSSELL_ANCHORS.forEach(a => {
    // angle convention: 0°=right(正面/Positive), 90°=up(高唤醒/HighArousal) → but canvas Y is flipped
    // Russell: 0°=Pleased(pos,neutral), 45°=Excited(pos,high), 90°=Tense(neg,high) ...
    // We map: right=+valence, up=+arousal; canvas: up=negative Y
    // angle 0 → right center → (cx+anchorR, cy)
    // angle 90 → top → (cx, cy-anchorR)  ← arousal is UP so we negate Y
    const rad = (a.angle * Math.PI / 180);
    // valence=cos(angle), arousal=sin(angle), but arousal is up so Y = -sin
    const lx = cx + anchorR * Math.cos(rad);
    const ly = cy - anchorR * Math.sin(rad);   // negate because canvas Y is down
    navCtx.textAlign = lx < cx - 5 ? 'right' : lx > cx + 5 ? 'left' : 'center';
    navCtx.fillText(t(a.label), lx, ly);
  });

  // 板块区域标注 / board zone labels inside the circle
  const zoneFontSz = Math.round(W * 0.042);
  navCtx.font = `${zoneFontSz}px -apple-system, Arial, sans-serif`;
  const zoneLabels = [
    { x: cx + R * 0.52, y: cy - R * 0.52, board: 'motion',    col: '205,70,95'    },
    { x: cx + R * 0.52, y: cy + R * 0.42, board: 'relax',     col: '150,165,190'  },
    { x: cx - R * 0.52, y: cy + R * 0.52, board: 'sleep',     col: '90,110,170'   },
    { x: cx - R * 0.42, y: cy - R * 0.52, board: 'focus',     col: '90,140,150'   },
    { x: cx + R * 0.22, y: cy - R * 0.25, board: 'cinematic', col: '120,150,200'  },
  ];
  zoneLabels.forEach(z => {
    const st = STATES.find(s => s.id === z.board);
    const label = st ? t(st.name) : z.board;
    const isActive = z.board === navBoardId;
    navCtx.fillStyle = `rgba(${z.col},${isActive ? 0.9 : 0.3})`;
    navCtx.textAlign = 'center';
    navCtx.font = `${isActive ? zoneFontSz + 1 : zoneFontSz}px -apple-system, Arial, sans-serif`;
    navCtx.fillText(label, z.x, z.y);
  });

  // 当前坐标点 / current position dot
  const dotX = cx + navValence * R;
  const dotY = cy - navArousal * R;    // 唤醒向上 → Y取负 / arousal up = negative Y
  const glowCol = currentScene?.glow || '185,161,107';

  // 外发光 / outer glow
  const grd = navCtx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 22);
  grd.addColorStop(0, `rgba(${glowCol},0.35)`);
  grd.addColorStop(1, `rgba(${glowCol},0)`);
  navCtx.fillStyle = grd;
  navCtx.beginPath(); navCtx.arc(dotX, dotY, 22, 0, Math.PI * 2); navCtx.fill();

  // 内圆点 / inner dot
  navCtx.beginPath(); navCtx.arc(dotX, dotY, 7, 0, Math.PI * 2);
  navCtx.fillStyle = `rgba(${glowCol},0.95)`;
  navCtx.fill();
  navCtx.strokeStyle = 'rgba(255,255,255,0.8)';
  navCtx.lineWidth = 1.5;
  navCtx.stroke();

  // 到中心的连线 / line from center to dot
  navCtx.beginPath(); navCtx.moveTo(cx, cy); navCtx.lineTo(dotX, dotY);
  navCtx.strokeStyle = `rgba(${glowCol},0.25)`;
  navCtx.lineWidth = 1; navCtx.stroke();
}

/* ---------- 画布拖拽交互 / canvas drag interaction ---------- */
(function wireNavCanvas() {
  if (!navCanvas) return;
  let dragging = false;

  function posFromEvent(e) {
    const rect = navCanvas.getBoundingClientRect();
    const scaleX = navCanvas.width / rect.width;
    const scaleY = navCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function updateFromPos(x, y) {
    const cx = navCanvas.width / 2, cy = navCanvas.height / 2;
    const R = navCanvas.width * 0.42;
    let vx = (x - cx) / R;
    let vy = -(y - cy) / R;   // canvas Y is down, arousal is up → negate
    // clamp to circle
    const dist = Math.hypot(vx, vy);
    if (dist > 1) { vx /= dist; vy /= dist; }
    navValence = parseFloat(vx.toFixed(2));
    navArousal = parseFloat(vy.toFixed(2));
    refreshAlgoOutput();
  }

  navCanvas.addEventListener('mousedown', e => { dragging = true; updateFromPos(...Object.values(posFromEvent(e))); });
  navCanvas.addEventListener('mousemove', e => { if (dragging) updateFromPos(...Object.values(posFromEvent(e))); });
  navCanvas.addEventListener('mouseup',   () => { dragging = false; });
  navCanvas.addEventListener('mouseleave',() => { dragging = false; });
  navCanvas.addEventListener('touchstart', e => { e.preventDefault(); dragging = true; updateFromPos(...Object.values(posFromEvent(e))); }, { passive: false });
  navCanvas.addEventListener('touchmove',  e => { e.preventDefault(); if (dragging) updateFromPos(...Object.values(posFromEvent(e))); }, { passive: false });
  navCanvas.addEventListener('touchend',   () => { dragging = false; });
})();

/* ---------- 模拟滑块 / simulation sliders ---------- */
(function wireSimSliders() {
  const aSlider = document.getElementById('simArousalSlider');
  const vSlider = document.getElementById('simValenceSlider');
  if (aSlider) aSlider.addEventListener('input', () => {
    navArousal = +aSlider.value / 100;
    refreshAlgoOutput();
  });
  if (vSlider) vSlider.addEventListener('input', () => {
    navValence = +vSlider.value / 100;
    refreshAlgoOutput();
  });
})();

/* ---------- "进入声音世界"按钮 / enter sound world button ---------- */
document.getElementById('algoEnterBtn')?.addEventListener('click', () => {
  const board = navBoardId;
  if (!SCENES[board]) return;
  const atmos = algoAtmosVal(navArousal);
  const eqKey  = algoEQPreset(navValence, navArousal);
  ensureAudio();
  openScene(board);
  // 应用算法推荐的参数 / apply algorithm-recommended parameters
  requestAnimationFrame(() => {
    if (atmosSlider) {
      atmosSlider.value = atmos;
      applyAtmos(atmos);
      refreshAtmosDesc(atmos);
    }
    applyEQ(eqKey);
  });
});


/* ---------- 导航器入口按钮（旧，保留兼容）/ legacy entry button ---------- */
document.getElementById('navigatorEntryBtn')?.addEventListener('click', () => showScreen('navigator'));
document.getElementById('navigatorBackBtn')?.addEventListener('click', () => showScreen(prevScreen));

/* ============================================================
   13. 场景页迷你 Russell 指示器 / Mini Russell indicator in scene player
   理论来源 / Theory: Russell (1980) — EQ → valence, Atmosphere → arousal
   ============================================================ */

const miniCanvas = document.getElementById('miniRussell');
const miniCtx    = miniCanvas ? miniCanvas.getContext('2d') : null;

// 高清屏 / retina
(function initMiniCanvas() {
  if (!miniCanvas) return;
  const S = 64, dpr = Math.min(window.devicePixelRatio || 1, 3);
  miniCanvas.width  = S * dpr; miniCanvas.height = S * dpr;
  miniCanvas.style.width = S + 'px'; miniCanvas.style.height = S + 'px';
  if (miniCtx) miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

// EQ预设 → Russell 情感方向(valence) / EQ preset → valence mapping
// 来源: Sethares音色理论 + BRECVEMA中的感染机制
const EQ_TO_VALENCE = {
  flat:  0.0,   // 中性 / neutral
  grand: 0.25,  // 宏大 → 崇敬感 (GEMS: Wonder) → 正情绪
  power: -0.15, // 力量 → 攻击性(BRECVEMA: Brain stem reflex) → 略负
  clear: 0.35,  // 透彻 → 清晰明亮 → 正情绪
  warm:  0.30,  // 温暖 → 温柔包裹 (GEMS: Tenderness) → 正情绪
  dark:  -0.35, // 深沉 → 沉重压抑 → 略负情绪
};

// Atmosphere(0..100) → Russell 唤醒度(arousal) / atmosphere slider → arousal
// 来源: BRECVEMA Brain stem reflex — 低频截止降低唤醒
function atmosToArousal(atmos) {
  return -0.7 + (atmos / 100) * 1.0;  // 0→-0.7, 50→-0.2, 100→+0.3
}

// 当前迷你指示器坐标 / current mini indicator coordinates
let miniValence = 0;
let miniArousal = 0;

function drawMiniRussell(valence, arousal) {
  if (!miniCtx) return;
  const S = 64;
  const cx = S / 2, cy = S / 2, R = S * 0.40;

  miniCtx.clearRect(0, 0, S, S);

  // 背景圆 / bg circle
  miniCtx.beginPath(); miniCtx.arc(cx, cy, R + 5, 0, Math.PI * 2);
  miniCtx.fillStyle = 'rgba(12,14,20,0.92)'; miniCtx.fill();

  // 四象限淡色 / quadrant tints
  const quad = [
    { a0: -Math.PI/2, a1: 0,          c: 'rgba(205,70,95,0.10)'   }, // 高唤醒正
    { a0: 0,          a1: Math.PI/2,  c: 'rgba(90,110,170,0.08)'  }, // 高唤醒负
    { a0: Math.PI/2,  a1: Math.PI,    c: 'rgba(90,140,150,0.08)'  }, // 低唤醒负
    { a0: Math.PI,    a1: Math.PI*1.5,c: 'rgba(150,165,190,0.10)' }, // 低唤醒正
  ];
  quad.forEach(q => {
    miniCtx.beginPath(); miniCtx.moveTo(cx, cy);
    miniCtx.arc(cx, cy, R, q.a0, q.a1); miniCtx.closePath();
    miniCtx.fillStyle = q.c; miniCtx.fill();
  });

  // 主圆环 / ring
  miniCtx.beginPath(); miniCtx.arc(cx, cy, R, 0, Math.PI * 2);
  miniCtx.strokeStyle = 'rgba(255,255,255,0.10)';
  miniCtx.lineWidth = 1; miniCtx.stroke();

  // 十字轴(虚线) / dashed axes
  miniCtx.strokeStyle = 'rgba(255,255,255,0.07)';
  miniCtx.setLineDash([2, 3]);
  miniCtx.beginPath(); miniCtx.moveTo(cx - R, cy); miniCtx.lineTo(cx + R, cy); miniCtx.stroke();
  miniCtx.beginPath(); miniCtx.moveTo(cx, cy - R); miniCtx.lineTo(cx, cy + R); miniCtx.stroke();
  miniCtx.setLineDash([]);

  // 光点 / dot — 连接中心的线
  const dx = cx + valence * R;
  const dy = cy - arousal * R;
  const gc = currentScene?.glow || '185,161,107';

  miniCtx.beginPath(); miniCtx.moveTo(cx, cy); miniCtx.lineTo(dx, dy);
  miniCtx.strokeStyle = `rgba(${gc},0.2)`; miniCtx.lineWidth = 1; miniCtx.stroke();

  // 外晕 / glow
  const grd = miniCtx.createRadialGradient(dx, dy, 0, dx, dy, 12);
  grd.addColorStop(0, `rgba(${gc},0.4)`); grd.addColorStop(1, `rgba(${gc},0)`);
  miniCtx.fillStyle = grd;
  miniCtx.beginPath(); miniCtx.arc(dx, dy, 12, 0, Math.PI * 2); miniCtx.fill();

  // 内点 / inner dot
  miniCtx.beginPath(); miniCtx.arc(dx, dy, 4, 0, Math.PI * 2);
  miniCtx.fillStyle = `rgba(${gc},0.95)`; miniCtx.fill();
  miniCtx.strokeStyle = 'rgba(255,255,255,0.7)';
  miniCtx.lineWidth = 1; miniCtx.stroke();

  // 更新坐标文字 / update coord text
  const coordEl = document.getElementById('miniCoord');
  if (coordEl) {
    const vStr = `V ${valence >= 0 ? '+' : ''}${valence.toFixed(2)}`;
    const aStr = `A ${arousal >= 0 ? '+' : ''}${arousal.toFixed(2)}`;
    coordEl.textContent = `${vStr}  ${aStr}`;
  }
}

// 每次 EQ 或 Atmosphere 改变时调用 / call whenever EQ or atmosphere changes
function updateMiniRussell() {
  miniValence = EQ_TO_VALENCE[currentEQPreset] ?? 0;
  miniArousal = atmosToArousal(atmosSlider ? +atmosSlider.value : 100);
  drawMiniRussell(miniValence, miniArousal);
}

// 把 updateMiniRussell 钩入已有的 applyEQ / applyAtmos
// hook into existing applyEQ and applyAtmos
const _origApplyEQ = applyEQ;
applyEQ = function(presetKey) {
  _origApplyEQ(presetKey);
  updateMiniRussell();
};

if (atmosSlider) {
  atmosSlider.addEventListener('input', updateMiniRussell, { passive: true });
}

// 进入场景时也刷新 / refresh when scene opens
const _origOpenScene = openScene;
openScene = function(id) {
  _origOpenScene(id);
  requestAnimationFrame(updateMiniRussell);
};

/* ---------- 启动 / init ---------- */
// localStorage 恢复用户上次设置 / restore user's last settings
(function restorePrefs() {
  try {
    const savedEQ    = localStorage.getItem('ss_eq');
    const savedAtmos = localStorage.getItem('ss_atmos');
    const savedLang  = localStorage.getItem('ss_lang');
    if (savedLang && ['en','zh'].includes(savedLang)) lang = savedLang;
    if (savedAtmos !== null && atmosSlider) {
      atmosSlider.value = savedAtmos;
    }
    if (savedEQ && EQ_PRESETS[savedEQ]) currentEQPreset = savedEQ;
  } catch (e) {}
})();
applyLang();

// ---------- 关于页标签切换 / about tab switching ----------
let resetAboutTabs = () => {};
(function wireAboutTabs() {
  const tabs  = document.querySelectorAll('.about-tab');
  const ORDER = ['panel-about', 'panel-process', 'panel-reflection'];
  let current = 'panel-about';

  function activateTab(targetId, animate) {
    if (targetId === current && !animate) return;
    const dir = animate
      ? (ORDER.indexOf(targetId) > ORDER.indexOf(current) ? 'slide-from-right' : 'slide-from-left')
      : null;

    document.querySelector('.about-tab.active')?.classList.remove('active');
    document.querySelector('.about-panel.active')?.classList.remove('active');

    document.querySelector(`.about-tab[data-about-tab="${targetId}"]`)?.classList.add('active');
    const newPanel = document.getElementById(targetId);
    if (newPanel) {
      newPanel.classList.add('active');
      if (dir) {
        newPanel.classList.add(dir);
        newPanel.addEventListener('animationend', () => newPanel.classList.remove(dir), { once: true });
      }
    }
    current = targetId;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.aboutTab, true));
  });

  resetAboutTabs = () => activateTab('panel-about', false);
})();

/* ============================================================
   心率传感器 / Heart Rate Sensor (Web Serial API)
   BPM → navArousal → applyAtmos + 视觉脉冲 heartPulse
   ============================================================ */
window.heartPulse = 0;
let _heartSmooth = 0;
let _lastEQChange = 0;
let _heartConnected = false;
let heartMode = 'auto'; // 'auto' | 'free'

function _heartbeatAudioPulse() {
  if (!ctx || !eqLow || !soundOn) return;
  const preset = EQ_PRESETS[currentEQPreset];
  if (!preset) return;
  const base = preset.low.gain;
  const now = ctx.currentTime;
  eqLow.gain.cancelScheduledValues(now);
  eqLow.gain.setValueAtTime(base + 6, now);
  eqLow.gain.linearRampToValueAtTime(base, now + 0.22);
}

function _bpmToArousal(bpm) {
  // 50 BPM → -0.8 (sleep/relax), 70 BPM → 0 (neutral), 90+ BPM → +0.8 (focus/motion)
  return Math.max(-1, Math.min(1, (bpm - 70) / 25));
}

async function connectHeartSensor() {
  const btn = document.getElementById('heartConnect');
  const display = document.getElementById('heartBPMDisplay');
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    if (btn) { btn.textContent = '♥ 已连接'; btn.classList.add('connected'); }
    _heartConnected = true;

    console.log('[heart] port opened, waiting for data...');
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const raw = line.trim();
        if (raw === 'READY') {
          if (display) display.textContent = '请放手指…';
          continue;
        }
        if (raw === 'B') {
          if (heartMode === 'auto') {
            window.heartPulse = 1.0;
            _heartbeatAudioPulse();
          }
          if (display && display.textContent === '请放手指…') display.textContent = '检测中…';
          continue;
        }
        const bpm = parseInt(raw);
        if (bpm > 40 && bpm < 180) {
          _heartSmooth = _heartSmooth === 0 ? bpm : _heartSmooth * 0.7 + bpm * 0.3;
          const smoothed = Math.round(_heartSmooth);
          if (display) display.textContent = smoothed + ' BPM';

          if (heartMode === 'auto') {
            const arousal = _bpmToArousal(_heartSmooth);
            navArousal = arousal;
            _atmosLerpTarget = algoAtmosVal(arousal);
            const eqKey = algoEQPreset(navValence, arousal);
            const now = Date.now();
            if (eqKey !== currentEQPreset && now - _lastEQChange > 12000) {
              applyEQ(eqKey);
              _lastEQChange = now;
            }
            if (typeof refreshAlgoOutput === 'function') refreshAlgoOutput();
          }
        }
      }
    }
  } catch (e) {
    _heartConnected = false;
    if (btn) { btn.textContent = '♡ 心率'; btn.classList.remove('connected'); }
    if (display) display.textContent = e.name === 'InvalidStateError' ? '端口被占用' : '连接失败';
    console.warn('[heart]', e.message);
  }
}

document.getElementById('heartConnect')?.addEventListener('click', connectHeartSensor);

// 模式切换 / mode toggle
document.querySelectorAll('.hm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    heartMode = btn.dataset.mode;
    document.querySelectorAll('.hm-btn').forEach(b => b.classList.toggle('active', b === btn));
    const heartBar = document.getElementById('heartBar');
    const hmDesc = document.getElementById('hmDesc');
    if (hmDesc) hmDesc.textContent = btn.dataset.desc || '';
    if (heartMode === 'free') {
      if (heartBar) heartBar.style.display = 'none';
      _atmosLerpTarget = 100;
    } else {
      if (heartBar) heartBar.style.display = '';
    }
  });
});

// ── 算法洞察面板开关 / Algorithm insight panel toggle ──
document.getElementById('algoInsightToggle')?.addEventListener('click', function () {
  this.classList.toggle('open');
  const panel = document.getElementById('algoInsightPanel');
  if (panel) {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) refreshSceneAlgoPanel();
  }
});

// ── 导航器心率扫描 15s / Navigator biometric BPM scan ──
async function startNavScan() {
  const btn    = document.getElementById('navScanBtn');
  const status = document.getElementById('navScanStatus');
  const DURATION = 20000;

  btn.disabled = true;
  btn.classList.add('scanning');
  status.textContent = '';

  // 如果场景页已连接心率，直接复用现有数据流 / reuse live stream if already connected
  if (_heartConnected && _heartSmooth > 0) {
    btn.textContent = '采集中…';
    const startBpm = _heartSmooth;
    const startTime = Date.now();
    let snapSmooth = _heartSmooth;

    const timer = setInterval(() => {
      const left = Math.ceil((DURATION - (Date.now() - startTime)) / 1000);
      snapSmooth = snapSmooth * 0.7 + _heartSmooth * 0.3;
      if (left > 0) {
        status.textContent = `${left}s · ${Math.round(snapSmooth)} BPM`;
        const arousal = _bpmToArousal(snapSmooth);
        navArousal = arousal;
        const aSlider = document.getElementById('simArousalSlider');
        if (aSlider) aSlider.value = Math.round(arousal * 100);
        if (typeof refreshAlgoOutput === 'function') refreshAlgoOutput();
      } else {
        clearInterval(timer);
        status.textContent = `完成 · 平均 ${Math.round(snapSmooth)} BPM`;
        btn.textContent = '♡ 重新测量';
        btn.disabled = false;
        btn.classList.remove('scanning');
      }
    }, 400);
    return;
  }

  // 未连接：自己开端口扫描 / not connected: open port for scan
  btn.textContent = '连接中…';
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    let scanSmooth = 0, bpmCount = 0, buffer = '';
    const startTime = Date.now();

    const timer = setInterval(() => {
      const left = Math.ceil((DURATION - (Date.now() - startTime)) / 1000);
      if (left > 0) {
        status.textContent = bpmCount > 0
          ? `${left}s · ${Math.round(scanSmooth)} BPM`
          : `${left}s · 请放手指…`;
      }
    }, 400);

    setTimeout(() => reader.cancel(), DURATION);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const raw = line.trim();
        if (raw === 'B' || raw === 'READY') continue;
        const bpm = parseInt(raw);
        if (bpm > 40 && bpm < 180) {
          scanSmooth = scanSmooth === 0 ? bpm : scanSmooth * 0.6 + bpm * 0.4;
          bpmCount++;
          const arousal = _bpmToArousal(scanSmooth);
          navArousal = arousal;
          const aSlider = document.getElementById('simArousalSlider');
          if (aSlider) aSlider.value = Math.round(arousal * 100);
          if (typeof refreshAlgoOutput === 'function') refreshAlgoOutput();
        }
      }
    }

    clearInterval(timer);
    try { reader.releaseLock(); } catch (_) {}
    try { await port.close(); } catch (_) {}

    status.textContent = bpmCount > 0
      ? `完成 · 平均 ${Math.round(scanSmooth)} BPM`
      : '未检测到心率，请重试';
    btn.textContent = bpmCount > 0 ? '♡ 重新测量' : '♡ 测量心率';
  } catch (e) {
    console.warn('[navScan]', e.name, e.message);
    status.textContent = e.name === 'NotFoundError' ? '已取消' : '连接失败: ' + e.message;
    btn.textContent = '♡ 测量心率';
  }

  btn.disabled = false;
  btn.classList.remove('scanning');
}

document.getElementById('navScanBtn')?.addEventListener('click', startNavScan);
