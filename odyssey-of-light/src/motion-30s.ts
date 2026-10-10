import * as THREE from 'three';
import { ease, prog, pulse, springStep, keys, hash } from '../../app/src/engine/util';

(window as any)['MotionUtil'] = { ease, prog, pulse, springStep, keys, hash };

// 30-Second 5-Beat Timeline:
// Beat 0 [0.0 - 6.5s]: 混沌与初光 (The Primal Ray & Camera Obscura)
// Beat 1 [6.5 - 11.6s]: 棱镜色散与微粒流 (Newton's Prism & Corpuscles)
// Beat 2 [11.6 - 17.6s]: 波动干涉与泊松亮斑 (Young's Slits & Poisson's Spot)
// Beat 3 [17.6 - 23.6s]: 麦克斯韦电磁波与光量子 (Maxwell EM & Photoelectric Quanta)
// Beat 4 [23.6 - 30.0s]: 量子双缝与波粒二象性 (Single-Photon Interference & Duality Climax)
const CUTS = [0, 6.5, 11.6, 17.6, 23.6, 30.0];

export function createLight30sScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor('#05080f', 1.0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#05080f', 0.02);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 150);
  camera.position.set(0, 0, 16);

  // Lighting
  scene.add(new THREE.AmbientLight('#bcd8e5', 1.2));
  const dirLight = new THREE.DirectionalLight('#ffffff', 3.0);
  dirLight.position.set(6, 12, 10);
  scene.add(dirLight);

  const cyanRim = new THREE.PointLight('#00e5ff', 30, 25);
  cyanRim.position.set(-6, 3, 5);
  scene.add(cyanRim);

  const goldRim = new THREE.PointLight('#ffd15c', 25, 25);
  goldRim.position.set(6, -2, 4);
  scene.add(goldRim);

  // Background Shader Plane (Grid + Light beams)
  const bgUniforms = { t: { value: 0 }, hue: { value: 0 } };
  const bgMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: bgUniforms,
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader: `precision highp float;varying vec2 v;uniform float t,hue;
void main(){
  vec2 p = (v - 0.5) * vec2(1.777, 1.0);
  vec2 q = p * 28.0 + vec2(t * 0.1, t * 0.08);
  vec2 g = abs(fract(q) - 0.5);
  float grid = smoothstep(0.46, 0.49, max(g.x, g.y));
  vec3 base = vec3(0.02, 0.03, 0.05) + vec3(0.04, 0.06, 0.08) * exp(-length(p) * 2.8);
  vec3 neon = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.8, 0.2), hue);
  base += neon * grid * 0.16;
  float beam = exp(-pow((p.x * 0.7 + p.y * 0.3 - sin(t * 0.6) * 0.4) / 0.03, 2.0));
  base += neon * beam * 0.22;
  gl_FragColor = vec4(base, 1.0);
}`
  });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgMesh.frustumCulled = false;
  bgMesh.renderOrder = -1000;
  scene.add(bgMesh);

  // Root hero group
  const hero = new THREE.Group();
  scene.add(hero);

  const groups: THREE.Group[] = Array.from({ length: 5 }, () => new THREE.Group());
  hero.add(...groups);

  // Helper line segment
  function makeSegments(coords: number[], color: number, opacity = 0.75) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
    return new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: 2 })
    );
  }

  // --------------------------------------------------------------------------
  // Beat 0: Camera Obscura (0.0s - 6.5s)
  // --------------------------------------------------------------------------
  const chamberBox = new THREE.BoxGeometry(8, 5, 5);
  const chamberLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(chamberBox),
    new THREE.LineBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.6 })
  );
  chamberLines.position.x = 1.5;
  groups[0].add(chamberLines);

  const pinholeWall = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 4.8),
    new THREE.MeshStandardMaterial({ color: 0x1a2634, roughness: 0.8 })
  );
  pinholeWall.rotation.y = Math.PI / 2;
  pinholeWall.position.set(-1.0, 0, 0);
  groups[0].add(pinholeWall);

  const flameGeo = new THREE.BufferGeometry();
  const flameCount = 180;
  const flamePos = new Float32Array(flameCount * 3);
  for (let i = 0; i < flameCount; i++) {
    flamePos[i * 3 + 0] = -5.0 + (Math.random() - 0.5) * 0.35;
    flamePos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
    flamePos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
  const flameParticles = new THREE.Points(
    flameGeo,
    new THREE.PointsMaterial({ color: 0xffa000, size: 0.16, transparent: true, opacity: 0.9 })
  );
  groups[0].add(flameParticles);

  const rayCoords = [
    -5.0, 0.9, 0, -1.0, 0, 0,
    -1.0, 0, 0, 5.5, -1.4, 0,
    -5.0, -0.9, 0, -1.0, 0, 0,
    -1.0, 0, 0, 5.5, 1.4, 0,
    -5.0, 0.0, 0, -1.0, 0, 0,
    -1.0, 0, 0, 5.5, 0.0, 0
  ];
  const rays = makeSegments(rayCoords, 0xffd15c, 0.85);
  groups[0].add(rays);

  // --------------------------------------------------------------------------
  // Beat 1: Newton's Prism (6.5s - 11.6s)
  // --------------------------------------------------------------------------
  const prismGeo = new THREE.CylinderGeometry(2.4, 2.4, 4.5, 3);
  const prismMesh = new THREE.Mesh(
    prismGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f7fa,
      transmission: 0.9,
      transparent: true,
      opacity: 0.85,
      roughness: 0.05,
      ior: 1.54,
      thickness: 2.2
    })
  );
  prismMesh.rotation.y = Math.PI / 6;
  groups[1].add(prismMesh);
  prismMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(prismGeo), new THREE.LineBasicMaterial({ color: 0x80deea })));

  const spectralColors = [0xff2a44, 0xff7f00, 0xffd700, 0x00e676, 0x00e5ff, 0x2979ff, 0x7c4dff];
  spectralColors.forEach((col, idx) => {
    const angle = -0.16 - idx * 0.07;
    const targetX = 8.5;
    const targetY = (targetX - 1.0) * Math.tan(angle);
    const specGeo = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0.8, 0.1, 0, targetX, targetY, 0], 3)
    );
    groups[1].add(new THREE.Line(specGeo, new THREE.LineBasicMaterial({ color: col, linewidth: 3 })));
  });

  const pCount = 280;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3 + 0] = -8 + Math.random() * 16;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    const c = new THREE.Color(spectralColors[i % spectralColors.length]);
    pCol[i * 3 + 0] = c.r;
    pCol[i * 3 + 1] = c.g;
    pCol[i * 3 + 2] = c.b;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const corpuscles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.85 })
  );
  groups[1].add(corpuscles);

  // --------------------------------------------------------------------------
  // Beat 2: Wave Interference & Poisson's Spot (11.6s - 17.6s)
  // --------------------------------------------------------------------------
  const wavePlaneGeo = new THREE.PlaneGeometry(12, 8, 80, 50);
  const wavePlane = new THREE.Mesh(
    wavePlaneGeo,
    new THREE.MeshStandardMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.55 })
  );
  wavePlane.rotation.x = -Math.PI / 3;
  wavePlane.position.set(-1, -1, 0);
  groups[2].add(wavePlane);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x37474f }));
  barrier.position.set(-3.5, 0, 0);
  groups[2].add(barrier);

  const poissonDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 0.06, 36),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
  );
  poissonDisk.rotation.z = Math.PI / 2;
  poissonDisk.position.set(1.5, 0, 0);
  groups[2].add(poissonDisk);

  const poissonSpot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
  poissonSpot.position.set(6.5, 0, 0);
  groups[2].add(poissonSpot);

  for (let r = 0.4; r <= 2.4; r += 0.5) {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.05, 48),
      new THREE.MeshBasicMaterial({ color: 0xff3d55, side: THREE.DoubleSide, transparent: true, opacity: 0.4 / (r * 0.9) })
    );
    ringMesh.rotation.y = Math.PI / 2;
    ringMesh.position.set(6.48, 0, 0);
    groups[2].add(ringMesh);
  }

  // --------------------------------------------------------------------------
  // Beat 3: Maxwell EM Wave & Photoelectric Quanta (17.6s - 23.6s)
  // --------------------------------------------------------------------------
  const segs = 200;
  const pE: THREE.Vector3[] = [];
  const pB: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const z = -7 + (i / segs) * 14;
    pE.push(new THREE.Vector3(0, 0, z));
    pB.push(new THREE.Vector3(0, 0, z));
  }
  const emLineE = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pE), new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 3 }));
  const emLineB = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pB), new THREE.LineBasicMaterial({ color: 0xffd15c, linewidth: 3 }));
  groups[3].add(emLineE, emLineB);

  // Photoelectric cathode plate
  const cathode = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 3.2), new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.9 }));
  cathode.position.set(-2.5, 0, 0);
  groups[3].add(cathode);

  const eGeo = new THREE.BufferGeometry();
  const eCount = 70;
  const ePos = new Float32Array(eCount * 3);
  for (let i = 0; i < eCount; i++) {
    ePos[i * 3 + 0] = -2.5 + Math.random() * 5.5;
    ePos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
    ePos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
  }
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const photoelectrons = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0xb388ff, size: 0.18, transparent: true, opacity: 0.9 }));
  groups[3].add(photoelectrons);

  // --------------------------------------------------------------------------
  // Beat 4: Quantum Duality & Climax (23.6s - 30.0s)
  // --------------------------------------------------------------------------
  const dualityTorusGroup = new THREE.Group();
  groups[4].add(dualityTorusGroup);

  const waveTorus = new THREE.Mesh(
    new THREE.TorusGeometry(3.5, 0.12, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.65 })
  );
  waveTorus.rotation.x = Math.PI / 3;
  dualityTorusGroup.add(waveTorus);

  const particleTorus = new THREE.Mesh(
    new THREE.TorusGeometry(3.5, 0.12, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0xff3d55, wireframe: true, transparent: true, opacity: 0.65 })
  );
  particleTorus.rotation.y = Math.PI / 3;
  dualityTorusGroup.add(particleTorus);

  const coreQuantum = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 3), new THREE.MeshBasicMaterial({ color: 0xffd15c, wireframe: true }));
  dualityTorusGroup.add(coreQuantum);

  // Global Evidence Cloud
  const starCount = 500;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 2 - 1);
    const r = 3.5 + Math.random() * 8.0;
    starPos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    starPos[i * 3 + 2] = r * Math.cos(ph);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x90caf9, size: 0.08, transparent: true, opacity: 0.55 }));
  hero.add(stars);

  // --------------------------------------------------------------------------
  // Frame Update Function
  // --------------------------------------------------------------------------
  function frame(t: number) {
    const s = Math.min(4, Math.max(0, CUTS.findIndex(x => x > t) - 1));
    const u = t - CUTS[s];

    groups.forEach((g, i) => (g.visible = i === s));
    bgUniforms.t.value = t;
    bgUniforms.hue.value = s % 2;

    camera.position.set(0, 0, 16);
    hero.rotation.set(0, 0, 0);

    // Beat 0: Camera Obscura
    if (s === 0) {
      const p = flameParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < p.length / 3; i++) {
        p[i * 3 + 1] += Math.sin(t * 8 + i) * 0.008;
      }
      flameParticles.geometry.attributes.position.needsUpdate = true;
      camera.position.set(Math.sin(u * 0.2) * 2, 0.8, 16);
      camera.lookAt(1, 0, 0);
    }

    // Beat 1: Prism
    if (s === 1) {
      prismMesh.rotation.y = Math.PI / 6 + u * 0.35;
      const pos = corpuscles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.16;
        if (pos[i * 3 + 0] > 8.5) pos[i * 3 + 0] = -8.0;
      }
      corpuscles.geometry.attributes.position.needsUpdate = true;
      camera.position.set(0, 1.0, 15);
      camera.lookAt(0, 0, 0);
    }

    // Beat 2: Wave Interference
    if (s === 2) {
      const pos = wavePlane.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        const x = pos[i * 3 + 0];
        const y = pos[i * 3 + 1];
        if (x > -3.5) {
          const r1 = Math.hypot(x - (-3.5), y - 0.9);
          const r2 = Math.hypot(x - (-3.5), y - (-0.9));
          pos[i * 3 + 2] = (Math.cos(r1 * 4.5 - t * 8.0) + Math.cos(r2 * 4.5 - t * 8.0)) * 0.22;
        } else {
          pos[i * 3 + 2] = Math.cos((x + 3.5) * 4.5 - t * 8.0) * 0.22;
        }
      }
      wavePlane.geometry.attributes.position.needsUpdate = true;
      poissonSpot.scale.setScalar(1.0 + 0.4 * Math.sin(t * 12));
      camera.position.set(Math.sin(u * 0.15) * 3, 1.5, 16);
      camera.lookAt(1, 0, 0);
    }

    // Beat 3: Maxwell & Quanta
    if (s === 3) {
      const posE = emLineE.geometry.attributes.position.array as Float32Array;
      const posB = emLineB.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < posE.length / 3; i++) {
        const z = posE[i * 3 + 2];
        const val = Math.sin(1.4 * z - t * 6.0);
        posE[i * 3 + 1] = val * 1.8;
        posB[i * 3 + 0] = val * 1.8;
      }
      emLineE.geometry.attributes.position.needsUpdate = true;
      emLineB.geometry.attributes.position.needsUpdate = true;

      const pElectrons = photoelectrons.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pElectrons.length / 3; i++) {
        pElectrons[i * 3 + 0] += 0.15;
        if (pElectrons[i * 3 + 0] > 3.0) {
          pElectrons[i * 3 + 0] = -2.5;
          pElectrons[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        }
      }
      photoelectrons.geometry.attributes.position.needsUpdate = true;
      camera.position.set(0, 1.5, 15);
      camera.lookAt(0, 0, 0);
    }

    // Beat 4: Duality Climax
    if (s === 4) {
      dualityTorusGroup.rotation.y = t * 0.45;
      dualityTorusGroup.rotation.x = Math.sin(t * 0.3) * 0.4;
      camera.position.set(Math.sin(u * 0.1) * 3, Math.cos(u * 0.1) * 2, 16);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    return s;
  }

  function resize() {
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    camera.aspect = (canvas.clientWidth || 16) / (canvas.clientHeight || 9);
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  return { frame };
}

(window as any)['createLight30sScene'] = createLight30sScene;
