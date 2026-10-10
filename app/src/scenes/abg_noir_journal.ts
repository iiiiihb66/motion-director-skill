import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgNoirJournalScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      vec3 col = vec3(0.02, 0.04, 0.06);
      float raster = sin(uv.y * 1080.0 * 2.0) * 0.06;
      col -= raster;
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

    c.font = font(F.mono(700), 20);
    c.fillStyle = '#00ffc3';
    c.fillText('WORKFLOW FORENSICS // TRADE JOURNAL & ATTRIBUTION ENGINE', 60, 65);

    // Left Column: Performance Metrics Panel
    const panelW = 440;
    const panelH = H - 220;
    c.fillStyle = 'rgba(8, 20, 30, 0.9)';
    c.fillRect(60, 100, panelW, panelH);
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 2;
    c.strokeRect(60, 100, panelW, panelH);

    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 18);
    c.fillText('ATTRIBUTION SUMMARY', 85, 140);

    // Metric 1: Win Rate & Stamp
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('WIN RATE (胜率归因)', 85, 185);

    c.font = '900 58px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 25 + bass * 15;
    c.fillText('78.4%', 85, 245);
    c.shadowBlur = 0;

    // VERIFIED Stamp
    if (lt > 0.8) {
      c.save();
      c.translate(330, 230);
      c.rotate(-0.15);
      c.strokeStyle = '#ff3c5a';
      c.lineWidth = 4;
      c.strokeRect(-65, -25, 130, 50);
      c.font = font(F.mono(700), 16);
      c.fillStyle = '#ff3c5a';
      c.textAlign = 'center';
      c.fillText('VERIFIED', 0, 6);
      c.restore();
    }

    // Metric 2: Profit Factor
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('PROFIT FACTOR (盈亏因子)', 85, 295);

    c.font = '900 52px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00d8ff';
    c.fillText('2.65', 85, 350);

    // Metric 3: Total Trades
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('REVIEWED DECISIONS (归因复盘)', 85, 400);

    c.font = '900 40px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#ffffff';
    c.fillText('142 TRADES', 85, 450);

    // Right Column Entries
    const listX = 60 + panelW + 40;
    const listW = W - listX - 60;

    const entries = [
      { id: '#TRD-892', type: 'SPX Iron Condor', pnl: '+$1,450.00', status: 'WIN', tag: 'THETA HARVEST' },
      { id: '#TRD-891', type: 'NVDA Bull Call Spread', pnl: '+$820.00', status: 'WIN', tag: 'VOL EXPANSION' },
      { id: '#TRD-890', type: 'AAPL Covered Call', pnl: '+$340.00', status: 'WIN', tag: 'DELTA HEDGE' },
      { id: '#TRD-889', type: 'TSLA Long Straddle', pnl: '-$280.00', status: 'LOSS', tag: 'DISCIPLINED STOP' }
    ];

    entries.forEach((e, idx) => {
      const ey = 100 + idx * 108;
      c.fillStyle = 'rgba(10, 24, 36, 0.9)';
      c.fillRect(listX, ey, listW, 92);
      c.strokeStyle = e.status === 'WIN' ? '#00ffc3' : '#ff3c5a';
      c.lineWidth = 1.5;
      c.strokeRect(listX, ey, listW, 92);

      c.fillStyle = '#ffffff';
      c.font = font(F.mono(700), 18);
      c.fillText(`${e.id} — ${e.type}`, listX + 20, ey + 36);

      c.font = font(F.mono(500), 14);
      c.fillStyle = 'rgba(255, 255, 255, 0.6)';
      c.fillText(`Execution & Attribution Review`, listX + 20, ey + 66);

      c.textAlign = 'right';
      c.font = '900 26px "Archivo-1000-900", sans-serif';
      c.fillStyle = e.status === 'WIN' ? '#00ffc3' : '#ff3c5a';
      c.fillText(e.pnl, listX + listW - 20, ey + 54);
      c.textAlign = 'left';
    });

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.55 + bass * 0.2, grain: 0.18, vignette: 0.3 };
  }
}
