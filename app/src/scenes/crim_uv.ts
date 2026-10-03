import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimUV extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    uniform vec2 uvCenter;
    void main() {
      vec2 uv = vUv;
      vec2 p = uv * vec2(16.0 / 9.0, 1.0);
      vec2 c = uvCenter * vec2(16.0 / 9.0, 1.0);
      
      float dist = length(p - c);
      // Sweeping ultraviolet beam (cone / spotlight)
      float beam = smoothstep(0.75, 0.15, dist);
      
      // Deep dark floor
      vec3 darkBg = vec3(0.015, 0.018, 0.025);
      // UV violet & fluorescent cyan
      vec3 uvLight = mix(vec3(0.2, 0.05, 0.45), vec3(0.0, 0.65, 0.85), beam);
      
      vec3 col = darkBg + uvLight * beam * 0.95;
      
      // Fine surface dust / particles in beam
      float n = fract(sin(dot(uv * 120.0 + vec2(t * 0.3), vec2(12.9898, 78.233))) * 43758.5453);
      if (n > 0.985 && beam > 0.2) {
        col += vec3(0.4, 0.8, 1.0) * beam * 0.8;
      }
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, uvCenter: { value: new THREE.Vector2(0.5, 0.5) } });

  override init() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    // Moving UV spotlight beam (sweeps across scene)
    const beamX = 0.5 + 0.25 * Math.sin(t * 1.8);
    const beamY = 0.5 + 0.12 * Math.cos(t * 2.3);
    this.bg.u.t!.value = t;
    this.bg.u.uvCenter!.value.set(beamX, beamY);
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const beamPxX = beamX * W;
    const beamPxY = beamY * H;

    // 1. Forensic Evidence Markers: [01], [02], [03]
    const markers = [
        { x: 380, y: 460, id: '01', label: 'LATENT PRINT #1' },
        { x: 1050, y: 380, id: '02', label: 'FIBER SPECIMEN' },
        { x: 1480, y: 620, id: '03', label: 'SEROLOGY TRACE' }
    ];

    for (const m of markers) {
        const d = Math.hypot(m.x - beamPxX, m.y - beamPxY);
        const illum = Math.max(0.15, Math.min(1.0, 1.0 - d / 550));

        // Yellow forensic pyramid marker
        c.save();
        c.translate(m.x, m.y);
        
        // Shadow
        c.fillStyle = 'rgba(0, 0, 0, 0.6)';
        c.beginPath();
        c.ellipse(0, 42, 38, 12, 0, 0, Math.PI * 2);
        c.fill();

        // Marker body
        c.fillStyle = `rgba(240, 200, 20, ${0.4 + illum * 0.6})`;
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-32, 40);
        c.lineTo(32, 40);
        c.lineTo(20, -35);
        c.lineTo(-20, -35);
        c.closePath();
        c.fill();
        c.stroke();

        // Marker number
        c.font = font(F.archivo(100, 900), 40);
        c.fillStyle = '#0a0d14';
        c.textAlign = 'center';
        c.fillText(m.id, 0, 18);

        // Technical tag
        c.font = font(F.mono(500), 16);
        c.fillStyle = `rgba(0, 240, 255, ${illum * 0.9})`;
        c.textAlign = 'left';
        c.fillText(`TAG // ${m.label}`, 45, 10);
        c.fillText(`COORDS: X=${m.x} Y=${m.y}`, 45, 32);

        // Leader line
        c.strokeStyle = `rgba(0, 240, 255, ${illum * 0.5})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(25, 0);
        c.lineTo(40, 5);
        c.lineTo(190, 5);
        c.stroke();

        c.restore();
    }

    // 2. High-Tech Fluorescent Fingerprint Ridge Whorls (Center near Marker 01)
    const fpX = 540, fpY = 560;
    const fpDist = Math.hypot(fpX - beamPxX, fpY - beamPxY);
    const fpIllum = Math.max(0.1, Math.min(1.2, 1.2 - fpDist / 450));

    c.save();
    c.translate(fpX, fpY);
    c.rotate(-0.15);
    
    // Draw biometric fingerprint loops
    for (let r = 18; r < 140; r += 10) {
        c.beginPath();
        c.strokeStyle = `rgba(0, 255, 220, ${fpIllum * 0.85})`;
        c.lineWidth = 2.2;
        const pts = 80;
        for (let i = 0; i <= pts; i++) {
            const angle = (i / pts) * Math.PI * 2;
            // perturbation to simulate skin ridges
            const wave = Math.sin(angle * 7.0 + r * 0.3) * 2.5 + Math.cos(angle * 3.0) * 4.0;
            const rx = (r + wave) * 0.85;
            const ry = (r + wave) * 1.2;
            const px = Math.cos(angle) * rx;
            const py = Math.sin(angle) * ry;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.stroke();
    }

    // Biometric scanning reticle box
    c.strokeStyle = `rgba(0, 255, 200, ${fpIllum * 0.9})`;
    c.lineWidth = 1.5;
    const bw = 240, bh = 300;
    c.strokeRect(-bw/2, -bh/2, bw, bh);
    
    // Scanning laser line
    const scanY = (-bh/2) + ((t * 1.5) % 1.0) * bh;
    c.strokeStyle = '#ff3344';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-bw/2 - 10, scanY);
    c.lineTo(bw/2 + 10, scanY);
    c.stroke();

    c.font = font(F.mono(500), 16);
    c.fillStyle = `rgba(0, 255, 200, ${fpIllum})`;
    c.fillText('BIOMETRIC MATCH: 99.4%', -bw/2, bh/2 + 25);
    c.fillText('WHORL PATTERN / TYPE IV', -bw/2, bh/2 + 45);

    c.restore();

    // 3. Metric Photographic Scale Ruler
    const rulerX = 1300, rulerY = 750, rulerW = 400, rulerH = 40;
    c.fillStyle = 'rgba(235, 235, 240, 0.9)';
    c.fillRect(rulerX, rulerY, rulerW, rulerH);
    c.strokeStyle = '#000';
    c.lineWidth = 1.5;
    c.strokeRect(rulerX, rulerY, rulerW, rulerH);
    
    for (let mm = 0; mm <= rulerW; mm += 10) {
        const isCm = (mm % 50 === 0);
        const tickH = isCm ? 22 : 12;
        c.beginPath();
        c.moveTo(rulerX + mm, rulerY);
        c.lineTo(rulerX + mm, rulerY + tickH);
        c.stroke();
        if (isCm && mm > 0 && mm < rulerW) {
            c.font = font(F.mono(700), 14);
            c.fillStyle = '#000';
            c.fillText(`${mm / 10}`, rulerX + mm - 6, rulerY + 34);
        }
    }
    c.font = font(F.mono(700), 14);
    c.fillStyle = '#000';
    c.fillText('FORENSIC SCALE (cm)', rulerX + 10, rulerY + 34);

    // 4. Karaoke Lyric Display
    const line = lyrics.lines[1];
    if (line) {
        c.textAlign = 'center';
        const lyricY = H - 90;
        c.font = 'bold 46px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = 'rgba(0, 0, 0, 0.85)';
        c.fillText(line.text, W * 0.5 + 2, lyricY + 2);
        
        c.fillStyle = '#00ffcc';
        c.fillText(line.text, W * 0.5, lyricY);

        c.font = font(F.mono(500), 18);
        c.fillStyle = rgba('bone', 0.8);
        c.fillText('UV 365nm WAVELENGTH // FLUORESCENCE ACTIVE', W * 0.5, lyricY - 45);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: 0.55,
        halation: 0.3,
        grain: 0.22,
        vignette: 0.35
    };
  }
}
