// ============================================================================
// Sound States 声景引擎(可复用) —— 从 scene.html 抽出,与 DOM 解耦。
// 依赖 sound-engines.js 的全局:ctx, AC, bq, reverbIR, WIND/GLUE/WATER/BELL_PRESETS, buildWind/Glue/Water/Bell。
// 依赖 scene-config.js:SoundscapeConfig。
// 用法:
//   const eng = createSceneEngine(SoundscapeConfig, {
//     onState(t){}, onArc(t){}, onHR(bpm){}, onLayerVol(L,v){}, onParam(id,v){} });
//   await eng.ensureRunning(); eng.applyPreset('sleep'); eng.setParam('glue',0.9); eng.stop();
// 全局旋钮(radius/reverb/tone/vol/glue)由引擎内部 P 持有;宿主 UI 通过 setParam 改、onParam 回显。
// ============================================================================
function createSceneEngine(cfg, hooks){
  let anl=null;   // 输出旁路分析器(start 时创建)
  hooks = hooks || {};
  const { SCENES, HILLS_VARIANTS, MIX } = cfg;
  const P = { radius:1.3, reverb:0.9, tone:7000, vol:0.85, glue:0.9 };   // 全局旋钮内部状态(默认=原调音台滑块默认)
  let resting = 70;   // 静息基线(个人)默认占位=70(典型静息):以你自己的安静心率为 0 唤醒点;宿主可用 setResting 改 / resting baseline placeholder 70, override via setResting
  let curScene='hills', curPhase='night';
  let bus, masterLP, conv, convOut, outGain, glueComp, glueMakeup, running=false, runtime=[];
  const aiBuffers={}, groupBusyUntil={};
  let arcTimer=null, hrTimer=null, hrT0=0, breatheTimer=null, breatheOn=true;

  function initLayerState(layers){ layers.forEach(L=>{ L._on=!L.placeholder; L._vol=(L.vol!=null?L.vol:0.7);
    if(L.ivMin!=null){ L._ivMin0=L.ivMin; L._ivMax0=L.ivMax; } }); }
  SCENES.hills.layers = HILLS_VARIANTS.night;                 // 默认黑夜
  Object.values(SCENES).forEach(S=>initLayerState(S.layers));
  initLayerState(HILLS_VARIANTS.day);

  function makeEngine(key, name, extra){
    extra=extra||{};
    if(key==='wind'){ const p=WIND_PRESETS[name];  return buildWind({ base:p.base, gustAmt:p.gust, q:p.q, tone:p.tone, vol:p.vol }); }
    if(key==='glue'){ const p=GLUE_PRESETS[name];  return buildGlue({ color:p.color, level:p.level, tone:p.tone, drift:p.drift }); }
    if(key==='drip'){ const p=WATER_PRESETS[name]; return buildWater({ density:p.density, pitch:p.pitch, turb:p.turb, tone:p.tone, vol:p.vol, spatial:extra.spatial }); }
    if(key==='woodfish'||key==='bell'){ const p=BELL_PRESETS[name]; return buildBell({ type:p.type, pitch:p.pitch, interval:p.interval, vol:p.vol, spatial:extra.spatial }); }
  }

  // 每层 EQ:频段错峰(临界带掩蔽=同频段会糊)
  const LAYER_EQ = {
    glue:  { lp:9000 },
    wind:  { hp:170 },
    drip:  { hp:450 },
    'ai:rainbed': { hp:110 },
    'ai:rainwin': { hp:110, lp:1200 },
    'ai:raindrip':{ hp:200, lp:900 },
    'ai:fire':   { hp:50,  lp:6500 },
    'ai:insect': { hp:900 },
    'ai:stream': { hp:240, lp:9500 },
    'ai:owl':    { hp:150 },
    'ai:gull':   { hp:400 },
  };
  function buildEQ(key){ const c=LAYER_EQ[key]; if(!c) return null; const nodes=[];
    if(c.hp) nodes.push(bq('highpass',c.hp,0.7));
    if(c.lp) nodes.push(bq('lowpass',c.lp,0.7));
    if(c.peak) nodes.push(bq('peaking',c.peak[0],c.peak[2]||1,c.peak[1]));
    if(!nodes.length) return null;
    for(let i=0;i<nodes.length-1;i++) nodes[i].connect(nodes[i+1]);
    return { in:nodes[0], out:nodes[nodes.length-1] };
  }

  // ---- AI 素材加载 ----
  async function loadAI(){
    const files=new Set();
    SCENES[curScene].layers.forEach(L=>{ if(L.placeholder||!L._on||L.key.indexOf('ai:')!==0) return;
      (L.files||[]).forEach(f=>files.add(f)); if(L.file) files.add(L.file); });
    for(const f of files){ if(aiBuffers[f]) continue;
      const r=await fetch(f); const ab=await r.arrayBuffer(); aiBuffers[f]=await ctx.decodeAudioData(ab); }
  }
  function aiBed(L,g){ const list=[];
    (L.files||[]).forEach((f,i)=>{ const b=aiBuffers[f]; if(!b) return;
      const src=ctx.createBufferSource(); src.buffer=b; src.loop=true;
      if((L.files||[]).length>1) src.playbackRate.value=1+(i-(L.files.length-1)/2)*0.025;
      const p=mkPanner(); const pos=(L.pos&&L.pos[i])||{ang:L.ang||0,dist:L.dist||1.5}; p._ang=pos.ang; p._dist=pos.dist; setPos(p);
      src.connect(p).connect(g); src.start(0, Math.random()*b.duration); list.push({src,p}); });
    return { panners:list.map(x=>x.p), stop(){ list.forEach(x=>{try{x.src.stop();}catch(e){}}); } };
  }
  function aiEvt(L,g){ let timer=null, stopped=false;
    function fire(){ const f=(L.files&&L.files.length)?L.files[(Math.random()*L.files.length)|0]:L.file;
      const b=aiBuffers[f]; if(!b) return;
      if(L.group){ const now=ctx.currentTime; if(now<(groupBusyUntil[L.group]||0)) return; groupBusyUntil[L.group]=now+(L.groupGap||1.6); }
      const src=ctx.createBufferSource(); src.buffer=b;
      const base=(L.rate!=null?L.rate:1);
      const rate=base*(1+(Math.random()*2-1)*(L.pitchJit!=null?L.pitchJit:0.05)); src.playbackRate.value=rate;
      let node=src;
      if(L.lp){ const lp=bq('lowpass',L.lp); src.connect(lp); node=lp; }
      const eg=ctx.createGain(); const vel=0.72+Math.random()*0.28;
      const p=mkPanner(); p._ang=(L.ang||0)+(Math.random()*2-1)*(L.spread||0.5); p._dist=(L.dist||2)*(0.85+Math.random()*0.3); setPos(p);
      node.connect(eg).connect(p).connect(g);
      const t=ctx.currentTime;
      if(L.slice){
        const bd=L.slice[0]+Math.random()*(L.slice[1]-L.slice[0]), off=Math.random()*Math.max(0.01,b.duration-bd), od=bd/rate;
        eg.gain.setValueAtTime(0,t); eg.gain.linearRampToValueAtTime(vel,t+0.015);
        eg.gain.setValueAtTime(vel,t+Math.max(0.03,od-0.06)); eg.gain.linearRampToValueAtTime(0,t+od);
        src.start(t,off,bd); src.stop(t+od+0.03);
      } else { eg.gain.value=vel; src.start(); src.stop(t+b.duration/rate+0.05); }
      src.onended=()=>{try{p.disconnect();eg.disconnect();}catch(e){}};
    }
    function sched(){ if(stopped) return; const iv=(L.ivMin||10)+Math.random()*((L.ivMax||20)-(L.ivMin||10));
      timer=setTimeout(()=>{ if(!stopped){ fire(); sched(); } }, iv*1000); }
    sched();
    return { stop(){ stopped=true; clearTimeout(timer); } };
  }

  function mkPanner(){ const p=ctx.createPanner(); p.panningModel='HRTF'; p.distanceModel='inverse'; p.refDistance=1; p.maxDistance=30; p.rolloffFactor=1.1; return p; }
  function setPos(p){ const r=P.radius*p._dist, x=Math.sin(p._ang)*r, z=-Math.cos(p._ang)*r;
    if(p.positionX){ p.positionX.value=x; p.positionY.value=0; p.positionZ.value=z; } else p.setPosition(x,0,z); }
  function voiceFactory(L){ return ()=>{ const p=mkPanner();
    p._ang=L.ang+(Math.random()*2-1)*(L.spread||0.3); p._dist=(L.dist||1)*(0.85+Math.random()*0.3); setPos(p); return p; }; }

  function start(){
    if(running) return; AC(); if(ctx.state==='suspended') ctx.resume();
    bus=ctx.createGain();
    conv=ctx.createConvolver(); conv.buffer=reverbIR(2.8);
    convOut=ctx.createGain(); convOut.gain.value=P.reverb;
    conv.connect(convOut).connect(bus);
    masterLP=bq('lowpass',P.tone);
    glueComp=ctx.createDynamicsCompressor(); glueMakeup=ctx.createGain();
    outGain=ctx.createGain(); outGain.gain.value=P.vol;
    const hp=bq('highpass',28), lim=ctx.createDynamicsCompressor();
    lim.threshold.value=-1.5; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=0.003; lim.release.value=0.25;
    bus.connect(masterLP).connect(glueComp).connect(glueMakeup).connect(outGain).connect(hp).connect(lim).connect(ctx.destination);
    anl=ctx.createAnalyser(); anl.fftSize=256; anl.smoothingTimeConstant=0.6; lim.connect(anl);   // 旁路分析器:只读不改声音,供「实时声音肖像」
    setGlue(P.glue);

    runtime=[];
    SCENES[curScene].layers.forEach(L=>{
      if(L.placeholder || !L._on) return;
      const g=ctx.createGain(); g.gain.value=L._vol;
      let stopFn=()=>{}, panner=null, panners=null, instRef=null; const base={};
      if(L.key.indexOf('ai:')===0){
        if(L.kind==='bed'){ const r=aiBed(L,g); stopFn=r.stop; panners=r.panners; }
        else { const r=aiEvt(L,g); stopFn=r.stop; base.ivMin=L._ivMin0; base.ivMax=L._ivMax0; }
      } else {
        let inst;
        if(L.perEvent){ inst=makeEngine(L.key,L.preset,{spatial:voiceFactory(L)}); inst.out.connect(g); }
        else if(L.ambient){ inst=makeEngine(L.key,L.preset); inst.out.connect(g); }
        else { inst=makeEngine(L.key,L.preset); panner=mkPanner(); panner._ang=L.ang; panner._dist=L.dist; setPos(panner); inst.out.connect(panner).connect(g); }
        instRef=inst; stopFn=()=>{ try{ inst.stop(); }catch(e){} };
        if(L.key==='drip') base.density=WATER_PRESETS[L.preset].density;
        if(L.key==='bell'||L.key==='woodfish') base.interval=BELL_PRESETS[L.preset].interval;
      }
      let tail=g; const eq=buildEQ(L.key); if(eq){ g.connect(eq.in); tail=eq.out; }
      tail.connect(bus);
      if(L.send){ const s=ctx.createGain(); s.gain.value=L.send; tail.connect(s).connect(conv); }
      runtime.push({ L, g, panner, panners, stop:stopFn, inst:instRef, base });
    });
    running=true; if(hooks.onState) hooks.onState('● 运行中（戴耳机）'); if(breatheOn) startBreathe(); if(hooks.onStart) hooks.onStart();
  }
  // 呼吸开关:自动=每层在 range 内缓慢渐强渐弱;手动=停呼吸,各层固定到当前 _vol(滑块听你的)
  function setBreathe(on){ breatheOn = on;
    if (!running) return;
    if (on) startBreathe();
    else { stopBreathe(); runtime.forEach(r=>{ if (r.L.range && r.g) r.g.gain.setTargetAtTime(r.L._vol, ctx.currentTime, 0.3); }); }
  }
  function stop(){
    running=false; stopBreathe();
    runtime.forEach(r=>{ try{ r.stop(); }catch(e){} });
    if(bus) try{ bus.disconnect(); }catch(e){}
    runtime=[]; if(hooks.onState) hooks.onState('已停止');
  }
  async function restart(){ if(running){ stop(); await loadAI(); start(); } }
  async function ensureRunning(){ if(running) return;
    try{ AC(); if(ctx.state==='suspended') await ctx.resume();
      if(hooks.onState) hooks.onState('加载 AI 素材…'); await loadAI(); start(); }
    catch(e){ console.error('[SceneEngine] 启动失败:', e); if(hooks.onState) hooks.onState('出错: '+(e&&e.message||e)); }
  }

  function applyG(id){ if(!running) return; const t=ctx.currentTime;
    if(id==='radius') runtime.forEach(r=>{ if(r.panner)setPos(r.panner); if(r.panners)r.panners.forEach(setPos); });
    if(id==='reverb' && convOut) convOut.gain.setTargetAtTime(P.reverb,t,0.1);
    if(id==='tone' && masterLP) masterLP.frequency.setTargetAtTime(P.tone,t,0.1);
    if(id==='vol' && outGain) outGain.gain.setTargetAtTime(P.vol,t,0.1);
  }
  function setParam(id,v){ v=+v; P[id]=v; if(id==='glue') setGlue(v); else applyG(id); if(hooks.onParam) hooks.onParam(id,v); }
  function setGlue(a){ P.glue=a; if(!glueComp) return; const t=ctx.currentTime;
    if(a<=0){ glueComp.threshold.setValueAtTime(0,t); glueComp.ratio.setValueAtTime(1,t); glueComp.knee.setValueAtTime(0,t); glueMakeup.gain.setTargetAtTime(1,t,0.1); }
    else { glueComp.threshold.setValueAtTime(-6-a*22,t); glueComp.ratio.setValueAtTime(1.5+a*1.5,t); glueComp.knee.setValueAtTime(30,t);
      glueComp.attack.setValueAtTime(0.03,t); glueComp.release.setValueAtTime(0.25,t); glueMakeup.gain.setTargetAtTime(1+a*0.18,t,0.1); }
  }

  function stopArc(){ if(arcTimer){ clearInterval(arcTimer); arcTimer=null; } }
  function applyRate(rate){
    runtime.forEach(r=>{ const L=r.L;
      if(r.inst){ if(L.key==='drip' && r.base.density!=null) r.inst.density=r.base.density*rate;
                  if((L.key==='bell'||L.key==='woodfish') && r.base.interval!=null) r.inst.interval=r.base.interval/rate; }
      else if(L.kind==='evt' && r.base.ivMin!=null){ L.ivMin=r.base.ivMin/rate; L.ivMax=r.base.ivMax/rate; } });
    if(hooks.onParam) hooks.onParam('rate', rate);   // 回写「活跃度」滑条(心率/预设/下行弧改事件密度时也让 UI 跟上)
  }
  function setLayerVol(L,v){ L._vol=v;
    if(running){ const r=runtime.find(r=>r.L===L); if(r) r.g.gain.setTargetAtTime(v,ctx.currentTime,0.4); }
    if(hooks.onLayerVol) hooks.onLayerVol(L,v);
  }
  function mixOf(mode){ return (MIX[curScene]||{})[mode]||{}; }
  function applyMixLayers(mode){ const m=mixOf(mode).layers; if(!m) return;
    SCENES[curScene].layers.forEach(L=>{ if(L.range) return; if(m[L.key]!=null) setLayerVol(L,m[L.key]); }); }

  // 每层缓慢"呼吸":gain 在 range[min,max] 内很慢渐强渐弱
  function stopBreathe(){ if(breatheTimer){ clearInterval(breatheTimer); breatheTimer=null; } }
  function startBreathe(){ stopBreathe(); const t0=performance.now();
    runtime.forEach(r=>{ const rg=r.L.range; if(!rg) return; r._bT=rg[0]+Math.random()*(rg[1]-rg[0]); r._bNext=t0+Math.random()*8000; });
    breatheTimer=setInterval(()=>{ if(!running){ stopBreathe(); return; } const now=performance.now();
      runtime.forEach(r=>{ const rg=r.L.range; if(!rg||!r.g) return;
        if(now>=r._bNext){ r._bT=rg[0]+Math.random()*(rg[1]-rg[0]); r._bNext=now+(6000+Math.random()*8000); }
        r.g.gain.setTargetAtTime(r._bT, ctx.currentTime, 3.0);
        if(hooks.onLayerVol) hooks.onLayerVol(r.L, r.g.gain.value);
      });
    }, 400);
  }

  function applyPreset(mode){ mode==='work'?applyWork():applySleep(); }
  function applyWork(){ stopArc(); applyMixLayers('work'); const g=mixOf('work').g||{};
    setParam('tone',g.tone??8000); setParam('radius',g.radius??1.2); setParam('reverb',g.reverb??0.6); if(g.vol!=null)setParam('vol',g.vol);
    applyRate(1); if(hooks.onArc) hooks.onArc('工作：恒定平台(稳态·去突起)'); }
  function applySleep(){ stopArc(); applyMixLayers('sleep'); const g=mixOf('sleep').g||{};
    if(g.vol!=null) setParam('vol',g.vol);
    const dur=120, t0=performance.now();
    const s0={ tone:P.tone, radius:P.radius, reverb:P.reverb };
    const s1={ tone:g.tone??2600, radius:g.radius??2.2, reverb:g.reverb??1.05 };
    arcTimer=setInterval(()=>{ if(!running){ stopArc(); return; }
      const p=Math.min(1,(performance.now()-t0)/1000/dur), e=p*p*(3-2*p);
      setParam('tone',Math.round(s0.tone+(s1.tone-s0.tone)*e));
      setParam('radius',+(s0.radius+(s1.radius-s0.radius)*e).toFixed(2));
      setParam('reverb',+(s0.reverb+(s1.reverb-s0.reverb)*e).toFixed(2));
      applyRate(1-0.62*e);
      if(hooks.onArc) hooks.onArc('睡眠下行 '+Math.round(p*100)+'%');
      if(p>=1) stopArc();
    },500);
  }

  // ---- 心率:sleep/work 模拟 或 manual(getManual 回调) 或 外部真实心率(hrDrive) ----
  function stopHR(){ if(hrTimer){ clearInterval(hrTimer); hrTimer=null; } }
  function simHR(mode,t,getManual){
    const rsa=v=>v*Math.sin(2*Math.PI*0.22*t);
    if(mode==='sleep'){ const p=Math.min(1,t/180), e=p*p*(3-2*p); return 68+(50-68)*e + rsa(3) + (Math.random()-0.5)*2; }
    if(mode==='work'){ return 72 + 4*Math.sin(2*Math.PI*0.02*t) + rsa(2) + (Math.random()-0.5)*3; }
    return ((getManual?getManual():70)) + rsa(2) + (Math.random()-0.5)*1.5;
  }
  function hrDrive(hr){ const n=Math.max(0,Math.min(1,(hr-resting)/34));
    setParam('tone', Math.round(2600+n*5400));
    setParam('radius', +(2.3-n*0.95).toFixed(2));
    applyRate(0.4+n*0.65);
  }
  function startHR(mode, getManual){ stopArc(); stopHR(); hrT0=performance.now();
    if(hooks.onArc) hooks.onArc('');
    hrTimer=setInterval(()=>{ if(!running){ stopHR(); return; }
      const hr=simHR(mode,(performance.now()-hrT0)/1000,getManual);
      if(hooks.onHR) hooks.onHR(hr);
      hrDrive(hr);
    },300);
  }

  function setScene(k){ curScene=k; if(SCENES[k].phased) SCENES.hills.layers=HILLS_VARIANTS[curPhase]; }
  function setPhase(p){ curPhase=p; if(SCENES[curScene].phased) SCENES.hills.layers=HILLS_VARIANTS[p]; }

  return {
    ensureRunning, start, stop, restart, loadAI,
    setParam, getParam:id=>P[id], setGlue, setLayerVol,
    applyPreset, applyWork, applySleep, applyRate, setBreathe, getBreathe:()=>breatheOn,
    startHR, stopHR, stopArc, hrDrive,
    setResting: v => { resting = v; },
    setScene, setPhase,
    getScene:()=>curScene, getPhase:()=>curPhase, isPhased:()=>!!SCENES[curScene].phased,
    getLayers:()=>SCENES[curScene].layers, getRuntime:()=>runtime, isRunning:()=>running, getAnalyser:()=>anl,
    SCENES, HILLS_VARIANTS, MIX
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { createSceneEngine };
