import * as THREE from 'three';
import {ease,prog,pulse,springStep,keys,hash} from '../engine/util';

window['CrimMotion'] = {ease, prog, pulse, springStep, keys, hash};

// 15-second timeline: 5 scenes
const CUTS = [0, 2.8, 5.8, 8.8, 11.8, 15.0];

function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor('#080c10');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 9 / 16, 0.1, 100);
  scene.fog = new THREE.FogExp2('#080c10', 0.025);

  scene.add(new THREE.AmbientLight('#bcd8e5', 1.2));
  const key = new THREE.DirectionalLight('#eef4ef', 3.2);
  key.position.set(-5, 8, 6);
  scene.add(key);

  const rim = new THREE.PointLight('#ff3d55', 28, 22);
  rim.position.set(5, 2, 4);
  scene.add(rim);

  const uniforms = { t: { value: 0 }, uv: { value: 0 } };
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,1.,1.);}',
      fragmentShader: `precision highp float;varying vec2 v;uniform float t,uv;
void main(){
  vec2 p=(v-.5)*vec2(.5625,1.);
  vec2 q=p*35.+vec2(0.,t*.12);
  vec2 g=abs(fract(q)-.5);
  float grid=smoothstep(.46,.49,max(g.x,g.y));
  vec3 c=vec3(.022,.027,.032)+vec3(.04,.055,.065)*exp(-length(p)*3.);
  c+=mix(vec3(.13,.022,.03),vec3(.012,.06,.14),uv)*grid*.22;
  float sweep=exp(-pow((p.y-fract(t*.07)+.5)/.018,2.));
  c+=mix(vec3(.20,.04,.04),vec3(.01,.09,.22),uv)*sweep*.26;
  gl_FragColor=vec4(c,1.);
}`
    })
  );
  bg.frustumCulled = false;
  bg.renderOrder = -1000;
  scene.add(bg);

  const hero = new THREE.Group();
  hero.position.y = -1.3;
  scene.add(hero);

  const groups = Array.from({ length: 5 }, () => new THREE.Group());
  hero.add(...groups);

  function segments(coords: number[], color = '#a1b5bb', opacity = 0.6) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
  }

  // Scene 0: Dossier files stack
  const files: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const b = new THREE.BoxGeometry(3.5, 2.1, 0.08);
    g.add(
      new THREE.Mesh(
        b,
        new THREE.MeshStandardMaterial({ color: '#192630', metalness: 0.45, roughness: 0.36 })
      )
    );
    g.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(b),
        new THREE.LineBasicMaterial({ color: i === 3 ? '#ff3d55' : '#bacbd0' })
      )
    );
    const rules: number[] = [];
    for (let j = 0; j < 4; j++) {
      rules.push(
        -1.35, 0.60 - j * 0.35, 0.055,
        1.25 - (j % 2) * 0.45, 0.60 - j * 0.35, 0.055
      );
    }
    g.add(segments(rules, '#8eb1ba', 0.7));
    groups[0].add(g);
    files.push(g);
  }

  // Scene 1: Fingerprint 33-ring laser scan
  const fingerprint: number[] = [];
  for (let ring = 0; ring < 33; ring++) {
    const radius = 0.15 + ring * 0.072;
    for (let j = 0; j < 160; j++) {
      const point = (a: number) => [
        Math.cos(a) * radius * (1 + 0.10 * Math.sin(a * 3)) + Math.sin(a * 0.5) * 0.17,
        Math.sin(a) * radius * 1.26 + 0.15 * Math.sin(a * 2),
        0.22 * Math.sin(a * 3 + ring * 0.15)
      ];
      fingerprint.push(...point((j / 160) * Math.PI * 2), ...point(((j + 1) / 160) * Math.PI * 2));
    }
  }
  const print = segments(fingerprint, '#92e9ff', 0.88);
  groups[1].add(print);
  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 0.018),
    new THREE.MeshBasicMaterial({ color: '#e2fcff', transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  groups[1].add(scan);

  // Scene 2: Ballistic trajectory & 3D tracer
  const helical: number[] = [];
  for (let k = 0; k < 6; k++) {
    for (let i = 0; i < 160; i++) {
      const p = (j: number) => {
        const z = -3 + (j / 160) * 6;
        const a = z * 2.1 + (k * Math.PI) / 3;
        return [Math.cos(a) * 1.4, Math.sin(a) * 1.4, z];
      };
      helical.push(...p(i), ...p(i + 1));
    }
  }
  groups[2].add(segments(helical, '#d0e0dc', 0.65));
  const trajectory: number[] = [];
  for (let i = 0; i < 120; i++) {
    const p = (j: number) => {
      const x = -3.2 + (j / 120) * 6.4;
      return [x, 1.9 - 0.32 * x * x, 0.7 * Math.sin(x)];
    };
    trajectory.push(...p(i), ...p(i + 1));
  }
  groups[2].add(segments(trajectory, '#ff3d55', 0.95));
  const tracer = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 1),
    new THREE.MeshBasicMaterial({ color: '#ff5e72' })
  );
  groups[2].add(tracer);

  // Scene 3: Locard exchange - dual topological nodes & transfer flow
  const exchange = new THREE.Group();
  groups[3].add(exchange);
  for (const x of [-1.7, 1.7]) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 2),
      new THREE.MeshBasicMaterial({ color: '#cdd6d4', wireframe: true, transparent: true, opacity: 0.4 })
    );
    m.position.x = x;
    exchange.add(m);
  }
  const transfer: THREE.Mesh[] = [];
  for (let i = 0; i < 42; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + (i % 4) * 0.008, 6, 5),
      new THREE.MeshBasicMaterial({ color: i % 3 ? '#ff4d68' : '#bcebf1' })
    );
    exchange.add(m);
    transfer.push(m);
  }

  // Scene 4: Title rings & Vault archive
  const titleGroup = new THREE.Group();
  groups[4].add(titleGroup);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(1.7 + i * 0.29, 0.016, 5, 130),
      new THREE.MeshBasicMaterial({ color: i % 2 ? '#eff0e4' : '#ff3d55', transparent: true, opacity: 0.65 })
    );
    m.rotation.set(i * 0.3, i * 0.48, i * 0.26);
    titleGroup.add(m);
    rings.push(m);
  }
  const vault = new THREE.Group();
  titleGroup.add(vault);
  for (let i = 0; i < 8; i++) {
    const b = new THREE.BoxGeometry(3.3, 2, 0.06);
    const m = new THREE.LineSegments(
      new THREE.EdgesGeometry(b),
      new THREE.LineBasicMaterial({ color: i === 0 ? '#ff3d55' : '#80a2af', transparent: true, opacity: 0.8 - i * 0.06 })
    );
    m.position.z = -i * 0.55;
    vault.add(m);
  }

  // Ambient dust particles
  const dust = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    dust.set([(hash(i, 1) - 0.5) * 15, (hash(i, 2) - 0.5) * 25, -5 - hash(i, 3) * 14], i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  scene.add(
    new THREE.Points(
      dg,
      new THREE.PointsMaterial({ color: '#70818e', size: 0.035, opacity: 0.45, transparent: true })
    )
  );

  // Evidence cloud point field
  const count = 640;
  const cloudPositions = new Float32Array(count * 3);
  const cloudGeometry = new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
  const cloud = new THREE.Points(
    cloudGeometry,
    new THREE.PointsMaterial({
      color: '#9ad5e5',
      size: 0.038,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  hero.add(cloud);

  function shape(s: number, i: number, u: number) {
    const a = (i / count) * Math.PI * 2;
    const r = hash(i, 79);
    const b = hash(i, 80);
    switch (s) {
      case 0:
        return [(r - 0.5) * 4.6, (b - 0.5) * 3.6, Math.floor(i / 80) * -0.3];
      case 1: {
        const q = 0.3 + r * 2.1;
        return [Math.cos(a * 11) * q, Math.sin(a * 11) * q * 1.28, 0.16 * Math.sin(a * 22)];
      }
      case 2:
        return [Math.cos(a * 8 + u) * 1.43, Math.sin(a * 8 + u) * 1.43, (r - 0.5) * 6];
      case 3: {
        const sign = i % 2 ? 1 : -1;
        const flow = prog(u, 0.4, 2.8, ease.inOutCubic);
        return [
          sign * 1.7 * (1 - flow) + (r - 0.5) * 3.4 * flow,
          Math.sin(a * 9) * (1.25 - 0.65 * flow),
          Math.cos(a * 9) * 1.1
        ];
      }
      default:
        return [Math.cos(a * 4) * 2.3, Math.sin(a * 4) * 2.3, Math.sin(a * 3 + u * 0.4) * 0.6];
    }
  }

  let last = 0;
  function frame(t: number, s: number) {
    last = t;
    const u = t - CUTS[s];
    groups.forEach((g, i) => (g.visible = i === s));
    uniforms.t.value = t;
    uniforms.uv.value = s === 1 ? 1 : 0;
    camera.position.set(0, 0.4, 16);
    hero.rotation.set(0, 0, 0);
    hero.scale.setScalar(1);

    // Scene 0: Files stack (0 ~ 2.8s)
    if (s === 0) {
      const p = prog(u, 0.2, 2.2, ease.outExpo);
      files.forEach((g, i) => {
        g.position.set((i - 3) * (0.1 + 0.25 * p), (i - 3) * (0.05 + 0.44 * p), -i * 0.42);
        g.rotation.set(-0.1, p * 0.15, i * 0.045);
      });
      hero.rotation.y = keys(u, [[0, 0.8], [1.2, -0.15, ease.outExpo], [2.7, 0.35, ease.inOutExpo]]);
      camera.position.z = keys(u, [[0, 8], [1.2, 17, ease.outExpo], [2.7, 11, ease.inExpo]]);
    }

    // Scene 1: Fingerprint UV scan (2.8 ~ 5.8s)
    if (s === 1) {
      const count = Math.floor(prog(u, 0.1, 2.0, ease.outExpo) * (fingerprint.length / 6)) * 2;
      print.geometry.setDrawRange(0, count);
      scan.position.y = 3 - Math.min(6, u * 1.8);
      groups[1].rotation.set(0.1, keys(u, [[0, 0.7], [1.6, 0, ease.outExpo], [2.9, 0.35, ease.inOutCubic]]), -0.08);
      camera.position.z = keys(u, [[0, 20], [1.3, 13, ease.outExpo], [2.9, 9, ease.inExpo]]);
    }

    // Scene 2: Ballistics trajectory (5.8 ~ 8.8s)
    if (s === 2) {
      const x = -3.2 + prog(u, 0.2, 2.6, ease.inOutCubic) * 6.4;
      tracer.position.set(x, 1.9 - 0.32 * x * x, 0.7 * Math.sin(x));
      hero.rotation.set(0.55, keys(u, [[0, 0.3], [1.2, 1.3, ease.outExpo], [2.8, 2.6, ease.inOutCubic]]), -0.1);
      camera.position.z = keys(u, [[0, 14], [1.4, 17, ease.outExpo], [2.9, 10, ease.inExpo]]);
    }

    // Scene 3: Locard exchange transfer (8.8 ~ 11.8s)
    if (s === 3) {
      exchange.rotation.y = keys(u, [[0, 0.5], [1.6, 0, ease.outExpo], [2.9, -0.45, ease.inOutCubic]]);
      transfer.forEach((m, i) => {
        const p = prog(u, 0.1 + i * 0.04, 2.2 + i * 0.04, ease.inOutCubic);
        const a = (i / 42) * Math.PI * 2;
        m.position.set(
          -1.7 + 3.4 * p,
          0.9 * Math.sin(a) * Math.sin(p * Math.PI),
          0.9 * Math.cos(a) * Math.sin(p * Math.PI)
        );
      });
      camera.position.z = keys(u, [[0, 20], [1.4, 14, ease.outExpo], [2.9, 17]]);
    }

    // Scene 4: Title rings & final archive (11.8 ~ 15.0s)
    if (s === 4) {
      rings.forEach((m, i) => {
        m.rotation.y = u * 0.5 + i * 0.48;
        m.rotation.z = -u * 0.28 + i * 0.3;
        m.scale.setScalar(0.7 + 0.35 * springStep(u - 0.1, 2.2, 0.65));
      });
      vault.rotation.set(-0.12, keys(u, [[0, 0.6], [1.6, 0, ease.outExpo], [3.1, 0]]), 0);
      vault.scale.setScalar(1 - prog(u, 2.2, 3.1, ease.inExpo) * 0.85);
      camera.position.z = keys(u, [[0, 10], [1.2, 17, ease.outExpo], [3.1, 22]]);
    }

    // Evidence cloud morphing across cuts
    const blend = prog(u, 0, 0.6, ease.inOutCubic);
    for (let i = 0; i < count; i++) {
      const to = shape(s, i, u);
      const from = shape(Math.max(0, s - 1), i, s ? CUTS[s] - CUTS[s - 1] : 0);
      for (let j = 0; j < 3; j++) {
        cloudPositions[i * 3 + j] = from[j] + (to[j] - from[j]) * blend;
      }
    }
    cloudGeometry.attributes.position.needsUpdate = true;
    cloud.material.color.set(s === 1 ? '#92e9ff' : s === 4 ? '#ff3d55' : '#b4d1df');

    // Subtle camera parallax
    camera.position.x = Math.sin(u * 0.6) * 0.55;
    camera.position.y = 0.4 + Math.sin(u * 0.5) * 0.32;
    camera.lookAt(0, -0.35, 0);

    renderer.render(scene, camera);
  }

  function resize() {
    renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight), false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    frame(last, Math.min(4, Math.max(0, CUTS.findIndex((x) => x > last) - 1)));
  }

  new ResizeObserver(resize).observe(canvas);
  renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight), false);
  frame(0, 0);

  return { frame };
}

window['CrimCreateScene'] = createScene;
