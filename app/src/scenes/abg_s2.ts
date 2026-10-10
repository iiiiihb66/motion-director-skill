import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS2Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.04, 0.03, 0.02);
      float r = length(uv);
      col += vec3(0.25, 0.04, 0.01) * exp(-r * 1.5);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 1.6, 11);
    this.cam.lookAt(0, 1.2, -5);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Orbit Camera
    const a = t * 0.35;
    this.cam.position.set(Math.sin(a) * 5.5, 1.6, 11);
    this.cam.lookAt(0, 1.2, -5);
    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Calculate rolling PnL value (-1240 -> -8660)
    const BEAT = 0.5;
    const easeOut = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const step = Math.floor(lt / BEAT);
    const total = Math.floor(3.2 / BEAT);
    const start = 1240, end = 8660;
    const val = Math.floor(start + (end - start) * easeOut(Math.max(0, Math.min(1, step / total))));

    // Tag
    c.font = font(F.mono(700), 24);
    c.fillStyle = '#8a8580';
    c.textAlign = 'center';
    c.fillText('REALIZED PNL // 亏损持续蔓延', cx, cy - 110);

    // Number PnL
    const pulse = Math.pow(1 - ((t % BEAT) / BEAT), 3);
    const scale = 1 + 0.05 * pulse;

    c.save();
    c.translate(cx, cy + 20);
    c.scale(scale, scale);
    c.font = '900 140px "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = '#ff4d12';
    c.shadowColor = '#ff4d12';
    c.shadowBlur = 40;
    c.fillText(`−¥${val.toLocaleString('en-US')}`, 0, 0);
    c.restore();

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.5, grain: 0.12, vignette: 0.25 };
  }
}
