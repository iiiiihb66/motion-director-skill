import * as THREE from 'three';

// Export namespace
export interface OpticalAct {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  start: number;
  end: number;
  update: (timeInAct: number, globalTime: number) => void;
  destroy?: () => void;
}

// Color palette
export const THEME = {
  bg: '#070c14',
  paper: '#f4eedb',
  gold: '#ffd15c',
  amber: '#ff9800',
  cyan: '#00e5ff',
  blue: '#2979ff',
  ruby: '#ff3d55',
  violet: '#b388ff',
  muted: '#788b9c',
  border: '#1b2838',
  white: '#ffffff'
};

export class LightOdysseyEngine {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  // Act groups
  actGroups: THREE.Group[] = [];
  currentActIdx: number = 0;
  
  // Scene-specific instances
  pinholeFlameParticles: THREE.Points | null = null;
  prismMesh: THREE.Mesh | null = null;
  corpuscleParticles: THREE.Points | null = null;
  waveFieldPlane: THREE.Mesh | null = null;
  poissonDisk: THREE.Mesh | null = null;
  poissonSpotMesh: THREE.Mesh | null = null;
  emWaveEField: THREE.Line | null = null;
  emWaveBField: THREE.Line | null = null;
  photoelectricCathode: THREE.Mesh | null = null;
  photoelectrons: THREE.Points | null = null;
  quantumDetectorDots: THREE.Points | null = null;
  quantumDotPositions: Float32Array | null = null;
  quantumDotCount: number = 0;
  cosmicDualityTorus: THREE.Group | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.container = canvas.parentElement || document.body;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(THEME.bg, 1.0);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(THEME.bg, 0.015);

    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 0, 18);

    // Global lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(10, 15, 10);
    this.scene.add(dir);

    // Build the 7 acts
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      g.visible = (i === 0);
      this.scene.add(g);
      this.actGroups.push(g);
    }

    this.initAct0_Pinhole();
    this.initAct1_Prism();
    this.initAct2_YoungPoisson();
    this.initAct3_Maxwell();
    this.initAct4_Photoelectric();
    this.initAct5_QuantumSlit();
    this.initAct6_CosmicDuality();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (w > 0 && h > 0) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  // -------------------------------------------------------------
  // Act 0: Pinhole Camera Obscura (墨子与海什木暗室)
  // -------------------------------------------------------------
  initAct0_Pinhole() {
    const g = this.actGroups[0];

    // Ancient wooden chamber frame
    const chamberGeo = new THREE.BoxGeometry(10, 6, 6);
    const chamberEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chamberGeo),
      new THREE.LineBasicMaterial({ color: 0x5a4838, linewidth: 2 })
    );
    chamberEdges.position.x = 2;
    g.add(chamberEdges);

    // Pinhole divider wall at x = -1
    const wallGeo = new THREE.PlaneGeometry(0.1, 5.8);
    const wallMesh = new THREE.Mesh(
      wallGeo,
      new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.9 })
    );
    wallMesh.position.set(-1, 0, 0);
    wallMesh.rotation.y = Math.PI / 2;
    g.add(wallMesh);

    // Candle flame source at left (x = -5.5, y = 0)
    const flameGeo = new THREE.BufferGeometry();
    const flameCount = 120;
    const flamePos = new Float32Array(flameCount * 3);
    for (let i = 0; i < flameCount; i++) {
      flamePos[i * 3 + 0] = -5.5 + (Math.random() - 0.5) * 0.3;
      flamePos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      flamePos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    this.pinholeFlameParticles = new THREE.Points(
      flameGeo,
      new THREE.PointsMaterial({ color: 0xffaa33, size: 0.12, transparent: true, opacity: 0.85 })
    );
    g.add(this.pinholeFlameParticles);

    // Projected inverted screen at x = 6.8
    const screenGeo = new THREE.PlaneGeometry(0.1, 5.5);
    const screenMesh = new THREE.Mesh(
      screenGeo,
      new THREE.MeshStandardMaterial({ color: 0x332820, roughness: 0.8 })
    );
    screenMesh.position.set(6.8, 0, 0);
    screenMesh.rotation.y = Math.PI / 2;
    g.add(screenMesh);

    // Ray tracing lines passing through pinhole (-1, 0, 0)
    const rayCoords = [
      // Top of flame -> pinhole -> bottom of screen
      -5.5, 0.75, 0,   -1, 0, 0,
      -1, 0, 0,        6.8, -1.3, 0,
      // Bottom of flame -> pinhole -> top of screen
      -5.5, -0.75, 0,  -1, 0, 0,
      -1, 0, 0,        6.8, 1.3, 0,
      // Middle flame rays
      -5.5, 0.2, 0,    -1, 0, 0,
      -1, 0, 0,        6.8, -0.35, 0
    ];
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(rayCoords, 3));
    const rayLines = new THREE.LineSegments(
      rayGeo,
      new THREE.LineBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.75, linewidth: 2 })
    );
    g.add(rayLines);
  }

  // -------------------------------------------------------------
  // Act 1: Newton's Prism & Corpuscular Theory (三棱镜与微粒说)
  // -------------------------------------------------------------
  initAct1_Prism() {
    const g = this.actGroups[1];

    // 3D Glass Prism
    const prismGeo = new THREE.CylinderGeometry(2.2, 2.2, 4.0, 3);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transmission: 0.85,
      opacity: 0.8,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 1.8
    });
    this.prismMesh = new THREE.Mesh(prismGeo, prismMat);
    this.prismMesh.rotation.y = Math.PI / 6;
    g.add(this.prismMesh);

    // Edge wireframe for prism
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(prismGeo),
      new THREE.LineBasicMaterial({ color: 0x90caf9, transparent: true, opacity: 0.7 })
    );
    this.prismMesh.add(edges);

    // Collimated incoming white beam (x = -8 to -1)
    const whiteBeamGeo = new THREE.BufferGeometry();
    whiteBeamGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      -8, 0, 0,   -1.1, 0, 0
    ], 3));
    const whiteBeam = new THREE.Line(
      whiteBeamGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 })
    );
    g.add(whiteBeam);

    // Dispersed spectral rays exiting from x = 1.0
    const spectrumColors = [
      0xff2a44, // Red (bends least)
      0xff7f00, // Orange
      0xffd700, // Yellow
      0x00e676, // Green
      0x00e5ff, // Cyan
      0x2979ff, // Blue
      0x7c4dff  // Violet (bends most)
    ];

    spectrumColors.forEach((col, idx) => {
      const angle = -0.15 - idx * 0.06; // refraction spread
      const targetX = 8.0;
      const targetY = (targetX - 1.0) * Math.tan(angle);
      const specGeo = new THREE.BufferGeometry();
      specGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        0.8, 0.1, 0,   targetX, targetY, 0
      ], 3));
      const line = new THREE.Line(
        specGeo,
        new THREE.LineBasicMaterial({ color: col, linewidth: 3, transparent: true, opacity: 0.85 })
      );
      g.add(line);
    });

    // Corpuscular particle stream (Newton's corpuscles)
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3 + 0] = -8 + Math.random() * 16;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      const c = new THREE.Color(spectrumColors[i % spectrumColors.length]);
      pCol[i * 3 + 0] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    this.corpuscleParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.7 })
    );
    g.add(this.corpuscleParticles);
  }

  // -------------------------------------------------------------
  // Act 2: Young's Slits & Poisson's Spot (杨氏双缝与泊松奇迹)
  // -------------------------------------------------------------
  initAct2_YoungPoisson() {
    const g = this.actGroups[2];

    // Wave interference surface grid (Shader or Dynamic plane)
    const waveGeo = new THREE.PlaneGeometry(12, 8, 80, 60);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    this.waveFieldPlane = new THREE.Mesh(waveGeo, waveMat);
    this.waveFieldPlane.rotation.x = -Math.PI / 3;
    this.waveFieldPlane.position.set(0, -1, 0);
    g.add(this.waveFieldPlane);

    // Double slit barrier
    const barrierGeo = new THREE.BoxGeometry(0.1, 4.0, 0.4);
    const barrierTop = new THREE.Mesh(barrierGeo, new THREE.MeshStandardMaterial({ color: 0x37474f }));
    barrierTop.position.set(-3.5, 1.8, 0);
    g.add(barrierTop);
    const barrierMid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x37474f }));
    barrierMid.position.set(-3.5, 0, 0);
    g.add(barrierMid);
    const barrierBot = new THREE.Mesh(barrierGeo, new THREE.MeshStandardMaterial({ color: 0x37474f }));
    barrierBot.position.set(-3.5, -1.8, 0);
    g.add(barrierBot);

    // Poisson circular obstacle disk at x = 1.5
    const diskGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 36);
    this.poissonDisk = new THREE.Mesh(
      diskGeo,
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    this.poissonDisk.rotation.z = Math.PI / 2;
    this.poissonDisk.position.set(1.5, 0, 0);
    g.add(this.poissonDisk);

    // Poisson's Spot: Blazing red central focal point on detection screen
    const spotGeo = new THREE.SphereGeometry(0.15, 16, 16);
    this.poissonSpotMesh = new THREE.Mesh(
      spotGeo,
      new THREE.MeshBasicMaterial({ color: 0xff1744 })
    );
    this.poissonSpotMesh.position.set(6.5, 0, 0);
    g.add(this.poissonSpotMesh);

    // Concentric diffraction rings around the Poisson spot
    for (let r = 0.5; r <= 2.5; r += 0.5) {
      const ringGeo = new THREE.RingGeometry(r, r + 0.04, 48);
      const ringMesh = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: 0xff3d55,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35 / (r * 0.8)
        })
      );
      ringMesh.rotation.y = Math.PI / 2;
      ringMesh.position.set(6.48, 0, 0);
      g.add(ringMesh);
    }
  }

  // -------------------------------------------------------------
  // Act 3: Maxwell's Electromagnetic Symphony (麦克斯韦电磁波)
  // -------------------------------------------------------------
  initAct3_Maxwell() {
    const g = this.actGroups[3];

    // Orthogonal E & B oscillating fields along Z axis (from z = -8 to 8)
    const pointsE: THREE.Vector3[] = [];
    const pointsB: THREE.Vector3[] = [];
    const segs = 200;

    for (let i = 0; i <= segs; i++) {
      const z = -8 + (i / segs) * 16;
      pointsE.push(new THREE.Vector3(0, 0, z));
      pointsB.push(new THREE.Vector3(0, 0, z));
    }

    const geoE = new THREE.BufferGeometry().setFromPoints(pointsE);
    this.emWaveEField = new THREE.Line(
      geoE,
      new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 3 })
    );
    g.add(this.emWaveEField);

    const geoB = new THREE.BufferGeometry().setFromPoints(pointsB);
    this.emWaveBField = new THREE.Line(
      geoB,
      new THREE.LineBasicMaterial({ color: 0xffd15c, linewidth: 3 })
    );
    g.add(this.emWaveBField);

    // Central propagation spine line along Z
    const spineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -8), new THREE.Vector3(0, 0, 8)
    ]);
    const spine = new THREE.Line(spineGeo, new THREE.LineBasicMaterial({ color: 0x546e7a }));
    g.add(spine);

    // Decorative floating mathematical equation rings
    for (let k = 0; k < 4; k++) {
      const eqRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.5 + k * 0.8, 0.02, 8, 80),
        new THREE.MeshBasicMaterial({ color: 0x37474f, transparent: true, opacity: 0.35 })
      );
      eqRing.rotation.x = Math.PI / 4 + k * 0.2;
      g.add(eqRing);
    }
  }

  // -------------------------------------------------------------
  // Act 4: Photoelectric Effect & Quanta (光电效应与能量子)
  // -------------------------------------------------------------
  initAct4_Photoelectric() {
    const g = this.actGroups[4];

    // Vacuum phototube glass envelope
    const tubeGeo = new THREE.CylinderGeometry(2.5, 2.5, 8.0, 32, 1, true);
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x90caf9,
      transmission: 0.9,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.z = Math.PI / 2;
    g.add(tube);

    // Cathode metal plate (Zinc plate at x = -2.5)
    const cathodeGeo = new THREE.BoxGeometry(0.2, 3.5, 3.5);
    this.photoelectricCathode = new THREE.Mesh(
      cathodeGeo,
      new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.9, roughness: 0.3 })
    );
    this.photoelectricCathode.position.set(-2.5, 0, 0);
    g.add(this.photoelectricCathode);

    // Anode collector ring at x = 2.5
    const anodeGeo = new THREE.TorusGeometry(1.6, 0.08, 12, 36);
    const anode = new THREE.Mesh(
      anodeGeo,
      new THREE.MeshStandardMaterial({ color: 0xffb74d, metalness: 0.8 })
    );
    anode.rotation.y = Math.PI / 2;
    anode.position.set(2.5, 0, 0);
    g.add(anode);

    // Photoelectrons flying from cathode to anode
    const eCount = 80;
    const eGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(eCount * 3);
    for (let i = 0; i < eCount; i++) {
      ePos[i * 3 + 0] = -2.5 + Math.random() * 5.0;
      ePos[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      ePos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    this.photoelectrons = new THREE.Points(
      eGeo,
      new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.15, transparent: true, opacity: 0.9 })
    );
    g.add(this.photoelectrons);
  }

  // -------------------------------------------------------------
  // Act 5: Quantum Double Slit & Probability Wave (单光子干涉)
  // -------------------------------------------------------------
  initAct5_QuantumSlit() {
    const g = this.actGroups[5];

    // Quantum Gun / Emitter at x = -7
    const gunGeo = new THREE.ConeGeometry(0.6, 1.6, 16);
    const gun = new THREE.Mesh(gunGeo, new THREE.MeshStandardMaterial({ color: 0x455a64 }));
    gun.rotation.z = -Math.PI / 2;
    gun.position.set(-7, 0, 0);
    g.add(gun);

    // Slit barrier at x = -1
    const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.3), new THREE.MeshStandardMaterial({ color: 0x263238 }));
    bTop.position.set(-1, 2.3, 0);
    g.add(bTop);
    const bMid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x263238 }));
    bMid.position.set(-1, 0, 0);
    g.add(bMid);
    const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.3), new THREE.MeshStandardMaterial({ color: 0x263238 }));
    bBot.position.set(-1, -2.3, 0);
    g.add(bBot);

    // Quantum detector phosphor plate at x = 6.5
    const plateGeo = new THREE.PlaneGeometry(0.1, 6.0);
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x1a2634, roughness: 0.9 }));
    plate.rotation.y = Math.PI / 2;
    plate.position.set(6.5, 0, 0);
    g.add(plate);

    // Detector dots buffer (accumulates over time)
    const maxDots = 1500;
    this.quantumDotPositions = new Float32Array(maxDots * 3);
    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.BufferAttribute(this.quantumDotPositions, 3));
    this.quantumDetectorDots = new THREE.Points(
      dotsGeo,
      new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.12, transparent: true, opacity: 0.85 })
    );
    g.add(this.quantumDetectorDots);
  }

  // -------------------------------------------------------------
  // Act 6: Cosmic Duality Unification (两者皆非，两者皆是)
  // -------------------------------------------------------------
  initAct6_CosmicDuality() {
    const g = this.actGroups[6];
    this.cosmicDualityTorus = new THREE.Group();
    g.add(this.cosmicDualityTorus);

    // Intertwined Duality Rings: Wave Torus & Particle Torus
    const waveTorus = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.12, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.6 })
    );
    waveTorus.rotation.x = Math.PI / 3;
    this.cosmicDualityTorus.add(waveTorus);

    const particleTorus = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.12, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xff3d55, wireframe: true, transparent: true, opacity: 0.6 })
    );
    particleTorus.rotation.y = Math.PI / 3;
    this.cosmicDualityTorus.add(particleTorus);

    // Radiant Central Quantum Core
    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 3),
      new THREE.MeshBasicMaterial({ color: 0xffd15c, wireframe: true })
    );
    this.cosmicDualityTorus.add(coreMesh);

    // Starfield particle cloud
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 4.0 + Math.random() * 8.0;
      starPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x90caf9, size: 0.08, transparent: true, opacity: 0.5 })
    );
    g.add(stars);
  }

  // -------------------------------------------------------------
  // Global Update: t = local time in Act, actIdx = 0..6
  // -------------------------------------------------------------
  update(actIdx: number, t: number, globalTime: number) {
    // Switch visibility
    if (this.currentActIdx !== actIdx) {
      this.currentActIdx = actIdx;
      this.actGroups.forEach((g, i) => g.visible = (i === actIdx));
      if (actIdx === 5) {
        // Reset quantum dots accumulation
        this.quantumDotCount = 0;
      }
    }

    const curGroup = this.actGroups[actIdx];

    // Act 0 update
    if (actIdx === 0 && this.pinholeFlameParticles) {
      const pos = this.pinholeFlameParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += (Math.sin(globalTime * 8 + i) * 0.005);
      }
      this.pinholeFlameParticles.geometry.attributes.position.needsUpdate = true;
      this.camera.position.set(Math.sin(t * 0.1) * 2, 1 + Math.cos(t * 0.1) * 0.5, 17);
      this.camera.lookAt(1, 0, 0);
    }

    // Act 1 update
    if (actIdx === 1 && this.prismMesh && this.corpuscleParticles) {
      this.prismMesh.rotation.y = Math.PI / 6 + Math.sin(t * 0.2) * 0.08;
      const pos = this.corpuscleParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.08;
        if (pos[i * 3 + 0] > 8.5) pos[i * 3 + 0] = -8.0;
      }
      this.corpuscleParticles.geometry.attributes.position.needsUpdate = true;
      this.camera.position.set(0, 1.2, 16);
      this.camera.lookAt(0, 0, 0);
    }

    // Act 2 update
    if (actIdx === 2 && this.waveFieldPlane) {
      const pos = this.waveFieldPlane.geometry.attributes.position.array as Float32Array;
      const slit1Y = 0.9, slit2Y = -0.9;
      for (let i = 0; i < pos.length / 3; i++) {
        const x = pos[i * 3 + 0];
        const y = pos[i * 3 + 1];
        if (x > -3.5) {
          const r1 = Math.hypot(x - (-3.5), y - slit1Y);
          const r2 = Math.hypot(x - (-3.5), y - slit2Y);
          const wave = Math.cos(r1 * 4.0 - globalTime * 6.0) + Math.cos(r2 * 4.0 - globalTime * 6.0);
          pos[i * 3 + 2] = wave * 0.18;
        } else {
          pos[i * 3 + 2] = Math.cos((x + 3.5) * 4.0 - globalTime * 6.0) * 0.18;
        }
      }
      this.waveFieldPlane.geometry.attributes.position.needsUpdate = true;
      if (this.poissonSpotMesh) {
        this.poissonSpotMesh.scale.setScalar(1.0 + 0.3 * Math.sin(globalTime * 8));
      }
      this.camera.position.set(Math.sin(t * 0.08) * 3, 2, 16);
      this.camera.lookAt(1, 0, 0);
    }

    // Act 3 update
    if (actIdx === 3 && this.emWaveEField && this.emWaveBField) {
      const posE = this.emWaveEField.geometry.attributes.position.array as Float32Array;
      const posB = this.emWaveBField.geometry.attributes.position.array as Float32Array;
      const k = 1.2;
      const omega = 4.0;
      for (let i = 0; i < posE.length / 3; i++) {
        const z = posE[i * 3 + 2];
        const val = Math.sin(k * z - globalTime * omega);
        posE[i * 3 + 1] = val * 1.8; // E vibrates along Y
        posB[i * 3 + 0] = val * 1.8; // B vibrates along X
      }
      this.emWaveEField.geometry.attributes.position.needsUpdate = true;
      this.emWaveBField.geometry.attributes.position.needsUpdate = true;
      curGroup.rotation.y = globalTime * 0.15;
      this.camera.position.set(0, 3, 16);
      this.camera.lookAt(0, 0, 0);
    }

    // Act 4 update
    if (actIdx === 4 && this.photoelectrons) {
      const pos = this.photoelectrons.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.08;
        if (pos[i * 3 + 0] > 2.5) {
          pos[i * 3 + 0] = -2.5;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
        }
      }
      this.photoelectrons.geometry.attributes.position.needsUpdate = true;
      this.camera.position.set(Math.sin(t * 0.1) * 2, 1, 15);
      this.camera.lookAt(0, 0, 0);
    }

    // Act 5 update: Accumulating Single Photon Double Slit hits
    if (actIdx === 5 && this.quantumDetectorDots && this.quantumDotPositions) {
      // Add 2 dots every frame
      if (this.quantumDotCount < this.quantumDotPositions.length / 3 - 4) {
        for (let s = 0; s < 2; s++) {
          // Sampling from double slit probability distribution I(y) ~ cos^2(pi*y/d) * sinc^2(...)
          let y = 0;
          let accepted = false;
          while (!accepted) {
            const candY = (Math.random() - 0.5) * 5.0;
            const prob = Math.pow(Math.cos(candY * 3.14), 2) * Math.exp(-Math.abs(candY) * 0.5);
            if (Math.random() < prob) {
              y = candY;
              accepted = true;
            }
          }
          const z = (Math.random() - 0.5) * 2.5;
          const idx = this.quantumDotCount++;
          this.quantumDotPositions[idx * 3 + 0] = 6.48;
          this.quantumDotPositions[idx * 3 + 1] = y;
          this.quantumDotPositions[idx * 3 + 2] = z;
        }
        this.quantumDetectorDots.geometry.attributes.position.needsUpdate = true;
      }
      this.camera.position.set(0, 0.8, 16);
      this.camera.lookAt(1, 0, 0);
    }

    // Act 6 update: Cosmic Duality
    if (actIdx === 6 && this.cosmicDualityTorus) {
      this.cosmicDualityTorus.rotation.y = globalTime * 0.25;
      this.cosmicDualityTorus.rotation.x = Math.sin(globalTime * 0.15) * 0.3;
      this.camera.position.set(Math.sin(t * 0.05) * 3, Math.cos(t * 0.05) * 2, 16);
      this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Bind to window for global invocation
(window as any)['LightOdysseyEngine'] = LightOdysseyEngine;
