'use strict';
(() => {
 const $=id=>document.getElementById(id), catalog=window.MOTION_CATALOG, KEY='motion-director-workbench-v1';
 const stages={review:'待你审阅',idea:'待制作',working:'制作中',baseline:'定稿与参考',tool:'工具与试验',archived:'历史归档',all:'全部内容'};
 const navViews={review:'待你审阅',boards:'看板与 Skill',idea:'待制作',working:'制作中',baseline:'定稿与参考',tool:'工具与试验',archived:'历史归档',all:'全部内容'};
 const boardIds=new Set(['opus-source-board','vibe-style-guide','art-styles','format','cutaway','audio-tools']);
 const isBoard=p=>p.board||boardIds.has(p.id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safePath=p=>typeof p==='string'&&p.length<1000&&!/^[/.\\]|[:?#%\x00-\x1f\\]/.test(p)&&!p.split('/').includes('..')&&/\.(html|mp4)$/i.test(p);
 let state={schemaVersion:1,patches:{},ideas:[]}, view=new URLSearchParams(location.search).get('view')||'all', active=null;
 if(!navViews[view])view='all';
 function clean(raw){
  if(!raw||raw.schemaVersion!==1||!raw.patches||!Array.isArray(raw.ideas))throw Error('备份格式不匹配。');
  const ideas=raw.ideas.filter(x=>x&&/^idea-\d+-[a-z0-9]+$/.test(x.id)&&typeof x.title==='string').map(x=>({id:x.id,title:x.title.slice(0,120),kind:'混合',stage:'idea',note:String(x.note||'').slice(0,10000),versions:[],image:'',cover:'新选题，暂无画面'}));
  const projects=[...catalog.projects,...ideas],patches={};
  for(const p of projects){
   const x=raw.patches[p.id];if(!x||typeof x!=='object')continue;
   const extraVersions=(Array.isArray(x.extraVersions)?x.extraVersions:[]).filter(v=>v&&safePath(v.path)&&typeof v.label==='string'&&['page','server','video'].includes(v.mode)).map(v=>({id:v.path,path:v.path,label:v.label.slice(0,200),mode:v.mode,manual:true}));
   const ids=[...p.versions,...extraVersions].map(v=>v.id);
   patches[p.id]={stage:Object.hasOwn(stages,x.stage)&&x.stage!=='all'?x.stage:p.stage,notes:String(x.notes||'').slice(0,10000),primary:ids.includes(x.primary)?x.primary:'',extraVersions};
  }
  return {schemaVersion:1,patches,ideas};
 }
 try{const raw=localStorage.getItem(KEY);if(raw)state=clean(JSON.parse(raw));}catch(e){$('storage').textContent='未能读取浏览器整理记录。原记录未自动覆盖；请使用备份恢复，当前先显示项目目录。';}
 let readFailed=false;
 // Protect an unreadable previous record until the user restores a known backup.
 try{const raw=localStorage.getItem(KEY);if(raw)clean(JSON.parse(raw));}catch{readFailed=true;}
 function save(){if(readFailed){$('storage').textContent='原浏览器记录无法读取，本次整理仅在当前页面有效。请先备份本次结果，或恢复有效备份。';return;}try{localStorage.setItem(KEY,JSON.stringify(state));$('storage').textContent='已保存在当前浏览器。请定期备份；整理结果尚未写回项目文件。';}catch{$('storage').textContent='浏览器未允许保存；本次整理仅在当前页面有效，请立即备份。';}}
 function all(){return [...catalog.projects,...state.ideas].map(p=>{const x=state.patches[p.id]||{};return {...p,...x,versions:[...p.versions,...(x.extraVersions||[])]};});}
 function render(){
  const projects=all(), q=$('search').value.trim().toLowerCase(),kind=$('kind').value;
  const normalize=s=>String(s).toLowerCase().replace(/[\s_-]+/g,'');
  $('nav').innerHTML=Object.entries(navViews).map(([id,label])=>`<button data-view="${id}" class="${(q?'all':view)===id?'active':''}">${label}<small>${projects.filter(p=>id==='all'?true:id==='boards'?isBoard(p):p.stage===id).length}</small></button>`).join('');
  $('heading').textContent=q?'搜索全部内容':navViews[view];$('summary').textContent=view==='boards'&&!q?'聚合各独立看板与 Skill 工具（motion-director-skill、vibe-knowledge、ai-teardown、lemo-opuscar、huashu-art-motion）。':`${projects.length} 个题目 / 工具，${projects.reduce((n,p)=>n+p.versions.length,0)} 个版本入口。${q?'搜索覆盖所有工作阶段；形式筛选仍然有效。':'先审阅，再决定下一步。'}`;
  const filtered=projects.filter(p=>(q||view==='all'||(view==='boards'?isBoard(p):p.stage===view))&&(kind==='all'||p.kind===kind||(kind==='3D'&&(['混合'].includes(p.kind)||['format','lens','cutaway','pdoom'].includes(p.id))))&&(!q||normalize([p.id,p.title,p.note,p.notes,p.provenance,...(p.aliases||[]),...p.versions.flatMap(v=>[v.label,v.path,v.provenance,...(v.aliases||[])]),...(window.MOTION_FILES||[]).filter(f=>f.projects.includes(p.id)).map(f=>f.path)].join(' ')).includes(normalize(q))));
  $('count').textContent=`显示 ${filtered.length} 项`;$('empty').hidden=!!filtered.length;
  const showSkills=view==='boards'&&!q;
  $('skillsBar').hidden=!showSkills;
  if(showSkills)$('skillsBar').innerHTML='<div class="skills-row"><strong>Skill 文档：</strong>'+[['motion-director-skill','projects/skills/motion-director-skill.md'],['vibe-knowledge','projects/skills/vibe-knowledge.md'],['ai-teardown','projects/skills/ai-teardown.md'],['lemo-opuscar','projects/skills/lemo-opuscar.md'],['huashu-art-motion','projects/skills/huashu-art-motion.md']].map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')+'</div><div class="skills-row"><strong>GitHub：</strong>'+[['iiiiihb66/motion-director-skill','https://github.com/iiiiihb66/motion-director-skill'],['andyhuo520/vibe-knowledge (含 ai-teardown)','https://github.com/andyhuo520/vibe-knowledge'],['lemomo-ai/lemo-opuscar','https://github.com/lemomo-ai/lemo-opuscar'],['alchaincyf/huashu-art-motion','https://github.com/alchaincyf/huashu-art-motion'],['Vincentwei1021/video-shotcraft','https://github.com/Vincentwei1021/video-shotcraft']].map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join('')+'</div>';
  $('grid').innerHTML=filtered.map(p=>`<article class="card"><div class="cover">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`:'<div class="fallback">新选题</div>'}<span>${esc(p.cover)}</span></div><div class="body"><div class="meta">${esc(p.kind)} · ${p.versions.length} 个版本 · ${esc(stages[p.stage])}</div><h2>${esc(p.title)}</h2><p>${esc(p.notes||p.note)}</p>${p.primary?'<div class="picked">已选主版本</div>':''}<button data-edit="${esc(p.id)}">查看版本与整理 →</button></div></article>`).join('');
 }
 function detail(id){
  active=all().find(p=>p.id===id);if(!active)return;
  $('edit').reset();$('editError').textContent='';$('title').textContent=active.title;$('description').textContent=active.note+(active.provenance?' 来源线索：'+active.provenance:'');
  $('stage').innerHTML=Object.entries(stages).filter(([id])=>id!=='all').map(([id,label])=>`<option value="${id}">${label}</option>`).join('');$('stage').value=active.stage;
  $('primary').innerHTML='<option value="">尚未选择主版本</option>'+active.versions.map(v=>`<option value="${esc(v.id)}">${esc(v.label)}</option>`).join('');$('primary').value=active.primary||'';$('notes').value=active.notes||'';
  $('versions').innerHTML=active.versions.length?active.versions.map(v=>`<div class="version">${v.image?`<img class="version-thumb" src="${esc(v.image)}" alt="${esc(v.label)}" loading="lazy">`:""}<div class="version-copy"><strong>${esc(v.label)}</strong><small>${esc(v.path)}</small>${v.imageCaption?`<small>${esc(v.imageCaption)}</small>`:''}${v.provenance?`<small>来源线索：${esc(v.provenance)}</small>`:''}<small>${v.manual?'手动登记，文件存在性待核对 · ':''}${v.mode==='blocked'?esc(v.runtimeNote||'原稿缺少素材，待补齐'):v.mode==='server'?'源工程需开发服务；双击无法正常运行':v.mode==='video'?'MP4 导出文件':v.mode==='link'?'在线原型入口（需联网）':esc(v.runtimeNote||'网页预览；实际播放效果待审')}</small></div>${v.mode==='blocked'?'<span>缺素材 · 待补</span>':v.mode==='server'?'<span>需开发服务</span>':`<a href="${esc(v.path)}" target="_blank" rel="noopener">打开${v.mode==='video'?'视频':v.mode==='link'?'原型':'预览'}</a>`}</div>`).join(''):(active.kind==='工具'?'<p>这个工具目前以源文件或资料为主，见下方附件。</p>':'<p>尚未登记生成文件。先明确这一条要讲清楚什么。</p>');
  if(active.missingRecords?.length)$('versions').innerHTML+=active.missingRecords.map(r=>`<div class="version"><div><strong>${esc(r.label)}</strong><small>${esc(r.status)}</small><small>${esc((r.paths||[]).join('；'))}</small></div><span>待找回</span></div>`).join('');
  const files=(window.MOTION_FILES||[]).filter(f=>f.projects.includes(active.id));
  if(files.length)$('versions').innerHTML+=`<details class="project-files"><summary>素材、源文件与历史过程 · ${files.length} 个文件</summary><p>同一内容的副本、逐镜片段和草稿保留在这里；不会因是否成熟而被删掉。</p><input id="fileSearch" placeholder="在本项目中找图片、旁白、片段或文件名" aria-label="筛选本项目附件"><select id="fileKind" aria-label="附件类型"><option value="all">全部文件</option><option value="image">图片 / 截图</option><option value="audio">声音 / 配音</option><option value="video">视频 / 逐镜片段</option><option value="entry">网页入口</option><option value="source">源文件 / 文档</option></select><div id="fileList"></div><button type="button" id="moreFiles">继续显示</button></details>`;
  if(files.length){let limit=60;const drawFiles=()=>{const q=$('fileSearch').value.trim().toLowerCase(),kind=$('fileKind').value,matched=files.filter(f=>(kind==='all'||f.kind===kind)&&(!q||f.path.toLowerCase().includes(q)));$('fileList').innerHTML=matched.slice(0,limit).map(f=>`<div class="file-row"><a href="${esc(f.path)}" target="_blank" rel="noopener">${esc(f.name)}</a><small>${esc(f.path)} · ${(f.bytes/1024).toFixed(1)} KB${f.duplicateOf?' · 相同副本':''}</small></div>`).join('')+`<p>显示 ${Math.min(limit,matched.length)} / ${matched.length} 个文件</p>`;$('moreFiles').hidden=limit>=matched.length;};$('fileSearch').oninput=()=>{limit=60;drawFiles()};$('fileKind').onchange=()=>{limit=60;drawFiles()};$('moreFiles').onclick=()=>{limit+=60;drawFiles()};drawFiles();}
  $('detail').showModal();
 }
 $('nav').onclick=e=>{const b=e.target.closest('[data-view]');if(b){view=b.dataset.view;render();}};
 $('grid').onclick=e=>{const b=e.target.closest('[data-edit]');if(b)detail(b.dataset.edit);};
 $('grid').addEventListener('error',e=>{if(e.target.tagName==='IMG'){const box=document.createElement('div');box.className='fallback';box.textContent='封面待补';e.target.replaceWith(box);}},true);
 $('search').oninput=render;$('kind').onchange=render;$('close').onclick=()=>$('detail').close();
 $('edit').onsubmit=e=>{
  e.preventDefault();const label=$('versionLabel').value.trim(),path=$('versionPath').value.trim();
  if((label||path)&&(!label||!safePath(path))){$('editError').textContent='请填写版本名和仓库内 HTML / MP4 相对路径，不使用绝对路径、网址或上级目录。';return;}
  if(path&&active.versions.some(v=>v.path===path)){$('editError').textContent='这个文件已经登记，请直接选择已有版本。';return;}
  const old=state.patches[active.id]||{},extraVersions=[...(old.extraVersions||[])];
  if(path)extraVersions.push({id:path,path,label,mode:$('versionMode').value,manual:true});
  state.patches[active.id]={stage:$('stage').value,primary:$('primary').value,notes:$('notes').value,extraVersions};save();$('detail').close();render();
 };
 $('new').onclick=()=>{$('create').reset();$('idea').showModal();};$('cancelIdea').onclick=()=>$('idea').close();
 $('create').onsubmit=e=>{e.preventDefault();const title=$('ideaTitle').value.trim();if(!title)return;state.ideas.push({id:`idea-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,title,note:$('ideaNote').value,kind:'混合',stage:'idea',image:'',cover:'新选题，暂无画面',versions:[]});save();$('idea').close();view='idea';render();};
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`动态解说整理-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('备份文件过大。');const incoming=clean(JSON.parse(await file.text()));state=clean({schemaVersion:1,patches:{...state.patches,...incoming.patches},ideas:[...state.ideas.filter(x=>!incoming.ideas.some(y=>y.id===x.id)),...incoming.ideas]});readFailed=false;save();render();$('storage').textContent='已合并恢复备份。当前浏览器已有、备份中未包含的整理记录已保留。';}catch(err){$('storage').textContent='恢复失败：'+err.message;}e.target.value='';};
 const params=new URLSearchParams(location.search);if(['3D','2D','混合'].includes(params.get('kind')))$('kind').value=params.get('kind');if(params.get('q'))$('search').value=params.get('q').slice(0,200);render();
})();
