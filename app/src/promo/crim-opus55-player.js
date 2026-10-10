import * as THREE from 'three';
import { createFilm } from './crim-opus55-cinematic.js';

const $=id=>document.getElementById(id);
const canvas=$('depth'), overlay=$('overlay'), stage=$('stage'), reel=$('reel');
const status=$('status'), controls=$('controls'), play=$('play');
const assets=JSON.parse($('audio-data').textContent);
let film;
try { film=createFilm(THREE,canvas,overlay); }
catch(error){status.textContent='3D 画面未能启动，请使用支持 WebGL 的浏览器。';throw error;}
window.FILM={duration:film.duration,scenes:film.scenes};
window.CINEMATIC_FILM=film;
const state={t:0,playing:false,muted:false,music:true,voice:true,perfBase:0,clock:'performance',epoch:0};
let audioCtx,master,musicGain,voiceGain,analyser,audioBase=0,bufferPromise,buffers,sources=[],masterTarget=null;
const D=film.duration;
const limit=t=>Math.max(0,Math.min(D,Number(t)||0));
const now=()=>state.playing?limit(state.clock==='audio' && audioCtx?.state==='running'?audioCtx.currentTime-audioBase:(performance.now()-state.perfBase)/1000):state.t;
function stopSources(){for(const s of sources){try{s.stop();}catch(_){}s.disconnect();}sources=[];}
function bytes(base64){const raw=atob(base64),v=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)v[i]=raw.charCodeAt(i);return v.buffer;}
function initAudio(){
 if(bufferPromise)return bufferPromise;
 try{
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  master=audioCtx.createGain();master.gain.value=.9;
  musicGain=audioCtx.createGain();voiceGain=audioCtx.createGain();
  analyser=audioCtx.createAnalyser();analyser.fftSize=256;
  const limiter=audioCtx.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=6;limiter.ratio.value=4;
  musicGain.connect(master);voiceGain.connect(master);master.connect(limiter);limiter.connect(analyser);analyser.connect(audioCtx.destination);
  bufferPromise=Promise.all([audioCtx.decodeAudioData(bytes(assets.music)),audioCtx.decodeAudioData(bytes(assets.voice))]).then(([music,voice])=>{buffers={music,voice};return buffers;});
  bufferPromise.catch(()=>{status.textContent='声音加载失败，画面仍可播放。';});
 }catch(_){status.textContent='当前浏览器未能启用声音，画面仍可播放。';bufferPromise=Promise.resolve(null);}
 return bufferPromise;
}
function startSources(t){
 if(!buffers||!audioCtx||audioCtx.state!=='running'||t>=D)return;
 stopSources();
 const at=audioCtx.currentTime+.035;audioBase=at-t;
 for(const [key,gain] of [['music',musicGain],['voice',voiceGain]]){
  const src=audioCtx.createBufferSource();src.buffer=buffers[key];src.connect(gain);src.start(at,t);sources.push(src);
 }
 state.clock='audio';
 updateGains(t);
}
async function enableAudio(epoch){
 const ready=initAudio();
 try{await audioCtx?.resume();await ready;}catch(_){return;}
 if(epoch!==state.epoch||!state.playing)return;
 const t=now();state.t=t;startSources(t);
}
function updateGains(t){
 if(!audioCtx)return;
 const talking=state.voice&&assets.cues.some(c=>t>=c.start-.1&&t<=c.end+.2);
 const target=state.muted?0:.9;
 if(target!==masterTarget){const at=audioCtx.currentTime;master.gain.cancelScheduledValues(at);master.gain.setValueAtTime(master.gain.value,at);master.gain.linearRampToValueAtTime(target,at+.015);masterTarget=target;}
 musicGain.gain.setTargetAtTime(state.music?(talking?.32:.72):0,audioCtx.currentTime,.08);
 voiceGain.gain.setTargetAtTime(state.voice?.96:0,audioCtx.currentTime,.025);
}
function setPlaying(on){
 state.t=now();state.playing=on;state.epoch++;
 stopSources();state.clock='performance';
 if(on){if(state.t>=D)state.t=0;state.perfBase=performance.now()-state.t*1000;enableAudio(state.epoch);}
 updateUI();film.render(state.t);
}
function seek(t){
 state.t=limit(t);state.epoch++;stopSources();state.clock='performance';
 state.perfBase=performance.now()-state.t*1000;
 if(state.playing){if(buffers&&audioCtx?.state==='running')startSources(state.t);else enableAudio(state.epoch);}
 updateGains(state.t);film.render(state.t);updateUI();
}
window.seek=seek;
window.render=t=>film.render(limit(t));
window.CINEMATIC_PLAYER={snapshot:()=>({time:now(),playing:state.playing,clock:state.clock,muted:state.muted,music:state.music,voice:state.voice,decoded:!!buffers,sources:sources.length,audioState:audioCtx?.state,musicDuration:buffers?.music.duration,voiceDuration:buffers?.voice.duration}),audioRMS:()=>{if(!analyser)return 0;const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);}};
function format(t){return `00:${String(Math.floor(t)).padStart(2,'0')}`;}
function updateUI(){
 play.textContent=state.playing?'暂停':'播放';play.setAttribute('aria-label',state.playing?'暂停':'播放');
 $('timeline').value=state.t;$('timeline').style.setProperty('--progress',`${state.t/D*100}%`);
 $('time').textContent=`${format(state.t)} / ${format(D)}`;
 const s=film.scenes.find(s=>state.t>=s.start&&state.t<s.end)||film.scenes.at(-1);
 const shot=s.shots?.find(s=>state.t>=s.start&&state.t<s.end)||s.shots?.at(-1);
 $('shot').textContent=shot?.name||s.name;
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.scene)===film.scenes.indexOf(s)?'true':'false'));
 $('music').setAttribute('aria-pressed',String(state.music));$('voice').setAttribute('aria-pressed',String(state.voice));
 $('mute').textContent=state.muted?'开启声音':'静音';$('mute').setAttribute('aria-label',state.muted?'开启声音':'静音');
 $('poster').hidden=state.playing||state.t>0;
}
function fit(){
 const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(w/16,h/9);
 const width=Math.floor(scale*16),height=Math.floor(scale*9);
 if(width<2||height<2)return;
 reel.style.width=`${width}px`;reel.style.height=`${height}px`;
 film.resize(width,height);film.render(now());
}
new ResizeObserver(fit).observe(stage);window.addEventListener('resize',fit);
play.onclick=()=>setPlaying(!state.playing);
$('poster').onclick=()=>setPlaying(true);
$('replay').onclick=()=>{setPlaying(false);seek(0);setPlaying(true);};
$('timeline').oninput=e=>seek(e.target.value);
$('music').onclick=()=>{state.music=!state.music;updateGains(now());updateUI();};
$('voice').onclick=()=>{state.voice=!state.voice;updateGains(now());updateUI();};
$('mute').onclick=()=>{state.muted=!state.muted;updateGains(now());updateUI();if(!state.muted&&state.playing)enableAudio(state.epoch);};
$('fullscreen').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{status.textContent='此浏览器未能进入全屏。';});};
function hideControls(hide){controls.hidden=hide;controls.inert=hide;$('header').hidden=hide;$('restore').hidden=!hide;if(hide)$('restore').focus();fit();}
$('hide').onclick=()=>hideControls(true);$('restore').onclick=()=>hideControls(false);
overlay.onclick=()=>{if(controls.hidden)hideControls(false);else setPlaying(!state.playing);};
for(const [i,s]of film.scenes.entries()){
 const b=document.createElement('button');b.textContent=s.name;b.dataset.scene=i;b.setAttribute('aria-label',`跳转到${s.name}`);b.onclick=()=>seek(s.start);$('chapters').appendChild(b);
}
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select')||e.target.isContentEditable||e.target.matches('button')&&[' ','Enter'].includes(e.key))return;
 if(e.key===' '){e.preventDefault();setPlaying(!state.playing);}
 else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();seek(now()+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?5:1));}
 else if(e.key==='['){e.preventDefault();const s=film.scenes.filter(s=>s.start<now()-.2).at(-1);if(s)seek(s.start);}
 else if(e.key===']'){e.preventDefault();const s=film.scenes.find(s=>s.start>now()+.2);if(s)seek(s.start);}
 else if(e.key.toLowerCase()==='h'){e.preventDefault();hideControls(!controls.hidden);}
});
let previous=0;
function frame(timestamp){
 if(state.playing){
  state.t=now();
  if(state.t>=D){state.t=D;state.playing=false;stopSources();state.clock='performance';}
  film.render(state.t);updateGains(state.t);
  if(timestamp-previous>50||!state.playing){updateUI();previous=timestamp;}
 }
 requestAnimationFrame(frame);
}
fit();updateUI();requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{stopSources();audioCtx?.close();film.dispose();},{once:true});
