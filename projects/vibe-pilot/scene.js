import * as T from '../../app/node_modules/three/build/three.module.js';
import {RoomEnvironment} from '../../app/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import {apparentIn3D,apparentPoint,clamp,ease} from './math.mjs';
const C={ink:'#eceddb',muted:'#94ae9b',gold:'#e0c07c',blue:'#8fcbd0',hot:'#dba179',line:'#648474'};
const text=(x,y,s,size=18,color=C.ink,anchor='start',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${extra}>${s}</text>`;
const line=(a,b,color=C.gold,width=2,attrs='')=>`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${attrs}/>`;
function pointOn(a,b,p){return {x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p}}
function dot(p,r=4,color=C.gold){return `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${color}"/>`}
function defs(){return `<defs><marker id="ray-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="${C.gold}" stroke-width="1.3"/></marker><linearGradient id="water-color" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6faaa1" stop-opacity=".12"/><stop offset="1" stop-color="#173b34" stop-opacity=".3"/></linearGradient></defs>`}
export class VisualStage{
 constructor(canvas,svg,topic){
  this.canvas=canvas;this.svg=svg;this.topic=topic;this.frames=0;this.totalMs=0;this.renderer=null;
  if(topic!=='power-energy'){
   this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'default'});this.renderer.setPixelRatio(1);this.renderer.setClearColor('#12211a',0);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.AgXToneMapping;this.renderer.toneMappingExposure=1.08;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
   this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(36,9/16,.1,80);this.camera.position.set(6.3,8.8,10);this.camera.lookAt(0,-.15,0);const pm=new T.PMREMGenerator(this.renderer),env=new RoomEnvironment();this.env=pm.fromScene(env,.05);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.3;env.dispose();pm.dispose();
   this.scene.add(new T.HemisphereLight('#c8dfd4','#382a16',1.25));const light=new T.DirectionalLight('#ffe7bf',3.8);light.position.set(-5,9,4);light.castShadow=true;light.shadow.mapSize.set(512,512);Object.assign(light.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:25});light.shadow.normalBias=.025;this.scene.add(light);const fill=new T.DirectionalLight('#96c8c1',1.7);fill.position.set(5,2,-4);this.scene.add(fill);this.key=light;
   this.geometries=new Set();this.materials=new Set();this.sharedBox=this.keep(new T.BoxGeometry(1,1,1));this.brass=this.mat('#b6a16b',.3,.65);this.dark=this.mat('#24352c',.45,.2);this.cream=this.mat('#d5d4bc',.45,.08);
   const floor=this.mesh(this.keep(new T.CylinderGeometry(3.6,3.8,.3,64)),this.mat('#4e5640',.85),[0,-2.5,0]);floor.receiveShadow=true;
   if(topic==='refraction')this.buildRefraction();else this.buildFridge();this.setQuality('standard');
  }else canvas.style.display='none';
 }
 keep(g){this.geometries.add(g);return g}
 mat(color,roughness=.5,metalness=0,other={}){const m=new T.MeshStandardMaterial({color,roughness,metalness,...other});this.materials.add(m);return m}
 mesh(g,m,p=[0,0,0],scale=null,parent=this.scene){const o=new T.Mesh(g,m);o.position.set(...p);if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 box(w,h,d,m,x,y,z,parent){return this.mesh(this.sharedBox,m,[x,y,z],[w,h,d],parent)}
 tube(points,r,mat,parent=this.scene){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x,p.y,p.z)));return this.mesh(this.keep(new T.TubeGeometry(curve,Math.max(16,points.length*2),r,8,false)),mat,[0,0,0],null,parent)}
 buildRefraction(){
  const glass=this.mat('#c2d3bd',.2,.05,{transparent:true,opacity:.12,depthWrite:false});const water=this.mat('#71aeb1',.26,.06,{transparent:true,opacity:.13,depthWrite:false});
  this.box(4.25,.12,3.45,this.brass,0,-2.1,0);this.box(4.1,2.5,.05,glass,0,-.88,-1.72);this.box(.05,2.5,3.4,glass,-2.1,-.88,0);this.box(.05,2.5,3.4,glass,2.1,-.88,0);this.box(4.1,2.5,.05,glass,0,-.88,1.72);
  for(const z of [-1.72,1.72])this.box(4.25,.025,.025,this.brass,0,.4,z);for(const x of [-2.1,2.1])this.box(.025,.025,3.45,this.brass,x,.4,0);
  const surface=this.mesh(this.keep(new T.PlaneGeometry(4.18,3.4)),water,[0,0,0]);surface.rotation.x=-Math.PI/2;surface.castShadow=false;
  const upper=[];for(let i=0;i<30;i++){const y=i/29*2.4;upper.push({x:y*.53,y,z:0});}
  this.tube(upper,.065,this.mat('#dab85f',.35,.12));
  const physical=[],apparent=[];for(let i=0;i<40;i++){const y=-.005-i/39*1.85,p={x:y*.53,y,z:0};physical.push(p);apparent.push(apparentIn3D(p,this.camera.position));}
  this.apparentStraw=this.tube(apparent,.065,this.mat('#d4b65d',.4,.12));this.actualStraw=this.tube(physical,.038,this.mat('#b5c9ad',.6,0,{transparent:true,opacity:.42,depthWrite:false}));this.actualStraw.visible=false;
  for(let y=.25;y<2.3;y+=.28){const a={x:y*.53,y,z:0},b={x:(y+.065)*.53,y:y+.065,z:0};this.tube([a,b],.066,this.cream);}
  const ink=this.mat('#6b795e',.6);for(let i=0;i<6;i++)this.box(.23,.012,.012,ink,-2.13,-1.8+i*.35,1.75);
 }
 buildFridge(){
  this.fridgeGroup=new T.Group();this.scene.add(this.fridgeGroup);const p=this.fridgeGroup;
  this.box(3.2,4.6,2,this.cream,0,-.02,-.4,p);this.box(2.86,4.28,.12,this.dark,0,0,.65,p);
  const blue=this.mat('#8dbbb0',.5,.12);this.box(2.7,.07,1.2,blue,0,-.5,.5,p);this.box(2.7,.07,1.2,blue,0,.65,.5,p);
  this.box(.35,1.5,.2,this.brass,1.26,.25,1.08,p);this.box(1.3,.56,.8,this.mat('#819273',.65),-.55,-1.65,.25,p);
  const cold=this.mat('#90cbd1',.35,.35),warm=this.mat('#c68b61',.36,.6);
  const coldPoints=[];for(let i=0;i<18;i++)coldPoints.push({x:i%2?1.05:-1.05,y:1.65-i*.18,z:.8});this.tube(coldPoints,.038,cold,p);
  const hotPoints=[];for(let i=0;i<18;i++)hotPoints.push({x:1.82+(i%2?.5:0),y:1.7-i*.2,z:-.3});this.tube(hotPoints,.033,warm,p);
  this.fridgeGroup.rotation.y=-.08;this.fridgeGroup.position.y=-.2;this.camera.position.set(6,4.4,9);this.camera.lookAt(.2,-.1,0);
 }
 setQuality(name){if(!this.renderer)return;const width={low:360,standard:540,high:810}[name]||540;this.renderer.setSize(width,width*16/9,false);}
 render(sceneKey,progress,time){const order={refraction:['phenomenon','path','bend','extend','compare','resolve'],refrigerator:['phenomenon','absorb','compress','release','expand','balance'],'power-energy':['phenomenon','power','first','second','area','resolve']}[this.topic],index=order.indexOf(sceneKey);if(index<0)throw Error('Unknown scene: '+sceneKey);const begin=performance.now();let markup=defs();if(this.topic==='refraction'){
  const hero=index===0||index===5;this.canvas.style.opacity=hero?'1':'0';if(hero){this.actualStraw.visible=index===5;this.camera.fov=36-.7*ease(progress);this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);markup+=text(270,733,index===0?'同一根吸管 · 水面上方观察':'实物仍然是直的',16,C.gold,'middle');if(index===5)markup+=text(270,762,'浅色细线：真实位置',12,C.muted,'middle');}else markup+=this.refractionDiagram(index,progress,time);
 }else if(this.topic==='refrigerator'){
  const hero=index===0;this.canvas.style.opacity=hero?'1':'0';if(hero){this.fridgeGroup.rotation.y=-.1+.12*ease(progress);this.renderer.render(this.scene,this.camera);markup+=text(270,735,'里面吸热，向房间放热',17,C.gold,'middle');}else markup+=this.fridgeDiagram(index,progress,time);
 }else markup+=this.powerDiagram(index,progress,time);
 this.svg.innerHTML=markup;this.frames++;this.totalMs+=performance.now()-begin;
 }
 refractionDiagram(index,progress,time){
  const map=p=>({x:270+p.x*83,y:455-p.y*83});const P={x:-1.25,y:-2.35},E={x:1.7,y:1.7},virtual=apparentPoint(P,E,4/3,.07),pp=map(P),vp=map(virtual),ee=map(E);let m=`<rect x="40" y="455" width="460" height="267" fill="url(#water-color)" rx="6"/>`+line({x:40,y:455},{x:500,y:455},C.blue,1.3)+text(45,433,'空气',13,C.muted)+text(45,481,'水',13,C.blue);
  m+=`<path d="M${ee.x-19} ${ee.y}q19 -18 38 0q-19 18 -38 0" fill="#182b23" stroke="${C.ink}" stroke-width="1.4"/>`+dot(ee,4,C.ink)+text(ee.x,ee.y-27,'眼睛',13,C.muted,'middle');
  for(let k=0;k<2;k++){const ray=virtual.rays[k],s=map(ray.surface),end=map(ray.eye),p=ease(progress);m+=line(pp,s,C.gold,k?1.2:2,'marker-end="url(#ray-arrow)"');if(index>=2||p>.25)m+=line(s,end,C.gold,k?1.2:2,'marker-end="url(#ray-arrow)"');const phase=(time*.28+k*.45)%1;m+=dot(phase<.5?pointOn(pp,s,phase*2):pointOn(s,end,(phase-.5)*2),3,C.gold);
   if(index>=3)m+=line(s,vp,C.blue,1.5,'stroke-dasharray="6 6" opacity=".8"');
   if(index===2&&k===0){m+=line({x:s.x,y:365},{x:s.x,y:546},C.muted,1,'stroke-dasharray="3 6"')+text(s.x-12,364,'法线',12,C.muted,'end');m+=text(270,715,'水 → 空气：出射光偏离法线',15,C.gold,'middle');}
  }
  m+=dot(pp,5,C.gold)+text(pp.x-18,pp.y+31,'真实位置',15,C.gold,'middle');
  if(index>=3)m+=dot(vp,6,C.blue)+text(vp.x-20,vp.y-17,'看到的位置',15,C.blue,'end')+text(270,740,'虚线：出射光的反向延长',13,C.muted,'middle');
  if(index===4){m+=line({x:270,y:335},{x:270,y:455},C.gold,5);m+=line({x:270,y:455},vp,C.gold,5);m+=line({x:270,y:455},pp,C.muted,2,'stroke-dasharray="6 7"');}
  return m;
 }
 fridgeDiagram(index,progress,time){
  const color=[C.blue,C.blue,C.hot,C.hot,C.blue][Math.min(index,4)];
  if(index===5){let m=text(270,332,'稳定循环中的能量收支',19,C.ink,'middle');m+=`<rect x="88" y="391" width="155" height="112" rx="10" fill="#25463f" stroke="${C.blue}"/><rect x="297" y="391" width="155" height="112" rx="10" fill="#4a3924" stroke="${C.gold}"/>`;m+=text(165,437,'箱内搬走的热',17,C.blue,'middle')+text(375,437,'消耗的电能',17,C.gold,'middle')+text(270,460,'+',26,C.muted,'middle');m+=text(270,550,'↓',38,C.gold,'middle');m+=`<rect x="130" y="583" width="280" height="105" rx="10" fill="#4c372a" stroke="${C.hot}"/>`+text(270,632,'排到房间的热',22,C.hot,'middle')+text(270,721,'忽略一个循环内的储能变化',12,C.muted,'middle');return m;}
  let m=`<rect x="62" y="382" width="170" height="270" rx="20" fill="#183d39" fill-opacity=".5"/><rect x="308" y="382" width="170" height="270" rx="20" fill="#4a3526" fill-opacity=".35"/>`+text(147,405,'箱内',13,C.blue,'middle')+text(393,405,'房间',13,C.hot,'middle');
  const points=[{x:149,y:505},{x:270,y:673},{x:391,y:505},{x:270,y:332}],labels=['蒸发器','压缩机','冷凝器','节流装置'];const colors=[C.blue,C.hot,C.hot,C.blue];
  for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],on=index===i+1;const mx=(a.x+b.x)/2+(i<2?26:-26);m+=`<path d="M${a.x} ${a.y}Q${mx} ${(a.y+b.y)/2} ${b.x} ${b.y}" fill="none" stroke="${colors[i]}" stroke-width="${on?4:2}" opacity="${on?1:.5}" marker-end="url(#ray-arrow)"/>`;const phase=(time*.2+i*.23)%1,pt={x:(1-phase)*(1-phase)*a.x+2*(1-phase)*phase*mx+phase*phase*b.x,y:a.y+(b.y-a.y)*phase};m+=dot(pt,4,colors[i]);}
  for(let i=0;i<4;i++){const p=points[i],on=index===i+1;m+=`<rect x="${p.x-60}" y="${p.y-28}" width="120" height="56" rx="8" fill="${on?'#364a34':'#172b24'}" stroke="${on?C.gold:C.line}" stroke-width="${on?2:1}"/>`+text(p.x,p.y+6,labels[i],17,on?C.gold:C.ink,'middle');}
  if(index===1)m+=text(67,583,'热 →',17,C.blue)+text(270,746,'蒸发，吸收箱内的热',15,C.blue,'middle');
  if(index===2)m+=text(270,738,'输入电能，压缩气体',15,C.gold,'middle');
  if(index===3)m+=text(405,583,'→ 热',17,C.hot)+text(270,746,'放热，同时凝结成液体',15,C.hot,'middle');
  if(index===4)m+=text(270,738,'节流降压，再回到蒸发器',15,C.blue,'middle');
  return m;
 }
 powerDiagram(index,progress,time){
  let m='';
  if(index<2){m+=text(162,367,'设备 A',15,C.muted,'middle')+text(378,367,'设备 B',15,C.muted,'middle');m+=`<rect x="91" y="405" width="142" height="164" rx="12" fill="#443d28" stroke="${C.gold}"/><rect x="307" y="405" width="142" height="164" rx="12" fill="#243e38" stroke="${C.blue}"/>`;
   for(let i=0;i<4;i++)m+=`<path d="M120 ${440+i*26}Q155 ${425+i*26}185 ${440+i*26}" stroke="${C.gold}" stroke-width="3" fill="none" opacity="${.45+.4*Math.sin(time*2+i)**2}"/>`;
   m+=`<circle cx="378" cy="464" r="29" fill="none" stroke="${C.blue}" stroke-width="2"/><path d="M365 492v21h26v-21" fill="none" stroke="${C.blue}" stroke-width="2"/>`;
   m+=text(162,620,'2000 W',29,C.gold,'middle')+text(378,620,'100 W',29,C.blue,'middle');m+=text(270,699,index===0?'还缺一个条件：用了多久？':'功率：此刻消耗电能有多快',17,C.ink,'middle');return m;}
  const values=[index===2?.1*ease(progress*1.4):.1,index===2?0:index===3?.2*ease(progress*1.4):.2],xs=[195,365],max=.2,base=650,height=240;
  m+=text(92,345,'累计电量 / kWh',14,C.muted);
  for(const v of [0,.1,.2]){const y=base-v/max*height;m+=line({x:125,y},{x:468,y},C.line,1,'opacity=".45"')+text(110,y+5,v.toFixed(1),12,C.muted,'end');}
  for(let i=0;i<2;i++){const h=values[i]/max*height,fill=i?C.blue:C.gold;m+=`<rect x="${xs[i]-42}" y="${base-h}" width="84" height="${Math.max(h,.5)}" rx="5" fill="${fill}" opacity=".75"/>`+text(xs[i],base-h-17,values[i].toFixed(2),24,fill,'middle')+text(xs[i],680,i?'100 W · 2 小时':'2000 W · 3 分钟',13,fill,'middle');}
  if(index>=4)m+=text(270,736,'电量 = 恒定功率 × 使用时间',18,C.ink,'middle');else m+=text(270,736,index===2?'2 kW × 0.05 h = 0.10 kWh':'0.10 kW × 2 h = 0.20 kWh',17,C.ink,'middle');
  return m;
 }
 get stats(){return {renderedFrames:this.frames,averageDrawMs:this.frames?this.totalMs/this.frames:0,drawCalls:this.renderer?.info.render.calls||0,triangles:this.renderer?.info.render.triangles||0}}
}
