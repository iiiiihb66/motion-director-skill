import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirOutroScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      vec3 col = vec3(0.015, 0.03, 0.04);
      float centerGlow = exp(-length(uv * 2.0 - 1.0) * 2.0);
      col += vec3(0.0, 0.25, 0.2) * centerGlow * 0.4;
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Outro Terminal Card
    const cardW = 760;
    const cardH = 400;
    c.fillStyle = 'rgba(6, 16, 24, 0.92)';
    c.fillRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, cardH);
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 2 + bass * 1.5;
    c.strokeRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, cardH);

    // Header Bar
    c.fillStyle = 'rgba(0, 255, 195, 0.18)';
    c.fillRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, 48);
    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 16);
    c.fillText('ACCESS TERMINAL // αβΓ✻1 AUTHORIZATION PORTAL', cx - cardW * 0.5 + 20, cy - cardH * 0.5 + 20);

    // Subtext
    c.textAlign = 'center';
    c.font = font(F.mono(700), 22);
    c.fillStyle = 'rgba(255, 255, 255, 0.75)';
    c.fillText('START YOUR OPTIONS SIMULATION AT', cx, cy - 50);

    // Main Web Link
    c.font = '900 60px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 30 + bass * 20;
    c.fillText('www.getabg.one', cx, cy + 20);
    c.shadowBlur = 0;

    // PIN Authentication Simulator
    const pinProgress = Math.min(4, Math.floor((lt % 1.8) * 3));
    const pinStr = '● '.repeat(pinProgress) + '_ '.repeat(4 - pinProgress);

    c.fillStyle = 'rgba(0, 255, 195, 0.1)';
    c.fillRect(cx - 200, cy + 60, 400, 52);
    c.strokeStyle = '#00ffc3';
    c.strokeRect(cx - 200, cy + 60, 400, 52);

    c.font = font(F.mono(700), 24);
    c.fillStyle = '#ffffff';
    c.fillText(`PIN CODE: [ ${pinStr.trim()} ]`, cx, cy + 95);

    // UNLOCKED STAMP
    if (lt > 1.2) {
      c.save();
      c.translate(cx + 250, cy + 85);
      c.rotate(-0.18);
      c.strokeStyle = '#00ffc3';
      c.lineWidth = 4;
      c.strokeRect(-70, -22, 140, 44);
      c.font = font(F.mono(700), 15);
      c.fillStyle = '#00ffc3';
      c.fillText('UNLOCKED', 0, 5);
      c.restore();
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.5 + bass * 0.2,
      grain: 0.15,
      vignette: 0.3
    };
  }
}
