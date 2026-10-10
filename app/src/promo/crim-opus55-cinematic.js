const SEED = 0x2F6A8B;
let _rng = SEED;
function rand() {
  _rng = (1664525 * _rng + 1013904223) | 0;
  return (_rng >>> 0) / 4294967296;
}
function resetRand() { _rng = SEED; }

function ease(t, p = 2) {
  return t < 0.5 ? Math.pow(2 * t, p) / 2 : 1 - Math.pow(2 * (1 - t), p) / 2;
}

const SUBTITLE_LINES = [
  { start: 0.5, end: 4.0, text: "案件编号零七九。现场警戒，物证封锁。", words: [
    { w: "案件编号", start: 0.5, end: 1.3 },
    { w: "零七九", start: 1.3, end: 2.1 },
    { w: "现场警戒", start: 2.3, end: 3.1 },
    { w: "物证封锁", start: 3.1, end: 4.0 }
  ]},
  { start: 4.4, end: 7.8, text: "在紫外光下，微量物证正在苏醒。", words: [
    { w: "在紫外光下", start: 4.4, end: 5.6 },
    { w: "微量物证", start: 5.7, end: 6.7 },
    { w: "正在苏醒", start: 6.8, end: 7.8 }
  ]},
  { start: 8.2, end: 12.3, text: "指纹回路，弹道膛线，血液喷溅的抛物线。", words: [
    { w: "指纹回路", start: 8.2, end: 9.3 },
    { w: "弹道膛线", start: 9.4, end: 10.4 },
    { w: "血液喷溅", start: 10.5, end: 11.5 },
    { w: "抛物线", start: 11.5, end: 12.3 }
  ]},
  { start: 12.5, end: 16.7, text: "洛卡德物质交换定律：凡走过，必留下痕迹。", words: [
    { w: "洛卡德", start: 12.5, end: 13.3 },
    { w: "物质交换定律", start: 13.3, end: 14.6 },
    { w: "凡走过", start: 14.8, end: 15.6 },
    { w: "必留下痕迹", start: 15.6, end: 16.7 }
  ]},
  { start: 17.0, end: 21.1, text: "行为侧写，动机解构，尸体在冷光中供述。", words: [
    { w: "行为侧写", start: 17.0, end: 18.0 },
    { w: "动机解构", start: 18.1, end: 19.1 },
    { w: "尸体", start: 19.3, end: 19.9 },
    { w: "在冷光中供述", start: 19.9, end: 21.1 }
  ]},
  { start: 21.5, end: 24.5, text: "无声的证据，拼凑出罪恶的轮廓。", words: [
    { w: "无声的证据", start: 21.5, end: 22.8 },
    { w: "拼凑出", start: 22.9, end: 23.5 },
    { w: "罪恶的轮廓", start: 23.5, end: 24.5 }
  ]},
  { start: 24.8, end: 26.8, text: "这里是——犯罪学。", words: [
    { w: "这里是", start: 24.8, end: 25.5 },
    { w: "犯罪学", start: 25.6, end: 26.8 }
  ]},
  { start: 28.2, end: 32.0, text: "真相永不泯灭。结案，归档。", words: [
    { w: "真相", start: 28.2, end: 28.8 },
    { w: "永不泯灭", start: 28.8, end: 29.8 },
    { w: "结案", start: 30.0, end: 30.7 },
    { w: "归档", start: 30.8, end: 31.8 }
  ]}
];

export function createFilm(THREE, canvas, overlay) {
  const ctx = overlay.getContext('2d');
  
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x090908);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  
  const camera = new THREE.PerspectiveCamera(50, 1920 / 1080, 0.1, 1000);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x090908, 20, 80);
  
  const BLACK = 0x090908;
  const BONE = 0xEBE6DC;
  const ORANGE = 0xFF6B35;
  
  scene.background = new THREE.Color(BLACK);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3.2);
  keyLight.position.set(10, 15, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.left = -25; keyLight.shadow.camera.right = 25;
  keyLight.shadow.camera.top = 25; keyLight.shadow.camera.bottom = -25;
  keyLight.shadow.camera.far = 90; keyLight.shadow.normalBias = .025;
  scene.add(keyLight);
  
  const rimLight = new THREE.DirectionalLight(ORANGE, 0.8);
  rimLight.position.set(-8, 5, -8);
  scene.add(rimLight);
  
  const fillLight = new THREE.DirectionalLight(0xFFBB88, 0.5);
  fillLight.position.set(-5, 8, 12);
  scene.add(fillLight);
  
  // Scene groups
  const sceneGroups = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    sceneGroups.push(g);
  }
  
  // Create text texture
  function createTextTexture(text, fontSize = 120, color = '#EBE6DC', bgAlpha = 0) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = text.length === 1 ? 512 : 1024;
    tempCanvas.height = 512;
    if (text.length === 1) fontSize = 420;
    
    tempCtx.fillStyle = `rgba(5,7,12,${bgAlpha})`;
    tempCtx.fillRect(0, 0, 1024, 512);
    
    tempCtx.font = `bold ${fontSize}px "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`;
    tempCtx.fillStyle = color;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, tempCanvas.width / 2, 256);
    
    const texture = new THREE.CanvasTexture(tempCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  
  function createDetailTexture(lines, fontSize = 32) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    
    tempCtx.scale(.5, .5);
    tempCtx.fillStyle = '#EBE6DC';
    tempCtx.fillRect(0, 0, 1024, 1024);
    
    tempCtx.fillStyle = '#0A0D12';
    tempCtx.strokeStyle = '#0A0D12';
    tempCtx.lineWidth = 2;
    
    for (let i = 0; i < 8; i++) {
      tempCtx.beginPath();
      tempCtx.moveTo(50, 100 + i * 110);
      tempCtx.lineTo(974, 100 + i * 110);
      tempCtx.stroke();
    }
    
    tempCtx.font = `${fontSize}px "PingFang SC", sans-serif`;
    tempCtx.textAlign = 'left';
    tempCtx.textBaseline = 'top';
    
    lines.forEach((line, i) => {
      tempCtx.fillText(line, 60, 110 + i * 110);
    });
    
    tempCtx.fillStyle = '#FF6B35';
    tempCtx.fillRect(900, 50, 80, 20);
    tempCtx.fillRect(50, 950, 200, 30);
    
    const texture = new THREE.CanvasTexture(tempCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  
  resetRand();
  
  // SCENE 1: Archives Canyon
  const archives = [];
  for (let i = 0; i < 45; i++) {
    const lines = [`档案 ${String(i + 1001).padStart(5, '0')}`, `分类: ${['现场资料', '访谈记录', '研究样本'][i % 3]}`, `状态: ${['已归档', '待审', '处理中'][i % 3]}`];
    const tex = createDetailTexture(lines, 28);
    const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8, metalness: 0.1 });
    const geo = new THREE.BoxGeometry(2.5, 3.5, 0.08);
    const mesh = new THREE.Mesh(geo, mat);
    
    const row = Math.floor(i / 9);
    const col = i % 9;
    const bank=i%2===0?-1:1;
    mesh.position.set(bank*5.5,(Math.floor(i/2)%3-1)*3.8,-10-Math.floor(i/6)*5);
    mesh.rotation.y=-bank*Math.PI*.30+(rand()-.5)*.15;
    sceneGroups[0].add(mesh);
    archives.push(mesh);
  }
  
  const orangeTrail = new THREE.Group();
  sceneGroups[0].add(orangeTrail);
  const trailGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const trailMat = new THREE.MeshBasicMaterial({ color: ORANGE });
  for (let i = 0; i < 30; i++) {
    const seg = new THREE.Mesh(trailGeo, trailMat);
    orangeTrail.add(seg);
  }
  
  // SCENE 2: Fingerprint ridges
  const ridges = [];
  const ridgeGroup = new THREE.Group();
  sceneGroups[1].add(ridgeGroup);
  
  for (let i = 0; i < 64; i++) {
    const points = [], r = .15 + i * .041;
    for (let j = 0; j <= 96; j++) {
      const angle = j / 96 * Math.PI * 2;
      const warp = .13 * Math.sin(angle * 2) * (1 - i / 80);
      points.push(new THREE.Vector3(r * Math.cos(angle) + warp, r * 1.3 * Math.sin(angle) + .10 * Math.sin(angle * 3), .035 * Math.sin(angle * 2) + i * .003));
    }
    const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.016,5,false);
    const tube = new THREE.Mesh(tubeGeo,new THREE.MeshStandardMaterial({color:i%8===0?ORANGE:BONE,roughness:.38,metalness:.35}));
    ridgeGroup.add(tube);ridges.push(tube);
  }
  ridgeGroup.rotation.x = -Math.PI / 2; ridgeGroup.position.y = .2;
  
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x36332f, roughness: 0.7, metalness: 0.2 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 12), tableMat);
  table.position.y = -1;
  sceneGroups[1].add(table);
  
  const evidenceMat = new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.4, roughness: 0.4 });
  const evidenceBits = [];
  for (let i = 0; i < 20; i++) {
    const bit = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), evidenceMat);
    bit.position.set((rand() - 0.5) * 4, (rand() - 0.5) * 2, (rand() - 0.5) * 4);
    sceneGroups[1].add(bit);
    evidenceBits.push(bit);
  }
  
  // SCENE 3: Causal structure domains
  const domains = [];
  const domainConfigs = [
    { radius: 3, structure: 'layers', count: 8, color: 0x686058 },
    { radius: 5, structure: 'grid', count: 12, color: 0x4c4540 },
    { radius: 7, structure: 'web', count: 16, color: 0x36332f },
    { radius: 9, structure: 'gates', count: 10, color: 0x25211e }
  ];
  
  domainConfigs.forEach((cfg, idx) => {
    const domainGroup = new THREE.Group();
    const angle = (idx / 4) * Math.PI * 2;
    domainGroup.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
    sceneGroups[2].add(domainGroup);
    
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.3 });
    
    if (cfg.structure === 'layers') {
      for (let i = 0; i < cfg.count; i++) {
        const layer = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), mat);
        layer.position.y = i * 0.4 - cfg.count * 0.2;
        domainGroup.add(layer);
      }
    } else if (cfg.structure === 'grid') {
      for (let i = 0; i < cfg.count; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 0.1), mat);
        const gridAngle = (i / cfg.count) * Math.PI * 2;
        bar.position.set(Math.cos(gridAngle) * 1.5, 0, Math.sin(gridAngle) * 1.5);
        domainGroup.add(bar);
      }
    } else if (cfg.structure === 'web') {
      for (let i = 0; i < cfg.count; i++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 6), mat);
        const webAngle = (i / cfg.count) * Math.PI * 2;
        spoke.position.set(Math.cos(webAngle) * 1, 0, Math.sin(webAngle) * 1);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.y = webAngle;
        domainGroup.add(spoke);
      }
    } else {
      for (let i = 0; i < cfg.count; i++) {
        const gate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), mat);
        gate.position.set((i % 5 - 2) * 0.6, 0, Math.floor(i / 5) * 0.6 - 0.6);
        domainGroup.add(gate);
      }
    }
    
    domains.push(domainGroup);
  });
  
  const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const coreMat = new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.8 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  sceneGroups[2].add(core);
  
  const connections = [];
  for (let i = 0; i < 4; i++) {
    const connMat = new THREE.LineBasicMaterial({ color: ORANGE, linewidth: 2 });
    const points = [];
    const angle = (i / 4) * Math.PI * 2;
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(Math.cos(angle) * 8, 0, Math.sin(angle) * 8));
    const connGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(connGeo, connMat);
    sceneGroups[2].add(line);
    connections.push(line);
  }
  
  // SCENE 4: Broken surface
  const paperShape = new THREE.Shape();
  paperShape.moveTo(-4,-3);paperShape.lineTo(4,-3);paperShape.lineTo(4,3);paperShape.lineTo(-4,3);paperShape.closePath();
  const hole = new THREE.Path();
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const r=1.2+.15*Math.sin(i*2.7);if(i===0)hole.moveTo(Math.cos(a)*r,Math.sin(a)*r);else hole.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
  hole.closePath();paperShape.holes.push(hole);
  const brokenGeo = new THREE.ExtrudeGeometry(paperShape,{depth:.22,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:1,steps:1});
  const brokenMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide });
  const brokenSurface = new THREE.Mesh(brokenGeo, brokenMat);
  sceneGroups[3].add(brokenSurface);
  
  const gapGeo = new THREE.BoxGeometry(2, 2.5, 0.32);
  const gapMat = new THREE.MeshBasicMaterial({ color: BLACK, side: THREE.DoubleSide });
  const gap = new THREE.Mesh(gapGeo, gapMat);
  gap.position.z = 0; gap.visible = false;
  sceneGroups[3].add(gap);
  
  const supportStructures = [];
  const supportPositions = [
    [3, 2, 0], [-3, 2, 0], [3, -2, 0], [-3, -2, 0]
  ];
  supportPositions.forEach(pos => {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x686058, roughness: 0.5, metalness: 0.4 }));
    support.position.set(...pos);
    sceneGroups[3].add(support);
    supportStructures.push(support);
  });
  
  const weaveMat = new THREE.LineBasicMaterial({ color: ORANGE, linewidth: 1 });
  const weaveLines = [];
  for (let i = 0; i < 20; i++) {
    const pts = [
      new THREE.Vector3((rand() - 0.5) * 8, (rand() - 0.5) * 6, 0.3),
      new THREE.Vector3((rand() - 0.5) * 8, (rand() - 0.5) * 6, 0.3)
    ];
    const weaveGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(weaveGeo, weaveMat);
    sceneGroups[3].add(line);
    weaveLines.push(line);
  }
  
  // SCENE 5: City blocks
  const cityGroup = new THREE.Group();
  sceneGroups[4].add(cityGroup);
  
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x36332f, roughness: 0.8, metalness: 0.2 });
  const buildings = [];
  for (let i = 0; i < 40; i++) {
    const w = 1.5 + rand() * 1;
    const h = 2 + rand() * 6;
    const d = 1.5 + rand() * 1;
    const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
    const x = (i % 8 - 4) * 4 + 2;
    const z = (Math.floor(i / 8) - 2.5) * 4;
    building.position.set(x, h / 2, z);
    building.castShadow = true;
    cityGroup.add(building);
    buildings.push({ mesh: building, x, z });
  }
  
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x25211e, roughness: 0.9 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  cityGroup.add(ground);
  
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x4c4540, roughness: 0.7 });
  const roadGeo = new THREE.PlaneGeometry(2, 50);
  for (let i = -2; i <= 2; i++) {
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(i * 8, 0.01, 0);
    cityGroup.add(road);
  }
  
  const orangePath = [];
  for (let i = 0; i < 50; i++) {
    const pt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: ORANGE }));
    pt.position.set(0, 0.1, (i - 25) * 1); pt.visible = false;
    cityGroup.add(pt);
    orangePath.push(pt);
  }
  
  // SCENE 6: Justice machinery
  const machineryGroup = new THREE.Group();
  sceneGroups[5].add(machineryGroup);
  
  const axisMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.3, metalness: 0.7 });
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 16), axisMat);
  axis.rotation.z = Math.PI / 2;
  machineryGroup.add(axis);
  
  const blockMatL = new THREE.MeshStandardMaterial({ color: 0x686058, roughness: 0.5, metalness: 0.4 });
  const blockMatR = new THREE.MeshStandardMaterial({ color: 0x36332f, roughness: 0.5, metalness: 0.4 });
  
  const leftBlocks = [];
  for (let i = 0; i < 5; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), blockMatL);
    block.position.set(-3 - i * 1.2, 0, (i - 2) * 0.5);
    machineryGroup.add(block);
    leftBlocks.push(block);
  }
  
  const rightBlocks = [];
  for (let i = 0; i < 5; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), blockMatR);
    block.position.set(3 + i * 1.2, 0, (i - 2) * 0.5);
    machineryGroup.add(block);
    rightBlocks.push(block);
  }
  
  const pivotMat = new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.6 });
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), pivotMat);
  machineryGroup.add(pivot);
  
  const scaleMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.6, metalness: 0.4 });
  const scaleMarks = [];
  for (let i = 0; i < 10; i++) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), scaleMat);
    mark.position.set((i - 4.5) * 0.8, -2, 0);
    machineryGroup.add(mark);
    scaleMarks.push(mark);
  }
  
  // SCENE 7: Finale assembly
  const fragmentGroup = new THREE.Group();
  sceneGroups[6].add(fragmentGroup);
  
  const titleTextures = [
    createTextTexture('犯', 160, '#EBE6DC', 0),
    createTextTexture('罪', 160, '#EBE6DC', 0),
    createTextTexture('学', 160, '#EBE6DC', 0)
  ];
  
  const titlePlanes = [];
  titleTextures.forEach((tex, i) => {
    const planeMat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, roughness: 0.8, metalness: 0, emissive:0x777064, emissiveIntensity:.25 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), planeMat);
    plane.position.set((i - 1) * 5, 0, 0);
    fragmentGroup.add(plane);
    titlePlanes.push(plane);
  });
  
  const fragments = [];
  for (let i = 0; i < 30; i++) {
    const fragMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? BONE : 0x686058, roughness: 0.6, metalness: 0.3 });
    const frag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), fragMat);
    fragmentGroup.add(frag);
    fragments.push({ mesh: frag, targetIdx: i % 3, offset: { x: (rand() - 0.5) * 2, y: (rand() - 0.5) * 2, z: (rand() - 0.5) * 2 }});
  }
  
  const finalOrangeLines = [];
  for (let i = 0; i < 10; i++) {
    const lineMat = new THREE.LineBasicMaterial({ color: ORANGE, linewidth: 2 });
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(lineGeo, lineMat);
    fragmentGroup.add(line);
    finalOrangeLines.push(line);
  }
  

  const heroFile = new THREE.Group(); heroFile.position.set(0,0,-8); sceneGroups[0].add(heroFile);
  const heroPaper = new THREE.Mesh(new THREE.BoxGeometry(3.6,5,.13),archives[22].material); heroFile.add(heroPaper);
  const hinge = new THREE.Group(); hinge.position.set(-1.8,0,.1); heroFile.add(hinge);
  const heroCover = new THREE.Mesh(new THREE.BoxGeometry(3.6,5,.08),archives[11].material); heroCover.position.x=1.8;hinge.add(heroCover);
  const heroSeal = new THREE.Mesh(new THREE.BoxGeometry(.08,4.8,.03),new THREE.MeshBasicMaterial({color:ORANGE}));heroSeal.position.set(1.74,0,.16);heroFile.add(heroSeal);

  const scan = new THREE.Mesh(new THREE.BoxGeometry(7,.035,.055),new THREE.MeshBasicMaterial({color:ORANGE,transparent:true,opacity:.8}));scan.position.y=.7;sceneGroups[1].add(scan);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7,.025,5,80),new THREE.MeshBasicMaterial({color:0x666057}));ring.rotation.x=-Math.PI/2;ring.position.y=-.75;sceneGroups[1].add(ring);

  const domainLabels = [];
  ['个体','环境','机会','社会关系'].forEach((text,i)=>{
    const label=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.7),new THREE.MeshBasicMaterial({map:createTextTexture(text,170),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    label.position.copy(domains[i].position);label.position.y=3.2;sceneGroups[2].add(label);domainLabels.push(label);
  });
  const coreCage=new THREE.Mesh(new THREE.IcosahedronGeometry(2.0,1),new THREE.MeshBasicMaterial({color:BONE,wireframe:true,transparent:true,opacity:.45}));sceneGroups[2].add(coreCage);

  const windowCanvas=document.createElement('canvas');windowCanvas.width=256;windowCanvas.height=512;
  const wc=windowCanvas.getContext('2d');wc.fillStyle='#45413c';wc.fillRect(0,0,256,512);
  for(let r=0;r<16;r++)for(let c=0;c<6;c++){wc.fillStyle=(r*7+c)%9===0?'#bc7550':'#938778';wc.fillRect(10+c*41,10+r*31,16,19);}
  const windowTexture=new THREE.CanvasTexture(windowCanvas);windowTexture.colorSpace=THREE.SRGBColorSpace;
  buildingMat.map=windowTexture;buildingMat.color.setHex(0xbcb3a3);buildingMat.roughness=.6;buildingMat.needsUpdate=true;
  const roofs=[];
  buildings.forEach(({mesh})=>{const dim=mesh.geometry.parameters;const roof=new THREE.Mesh(new THREE.BoxGeometry(dim.width+.07,.1,dim.depth+.07),new THREE.MeshStandardMaterial({color:0x615b51,roughness:.7}));roof.position.set(mesh.position.x,dim.height+.04,mesh.position.z);cityGroup.add(roof);roofs.push(roof);});
  const streetCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.1,-23),new THREE.Vector3(0,.1,3),new THREE.Vector3(0,.1,10),new THREE.Vector3(8,.1,10),new THREE.Vector3(8,.1,17)],false,'catmullrom',.01);
  const streetGeometry=new THREE.TubeGeometry(streetCurve,100,.06,6,false);
  const street=new THREE.Mesh(streetGeometry,new THREE.MeshBasicMaterial({color:ORANGE}));cityGroup.add(street);
  const plazas=[];
  for(const x of [-8,0,8]){const plaza=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.06,32),new THREE.MeshStandardMaterial({color:ORANGE,emissive:ORANGE,emissiveIntensity:.2,roughness:.7}));plaza.position.set(x,.05,10);cityGroup.add(plaza);plazas.push(plaza);}

  const base=new THREE.Mesh(new THREE.BoxGeometry(8,.4,4),axisMat);base.position.y=-3;machineryGroup.add(base);
  const stem=new THREE.Mesh(new THREE.BoxGeometry(.45,3,.45),axisMat);stem.position.y=-1.4;machineryGroup.add(stem);
  const mechanismLabels=[];
  ['证据','程序'].forEach((text,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5),new THREE.MeshBasicMaterial({map:createTextTexture(text,180),transparent:true,side:THREE.DoubleSide}));m.position.set(i===0?-5:5,2,0);machineryGroup.add(m);mechanismLabels.push(m);});

  fragments.forEach(f=>f.mesh.position.set((f.targetIdx-1)*5,0,-.08));
  const titleBackings=[];
  titlePlanes.forEach((plane,i)=>{const backing=new THREE.Mesh(new THREE.BoxGeometry(3.6,3.6,.24),new THREE.MeshStandardMaterial({color:0x24201c,roughness:.4,metalness:.5}));backing.position.copy(plane.position);backing.position.z=-.15;fragmentGroup.add(backing);titleBackings.push(backing);});
  orangeTrail.visible=false;
  const poses=[];
  sceneGroups.forEach(g=>g.traverse(o=>poses.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),visible:o.visible})));
  
  // Render function
  function render(t) {
    t=clamp(Number(t)||0,0,42-1e-5);
    for(const v of poses){v.o.position.copy(v.p);v.o.quaternion.copy(v.q);v.o.scale.copy(v.s);v.o.visible=v.visible;}
    camera.up.set(0,1,0);
    scene.background.setHex(BLACK);scene.fog.color.setHex(BLACK);
    if(ctx.reset)ctx.reset();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;
    // Clear overlay
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.restore();
    
    const scaleX = overlay.width / 1920;
    const scaleY = overlay.height / 1080;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    
    const shade=ctx.createLinearGradient(0,760,0,1080);
    shade.addColorStop(0,'rgba(5,5,5,0)');shade.addColorStop(1,'rgba(5,5,5,.78)');
    ctx.fillStyle=shade;ctx.fillRect(0,760,1920,320);
    ctx.font = 'bold 90px "PingFang SC", sans-serif';
    ctx.fillStyle = '#EBE6DC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Determine scene
    const sceneIdx = Math.floor(t / 6);
    sceneGroups.forEach((g, i) => {
      g.visible = (i === sceneIdx);
    });
    
    const localT = t - sceneIdx * 6;
    
    // Scene 1: Archives
    if (sceneIdx === 0) {
      if (localT < 1.5) {
        // Shot 1: Canyon wide
        const st = localT / 1.5;
        const et = ease(st, 3);
        camera.position.set(1.5-et,4-et,14-et*5);
        camera.lookAt(0, 0, -20);
        camera.fov = 60;
        ctx.textAlign='left';ctx.fillText('一桩案件',120,880);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('远不止一个答案',120,970);
      } else if (localT < 3.5) {
        // Shot 2: Fly through
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        camera.position.set(.45*Math.sin(st*Math.PI),2-et,10-et*37);
        camera.lookAt(0, 0, -30);
        camera.fov = 70;
      } else {
        // Shot 3: Cover opens with orange trail
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 2);
        camera.position.set(4 - et * 2, 1, -.5 - et * 2);
        camera.lookAt(0, 0, -8);
        hinge.rotation.y=-1.45*et;
        camera.fov = 50;
        
        orangeTrail.visible = true;
        for (let i = 0; i < 30; i++) {
          const seg = orangeTrail.children[i];
          const progress = clamp((et * 30 - i) / 5, 0, 1);
          seg.position.set(-2 + i * 0.3, 0.5 + Math.sin(i * 0.5) * 0.3, -8 + i * 0.2);
          seg.scale.set(progress, progress, progress);seg.rotation.z=-Math.PI/2;
        }
      }
      
      ctx.font = '26px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('犯罪学', 80, 80);
      ctx.font = '20px "PingFang SC", sans-serif';
      ctx.fillText('看见真相 理解原因', 80, 115);
    }
    
    // Scene 2: Fingerprint
    if (sceneIdx === 1) {
      if (localT < 1.5) {
        // Shot 1: Observatory wide
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(8 - et * 3, 6 - et * 2, 8 - et * 3);
        camera.lookAt(0, 0, 0);
        camera.fov = 55;
        ctx.textAlign='left';ctx.fillText('让事实',140,920);
      } else if (localT < 3.5) {
        // Shot 2: Enter ridge close
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        camera.position.set(1.8 - et, 1.35, 2.0 - et * .8);
        camera.lookAt(.7,.2,.4);
        camera.fov = 45 - et * 10;
        ctx.textAlign='right';ctx.fillText('有据可循',1780,920);
      } else {
        // Shot 3: Micro scan
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 2);
        camera.position.set(1.1 + Math.cos(et*Math.PI)*.5,1.0,1.6 + Math.sin(et*Math.PI)*.4);
        camera.lookAt(.4,.2,.1);
        camera.fov = 35;
        
        evidenceBits.forEach((bit, i) => {
          const phase = (et + i * 0.1) % 1;
          bit.scale.setScalar(1 + Math.sin(phase * Math.PI) * 0.5);
        });
      }
      
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('概念示意', 1840, 1020);
    }
    
    // Scene 3: Causal structure
    if (sceneIdx === 2) {
      if (localT < 1.5) {
        // Shot 1: System wide
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(4-et*2,11-et*3,21-et*6);
        camera.lookAt(0, 0, 0);
        camera.fov = 60;
        ctx.textAlign='left';ctx.fillText('追问犯罪',140,880);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('如何发生',140,970);
      } else if (localT < 3.5) {
        // Shot 2: Side parallax
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        const angle = et * Math.PI * 0.5;
        camera.position.set(Math.sin(angle) * 20, 5, Math.cos(angle) * 20);
        camera.lookAt(0, 0, 0);
        camera.fov = 50;
        
        domains.forEach((d, i) => {
          d.rotation.y = t * 0.3 + i * Math.PI / 2;
        });
      } else {
        // Shot 3: Dive into core
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 3);
        camera.position.set(2 * et, 6 * (1 - et) + 1.5, 10 * (1 - et) + 4);
        camera.lookAt(0, 0, 0);
        camera.fov = 40 + et * 30;
        
        core.scale.setScalar(1 + et * 0.5);
      }
      
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('概念示意', 1840, 1020);
    }
    
    // Scene 4: Broken surface
    if (sceneIdx === 3) {
      if (localT < 1.5) {
        // Shot 1: Surface float wide
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(0, 8 - et * 3, 12 - et * 4);
        camera.lookAt(0, 0, 0);
        camera.fov = 55;
        brokenSurface.rotation.y = et * 0.3;
        ctx.textAlign='left';ctx.fillText('看见伤害',140,880);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('也看见需要',140,970);
      } else if (localT < 3.5) {
        // Shot 2: Side sweep across gap
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        camera.position.set(-5 + et * 10, 2, 5);
        camera.lookAt(0, 0, 0);
        camera.fov = 45;
        brokenSurface.rotation.y = 0.3;
      } else {
        // Shot 3: Weave close
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 2);
        camera.position.set(4 - et * 2, 1, 4.5 - et * .8);
        camera.lookAt(0, 0, 0);
        camera.fov = 40;
        
        supportStructures.forEach((s, i) => {
          s.scale.y = 1 + et * 0.5;
        });
      }
    }
    
    // Scene 5: City
    if (sceneIdx === 4) {
      if (localT < 1.5) {
        // Shot 1: Street level
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(0, 2, -20 + et * 15);
        camera.lookAt(0, 2, 0);
        camera.fov = 60;
        ctx.textAlign='left';ctx.fillText('把研究',140,880);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('变成更早的保护',140,970);
      } else if (localT < 3.5) {
        // Shot 2: Dive along street
        const st = (localT - 1.5) / 2;
        const et = ease(st, 3);
        camera.position.set(0, 5 - et * 3, -12 + et * 18);
        camera.lookAt(0, 2, 15);
        camera.fov = 70;
        
        orangePath.forEach((pt, i) => {
          const progress = clamp((et * 50 - i) / 10, 0, 1);
          pt.scale.setScalar(progress);
        });
      } else {
        // Shot 3: Bird's eye
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 2);
        camera.position.set(10 - et * 8, 26 + et * 10, 14 - et * 12);
        camera.up.set(0,0,-1);camera.lookAt(0, 0, 0);
        camera.fov = 55;
      }
      
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('概念示意', 1840, 1020);
    }
    
    // Scene 6: Justice machinery
    if (sceneIdx === 5) {
      if (localT < 1.5) {
        // Shot 1: Machinery deploy
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(0, 10 - et * 5, 15 - et * 5);
        camera.lookAt(0, 0, 0);
        camera.fov = 55;
        
        leftBlocks.forEach((b, i) => {
          b.position.x = -3 - i * 1.2 - (1 - et) * 10;
        });
        rightBlocks.forEach((b, i) => {
          b.position.x = 3 + i * 1.2 + (1 - et) * 10;
        });
        
        ctx.textAlign='left';ctx.fillText('以事实为基础',140,920);
      } else if (localT < 3.5) {
        // Shot 2: Collision and calibration
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        camera.position.set(12 - et * 8, 3, 0);
        camera.lookAt(0, 0, 0);
        camera.fov = 50;
        
        const swing = Math.sin(et * Math.PI * 2) * 0.3 * (1 - et);
        machineryGroup.rotation.z = swing;
        
        ctx.textAlign='right';ctx.fillText('以公平为尺度',1780,920);
      } else {
        // Shot 3: Precision detail
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 2);
        camera.position.set(2 - et, 1, 3 - et);
        camera.lookAt(0, 0, 0);
        camera.fov = 40;
        
        machineryGroup.rotation.z = 0;
      }
    }
    
    // Scene 7: Finale
    if (sceneIdx === 6) {
      if (localT < 1.5) {
        // Shot 1: Fragments close
        const st = localT / 1.5;
        const et = ease(st, 2);
        camera.position.set(5 - et * 3, 2, 5 - et * 3);
        camera.lookAt(0, 0, 0);
        camera.fov = 55;
        
        fragments.forEach((f, i) => {
          const 散开 = 1 - et;
          f.mesh.position.set(
            (f.targetIdx - 1) * 5 + f.offset.x * 散开 * 10,
            f.offset.y * 散开 * 10,
            f.offset.z * 散开 * 5
          );
          f.mesh.rotation.x = 散开 * Math.PI * 2;
          f.mesh.rotation.y = 散开 * Math.PI * 3;
        });
        
        titlePlanes.forEach((p, i) => {
          p.scale.setScalar(et);
        });
      } else if (localT < 3.5) {
        // Shot 2: Pull back reveal
        const st = (localT - 1.5) / 2;
        const et = ease(st, 2);
        camera.position.set(0, 5 - et * 3, 15 - et * 5);
        camera.lookAt(0, 0, 0);
        camera.fov = 50 + et * 10;
        
        fragments.forEach(f => {
          f.mesh.scale.setScalar(et * 0.3);
        });
        
        titlePlanes.forEach((p, i) => {
          p.scale.setScalar(1);
        });
        
        finalOrangeLines.forEach((line, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const radius = 10 * et;
          const positions = line.geometry.attributes.position;
          positions.setXYZ(0, 0, 0, 0);
          positions.setXYZ(1, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          positions.needsUpdate = true;
        });
        
        ctx.fillText('理解犯罪', 960, 880);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('让社会更安全', 960, 960);
      } else {
        // Shot 3: Slam and hold
        const st = (localT - 3.5) / 2.5;
        const et = ease(st, 4);
        const slam = st < 0.4 ? ease(st / 0.4, 3) : 1;
        camera.position.set(0, 2, 10 - slam * 2);
        camera.lookAt(0, 0, 0);
        camera.fov = 50 + slam * 10;
        
        titlePlanes.forEach((p, i) => {
          p.position.z = slam * 0.5;
        });
        
        finalOrangeLines.forEach((line, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const radius = 10 + slam * 5;
          const positions = line.geometry.attributes.position;
          positions.setXYZ(0, 0, 0, 0);
          positions.setXYZ(1, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          positions.needsUpdate = true;
        });
        
        ctx.font='72px \"PingFang SC\",sans-serif';ctx.fillText('理解犯罪，让社会更安全',960,900);
        ctx.font = '60px "PingFang SC", sans-serif';
        ctx.fillText('看见真相 理解原因', 960, 960);
      }
    }
    
    // Additional staging follows absolute time, including direct seeks.
    if(sceneIdx===1)scan.position.z=-3+6*clamp((localT-1)/4,0,1);
    domainLabels.forEach(m=>{m.quaternion.copy(camera.quaternion);m.visible=localT<3.5;});
    heroFile.visible=sceneIdx===0&&localT>=3.5;
    mechanismLabels.forEach(m=>{m.quaternion.copy(camera.quaternion);m.visible=localT<1.5;});
    if(sceneIdx===4){
      streetGeometry.setDrawRange(0,Math.floor(clamp((localT-.8)/3,0,1)*streetGeometry.index.count/6)*6);
      plazas.forEach((p,i)=>p.material.emissiveIntensity=.15+1.8*clamp((localT-3.6-i*.25)/.5,0,1));
    }
    if(sceneIdx===6){
      finalOrangeLines.forEach(line=>line.visible=localT>=1.5);
      titleBackings.forEach((p,i)=>{p.scale.copy(titlePlanes[i].scale);p.position.z=titlePlanes[i].position.z-.16;});
      if(localT>=1.5)fragments.forEach(f=>{f.mesh.position.set((f.targetIdx-1)*5,0,-.08);f.mesh.visible=false;});
    }
    // Synchronized Subtitles Overlay
    const line = SUBTITLE_LINES.find(l => t >= l.start - 0.2 && t <= l.end + 0.5);
    if (line) {
      const fadeIn = clamp((t - (line.start - 0.2)) / 0.35, 0, 1);
      const fadeOut = clamp(((line.end + 0.5) - t) / 0.4, 0, 1);
      const alpha = fadeIn * fadeOut;
      ctx.save();
      ctx.globalAlpha = alpha;

      const fontSize = 34;
      ctx.font = `600 ${fontSize}px "PingFang SC", "Noto Sans CJK SC", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      let totalW = 0;
      const wordWidths = [], wordSpacings = [];
      for (let i = 0; i < line.words.length; i++) {
        const w = line.words[i];
        const mw = ctx.measureText(w.w).width;
        const space = i < line.words.length - 1 ? 16 : 0;
        wordWidths.push(mw);
        wordSpacings.push(space);
        totalW += mw + space;
      }

      const centerX = 960, centerY = 1000;
      const padX = 28, padY = 14;
      const boxW = Math.max(300, totalW + padX * 2);
      const boxH = fontSize + padY * 2;
      const boxX = centerX - boxW / 2;
      const boxY = centerY - boxH / 2;

      ctx.fillStyle = 'rgba(6, 10, 16, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      let curX = centerX - totalW / 2;
      for (let i = 0; i < line.words.length; i++) {
        const w = line.words[i];
        const mw = wordWidths[i];
        const isCurrent = t >= w.start && t <= w.end;
        const isPast = t > w.end;

        if (isCurrent) {
          ctx.fillStyle = '#FF5500';
          ctx.shadowColor = 'rgba(255, 85, 0, 0.65)';
          ctx.shadowBlur = 14;
        } else if (isPast) {
          ctx.fillStyle = 'rgba(235, 230, 220, 0.95)';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(235, 230, 220, 0.55)';
          ctx.shadowBlur = 0;
        }

        ctx.fillText(w.w, curX, centerY);
        curX += mw + wordSpacings[i];
      }
      ctx.restore();
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  
  function resize(width, height) {
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(pr);
    overlay.width = width * pr;
    overlay.height = height * pr;
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  
  function dispose() {
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
    for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
    keyLight.shadow.map?.dispose();renderer.dispose();
  }
  
  const scenes = [
    {
      name: '案件之外',
      start: 0,
      end: 6,
      shots: [
        { start: 0, end: 1.5, name: '远景：档案峡谷' },
        { start: 1.5, end: 3.5, name: '运动：高速穿行纸层' },
        { start: 3.5, end: 6, name: '特写：封面打开橙线冲出' }
      ]
    },
    {
      name: '证据的尺度',
      start: 6,
      end: 12,
      shots: [
        { start: 6, end: 7.5, name: '中景：指纹浮雕观察台' },
        { start: 7.5, end: 9.5, name: '近景：进入回路' },
        { start: 9.5, end: 12, name: '特写：微观证据扫描' }
      ]
    },
    {
      name: '原因的结构',
      start: 12,
      end: 18,
      shots: [
        { start: 12, end: 13.5, name: '远景：因果体系全貌' },
        { start: 13.5, end: 15.5, name: '中景：侧面视差分层' },
        { start: 15.5, end: 18, name: '近景：橙线穿入核心' }
      ]
    },
    {
      name: '看见缺席',
      start: 18,
      end: 24,
      shots: [
        { start: 18, end: 19.5, name: '中景：纸面悬浮' },
        { start: 19.5, end: 21.5, name: '侧面：掠过裂口' },
        { start: 21.5, end: 24, name: '近景：织线修复' }
      ]
    },
    {
      name: '预防的城市',
      start: 24,
      end: 30,
      shots: [
        { start: 24, end: 25.5, name: '低机位：街道穿行' },
        { start: 25.5, end: 27.5, name: '运动：俯冲沿橙线' },
        { start: 27.5, end: 30, name: '鸟瞰：公共空间点亮' }
      ]
    },
    {
      name: '公平的尺度',
      start: 30,
      end: 36,
      shots: [
        { start: 30, end: 31.5, name: '远景：机械展开' },
        { start: 31.5, end: 33.5, name: '中景：几何碰撞校正' },
        { start: 33.5, end: 36, name: '特写：精密刻度' }
      ]
    },
    {
      name: '犯罪学',
      start: 36,
      end: 42,
      shots: [
        { start: 36, end: 37.5, name: '特写：碎片汇聚' },
        { start: 37.5, end: 39.5, name: '远景：标题拉回' },
        { start: 39.5, end: 42, name: '正面：片名橙线爆发' }
      ]
    }
  ];
  
  return {
    duration: 42,
    scenes,
    render,
    resize,
    dispose,
    renderer,
    scene,
    camera
  };
}
