// ============================================================================
// Sound States · 声景引擎「单一配置源」
// 场景/图层/混音 全部数据在这里。scene.html(调音台) 与 主站工作/睡眠板块 都读它,
// 一处调、处处生效。命名空间 SoundscapeConfig(避免与主站 script.js 的 SCENES 撞名)。
// 角度:0=正前(12点) / +PI/2=右(3点) / PI=后(6点) / -PI/2=左(9点)
// 每层:role K/S/M · ambient(底胶,无方位) · perEvent(逐事件方位) · ang/dist/spread(扇区) · send(送混响量) · range:[min,max](缓慢呼吸区间)
// ============================================================================
const SoundscapeConfig = (function(){

const SCENES = {
  hills: { label:'环山(寺庙+森林 · 白天/黑夜)', phased:true, layers:[] },   // layers 由 curPhase 注入(见 HILLS_VARIANTS)
  rain: { label:'雨·窗边', layers:[
    { key:'glue', role:'K', label:'底噪·棕噪', preset:'glue-brown  棕噪·深暖(睡眠)', vol:0.18, ambient:true, color:'#7a8a90', range:[0.1,0.25] },
    { key:'wind', role:'K', label:'微风',      preset:'wind-light  微风·窗边',        vol:0.18, ang:Math.PI*0.8, dist:1.6, send:0.3, color:'#8fd0e2', range:[0.1,0.25] },
    { key:'drip', role:'M', label:'滴水·屋檐', preset:'drip-eave  滴水·屋檐',        vol:0.85, ang:0.9, dist:1.0, spread:0.7, send:0.35, perEvent:true, color:'#5fbfd0' },
    { key:'ai:rainbed', role:'K', label:'雨底(环绕)', kind:'bed', vol:0.72, send:0.3, color:'#6a9aa8', range:[0.65,0.8],
      files:['rain-demo-assets/near_loop.m4a','rain-demo-assets/far_loop.m4a'], pos:[{ang:-2.3,dist:1.2},{ang:2.3,dist:1.8}] },
    { key:'ai:thunder', role:'S', label:'远雷(左右微变)', kind:'evt', vol:0.55, send:0.8, color:'#9a8fb0',
      files:['rain-demo-assets/thunder.m4a','scene-assets/thunder-evt_1.m4a','scene-assets/thunder-evt_2.m4a'], ivMin:12, ivMax:26, ang:0, spread:1.2, dist:2.2, lp:1200 },
  ]},
  homework: { label:'雨天在家办公(工作)', layers:[
    { key:'glue', role:'K', label:'底胶·粉噪(掩蔽)', preset:'glue-pink  粉噪·通用底胶', vol:0.48, ambient:true, color:'#7a8a90', range:[0.45,0.5] },
    { key:'wind', role:'K', label:'室内嗡(风近似)', preset:'wind-sea  海风·空旷',      vol:0.12, ang:Math.PI, dist:1.3, send:0.2, color:'#8fd0e2', range:[0.1,0.15] },
    { key:'ai:rainwin',  role:'K', label:'窗外雨(隔窗·某侧)', kind:'bed', vol:0.4, send:0.3, color:'#6a9aa8', range:[0.3,0.5],
      files:['rain-demo-assets/far_loop.m4a'], pos:[{ang:-1.6,dist:1.7}] },
    { key:'ai:raindrip', role:'M', label:'雨滴(隔窗·闷)', kind:'bed', vol:0.13, send:0.2, color:'#6a9aa8', range:[0.08,0.18],
      files:['rain-demo-assets/drops_loop.m4a'], pos:[{ang:-1.4,dist:1.8}] },
    { key:'ai:keyboard', role:'S', label:'键盘(手边)', kind:'evt', vol:0.1, send:0.12, color:'#c0b060', group:'desk', range:[0,0.15],
      files:['scene-assets/keyboard-evt_1.m4a','scene-assets/keyboard-evt_2.m4a','scene-assets/keyboard-evt_3.m4a','scene-assets/keyboard-evt_4.m4a'], ivMin:7, ivMax:17, ang:0.35, spread:0.3, dist:0.9, rate:0.8 },
    { key:'ai:pen',   role:'S', label:'笔尖(左手边)', kind:'evt', vol:0.06, send:0.1, color:'#b0a878', group:'desk', range:[0,0.1],
      files:['scene-assets/pen-evt_1.m4a','scene-assets/pen-evt_2.m4a'], ivMin:24, ivMax:52, ang:-0.45, spread:0.3, dist:0.85, rate:0.8 },
    { key:'ai:paper', role:'S', label:'翻纸(前方)', kind:'evt', vol:0.06, send:0.1, color:'#c9b98a', group:'desk', range:[0,0.1],
      files:['scene-assets/paper-evt_1.m4a'], ivMin:38, ivMax:78, ang:-0.1, spread:0.4, dist:0.9, rate:0.8 },
    { key:'ai:mouse', role:'S', label:'鼠标(右手边)', kind:'evt', vol:0.06, send:0.08, color:'#9aa0a8', group:'desk', range:[0,0.1],
      files:['scene-assets/mouse-evt_1.m4a'], ivMin:18, ivMax:42, ang:0.55, spread:0.2, dist:0.9, rate:0.8 },
    { key:'ai:chair', role:'S', label:'挪椅(偶尔·远)', kind:'evt', vol:0.1, send:0.15, color:'#a89a80', group:'desk', range:[0,0.2],
      files:['scene-assets/chair-evt_1.m4a'], ivMin:65, ivMax:130, ang:0.75, spread:0.4, dist:1.15, rate:0.85 },
  ]},
  beach: { label:'海边·空海(工作/专注)', layers:[
    { key:'glue', role:'K', label:'底胶·粉噪(掩蔽)', preset:'glue-pink  粉噪·通用底胶', vol:0.4, ambient:true, color:'#7a8a90', range:[0.25,0.55] },
    { key:'wind', role:'K', label:'海风(空旷)',      preset:'wind-sea  海风·空旷',      vol:0.3, ang:Math.PI, dist:1.8, send:0.35, color:'#8fd0e2', range:[0.2,0.4] },
    { key:'ai:wave', role:'K', label:'波浪(慢周期·主床垫)', kind:'bed', vol:0.6, send:0.3, color:'#5f9fd0', range:[0.5,0.7],
      files:['scene-assets/wave-bed_1.m4a','scene-assets/wave-bed_2.m4a'], pos:[{ang:-0.4,dist:1.3},{ang:0.4,dist:1.5}] },  // 两条真海浪(~18s无缝·尾折回头保慢周期)左右铺开
    { key:'ai:gull', role:'S', label:'海鸥(远·极稀)', kind:'evt', vol:0.4, send:0.7, color:'#9ab0c0', range:[0.3,0.5],
      files:['scene-assets/gull-evt_1.m4a','scene-assets/gull-evt_2.m4a'], ivMin:25, ivMax:55, ang:Math.PI*0.7, spread:1.2, dist:2.4, lp:2000 },
  ]},
};

// 环山世界·白天/黑夜两态:木鱼钟=只白天;篝火 白天偶尔(evt·取一小段=踩枝噼啪)·黑夜持续(bed);虫鸣 白天少·黑夜多;鸟=白天/猫头鹰=黑夜。共有=林间风/底胶/溪流。
const HILLS_VARIANTS = {
  night:[
    { key:'glue', role:'K', label:'底胶·棕噪', preset:'glue-brown  棕噪·深暖(睡眠)', vol:0.28, ambient:true, color:'#7a8a90', range:[0.2,0.35] },
    { key:'wind', role:'K', label:'林间风', preset:'wind-forest  林间风', vol:0.32, ang:Math.PI, dist:1.7, send:0.35, color:'#8fd0e2', range:[0.2,0.45] },
    { key:'ai:fire', role:'K', label:'篝火(持续·暖包裹)', kind:'bed', vol:0.4, send:0.15, color:'#d8a35a', range:[0.1,0.6],
      files:['scene-assets/fire-bed_1.m4a','scene-assets/fire-bed_2.m4a'], pos:[{ang:-0.5,dist:0.8},{ang:0.5,dist:0.9}] },
    { key:'ai:insect', role:'M', label:'虫鸣(多·环绕)', kind:'bed', vol:0.45, send:0.3, color:'#7ec88f', range:[0.2,0.7],
      files:['scene-assets/insect-bed_1.m4a','scene-assets/insect-bed_2.m4a'], pos:[{ang:-2.4,dist:1.9},{ang:2.4,dist:2.0}] },
    { key:'ai:stream', role:'K', label:'溪流(某侧)', kind:'bed', vol:0.15, send:0.3, color:'#5fbfd0', range:[0,0.25],
      files:['scene-assets/stream-bed_1.m4a','scene-assets/stream-bed_2.m4a'], pos:[{ang:1.5,dist:1.3},{ang:1.9,dist:1.6}] },
    { key:'ai:owl', role:'S', label:'猫头鹰(远)', kind:'evt', vol:0.5, send:0.7, color:'#9a8fb0',
      files:['scene-assets/owl-evt_1.m4a','scene-assets/owl-evt_2.m4a'], ivMin:16, ivMax:38, ang:Math.PI*0.8, spread:1.0, dist:2.3, lp:1500 },
  ],
  day:[
    { key:'glue', role:'K', label:'底胶·棕噪', preset:'glue-brown  棕噪·深暖(睡眠)', vol:0.25, ambient:true, color:'#7a8a90', range:[0.2,0.3] },
    { key:'wind', role:'K', label:'林梢风', preset:'wind-treetop  林梢风', vol:0.3, ang:Math.PI, dist:1.7, send:0.35, color:'#8fd0e2', range:[0,0.45] },
    { key:'ai:stream', role:'K', label:'溪流(某侧)', kind:'bed', vol:0.15, send:0.3, color:'#5fbfd0', range:[0,0.25],
      files:['scene-assets/stream-bed_1.m4a','scene-assets/stream-bed_2.m4a'], pos:[{ang:1.5,dist:1.3},{ang:1.9,dist:1.6}] },
    { key:'ai:insect', role:'M', label:'虫鸣(少·环绕)', kind:'bed', vol:0.12, send:0.3, color:'#7ec88f', range:[0,0.2],
      files:['scene-assets/insect-bed_1.m4a','scene-assets/insect-bed_2.m4a'], pos:[{ang:-2.4,dist:1.9},{ang:2.4,dist:2.0}] },
    { key:'bell', role:'S', label:'寺钟(白天)', preset:'bell-3min  寺钟·每3分', vol:0.6, ang:0.3, dist:2.2, spread:0.5, send:0.9, perEvent:true, color:'#d8a35a' },
    { key:'woodfish', role:'M', label:'木鱼(白天)', preset:'woodblock  木鱼·诵经(稳)', vol:0.55, ang:0.0, dist:0.9, spread:0.3, send:0.15, perEvent:true, color:'#c98a4a', range:[0.3,0.8] },
    { key:'ai:bird', role:'S', label:'鸟鸣(白天)', kind:'evt', vol:0.35, send:0.4, color:'#8fcf6f', range:[0.2,0.5],
      files:['scene-assets/bird-evt_1.m4a'], ivMin:8, ivMax:20, ang:-0.6, spread:1.2, dist:1.6, lp:6000, pitchJit:0.08 },
    { key:'ai:fire', role:'S', label:'篝火(偶尔·踩枝感)', kind:'evt', vol:0.45, send:0.2, color:'#d8a35a',
      files:['scene-assets/fire-bed_1.m4a','scene-assets/fire-bed_2.m4a'], ivMin:18, ivMax:45, ang:0.4, spread:0.8, dist:1.1, slice:[0.25,0.7], pitchJit:0.04 },
  ],
};
SCENES.hills.layers = HILLS_VARIANTS.night;                 // 默认黑夜

// 每场景 · 睡眠/工作:{ g:全局旋钮(暖冷tone/半径radius/混响reverb[/总音量vol]) , layers:每层音量 }。理论占位,凭耳可调。
// 睡眠=暗/安全/包裹(暖床垫↑、高频虫鸣↓、事件↓);工作=掩蔽/中唤醒/透明(掩蔽底胶↑、任务音在、抢注意音↓)
const MIX = {
  hills: {
    sleep:{ g:{tone:2600,radius:2.2,reverb:1.0}, layers:{ glue:0.60, wind:0.28, 'ai:fire':0.78, 'ai:insect':0.32, 'ai:stream':0.46, 'ai:owl':0.42, bell:0.40, woodfish:0.40, 'ai:bird':0.30 } },
    work: { g:{tone:8000,radius:1.2,reverb:0.6}, layers:{ glue:0.50, wind:0.34, 'ai:fire':0.60, 'ai:insect':0.42, 'ai:stream':0.55, 'ai:owl':0.30, bell:0.58, woodfish:0.60, 'ai:bird':0.50 } },
  },
  rain: {
    sleep:{ g:{tone:3000,radius:2.0,reverb:0.9}, layers:{ glue:0.60, wind:0.26, drip:0.68, 'ai:rainbed':0.72, 'ai:thunder':0.40 } },
    work: { g:{tone:8000,radius:1.2,reverb:0.5}, layers:{ glue:0.48, wind:0.32, drip:0.85, 'ai:rainbed':0.66, 'ai:thunder':0.30 } },
  },
  homework: {
    sleep:{ g:{tone:3500,radius:1.8,reverb:0.7}, layers:{ glue:0.55, 'ai:rainwin':0.66, 'ai:keyboard':0.30 } },
    work: { g:{tone:8500,radius:1.1,reverb:0.45}, layers:{ glue:0.55, 'ai:rainwin':0.55, 'ai:keyboard':0.52, 'ai:pen':0.40, 'ai:paper':0.40, 'ai:mouse':0.38, 'ai:chair':0.42 } },
  },
  beach: {
    sleep:{ g:{tone:3000,radius:2.0,reverb:0.8}, layers:{ glue:0.55, wind:0.18, 'ai:wave':0.78, 'ai:gull':0.20 } },
    work: { g:{tone:9000,radius:1.4,reverb:0.6}, layers:{ glue:0.52, wind:0.22, 'ai:wave':0.72, 'ai:gull':0.30 } },
  },
};

return { SCENES, HILLS_VARIANTS, MIX };
})();

// 兼容浏览器(全局)与可能的模块环境
if (typeof module !== 'undefined' && module.exports) module.exports = SoundscapeConfig;
