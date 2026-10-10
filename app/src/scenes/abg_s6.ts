import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS6Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.03, 0.02, 0.02);
      float r = length(uv);
      col += vec3(0.25, 0.08, 0.02) * exp(-r * 1.5);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0.4, 11.5);
    this.cam.lookAt(0, 0.4, -6);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const BEAT = 0.5;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const easeOut = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const easeIO = (v: number) => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    const jp = Math.pow(1 - ((t % BEAT) / BEAT), 3);
    const cameraZ = 11.5 - 1.2 * easeIO(clamp01(lt / 4.5)) + jp * 0.25;

    this.cam.position.set(Math.sin(t * 0.6) * 1.6, 0.4 + Math.sin(t * 0.9) * 0.25, cameraZ);
    this.cam.lookAt(0, 0.4, -6);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Slamming ABG ONE Characters
    const abgLetters = ['A', 'B', 'G'];
    abgLetters.forEach((ch, i) => {
      const at = i * 0.5;
      const lp = (lt - at) / 0.3;
      if (lp > 0) {
        const e = easeOut(clamp01(lp));
        const s = 1.7 - 0.7 * e;
        const lx = cx + (i - 1) * 220;
        const ly = cy - 140;

        c.save();
        c.translate(lx, ly);
        c.scale(s, s);
        c.font = '900 160px "PingFang SC", sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#ff4d12';
        c.shadowColor = '#ff4d12';
        c.shadowBlur = 40;
        c.fillText(ch, 0, 0);
        c.restore();
      }
    });

    const oneLetters = ['O', 'N', 'E'];
    oneLetters.forEach((ch, i) => {
      const at = 1.5 + i * 0.5;
      const lp = (lt - at) / 0.3;
      if (lp > 0) {
        const e = easeOut(clamp01(lp));
        const s = 1.7 - 0.7 * e;
        const lx = cx + (i - 1) * 220;
        const ly = cy + 40;

        c.save();
        c.translate(lx, ly);
        c.scale(s, s);
        c.font = '900 160px "PingFang SC", sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#ff4d12';
        c.shadowColor = '#ff4d12';
        c.shadowBlur = 40;
        c.fillText(ch, 0, 0);
        c.restore();
      }
    });

    // Sub-menu Features List
    const items = [
      '01 学习 · 期权结构',
      '02 模拟 · 策略回测',
      '03 复盘 · 决策记录'
    ];

    items.forEach((txt, i) => {
      if (lt > 2.2 + i * 0.4) {
        c.font = font(F.mono(700), 26);
        c.fillStyle = '#f4f1ea';
        c.textAlign = 'center';
        c.fillText(txt, cx, cy + 200 + i * 45);
      }
    });

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.6, grain: 0.12, vignette: 0.25 };
  }
}
