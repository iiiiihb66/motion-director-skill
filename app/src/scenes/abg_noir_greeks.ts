import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirGreeksScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      float r = length(uv);
      
      // Radar Pulse
      float pulse = exp(-abs(r - fract(t * 0.35)) * 12.0);
      vec3 col = vec3(0.01, 0.03, 0.05);
      col += vec3(0.0, 0.4, 0.35) * pulse * 0.4;
      
      // Crosshair
      float cross = step(abs(uv.x), 0.002) + step(abs(uv.y), 0.002);
      col += vec3(0.0, 0.5, 0.4) * cross * 0.3;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    c.font = font(F.mono(700), 20);
    c.fillStyle = '#00ffc3';
    c.fillText('RISK ANALYTICS // GREEKS RADAR MATRIX (Δ, Γ, Θ, ν)', 60, 65);

    const qw = (W - 180) * 0.5;
    const qh = (H - 220) * 0.5;

    const quadrants = [
      { title: 'DELTA (Δ) — 方向捕捉', symbol: 'Δ', val: (0.64 + Math.sin(t * 2.5) * 0.02).toFixed(2), desc: '标的资产价格敏感度', col: '#00ffc3', x: 60, y: 100 },
      { title: 'GAMMA (Γ) — 加速测量', symbol: 'Γ', val: (0.082 + Math.cos(t * 2.0) * 0.003).toFixed(3), desc: 'Delta 的一阶变化率', col: '#00e5af', x: 60 + qw + 60, y: 100 },
      { title: 'THETA (Θ) — 时间衰减', symbol: 'Θ', val: `-$${(42.5 + Math.sin(t * 3.5) * 1.5).toFixed(1)}/天`, desc: '每日时间价值流逝收割', col: '#00d6a3', x: 60, y: 100 + qh + 40 },
      { title: 'VEGA (ν) — 波动预警', symbol: 'ν', val: `+$${(185 + Math.cos(t * 2.8) * 6).toFixed(0)}/%`, desc: '隐含波动率 IV 变动敏锐度', col: '#00ffc3', x: 60 + qw + 60, y: 100 + qh + 40 }
    ];

    quadrants.forEach((q, idx) => {
      c.fillStyle = 'rgba(8, 22, 32, 0.88)';
      c.fillRect(q.x, q.y, qw, qh);
      c.strokeStyle = q.col;
      c.lineWidth = 1.8 + (idx === 0 ? bass * 2 : 0);
      c.strokeRect(q.x, q.y, qw, qh);

      c.fillStyle = q.col;
      c.font = font(F.mono(700), 16);
      c.fillText(q.title, q.x + 20, q.y + 35);

      c.font = '900 85px "Archivo-1000-900", sans-serif';
      c.fillStyle = 'rgba(255, 255, 255, 0.05)';
      c.fillText(q.symbol, q.x + qw - 85, q.y + qh - 20);

      c.font = '900 50px "Archivo-1000-900", sans-serif';
      c.fillStyle = '#ffffff';
      c.shadowColor = q.col;
      c.shadowBlur = 15;
      c.fillText(q.val, q.x + 25, q.y + 98);
      c.shadowBlur = 0;

      c.font = font(F.mono(500), 14);
      c.fillStyle = 'rgba(255, 255, 255, 0.65)';
      c.fillText(q.desc, q.x + 25, q.y + 132);
    });

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.6 + bass * 0.2, grain: 0.18, vignette: 0.3 };
  }
}
