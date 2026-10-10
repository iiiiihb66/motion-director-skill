import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

// Mulberry32 deterministic random
function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default class AbgS1Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  candles: { mesh: THREE.Mesh; h: number; i: number }[] = [];
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.04, 0.035, 0.03);
      float r = length(uv);
      col += vec3(0.12, 0.04, 0.01) * exp(-r * 2.0);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 1.5, 17);
    this.cam.lookAt(0, -1.5, -4);

    const R = mulberry32(20261003);
    const BONE = 0xf4f1ea;
    const SIGNAL = 0xff4d12;

    // Build 30 3D K-Line Candles
    for (let i = 0; i < 30; i++) {
      const h = 0.6 + R() * 3.2;
      const up = R() > 0.45;
      const mat = new THREE.MeshBasicMaterial({ color: up ? BONE : SIGNAL });
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1, 0.55), mat);
      m.position.set(-13 + i * 0.9, -6 + 0.5, -4 - (R() * 6));
      m.scale.y = 0.001;
      this.scene3D.add(m);
      this.candles.push({ mesh: m, h, i });
    }
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Animate Candles & Camera
    const easeOut = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const easeIO = (v: number) => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    this.candles.forEach(c => {
      const p = Math.max(0, Math.min(1, (lt - c.i * 0.09) / 0.5));
      c.mesh.scale.y = Math.max(0.001, c.h * easeOut(p));
      c.mesh.position.y = -6 + c.mesh.scale.y / 2;
    });

    const e = easeIO(Math.max(0, Math.min(1, lt / 4.5)));
    this.cam.position.set(0, 1.5, 17 - 7 * e);
    this.cam.lookAt(0, -1.5, -4);

    renderer.render(this.scene3D, this.cam);

    // Render 2D Title
    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5 - 120 + Math.sin(t * 1.2) * 10;

    c.save();
    c.textAlign = 'center';
    c.font = '900 110px "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = '#ff4d12';
    c.shadowColor = '#ff4d12';
    c.shadowBlur = 35;
    c.fillText('判断，还是感觉？', cx, cy);
    c.shadowBlur = 0;

    c.fillStyle = '#f4f1ea';
    c.fillText('判断，还是感觉？', cx, cy);
    c.restore();

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.45, grain: 0.12, vignette: 0.25 };
  }
}
