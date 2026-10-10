
'use strict';
const canvas=document.getElementById('screen'),ctx=canvas.getContext('2d');
const depthFrame=window.ABGCreateBackdrop(document.getElementById('depth')).frame;
const UI={play:document.getElementById('toggle'),seek:document.getElementById('seek'),now:document.getElementById('now')};
const W=1080,H=1920,D=24,SEG=6,TAU=Math.PI*2;
const C={bg:'#111411',panel:'#191e1a',panel2:'#202722',edge:'#344139',white:'#f1f3e9',muted:'#9ea99e',green:'#c8f36b',mint:'#8ddab2',red:'#ff836f'};
let t=0,playing=false,raf=0,lastPaint=-1,zero=0,audio=null,musicOn=true,voices=[],master=null;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,p)=>a+(b-a)*p;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)},out=x=>1-Math.pow(1-clamp(x),3);
function text(s,x,y,size,color=C.white,weight=500,align='left',font='sans'){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.font=`${weight} ${size}px ${font==='mono'?'ui-monospace,Menlo,monospace':font==='serif'?'Georgia,serif':'Inter,-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'}`;ctx.fillText(s,x,y)}
function line(x1,y1,x2,y2,color=C.edge,width=2,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1}
function round(x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function circ(x,y,r,fill,stroke=null,lw=1){if(r<.1)return;ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function wrap(s,x,y,max,size,color,weight=500,step=1.32){const lines=[];let q='';for(const ch of s){if(ctx.measureText(q+ch).width>max&&q){lines.push(q);q=ch}else q+=ch}if(q)lines.push(q);lines.forEach((v,i)=>text(v,x,y+i*size*step,size,color,weight));return y+lines.length*size*step}
function background(scene,beat){ctx.clearRect(0,0,W,H);
 // The Three.js layer paints a continuous animated environment across the whole portrait frame.
 // This hairline grid only marks the copy-safe field; it remains a light foreground detail.
 ctx.save();for(let x=108;x<972;x+=48)line(x,190,x,1630,'#536252',1,.08);for(let y=190;y<1630;y+=48)line(108,y,972,y,'#536252',1,.08);ctx.restore();
}
const MOTION=window.ABGMotion;
function brand(){text('αβΓ✻1',540,270,42,C.white,700,'center');}
function progress(t){line(180,1580,900,1580,'#344139',3);line(180,1580,180+720*t/D,1580,C.green,5);}
function kinetic(str,u,start,size,y,color=C.white,mode='slam'){
 if(u<start)return;const age=u-start,p=MOTION.prog(u,start,start+.38,MOTION.ease.outExpo),settle=MOTION.springStep(age,3,.62);
 ctx.save();ctx.translate(540,y);const scale=mode==='slam'?1+.15*MOTION.pulse(u,start,.08):.62+.38*settle;ctx.scale(scale,scale);ctx.rotate(mode==='tilt'?(.09*(1-p)):0);ctx.font=`750 ${size}px "PingFang SC",sans-serif`;const fit=Math.min(1,758/Math.max(1,ctx.measureText(str).width));ctx.scale(fit,1);ctx.textAlign='center';ctx.textBaseline='middle';
 if(mode==='echo'){for(let i=3;i>0;i--){ctx.globalAlpha=.12*(1-p*.5);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.strokeText(str,0,-i*size*.13)}ctx.globalAlpha=1;}
 ctx.globalAlpha=Math.min(1,.2+p);ctx.fillStyle=color;ctx.fillText(str,0,(1-p)*45);ctx.restore();
}
function assemble(str,u,start,size,y,color=C.white){ctx.font=`750 ${size}px "PingFang SC",sans-serif`;const n=[...str],width=n.reduce((sum,ch)=>sum+ctx.measureText(ch).width,0),fit=Math.min(1,740/width);ctx.save();ctx.translate(540,y);ctx.scale(fit,1);let x=-width/2;n.forEach((ch,i)=>{const w=ctx.measureText(ch).width,p=MOTION.prog(u,start+i*.085,start+i*.085+.45,MOTION.ease.outBack);ctx.save();ctx.translate(x+w/2,(1-p)*(i%2?110:-110));ctx.rotate((1-p)*(i%2?.3:-.3));ctx.globalAlpha=clamp(p);text(ch,0,0,size,color,750,'center');ctx.restore();x+=w});ctx.restore()}
function footer(a,b=''){text(a,540,1420,42,C.white,650,'center');if(b)text(b,540,1480,31,C.muted,500,'center')}
function scene0(u){brand();
 if(u<1.5){kinetic('市场',u,0,175,720,C.white,'echo');kinetic('时间',u,.5,175,960,C.green,'slam');text('从一场事件，到一个计划',540,1280,42,C.muted,500,'center');}
 else{const middle=u<3.5?'排好时间':'看见背景';assemble(middle,u,u<3.5?1.5:3.5,108,520,C.white);text('市场日历 · 到期 · 提醒',540,620,39,C.muted,500,'center');const p=MOTION.prog(u,1.6,2.6,MOTION.ease.outExpo);['事件','计划','复盘','到期'].forEach((v,i)=>{const x=225+i*210;ctx.save();ctx.globalAlpha=p;text(v,x,1290+Math.sin(u*1.5+i)*12,34,i===Math.floor(u*2)%4?C.green:C.white,600,'center');ctx.restore()});footer('把决策放回当时的条件');}
}
function scene1(u){if(u<1.5){const k=Math.min(2,Math.floor(u/.5));kinetic(['Δ','Γ','Θ'][k],u,k*.5,315,820,'#152319','echo');text('价格 · 时间 · 波动率',540,1170,47,'#294333',650,'center');text('STRUCTURE / DIMENSIONS',540,1390,29,'#54725b',600,'center','mono');}
 else if(u<4.5){brand();assemble('结构',u,1.5,116,480,C.white);kinetic('在三维中变化',u,1.8,65,600,C.green,'tilt');text('价格',214,1290,37,C.white,650,'center');text('时间',540,1320,37,C.white,650,'center');text('波动率',850,1290,37,C.white,650,'center');footer('先理解结构，再承担风险','动画为结构示意，不代表真实收益');}
 else{kinetic('看清',u,4.5,166,760,C.white,'echo');kinetic('风险',u,5,166,995,C.green,'slam');text('MODEL BEFORE RISK',540,1390,30,C.muted,550,'center','mono');}}
function scene2(u){brand();if(u<2){kinetic('当时',u,0,118,475,C.white,'slam');kinetic('为何这样判断？',u,.5,72,600,C.green,'tilt');footer('留下假设，也留下背景');}
 else if(u<4.5){assemble('回看判断',u,2,100,510,C.white);text('假设  →  记录  →  复盘',540,650,41,C.green,600,'center');footer('让一次记录，连接下一次思考');}
 else if(u<5.1){kinetic('复盘',u,4.5,184,880,'#152319','echo');text('不只看结果',540,1190,48,'#294333',650,'center');}
 else{kinetic('知识',u,5.1,184,880,C.green,'echo');text('可查 · 可解释 · 可复用',540,1250,44,C.white,650,'center');}}
function scene3(u){if(u<1.5){kinetic('αβΓ✻1',u,0,148,700,C.white,'echo');assemble('每次决策',u,.5,110,1000,C.green);text('都有迹可循',540,1320,47,C.white,650,'center');}
 else if(u<3.5){kinetic('30',u,1.5,370,855,'#152319','slam');text('天完整体验',540,1170,58,'#294333',700,'center');text('免费开始 · 无需信用卡',540,1350,40,'#54725b',600,'center');}
 else{brand();kinetic('每一次决策',u,3.5,84,540,C.white,'echo');kinetic('都有迹可循。',u,3.75,85,670,C.green);round(160,1000,760,126,22,C.green);text('getabg.one  →',540,1080,51,'#111810',750,'center');text('免费 30 天完整体验',540,1240,44,C.white,650,'center');text('无需绑定信用卡',540,1310,36,C.muted,500,'center');text('用于复盘与风险理解',540,1450,32,C.white,550,'center');text('不提供交易信号、执行或投资建议',540,1500,30,C.muted,500,'center');}}
function render(sec){t=clamp(sec,0,D);const s=Math.min(3,Math.floor(t/SEG)),u=t-s*SEG;depthFrame(t,s);ctx.clearRect(0,0,W,H);if((s===1&&u<1.5)||(s===3&&u>=1.5&&u<3.5)){ctx.fillStyle='#e8edda';ctx.fillRect(0,0,W,H);}if(s===2&&u>=4.5&&u<5.1){ctx.fillStyle=C.green;ctx.fillRect(0,0,W,H);}ctx.save();ctx.beginPath();ctx.rect(108,190,864,1440);ctx.clip();[scene0,scene1,scene2,scene3][s](u);ctx.restore();progress(t);return s;}
const CHORDS=[[146.83,174.61,220,293.66],[116.54,146.83,174.61,233.08],[130.81,174.61,220,261.63],[130.81,164.81,196,261.63]];
const ROOTS=[73.42,58.27,87.31,65.41];
let noise=null,comp=null,musicGeneration=0;
function voice(source,gain,at,end){source.connect(gain);gain.connect(master);source.start(at);source.stop(end);voices.push({osc:source,gain,end});}
function synth(hz,at,dur,level,type='triangle',cutoff=1700){const o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(hz,at);f.type='lowpass';f.frequency.setValueAtTime(cutoff,at);f.Q.value=.7;o.connect(f);f.connect(g);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(level,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+dur);g.connect(master);o.start(at);o.stop(at+dur+.02);voices.push({osc:o,gain:g,end:at+dur+.02});}
function kick(at){const o=audio.createOscillator(),g=audio.createGain();o.frequency.setValueAtTime(155,at);o.frequency.exponentialRampToValueAtTime(46,at+.10);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.70,at+.003);g.gain.exponentialRampToValueAtTime(.0001,at+.29);voice(o,g,at,at+.31)}
function percussion(at,snare=false){const n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();n.buffer=noise;f.type=snare?'bandpass':'highpass';f.frequency.value=snare?1900:7800;f.Q.value=snare?.7:.4;n.connect(f);f.connect(g);g.gain.setValueAtTime(snare?.25:.09,at);g.gain.exponentialRampToValueAtTime(.0001,at+(snare?.15:.045));g.connect(master);n.start(at);n.stop(at+.20);voices.push({osc:n,gain:g,end:at+.20});}
async function startMusic(offset){const generation=++musicGeneration;if(!musicOn)return;if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();master=audio.createGain();comp=audio.createDynamicsCompressor();comp.threshold.value=-15;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.16;master.gain.value=Number(document.getElementById('volume').value)/100*.8;master.connect(comp);comp.connect(audio.destination);noise=audio.createBuffer(1,audio.sampleRate*.25,audio.sampleRate);const a=noise.getChannelData(0);let seed=71;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1;}}await audio.resume();if(generation!==musicGeneration||!musicOn||!playing)return;stopVoices();const base=audio.currentTime+.025;
 for(let i=0;i<96;i++){const event=i*.25;if(event<offset-.001)continue;const at=base+event-offset,section=Math.min(3,Math.floor(event/6));if(i%2===0){kick(at);synth(ROOTS[section],at+.07,.25,.25,'sawtooth',380);if(i%4===2)percussion(at+.005,true);}percussion(at+.125);if(i%2===1){const chord=CHORDS[section],hz=chord[(Math.floor(i/2)*3)%4]*2;synth(hz,at,.17,.075,'triangle',2600)}if(i%8===0)CHORDS[section].forEach(hz=>synth(hz,at,1.45,.038,'triangle',1100));}
}
function stopVoices(){if(!audio)return;const now=audio.currentTime;voices.forEach(v=>{try{v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(.0001,now,.025);v.osc.stop(now+.16)}catch{}});voices=[]}
function stopMusic(){musicGeneration++;if(audio){stopVoices();audio.suspend()}}
function update(){const s=render(t);UI.seek.value=t;UI.now.textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;document.querySelectorAll('[data-jump]').forEach(b=>b.classList.toggle('active',Number(b.dataset.jump)===s));}
function paint(now){if(!playing)return;t=(now-zero)/1000;if(t>=D){t=D;playing=false;stopMusic();UI.play.textContent='▶　播放';update();raf=0;return}if(now-lastPaint>1000/30){update();lastPaint=now}raf=requestAnimationFrame(paint)}
async function toggle(){if(playing){t=clamp((performance.now()-zero)/1000,0,D);playing=false;cancelAnimationFrame(raf);raf=0;UI.play.textContent='▶　播放';stopMusic();update()}else{if(t>=D)t=0;playing=true;zero=performance.now()-t*1000;lastPaint=0;UI.play.textContent='Ⅱ　暂停';if(musicOn)await startMusic(t);raf=requestAnimationFrame(paint)}}
function seek(sec){t=clamp(sec,0,D);if(playing){zero=performance.now()-t*1000;if(musicOn)startMusic(t)}update()}
UI.play.addEventListener('click',toggle);UI.seek.addEventListener('input',e=>seek(+e.target.value));document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.jump)*SEG)));
document.getElementById('music').addEventListener('click',async e=>{musicOn=!musicOn;e.currentTarget.setAttribute('aria-pressed',String(musicOn));e.currentTarget.textContent=musicOn?'♪　音乐：开':'♪　音乐：关';if(playing){if(musicOn)await startMusic(t);else stopMusic()}});
document.getElementById('volume').addEventListener('input',e=>{if(master)master.gain.setTargetAtTime(Number(e.target.value)/100*.8,audio.currentTime,.04)});
document.getElementById('safe').addEventListener('click',()=>{document.body.classList.toggle('show-safe');document.getElementById('safe').textContent=document.body.classList.contains('show-safe')?'隐藏安全区':'显示安全区'});
document.getElementById('fullscreen').addEventListener('click',async()=>{document.body.classList.add('clean');if(document.documentElement.requestFullscreen)try{await document.documentElement.requestFullscreen()}catch{};if(!playing)toggle()});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('clean')});
document.addEventListener('keydown',e=>{if(e.target.matches('input,button,textarea,select')&&e.code!=='Space')return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.key==='ArrowRight')seek(t+1);else if(e.key==='ArrowLeft')seek(t-1);else if(e.key===']')seek(Math.min(18,(Math.floor(t/SEG)+1)*SEG));else if(e.key==='[')seek(Math.max(0,(Math.ceil(t/SEG)-1)*SEG));else if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean')});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)toggle()});
render(0);
