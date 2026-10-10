import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS7Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.04, 0.03, 0.02);
      float r = length(uv);
      col += vec3(0.28, 0.08, 0.02) * exp(-r * 1.5);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0.6, 11);
    this.cam.lookAt(0, 0.2, -6);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const easeOut = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const easeIO = (v: number) => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    this.cam.position.set(0, 0.6, 11 + 6 * easeIO(clamp01(lt / 4.5)));
    this.cam.lookAt(0, 0.2, -6);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // 1. "免费使用"
    const e1 = easeOut(clamp01(lt / 0.7));
    const s1 = 1.5 - 0.5 * e1;
    c.save();
    c.translate(cx, cy - 160);
    c.scale(s1, s1);
    c.font = '900 100px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#f4f1ea';
    c.fillText('免费使用', 0, 0);
    c.restore();

    // 2. "getabg.one"
    const e2 = easeOut(clamp01((lt - 0.5) / 0.7));
    const s2 = 1.5 - 0.5 * e2;
    if (lt > 0.5) {
      c.save();
      c.translate(cx, cy);
      c.scale(s2, s2);
      c.font = '900 130px "Archivo-1000-900", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#ff4d12';
      c.shadowColor = '#ff4d12';
      c.shadowBlur = 45;
      c.fillText('getabg.one', 0, 0);
      c.restore();
    }

    // 3. Stamp "FREE"
    if (lt > 1.55) {
      const se = easeOut(clamp01((lt - 1.6) / 0.35));
      const ss = 1.8 - 0.8 * se;

      c.save();
      c.translate(cx + 260, cy + 120);
      c.rotate(-0.21);
      c.scale(ss, ss);

      // Stamp border
      c.strokeStyle = '#ff4d12';
      c.lineWidth = 6;
      c.strokeRect(-120, -50, 240, 100);

      c.font = '900 70px "Archivo-1000-900", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#ff4d12';
      c.fillText('FREE', 0, 22);
      c.restore();
    }

    // Bottom tagline
    c.font = font(F.mono(700), 24);
    c.fillStyle = '#8a8580';
    c.textAlign = 'center';
    c.fillText('期权学习 · 模拟 · 复盘', cx, H - 110);

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.55, grain: 0.12, vignette: 0.25 };
  }
}
