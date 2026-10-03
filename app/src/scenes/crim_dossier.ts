import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { HEX, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, prog, pulse } from '../engine/util';

export default class CrimDossier extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      // Dark slate blueprint gradient
      vec3 col = mix(vec3(0.02, 0.03, 0.04), vec3(0.04, 0.05, 0.07), uv.y);
      
      // Precision engineering grid
      vec2 grid = abs(fract(uv * vec2(32.0, 18.0) - 0.5) - 0.5) / fwidth(uv * vec2(32.0, 18.0));
      float line = 1.0 - min(min(grid.x, grid.y), 1.0);
      col += vec3(0.08, 0.12, 0.16) * line * 0.4;
      
      // Major grid lines
      vec2 gridMajor = abs(fract(uv * vec2(8.0, 4.5) - 0.5) - 0.5) / fwidth(uv * vec2(8.0, 4.5));
      float lineM = 1.0 - min(min(gridMajor.x, gridMajor.y), 1.0);
      col += vec3(0.12, 0.20, 0.28) * lineM * 0.6;
      
      // CRT scanlines
      float scan = sin(uv.y * 1080.0 * 1.5) * 0.04;
      col -= scan;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    // Render background
    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Canvas 2D overlay
    const c = this.L.ctx;
    this.L.clear();

    // 1. Forensic Frame Corners & Crop Marks
    c.strokeStyle = 'rgba(230, 240, 255, 0.6)';
    c.lineWidth = 2;
    const pad = 60, arm = 30;
    // Top-left
    c.beginPath(); c.moveTo(pad, pad + arm); c.lineTo(pad, pad); c.lineTo(pad + arm, pad); c.stroke();
    // Top-right
    c.beginPath(); c.moveTo(W - pad - arm, pad); c.lineTo(W - pad, pad); c.lineTo(W - pad, pad + arm); c.stroke();
    // Bottom-left
    c.beginPath(); c.moveTo(pad, H - pad - arm); c.lineTo(pad, H - pad); c.lineTo(pad + arm, H - pad); c.stroke();
    // Bottom-right
    c.beginPath(); c.moveTo(W - pad - arm, H - pad); c.lineTo(W - pad, H - pad); c.lineTo(W - pad, H - pad - arm); c.stroke();

    // 2. Top Header Metadata
    c.font = font(F.mono(500), 20);
    c.fillStyle = rgba('bone', 0.85);
    c.fillText('METROPOLITAN FORENSIC DIVISION // EVIDENCE SECTION', pad + 10, pad + 24);
    
    c.textAlign = 'right';
    const timecode = `REC [00:00:0${Math.floor(t)}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}]`;
    c.fillStyle = rgba('signal', 0.95);
    c.fillText(timecode, W - pad - 10, pad + 24);
    c.textAlign = 'left';

    // 3. Central Dossier Card
    const cardW = 1100, cardH = 580;
    const cx = W * 0.5, cy = H * 0.5 + 20;
    const x0 = cx - cardW * 0.5, y0 = cy - cardH * 0.5;

    // Card background
    c.fillStyle = 'rgba(10, 15, 22, 0.85)';
    c.fillRect(x0, y0, cardW, cardH);
    c.strokeStyle = 'rgba(100, 150, 200, 0.4)';
    c.lineWidth = 1.5;
    c.strokeRect(x0, y0, cardW, cardH);

    // Hazard stripes banner (Crime scene tape motif)
    const tapeH = 26;
    c.save();
    c.beginPath();
    c.rect(x0, y0, cardW, tapeH);
    c.clip();
    c.fillStyle = 'rgba(240, 180, 20, 0.9)';
    c.fillRect(x0, y0, cardW, tapeH);
    // diagonal stripes
    c.fillStyle = 'rgba(20, 20, 20, 0.9)';
    for (let sx = -tapeH; sx < cardW + tapeH; sx += 40) {
      c.beginPath();
      c.moveTo(x0 + sx, y0 + tapeH);
      c.lineTo(x0 + sx + 20, y0);
      c.lineTo(x0 + sx + 35, y0);
      c.lineTo(x0 + sx + 15, y0 + tapeH);
      c.fill();
    }
    c.restore();

    // Case Title & Stamp
    c.font = font(F.archivo(100, 900), 48);
    c.fillStyle = rgba('bone', 0.95);
    c.fillText('CASE FILE: #079-CRIM', x0 + 50, y0 + 100);

    c.font = font(F.mono(500), 22);
    c.fillStyle = rgba('paper', 0.65);
    c.fillText('CLASSIFICATION: FORENSIC INVESTIGATION & EVIDENCE LOG', x0 + 50, y0 + 138);

    // Red Confidential Stamp
    c.save();
    c.translate(x0 + cardW - 190, y0 + 110);
    c.rotate(-0.12);
    c.strokeStyle = rgba('signal', 0.9);
    c.lineWidth = 3.5;
    c.strokeRect(-120, -32, 240, 64);
    c.font = font(F.archivo(100, 900), 32);
    c.fillStyle = rgba('signal', 0.9);
    c.textAlign = 'center';
    c.fillText('CONFIDENTIAL', 0, 10);
    c.restore();

    // Divider line
    c.strokeStyle = 'rgba(120, 160, 200, 0.3)';
    c.beginPath();
    c.moveTo(x0 + 50, y0 + 175);
    c.lineTo(x0 + cardW - 50, y0 + 175);
    c.stroke();

    // Technical parameter columns
    c.font = font(F.mono(400), 18);
    c.fillStyle = rgba('bone', 0.7);
    const colY = y0 + 220;
    c.fillText('INCIDENT DATE: 2026-10-03', x0 + 50, colY);
    c.fillText('JURISDICTION: SECTOR 4 SPECIAL UNIT', x0 + 50, colY + 36);
    c.fillText('LEAD INVESTIGATOR: FORENSIC LAB #03', x0 + 50, colY + 72);
    c.fillText('STATUS: ACTIVE INVESTIGATION', x0 + 50, colY + 108);

    c.fillText('SPECTRAL ANALYSIS: UV-365nm UV/VIS', x0 + 550, colY);
    c.fillText('CHAIN OF CUSTODY: VERIFIED', x0 + 550, colY + 36);
    c.fillText('LOCARD INDEX: POSITIVE EVIDENCE', x0 + 550, colY + 72);
    c.fillText('BIOMETRIC RETRIEVAL: IN PROGRESS', x0 + 550, colY + 108);

    // Audio status & Heartbeat monitor
    const monitorY = y0 + 390;
    c.fillStyle = 'rgba(15, 25, 35, 0.8)';
    c.fillRect(x0 + 50, monitorY, cardW - 100, 80);
    c.strokeStyle = 'rgba(0, 255, 180, 0.4)';
    c.strokeRect(x0 + 50, monitorY, cardW - 100, 80);

    // Pulse line
    c.beginPath();
    c.strokeStyle = '#00ffcc';
    c.lineWidth = 2;
    for (let px = 0; px < cardW - 100; px += 2) {
      const pTime = t * 3.0 + px * 0.02;
      const beatPulse = Math.sin(pTime * 6.28);
      const spike = Math.exp(-Math.pow((pTime % 3.14) - 1.5, 2) * 20.0) * 25.0 * Math.sin(pTime * 20.0);
      const py = monitorY + 40 + (spike + beatPulse * 4.0);
      if (px === 0) c.moveTo(x0 + 50 + px, py);
      else c.lineTo(x0 + 50 + px, py);
    }
    c.stroke();

    // 4. Karaoke Lyric Display
    const line = lyrics.lines[0];
    if (line) {
      c.textAlign = 'center';
      const lyricY = H - 90;
      c.font = 'bold 44px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
      
      // Calculate highlight based on words
      let currentWord = '';
      for (const w of line.words) {
        if (t >= w.start && t <= w.end + 0.3) {
          currentWord = w.w;
        }
      }
      
      // Draw background halo
      c.fillStyle = 'rgba(0, 0, 0, 0.85)';
      c.fillText(line.text, cx + 2, lyricY + 2);
      
      // Highlight sung characters
      c.fillStyle = rgba('bone', 0.98);
      c.fillText(line.text, cx, lyricY);

      // Accent mark
      if (currentWord) {
        c.font = font(F.mono(500), 18);
        c.fillStyle = rgba('signal', 0.9);
        c.fillText(`▶ AUDIO TRANSCRIPT [${currentWord}]`, cx, lyricY - 45);
      }
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
      bloom: 0.35,
      grain: 0.25,
      vignette: 0.3
    };
  }
}
