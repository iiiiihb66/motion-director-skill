import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimProfiler extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      vec3 col = vec3(0.015, 0.018, 0.024);
      
      // Fine dark grid
      vec2 grid = abs(fract(uv * 40.0) - 0.5) / fwidth(uv * 40.0);
      float line = 1.0 - min(min(grid.x, grid.y), 1.0);
      col += vec3(0.04, 0.06, 0.09) * line * 0.4;
      
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

    // Header
    c.font = font(F.mono(500), 20);
    c.fillStyle = rgba('bone', 0.85);
    c.textAlign = 'left';
    c.fillText('BEHAVIORAL ANALYSIS UNIT // PSYCHOLOGICAL PROFILING', 80, 80);
    c.textAlign = 'right';
    c.fillStyle = '#ff3344';
    c.fillText('STATUS: SUBJECT PROFILE CONVERGING', W - 80, 80);

    // 1. Suspect Wireframe Facial Mesh (Left side)
    const faceX = 460, faceY = 400;
    c.save();
    c.translate(faceX, faceY);
    
    // Silhouette box
    c.fillStyle = 'rgba(15, 20, 30, 0.8)';
    c.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    c.lineWidth = 1.5;
    c.fillRect(-220, -220, 440, 440);
    c.strokeRect(-220, -220, 440, 440);

    // Facial landmark nodes & lines (Polygonal head contour)
    const nodes: [number, number][] = [
        [0, -140], [-60, -110], [60, -110], [-90, -40], [90, -40],
        [-80, 60], [80, 60], [0, 140], [-35, -20], [35, -20],
        [0, 20], [-40, 75], [40, 75], [0, 85]
    ];

    // Connect wireframe
    c.strokeStyle = 'rgba(0, 255, 200, 0.4)';
    c.lineWidth = 1.2;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i]![0] - nodes[j]![0], nodes[i]![1] - nodes[j]![1]);
            if (d < 110) {
                c.beginPath();
                c.moveTo(nodes[i]![0], nodes[i]![1]);
                c.lineTo(nodes[j]![0], nodes[j]![1]);
                c.stroke();
            }
        }
    }

    // Draw glowing nodes
    for (const [nx, ny] of nodes) {
        c.fillStyle = '#00ffcc';
        c.beginPath();
        c.arc(nx, ny, 3.5, 0, Math.PI * 2);
        c.fill();
    }

    // Biometric scanner sweep box
    c.strokeStyle = '#ff3344';
    c.lineWidth = 1.5;
    const eyeY = -20;
    c.strokeRect(-100, eyeY - 25, 200, 50);
    c.font = font(F.mono(500), 14);
    c.fillStyle = '#ff3344';
    c.textAlign = 'left';
    c.fillText('OCULAR METRICS: MATCH', -95, eyeY - 30);

    c.font = font(F.mono(600), 16);
    c.fillStyle = '#00ffcc';
    c.fillText('SUBJECT ID: [UNSUB-079]', -200, 200);

    c.restore();

    // 2. Behavioral Traits Dossier (Center Right)
    const dossierX = 800, dossierY = 180;
    c.fillStyle = 'rgba(15, 22, 32, 0.85)';
    c.strokeStyle = 'rgba(100, 160, 220, 0.4)';
    c.lineWidth = 1.5;
    c.fillRect(dossierX, dossierY, 980, 210);
    c.strokeRect(dossierX, dossierY, 980, 210);

    c.font = font(F.archivo(100, 800), 24);
    c.fillStyle = '#ffffff';
    c.textAlign = 'left';
    c.fillText('CRIMINAL MOTIVATION & PSYCHOPATHOLOGY', dossierX + 30, dossierY + 45);

    c.font = font(F.mono(400), 17);
    c.fillStyle = rgba('bone', 0.85);
    c.fillText('· OFFENDER CLASSIFICATION: ORGANIZED / CALCULATED', dossierX + 30, dossierY + 85);
    c.fillText('· MOTIVE STRUCTURE: RETRIBUTIVE NARCISSISTIC CONTROL', dossierX + 30, dossierY + 115);
    c.fillText('· FORENSIC AWARENESS: HIGH (COUNTERMEASURES DETECTED)', dossierX + 30, dossierY + 145);
    c.fillText('· GEOGRAPHIC PROFILING: ANCHOR POINT WITHIN 2.5 KM', dossierX + 30, dossierY + 175);

    // 3. Polygraph / Biosignal Waveforms (Bottom Right)
    const polyY = 420, polyH = 200;
    c.fillStyle = 'rgba(10, 15, 22, 0.85)';
    c.strokeStyle = 'rgba(255, 60, 90, 0.4)';
    c.fillRect(dossierX, polyY, 980, polyH);
    c.strokeRect(dossierX, polyY, 980, polyH);

    c.font = font(F.mono(500), 15);
    c.fillStyle = '#ff4466';
    c.fillText('POLYGRAPH / AUTONOMIC NERVOUS SYSTEM READOUT', dossierX + 30, polyY + 30);

    // Waveform Channels (Heart rate, GSR, Respiration)
    const channels = [
        { name: 'ECG / HR', col: '#00ffcc', yOff: 65, freq: 8.0, amp: 22 },
        { name: 'GSR / SKIN', col: '#ffcc00', yOff: 115, freq: 3.0, amp: 14 },
        { name: 'RESPIRATION', col: '#ff3366', yOff: 165, freq: 1.5, amp: 16 }
    ];

    for (const ch of channels) {
        c.font = font(F.mono(600), 13);
        c.fillStyle = ch.col;
        c.fillText(ch.name, dossierX + 30, polyY + ch.yOff + 5);

        c.beginPath();
        c.strokeStyle = ch.col;
        c.lineWidth = 1.8;
        const startX = dossierX + 160;
        const endX = dossierX + 940;
        for (let px = startX; px < endX; px += 3) {
            const tau = (px - startX) * 0.02 + t * 4.0;
            const beatSpike = (ch.name.includes('ECG') && Math.sin(tau * 3.0) > 0.8) ? Math.sin(tau * 20.0) * 18.0 : 0.0;
            const py = polyY + ch.yOff + Math.sin(tau * ch.freq) * ch.amp + beatSpike;
            if (px === startX) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.stroke();
    }

    // 4. Karaoke Lyric Display (Verse 4 or Climax)
    const currentLine = (t < 21.3) ? lyrics.lines[4] : lyrics.lines[5];
    if (currentLine) {
        c.textAlign = 'center';
        const lyricY = H - 90;
        c.font = 'bold 46px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = 'rgba(0, 0, 0, 0.85)';
        c.fillText(currentLine.text, cx + 2, lyricY + 2);
        
        c.fillStyle = '#00ffea';
        c.fillText(currentLine.text, cx, lyricY);

        c.font = font(F.mono(500), 18);
        c.fillStyle = rgba('signal', 0.9);
        c.fillText('DECONSTRUCTING MOTIVE // RECONSTRUCTING THE SILHOUETTE', cx, lyricY - 45);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: 0.5,
        halation: 0.3,
        grain: 0.22,
        vignette: 0.35
    };
  }
}
