import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirPayoffScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      vec3 col = vec3(0.015, 0.03, 0.04);
      
      // Financial Laser Grid
      float gridX = step(0.98, fract(uv.x * 28.0));
      float gridY = step(0.98, fract(uv.y * 16.0));
      col += vec3(0.0, 0.35, 0.28) * (gridX + gridY) * 0.35;
      
      // Zero Line Glow
      float zeroY = abs(uv.y - 0.52);
      col += vec3(0.0, 0.5, 0.4) * exp(-zeroY * 35.0) * 0.4;
      
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

    // Header Badge
    c.font = font(F.mono(700), 20);
    c.fillStyle = '#00ffc3';
    c.fillText('RISK FORENSICS // IRON CONDOR STRATEGY SIMULATOR', 60, 65);

    // Coordinate Axes
    const originX = 120;
    const originY = cy + 40;
    const axisW = W - 240;

    // Zero PnL Reference
    c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    c.lineWidth = 1.5;
    c.setLineDash([6, 6]);
    c.beginPath();
    c.moveTo(originX, originY);
    c.lineTo(originX + axisW, originY);
    c.stroke();
    c.setLineDash([]);

    // Strikes
    const k1 = originX + axisW * 0.2;
    const k2 = originX + axisW * 0.36;
    const k3 = originX + axisW * 0.64;
    const k4 = originX + axisW * 0.8;

    const gainY = originY - 145;
    const lossY = originY + 115;

    // Green Profit Area
    c.fillStyle = 'rgba(0, 255, 195, 0.2)';
    c.beginPath();
    c.moveTo(k1 + (k2 - k1) * 0.5, originY);
    c.lineTo(k2, gainY);
    c.lineTo(k3, gainY);
    c.lineTo(k4 - (k4 - k3) * 0.5, originY);
    c.closePath();
    c.fill();

    // Red Loss Danger Zones
    c.fillStyle = 'rgba(255, 60, 90, 0.18)';
    c.beginPath();
    c.moveTo(originX, originY);
    c.lineTo(k1, lossY);
    c.lineTo(k1 + (k2 - k1) * 0.5, originY);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(k4 - (k4 - k3) * 0.5, originY);
    c.lineTo(k4, lossY);
    c.lineTo(originX + axisW, lossY);
    c.lineTo(originX + axisW, originY);
    c.closePath();
    c.fill();

    // Main Payoff Line
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 4 + bass * 2;
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 20 + bass * 15;
    c.beginPath();
    c.moveTo(originX, lossY);
    c.lineTo(k1, lossY);
    c.lineTo(k2, gainY);
    c.lineTo(k3, gainY);
    c.lineTo(k4, lossY);
    c.lineTo(originX + axisW, lossY);
    c.stroke();
    c.shadowBlur = 0;

    // Scanning Cursor Laser
    const spotX = originX + axisW * (0.5 + Math.sin(t * 1.8) * 0.14);
    c.strokeStyle = '#ffff00';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(spotX, originY - 160);
    c.lineTo(spotX, originY + 130);
    c.stroke();

    c.fillStyle = '#ffff00';
    c.font = font(F.mono(700), 16);
    c.fillText('SPOT CURSOR: $510.50 (LIVE SCAN)', spotX + 12, originY - 130);

    // Callout Badges
    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 18);
    c.fillText('MAX GAIN: +$1,280.00', k2, gainY - 15);

    c.fillStyle = '#ff3c5a';
    c.fillText('MAX RISK: -$720.00', originX + 10, lossY + 28);

    // Subtitle
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 40);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 90);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.55 + bass * 0.2,
      grain: 0.18,
      vignette: 0.3
    };
  }
}
