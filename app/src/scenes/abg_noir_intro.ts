import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirIntroScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    uniform float bass;
    void main() {
      vec2 uv = vUv;
      vec2 p = (uv - 0.5) * vec2(16.0 / 9.0, 1.0);
      
      // Stark Forensic Noir Background
      vec3 col = mix(vec3(0.01), vec3(0.04, 0.05, 0.06), uv.y);
      
      // UV Ultraviolet Scan Beam
      float scanY = fract(t * 0.25);
      float distScan = abs(uv.y - scanY);
      col += vec3(0.1, 0.6, 0.5) * exp(-distScan * 35.0) * (0.8 + bass * 0.4);
      
      // Heavy Raster Lines
      float raster = sin(uv.y * 1080.0 * 2.0) * 0.08;
      col -= raster;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, bass: { value: 0 } });

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.u.bass!.value = bass;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // 1. Perimeter Warning Perimeter Brackets
    c.strokeStyle = 'rgba(0, 255, 195, 0.4)';
    c.lineWidth = 3;
    c.strokeRect(50, 50, W - 100, H - 100);

    const bSize = 50;
    c.fillStyle = '#00ffc3';
    // Corners
    c.fillRect(50, 50, bSize, 6); c.fillRect(50, 50, 6, bSize);
    c.fillRect(W - 50 - bSize, 50, bSize, 6); c.fillRect(W - 56, 50, 6, bSize);
    c.fillRect(50, H - 56, bSize, 6); c.fillRect(50, H - 50 - bSize, 6, bSize);
    c.fillRect(W - 50 - bSize, H - 56, bSize, 6); c.fillRect(W - 56, H - 50 - bSize, 6, bSize);

    // 2. Barcode Graphic Banner
    const barX = cx - 240, barY = 110;
    c.fillStyle = 'rgba(0, 255, 195, 0.8)';
    for (let b = 0; b < 480; b += 8) {
      const bw = ((b * 13) % 7 > 2) ? 4 : 2;
      c.fillRect(barX + b, barY, bw, 32);
    }
    c.font = font(F.mono(700), 16);
    c.textAlign = 'center';
    c.fillText('// CLASSIFIED QUANT DOSSIER: αβΓ-001 //', cx, barY + 54);

    // 3. Fluorescing Greek Symbols in Darkness
    const symbols = ['α', 'β', 'Γ', 'θ', 'ν', '✻', '1', 'Δ'];
    c.font = font(F.mono(700), 28);
    c.fillStyle = 'rgba(0, 255, 195, 0.3)';
    for (let i = 0; i < 18; i++) {
      const sx = (cx + Math.sin(i * 1.5 + t) * 750) % W;
      const sy = (cy + Math.cos(i * 2.1 + t * 0.8) * 350) % H;
      c.fillText(symbols[i % symbols.length], sx, sy);
    }

    // 4. Main Noir Title Slam
    const introScale = Math.min(1.0, 0.8 + (1.0 - Math.exp(-lt * 6.0)) * 0.2 + bass * 0.05);
    c.save();
    c.translate(cx, cy - 20);
    c.scale(introScale, introScale);

    c.font = '900 130px "Archivo-1000-900", "PingFang SC", sans-serif';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 40 + bass * 20;
    c.fillText('αβΓ✻1', 0, 0);
    c.shadowBlur = 0;

    c.fillStyle = '#ffffff';
    c.fillText('αβΓ✻1', 0, 0);

    c.font = font(F.mono(700), 26);
    c.fillStyle = '#00e6b4';
    c.fillText('DECIPHER OPTIONS // MASTER THE GREEKS', 0, 65);
    c.restore();

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.6 + bass * 0.2,
      grain: 0.2,
      vignette: 0.35
    };
  }
}
