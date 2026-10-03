import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimArchive extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    uniform float fade;
    void main() {
      vec2 uv = vUv;
      // Dark archival background
      vec3 col = mix(vec3(0.015, 0.018, 0.022), vec3(0.005, 0.007, 0.010), fade);
      
      // Fine terminal grid lines
      vec2 grid = abs(fract(uv * vec2(24.0, 13.5) - 0.5) - 0.5) / fwidth(uv * vec2(24.0, 13.5));
      float line = 1.0 - min(min(grid.x, grid.y), 1.0);
      col += vec3(0.04, 0.07, 0.10) * line * (1.0 - fade) * 0.3;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, fade: { value: 0 } });

  override init() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    // Final fade out after t = 32.5s
    const fadeOut = Math.max(0, Math.min(1.0, (t - 32.0) / 2.0));

    this.bg.u.t!.value = t;
    this.bg.u.fade!.value = fadeOut;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // 1. Archival Summary Terminal Card
    const cardW = 1000, cardH = 500;
    const x0 = cx - cardW * 0.5;
    const y0 = cy - cardH * 0.5 - 20;

    c.fillStyle = `rgba(12, 16, 24, ${0.9 * (1.0 - fadeOut)})`;
    c.strokeStyle = `rgba(0, 255, 200, ${0.4 * (1.0 - fadeOut)})`;
    c.lineWidth = 1.5;
    c.fillRect(x0, y0, cardW, cardH);
    c.strokeRect(x0, y0, cardW, cardH);

    // Terminal header
    c.font = font(F.mono(600), 20);
    c.fillStyle = `rgba(0, 255, 200, ${0.9 * (1.0 - fadeOut)})`;
    c.fillText('ARCHIVAL SYSTEM // EVIDENCE RETENTION REPOSITORY', x0 + 40, y0 + 50);

    c.strokeStyle = `rgba(0, 255, 200, ${0.2 * (1.0 - fadeOut)})`;
    c.beginPath();
    c.moveTo(x0 + 40, y0 + 70);
    c.lineTo(x0 + cardW - 40, y0 + 70);
    c.stroke();

    // Typewriter log entries
    const logs = [
        'CASE STATUS: ADJUDICATED & SOLVED',
        'MATERIAL EVIDENCE: 14 ARTIFACTS VAULT-STORED',
        'FORENSIC DNA PROFILE: CODIS RECORD #883921-X',
        'BALLISTICS MATCH: CONFIRMED 100% (REPEATED TOOLMARK)',
        'DIGITAL CHAIN OF CUSTODY: BLOCKCHAIN TIMESTAMP VERIFIED',
        'VERIFICATION HASH: 9f83a0e1c27894d... [SHA-256 OK]'
    ];

    c.font = font(F.mono(400), 18);
    c.fillStyle = `rgba(230, 240, 255, ${0.85 * (1.0 - fadeOut)})`;
    for (let i = 0; i < logs.length; i++) {
        c.fillText(`[LOG 0${i + 1}]  ${logs[i]}`, x0 + 40, y0 + 115 + i * 36);
    }

    // 2. Huge Red "CASE CLOSED / 结案归档" Stamp
    c.save();
    c.translate(x0 + cardW - 220, y0 + 260);
    c.rotate(-0.16);
    c.strokeStyle = `rgba(255, 30, 60, ${0.95 * (1.0 - fadeOut)})`;
    c.lineWidth = 4.5;
    c.strokeRect(-150, -45, 300, 90);

    c.font = '900 40px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
    c.fillStyle = `rgba(255, 30, 60, ${0.95 * (1.0 - fadeOut)})`;
    c.textAlign = 'center';
    c.fillText('结 案 归 档', 0, -2);
    c.font = font(F.archivo(100, 900), 22);
    c.fillText('CASE CLOSED // ARCHIVED', 0, 30);
    c.restore();

    // 3. Final philosophical quote & Lyric
    const line = lyrics.lines[7]; // "真相永不泯灭。结案，归档。"
    if (line) {
        c.textAlign = 'center';
        const lyricY = H - 90;
        c.font = 'bold 46px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = `rgba(0, 0, 0, ${0.9 * (1.0 - fadeOut)})`;
        c.fillText(line.text, cx + 2, lyricY + 2);
        
        c.fillStyle = `rgba(255, 255, 255, ${0.95 * (1.0 - fadeOut)})`;
        c.fillText(line.text, cx, lyricY);

        c.font = font(F.serif(600, true), 22);
        c.fillStyle = `rgba(200, 220, 240, ${0.7 * (1.0 - fadeOut)})`;
        c.fillText('“Veritas Numquam Perit — Truth Never Dies”', cx, lyricY - 45);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: 0.35 * (1.0 - fadeOut),
        halation: 0.2 * (1.0 - fadeOut),
        grain: 0.25,
        vignette: 0.4 + fadeOut * 0.6
    };
  }
}
