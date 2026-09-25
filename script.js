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
  subtitle: { en: 'Your state is the input — the sound rearranges its own structure to meet it.',
              zh: '你的状态就是输入——声音随之重组自己的结构。' },
  guide:    { en: 'You choose where you want to be; your heart rate shapes how the sound takes you there.',
              zh: '去哪里，由你选；怎么带你去，由你的心率来调。' },
  begin:    { en: 'Begin', zh: '进入' },
  hint:     { en: 'Sound is off by default — turn it on inside.', zh: '声音默认关闭，进入后可以开启。' },
  home:     { en: '← Home', zh: '← 首页' },
  states:   { en: '← States', zh: '← 状态' },
  chooseTitle: { en: 'Choose your state', zh: '选择你的状态' },
  chooseSub:   { en: 'Different sound worlds support different states. Start with what you need right now.',
                 zh: '不同的声音世界对应不同的状态。从你此刻需要的开始。' },
  gateQuestion: { en: 'Do you know what sound you need right now?', zh: '你现在知道自己需要什么样的声音吗？' },
  gateYes:      { en: 'Begin', zh: '开始' },
  gateNo:       { en: 'Not sure where to go? Help me find it', zh: '不确定去哪？帮我找' },
  enter:    { en: 'Enter →', zh: '进入 →' },
  soon:     { en: 'Coming soon', zh: '敬请期待' },
  soundOn:  { en: 'Sound On', zh: '声音开' },
  soundOff: { en: 'Sound Off', zh: '声音关' },
  play:     { en: '▶ Play', zh: '▶ 播放' },
  pause:    { en: '❚❚ Pause', zh: '❚❚ 暂停' },
  loading:  { en: '· · ·', zh: '· · ·' },
  varLabel: { en: 'AI Variations', zh: 'AI 版本' },
  atmosLabel:    { en: 'Energy', zh: '能量' },
  natural:       { en: 'Full · Bright', zh: '满 · 亮' },
  veiled:        { en: 'Empty · Veiled', zh: '空 · 闷' },
  eqLabel:       { en: 'Character', zh: '音色性格' },
  valenceLabel:  { en: 'Mood', zh: '心情' },
  valWarmEnd:    { en: 'Warm', zh: '温暖' },
  valCoolEnd:    { en: 'Cool', zh: '清冷' },
  valWarm:       { en: 'Warmer — low end lifted, highs eased', zh: '偏暖 —— 低频抬起、高频收敛' },
  valCool:       { en: 'Cooler — highs open, low end trimmed', zh: '偏冷 —— 高频打开、低频收住' },
  valNeutral:    { en: 'Neutral — warmth untouched', zh: '中性 —— 不加暖冷' },
  ctrlLogic:     { en: 'Character follows your state — heart rate sets the space & clarity automatically. Mood is the warm↔cool axis; slide it in free listening.',
                   zh: '音色性格随状态自动 —— 心率决定空间感与清晰度。心情是暖↔冷这条轴，自由聆听时可手动滑。' },
  restingLabel:  { en: 'Resting HR', zh: '静息基线' },
  restingHint:   { en: 'seated, still for 5 min, 2 h after a meal · median of 3 days · unsure? keep 70 or use By hand', zh: '坐姿静坐 5 分钟、饭后 2 小时测 · 取 3 天中位数 · 不知道？先用 70 或选手动' },
  headphoneHint: { en: 'Best with headphones', zh: '建议佩戴耳机' },
  placeholderNote: { en: 'Cinematic now plays a real track — drag the Atmosphere slider to morph its tone in real time.',
                     zh: '沉浸场景已接入真实音轨——拖动「氛围」滑块,可实时改变这首歌的音色明暗。' },

  // 今日推荐 / daily recommendation
  dailySection: { en: "Today's Pick", zh: '今日推荐' },
  dailyBtn:     { en: 'Daily Picks', zh: '今日推荐' },
  dailyHint:    { en: 'Recommended for this time of day', zh: '根据当下时段为你推荐' },
  dailyNow:     { en: 'Now', zh: '此刻' },

  // 全部曲目 / browse
  navBrowse:  { en: 'All Tracks', zh: '全部曲目' },
  browseAll:  { en: 'Browse all tracks →', zh: '浏览全部曲目 →' },
  browseTitle:       { en: 'All Tracks', zh: '全部曲目' },
  browseSub:         { en: 'Every track across all sound worlds — click any to enter', zh: '所有声音世界的全部曲目，点击进入' },
  filterAll:         { en: 'All', zh: '全部' },
  searchPlaceholder: { en: 'Search tracks…', zh: '搜索曲目…' },
  searchEmpty:       { en: 'No tracks found', zh: '没有找到相关曲目' },

  // 返回 / back
  backBtn: { en: 'Back', zh: '返回' },

  // 导航 / navigation
  navHome:       { en: 'Home', zh: '首页' },
  navWorlds:     { en: 'Choose a state', zh: '选择状态' },
  navAbout:      { en: 'About', zh: '关于' },
  navProcess:    { en: 'Process', zh: '制作过程' },
  navReflection: { en: 'Reflection', zh: '反思' },

  // 生成板块(工作/睡眠)宏观控制 / generative board macro controls
  genWarm:  { en: 'Warm ↔ Cool', zh: '暖 ↔ 冷' },
  genSpace: { en: 'Space',        zh: '空间感' },
  genLive:  { en: 'Liveliness',   zh: '活跃度' },
  genDay:   { en: 'Day',        zh: '白天' },
  genNight: { en: 'Night',      zh: '黑夜' },
  genSleep: { en: 'Start the wind-down arc', zh: '开始入睡下行' },
  genWork:  { en: 'Back to a steady plateau', zh: '回到恒定平台' },
  genAdvanced: { en: 'Advanced mixer', zh: '高级混音台' },
  genGlue:  { en: 'Fusion', zh: '融合' },
  genVol:   { en: 'Volume', zh: '总音量' },
  genBreatheAuto:   { en: 'Auto-flow', zh: '自动起伏' },
  genBreatheManual: { en: 'Fixed',     zh: '手动固定' },

  // About 关于
  aboutTitle: { en: 'About', zh: '关于' },
  aboutP1: {
    en: 'I cannot function without music. I write it, record it, mix it, and listen to it through headphones almost every waking hour. But there are states where even music I love becomes too much — when I am exhausted or overwhelmed, melody has too much weight; what I need then is texture without arc, atmosphere without song. I noticed this in people around me too: friends pairing Pomodoro timers with rain or ocean sounds to focus; others defaulting to lofi for long study sessions; ASMR at night when the mind won\'t quiet. Everyone was already reaching for sound to manage their state — intuitively, without a system.\n\nThen, in a Musical Psychoacoustics course at UC San Diego, I heard something in class differently from everyone else. The professor called me in after class — she first suspected I had made a mistake. Once I had: my headphone cable was faulty. But another time I really had heard something different, and when I explained my reasoning, she believed me. She told me that in this field there is no single precise, 100%-correct standard the way there is in mathematics.\n\nThat is the moment I understood: sound perception has no standard answer. Yet almost every music product today assumes it does.',
    zh: '我离不开音乐。我写歌、录音、混音，几乎全天戴着耳机。但有些状态下，连我喜爱的音乐都变得太重——极度疲惫或情绪混乱时，旋律的重量让人难以承受；那时我需要的是没有走向的纹理，没有情节的氛围。我在身边的人身上也观察到这件事：朋友用番茄时钟配着雨声或海浪声专注学习；另一些人长时间学习时默认打开 lofi；睡不着时放 ASMR 让脑子安静。每个人都已经在凭直觉用声音管理自己的状态——只是没有一个系统。\n\n后来在 UC San Diego 的 Musical Psychoacoustics 课上，有一次我听出的东西和全班不一样。教授把我叫去课下——她首先怀疑是我搞错了。有一次确实是我错了：我的耳机线坏了。但另一次，我是真的听到了不同的东西；我把依据说清楚之后，她信了我。她告诉我：这个领域不存在像数学那样唯一精确、100% 正确的标准。\n\n那一刻我意识到：声音感知没有标准答案。但今天几乎所有音乐产品都在假设它有。',
  },
  aboutP2: {
    en: 'Sound States is the answer I built. Its core fits in one sentence: your state is the input; the structure of the sound is the output. Building it meant answering three questions.\n\nWhat should change? Melody makes the brain predict the next note, and a predicting brain cannot rest (Huron, 2006). So the non-melodic boards — Work and Sleep — are synthesised in code, layer by layer, in real time. The melodic boards keep their melody and change around it: in Relax, instrument layers step in and out with your arousal.\n\nHow should it change? Your heart rate, read against your own resting baseline, gives arousal — from a real optical sensor (MAX30102 over Web Serial), a demo slider, or by hand. As it rises, layers fill in and the sound opens; as you settle, it thins and closes around you. Space is placed by psychoacoustic cues, not by ear. The direction comes from theory (Russell, 1980; Juslin, 2013); the amounts are design choices, and I say so.\n\nWho decides? Heart rate measures arousal, not intention — it can tell how activated you are, not whether that is excitement or dread. So you choose where you want to be; your heart rate only shapes how the sound takes you there. If you are tense or low, the system does not pretend to fix it: it offers three strategies — let it out, get away from it, be comforted (Saarikallio & Erkkilä, 2007) — and you pick. You can see what it is changing, and you can always take over by hand.\n\nMusic that follows the body is not new: RockMyRun matched tempo to heart rate in 2014, and Endel has generated soundscapes from heart rate since 2018. What I am adding is an answer to what should change, what should not, and who decides.\n\nOn the music side: I write my own songs, but this system needs more music than one person can produce in time. The tracks here are generated with AI from my prompts and refined over several rounds; I then select them, remix them, split them into stems, and design how each layer moves. The system design is mine.',
    zh: 'Sound States 是我给出的答案。它的核心可以用一句话说完：你的状态是输入，声音的结构是输出。做它，就是在回答三个问题。\n\n什么该变？旋律会让大脑忍不住预测下一个音，而正在预测的大脑没法休息（Huron，2006）。所以无旋律的两个板块——工作和睡眠——由代码一层一层实时合成；有旋律的板块保留旋律，只改变旋律周围的东西：在放松板块里，各个声部随你的唤醒进进出出。\n\n怎么变？你的心率，以你自己的静息基线为参照，得出唤醒度——来源可以是真实的光学传感器（MAX30102，经 Web Serial）、演示滑条，或者手动。唤醒升高，声部补满、声音打开；平静下来，它变轻、收拢、包住你。空间按心理声学的线索摆放，而不是凭耳朵。方向来自理论（Russell，1980；Juslin，2013）；幅度是设计取舍，我会明说。\n\n由谁决定？心率测的是唤醒，不是意图——它读得出你有多激动，读不出那是兴奋还是恐惧。所以去哪里由你选，心率只负责调整声音怎么带你过去。如果你正紧张或低落，系统不假装能替你解决：它给出三种策略——宣泄、转移、慰藉（Saarikallio & Erkkilä，2007）——由你来挑。你看得见它在改什么，也随时可以亲手接管。\n\n让音乐跟着身体走，并不是新想法：RockMyRun 2014 年就让节奏跟随心率，Endel 从 2018 年起用心率生成声景。我想补上的，是对"什么该变、什么不该变、由谁决定"的回答。\n\n音乐这边：我自己写歌，但这个系统需要的音乐量一个人来不及做。这里的曲目是按我的关键词用 AI 生成、再经过几轮迭代得到的；之后由我筛选、重新混音、拆成分轨，并设计每一层怎么随状态移动。系统的设计是我的。',
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
    en: '1 · The origin — two things came together. One was hearing something in class differently from everyone else, and being told there is no single correct standard in sound perception. The other was noticing, in myself and in the people around me, that we already reach for sound to manage our state — rain for focus, lofi for long sessions, ASMR at night — intuitively, without a system. If sound can be described mathematically, can it be designed emotionally?',
    zh: '1 · 起点 —— 两件事碰在一起。一是在课上听出了和全班不一样的东西，并被告知：声音感知没有唯一正确的标准。二是发现，无论是我自己还是身边的人，都已经在凭直觉用声音管理状态——专注时配雨声、长时间学习开 lofi、睡不着时放 ASMR——只是没有一个系统。如果声音可以用数学描述，它能否被情绪地设计？',
  },
  proc2: {
    en: '2 · Research — I read across several frameworks rather than one: Russell\'s (1980) Circumplex Model maps affect onto valence × arousal coordinates; Juslin\'s BRECVEM (Juslin & Västfjäll, 2008) explains the mechanisms — including the brain-stem reflex — by which sound modulates how we feel before conscious cognition; Huron\'s Sweet Anticipation (2006) explains attention through expectancy and surprise-density; Karageorghis & Priest (2012) recommend tempi below 80 BPM for recuperative, sedative music; Farnell\'s Designing Sound supplies the synthesis recipes.',
    zh: '2 · 调研 —— 我横着读了一批框架，而不是只抓一个：Russell（1980）情感环状模型把情感映射为效价 × 唤醒坐标；Juslin 的 BRECVEM（Juslin & Västfjäll, 2008）解释了声音在意识介入之前调节感受的机制，包括脑干反射；Huron《Sweet Anticipation》（2006）用期待与惊奇密度解释注意力；Karageorghis & Priest（2012）建议恢复性、镇静用途的音乐节奏低于 80 BPM；Farnell《Designing Sound》提供合成配方。',
  },
  proc3: {
    en: '3 · One principle, then the structure — the principle: melodic, rhythmic material gives the brain something to predict, and predicting costs attention; a brain that is predicting cannot settle. That single line explains why temples and spas use water and modelled nature sounds: nothing to predict. It also splits the five boards into two layers: non-melodic (Work, Sleep) and melodic (Relax, Imagine, Motion). Work and Sleep are both non-melodic but aim at opposite ends — I cannot fall asleep while working, and cannot work while falling asleep — so they are separated by time-form instead.',
    zh: '3 · 一条原则，然后是结构 —— 原则是：有旋律、有节奏的材料会让大脑去预测，而预测是要消耗注意力的；一个正在预测的大脑，静不下来。这一条就解释了为什么寺庙和高档酒店放的是水声与模拟自然音——没有东西可预测。它也把五个板块分成两层：无旋律（工作、睡眠）与有旋律（放松、想象、运动）。工作与睡眠都无旋律，但目标相反——我不可能工作着睡着，也不可能睡着时还在工作——所以它们靠时间形态分开。',
  },
  proc4: {
    en: '4 · Two sound logics — the melodic boards use complete tracks; the non-melodic boards use a generative engine that synthesises every layer in code. That engine is scene-independent: it only reads tags (role, pitch, category), so a scene is just a configuration file — adding a world means adding data, not changing engine code. The same engine drives three places: the main site, the mixing desk, and the audition bench, from a single source of truth.',
    zh: '4 · 两套声音逻辑 —— 有旋律的板块用完整的歌；无旋律的板块用一套生成式引擎，每一层都由代码实时合成。这套引擎与场景无关：它只认标签（角色、音高、类别），所以一个场景就是一份配置——加一个世界等于加一份数据，不用改引擎代码。同一套引擎驱动三处：主站、调音台、试听台，共享同一个配置源。',
  },
  proc5: {
    en: '5 · Stems, on one board only — the melodic boards play whole, with one exception. Relax is split into stems so its layers can enter and leave with your arousal. Two questions decided this: can the source be cleanly separated (is it discrete acoustic instruments?), and does "becoming empty" belong in this state (is sparse actually better here)? Only Relax passed both. The layers run on different curves — the piano almost constant, the bass rising with arousal, strings and drums bound tightest. At your usual resting heart rate the mix is about half-full — it meets you where you are rather than assuming you are already calm (the ISO principle: match first); it thins out only as your body actually settles, and fills in as you rouse. The drums are not removed; they are tied to arousal, arriving only once you are already activated. Which board uses stems and which does not is itself the decision.',
    zh: '5 · 只有一块用了分轨 —— 有旋律的板块整首播放，只有一个例外。放松被拆成分轨，让各层随你的唤醒度进出。决定这件事的是两个问题：源素材能不能被干净切开（是不是离散的原声乐器）？「变空」在这个状态里对不对味（稀疏是不是真的更好）？只有放松两条都过。各层走不同的曲线——钢琴几乎恒定，贝司随唤醒上来，弦乐与鼓绑得最紧。在你平常的静息心率下，混音大约半满——先和你此刻的状态对上，而不是假设你已经平静（ISO 原则：先匹配）；身体真的平静下来它才变轻，唤醒上来它就补满。鼓不是被删掉，而是被绑在唤醒轴上：只有你已经兴奋起来时它才会进来。哪一块用分轨、哪一块不用，本身就是决定。',
  },
  proc6: {
    en: '6 · The soundscape engine — Work and Sleep. Every layer gets a role: resident (a base bed that habituates and recedes), triggered (a bell, distant thunder — it should catch attention), or in-between (insects, drips — density decides). That dividing line is computable: events spaced closer than the fusion threshold merge into a continuous surface; sparser ones separate into individual signals. Each layer is then placed in space by psychoacoustic rules rather than by ear — azimuth, distance, diffusion, early reflections. Attention itself is placed too: a warning sound never sits directly behind you, layers sharing a frequency band are separated in azimuth, and the overall spatial strategy is diffuse rather than pinpointed — because a sharp location triggers an orienting reflex and steals attention.',
    zh: '6 · 声景引擎 —— 工作与睡眠。每一层都有角色：常驻（会习惯化退隐的底胶）、触发（钟、远雷——本来就该抢注意）、或介于两者（虫鸣、滴水——由密度决定）。这条分界线是可以算的：间隔近于融合阈值的事件会融成连续表面，稀疏的则分离成一个个信号。接着每一层按心理声学规则摆进空间，而不是凭耳朵——方位、距离、弥散、早反射。注意力本身也被放置：该被听见的声音绝不放在正后方，共用频段的层在方位上岔开，而整体的空间策略是弥散而非精确指向——因为尖锐的定位会触发定向反射，把注意力抢走。',
  },
  proc7: {
    en: '7 · Heart rate, and two states on one engine — heart rate drives layer levels, event density and brightness, so the sound follows the body. It can come from a real MAX30102 optical sensor over Web Serial, from a simulated source, or from a manual slider — three sources behind one interface, so the system degrades gracefully when no device is present. Work and Sleep share every sound and differ only in time-form: Work is a steady plateau; Sleep is a descending arc, its events growing sparser, slower, darker and more distant over 120 seconds. Controls come in two layers — a few macro knobs by default, every per-layer detail folded into an advanced mixer. And the player shows, in plain language, what the sound is doing right now — which layers are in, how open it is — and draws a live portrait of what you are hearing, so the loop stays visible rather than hidden.',
    zh: '7 · 心率，以及两种状态共享一套引擎 —— 心率驱动各层音量、事件密度与亮度，让声音跟着身体走。它可以来自真实的 MAX30102 光传感器（经 Web Serial）、模拟源、或手动滑块——三条来源藏在同一个接口之后，所以没有设备时系统也能优雅降级。工作与睡眠共用全部声音，只在时间形态上不同：工作是稳态平台；睡眠是下行弧，事件在 120 秒里越来越稀、越来越慢、越来越暗、越来越远。控制分两层——默认只露几个宏观旋钮，每层的细节收进「高级混音台」。而播放器会用平常的话告诉你声音此刻在做什么——哪些声部在响、有多通透——并把你正在听到的声音实时画成一幅肖像，让这个闭环看得见，而不是藏起来。',
  },
  // 深入了解 / Go deeper — 两组入口(机制 / 愿景)
  gdHowTitle:    { en: 'Go deeper · how it works', zh: '深入了解 · 幕后机制' },
  gdVisionTitle: { en: 'Where it’s going', zh: '走向何处' },
  gdModel:  { en: 'Interactive system model', zh: '交互系统模型' },
  gdModelD: { en: 'Watch a state map to sound in real time — arousal → structure.', zh: '实时看一个状态如何映射成声音——唤醒 → 结构。' },
  gdStems:  { en: 'Stems, on one board', zh: '分轨讲解台' },
  gdStemsD: { en: 'Hear the layers enter and leave with arousal (real audio).', zh: '亲耳听见各层随唤醒进退（真实音频）。' },
  gdScene:  { en: 'Spatial orchestration', zh: '空间编排' },
  gdSceneD: { en: 'Every source placed by a psychoacoustic cue, not by ear.', zh: '每个声源由心理声学线索定位，而非凭耳朵。' },
  gdSynth:  { en: 'Synthesis engine', zh: '合成引擎' },
  gdSynthD: { en: 'The generative soundscape layers, built in code.', zh: '生成式声景的每一层，由代码构建。' },
  gdVision:  { en: 'From mirror to guide — the vision', zh: '从镜子到向导 · 愿景' },
  gdVisionD: { en: 'Closed-loop biofeedback, the ISO principle, and personal baseline — where this is headed.', zh: '闭环生物反馈、ISO 原则与个人基线——它要去的地方。' },

  // Reflection 反思
  reflTitle:   { en: 'Reflection', zh: '反思' },
  reflWorkedH: { en: 'What worked', zh: '有效的部分' },
  reflWorked: {
    en: 'Building for myself first meant I could sense immediately when something was wrong — the wrong EQ for a tired state, a rhythm too fast for sleep. That subjective testing is what theory alone cannot replace. Two things surprised me. One was how expressive a lowpass filter turns out to be: the Atmosphere control produces a clear, felt drop in arousal, consistent with BRECVEM\'s brain-stem-reflex prediction. The other was that a synthesised soundscape can hold a state at all — the engine has no melody to carry you, so the state has to be carried by space, density and time instead. Russell\'s circumplex gave the interface a framework that is both theoretically grounded and visually immediate: the disc became the way in, and the live portrait turned the sound itself into something you can watch change.',
    zh: '先为自己构建，意味着我可以立刻感知到什么地方不对——疲惫状态下错误的 EQ，睡眠场景里过快的节奏。这种主观测试是理论无法替代的。有两件事出乎我意料。一是低通滤波器的表现力：氛围控件产生的唤醒度下降是能明显感觉到的，与 BRECVEM 脑干反射机制的预测一致。二是一套合成声景居然能撑住一个状态——引擎没有旋律来带你，所以状态只能靠空间、密度和时间来承载。Russell 圆盘给了界面一个既有理论根基、又视觉直接的框架：圆盘成了入口，实时肖像则把声音本身变成了你能看着它变化的东西。',
  },
  reflLimitH:  { en: 'Limitations', zh: '局限' },
  reflLimit: {
    en: 'Timbre perception is subjective — psychoacoustics confirms that perception varies between individuals, bodies and listening environments. The mappings — arousal to layers, openness and character; valence to a warm/cool tilt — are theory-informed but not individually validated: their direction comes from theory, their amounts are designed approximations, not calibrated measurements. Heart rate is also a coarse, slow signal: seated and at rest it moves only a few beats, so its effect on the sound is subtle by nature; it reads large shifts (after exercise, during recovery), not fine moods. Heart rate measures arousal; valence is self-reported — a deliberate choice that keeps the interface accessible while grounding the arousal axis in real physiology.\n\nThere is no user testing. Nothing here proves these soundscapes improve sleep or focus: the mechanisms are defensible, the effects are a design hypothesis. The sleep arc runs on a fixed 120 seconds for everyone, which is almost certainly wrong — some people fall asleep in five minutes and others lie awake for an hour. And the soundscape boards are the least finished part of the project: one pair of hands and synthesised audio will not match the production polish of a commercial team. I would rather be judged on the design decisions than on that polish.',
    zh: '音色感知是主观的——心理声学证实，感知因个体、体型与听音环境不同而存在差异。这些映射——唤醒决定声部、通透与音色性格，效价只给冷暖倾斜——基于理论，但未经个体验证：方向来自理论，量级是设计近似，而非校准过的测量。心率也是一个粗而慢的信号：安静坐着时只上下几拍，所以它对声音的影响本来就细微；它读得出大的变化（运动后、平复中），读不出细微的情绪。唤醒度由心率测量；效价由自我报告输入——这是有意为之的选择：在唤醒轴接入真实生理数据的同时，保持界面的可及性。\n\n没有用户测试。这里没有任何东西能证明这些声景改善了睡眠或专注：机制站得住，效果是设计假设。睡眠下行弧对所有人都是固定的 120 秒，这几乎肯定是错的——有人五分钟就睡着，有人躺一小时还醒着。而声景板块是整个项目里完成度最低的部分：一个人一双手加合成音频，比不过商业团队的制作打磨度。我更愿意被评价设计判断，而不是那层打磨。',
  },
  reflFutureH: { en: 'Future', zh: '未来' },
  reflFuture: {
    en: 'Already done: personal baseline calibration — the zero of arousal is now your own resting heart rate, not a population average, because resting heart rate differs widely from person to person while staying fairly stable within one person (Quer et al., 2020, n = 92,457). Next: automatic re-calibration, so the baseline follows you as it drifts, instead of being set by hand. An A/B listening test (original track vs. in-system) to turn a subjective impression into evidence. A sleep arc that adapts to how long you actually take to fall asleep, rather than a fixed clock. And on the hardware side: the sensor currently connects by USB cable (Web Serial). A wireless link over Bluetooth LE is the next step — with one known catch: iOS Safari does not support Web Bluetooth at all, so on iPhone it would need a native bridge. Longer term: a system that responds not only to where you are now, but to the patterns in how you move between states over time.',
    zh: '已经完成：个人基线校准——唤醒度的零点现在是你自己的静息心率，而不是大众平均值，因为静息心率在人与人之间差别很大、在同一个人身上却相对稳定（Quer 等，2020，n = 92,457）。接下来：自动重校准，让基线随它自身的漂移跟着你走，而不是靠手动设定。一次 A/B 对比试听（原版 vs 系统内）把主观印象变成证据。让下行弧按你实际入睡所需的时间自适应，而不是走固定时钟。硬件这边：传感器目前通过 USB 线连接（Web Serial）。下一步是蓝牙 BLE 无线连接——有一个已知限制：iOS Safari 完全不支持 Web Bluetooth，所以在 iPhone 上需要原生桥接。更长远：一个不只响应你此刻在哪里、而是学习你在状态之间如何移动的规律的系统。',
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
    desc: { en: 'Scooped mids · open on both ends · concert-hall space', zh: '挖空中频 · 两端延展 · 音乐厅空间感' },
    // 两端对称抬升(空间感),不做暖/冷倾斜 → 暖冷交给「心情」/ symmetric shelves = space, not warmth
    low:  { freq: 100,   gain:  5 },
    mid:  { freq: 800,   gain: -8,  Q: 0.6 },
    high: { freq: 10000, gain:  5 },
  },
  power: {
    name: { en: 'Power', zh: '力量' },
    desc: { en: 'Heavy sub · scooped mids · a driving, weighted low end', zh: '超低频加重 · V 形曲线 · 更有推动力的低频' },
    // +12dB@55 让本就低频占 86% 的 trap 曲峰值冲到 +1.7dBFS、低频独自狂顶末端限制器(炸);
    // 实测拐点在 +6dB:峰值回落到 -0.7dBFS、低频不再暴走,仍保留 2× 低频推力(带感)
    // +12dB@55 pushed already-sub-heavy trap to +1.7dBFS, low end alone slamming the limiter (炸);
    // measured knee is +6dB: peak back to -0.7dBFS, sub tamed but still a 2× push (keeps the punch)
    low:  { freq: 55,    gain: 6 },
    mid:  { freq: 400,   gain: -8,  Q: 0.7 },
    high: { freq: 8000,  gain:  8 },
  },
  clear: {
    name: { en: 'Clear', zh: '透彻' },
    desc: { en: 'Mid presence · dry and direct', zh: '中频临场 · 干净直接' },
    // 清晰度放在中频临场,两端只轻微对称收 → 不带暖冷倾斜 / clarity from mids, shelves near-neutral
    low:  { freq: 150,   gain: -2 },
    mid:  { freq: 2800,  gain:  5,  Q: 1.0 },
    high: { freq: 11000, gain:  2 },
  },
  // 「温暖」「深沉」已移除:暖/冷现由「心情」滑块独占,预设只管性格/空间
  // warm & dark removed — warmth is now owned by the Mood(valence) slider; presets = character/space only
};

/* ---------- 1. 数据 / data ---------- */
const STATES = [
  { id: 'relax', glow: '150,165,190', active: true,
    name: { en: 'Relax', zh: '放松' },
    desc: { en: 'Soft soundscapes for slowing down and being gently held by sound.',
            zh: '柔和的声景,让你慢下来,被声音温柔包裹。' },
    covers: [['#2a3242','#6b7a99'], ['#33384a','#8a8aa0'], ['#222a3a','#5a6a8a'], ['#2e2a3e','#7a6a9a']] },
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
  { id: 'focus', glow: '90,140,150', active: true,
    name: { en: 'Work', zh: '工作' },
    desc: { en: 'Steady, low-distraction sound for deep work and study.',
            zh: '稳定、低干扰的声音,陪你进入工作或学习的心流。' },
    covers: [['#16202a','#2a5a5a'], ['#1a242e','#3a6a6a'], ['#101820','#244a4a'], ['#18222c','#2e5a55']] },
  { id: 'sleep', glow: '90,110,170', active: true,
    name: { en: 'Sleep', zh: '睡眠' },
    desc: { en: 'Slow textures and soft sound to guide you gently toward sleep.',
            zh: '缓慢的声音纹理,引导你放下意识,慢慢沉入睡眠。' },
    covers: [['#0c1020','#1a2a4a'], ['#0e0c1a','#2a2a4a'], ['#08101c','#163a5a'], ['#100a1a','#2a2050']] },
];

const SCENES = {
  relax: {
    title: { en: 'Relax', zh: '放松' },
    sub:   { en: 'Relax is a state, not a genre — different music, the same letting-go',
             zh: '放松不是一种曲风,是一种状态——用不同的音乐,抵达同一种松弛' },
    glow: '150,165,190', pulse: false, eqPreset: 'grand',
    varNotes: [
      { en: 'Version A', zh: '版本 A' },
      { en: 'Version B', zh: '版本 B' },
      { en: 'Version C', zh: '版本 C' },
    ],
    covers: [
      { name: { en: 'Still Piano', zh: '沉静' },
        desc: { en: 'Contemporary classical piano and strings — spacious, inward, unhurried.',
                zh: '当代古典钢琴与弦乐——开阔、内收、不疾不徐。' },
        mood: { en: 'Serene · inward', zh: '沉静 · 内收' },
        grad: ['#2a3242','#6b7a99'], root: 131, bpm: 72, key: 'C Major',
        type: { en: 'Contemporary Classical', zh: '当代古典' },
        instruments: { en: 'Grand piano · orchestral strings · bass', zh: '钢琴 · 管弦弦乐 · 贝司' },
        stems: { dir: 'audio/relax/song1/', duration: 148,
          layers: [
            { key: 'piano',   label: { en: 'Piano',   zh: '主钢琴' }, file: 'piano.m4a',   curve: 'floor' },
            { key: 'bass',    label: { en: 'Bass',    zh: '贝司' },   file: 'bass.m4a',    curve: 'rise'  },
            { key: 'strings', label: { en: 'Strings', zh: '弦乐' },   file: 'strings.m4a', curve: 'peak'  },
          ] } },
      { name: { en: 'Bossa Afternoon', zh: '慵懒午后' },
        desc: { en: 'Smooth-jazz bossa nova — light, warm, gently grooving.',
                zh: 'Smooth jazz / bossa nova——轻快、温暖、微微律动。' },
        mood: { en: 'Warm · light groove', zh: '愉悦 · 轻快律动' },
        grad: ['#33384a','#8a8aa0'], root: 131, bpm: 95, key: 'C Major',
        type: { en: 'Smooth Jazz / Bossa Nova', zh: 'Smooth Jazz / Bossa' },
        instruments: { en: 'Electric guitar · fretless bass · Rhodes · drums', zh: '电吉他 · 无品贝司 · Rhodes · 鼓' },
        stems: { dir: 'audio/relax/song2/', duration: 143,
          layers: [
            { key: 'piano', label: { en: 'Rhodes',  zh: '主钢琴' },  file: 'piano.m4a', curve: 'floor' },
            { key: 'synth', label: { en: 'Color',   zh: '合成配乐' }, file: 'synth.m4a', curve: 'color' },
            { key: 'bass',  label: { en: 'Bass',    zh: '贝司' },    file: 'bass.m4a',  curve: 'rise'  },
            { key: 'drums', label: { en: 'Drums',   zh: '鼓' },      file: 'drums.m4a', curve: 'peak'  },
          ] } },
    ],
  },
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
      { name: { en: 'Lonely City', zh: '孤独城市' }, desc: { en: 'An urban night atmosphere with emotional distance.', zh: '城市夜晚的氛围,带着情绪上的疏离感。' }, grad: ['#1c2333','#4a5a7a'], root: 174, bpm: 92, type: { en: 'Cinematic Ambient', zh: '电影氛围电子' }, instruments: { en: 'Wavetable synths · orchestral (piano) · electric bass · heavy stereo-pan movement', zh: '合成器(wavetable) · 管弦(钢琴) · 贝斯 · 大量立体声 pan 移动' }, shapeSrc: 'cover-neon.png', audio: 'glass2.m4a', img: 'cover-lonely.jpg', bgImg: 'cover-lonely.jpg', bgBlur: 0.15, mistCols: [[255,240,215],[255,210,130],[255,170,90],[110,210,200],[120,190,235]], mistWeights: [0.30, 0.57, 0.77, 0.87, 1.0], mistSize: 0.7, mistMode: 'burst', noMandala: true },
      { name: { en: 'Bamboo Mist', zh: '古风' }, desc: { en: 'A solitary dizi flute drifting through misty bamboo — pentatonic, weightless, endlessly calm.', zh: '竹笛独奏在烟雨竹林间流动 —— 五声音阶,失重般的宁静,循环不尽。' }, grad: ['#2b352d','#9db8a4'], root: 196, bpm: 72, type: { en: 'Chinese Pentatonic Ambient', zh: '中国五声 · 氛围' }, instruments: { en: 'Solo dizi (bamboo flute) · soft breath sounds · pentatonic single-note melody · sparse ambient pad · repetitive calming motif', zh: '竹笛独奏 · 轻柔气息声 · 五声单音旋律 · 稀疏氛围铺底 · 循环安神动机' }, img: 'cover-gufeng.jpg', bgImg: 'cover-gufeng.jpg', bgBlur: 0.12, audio: 'gufeng-flute.mp3' },
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
      { name: { en: 'Midnight Concrete', zh: '午夜混凝土' }, desc: { en: 'Distorted 808 slides and stuttering trap hats under a neon dystopian skyline.', zh: '失真 808 滑音与碎拍 trap 鼓点,霓虹废土天际线下的冲击。' }, grad: ['#0e1014','#b0456e'], root: 131, bpm: 140, key: 'C minor', type: { en: 'Cinematic Trap', zh: '电影感 Trap' }, instruments: { en: 'Distorted sliding 808 · metallic snare · 32nd-note hi-hat rolls · plucked synth lead · gated vocal chops · brass stabs & cinematic impacts', zh: '失真滑音 808 · 金属军鼓 · 32分音符 hi-hat 连打 · 拨弦合成主音 · 门限人声切片 · 铜管 stab 与电影感冲击' }, img: 'cover-midnight.jpg', bgImg: 'cover-midnight.jpg', bgScale: 0.62, audio: 'midnight-concrete.m4a', vol: 0.9 },
      { name: { en: 'Lo-fi Cardio', zh: '运动律动' }, desc: { en: 'Warm, driving lo-fi hip hop — a hypnotic repetitive groove to keep you moving.', zh: '温暖而有推进感的 lo-fi hip hop,催眠般的重复律动,陪你持续运动。' }, grad: ['#241a34','#d0a040'], root: 110, bpm: 125, type: { en: 'Lo-fi Hip Hop', zh: 'Lo-fi Hip Hop' }, instruments: { en: '808 sub-bass · dusty boom-bap drums · warm vinyl crackle · smooth bassline · hypnotic repetitive groove', zh: '808 低音 · 尘感 boom-bap 鼓 · 温暖黑胶噪声 · 平滑贝斯线 · 催眠般的重复律动' }, img: 'cover-workout.jpg', bgImg: 'cover-workout.jpg', bgBlur: 0.12, audio: 'workout-lofi.mp3' },
      { name: { en: 'Carnival Night', zh: '狂欢夜' }, desc: { en: 'Euphoric tribal Latin percussion with wordless gang chants, building to a big drop.', zh: '狂欢式的部落拉丁打击乐,无词群众呐喊,层层推向一次大爆发。' }, grad: ['#0b1030','#e0439a'], root: 110, bpm: 126, type: { en: 'Tribal / Latin Percussion', zh: '部落 / 拉丁打击乐' }, instruments: { en: 'Congas · surdo · timbales · tom rolls · layered polyrhythm · wordless gang chants · call-and-response · stacked vocal harmony', zh: '康加鼓 · surdo · 天巴鼓 · 通鼓滚奏 · 多层复节奏 · 无词群众呐喊 · 一问一答 · 叠置人声和声' }, img: 'cover-tribal.jpg', bgImg: 'cover-tribal.jpg', bgBlur: 0.12, audio: 'tribal-anthem.mp3' },
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
  if (id !== 'scene' && genMode) { sceneEngineStop(); genMode = false; isPlaying = false; refreshPlayBtn();
    document.body.classList.remove('gen-scene'); const _p = document.querySelector('.player'); if (_p) _p.classList.remove('gen-mode'); }   // 离开场景屏→停引擎+恢复背景/控件
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
document.getElementById('landingNoBtn')?.addEventListener('click', () => {   // 首屏已只留「开始」;保留兼容
  ensureAudio();
  prevScreen = 'landing';
  showScreen('navigator');
});

/* ---------- 3. 语言切换 / language toggle ---------- */
function applyLang() {
  if (typeof refreshGenNow === 'function') setTimeout(refreshGenNow, 0);   // 生成板块说明跟着切语言
  document.documentElement.lang = lang;
  // 语言按钮高亮:永远跟 lang 一致(刷新恢复 / 点击都靠这一处,避免"内容已切、按钮没切、要多点一下")
  document.querySelectorAll('#langToggle button[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  // 静态文案 / static strings
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(UI[el.dataset.i18n]);
  });
  // 动态部分重渲染 / re-render dynamic parts
  renderCards();
  if (document.getElementById('browse') && document.getElementById('browse').classList.contains('active')) renderBrowse();
  if (currentScene) refreshSceneText();
  if (genMode) buildGenSceneList();
  if (typeof updateDailyRing === 'function') updateDailyRing();
  refreshSoundToggle();
  refreshPlayBtn();
  if (typeof updateBreatheBtn === 'function') updateBreatheBtn();
  if (typeof refreshEQBtns    === 'function') refreshEQBtns();
  if (typeof updateLoopBtn    === 'function') updateLoopBtn();
  if (typeof refreshAtmosDesc === 'function') refreshAtmosDesc(atmosSlider ? +atmosSlider.value : 100);
  if (typeof refreshAlgoOutput === 'function' && document.getElementById('navigator')?.classList.contains('active')) refreshAlgoOutput();
  // 心率模式说明:跟随当前选中模式(切语言时也要刷)
  const _hmActive = document.querySelector('#heartModeBar .hm-btn.active');
  const _hmDesc = document.getElementById('hmDesc');
  if (_hmActive && _hmDesc && _hmActive.dataset.desckey) _hmDesc.textContent = t(UI[_hmActive.dataset.desckey]);
  // 连接/扫描按钮:按当前状态给对应语言文案(不覆盖进行中的瞬态提示)
  const _hc = document.getElementById('heartConnect');
  if (_hc) _hc.textContent = _heartConnected ? t(UI.hrConnected) : t(UI.hrConnect);
  const _ns = document.getElementById('navScanBtn');
  if (_ns && !_ns.dataset.busy) _ns.textContent = _ns.dataset.done ? t(UI.navRescan) : t(UI.navScan);
}
document.querySelectorAll('#langToggle button[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    lang = btn.dataset.lang;
    try { localStorage.setItem('ss_lang', lang); } catch (e) {}
    applyLang();   // 高亮同步已并入 applyLang

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
    makeFilterBtn(id, scene.title);
  });

  // ── 歌曲网格 / song grid ──────────────────────────────────
  const grid = document.getElementById('browseGrid');
  grid.innerHTML = '';
  grid.classList.toggle('by-board', activeBrowseFilter === 'all');   // 「全部」= 每个板块一列并排,不再每组只占左边两格
  let totalShown = 0;

  Object.entries(SCENES).forEach(([sceneId, scene]) => {
    if (activeBrowseFilter !== 'all' && activeBrowseFilter !== sceneId) return;

    const playable = scene.covers.filter(isPlayableSong);   // 与轮播一致:只列可播曲目
    const matched = playable.filter(c => matchesQuery(c, scene, browseQuery));
    if (!matched.length) return;
    totalShown += matched.length;

    let host = grid;
    if (activeBrowseFilter === 'all') {
      host = document.createElement('div');
      host.className = 'browse-col';
      const label = document.createElement('div');
      label.className = 'browse-board-label';
      label.textContent = t(scene.title);
      host.appendChild(label);
      grid.appendChild(host);
    }

    matched.forEach(cover => {
      const songIdx = playable.indexOf(cover);   // 索引按过滤后列表,对齐 openScene 的 currentScene.covers
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
      if (typeof flowCover === 'function') flowCover(card, sceneId, cover);   // 同封面流:照片 × 板块色流动渐变
      card.addEventListener('click', () => {
        ensureAudio();
        openScene(sceneId);
        requestAnimationFrame(() => selectCover(songIdx));
      });
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', rawName);
      card.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); } });
      host.appendChild(card);
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

// 按时段智能推荐一个状态板块(呼应产品核心:声音匹配当下状态)/ recommend a board by time of day
function recommendedState() {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return 'sleep';      // 深夜 → 睡眠
  if (h < 9)  return 'motion';               // 清晨 → 运动/激活
  if (h < 12) return 'focus';                // 上午 → 工作/专注
  if (h < 14) return 'relax';                // 午间 → 放松
  if (h < 18) return 'focus';                // 下午 → 工作/专注
  return 'cinematic';                        // 傍晚 → 想象
}
function updateDailyRing() {
  const st = STATES.find(s => s.id === recommendedState());
  const el = document.querySelector('#dailyBtn .ring-txt');
  if (el && st) el.textContent = t(UI.dailyNow) + ' · ' + t(st.name);
}
function openDailyScene() { openScene(recommendedState()); }

document.getElementById('dailyBtn').addEventListener('click', () => {
  ensureAudio();
  openDailyScene();
});

/* ---------- 5. 场景 + 弧形封面 / scene + coverflow ---------- */
const coverflowEl = document.getElementById('coverflow');
let currentScene = null, currentSceneId = null;
var genMode = false, sceneEng = null, genBreatheOn = true, _pendingArousal = null;   // 生成板块(工作/睡眠)状态 + 引擎单例 + 导航器待应用唤醒度(var=提升,showScreen 早引用也安全)
var restingBPM = 70;   // 静息基线(个人)默认占位=70(典型静息):相对心率映射的 0 点;测出你自己的安静心率后在输入框覆盖 / resting baseline placeholder 70, override with your measured resting HR

// 工作/睡眠 = 生成式声景板块:每张 cover = 一个生成场景(复用现有播放器界面);引擎=SceneStack
const GEN_SCENES = {
  sleep: { title:{en:'Sleep',zh:'睡眠'}, sub:{en:'Generative sleep soundscapes — breathing, never repeating',zh:'生成式睡前声景 · 会呼吸、不重复'}, glow:'90,110,170', covers:[
    { name:{en:'Mountain · Night',zh:'环山 · 夜'}, desc:{en:'Campfire, crickets, stream, a distant owl.',zh:'篝火、虫鸣、溪流、远处猫头鹰。'}, grad:['#0c1020','#1a2a4a'], scene:'hills', phase:'night' },
    { name:{en:'Rain · Window',zh:'雨 · 窗边'}, desc:{en:'Surrounding rain, eave drips, soft far thunder.',zh:'环绕雨底、屋檐滴水、远雷轻响。'}, grad:['#10151c','#243a52'], scene:'rain' },
    { name:{en:'Empty Sea',zh:'海边 · 空海'}, desc:{en:'Slow waves, sea wind, rare gulls.',zh:'慢周期波浪、海风、偶尔海鸥。'}, grad:['#0a1418','#1c3a44'], scene:'beach' },
  ]},
  focus: { title:{en:'Work',zh:'工作'}, sub:{en:'Steady generative focus soundscapes — attention-transparent',zh:'稳态生成式专注声景 · 注意力透明'}, glow:'90,140,150', covers:[
    { name:{en:'Rainy Home Office',zh:'雨天办公'}, desc:{en:'Window rain, keyboard, pen, sparse desk sounds.',zh:'隔窗雨、键盘、笔尖、稀疏桌面音。'}, grad:['#16202a','#2a5a5a'], scene:'homework' },
    { name:{en:'Empty Sea',zh:'海边 · 空海'}, desc:{en:'Waves as a transparent focus bed.',zh:'波浪当透明专注床垫。'}, grad:['#12201f','#2a5a50'], scene:'beach' },
    { name:{en:'Mountain · Day',zh:'环山 · 昼'}, desc:{en:'Treetop wind, birdsong, temple bell & woodblock.',zh:'林梢风、鸟鸣、寺钟木鱼。'}, grad:['#1a2620','#3a5a3a'], scene:'hills', phase:'day' },
  ]},
};

async function ensureSceneEngine(){
  if (sceneEng) return sceneEng;
  const stack = await window.__sceneStackReady;
  if (!stack) return null;
  sceneEng = stack.createSceneEngine(stack.SoundscapeConfig, {
    onParam: (id, v) => {   // 引擎参数变化(预设/睡眠下行弧)→ 同步滑块
      if (id === 'tone')   { const s = document.getElementById('mWarm');  if (s) s.value = toneToWarm(v); }
      if (id === 'radius') { const s = document.getElementById('mSpace'); if (s) s.value = radiusToSpace(v); }
      if (id === 'rate')   { const s = document.getElementById('mLive');  if (s) s.value = rateToLive(v); }
      if (id === 'glue')   { const s = document.getElementById('mGlue');  if (s) s.value = v; }
      if (id === 'vol')    { const s = document.getElementById('mVol');   if (s) s.value = v; }
    },
    onArc: (txt) => { const m = /(\d+)%/.exec(txt || ''); setGenArc(m ? +m[1] : null); },   // 睡眠下行弧进度 → 此刻的声音
    onLayerVol: (L, v) => { if (L._mInput) L._mInput.value = v; if (L._mOut) L._mOut.textContent = (+v).toFixed(2); }   // 每层呼吸/预设→高级区滑块
  });
  if (sceneEng && sceneEng.setResting) sceneEng.setResting(restingBPM);   // 静息基线同步进引擎
  return sceneEng;
}
async function sceneEnginePlay(){
  const e = await ensureSceneEngine(); if (!e) return;
  const c = currentScene.covers[currentIndex]; e.setScene(c.scene); if (c.phase) e.setPhase(c.phase);
  await e.ensureRunning();
}
function sceneEngineStop(){ if (sceneEng) sceneEng.stop(); }

function genPlaying(){ return !!(sceneEng && sceneEng.isRunning()); }   // 生成板块"真的在响"以引擎运行状态为准,不看 isPlaying
function togglePlay(){
  if (genMode){
    if (genPlaying()){ sceneEngineStop(); isPlaying=false; refreshPlayBtn(); }
    else { stopVoices(); isPlaying=true; sceneEnginePlay().then(refreshPlayBtn); refreshPlayBtn(); }   // 按▶:先停旋律歌,再启声景引擎
    return;
  }
  // 显示的板块正在响 → 暂停;否则(没在响 或 响的是别的板块)→ 播放/切到当前显示的板块
  const playingHere = isPlaying && playingSceneId === currentSceneId;
  if (playingHere){ stopVoices(); isPlaying=false; } else { ensureAudio(); setSound(true); playTrack(); isPlaying=true; } refreshPlayBtn();
}

async function openGenScene(id){
  genMode = true; currentSceneId = id; currentScene = GEN_SCENES[id]; currentIndex = 0;
  { const gs = document.getElementById('genSleep'), gw = document.getElementById('genWork');   // 每个板块只显示属于自己的预设
    if (gs) gs.style.display = id === 'sleep' ? '' : 'none'; if (gw) gw.style.display = id === 'focus' ? '' : 'none'; }
  document.documentElement.style.setProperty('--glow-color', currentScene.glow);
  coverflowEl.innerHTML = '';
  currentScene.covers.forEach((c,i)=>{ const el=document.createElement('div'); el.className='cover';
    el.style.background = gradCss(c.grad); el.innerHTML = `<span>${t(c.name)}</span>`;
    el.addEventListener('click', ()=>selectCover(i)); coverflowEl.appendChild(el); });
  layoutCovers(); refreshSceneText();
  document.querySelector('.player').classList.add('gen-mode'); document.body.classList.add('gen-scene');   // 显示生成控制+呼吸色场,隐藏 mp3 控件+封面
  setGenBg(currentScene.covers[0]); buildGenSceneList();
  showScreen('scene');
  const e = await ensureSceneEngine(); if (!e) return;
  const c = currentScene.covers[0]; e.setScene(c.scene); if (c.phase) e.setPhase(c.phase);
  syncMacroSliders(); updateGenControls(); refreshGenLayersIfOpen();
  e.setBreathe(genBreatheOn); updateBreatheBtn();
  if (typeof applyHeartMode === 'function') applyHeartMode(heartMode, false);   // 同步心率模式栏到本板块(工作/睡眠现在也有心率),不重复驱动
  if (_pendingArousal != null) { e.hrDrive(restingBPM + (_pendingArousal + 1) / 2 * 34); _pendingArousal = null; }   // 导航器推荐的唤醒度→落到声景(暖冷/远近/密度);基线用个人静息(相对基线)
  else if (heartMode === 'sim') { const sim = document.getElementById('heartSimSlider'); if (sim) e.hrDrive(+sim.value); }   // sim 模式:进板块即按当前模拟心率驱动声景
  refreshPlayBtn();   // 打开=浏览,不自动启引擎;按钮显示 ▶ 等你按
}

// ---- 宏观旋钮 ↔ 引擎参数 映射 ----
function mapWarmTone(v){ return Math.round(2600 + (v/100)*(9000-2600)); }
function toneToWarm(tn){ return Math.round(Math.max(0, Math.min(100, (tn-2600)/(9000-2600)*100))); }
function mapSpaceRadius(v){ return 1.0 + (v/100)*1.4; }
function mapSpaceReverb(v){ return 0.4 + (v/100)*0.7; }
function radiusToSpace(r){ return Math.round(Math.max(0, Math.min(100, (r-1.0)/1.4*100))); }
function mapLiveRate(v){ return 0.4 + (v/100)*0.9; }
function rateToLive(r){ return Math.round(Math.max(0, Math.min(100, (r-0.4)/0.9*100))); }
function syncMacroSliders(){
  if (!sceneEng) return;
  const w = document.getElementById('mWarm'), s = document.getElementById('mSpace');
  const g = document.getElementById('mGlue'), vo = document.getElementById('mVol');
  if (w) w.value = toneToWarm(sceneEng.getParam('tone'));
  if (s) s.value = radiusToSpace(sceneEng.getParam('radius'));
  if (g) g.value = sceneEng.getParam('glue');
  if (vo) vo.value = sceneEng.getParam('vol');
}
// 高级混音台:每层开关+音量(读引擎当前场景图层),随场景/昼夜重建
function buildGenLayers(){
  const box = document.getElementById('genLayers'); if (!box || !sceneEng) return;
  box.innerHTML = '';
  sceneEng.getLayers().forEach(L => {
    if (L.placeholder) return;
    const row = document.createElement('div'); row.className = 'gen-layer';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = L._on !== false;
    cb.addEventListener('change', () => { L._on = cb.checked; if (genPlaying()) sceneEng.restart(); });
    const nm = document.createElement('span'); nm.className = 'gl-nm'; nm.textContent = L.label;
    const vol = document.createElement('input'); vol.type = 'range'; vol.min = 0; vol.max = 1; vol.step = 0.01; vol.value = L._vol;
    const val = document.createElement('span'); val.className = 'gl-val'; val.textContent = (+L._vol).toFixed(2);
    L._mInput = vol; L._mOut = val;
    vol.addEventListener('input', () => { val.textContent = (+vol.value).toFixed(2); sceneEng.setLayerVol(L, +vol.value); });
    row.appendChild(cb); row.appendChild(nm); row.appendChild(vol); row.appendChild(val);
    box.appendChild(row);
  });
}
function refreshGenLayersIfOpen(){ const a = document.getElementById('genAdvanced'); if (a && a.style.display !== 'none') buildGenLayers(); }
function updateBreatheBtn(){
  const a = document.getElementById('genBreatheAuto'), m = document.getElementById('genBreatheManual');
  if (a) a.classList.toggle('active', genBreatheOn);
  if (m) m.classList.toggle('active', !genBreatheOn);
}
function setGenBg(c){ if (!c || !c.grad) return;   // 呼吸色场背景取当前场景封面色
  document.documentElement.style.setProperty('--gen-c1', c.grad[1]);
  document.documentElement.style.setProperty('--gen-c2', c.grad[0]);
}
function buildGenSceneList(){   // 场景选择标签(替代封面流):列出所有可选场景,当前高亮
  const box = document.getElementById('genSceneList'); if (!box || !currentScene) return;
  box.innerHTML = '';
  currentScene.covers.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'gen-chip' + (i === currentIndex ? ' active' : '');
    b.textContent = t(c.name);
    b.addEventListener('click', () => selectCover(i));
    box.appendChild(b);
  });
}
function updateGenControls(){
  if (!currentScene) return;
  const c = currentScene.covers[currentIndex];
  const isHills = c && c.scene === 'hills';
  const gp = document.getElementById('genPhase'); if (gp) gp.style.display = isHills ? 'flex' : 'none';
  const ph = (c && c.phase) || 'night';
  document.getElementById('genDay').classList.toggle('active', ph === 'day');
  document.getElementById('genNight').classList.toggle('active', ph === 'night');
}
function setGenPhase(p){
  if (!genMode || !sceneEng) return;
  const c = currentScene.covers[currentIndex];
  if (!c || c.scene !== 'hills') return;
  sceneEng.setPhase(p); if (genPlaying()) sceneEng.restart();
  c.phase = p;   // 记住该封面当前昼夜
  document.getElementById('genDay').classList.toggle('active', p === 'day');
  document.getElementById('genNight').classList.toggle('active', p === 'night');
  refreshGenLayersIfOpen();
}
(function bindGenControls(){   // 元素常在,仅 gen-mode 显示;handler 内 guard sceneEng
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  on('mWarm', 'input', e => { if (sceneEng) sceneEng.setParam('tone', mapWarmTone(+e.target.value)); });
  on('mSpace','input', e => { if (sceneEng){ const v=+e.target.value; sceneEng.setParam('radius', mapSpaceRadius(v)); sceneEng.setParam('reverb', mapSpaceReverb(v)); } });
  on('mLive', 'input', e => { if (sceneEng) sceneEng.applyRate(mapLiveRate(+e.target.value)); });
  on('genSleep','click', () => { if (sceneEng) sceneEng.applySleep(); });
  on('genWork', 'click', () => { if (sceneEng) sceneEng.applyWork(); });
  on('genDay',  'click', () => setGenPhase('day'));
  on('genNight','click', () => setGenPhase('night'));
  on('mGlue', 'input', e => { if (sceneEng) sceneEng.setParam('glue', +e.target.value); });
  on('mVol',  'input', e => { if (sceneEng) sceneEng.setParam('vol',  +e.target.value); });
  on('genAdvToggle', 'click', () => { const a = document.getElementById('genAdvanced'); const open = a.style.display === 'none'; a.style.display = open ? 'block' : 'none'; if (open) buildGenLayers(); });
  const setBreatheMode = on => { genBreatheOn = on; if (sceneEng) sceneEng.setBreathe(on); updateBreatheBtn(); };
  on('genBreatheAuto',   'click', () => setBreatheMode(true));
  on('genBreatheManual', 'click', () => setBreatheMode(false));
})();
let currentIndex = 0;

function openScene(id) {
  if (genMode) { sceneEngineStop(); genMode = false; isPlaying = false; }   // 离开生成板块先停引擎
  // 工作/睡眠 = 站内生成式声景(复用播放器界面),不走 mp3 曲目
  // 打开生成板块=浏览,不停旋律、不启引擎;按 ▶ 才切(togglePlay 里 stopVoices+启引擎)
  if (id === 'sleep' || id === 'focus') { openGenScene(id); return; }
  document.querySelector('.player').classList.remove('gen-mode'); document.body.classList.remove('gen-scene');   // mp3 板块:恢复原控件+背景

  currentSceneId = id;
  // 只显示能真正播放的曲目(有 audio 或 stems);空壳会 fallback 播错歌,过滤掉
  // filter out empty-shell tracks (no audio/stems) — they'd fall back to the wrong default song
  currentScene = { ...SCENES[id], covers: SCENES[id].covers.filter(isPlayableSong) };
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
    if (!genMode && typeof flowCover === 'function') flowCover(el, currentSceneId, c);   // 照片 × 板块色流动渐变
    el.addEventListener('click', () => selectCover(i));
    el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', t(c.name));
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectCover(i); } });
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
  const vs = document.getElementById('valenceSlider');
  if (vs) { vs.value = 0; }
  currentValence = 0;
  applyEQ('flat');            // 底子=flat;心情已归零 / preset flat, valence neutral
  refreshValenceDesc(0);
  // 演示模式:进板块即按当前模拟心率落位(否则滑条停在 100/满,和显示的心率对不上)
  if (heartMode === 'sim' && !_heartConnected && atmosSlider) {
    const sim = document.getElementById('heartSimSlider');
    if (sim) { _heartSmooth = +sim.value; _driveFromHeart(+sim.value, true); atmosSlider.value = _atmosLerpTarget; applyAtmos(_atmosLerpTarget); refreshAtmosDesc(_atmosLerpTarget); }
  }
  if (typeof setValenceVisible === 'function') setValenceVisible(heartMode === 'free');   // 心情滑条只在自由聆听出现
  showScreen('scene');
  // 打开板块=浏览，不自动换歌播放；当前的歌继续放，选封面(selectCover)才切歌(无缝续上)
  // opening a board = browsing, do NOT auto-play; current song keeps going, only picking a cover switches
  refreshPlayBtn();   // 若显示的不是正在响的板块,按钮显示 ▶(按一下即切过来)
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
  if (genMode) {
    const c = currentScene.covers[currentIndex];
    if (sceneEng) { sceneEng.setScene(c.scene); sceneEng.setPhase(c.phase || 'night'); if (genPlaying()) sceneEng.restart(); }
    setGenBg(c); buildGenSceneList(); updateGenControls(); syncMacroSliders(); refreshGenLayersIfOpen();
    return;
  }
  setTintFromSong();
  if (isPlaying) playTrack();   // 选封面=选歌:在播就切到这首(playTrack 会把 playingSceneId 记成当前板块)
  refreshPlayBtn();
}
document.getElementById('prevCover').addEventListener('click', () => selectCover(currentIndex - 1));
document.getElementById('nextCover').addEventListener('click', () => selectCover(currentIndex + 1));

/* ---------- 播放模式:列表/单曲/随机循环 / play mode: list · one · shuffle ---------- */
let loopMode = 'list';   // 'list' | 'one' | 'shuffle'
const LOOP_LABEL = {
  list:    { en: 'Loop: List',    zh: '循环 · 列表' },
  one:     { en: 'Loop: One',     zh: '循环 · 单曲' },
  shuffle: { en: 'Loop: Shuffle', zh: '循环 · 随机' },
};
function updateLoopBtn() {
  const b = document.getElementById('loopBtn');
  if (b) b.textContent = t(LOOP_LABEL[loopMode]);
}
document.getElementById('loopBtn')?.addEventListener('click', () => {
  loopMode = loopMode === 'list' ? 'one' : loopMode === 'one' ? 'shuffle' : 'list';
  updateLoopBtn();
});
// 直接跳到某首(带环绕),供自动续播用 / jump to a song index (wrapping), for auto-advance
function goToSong(j) {
  if (!currentScene || !currentScene.covers.length) return;
  const n = currentScene.covers.length;
  currentIndex = ((j % n) + n) % n;
  window.__mist = null; relaxBlobs = null; sleepCurves = null; focusDots = null; motionShapes = [];
  if (seekBar) { seekBar.value = 0; if (timeCur) timeCur.textContent = '0:00'; }
  layoutCovers(); refreshSceneText(); setTintFromSong();
  playTrack();
}
// 一首(mp3 声道)自然放完 → 按播放模式续播 / a deck song ended → advance by loop mode
function onDeckEnded(e) {
  if (genMode || !isPlaying || !decks) return;
  if (currentIsStem && currentIsStem()) return;              // 分轨歌单独处理(见 stem loop)
  if (e.target !== decks[activeDeck].audio) return;          // 只认当前在响的声道,忽略已淡出的
  const n = currentScene ? currentScene.covers.length : 1;
  if (loopMode === 'one') {                                  // 单曲:重头再放
    try { e.target.currentTime = 0; } catch (_) {}
    playRealForCurrentSong();
  } else if (loopMode === 'shuffle') {                       // 随机:换一首(尽量不重复)
    let j = currentIndex; if (n > 1) { while (j === currentIndex) j = Math.floor(Math.random() * n); }
    goToSong(j);
  } else {                                                   // 列表:下一首(环绕)
    goToSong(currentIndex + 1);
  }
}

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
  document.getElementById('varNote').textContent = c.mood ? t(c.mood) : '';
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

// 氛围滑块 = 唤醒轴本体。拖它时同步 navArousal,
// 否则「算法洞察」面板里 Arousal 那行不动、而声音构成在动 —— 同一个面板自相矛盾。
function syncArousalFromAtmos(v){
  navArousal = Math.max(-1, Math.min(1, (v - 55) / 45));   // algoAtmosVal 的反函数
  if (typeof refreshSceneAlgoPanel === 'function') refreshSceneAlgoPanel();
}
if (atmosSlider) {
  atmosSlider.addEventListener('input', () => {
    syncArousalFromAtmos(+atmosSlider.value);
    ensureAudio();
    applyAtmos(+atmosSlider.value);
    refreshAtmosDesc(+atmosSlider.value);
    try { localStorage.setItem('ss_atmos', atmosSlider.value); } catch (e) {}
  });
}

// 心情 Valence 滑块:在音色预设底子上推冷暖 / valence slider tilts EQ on the preset base
const valenceSlider = document.getElementById('valenceSlider');
if (valenceSlider) {
  valenceSlider.addEventListener('input', () => {
    ensureAudio();
    applyValence(+valenceSlider.value);
  });
}
const valenceReset = document.getElementById('valenceReset');
if (valenceReset) {
  valenceReset.addEventListener('click', () => {
    if (valenceSlider) { valenceSlider.value = 0; applyValence(0); }
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
  if (!seekBar || seekDragging) return;
  if (currentIsStem()) {                       // 分轨歌:用引擎的播放位置 / stem song timing
    if (!stemPlayer || !stemPlayer.duration) return;
    const dur = stemPlayer.duration;
    let pos = stemPos();
    if (pos >= dur) {                           // 播完 / ended
      pos = dur;
      if (stemPlayer.playing) { stopStemSources(); rampGain(stemVol, 0, 0.2); isPlaying = false; refreshPlayBtn(); }
    }
    seekBar.max = dur; seekBar.value = Math.min(pos, dur);
    if (timeCur) timeCur.textContent = fmtTime(pos);
    if (timeDur) timeDur.textContent = fmtTime(dur);
    return;
  }
  if (!decks) return;
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
    if (currentIsStem()) {                       // 分轨歌:从新位置重起各层 / re-seat stems at offset
      if (stemPlayer) {
        const wasPlaying = stemPlayer.playing;
        stopStemSources();
        stemPlayer.offset = +seekBar.value;
        if (wasPlaying && isPlaying) { startStemSources(stemPlayer.offset); rampGain(stemVol, soundOn ? 0.9 : 0, 0.2); }
      }
      return;
    }
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
  // 只有"当前显示的板块正在响"才显示暂停;否则显示播放(浏览别的板块时按一下就切过来)
  const playing = genMode ? (typeof genPlaying === 'function' && genPlaying())
                          : (isPlaying && playingSceneId === currentSceneId);
  playBtn.textContent = playing ? t(UI.pause) : t(UI.play);
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
playBtn.addEventListener('click', togglePlay);

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
let eqLow, eqMid, eqHigh;                         // 3-band EQ 节点(音色性格预设)
let valLow, valHigh;                               // 心情/效价专属倾斜 shelf(200Hz/3500Hz,与预设解耦)
let limiter;                                       // 末端安全限制器 / brickwall limiter (防削波炸麦)
let currentEQPreset = 'grand';
let currentValence = 0;                          // 心情效价 -100..100 / valence tilt
const hasRealTrack = true;     // 已接入真实音频(glass-grid.wav)/ a real track is wired in
let isPlaying = false;
let playingSceneId = null;   // 真正在响的板块(区分"有声音在响" vs "当前显示的板块在响")
let _heartConnected = false;   // 心率是否已连接(bgLoop 初始化即引用,须早声明避免 TDZ)
let _hrWaiting = false;        // 已收到 READY、等手指放上(替代旧的按中文文本比较)

// 分轨引擎(仅放松板块)/ stem engine (relax board only) — 见 stem-test 验证
let stemBus = null, stemFilter = null, stemVol = null;   // 分轨母线 / stem bus nodes
let stemPlayer = null;   // { song, buffers, sources, gains, layers, startCtx, offset, duration, playing, token }

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

  // 心情/效价专属倾斜:独立两个 shelf,放在感知最灵敏处(200Hz 体积感 / 3500Hz presence)
  // 与音色性格预设(100/800/10k)解耦 → 心情可听、预设各保性格 / valence tilt, decoupled from presets
  valLow  = ctx.createBiquadFilter(); valLow.type  = 'lowshelf';  valLow.frequency.value  = 200;
  valHigh = ctx.createBiquadFilter(); valHigh.type = 'highshelf'; valHigh.frequency.value = 3500;
  eqHigh.connect(valLow);
  valLow.connect(valHigh);

  // 末端 brickwall 限制器:EQ(power 预设低频最高 +18dB)+滑块拉满会远超 0dBFS → 硬削波炸麦
  // limiter 把峰值稳稳压在天花板下,保护所有曲子,不管滑块怎么拉 / peak safety before destination
  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2;    // 天花板 / ceiling
  limiter.knee.value      = 0;     // 硬拐点 = limiter 而非 compressor
  limiter.ratio.value     = 20;    // ≈brickwall
  limiter.attack.value    = 0.003; // 快速抓峰
  limiter.release.value   = 0.25;
  valHigh.connect(limiter);
  limiter.connect(ctx.destination);

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
      audio.loop = false;                       // 靠 'ended' 走播放模式续播,不用原生 loop / advance via 'ended'
      audio.addEventListener('ended', onDeckEnded);
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
  if (genMode) return;   // 生成板块的氛围滑块暂不映射(下一轮接引擎 glue/暖冷)
  const f = sliderToFreq(v);
  if (ctx) {
    const now = ctx.currentTime;
    if (decks) decks.forEach(d => { d.filter.frequency.cancelScheduledValues(now); d.filter.frequency.linearRampToValueAtTime(f, now + 0.2); });
    if (atmosFilter) { atmosFilter.frequency.cancelScheduledValues(now); atmosFilter.frequency.linearRampToValueAtTime(f, now + 0.2); }
  }
  applyStemArousal(v);   // 分轨:唤醒同时控制每层空/满 + 低通 / stems: layer levels + lowpass
  document.body.classList.toggle('veiled', v < 45);
}

// 应用 EQ 音色预设 / apply timbre EQ preset
// 最终 EQ = 预设底子 + 心情冷暖偏移(叠加,一个真相)/ final EQ = preset base + valence tilt
// 音色预设给"好听的底子",心情滑块在此基础上把低/高频往暖(正)或冷(负)推
function applyEQCombined() {
  const p = EQ_PRESETS[currentEQPreset];
  if (!p || !eqLow || !ctx) return;
  const t = Math.max(-1, Math.min(1, currentValence / 100));  // -1..1
  const now = ctx.currentTime, ramp = now + 0.5;
  // 音色性格预设:纯预设底子,不再掺心情 / preset base only, decoupled from valence
  eqLow.frequency.setValueAtTime(p.low.freq, now);
  eqLow.gain.linearRampToValueAtTime(p.low.gain, ramp);
  eqMid.frequency.setValueAtTime(p.mid.freq, now);
  eqMid.Q.setValueAtTime(p.mid.Q || 1.0, now);
  eqMid.gain.linearRampToValueAtTime(p.mid.gain, ramp);
  eqHigh.frequency.setValueAtTime(p.high.freq, now);
  eqHigh.gain.linearRampToValueAtTime(p.high.gain, ramp);
  // 心情/效价:专属 shelf(200/3500),正=暖(低抬高压) 负=冷 — 与 stem-test 一致(±6/∓9)
  if (valLow && valHigh) {
    valLow.gain.linearRampToValueAtTime( t * 6, ramp);
    valHigh.gain.linearRampToValueAtTime(-t * 9, ramp);
  }
}

function applyEQ(presetKey) {                    // 选一个音色底子 / pick a timbre base
  if (!EQ_PRESETS[presetKey]) return;
  currentEQPreset = presetKey;
  try { localStorage.setItem('ss_eq', presetKey); } catch (e) {}
  applyEQCombined();
  refreshEQBtns();
}

function applyValence(v) {                        // 心情:在底子上推冷暖 / valence tilt on top
  currentValence = Math.max(-100, Math.min(100, v));
  applyEQCombined();
  refreshValenceDesc(currentValence);
}
function refreshValenceDesc(v) {
  const el = document.getElementById('valenceDesc');
  if (!el) return;
  el.textContent = v > 0 ? t(UI.valWarm) : (v < 0 ? t(UI.valCool) : t(UI.valNeutral));
  el.classList.add('visible');
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
  if (stemVol) {                               // 分轨母线跟随声音开关 / stem bus follows sound toggle
    const sv = (soundOn && stemPlayer && stemPlayer.playing) ? 0.9 : 0.0;
    rampGain(stemVol, sv, 0.8);
  }
}


// 当前封面对应的音频文件名 / the audio file for the current cover
function currentSongAudio() {
  const c = currentScene && currentScene.covers[currentIndex];
  return (c && c.audio) || 'glass-grid.m4a';
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
  if (currentIsStem()) {                     // 分轨歌:走分轨引擎,静音双声道 / stem song → stem engine
    if (decks) decks.forEach(d => rampGain(d.gain, 0, 0.4));
    playStemSong(currentSong());
    return;
  }
  pauseStems();                              // 非分轨:确保分轨停下 / ensure stems stopped
  if (!decks || !decks.length) return;
  const want = currentSongAudio();
  const trim = (currentSong() && currentSong().vol) || 1;   // 每首独立音量微调(响度对齐),默认1
  const fullVol = (soundOn ? 0.9 : 0) * trim;
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
  playingSceneId = currentSceneId;   // 记下:现在响的是这个板块
}

function stopVoices() {
  pauseStems();
  playingSceneId = null;
  if (!decks) return;
  decks.forEach(d => {
    rampGain(d.gain, 0, 0.4);
    const a = d.audio; setTimeout(() => { try { a.pause(); } catch (e) {} }, 450);
  });
}

/* ---------- 9b. 分轨引擎 / stem engine (relax) ----------
   分轨歌:多层 buffer 同步起播,唤醒同时控制"每层增益(空/满)"+"低通(闷/亮)",
   与 stem-test 验证一致。非分轨歌完全走原双声道链路,互不影响。 */
const _smooth01 = t => t*t*(3-2*t);
function stemGainFor(curve, a) {
  a = Math.max(0, Math.min(1, a));
  switch (curve) {
    case 'floor': return 0.85 + 0.15 * a;             // 地板(主钢琴),几乎恒定
    case 'rise':  return 0.20 + 0.80 * _smooth01(a);  // 随唤醒上来(贝司) — stem-test 验证值
    case 'color': return 0.30 + 0.70 * _smooth01(a);  // 色彩层(合成配乐) — stem-test 验证值
    case 'peak':  return Math.pow(a, 1.6);            // 绑最紧(鼓/弦乐):平静≈空 — stem-test 验证值
    default:      return 1;
  }
}
function isPlayableSong(c) { return !!(c && (c.audio || c.stems)); }  // 有真音频/分轨才显示,排除空壳
function currentSong()   { return currentScene && currentScene.covers[currentIndex]; }
function currentIsStem() { const c = currentSong(); return !!(c && c.stems); }
function curArousal()    { return (atmosSlider ? +atmosSlider.value : 100) / 100; }

function ensureStemBus() {
  if (stemBus || !ctx) return;
  stemBus    = ctx.createGain(); stemBus.gain.value = 1.12;   // 分轨响度补偿:留余量,让"满"不被末端限制器压扁(保留空↔满对比)
  stemFilter = ctx.createBiquadFilter(); stemFilter.type = 'lowpass';
  stemFilter.frequency.value = sliderToFreq(atmosSlider ? +atmosSlider.value : 100);
  stemVol    = ctx.createGain(); stemVol.gain.value = 0;      // 随 play/soundOn 淡入
  stemBus.connect(stemFilter); stemFilter.connect(stemVol); stemVol.connect(analyser);
}

async function playStemSong(song) {
  ensureAudio(); ensureStemBus();
  if (stemPlayer && stemPlayer.song === song && stemPlayer.buffers) {  // 同一首:继续
    if (!stemPlayer.playing) startStemSources(stemPlayer.offset || 0);
    rampGain(stemVol, soundOn ? 0.9 : 0, 0.5);
    return;
  }
  stopStemSources();
  const token = ((stemPlayer && stemPlayer.token) || 0) + 1;
  stemPlayer = { song, buffers: null, sources: [], gains: {}, layers: song.stems.layers,
                 startCtx: 0, offset: 0, duration: song.stems.duration || 0, playing: false, token };
  setAudioLoading(true);
  try {
    const bufs = {};
    await Promise.all(song.stems.layers.map(async L => {
      const res = await fetch(song.stems.dir + L.file);
      bufs[L.key] = await ctx.decodeAudioData(await res.arrayBuffer());
    }));
    if (!stemPlayer || stemPlayer.token !== token) return;   // 已换歌,丢弃
    stemPlayer.buffers = bufs;
    startStemSources(0);
    rampGain(stemVol, soundOn ? 0.9 : 0, XFADE);
  } catch (e) {
    console.warn('stem load failed:', e);
    const cap = document.getElementById('nowCap'); if (cap) { cap.textContent = t(UI.audioFail); cap.classList.add('err'); }
  } finally {
    if (stemPlayer && stemPlayer.token === token) setAudioLoading(false);
  }
}

function startStemSources(offset) {
  if (!stemPlayer || !stemPlayer.buffers || !ctx) return;
  const a = curArousal(), t = ctx.currentTime + 0.06;
  stemPlayer.sources = []; stemPlayer.gains = {};
  for (const L of stemPlayer.layers) {
    const buf = stemPlayer.buffers[L.key]; if (!buf) continue;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;   // 分轨(放松)连续循环,不 dead-end;列表/随机切歌用手动切封面
    const g = ctx.createGain(); g.gain.value = stemGainFor(L.curve, a);
    src.connect(g); g.connect(stemBus);
    const off = Math.max(0, Math.min(offset, Math.max(0, buf.duration - 0.05)));
    try { src.start(t, off); } catch (e) { try { src.start(t); } catch (e2) {} }
    stemPlayer.sources.push(src); stemPlayer.gains[L.key] = g;
  }
  stemPlayer.startCtx = t; stemPlayer.offset = offset; stemPlayer.playing = true;
}

function stemPos() {
  if (!stemPlayer) return 0;
  let p = stemPlayer.offset || 0;
  if (stemPlayer.playing && ctx) p += (ctx.currentTime - stemPlayer.startCtx);
  return p;
}

function stopStemSources() {
  if (!stemPlayer) return;
  stemPlayer.offset = stemPos();                       // 记住位置 / remember position
  (stemPlayer.sources || []).forEach(s => { try { s.stop(); } catch (e) {} });
  stemPlayer.sources = []; stemPlayer.playing = false;
}

function pauseStems() {
  if (!stemBus) return;
  rampGain(stemVol, 0, 0.4);
  setTimeout(() => { if (!(isPlaying && currentIsStem())) stopStemSources(); }, 420);
}

// 唤醒(0-100)→ 分轨每层增益 + 分轨低通 / arousal drives per-layer gains + stem lowpass
function applyStemArousal(v) {
  if (!stemPlayer || !stemPlayer.playing || !ctx) return;
  const a = Math.max(0, Math.min(100, v)) / 100, now = ctx.currentTime;
  for (const L of stemPlayer.layers) {
    const g = stemPlayer.gains[L.key]; if (!g) continue;
    g.gain.cancelScheduledValues(now);
    g.gain.linearRampToValueAtTime(stemGainFor(L.curve, a), now + 0.2);
  }
  if (stemFilter) {
    stemFilter.frequency.cancelScheduledValues(now);
    stemFilter.frequency.linearRampToValueAtTime(sliderToFreq(v), now + 0.2);
  }
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
const VEILED_SPEED = 1;        // 背景固定:唤醒滑块不改雾速 / mist speed independent of arousal
const VEILED_BRIGHT = 1;       // 背景固定:唤醒滑块不改亮度 / brightness independent of arousal
const TINT_PALENESS = 0.22;    // 颜色调淡程度(越大越淡,但保留色相)/ paleness, keeps hue

const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
let bgW, bgH, particles = [], rings = [], beatCooldown = 0;
let tint = { r: 150, g: 150, b: 170 };
let tintTarget = { r: 150, g: 150, b: 170 };
const SHOW_BG_PARTICLES = true;    // 背景粒子/雾气总开关 · true=开启飘动雾 / master particle switch
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
  if (typeof flowTintNow === 'function' && flowTintNow(true)) return;   // 背景颜色跟随封面当前流动到的颜色(不再取原照片的色)
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
  if (document.querySelector('#coverflow .fc')) return;   // 封面已改为「板块色流动」:颜色统一由 flowTintNow 给,不再从原照片取色(否则每帧被改回照片原色)
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
      const oc = off.getContext('2d');
      oc.filter = 'grayscale(1) brightness(.85)'; oc.drawImage(im, 0, 0, w, h); oc.filter = 'none';   // 背景照片同封面:去色后染成板块色
      const tint = (currentScene && currentScene.glow) || '185,161,107';
      oc.globalCompositeOperation = 'color'; oc.fillStyle = `rgb(${tint})`; oc.fillRect(0, 0, w, h); oc.globalCompositeOperation = 'source-over';
      c.canvas = off; c.ready = true;
    };
    im.onerror = () => { c.ready = false; };
    im.src = src;
  }
  if (!c.ready) return;
  const cv = c.canvas;
  const scale = Math.max(bgW / cv.width, bgH / cv.height) * sc;  // sc<1 → 缩小退远,可能露边 / zoom out
  const dw = cv.width * scale, dh = cv.height * scale;
  bgCtx.save();
  // 缩到铺不满时,先铺暗底填满边缘 / dark fill behind if image no longer covers
  if (dw < bgW - 0.5 || dh < bgH - 0.5) {
    bgCtx.fillStyle = '#080a12';
    bgCtx.fillRect(0, 0, bgW, bgH);
  }
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
  // 3D 旋转圆环默认关闭:与封面上的实时声音肖像重叠、抢主角;保留代码,网址加 ?viz3d 可对比旧版
  if (emanate > 0.002 && /[?&]viz3d\b/.test(location.search)) {
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
    const dfix = 0.5;   // 背景固定:雾不随唤醒滑块缩放/淡入淡出 / mist independent of arousal slider
    const curR = b.r * (0.78 + breath * 0.44 + bass * 0.28) * (0.65 + dfix * 0.55);
    const alpha = (0.038 + dfix * 0.048 + breath * 0.025) * brightMul;
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
  if (bgFrame % 6 === 0 && typeof renderNow === 'function') renderNow();   // 此刻的声音

  // 心率驱动氛围缓动 / heart-rate atmosphere lerp (每10帧更新一次)
  // 仅在心率实时驱动时接管滑块;否则用户手动拖动不被拉回 / only auto-lerp when heart sensor is live
  if ((_heartConnected || heartMode === 'sim') && atmosSlider && bgFrame % 10 === 0 && Math.abs(_atmosLerpTarget - +atmosSlider.value) > 0.5) {
    const cur = +atmosSlider.value;
    const next = cur + (_atmosLerpTarget - cur) * 0.15;
    atmosSlider.value = next;
    applyAtmos(next);
    refreshAtmosDesc(next);   // 描述文字跟着走,不停在旧值
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
  if (SHOW_BG_PARTICLES) {
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
  } else {
    // 无粒子:封面模糊底 + 柔和辉光(干净但不空) / particles off: blurred cover + soft glow
    const song = currentScene?.covers?.[currentIndex];
    const bgSrc = song && (song.bgImg || song.img);
    if (bgSrc) drawBlurredBg(bgSrc, 0.42, 0.7, song.bgScale ?? 1.3);
    const gcx = bgW / 2, gcy = bgH / 2;
    const gg = bgCtx.createRadialGradient(gcx, gcy, 0, gcx, gcy, Math.max(bgW, bgH) * 0.62);
    gg.addColorStop(0, `rgba(${col},${0.10 + vol * 0.10})`);
    gg.addColorStop(1, `rgba(${col},0)`);
    bgCtx.fillStyle = gg; bgCtx.fillRect(0, 0, bgW, bgH);
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
    togglePlay();
  }
  if (!currentScene) return;
  if (e.key === 'ArrowLeft')  selectCover(currentIndex - 1);
  if (e.key === 'ArrowRight') selectCover(currentIndex + 1);
});

/* ============================================================
   12. 情绪导航器 / Russell Circumplex Navigator
   理论来源 / Theory: Russell (1980)(映射量级为设计取舍,见事实表 A1)
   两轴: X = valence (-1..1), Y = arousal (-1..1)
   算法: arousal (心率BPM) → board → EQ + Atmosphere
   ============================================================ */

// 导航器 + 算法模块文案 / i18n strings for navigator + algo section
Object.assign(UI, {
  navNavigator: { en: 'Not sure? Place yourself', zh: '不确定？标出你的位置' },
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
  // 心率模式条 + 连接/扫描按钮 + 状态提示(i18n) / heart-mode bar + connect/scan buttons + status strings
  hmAuto: { en: 'Live heart rate', zh: '实时心率' },
  hmSim:  { en: 'Demo · no sensor', zh: '演示 · 无传感器' },
  hmFree: { en: 'By hand', zh: '手动' },
  hmDescAuto: { en: 'Your pulse shapes the sound — connect the sensor below.', zh: '你的心率塑造声音——在下方连接传感器。' },
  hmDescSim:  { en: 'No sensor? Drag the slider to play the part of your pulse.', zh: '没有传感器？拖动滑条，扮演你的心率。' },
  hmDescFree: { en: 'You shape the sound yourself.', zh: '由你亲手调整声音。' },
  hrConnect:   { en: 'Connect sensor', zh: '连接传感器' },
  hrConnected: { en: 'Connected', zh: '已连接' },
  // 此刻的声音(播放页主角:用户语言,不放公式/引用/数字)/ "what the sound is doing" panel
  nowTitle:     { en: 'What the sound is doing', zh: '此刻的声音' },
  // 导航器引导区(紧张/苦恼/低落)/ navigator guide zone
  navGuideLead:      { en: 'Tense or low — this version doesn\'t pretend to fix that for you. Pick what you need right now:', zh: '紧张或低落——这一版不假装能替你解决。选一个你此刻需要的：' },
  navGuideDischarge: { en: 'Let it out',   zh: '宣泄' },
  navMotion:  { en: '→ Motion',  zh: '→ 运动' },
  navImagine: { en: '→ Imagine', zh: '→ 想象' },
  navRelax:   { en: '→ Relax',   zh: '→ 放松' },
  navGuideDiversion: { en: 'Get away from it', zh: '转移' },
  navGuideSolace:    { en: 'Be comforted', zh: '慰藉' },
  navGuideVision:    { en: 'Gently guiding you out of this state is the next step → Vision', zh: '把你从这里慢慢带出来，是下一步 → 愿景' },
  nowStemsCap:  { en: 'As your energy rises, layers step in; as it settles, they step back.', zh: '能量升高，声部一层层进来；回落时，它们退回去。' },
  nowOpenLabel: { en: 'Openness', zh: '通透' },
  nowOpenCap:   { en: 'As your energy rises the sound opens; as it settles, it closes around you.', zh: '能量升高，声音打开；回落时，它收拢、包住你。' },
  nowCharacter: { en: 'Character', zh: '音色' },
  hrPanelTitle: { en: 'Input · your heart rate', zh: '输入 · 你的心率' },
  restEdit:     { en: 'Change', zh: '修改' },
  restDone:     { en: 'Done', zh: '完成' },
  // 选择页 v2 / selection page
  selQ:        { en: 'Where do you want to be?', zh: '你想去哪里？' },
  selLede:     { en: 'Choose a state. Your heart rate then shapes <b>how</b> the sound takes you there — <b>where</b> is always yours to pick.', zh: '选一个状态。你的心率会调整声音<b>怎么</b>带你过去——<b>去哪里</b>，永远由你选。' },
  selHintExplore: { en: 'Move across the disc to explore', zh: '在圆盘上移动，看看每一块' },
  selHintTap:  { en: 'Tap a part of the disc to explore', zh: '点圆盘上的一块，看看它' },
  selHintDrag: { en: 'Drag the point to where you are now', zh: '把光点拖到你此刻的位置' },
  selUnsure:   { en: 'Not sure? Place yourself on the disc', zh: '不确定？在圆盘上标出你的位置' },
  selAll:      { en: 'All tracks', zh: '全部曲目' },
  selEnter:    { en: 'Enter', zh: '进入' },
  selWith:     { en: 'With melody', zh: '有旋律' },
  selWithout:  { en: 'Without melody · synthesised live', zh: '无旋律 · 实时合成' },
  selGuideKicker: { en: 'Tense · distressed · low', zh: '紧张 · 苦恼 · 低落' },
  selGuideName: { en: 'Your choice', zh: '由你来选' },
  selGuideLead: { en: 'This version doesn\'t pretend to fix that for you. Pick what you need right now:', zh: '这一版不假装能替你解决。选一个你此刻需要的：' },
  selGuideRevival: { en: 'Rest and recover', zh: '休息恢复' },
  selSleep:    { en: '→ Sleep', zh: '→ 睡眠' },
  selGuideSrc: { en: 'Strategies from Saarikallio & Erkkilä (2007) and Saarikallio (2008) — you choose; nothing is prescribed.', zh: '策略来自 Saarikallio & Erkkilä（2007）与 Saarikallio（2008）——由你选择，不替你规定。' },
  genNowHR:     { en: 'Your heart rate is moving the three sliders below: as it rises the sound gets brighter, nearer and busier; as you settle it darkens, drifts away and thins out.', zh: '下面三条滑条是你的心率在推：心率升高，声音更亮、更近、更密；平静下来，它变暗、变远、变稀。' },
  genNowFree:   { en: 'You are shaping it by hand — the three sliders below are yours.', zh: '现在由你亲手调——下面三条滑条归你。' },
  genArcLabel:  { en: 'Wind-down arc', zh: '入睡弧' },
  hrPlaceFinger: { en: 'Place finger…', zh: '请放手指…' },
  hrNoSerial:    { en: 'This browser can\'t reach a USB sensor — use desktop Chrome or Edge, or try Demo.', zh: '这个浏览器连不了 USB 传感器——请用电脑上的 Chrome 或 Edge，或者先用「演示」。' },
  audioFail:     { en: 'The audio didn\'t load — check the connection and reload.', zh: '音频没有加载成功——请检查网络后刷新。' },
  hrDetecting:   { en: 'Detecting…', zh: '检测中…' },
  hrPortBusy:    { en: 'Port in use', zh: '端口被占用' },
  hrConnFail:    { en: 'Connection failed', zh: '连接失败' },
  navScan:    { en: '♡ Measure HR', zh: '♡ 测量心率' },
  navRescan:  { en: '♡ Measure again', zh: '♡ 重新测量' },
  navConnecting: { en: 'Connecting…', zh: '连接中…' },
  navCollecting: { en: 'Collecting…', zh: '采集中…' },
  navCancelled:  { en: 'Cancelled', zh: '已取消' },
  navDoneAvg:    { en: 'Done · avg', zh: '完成 · 平均' },
  navNoHR:       { en: 'No heart rate — try again', zh: '未检测到心率，请重试' },
  algoInsightLabel:   { en: 'Algorithm Insight', zh: '算法洞察' },
  algoInsightBPM:     { en: 'Heart Rate', zh: '心率' },
  algoInsightArousal: { en: 'Arousal', zh: '唤醒度' },
  algoInsightValence: { en: 'Valence', zh: '效价' },
  algoBoard:    { en: 'Sound World', zh: '声音世界' },
  algoEQ:       { en: 'Timbre', zh: '音色' },
  algoAtmos:    { en: 'Atmosphere', zh: '氛围' },
  algoInsightStems: { en: 'Sound makeup · by arousal', zh: '声音构成 · 随唤醒' },
  algoBPM:      { en: 'Rec. BPM', zh: '推荐 BPM' },
  algoCoord:    { en: 'Coordinates', zh: '坐标' },
  algoEnter:    { en: 'Enter this sound world →', zh: '进入这个声音世界 →' },
  algoSrcNote:  { en: 'Built on Russell\'s circumplex (1980) — you place yourself, the system suggests a state.', zh: '基于 Russell 情绪环形模型（1980）——你标出自己的位置，系统给出建议。' },
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
  algoSourceTag:     { en: 'Russell (1980) · Juslin (2013) · Karageorghis & Priest (2012)', zh: 'Russell (1980) · Juslin (2013) · Karageorghis & Priest (2012)' },
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
// 方案 B(2026-09-24):按 Russell 圆盘原意用「角度」分情绪,半径=强度 —— 画的 = 算的。
//  中心(强度 < 0.3)= 情绪平稳 → 工作(注意力透明,不是"不开心才工作")
//  左侧 紧张/苦恼/低落(100°–225°)= 引导区:v1 不假装解决,由你选策略(Saarikallio & Erkkilä 2007);引导本身是愿景
//  扇区边界按 Russell 情绪词位置定,属设计取舍(写进局限)
const NAV_CENTER_R = 0.3;
const NAV_SECTORS = [   // 角度:0°=正面,90°=高唤醒,逆时针
  { board: 'cinematic', from: 0,   to: 45  },
  { board: 'motion',    from: 45,  to: 100 },
  { board: 'guide',     from: 100, to: 225 },
  { board: 'sleep',     from: 225, to: 300 },
  { board: 'relax',     from: 300, to: 360 },
];
function algoBoard(v, a) {
  if (Math.hypot(v, a) < NAV_CENTER_R) return 'focus';
  let th = Math.atan2(a, v) * 180 / Math.PI;
  if (th < 0) th += 360;
  const sec = NAV_SECTORS.find(x => th >= x.from && th < x.to);
  return sec ? sec.board : 'relax';
}
const NAV_GUIDE = { en: 'Your choice', zh: '由你来选' };

// 算法：唤醒 → EQ预设 / arousal → EQ preset
// 暖/冷已归「心情」滑块,自动路由只推荐"性格"预设(不再返回已删的 warm/dark)
function algoEQPreset(v, a) {
  if (a > 0.4)          return 'power';
  if (a > 0.1)          return 'grand';
  if (a < -0.25)        return 'flat';   // 低唤醒 → 原声(最少处理,平静)
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

  const isGuide   = boardId === 'guide';
  const boardName = isGuide ? NAV_GUIDE : (STATES.find(s => s.id === boardId)?.name || { en: boardId, zh: boardId });
  const guideEl = document.getElementById('navGuide');
  const enterEl = document.getElementById('algoEnterBtn');
  if (guideEl) guideEl.style.display = isGuide ? '' : 'none';
  if (enterEl) enterEl.style.display = isGuide ? 'none' : '';
  const eqName    = EQ_PRESETS[eqKey]?.name || { en: eqKey, zh: eqKey };

  const bv = document.getElementById('algoBoardVal');
  const ev = document.getElementById('algoEQVal');
  const av = document.getElementById('algoAtmosVal');
  const bpm_v = document.getElementById('algoBPMVal');
  const cv = document.getElementById('algoCoordVal');
  if (bv) { bv.textContent = t(boardName); bv.classList.add('highlight'); }
  if (ev) ev.textContent = isGuide ? '—' : t(eqName);
  if (av) av.textContent = isGuide ? '—' : atmos + ' / 100';
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
    const avail = !!SCENES[boardId] || !!GEN_SCENES[boardId];   // 工作/睡眠在生成板块表里(之前漏查 → 误显示"即将上线")
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

  // 自由聆听 = 没有心率输入,那一行就没有意义 —— 隐藏,而不是留个「--」占位
  const bpmRow = document.getElementById('aiBPMRow');
  if (bpmRow) bpmRow.style.display = (heartMode === 'free') ? 'none' : '';
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
  const R = W * 0.38;          // 圆半径 / circle radius(缩小留出轴标签空间,避免被画布裁切)
  const dpr = window.devicePixelRatio || 1;

  navCtx.clearRect(0, 0, W, H);

  // 背景填充 / background
  navCtx.fillStyle = 'rgba(12,14,20,0.97)';
  navCtx.beginPath(); navCtx.arc(cx, cy, R + 28, 0, Math.PI * 2); navCtx.fill();

  // 扇形分区(与 algoBoard 同一张表,画的 = 算的)/ sectors drawn from the same table as algoBoard
  const NAV_COL = { motion: '205,70,95', cinematic: '120,150,200', relax: '150,165,190', sleep: '90,110,170', focus: '90,140,150', guide: '170,150,120' };
  const r0 = R * NAV_CENTER_R;
  NAV_SECTORS.forEach(sec => {
    const col = NAV_COL[sec.board], al = sec.board === 'guide' ? 0.10 : 0.24;
    const g = navCtx.createRadialGradient(cx, cy, r0, cx, cy, R);
    g.addColorStop(0, `rgba(${col},0.02)`); g.addColorStop(1, `rgba(${col},${al})`);
    navCtx.beginPath();
    navCtx.arc(cx, cy, R,  -sec.to * Math.PI / 180, -sec.from * Math.PI / 180);
    navCtx.arc(cx, cy, r0, -sec.from * Math.PI / 180, -sec.to * Math.PI / 180, true);
    navCtx.closePath(); navCtx.fillStyle = g; navCtx.fill();
    const rad = sec.from * Math.PI / 180;   // 扇区分隔线 / sector divider
    navCtx.strokeStyle = 'rgba(255,255,255,0.06)'; navCtx.lineWidth = 1;
    navCtx.beginPath(); navCtx.moveTo(cx + r0 * Math.cos(rad), cy - r0 * Math.sin(rad)); navCtx.lineTo(cx + R * Math.cos(rad), cy - R * Math.sin(rad)); navCtx.stroke();
  });
  const cg = navCtx.createRadialGradient(cx, cy, 0, cx, cy, r0);   // 中心 = 平稳 → 工作
  cg.addColorStop(0, `rgba(${NAV_COL.focus},0.20)`); cg.addColorStop(1, `rgba(${NAV_COL.focus},0.07)`);
  navCtx.fillStyle = cg; navCtx.beginPath(); navCtx.arc(cx, cy, r0, 0, Math.PI * 2); navCtx.fill();
  navCtx.strokeStyle = 'rgba(255,255,255,0.07)'; navCtx.beginPath(); navCtx.arc(cx, cy, r0, 0, Math.PI * 2); navCtx.stroke();

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
  navCtx.textAlign = 'right';
  navCtx.fillText(lang === 'zh' ? '负面' : 'Neg', cx - R - 8, cy + 4);
  navCtx.textAlign = 'left';
  navCtx.fillText(lang === 'zh' ? '正面' : 'Pos', cx + R + 8, cy + 4);

  // 8个情绪锚点 / 8 emotion anchor labels
  const anchorR = R + 18;
  const labelFontSz = Math.round(W * 0.038);
  navCtx.font = `${labelFontSz}px -apple-system, Arial, sans-serif`;
  navCtx.fillStyle = 'rgba(139,138,150,0.45)';
  if (false) RUSSELL_ANCHORS.forEach(a => {   // 8 个情绪锚点已停画:与轴标签重叠且被画布裁切;理论细节归讲解页
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
  const zoneLabels = NAV_SECTORS.map(sec => {
    const mid = (sec.from + sec.to) / 2 * Math.PI / 180;
    return { x: cx + R * 0.66 * Math.cos(mid), y: cy - R * 0.66 * Math.sin(mid) + 4, board: sec.board };
  });
  zoneLabels.push({ x: cx, y: cy + R * 0.17 + 4, board: 'focus' });   // 放在圆心点下方,不和连线重叠
  zoneLabels.forEach(z => {
    const label = z.board === 'guide' ? t(NAV_GUIDE) : t(STATES.find(s => s.id === z.board)?.name || { en: z.board, zh: z.board });
    const isActive = z.board === navBoardId;
    navCtx.fillStyle = `rgba(${NAV_COL[z.board]},${isActive ? 0.95 : 0.42})`;
    navCtx.textAlign = 'center';
    navCtx.font = `${isActive ? 600 : 400} ${isActive ? zoneFontSz + 1 : zoneFontSz}px -apple-system, "PingFang SC", Arial, sans-serif`;
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
    const R = navCanvas.width * 0.38;   // 与 drawCircumplex 同半径
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
  const isGen = (board === 'focus' || board === 'sleep');   // 工作/睡眠=生成板块,不在 mp3 SCENES 里
  if (!isGen && !SCENES[board]) return;
  const atmos = algoAtmosVal(navArousal);
  const eqKey  = algoEQPreset(navValence, navArousal);
  ensureAudio();
  if (isGen) _pendingArousal = navArousal;   // 把导航器唤醒度带进生成板块,进场后落到声景
  openScene(board);
  if (isGen) return;                          // 氛围/EQ 是 mp3 专属;生成板块由引擎处理
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
// 来源: Sethares音色理论 + BRECVEM中的感染机制
const EQ_TO_VALENCE = {
  flat:  0.0,   // 中性 / neutral
  grand: 0.25,  // 宏大 → 崇敬感 (GEMS: Wonder) → 正情绪
  power: -0.15, // 力量 → 攻击性(BRECVEM: Brain stem reflex) → 略负
  clear: 0.35,  // 透彻 → 清晰明亮 → 正情绪
  warm:  0.30,  // 温暖 → 温柔包裹 (GEMS: Tenderness) → 正情绪
  dark:  -0.35, // 深沉 → 沉重压抑 → 略负情绪
};

// Atmosphere(0..100) → Russell 唤醒度(arousal) / atmosphere slider → arousal
// 来源: BRECVEM Brain stem reflex — 低频截止降低唤醒
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
    const savedResting = localStorage.getItem('ss_resting');
    if (savedLang && ['en','zh'].includes(savedLang)) lang = savedLang;
    if (savedAtmos !== null && atmosSlider) {
      atmosSlider.value = savedAtmos;
    }
    if (savedEQ && EQ_PRESETS[savedEQ]) currentEQPreset = savedEQ;
    if (savedResting !== null && !isNaN(+savedResting)) restingBPM = Math.max(40, Math.min(120, +savedResting));
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
// _heartConnected 声明已上移到音频引擎顶部(bgLoop 在初始化时就引用它,避免 TDZ)
var heartMode = 'sim'; // 'auto' | 'sim' | 'free'  默认 sim:部署站访客无硬件,模拟是唯一能亲手体验心率驱动的入口(var=提升:bgLoop 早引用,避免 TDZ)

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

// 设置静息基线(UI 输入调用):clamp 40-120、存 localStorage、同步进声景引擎
function setRestingBPM(v) {
  restingBPM = Math.max(40, Math.min(120, Math.round(+v) || 70));
  try { localStorage.setItem('ss_resting', restingBPM); } catch (e) {}
  if (sceneEng && sceneEng.setResting) sceneEng.setResting(restingBPM);
  return restingBPM;
}

function _bpmToArousal(bpm) {
  // 相对你自己的静息基线:0 = 你的平常,高于基线 = 唤醒,低于 = 放松 / relative to your resting baseline (not a population average)
  return Math.max(-1, Math.min(1, (bpm - restingBPM) / 25));
}

// 心率(真机或模拟)→ 声音的共享驱动 / shared heart-rate → sound (real sensor OR sim slider)
// 生成板块:直接喂引擎(暖冷/远近/事件率);有旋律板块:心率→唤醒→氛围值(渲染循环 lerp→applyAtmos→分轨层进退+低通)+EQ
function _driveFromHeart(bpm, immediate) {
  if (genMode) { if (sceneEng) sceneEng.hrDrive(bpm); return; }   // 工作/睡眠:引擎接管,不走氛围/分轨路径
  const arousal = _bpmToArousal(bpm);
  // 不再写 navArousal:导航器是你自我报告的位置,心率测唤醒不测意图,不覆盖它
  _atmosLerpTarget = algoAtmosVal(arousal);
  const eqKey = algoEQPreset(navValence, arousal);
  const now = Date.now();
  // 真实心率:12s 节流防抖动乱跳;模拟滑条(immediate)是主动拖动,立即响应 / sim slider = deliberate drag, no throttle
  if (eqKey !== currentEQPreset && (immediate || now - _lastEQChange > 12000)) {
    applyEQ(eqKey);
    _lastEQChange = now;
  }
  if (typeof refreshAlgoOutput === 'function') refreshAlgoOutput();
}

async function connectHeartSensor() {
  const btn = document.getElementById('heartConnect');
  const display = document.getElementById('heartBPMDisplay');
  if (!('serial' in navigator)) {   // Safari / Firefox / 手机浏览器不支持 USB 串口
    if (display) { display.textContent = t(UI.hrNoSerial); display.classList.add('status'); }
    return;
  }
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    if (btn) { btn.textContent = t(UI.hrConnected); btn.classList.add('connected'); }
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
          if (display) { display.textContent = t(UI.hrPlaceFinger); display.classList.add('status'); }
          _hrWaiting = true;
          continue;
        }
        if (raw === 'B') {
          if (heartMode === 'auto') {
            window.heartPulse = 1.0;
            _heartbeatAudioPulse();
          }
          if (display && _hrWaiting) { display.textContent = t(UI.hrDetecting); display.classList.add('status'); _hrWaiting = false; }
          continue;
        }
        const bpm = parseInt(raw);
        if (bpm > 40 && bpm < 180) {
          // 波动抑制:①单次跳变 clamp ±8 BPM(杀光学 PPG 漏拍/重复计数的尖峰,但允许持续变化) ②更重 EMA(0.3→0.2,声音本就该缓变)
          window._hrLastRaw = bpm;   // 记录器用:未平滑的原始读数 / raw reading for the trace logger
          if (_heartSmooth === 0) _heartSmooth = bpm;
          else { const stepped = _heartSmooth + Math.max(-8, Math.min(8, bpm - _heartSmooth)); _heartSmooth = _heartSmooth * 0.8 + stepped * 0.2; }
          const smoothed = Math.round(_heartSmooth);
          if (display) { display.textContent = smoothed; display.classList.remove('status'); }   // 单位「BPM」在面板里单独显示

          if (genMode) { _driveFromHeart(_heartSmooth); }              // 工作/睡眠板块:真实心率→引擎(暖冷/远近/事件率)
          else if (heartMode === 'auto') { _driveFromHeart(_heartSmooth); }  // 有旋律板块:心率→唤醒→氛围/分轨/EQ
        }
      }
    }
  } catch (e) {
    _heartConnected = false;
    if (btn) { btn.textContent = t(UI.hrConnect); btn.classList.remove('connected'); }
    if (display) { display.textContent = e.name === 'InvalidStateError' ? t(UI.hrPortBusy) : t(UI.hrConnFail); display.classList.add('status'); }
    console.warn('[heart]', e.message);
  }
}

document.getElementById('heartConnect')?.addEventListener('click', connectHeartSensor);

// 心率模式应用(一处真源:点击/初始/进板块都调它)。drive=true 才立即用当前值驱动,false 只同步 UI(落地页初始化不制造副作用)
function applyHeartMode(mode, drive) {
  heartMode = mode;
  document.querySelectorAll('#heartModeBar .hm-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const heartBar = document.getElementById('heartBar');
  const heartSimBar = document.getElementById('heartSimBar');
  const heartRestingBar = document.getElementById('heartRestingBar');
  const hmDesc = document.getElementById('hmDesc');
  const activeBtn = document.querySelector('#heartModeBar .hm-btn[data-mode="' + mode + '"]');
  if (hmDesc) hmDesc.textContent = activeBtn && activeBtn.dataset.desckey ? t(UI[activeBtn.dataset.desckey]) : '';
  if (mode === 'free') {
    if (heartBar) heartBar.style.display = 'none';
    if (heartSimBar) heartSimBar.style.display = 'none';
    if (heartRestingBar) heartRestingBar.style.display = 'none';
    _atmosLerpTarget = 100;
  } else if (mode === 'sim') {
    if (heartBar) heartBar.style.display = 'none';
    if (heartSimBar) heartSimBar.style.display = '';
    if (heartRestingBar) heartRestingBar.style.display = '';
    if (drive) { const sim = document.getElementById('heartSimSlider'); if (sim) { _heartSmooth = +sim.value; _driveFromHeart(+sim.value, true); } }
  } else { // auto
    if (heartBar) heartBar.style.display = '';
    if (heartSimBar) heartSimBar.style.display = 'none';
    if (heartRestingBar) heartRestingBar.style.display = '';
  }
  // 心情(暖冷/效价)滑条:只在自由聆听出现;心率驱动时由身体接管唤醒,手调音色会被拉回,故隐藏
  setValenceVisible(mode === 'free');
  const rh = document.getElementById('restingHintTxt');   // 基线测法说明跟着基线输入框显隐
  if (rh && heartRestingBar) rh.style.display = heartRestingBar.style.display;
  document.body.classList.toggle('hr-driven', mode !== 'free');
  if (typeof refreshGenNow === 'function') refreshGenNow();   // 心率驱动时:能量/音色手动控件让位给「此刻的声音」
  try { localStorage.setItem('ss_heartmode', mode); } catch (e) {}
  if (typeof refreshSceneAlgoPanel === 'function') refreshSceneAlgoPanel();
}
// 模式切换 / mode toggle(只作用于心率模式条,不误伤 gen 预设的 .hm-btn)
document.querySelectorAll('#heartModeBar .hm-btn').forEach(btn => {
  btn.addEventListener('click', () => applyHeartMode(btn.dataset.mode, true));
});
// 恢复上次心率模式 + 初始同步 UI(drive=false:落地页不触发驱动/EQ 副作用)
(function initHeartMode(){
  try { const m = localStorage.getItem('ss_heartmode'); if (m && ['auto','sim','free'].includes(m)) heartMode = m; } catch (e) {}
  applyHeartMode(heartMode, false);
})();
// 心情滑条显隐 / show-hide the valence(mood) row + its description
function setValenceVisible(show){
  const row = document.getElementById('valenceRow');
  const desc = document.getElementById('valenceDesc');
  if (row) row.style.display = show ? '' : 'none';
  if (desc) desc.style.display = show ? '' : 'none';
}
setValenceVisible(heartMode === 'free');   // 初始:默认 auto → 隐藏心情

// 模拟心率滑条 / simulated heart-rate slider — drives the same chain as the real sensor, no hardware
document.getElementById('heartSimSlider')?.addEventListener('input', (e) => {
  const bpm = +e.target.value;
  _heartSmooth = bpm;
  const disp = document.getElementById('heartSimBPM');
  if (disp) disp.textContent = bpm;
  _driveFromHeart(bpm, true);   // 主动拖动:立即响应,不走 12s 节流
});

// 静息基线输入 / resting-baseline input — 测出你自己的安静心率后填这里;改完立即同步映射 + 引擎
const restingInput = document.getElementById('restingBPMInput');
if (restingInput) {
  restingInput.value = restingBPM;   // 初始对齐(可能被 restorePrefs 覆盖过)
  restingInput.addEventListener('change', () => {
    restingInput.value = setRestingBPM(restingInput.value);
  });
}

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
  btn.dataset.busy = '1';
  status.textContent = '';

  // 如果场景页已连接心率，直接复用现有数据流 / reuse live stream if already connected
  if (_heartConnected && _heartSmooth > 0) {
    btn.textContent = t(UI.navCollecting);
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
        status.textContent = `${t(UI.navDoneAvg)} ${Math.round(snapSmooth)} BPM`;
        btn.textContent = t(UI.navRescan);
        btn.dataset.done = '1'; delete btn.dataset.busy;
        btn.disabled = false;
        btn.classList.remove('scanning');
      }
    }, 400);
    return;
  }

  // 未连接：自己开端口扫描 / not connected: open port for scan
  btn.textContent = t(UI.navConnecting);
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
          : `${left}s · ${t(UI.hrPlaceFinger)}`;
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
      ? `${t(UI.navDoneAvg)} ${Math.round(scanSmooth)} BPM`
      : t(UI.navNoHR);
    if (bpmCount > 0) { btn.textContent = t(UI.navRescan); btn.dataset.done = '1'; }
    else { btn.textContent = t(UI.navScan); delete btn.dataset.done; }
  } catch (e) {
    console.warn('[navScan]', e.name, e.message);
    status.textContent = e.name === 'NotFoundError' ? t(UI.navCancelled) : t(UI.hrConnFail) + ': ' + e.message;
    btn.textContent = t(UI.navScan); delete btn.dataset.done;
  }

  delete btn.dataset.busy;
  btn.disabled = false;
  btn.classList.remove('scanning');
}

document.getElementById('navScanBtn')?.addEventListener('click', startNavScan);


/* ============================================================
   14. 此刻的声音 / "What the sound is doing" — 播放页主角
   给用户看的闭环反馈:显示的就是真正在响的结构(同一套 stemGainFor / 氛围值),
   不放公式、引用、数字 —— 那些在讲解页(model-diagram / stem-test)。
   ============================================================ */
function renderNow() {
  try {
    const panel = document.getElementById('nowPanel');
    const rowsEl = document.getElementById('nowRows');
    if (!panel || !rowsEl || genMode || !currentScene) return;
    if (!document.getElementById('scene').classList.contains('active')) return;
    const song = currentSong();
    if (!song) return;
    const a = curArousal();
    const rows = song.stems
      ? song.stems.layers.map(L => ({ label: t(L.label), v: stemGainFor(L.curve, a) }))
      : [{ label: t(UI.nowOpenLabel), v: a }];
    const key = (song.stems ? song.stems.dir : 'full') + '|' + lang;
    if (rowsEl.dataset.key !== key) {
      rowsEl.dataset.key = key;
      rowsEl.innerHTML = rows.map(r =>
        `<div class="now-row"><span class="now-lab">${r.label}</span><span class="now-track"><span class="now-fill"></span></span></div>`).join('');
      const capEl = document.getElementById('nowCap'); capEl.textContent = t(song.stems ? UI.nowStemsCap : UI.nowOpenCap); capEl.classList.remove('err');
      document.querySelector('#nowPanel .now-title').textContent = t(UI.nowTitle);
    }
    const fills = rowsEl.querySelectorAll('.now-fill');
    rows.forEach((r, i) => { if (fills[i]) fills[i].style.transform = `scaleX(${Math.max(0.015, Math.min(1, r.v)).toFixed(3)})`; });
    const ch = document.getElementById('nowChar');
    const p = EQ_PRESETS[currentEQPreset];
    if (ch) ch.textContent = p ? `${t(UI.nowCharacter)} · ${t(p.name)}` : '';
    panel.classList.toggle('live', !!isPlaying);
  } catch (e) { /* 早期帧依赖未就绪时静默跳过 / skip silently before init */ }
}


// 导航器引导区:三种策略 → 三个板块(Saarikallio & Erkkilä 2007:宣泄/转移/慰藉)/ guide-zone strategy buttons
document.querySelectorAll('#navGuide .nav-guide-btn').forEach(btn => {
  btn.addEventListener('click', () => { ensureAudio(); openScene(btn.dataset.board); });
});


// 生成板块「此刻的声音」:说明滑条为何在动 + 睡眠下行弧进度 / gen-board "what the sound is doing"
function setGenArc(pct) {
  const bar = document.getElementById('genArc'), fill = document.getElementById('genArcFill'), txt = document.getElementById('genArcTxt');
  if (!bar || !fill || !txt) return;
  if (pct == null) { bar.style.display = 'none'; txt.textContent = ''; return; }
  bar.style.display = ''; fill.style.transform = `scaleX(${Math.max(0.01, pct / 100)})`;
  txt.textContent = `${t(UI.genArcLabel)} · ${pct}%`;
}
function refreshGenNow() {
  const cap = document.getElementById('genNowCap');
  if (cap) cap.textContent = t(heartMode === 'free' ? UI.genNowFree : UI.genNowHR);
  const title = document.querySelector('#genNow .now-title');
  if (title) title.textContent = t(UI.nowTitle);
}
