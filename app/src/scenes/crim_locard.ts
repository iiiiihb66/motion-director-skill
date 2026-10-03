import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimLocard extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      // Inverted stark high-contrast lab background
      vec3 col = vec3(0.02, 0.025, 0.035);
      
      // Vertical measurement lines
      float vLines = abs(fract(uv.x * 20.0) - 0.5) / fwidth(uv.x * 20.0);
      col += vec3(0.04, 0.08, 0.12) * (1.0 - min(vLines, 1.0)) * 0.4;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;

    // 1. Massive Law Axiom Title Banner
    c.textAlign = 'center';
    c.font = font(F.archivo(100, 900), 56);
    c.fillStyle = rgba('bone', 0.95);
    c.fillText("LOCARD'S EXCHANGE PRINCIPLE", cx, 130);

    c.font = font(F.mono(500), 22);
    c.fillStyle = rgba('signal', 0.9);
    c.fillText('EDMOND LOCARD (1877–1966) // FORENSIC FOUNDATION', cx, 170);

    // Main Axiom Quotation in Giant Bold Type
    c.font = 'bold 72px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
    c.fillStyle = '#ffffff';
    c.shadowColor = '#00f0ff';
    c.shadowBlur = 16;
    c.fillText('“ 凡 走 过 ， 必 留 下 痕 迹 ”', cx, 270);
    c.shadowBlur = 0;

    c.font = font(F.serif(600, true), 30);
    c.fillStyle = rgba('bone', 0.75);
    c.fillText('“Every contact leaves a trace.”', cx, 320);

    // 2. Dual Spectrometry Comparison Display (GC-MS / Mass Spec)
    const specW = 540, specH = 220;
    const specY = 380;
    
    // Sample A Box
    const sAx = 360;
    c.fillStyle = 'rgba(12, 18, 26, 0.85)';
    c.strokeStyle = 'rgba(0, 255, 200, 0.5)';
    c.lineWidth = 1.5;
    c.fillRect(sAx, specY, specW, specH);
    c.strokeRect(sAx, specY, specW, specH);

    c.font = font(F.mono(600), 16);
    c.fillStyle = '#00ffcc';
    c.textAlign = 'left';
    c.fillText('CRIME SCENE TRACE [SPECIMEN-A]', sAx + 20, specY + 30);

    // Spectral Peaks A
    c.beginPath();
    c.strokeStyle = '#00ffcc';
    c.lineWidth = 2;
    const peaksA = [0.1, 0.2, 0.85, 0.15, 0.4, 0.95, 0.3, 0.65, 0.1];
    for (let i = 0; i < peaksA.length; i++) {
        const px = sAx + 40 + i * 55;
        const py = specY + specH - 25 - peaksA[i]! * 140;
        c.moveTo(px, specY + specH - 25);
        c.lineTo(px, py);
    }
    c.stroke();

    // Sample B Box (Suspect Reference)
    const sBx = 1020;
    c.fillStyle = 'rgba(12, 18, 26, 0.85)';
    c.strokeStyle = 'rgba(255, 60, 90, 0.5)';
    c.lineWidth = 1.5;
    c.fillRect(sBx, specY, specW, specH);
    c.strokeRect(sBx, specY, specW, specH);

    c.font = font(F.mono(600), 16);
    c.fillStyle = '#ff3355';
    c.fillText('SUSPECT REFERENCE [SPECIMEN-B]', sBx + 20, specY + 30);

    // Spectral Peaks B (identical match)
    c.beginPath();
    c.strokeStyle = '#ff3355';
    c.lineWidth = 2;
    for (let i = 0; i < peaksA.length; i++) {
        const px = sBx + 40 + i * 55;
        const py = specY + specH - 25 - peaksA[i]! * 140;
        c.moveTo(px, specY + specH - 25);
        c.lineTo(px, py);
    }
    c.stroke();

    // Central Match Confidence Badge
    const midX = (sAx + specW + sBx) / 2;
    c.textAlign = 'center';
    c.fillStyle = 'rgba(0, 255, 180, 0.15)';
    c.strokeStyle = '#00ffcc';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(midX, specY + specH * 0.5, 42, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.font = font(F.archivo(100, 900), 20);
    c.fillStyle = '#00ffcc';
    c.fillText('MATCH', midX, specY + specH * 0.5 - 6);
    c.font = font(F.mono(700), 18);
    c.fillText('99.98%', midX, specY + specH * 0.5 + 16);

    // 3. Technical Footnote
    c.font = font(F.mono(400), 16);
    c.fillStyle = rgba('bone', 0.6);
    c.fillText('CHROMATOGRAPHY RETENTION TIME: t_R = 4.82 min · ION RATIO CONFIRMED', cx, 640);

    // 4. Karaoke Lyric Display
    const line = lyrics.lines[3];
    if (line) {
        c.textAlign = 'center';
        const lyricY = H - 90;
        c.font = 'bold 46px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = 'rgba(0, 0, 0, 0.85)';
        c.fillText(line.text, cx + 2, lyricY + 2);
        
        c.fillStyle = '#ffffff';
        c.fillText(line.text, cx, lyricY);

        c.font = font(F.mono(500), 18);
        c.fillStyle = rgba('signal', 0.9);
        c.fillText('UNIVERSAL LAW OF PHYSICAL EVIDENCE EXCHANGE', cx, lyricY - 45);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: 0.65,
        halation: 0.35,
        grain: 0.2,
        vignette: 0.3
    };
  }
}
