'use strict';
const canvas=document.getElementById('screen'),ctx=canvas.getContext('2d');
const depthFrame=window.CrimCreateScene(document.getElementById('depth')).frame;
const W=1080,H=1920,D=34,TAU=Math.PI*2,CUTS=[0,4,8,12.5,17,24.5,28.5,34];
const C={white:'#f1f0e5',muted:'#9daeb7',green:'#ff3d55',mint:'#92e9ff',edge:'#35434c'};
const MOTION=window.CrimMotion;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const UI={play:document.getElementById('toggle'),seek:document.getElementById('seek'),now:document.getElementById('now')};
let t=0,playing=false,raf=0,lastPaint=-1,starting=false;
function text(s,x,y,size,color=C.white,weight=500,align='left',font='sans'){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.font=`${weight} ${size}px ${font==='mono'?'ui-monospace,Menlo,monospace':font==='serif'?'Georgia,serif':'Inter,-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'}`;ctx.fillText(s,x,y)}
function line(x1,y1,x2,y2,color=C.edge,width=2,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1}
function round(x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function circ(x,y,r,fill,stroke=null,lw=1){if(r<.1)return;ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function wrap(s,x,y,max,size,color,weight=500,step=1.32){const lines=[];let q='';for(const ch of s){if(ctx.measureText(q+ch).width>max&&q){lines.push(q);q=ch}else q+=ch}if(q)lines.push(q);lines.forEach((v,i)=>text(v,x,y+i*size*step,size,color,weight));return y+lines.length*size*step}
function kinetic(str,u,start,size,y,color=C.white,mode='slam'){
 if(u<start)return;const age=u-start,p=MOTION.prog(u,start,start+.38,MOTION.ease.outExpo),settle=MOTION.springStep(age,3,.62);
 ctx.save();ctx.translate(540,y);const scale=mode==='slam'?1+.15*MOTION.pulse(u,start,.08):.62+.38*settle;ctx.scale(scale,scale);ctx.rotate(mode==='tilt'?(.09*(1-p)):0);ctx.font=`750 ${size}px "PingFang SC",sans-serif`;const fit=Math.min(1,758/Math.max(1,ctx.measureText(str).width));ctx.scale(fit,1);ctx.textAlign='center';ctx.textBaseline='middle';
 if(mode==='echo'){for(let i=3;i>0;i--){ctx.globalAlpha=.12*(1-p*.5);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.strokeText(str,0,-i*size*.13)}ctx.globalAlpha=1;}
 ctx.globalAlpha=Math.min(1,.2+p);ctx.fillStyle=color;ctx.fillText(str,0,(1-p)*45);ctx.restore();
}
function assemble(str,u,start,size,y,color=C.white){ctx.font=`750 ${size}px "PingFang SC",sans-serif`;const n=[...str],width=n.reduce((sum,ch)=>sum+ctx.measureText(ch).width,0),fit=Math.min(1,740/width);ctx.save();ctx.translate(540,y);ctx.scale(fit,1);let x=-width/2;n.forEach((ch,i)=>{const w=ctx.measureText(ch).width,p=MOTION.prog(u,start+i*.085,start+i*.085+.45,MOTION.ease.outBack);ctx.save();ctx.translate(x+w/2,(1-p)*(i%2?110:-110));ctx.rotate((1-p)*(i%2?.3:-.3));ctx.globalAlpha=clamp(p);text(ch,0,0,size,color,750,'center');ctx.restore();x+=w});ctx.restore()}

function label(s,u){text(s,540,290,32,C.muted,650,'center','mono');line(220,335,860,335,C.edge,2);}
function note(a,b=''){text(a,540,1405,46,C.white,650,'center');if(b)text(b,540,1470,29,C.muted,550,'center','mono')}
function stamp(str,u,start,y){if(u<start)return;const p=MOTION.prog(u,start,start+.32,MOTION.ease.outExpo);ctx.save();ctx.translate(540,y);ctx.rotate(-.10*(1-p*.3));ctx.scale(1+.35*(1-p),1+.35*(1-p));ctx.globalAlpha=p;ctx.strokeStyle=C.green;ctx.lineWidth=6;ctx.strokeRect(-240,-73,480,146);text(str,0,28,82,C.green,800,'center');ctx.restore()}
function dossier(u){label('CASE / 079 — OPEN FILE',u);kinetic('079',u,0,250,575,C.white,'echo');if(u<2.1){assemble('案件编号',u,.45,74,775,C.green);note('现场，开始说话。','EVIDENCE / CHAIN OF CUSTODY')}else{kinetic('现场警戒',u,2.1,103,525,C.white,'slam');kinetic('物证封锁',u,2.9,99,690,C.green,'tilt');note('封锁现场 · 建立记录','01 / DOSSIER')}}
function uv(u){label('02 / ULTRAVIOLET',u);assemble('紫外光下',u,.12,106,530,C.mint);kinetic('微量物证',u,1.4,81,680,C.white,'echo');note(u<2.8?'潜藏的痕迹，逐渐显影。':'正在显影。','TRACE / REVEAL');const p=clamp(u/4);line(240,1310,840,1310,C.mint,2,.6);circ(240+600*p,1310,7,C.mint)}
function ballistics(u){label('03 / RECONSTRUCTION',u);const k=u<1.4?0:u<2.5?1:2;kinetic(['指纹回路','弹道膛线','重建轨迹'][k],u,[.05,1.4,2.5][k],104,530,k===1?C.green:C.white,'echo');text('TRACE → PATH → EVENT',540,685,30,C.muted,600,'center','mono');note(k===2?'从痕迹，反推发生。':'沿每一道线，追溯。','TRAJECTORY / SPATIAL MODEL')}
function locard(u){label('04 / LOCARD EXCHANGE',u);if(u<2.2){assemble('洛卡德',u,.1,126,530,C.white);text('物质交换定律',540,680,58,C.mint,650,'center');note('接触，让痕迹彼此转移。')}else{kinetic('每次接触',u,2.2,130,510,C.white,'tilt');kinetic('留下痕迹',u,3.1,106,685,C.green,'slam');note('每一次接触，都留下交换。')}}
function profiler(u){label('05 / BEHAVIOR & MOTIVE',u);if(u<4.4){const k=u<1.2?0:u<2.3?1:2;assemble(['行为侧写','动机解构','连接线索'][k],u,[.05,1.2,2.3][k],110,535,C.white);text('线索连接 / 假设重组',540,685,44,C.muted,600,'center');note('碎片之间，开始出现关系。')}else{kinetic('无声证据',u,4.4,106,510,C.white,'echo');assemble('拼出轮廓',u,5.5,108,690,C.green);note('散落的线索，聚成结构。','FRAGMENTS → CONNECTIONS → PROFILE')}}
function title(u){if(u<1.2){const k=u<.38?0:u<.76?1:2;kinetic(['犯','罪','学'][k],u,[0,.38,.76][k],365,860,C.white,'echo')}else{assemble('犯罪学',u,1.2,210,900,C.white);text('CRIMINOLOGY',540,1045,51,C.green,650,'center','mono');line(250,1155,830,1155,C.green,3);text('让证据，穿透沉默。',540,1270,50,C.white,650,'center');text('CASE 079 / TRUTH IN THE TRACE',540,1450,28,C.muted,600,'center','mono')}}
function archive(u){label('07 / ARCHIVE',u);assemble('真相',u,0,147,520,C.white);kinetic('永不泯灭',u,.35,97,700,C.white,'echo');stamp('结案',u,1.5,1050);stamp('归档',u,2.3,1260);if(u>3.7){const p=MOTION.prog(u,3.7,5.5,MOTION.ease.inOutCubic);ctx.fillStyle=`rgba(5,8,11,${p})`;ctx.fillRect(0,0,W,H)}}
const shots=[dossier,uv,ballistics,locard,profiler,title,archive];
function stage(sec){let i=0;while(i<6&&sec>=CUTS[i+1])i++;return i}
function optics(s,u){
 const reveal=MOTION.prog(u,.15,1.1,MOTION.ease.outExpo);ctx.save();ctx.translate(540,1030);ctx.rotate(s===2?u*.23:0);ctx.strokeStyle=s===1?C.mint:C.green;ctx.lineWidth=3;ctx.globalAlpha=.4;
 for(let i=0;i<4;i++){const angle=i*TAU/4,r=245+18*Math.sin(u*1.2);ctx.beginPath();ctx.arc(0,0,r,angle,angle+.35*reveal);ctx.stroke()}
 ctx.globalAlpha=.28;ctx.setLineDash([4,18]);ctx.beginPath();ctx.arc(0,0,280,0,TAU*reveal);ctx.stroke();ctx.restore();
 // A short iris reveal at each cut, rather than an unchanging overlay.
 if(u<.36){const p=MOTION.prog(u,0,.36,MOTION.ease.outExpo),cover=(1-p)*960;ctx.fillStyle='#080c10';ctx.fillRect(0,0,W,cover);ctx.fillRect(0,H-cover,W,cover)}
}
function render(sec){t=clamp(sec,0,D);const s=stage(t),u=t-CUTS[s];depthFrame(t,s);ctx.clearRect(0,0,W,H);
 // Darken the text field while retaining the full-frame spatial environment.
 const shade=ctx.createLinearGradient(0,340,0,780);shade.addColorStop(0,'rgba(5,8,11,.65)');shade.addColorStop(1,'rgba(5,8,11,0)');ctx.fillStyle=shade;ctx.fillRect(0,340,W,440);
 ctx.save();ctx.beginPath();ctx.rect(108,190,864,1440);ctx.clip();shots[s](u);ctx.restore();
 if(s<5)optics(s,u);if(s!==5&&t<32.2){line(240,1560,840,1560,C.edge,3);line(240,1560,240+600*t/D,1560,C.green,4)}return s}
const audio=new Audio(document.getElementById('soundtrack').src),narration=new Audio(document.getElementById('narration-track').src);
audio.preload=narration.preload='auto';narration.volume=1;let musicLevel=.55,playGeneration=0;
const voiceWindows=[[0.1, 3.6763], [4.3, 6.9362], [8.3, 11.3008], [12.7, 15.746], [17.2, 20.2043], [21.1, 23.4771], [25.0, 26.2741], [28.8, 31.4266]];
function mix(sec){let speech=0;for(const [start,end] of voiceWindows){const rise=clamp((sec-start+.12)/.18),fall=clamp((end+.2-sec)/.25);speech=Math.max(speech,Math.min(rise,fall))}audio.volume=musicLevel*(1-.55*speech)}
function update(){const s=render(t);mix(t);UI.seek.value=t;UI.now.textContent='00:'+String(Math.floor(t)).padStart(2,'0');document.querySelectorAll('[data-jump]').forEach(b=>b.classList.toggle('active',+b.dataset.jump===s))}
function paint(now){if(!playing)return;t=clamp(audio.currentTime,0,D);if(Math.abs(narration.currentTime-audio.currentTime)>.12)narration.currentTime=audio.currentTime;if(now-lastPaint>=1000/30){update();lastPaint=now}raf=requestAnimationFrame(paint)}
function pause(){playGeneration++;playing=false;audio.pause();narration.pause();cancelAnimationFrame(raf);raf=0;UI.play.textContent='▶　播放';t=clamp(audio.currentTime,0,D);update()}
async function toggle(){if(starting)return;if(playing){pause();return}starting=true;const generation=++playGeneration;try{if(t>=D-.05){t=0;audio.currentTime=0}narration.currentTime=audio.currentTime;mix(t);await Promise.all([audio.play(),narration.play()]);if(generation!==playGeneration){audio.pause();narration.pause();return}playing=true;UI.play.textContent='Ⅱ　暂停';lastPaint=-1;raf=requestAnimationFrame(paint);document.getElementById('status').textContent=''}catch(e){audio.pause();narration.pause();document.getElementById('status').textContent='播放失败：'+e.message}finally{starting=false}}
function seek(sec){t=clamp(sec,0,D);audio.currentTime=narration.currentTime=t;update()}
audio.addEventListener('ended',()=>{playing=false;narration.pause();cancelAnimationFrame(raf);raf=0;t=D;UI.play.textContent='▶　重播';update()});
UI.play.addEventListener('click',toggle);UI.seek.addEventListener('input',e=>seek(+e.target.value));document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>seek(CUTS[+b.dataset.jump])));
document.getElementById('music').addEventListener('click',e=>{audio.muted=!audio.muted;e.currentTarget.textContent=audio.muted?'♪　音乐：关':'♪　音乐：开';e.currentTarget.setAttribute('aria-pressed',String(!audio.muted))});
document.getElementById('voice').addEventListener('click',e=>{narration.muted=!narration.muted;e.currentTarget.textContent=narration.muted?'旁白：关':'旁白：开';e.currentTarget.setAttribute('aria-pressed',String(!narration.muted))});
document.getElementById('volume').addEventListener('input',e=>{musicLevel=+e.target.value/100;mix(t)});
document.getElementById('voice-volume').addEventListener('input',e=>narration.volume=+e.target.value/100);
document.getElementById('safe').addEventListener('click',()=>{document.body.classList.toggle('show-safe');document.getElementById('safe').textContent=document.body.classList.contains('show-safe')?'隐藏安全区':'显示安全区'});
document.getElementById('fullscreen').addEventListener('click',async()=>{document.body.classList.add('clean');try{await document.documentElement.requestFullscreen()}catch{}if(!playing)toggle()});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('clean')});
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.key==='ArrowRight'){e.preventDefault();seek(t+1)}else if(e.key==='ArrowLeft'){e.preventDefault();seek(t-1)}else if(e.key===']')seek(CUTS[Math.min(6,stage(t)+1)]);else if(e.key==='[')seek(CUTS[Math.max(0,stage(t)-1)]);else if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean')});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(playing||starting))pause()});update();
