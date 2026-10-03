import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimTitle extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    uniform float flash;
    void main() {
      vec2 uv = vUv;
      // Stark flashing noir background
      vec3 col = mix(vec3(0.01), vec3(0.05), uv.y);
      col += vec3(flash * 0.4);
      
      // Heavy raster lines
      float raster = sin(uv.y * 1080.0 * 2.0) * 0.08;
      col -= raster;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, flash: { value: 0 } });

  override init() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    // Drop hit occurs at t = 24.8s (lt ~ 0.3s)
    const dropT = 24.8;
    const isDrop = t >= dropT;
    const timeSinceDrop = Math.max(0, t - dropT);
    const flash = Math.exp(-timeSinceDrop * 6.0);
    const shake = isDrop ? Math.exp(-timeSinceDrop * 4.0) * 12.0 : 0.0;
    const shakeX = (Math.sin(t * 70.0) * shake);
    const shakeY = (Math.cos(t * 85.0) * shake);

    this.bg.u.t!.value = t;
    this.bg.u.flash!.value = flash;
    this.bg.render(renderer, out);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5 + shakeX;
    const cy = H * 0.5 + shakeY;

    // 1. Forensic Warning Perimeter Frames
    c.strokeStyle = flash > 0.3 ? '#ff2244' : 'rgba(255, 255, 255, 0.4)';
    c.lineWidth = 4;
    c.strokeRect(60, 60, W - 120, H - 120);

    // Hazard Corner Brackets
    const bSize = 60;
    c.fillStyle = '#ff2244';
    // TL
    c.fillRect(60, 60, bSize, 8); c.fillRect(60, 60, 8, bSize);
    // TR
    c.fillRect(W - 60 - bSize, 60, bSize, 8); c.fillRect(W - 68, 60, 8, bSize);
    // BL
    c.fillRect(60, H - 68, bSize, 8); c.fillRect(60, H - 60 - bSize, 8, bSize);
    // BR
    c.fillRect(W - 60 - bSize, H - 68, bSize, 8); c.fillRect(W - 68, H - 60 - bSize, 8, bSize);

    // 2. Barcode Graphic Banner (Top Center)
    const barX = cx - 240, barY = 130;
    c.fillStyle = rgba('bone', 0.9);
    for (let b = 0; b < 480; b += 8) {
        const bw = ((b * 13) % 7 > 2) ? 4 : 2;
        c.fillRect(barX + b, barY, bw, 36);
    }
    c.font = font(F.mono(700), 16);
    c.textAlign = 'center';
    c.fillText('// EVIDENCE ID: CRIM-9021-X //', cx, barY + 58);

    // 3. GIANT CLIMAX TITLE SLAM: "犯 罪 学" & "CRIMINOLOGY"
    const scale = isDrop ? Math.min(1.0, 0.85 + (1.0 - Math.exp(-timeSinceDrop * 12.0)) * 0.15) : 0.85;

    c.save();
    c.translate(cx, cy - 20);
    c.scale(scale, scale);

    // Glow underlay
    c.font = '900 160px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
    c.fillStyle = '#ff0033';
    c.shadowColor = '#ff1133';
    c.shadowBlur = 35;
    c.fillText('犯  罪  学', 0, 10);
    c.shadowBlur = 0;

    // Main sharp characters
    c.fillStyle = '#ffffff';
    c.fillText('犯  罪  学', 0, 10);

    // Subtitle English: CRIMINOLOGY
    c.font = font(F.archivo(125, 900), 64);
    c.fillStyle = '#00f5ff';
    c.shadowColor = '#00f5ff';
    c.shadowBlur = 20;
    c.fillText('C R I M I N O L O G Y', 0, 105);
    c.shadowBlur = 0;

    // Technical definition tag
    c.font = font(F.mono(500), 20);
    c.fillStyle = rgba('bone', 0.85);
    c.fillText('THE SYSTEMATIC STUDY OF CRIME, JUSTICE & EVIDENCE', 0, 160);

    c.restore();

    // 4. Karaoke Lyric Display
    const line = lyrics.lines[6]; // "这里是——犯罪学。"
    if (line) {
        c.textAlign = 'center';
        const lyricY = H - 95;
        c.font = 'bold 44px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = 'rgba(0, 0, 0, 0.9)';
        c.fillText(line.text, cx + 2, lyricY + 2);
        
        c.fillStyle = '#ff2244';
        c.fillText(line.text, cx, lyricY);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: isDrop ? 0.95 : 0.5,
        halation: isDrop ? 0.6 : 0.3,
        grain: 0.3,
        vignette: 0.4,
        flash: flash * 0.4
    };
  }
}
