// sound-engines.js — 音源库合成引擎(共享)。抽自 sound-library.html。
// sound-library.html(试听) 和 scene.html(空间合成台) 都引用。改编自 Farnell《Designing Sound》。

// ============================================================
// 音源库 · 合成引擎集合。每类 = 一个 build 函数(返回 {out, stop, tick?})。
// 风声 = 改编自 Farnell《Designing Sound》p18 wind:
//   白噪 → 共振带通(vcf~),中心频率&音量由 0..1 的「风速」控制信号驱动。
//   风速 = 基准 + 0.1Hz 正弦呼吸 + 随机阵风(gust) + 阵风(squall)。
// ============================================================
let ctx;
function AC(){ return ctx || (ctx = new (window.AudioContext||window.webkitAudioContext)()); }

function bq(type,freq,q,gain){
  const b=ctx.createBiquadFilter(); b.type=type; b.frequency.value=freq;
  if(q!=null) b.Q.value=q; if(gain!=null) b.gain.value=gain; return b;
}
// 无缝 stereo 噪声 loop(左右独立 → 天然宽/去相关, = wind2 的 vd~ 脱相关思路)
function noiseLoopBuf(sec=9){
  const sr=ctx.sampleRate, len=Math.floor(sr*sec), xf=Math.floor(sr*0.12);
  const b=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){
    const d=b.getChannelData(c), tmp=new Float32Array(len+xf);
    for(let i=0;i<len+xf;i++) tmp[i]=Math.random()*2-1;
    for(let i=0;i<len;i++) d[i]=tmp[i];
    for(let i=0;i<xf;i++){ const k=i/xf; d[i]=d[i]*k+tmp[len+i]*(1-k); }
  }
  return b;
}
// 早反射 + 暗扩散尾(取自雨 demo)
function reverbIR(sec=2.6){
  const sr=ctx.sampleRate, len=Math.floor(sr*sec), pre=Math.floor(sr*0.02);
  const ir=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){
    const d=ir.getChannelData(c), erN=8+Math.floor(Math.random()*6);
    for(let k=0;k<erN;k++){ const pos=pre+Math.floor(Math.random()*sr*0.08); if(pos<len) d[pos]+=(Math.random()*2-1)*(1-k/erN)*0.8; }
    let lp=0; const ts=Math.floor(sr*0.025);
    for(let i=ts;i<len;i++){ const t=(i-ts)/(len-ts); const n=(Math.random()*2-1)*Math.pow(1-t,2.3); lp+=(0.5-0.35*t)*(n-lp); d[i]+=lp; }
    let mx=1e-6; for(let i=0;i<len;i++) mx=Math.max(mx,Math.abs(d[i])); for(let i=0;i<len;i++) d[i]/=mx;
  }
  return ir;
}

// 短噪声片(给离散事件用:雨滴/噼啪)
let _shortNoise=null;
function shortNoiseBuf(){
  if(_shortNoise) return _shortNoise;
  const len=Math.floor(ctx.sampleRate*0.3), b=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  return (_shortNoise=b);
}

// ---------------- 风速控制信号 ----------------
// 返回一个 ConstantSource 的输出(经一个求和 gain),范围大致 0..1.2,慢变。
// base(常量) + breathing(0.1Hz 正弦*0.12) + gust(每 ~0.4s 随机目标,平滑逼近)。
function makeWindSpeed(baseParam){
  const sum=ctx.createGain(); sum.gain.value=1;
  const base=ctx.createConstantSource(); base.offset.value=baseParam; base.start(); base.connect(sum);
  // 呼吸:0.1Hz 正弦
  const br=ctx.createOscillator(); br.type='sine'; br.frequency.value=0.1;
  const brg=ctx.createGain(); brg.gain.value=0.12; br.connect(brg).connect(sum); br.start();
  // 阵风:随机游走的常量源(squall+gust 合一的简化),由 tick 驱动
  const gust=ctx.createConstantSource(); gust.offset.value=0; gust.start(); gust.connect(sum);
  return { out:sum, base, gust, _br:br };
}

function buildWind(p){
  const speed=makeWindSpeed(p.base);
  const noise=noiseLoopBuf();

  const out=ctx.createGain(); out.gain.value=0;            // 淡入
  out.gain.setTargetAtTime(p.vol, ctx.currentTime, 1.2);

  // 两条共振带:低(主体) + 高(啸叫泛音)
  const bands=[
    { mul:1.0,  amp:1.0,  sweep:0.7 },
    { mul:2.4,  amp:0.4,  sweep:1.1 },
  ].map(band=>{
    const src=ctx.createBufferSource(); src.buffer=noise; src.loop=true;
    const f=bq('bandpass', p.tone*band.mul, p.q);
    // 风速 → 中心频率:freq = base + speed * base*sweep(风越大越亮越高)
    const fmod=ctx.createGain(); fmod.gain.value=p.tone*band.mul*band.sweep;
    speed.out.connect(fmod).connect(f.frequency);
    // 风速 → 音量:风越大越响
    const vg=ctx.createGain(); vg.gain.value=0;
    const amod=ctx.createGain(); amod.gain.value=band.amp;
    speed.out.connect(amod).connect(vg.gain);
    src.connect(f).connect(vg).connect(out);
    src.start(0, Math.random()*noise.duration);
    return { src, f, fmod, amod, mul:band.mul, sweep:band.sweep, baseAmp:band.amp };
  });

  // 风速采样(给示波器)
  let gtarget=0, scope=new Float32Array(300), si=0;
  const tickTimer=setInterval(()=>{
    const t=ctx.currentTime;
    scope[si++ % 300] = Math.max(0, Math.min(1.3, speed.base.offset.value + 0.12*Math.sin(2*Math.PI*0.1*t) + gtarget));
  }, 120);
  // 阵风=事件:每隔几秒一阵,ramp 到随机强度(偶尔大呼啸)→保持→回落近静,明显有起有落
  let gustTimer=null, gustStop=false;
  function gustCycle(){
    if(gustStop) return;
    const peak=(0.3+Math.random()*0.8)*p.gustAmt;                    // 强度随机,有时大呼啸
    const rise=0.8+Math.random()*1.6, hold=0.2+Math.random()*1.3, fall=1.4+Math.random()*2.4;
    const t=ctx.currentTime;
    speed.gust.offset.setTargetAtTime(peak, t, rise*0.4);            // 起(呼啸渐强,共振随之变亮变响)
    speed.gust.offset.setTargetAtTime(0.015, t+rise+hold, fall*0.4); // 落回近静
    gtarget=peak;
    gustTimer=setTimeout(()=>{ gtarget=0.02; gustCycle(); }, (rise+hold+fall+0.5+Math.random()*2.8)*1000);
  }
  gustCycle();

  return {
    out, scope, get si(){ return si; },
    set base(v){ speed.base.offset.setTargetAtTime(v,ctx.currentTime,0.2); },
    set q(v){ bands.forEach(b=>b.f.Q.setTargetAtTime(v,ctx.currentTime,0.1)); },
    set tone(v){ bands.forEach(b=>{ b.f.frequency.setTargetAtTime(v*b.mul,ctx.currentTime,0.15); b.fmod.gain.setTargetAtTime(v*b.mul*b.sweep,ctx.currentTime,0.15); }); },
    set gustAmt(v){ p.gustAmt=v; },
    set vol(v){ out.gain.setTargetAtTime(v,ctx.currentTime,0.1); },
    stop(){ gustStop=true; clearTimeout(gustTimer); clearInterval(tickTimer); try{speed.base.stop();speed.gust.stop();speed._br.stop();}catch(e){}
            bands.forEach(b=>{try{b.src.stop();}catch(e){}}); try{out.disconnect();}catch(e){} },
  };
}

// ============================================================
// 火 FIRE = 改编自 Farnell p11 fire_generator。三成分共用一个噪声源:
//   ① 嘶  hiss : highpass(>1.2k)噪声,慢随机振幅 → 连续"sss"
//   ② 胴鸣 body: ~60Hz 共振带通,慢随机揺 → 暖低频胴鸣/舔舐
//   ③ 噼啪 evt : 泊松随机触发的短带通爆裂(随机音高/衰减) = 同雨滴机制
// 返回 {out,scope,si,setters,stop}
// ============================================================
function buildFire(p){
  const out=ctx.createGain(); out.gain.value=0;
  out.gain.setTargetAtTime(p.vol, ctx.currentTime, 1.0);
  const noise=noiseLoopBuf();
  const sn=shortNoiseBuf();
  const live={ crack:p.crack, bright:p.bright };   // 实时参数(调度时读)
  let scope=new Float32Array(300), si=0, baseLevel=p.body, flash=0;

  // ① 嘶
  const hsrc=ctx.createBufferSource(); hsrc.buffer=noise; hsrc.loop=true;
  const hhp=bq('highpass',1200,0.7);
  const hg=ctx.createGain(); hg.gain.value=p.hiss*0.5;
  hsrc.connect(hhp).connect(hg).connect(out);
  hsrc.start(0, Math.random()*noise.duration);

  // ② 胴鸣 body(~60Hz 共振)
  const bsrc=ctx.createBufferSource(); bsrc.buffer=noise; bsrc.loop=true;
  const bbp=bq('bandpass',62,3.5);
  const blp=bq('lowpass',220);
  const bg=ctx.createGain(); bg.gain.value=p.body*0.9;
  bsrc.connect(bbp).connect(blp).connect(bg).connect(out);
  bsrc.start(0, Math.random()*noise.duration);

  // ③ 噼啪 = 脆·干·宽Q 的 click(不出音高 → 不像水),泊松调度的"束"(一下或连串)
  let crackTimer=null, stopped=false;
  function schedule(){
    if(stopped) return;
    const dps=live.crack;                             // = 每秒"束"数
    if(dps<=0){ crackTimer=setTimeout(schedule,200); return; }
    const iv=-Math.log(1-Math.random())/dps;          // 无记忆随机间隔
    crackTimer=setTimeout(()=>{ if(!stopped){ burst(); schedule(); } }, iv*1000);
  }
  // 一束:多数 1 下,偶尔"啪啪啪"连串(真实火的节奏)
  function burst(){
    const r=Math.random();
    const n = r<0.58 ? 1 : r<0.85 ? 2+(Math.random()*2|0) : 4+(Math.random()*4|0);
    let d=0;
    for(let i=0;i<n;i++){
      const big=Math.random()<0.16;
      const amp=(big?0.95:0.5)*(0.6+Math.random()*0.6)*(0.55+baseLevel*0.7);
      setTimeout(()=>{ if(!stopped) snap(amp,big); }, d);
      d += 10+Math.random()*75;                        // 串内短间隔
    }
  }
  function snap(amp,big){
    const t=ctx.currentTime, dur=(big?0.02:0.004)+Math.random()*(big?0.04:0.02);  // 极短=脆
    const nb=ctx.createBufferSource(); nb.buffer=sn;
    const hp=bq('highpass', 800+Math.random()*1400);  // 去低频水感,保持干脆
    const col=bq('bandpass', live.bright*(0.7+Math.random()*1.0), 0.7+Math.random()*1.1); // 宽Q=只染色不出音高
    const g=ctx.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(amp, t+0.0008);  // 瞬起
    g.gain.exponentialRampToValueAtTime(0.0005, t+dur);  // 极快落
    nb.connect(hp).connect(col).connect(g).connect(out);
    nb.start(t); nb.stop(t+dur+0.02);
    if(big){                                             // 大爆裂带一点木质"噗"
      const o=ctx.createOscillator(); o.type='triangle';
      o.frequency.setValueAtTime(170+Math.random()*150,t); o.frequency.exponentialRampToValueAtTime(65,t+0.05);
      const og=ctx.createGain(); og.gain.setValueAtTime(amp*0.45,t); og.gain.exponentialRampToValueAtTime(0.0005,t+0.06);
      o.connect(og).connect(out); o.start(t); o.stop(t+0.09);
    }
    flash=Math.max(flash, Math.min(1,amp*1.4));
  }
  schedule();
  // 嘶/胴鸣:稳态(只轻微起伏,不做风那种慢swell)+ 示波器滚动
  const tick=setInterval(()=>{
    const t=ctx.currentTime;
    hg.gain.setTargetAtTime(p.hiss*0.5*(0.8+Math.random()*0.25), t, 0.6);
    bg.gain.setTargetAtTime(p.body*0.8*(0.85+Math.random()*0.25), t, 0.7);
    scope[si++%300]=Math.max(flash, p.hiss*0.10);
    flash*=0.45;
  }, 80);

  return {
    out, scope, get si(){ return si; },
    set body(v){ p.body=v; baseLevel=v; bg.gain.setTargetAtTime(v*0.8,ctx.currentTime,0.2); },
    set hiss(v){ p.hiss=v; hg.gain.setTargetAtTime(v*0.5,ctx.currentTime,0.2); },
    set crack(v){ live.crack=v; },
    set bright(v){ live.bright=v; },
    set vol(v){ out.gain.setTargetAtTime(v,ctx.currentTime,0.1); },
    stop(){ stopped=true; clearTimeout(crackTimer); clearInterval(tick);
            try{hsrc.stop();bsrc.stop();}catch(e){} try{out.disconnect();}catch(e){} },
  };
}

// ============================================================
// 虫鸣 INSECTS = 改编自 Farnell cricket。每只 chirp = 两只微失谐正弦(~4.5k)
//   经脉冲列(trill)门控的振幅包络;一个泊松调度器不断在随机左右位生成 chirp = 虫声场。
//   颤速↑ + 相长↑ → 脉冲融合成连续 buzz = 蝉。
// ============================================================
function buildInsects(p){
  const outVol=ctx.createGain(); outVol.gain.value=0;
  outVol.gain.setTargetAtTime(p.vol, ctx.currentTime, 0.8);
  // 虫声场"呼吸":全体 0.07Hz 慢起伏(渐强渐弱),叠一点随机
  const field=ctx.createGain(); field.gain.value=0.72;
  const breathe=ctx.createOscillator(); breathe.type='sine'; breathe.frequency.value=0.06+Math.random()*0.05;
  const bd=ctx.createGain(); bd.gain.value=0.26; breathe.connect(bd).connect(field.gain); breathe.start();
  outVol.connect(field);
  const live={ density:p.density, pitch:p.pitch, trill:p.trill, phrase:p.phrase };
  let scope=new Float32Array(300), si=0, flash=0, stopped=false, timer=null;

  function chirp(){
    const t=ctx.currentTime+0.02;
    const fc=live.pitch*(0.92+Math.random()*0.16);      // 音高散布更大
    const dur=live.phrase*(0.65+Math.random()*0.75);    // 相长也随机
    const tr=live.trill*(0.82+Math.random()*0.36);      // 每只颤速不同=不机械
    const period=1/tr;
    const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=fc;
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=fc*(1.003+Math.random()*0.005);
    const mix=ctx.createGain(); mix.gain.value=0.5; o1.connect(mix); o2.connect(mix);
    const eg=ctx.createGain(); eg.gain.setValueAtTime(0.0002,t);
    const amp=0.11*(0.7+Math.random()*0.5);              // 整体更轻
    let tt=0;
    while(tt<dur){
      const shape=Math.sin(Math.PI*Math.min(1,tt/dur));  // 相内 hann 包络 = 渐强渐弱
      const pk=Math.max(0.0002, amp*shape*(0.7+Math.random()*0.5));  // 每个脉冲峰也抖动
      const on=t+tt;
      eg.gain.linearRampToValueAtTime(pk, on+period*0.35);
      eg.gain.linearRampToValueAtTime(0.0002, on+period*0.9);
      tt += period*(0.78+Math.random()*0.44);            // 脉冲间隔抖动
    }
    const pan=ctx.createStereoPanner(); pan.pan.value=Math.random()*1.7-0.85;
    mix.connect(eg).connect(pan).connect(outVol);
    o1.start(t); o2.start(t); o1.stop(t+dur+0.05); o2.stop(t+dur+0.05);
    flash=Math.min(1,amp*6);
  }
  function schedule(){
    if(stopped) return;
    const d=live.density;
    if(d<=0){ timer=setTimeout(schedule,250); return; }
    const iv=-Math.log(1-Math.random())/d;
    timer=setTimeout(()=>{ if(!stopped){ chirp(); schedule(); } }, iv*1000);
  }
  schedule();
  const tick=setInterval(()=>{ scope[si++%300]=flash; flash*=0.55; }, 70);

  return {
    out:field, scope, get si(){ return si; },
    set density(v){ live.density=v; }, set pitch(v){ live.pitch=v; },
    set trill(v){ live.trill=v; },     set phrase(v){ live.phrase=v; },
    set vol(v){ outVol.gain.setTargetAtTime(v,ctx.currentTime,0.1); },
    stop(){ stopped=true; clearTimeout(timer); clearInterval(tick);
            try{breathe.stop();}catch(e){} try{outVol.disconnect();field.disconnect();}catch(e){} },
  };
}
// 虫配方。参数 = {density,pitch,trill,phrase,wet,vol}
const INSECT_PRESETS = {
  'cricket-bed  夏夜蟋蟀':  { density:6,   pitch:4600, trill:22, phrase:0.25, wet:0.25, vol:0.68 }, // 族3,一片
  'cricket-sparse  夜寺·稀疏':{ density:1.5, pitch:4800, trill:18, phrase:0.30, wet:0.38, vol:0.52 }, // 族2c,近零事件深睡
  'cicada  蝉·日间':        { density:3,   pitch:3900, trill:74, phrase:1.30, wet:0.20, vol:0.66 }, // 连续buzz,偏白天/放松
  'forest-night  夜森林混合':{ density:9,   pitch:4400, trill:26, phrase:0.28, wet:0.30, vol:0.70 }, // 族3,密
};

// 色噪声 loop 缓冲:pink=Paul Kellet 滤波;brown=漏积分。带短交叉淡入无缝。
function coloredNoiseBuf(color,sec=10){
  const sr=ctx.sampleRate, len=Math.floor(sr*sec), xf=Math.floor(sr*0.15);
  const b=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){
    const d=b.getChannelData(c), tmp=new Float32Array(len+xf);
    if(color==='brown'){
      let last=0;
      for(let i=0;i<len+xf;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; tmp[i]=last*3.2; }
    }else{ // pink
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for(let i=0;i<len+xf;i++){ const w=Math.random()*2-1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;
        b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        tmp[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; }
    }
    for(let i=0;i<len;i++) d[i]=tmp[i];
    for(let i=0;i<xf;i++){ const k=i/xf; d[i]=d[i]*k+tmp[len+i]*(1-k); } // 头尾交叉→无缝
  }
  return b;
}
// ============================================================
// 底噪·底胶 GLUE = 引擎生成的粉/棕噪(§三)。不是"要听的声音",是垫在所有层下的融合底胶。
//   极低电平 · 稳态 · 极慢起伏(察觉不到)。
// ============================================================
function buildGlue(p){
  const out=ctx.createGain(); out.gain.value=0;
  const src=ctx.createBufferSource(); src.buffer=coloredNoiseBuf(p.color); src.loop=true;
  const lp=bq('lowpass',p.tone,0.6);
  const g=ctx.createGain(); g.gain.value=p.level;
  src.connect(lp).connect(g).connect(out);
  src.start(0, Math.random()*src.buffer.duration);
  out.gain.setTargetAtTime(1, ctx.currentTime, 1.5);   // 缓入
  // 极慢起伏(0.03Hz),深度很小,别显形
  const drift=ctx.createOscillator(); drift.type='sine'; drift.frequency.value=0.03;
  const dg=ctx.createGain(); dg.gain.value=p.level*p.drift*0.4;
  drift.connect(dg).connect(g.gain); drift.start();

  let scope=new Float32Array(300), si=0;
  const tick=setInterval(()=>{
    const t=ctx.currentTime;
    scope[si++%300]=Math.min(1, (p.level + p.level*p.drift*0.4*Math.sin(2*Math.PI*0.03*t))*3.2);
  }, 60);

  return {
    out, scope, get si(){ return si; },
    set level(v){ p.level=v; g.gain.setTargetAtTime(v,ctx.currentTime,0.2); dg.gain.setTargetAtTime(v*p.drift*0.4,ctx.currentTime,0.2); },
    set tone(v){ p.tone=v; lp.frequency.setTargetAtTime(v,ctx.currentTime,0.15); },
    set drift(v){ p.drift=v; dg.gain.setTargetAtTime(p.level*v*0.4,ctx.currentTime,0.2); },
    stop(){ clearInterval(tick); try{src.stop();drift.stop();}catch(e){} try{out.disconnect();}catch(e){} },
  };
}
// 底胶配方(只需少量)。参数 = {color,level,tone,drift}
const GLUE_PRESETS = {
  'glue-pink  粉噪·通用底胶':{ color:'pink',  level:0.10, tone:3000, drift:0.12 }, // 默认地面
  'glue-brown  棕噪·深暖(睡眠)':{ color:'brown', level:0.12, tone:1400, drift:0.15 }, // 睡眠下行弧
  'glue-faint  极淡·几乎无感':{ color:'pink',  level:0.05, tone:2400, drift:0.08 }, // 只求融合不求存在感
};

// 风配方(= 采购清单前缀)。参数 = {base,gust,q,tone,wet,vol}
const WIND_PRESETS = {
  'wind-light  微风·窗边':   { base:0.16, gust:0.25, q:2.2, tone:680,  wet:0.18, vol:0.62 }, // 族1,暖,软
  'wind-treetop  林梢风':    { base:0.30, gust:0.55, q:3.5, tone:1450, wet:0.30, vol:0.80 }, // 族2,明亮沙沙
  'wind-forest  林间风':     { base:0.34, gust:0.60, q:2.8, tone:980,  wet:0.35, vol:0.82 }, // 族3,饱满
  'wind-sea  海风·空旷':     { base:0.46, gust:0.30, q:1.3, tone:520,  wet:0.45, vol:0.85 }, // 族7,低沉宽
  'wind-howl  门缝呼啸':     { base:0.30, gust:0.70, q:20,  tone:900,  wet:0.30, vol:0.70 }, // 戏剧,共振啸(非深睡)
};

// 火配方。参数 = {body,hiss,crack,bright,tone,wet,vol}
const FIRE_PRESETS = {
  'fire-bed  篝火·主体':    { body:0.55, hiss:0.28, crack:7,  bright:3000, tone:4500, wet:0.22, vol:0.80 }, // 族1帐篷/族3,暖
  'fire-camp  营地·旺火':   { body:0.7,  hiss:0.4,  crack:12, bright:3500, tone:6000, wet:0.28, vol:0.85 }, // 族3夏夜,更响更噼啪
  'fire-embers  余烬·将熄': { body:0.3,  hiss:0.14, crack:2,  bright:2400, tone:3000, wet:0.30, vol:0.60 }, // 暖稀稳,睡眠收束
  'fire-crackle  爆裂·偏噼啪':{ body:0.3, hiss:0.16, crack:16, bright:3800, tone:5500, wet:0.20, vol:0.72 }, // = fire-crackle-evt 质地
};

// ============================================================
// 溪流滴水 WATER = Farnell 气泡水模型。每个泡 = 音高上升的正弦(收缩→共振升)+ 快衰减。
//   泊松调度:密度高=溪流,低=滴水。叠一层带通噪声=湍流 hiss。
// ============================================================
function buildWater(p){
  const out=ctx.createGain(); out.gain.value=0;
  out.gain.setTargetAtTime(p.vol, ctx.currentTime, 0.8);
  const live={ density:p.density, pitch:p.pitch };

  // 湍流底:带通噪声(2–6k)→ lowpass(明暗)→ gain,慢起伏
  const noise=noiseLoopBuf();
  const nsrc=ctx.createBufferSource(); nsrc.buffer=noise; nsrc.loop=true;
  const nbp=bq('bandpass',1800,0.4);                     // 更宽=水流"哗"的本体
  const nlp=bq('lowpass',p.tone,0.7);
  const turbG=ctx.createGain(); turbG.gain.value=p.turb*0.38;  // 湍流是溪流主体,给足
  nsrc.connect(nbp).connect(nlp).connect(turbG).connect(out);
  nsrc.start(0, Math.random()*noise.duration);

  let scope=new Float32Array(300), si=0, flash=0, stopped=false, timer=null;
  function bubble(){
    const t=ctx.currentTime+0.01;
    const stream=live.density>15;                        // 高密=溪流(短小),低密=滴水(大长)
    const rr=(Math.random()+Math.random())/2;            // 三角分布→集中在中心
    const f0=stream ? live.pitch*(0.8+rr*0.4)            // 溪流:适度散布
                    : live.pitch*(0.985+rr*0.03);        // 滴水:音高几乎固定(±1.5%)
    const rise=stream ? 0.03+Math.random()*0.10 : 0.015+Math.random()*0.035; // 滴水:上升极小
    const dur=stream ? 0.02+Math.random()*0.07 : 0.06+Math.random()*0.16;
    const amp=(stream?0.06:0.30)*(0.6+Math.random()*0.6);  // 溪流:泡不该盖过湍流;滴水:滴是主角
    const o=ctx.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(f0,t);
    o.frequency.exponentialRampToValueAtTime(f0*(1+rise), t+dur);   // 气泡收缩→音高上升
    const g=ctx.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(amp, t+0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t+dur);
    let pn; if(p.spatial){ pn=p.spatial(); o.onended=()=>{try{pn.disconnect();}catch(e){}}; }  // 逐事件HRTF方位
    else { pn=ctx.createStereoPanner(); pn.pan.value=Math.random()*1.6-0.8; }
    o.connect(g).connect(pn).connect(out);
    o.start(t); o.stop(t+dur+0.03);
    flash=Math.max(flash,Math.min(1,amp*3));
  }
  function schedule(){
    if(stopped) return;
    const d=live.density;
    if(d<=0){ timer=setTimeout(schedule,200); return; }
    const iv = d>15
      ? -Math.log(1-Math.random())/d          // 溪流:泊松(密集随机)
      : 0.4 + Math.random()*2.6*(0.9/Math.max(0.3,d)); // 滴水:0.4~3s 乱跳(密度0.9时);硬下限0.4s绝不重叠,密度越小越疏
    timer=setTimeout(()=>{ if(!stopped){ bubble(); schedule(); } }, iv*1000);
  }
  schedule();
  const tick=setInterval(()=>{ scope[si++%300]=Math.max(flash, p.turb*0.15); flash*=0.5; }, 70);

  return {
    out, scope, get si(){ return si; },
    set density(v){ live.density=v; }, set pitch(v){ live.pitch=v; },
    set turb(v){ p.turb=v; turbG.gain.setTargetAtTime(v*0.38,ctx.currentTime,0.15); },
    set tone(v){ nlp.frequency.setTargetAtTime(v,ctx.currentTime,0.12); },
    set vol(v){ out.gain.setTargetAtTime(v,ctx.currentTime,0.1); },
    stop(){ stopped=true; clearTimeout(timer); clearInterval(tick);
            try{nsrc.stop();}catch(e){} try{out.disconnect();}catch(e){} },
  };
}
// 水配方。参数 = {density,pitch,turb,tone,wet,vol}
const WATER_PRESETS = {
  'stream-bed  溪流':      { density:48, pitch:1100, turb:0.7,  tone:5500, wet:0.18, vol:0.7 },  // 族3,水流大而焦急
  'brook  潺潺小溪':       { density:32, pitch:1400, turb:0.45, tone:6500, wet:0.22, vol:0.66 }, // 细亮
  'drip-eave  滴水·屋檐':  { density:0.9,pitch:900,  turb:0.03, tone:4000, wet:0.28, vol:0.62 }, // 族1,慢慢一滴滴
  'drip-cave  岩缝·滴水':  { density:0.4,pitch:700,  turb:0,    tone:3200, wet:0.5,  vol:0.6 },  // 极疏+大混响
};

// ============================================================
// 寺钟木鱼 BELL = Farnell 加法合成。一组非谐部分音(各自 amp/decay)+ 敲击瞬态噪声。
//   寺钟=多分音·长衰减;木鱼=少分音·极短衰减·木质。
// ============================================================
const BELL_TYPES = {
  // 经典钟的非谐比率(minor-third bell);高分音衰减更快
  bell:     { ratios:[0.56,0.92,1.19,1.71,2.00,2.74,3.00,3.76], amps:[1,0.67,0.9,0.5,0.4,0.32,0.28,0.18], decay:3.4, click:0.12, clickHP:1.2 },
  // 木鱼:主频 + 少量非谐上分音,衰减极短,敲击"笃"瞬态强
  woodfish: { ratios:[1.0,2.66,4.13],                          amps:[1,0.30,0.14],                        decay:0.16, click:0.5,  clickHP:0.7 },
};
function buildBell(p){
  const out=ctx.createGain(); out.gain.value=p.vol;
  const sn=shortNoiseBuf();
  const live={ type:p.type, pitch:p.pitch, interval:p.interval };
  let scope=new Float32Array(300), si=0, flash=0, stopped=false, timer=null;

  function strike(){
    const cfg=BELL_TYPES[live.type], t=ctx.currentTime+0.01;
    // 真人手感:每击整体音高小幅变化(敲不同位置,±Hz) + 力度有轻有重
    const jitHz = live.type==='woodfish' ? 10 : 12;      // 上下总幅度~20Hz(不超25),几乎同一个音只留生命感
    const f0 = live.pitch + (Math.random()*2-1)*jitHz;
    const vel = 0.5 + Math.random()*0.5;               // 力度 0.5~1.0
    const sum=ctx.createGain(); sum.gain.value=0.5;
    if(p.spatial){ const pn=p.spatial(); sum.connect(pn).connect(out);   // 逐击HRTF方位
      setTimeout(()=>{ try{pn.disconnect();sum.disconnect();}catch(e){} },(cfg.decay+0.2)*1000); }
    else sum.connect(out);
    cfg.ratios.forEach((r,i)=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f0*r*(0.999+Math.random()*0.002);
      const dec=cfg.decay*(0.35+0.65*cfg.amps[i])*(0.85+Math.random()*0.3);  // 衰减也略抖
      const g=ctx.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(cfg.amps[i]*vel, t+0.004);         // 力度乘进每分音
      g.gain.exponentialRampToValueAtTime(0.0001, t+dec);
      o.connect(g).connect(sum); o.start(t); o.stop(t+dec+0.05);
    });
    // 敲击瞬态:极短噪声 click(木鱼"笃"感),力度越大越响
    const nb=ctx.createBufferSource(); nb.buffer=sn;
    const hp=bq('highpass',f0*cfg.clickHP,0.7);
    const ng=ctx.createGain(); ng.gain.setValueAtTime(cfg.click*vel,t); ng.gain.exponentialRampToValueAtTime(0.0004,t+0.03);
    nb.connect(hp).connect(ng).connect(sum); nb.start(t); nb.stop(t+0.05);
    flash=Math.max(0.2,vel);                            // 可视化竖线高低=力度
  }
  function schedule(){
    if(stopped) return;
    const cfg=BELL_TYPES[live.type];
    const jit = live.type==='woodfish' ? 0.18 : 0.5;    // 木鱼:有快有慢(真人手感,不再复制粘贴);寺钟随机稀疏
    const iv = live.interval*(1 + (Math.random()*2-1)*jit);
    timer=setTimeout(()=>{ if(!stopped){ strike(); schedule(); } }, Math.max(0.1,iv)*1000);
  }
  schedule();
  const tick=setInterval(()=>{ scope[si++%300]=flash; flash*=0.5; }, 60);

  return {
    out, scope, get si(){ return si; }, strike,
    set type(v){ live.type=v; }, set pitch(v){ live.pitch=v; }, set interval(v){ live.interval=v; },
    set vol(v){ out.gain.setTargetAtTime(v,ctx.currentTime,0.1); },
    stop(){ stopped=true; clearTimeout(timer); clearInterval(tick); try{out.disconnect();}catch(e){} },
  };
}
// 钟配方。参数 = {type,pitch,interval,wet,vol}
const BELL_PRESETS = {
  'woodblock  木鱼·诵经(稳)':{ type:'woodfish', pitch:700, interval:1.0, wet:0.15, vol:0.68 }, // ~60BPM 中稳,专注锚
  'woodblock-slow  木鱼·慢(松)':{ type:'woodfish', pitch:600, interval:2.0, wet:0.22, vol:0.66 }, // ~30BPM 放松/低唤醒
  'bell-1min  寺钟·每1分':  { type:'bell', pitch:300, interval:60,  wet:0.5,  vol:0.6 },  // myNoise式频率选择:钟声警醒→低频出现
  'bell-3min  寺钟·每3分':  { type:'bell', pitch:280, interval:180, wet:0.55, vol:0.6 },  // 族2b,更稀
  'bell-5min  寺钟·每5分':  { type:'bell', pitch:260, interval:300, wet:0.55, vol:0.6 },  // 极稀,几乎不打扰
};

// ============================================================
// 摩擦/沙沙 = 连续带限噪声 + 第二路噪声低通做中速振幅调制(摩擦纹理),不是离散颗粒点。
//   树叶=持续+慢阵起伏;踩沙/笔尖=每"下"一段连续摩擦噪声(attack-decay)。改编 Farnell 噪声调制噪声。
// ============================================================
function buildGranular(p){
  const out=ctx.createGain(); out.gain.value=0;
  out.gain.setTargetAtTime(p.vol||0.6, ctx.currentTime, 0.4);
  const nb1=noiseLoopBuf(), nb2=noiseLoopBuf();
  let scope=new Float32Array(300), si=0, flash=0, stopped=false, timer=null, tickT=null;
  const live={ density:p.density };

  if(p.mode==='sustain'){                                  // 树叶:持续摩擦噪声 + 慢阵起伏
    const src=ctx.createBufferSource(); src.buffer=nb1; src.loop=true;
    const hp=bq('highpass',p.fmin,0.7), lp=bq('lowpass',p.fmax,0.7);
    const shape=ctx.createGain(); shape.gain.value=p.base;
    src.connect(hp).connect(lp).connect(shape).connect(out); src.start(0,Math.random()*nb1.duration);
    const m=ctx.createBufferSource(); m.buffer=nb2; m.loop=true;      // 第二噪声→低通=摩擦纹理
    const mlp=bq('lowpass',p.rough,0.7); const md=ctx.createGain(); md.gain.value=p.depth*p.base;
    m.connect(mlp).connect(md).connect(shape.gain); m.start(0,Math.random()*nb2.duration);
    tickT=setInterval(()=>{ if(stopped)return; const t=ctx.currentTime;
      const lvl=p.base*(0.35+Math.random()*0.75);          // 风吹一阵沙沙一阵
      shape.gain.setTargetAtTime(lvl,t,0.4+Math.random()*0.8); md.gain.setTargetAtTime(p.depth*lvl,t,0.5);
      scope[si++%300]=Math.min(1,lvl*2.5+0.1);
    }, 300);
    return { out, scope, get si(){return si;}, set density(v){}, set vol(v){out.gain.setTargetAtTime(v,ctx.currentTime,0.1);},
      stop(){ stopped=true; clearInterval(tickT); try{src.stop();m.stop();}catch(e){} try{out.disconnect();}catch(e){} } };
  }

  function stroke(){                                        // 踩沙/笔尖:一"下"=一段连续摩擦噪声(非一串点)
    const t=ctx.currentTime, len=p.smin+Math.random()*(p.smax-p.smin);
    const s=ctx.createBufferSource(); s.buffer=nb1; s.loop=true;
    const hp=bq('highpass',p.fmin*(0.9+Math.random()*0.2),0.7), lp=bq('lowpass',p.fmax,0.7);
    const gg=ctx.createGain(); const amp=p.amp*(0.55+Math.random()*0.5);
    gg.gain.setValueAtTime(0.0001,t);
    gg.gain.linearRampToValueAtTime(amp, t+len*0.35);        // 摩擦渐起
    gg.gain.linearRampToValueAtTime(0.0001, t+len);          // 渐落
    const m=ctx.createBufferSource(); m.buffer=nb2; m.loop=true;
    const mlp=bq('lowpass',p.rough,0.7); const md=ctx.createGain(); md.gain.value=p.depth*amp;
    m.connect(mlp).connect(md).connect(gg.gain);             // 段内摩擦纹理
    const pan=ctx.createStereoPanner(); pan.pan.value=Math.random()*1.2-0.6;
    s.connect(hp).connect(lp).connect(gg).connect(pan).connect(out);
    s.start(t,Math.random()*nb1.duration); s.stop(t+len+0.05); m.start(t); m.stop(t+len+0.05);
    flash=1;
  }
  function schedule(){ if(stopped)return; const d=live.density; if(d<=0){timer=setTimeout(schedule,200);return;}
    const iv=-Math.log(1-Math.random())/d;
    timer=setTimeout(()=>{ if(!stopped){ stroke(); schedule(); } }, iv*1000);
  }
  schedule();
  tickT=setInterval(()=>{ scope[si++%300]=flash; flash*=0.6; }, 60);
  return { out, scope, get si(){return si;}, set density(v){live.density=v;}, set vol(v){out.gain.setTargetAtTime(v,ctx.currentTime,0.1);},
    stop(){ stopped=true; clearTimeout(timer); clearInterval(tickT); try{out.disconnect();}catch(e){} } };
}
// 摩擦配方。sustain=持续(树叶);stroke=段触发(踩沙/笔尖,density=每秒几"下")。rough=摩擦起伏速率Hz
const GRANULAR_PRESETS = {
  'leaves  树叶窸窣':{ mode:'sustain', fmin:1800, fmax:6500, rough:55,  depth:0.8,  base:0.28,           vol:0.5, density:0 },
  'sand  踩沙·捏沙':{ mode:'stroke',  fmin:2200, fmax:8000, rough:150, depth:0.85, amp:0.7, smin:0.18, smax:0.45, density:1.4, vol:0.6 },
  'pen  笔尖沙沙':  { mode:'stroke',  fmin:3500, fmax:9500, rough:200, depth:0.9,  amp:0.6, smin:0.08, smax:0.22, density:2.2, vol:0.5 },
};

