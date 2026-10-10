import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirTitleScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    uniform float flash;
    void main() {
      vec2 uv = vUv;
      vec2 p = (uv - 0.5) * vec2(16.0 / 9.0, 1.0);
      
      float dist = length(p);
      vec3 col = vec3(0.015, 0.04, 0.07);
      col += vec3(0.0, 0.6, 0.5) * exp(-dist * 1.8) * (1.0 + flash * 1.5);
      col += vec3(flash * 0.4);
      
      float raster = sin(uv.y * 1080.0 * 2.0) * 0.08;
      col -= raster;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, flash: { value: 0 } });

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    const dropT = 20.4;
    const timeSinceDrop = Math.max(0, t - dropT);
    const flash = Math.exp(-timeSinceDrop * 5.0);
    const shake = Math.exp(-timeSinceDrop * 3.5) * 16.0;

    this.bg.u.t!.value = t;
    this.bg.u.flash!.value = flash;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const shakeX = (Math.sin(t * 60.0) * shake);
    const shakeY = (Math.cos(t * 75.0) * shake);

    const cx = W * 0.5 + shakeX;
    const cy = H * 0.5 + shakeY;

    // Warning Brackets
    c.strokeStyle = flash > 0.3 ? '#00ffc3' : 'rgba(0, 255, 195, 0.4)';
    c.lineWidth = 3;
    c.strokeRect(50, 50, W - 100, H - 100);

    const bSize = 50;
    c.fillStyle = '#00ffc3';
    c.fillRect(50, 50, bSize, 6); c.fillRect(50, 50, 6, bSize);
    c.fillRect(W - 50 - bSize, 50, bSize, 6); c.fillRect(W - 56, 50, 6, bSize);
    c.fillRect(50, H - 56, bSize, 6); c.fillRect(50, H - 50 - bSize, 6, bSize);
    c.fillRect(W - 50 - bSize, H - 56, bSize, 6); c.fillRect(W - 56, H - 50 - bSize, 6, bSize);

    // Title Scale
    const scale = Math.min(1.0, 0.86 + (1.0 - Math.exp(-lt * 8.0)) * 0.14);

    c.save();
    c.translate(cx, cy - 20);
    c.scale(scale, scale);

    // Glow underlay
    c.font = '900 160px "Archivo-1000-900", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 45 + bass * 30;
    c.fillText('αβΓ✻1', 0, 10);
    c.shadowBlur = 0;

    c.fillStyle = '#ffffff';
    c.fillText('αβΓ✻1', 0, 10);

    c.font = font(F.mono(700), 32);
    c.fillStyle = '#00ffc3';
    c.fillText('YOUR ALL-IN-ONE OPTIONS WORKSPACE', 0, 85);
    c.restore();

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.65 + bass * 0.3,
      grain: 0.2,
      vignette: 0.35
    };
  }
}
