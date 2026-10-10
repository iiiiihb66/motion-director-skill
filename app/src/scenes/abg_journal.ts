import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgJournalScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  cardsGroup = new THREE.Group();
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.02, 0.05, 0.08);
      float line = step(0.98, fract(uv.y * 24.0 + t * 0.1));
      col += vec3(0.0, 0.25, 0.3) * line * 0.3;
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0, 12);

    // Create 3D Holographic Floating Card Outlines
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.PlaneGeometry(5.5, 1.8);
      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00ffc3 : 0x00a8ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(2, 2.5 - i * 1.6, -i * 1.5);
      mesh.rotation.y = -0.25;
      this.cardsGroup.add(mesh);
    }
    this.scene3D.add(this.cardsGroup);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Animate 3D Cards Float
    this.cardsGroup.position.y = Math.sin(t * 1.5) * 0.2;
    this.cardsGroup.rotation.x = Math.sin(t * 0.8) * 0.05;

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;

    // Header
    c.font = font(F.mono(700), 22);
    c.fillStyle = '#00ffc3';
    c.fillText('WORKFLOW ENGINE // TRADE JOURNAL & DECISION REVIEW', 60, 65);

    // Left Column: Performance Metrics Badge
    const panelW = 440;
    const panelH = H - 220;
    c.fillStyle = 'rgba(8, 20, 30, 0.88)';
    c.fillRect(60, 100, panelW, panelH);
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 2;
    c.strokeRect(60, 100, panelW, panelH);

    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 18);
    c.fillText('ATTRIBUTION SUMMARY', 85, 140);

    // Metric 1: Win Rate
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('ACCUMULATED WIN RATE', 85, 185);

    c.font = '900 56px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 20 + bass * 15;
    c.fillText('78.4%', 85, 245);
    c.shadowBlur = 0;

    // Metric 2: Profit Factor
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('PROFIT FACTOR', 85, 295);

    c.font = '900 52px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00d8ff';
    c.fillText('2.65', 85, 350);

    // Metric 3: Decision Count
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.font = font(F.mono(500), 15);
    c.fillText('REVIEWED DECISIONS', 85, 400);

    c.font = '900 40px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#ffffff';
    c.fillText('142 TRADES', 85, 450);

    // Right Column Trade Entries
    const listX = 60 + panelW + 50;
    const listW = W - listX - 60;

    const entries = [
      { id: '#TRD-892', type: 'SPX Iron Condor', pnl: '+$1,450.00', status: 'WIN', tag: 'THETA HARVEST' },
      { id: '#TRD-891', type: 'NVDA Bull Call Spread', pnl: '+$820.00', status: 'WIN', tag: 'VOL EXPANSION' },
      { id: '#TRD-890', type: 'AAPL Covered Call', pnl: '+$340.00', status: 'WIN', tag: 'DELTA HEDGE' },
      { id: '#TRD-889', type: 'TSLA Long Straddle', pnl: '-$280.00', status: 'LOSS', tag: 'DISCIPLINED STOP' }
    ];

    entries.forEach((e, idx) => {
      const ey = 100 + idx * 108;
      c.fillStyle = 'rgba(10, 24, 36, 0.85)';
      c.fillRect(listX, ey, listW, 92);
      c.strokeStyle = e.status === 'WIN' ? '#00ffc3' : '#ff3c5a';
      c.lineWidth = 1.5;
      c.strokeRect(listX, ey, listW, 92);

      c.fillStyle = '#ffffff';
      c.font = font(F.mono(700), 18);
      c.fillText(`${e.id} — ${e.type}`, listX + 20, ey + 36);

      c.font = font(F.mono(500), 14);
      c.fillStyle = 'rgba(255, 255, 255, 0.6)';
      c.fillText('Attribution: Scientific Review', listX + 20, ey + 66);

      // PnL
      c.textAlign = 'right';
      c.font = '900 26px "Archivo-1000-900", sans-serif';
      c.fillStyle = e.status === 'WIN' ? '#00ffc3' : '#ff3c5a';
      c.fillText(e.pnl, listX + listW - 20, ey + 54);
      c.textAlign = 'left';
    });

    // Lyric line
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 40);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 55);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.5 + bass * 0.2,
      grain: 0.12,
      vignette: 0.25
    };
  }
}
