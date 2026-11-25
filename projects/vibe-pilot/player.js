import {VisualStage} from './scene.js';
import {locate,clamp} from './math.mjs';
const $=id=>document.getElementById(id),series=window.VIBE_SERIES,originalPlan=window.VIBE_ORIGINAL_PLAN;
const episode=series.episodes.find(e=>e.id===window.VIBE_EPISODE)||series.episodes[0],original=structuredClone(episode),voice=$('voice');
const visual=new VisualStage($('scene'),$('diagram'),episode.id);let time=0,playing=false,raf=0,origin=0,lastPaint=-Infinity,currentIndex=0,captionSize=23,dirty=false,lastWidth=-1,lastCaption=-1;
const notesKey='vibe-web-review-'+episode.id+'-'+series.revision;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('episode-number').textContent=episode.number;
$('film-title').textContent=episode.id==='refraction'?'吸管为什么\n看起来折了？':episode.id==='refrigerator'?'冰箱怎样\n把热搬出去？':'功率大，\n一定更费电吗？';
$('structure').textContent=episode.structure;$('caveat').textContent=episode.caveat;
$('sources').innerHTML=episode.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.id+' · '+s.title)} ↗</a>`).join('');
$('episodes').innerHTML=series.episodes.map(e=>`<a class="${e.id===episode.id?'active':''}" href="${esc(e.id)}.html">${esc(e.number+' '+e.title.split('？')[0])}</a>`).join('');
$('chapters').innerHTML=episode.segments.map((s,i)=>`<button data-chapter="${i}"><span>${esc(s.id+' · '+s.label)}</span><small>${format(s.start)}</small></button>`).join('');
$('segment-select').innerHTML=episode.segments.map((s,i)=>`<option value="${i}">${esc(s.id+' · '+s.label)}</option>`).join('');
$('revision').textContent='草稿版本 '+series.revision+' · '+(episode.audioStatus==='generated-not-user-approved'?'实际配音时码':'暂用脚本估时')+' · 未导出视频';
const audioData=window.VIBE_AUDIO?.[episode.id];if(audioData)voice.src=audioData;$('music').disabled=!audioData;
let musicContext,musicGain,musicOsc=[];
function createMusic(){
 if(musicContext)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;musicContext=new AC();musicGain=musicContext.createGain();musicGain.gain.value=0;musicGain.connect(musicContext.destination);
 for(const [frequency,gain] of [[130.81,.5],[196,.14],[261.63,.09]]){const o=musicContext.createOscillator(),g=musicContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=gain;o.connect(g).connect(musicGain);o.start();musicOsc.push(o)}
}
function syncMusic(){if(!musicGain)return;musicGain.gain.cancelScheduledValues(musicContext.currentTime);musicGain.gain.setTargetAtTime(audioData&&playing&&$('music').checked&&!dirty ? .025 : 0,musicContext.currentTime,.3);}
function format(t){const value=Math.max(0,Math.floor(t));return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');}
function updateScale(){const width=$('stage').clientWidth;if(width===lastWidth&&captionSize===lastCaption)return;lastWidth=width;lastCaption=captionSize;const scale=width/540;$('stage').style.setProperty('--s',scale);$('subtitles').style.fontSize=(captionSize*scale)+'px';}
new ResizeObserver(updateScale).observe($('stage'));
function renderFrame(t){
 updateScale();time=clamp(Number(t)||0,0,episode.duration);const info=locate(episode.segments,time);currentIndex=info.index;
 $('chapter-label').textContent=info.segment.id+' / '+info.segment.label;
 $('subtitles').textContent=time<info.segment.start||time>info.segment.end+.16?'':info.segment.text;
 $('seek').max=episode.duration;$('seek').value=time;$('time').textContent=format(time)+' / '+format(episode.duration);
 $('visual-note').textContent=episode.id==='refraction'?'从水面上方观察 · 杯壁折射略去 · 光路为示意':episode.id==='refrigerator'?'常见蒸气压缩制冷 · 部件与热流为示意':'恒功率算例 · 非具体电器实测数据';
 document.querySelectorAll('[data-chapter]').forEach((e,i)=>e.classList.toggle('active',i===currentIndex));
 visual.render(info.segment.scene,info.progress,time);
}
function audioStatus(){
 $('audio-status').textContent=dirty?'改稿静音预览：当前声音仍属原稿；重新配音后再审同步。':audioData?'Puck · 本轮新生成旁白，音色与节奏待你审阅。'+($('music').checked?' 轻音乐为代码试配。':' 配乐已关闭。'):'当前无配音：仅供看画面和改稿，声音尚未完成。';
}
function pause(){playing=false;cancelAnimationFrame(raf);voice.pause();$('play').textContent=time>=episode.duration?'重播':'播放';$('play').setAttribute('aria-label','播放');syncMusic();}
function seek(t){pause();renderFrame(t);if(audioData&&!dirty){voice.currentTime=Math.min(time,Math.max(0,(Number.isFinite(voice.duration)?voice.duration:episode.duration)-.001));}}
async function play(){
 if(playing)return;if(time>=episode.duration-.02)seek(0);
 if(audioData&&!dirty){voice.currentTime=time;try{await voice.play();}catch(e){$('audio-status').textContent='声音未能播放，请再次点击播放：'+e.message;return;}}
 createMusic();await musicContext?.resume();playing=true;origin=performance.now()-time*1000;lastPaint=performance.now()-1000/30;$('play').textContent='暂停';$('play').setAttribute('aria-label','暂停');syncMusic();raf=requestAnimationFrame(tick);
}
function tick(now){if(!playing)return;const t=audioData&&!dirty?voice.currentTime:(now-origin)/1000;if(now-lastPaint>=1000/30||t>=episode.duration){lastPaint=now-((now-lastPaint)%(1000/30));renderFrame(t);}if(t>=episode.duration-.01||(!dirty&&audioData&&voice.ended)){renderFrame(episode.duration);pause();return;}raf=requestAnimationFrame(tick);}
voice.addEventListener('ended',()=>{if(!dirty){renderFrame(episode.duration);pause();}});
$('play').onclick=()=>playing?pause():play();$('replay').onclick=()=>{seek(0);play();};$('seek').oninput=e=>seek(+e.target.value);
$('chapters').onclick=e=>{const b=e.target.closest('[data-chapter]');if(b){const i=+b.dataset.chapter;seek(episode.segments[i].start+.02);$('segment-select').value=i;updateEditor();}};
$('caption-size').oninput=e=>{captionSize=+e.target.value;updateScale()};$('quality').onchange=e=>{visual.setQuality(e.target.value);renderFrame(time)};$('music').onchange=()=>{syncMusic();audioStatus()};
function updateEditor(){$('script-text').value=episode.segments[+$('segment-select').value].text;}
$('segment-select').onchange=updateEditor;
$('apply-text').onclick=()=>{const i=+$('segment-select').value,text=$('script-text').value.trim();if(!text)return;if(text.length>60){$('audio-status').textContent='这段超过 60 字符，请拆段后再配音。';return;}pause();episode.segments[i].text=text;dirty=episode.segments.some((s,n)=>s.text!==original.segments[n].text);voice.muted=dirty;seek(episode.segments[i].start+.02);audioStatus();};
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('export-script').onclick=()=>{const plan=structuredClone(originalPlan),ep=plan.episodes.find(e=>e.id===episode.id);ep.segments.forEach((s,i)=>s.text=episode.segments[i].text);download(plan,episode.id+'-修改稿.json');};
$('reset-script').onclick=()=>{pause();episode.segments.forEach((s,i)=>s.text=original.segments[i].text);dirty=false;voice.muted=false;updateEditor();renderFrame(time);audioStatus();};
try{$('review-note').value=localStorage.getItem(notesKey)||''}catch{}
$('save-note').onclick=()=>{try{localStorage.setItem(notesKey,$('review-note').value);$('note-status').textContent='已保存在当前浏览器。需要交回制作时请导出反馈。';}catch{$('note-status').textContent='当前浏览器不允许保存，请导出反馈。';}};
$('export-note').onclick=()=>download({episode:episode.id,revision:series.revision,time,segment:episode.segments[currentIndex].id,notes:$('review-note').value,scriptDirty:dirty,status:'user-feedback-not-automatic-approval'},episode.id+'-Web反馈.json');
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();playing?pause():play();}else if(e.key==='ArrowLeft')seek(time-2);else if(e.key==='ArrowRight')seek(time+2)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
window.__vibe={ready:false,seek,renderFrame,play,pause,get time(){return time},get playing(){return playing},get duration(){return episode.duration},get episode(){return structuredClone(episode)},get dirty(){return dirty},get stats(){return visual.stats},revision:series.revision};
updateEditor();updateScale();renderFrame(0);audioStatus();$('loading').hidden=true;window.__vibe.ready=true;
