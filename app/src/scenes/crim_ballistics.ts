import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CrimBallistics extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      // Dark radar screen circular grid
      vec2 c = uv - vec2(0.5);
      float r = length(c);
      
      vec3 col = vec3(0.012, 0.015, 0.022);
      
      // Concentric range circles
      float circles = abs(fract(r * 8.0) - 0.5) / fwidth(r * 8.0);
      float circleLine = 1.0 - min(circles, 1.0);
      col += vec3(0.06, 0.12, 0.18) * circleLine * 0.5;
      
      // Crosshair axes
      vec2 axes = abs(c) / fwidth(c);
      float axisLine = 1.0 - min(min(axes.x, axes.y), 1.0);
      col += vec3(0.08, 0.18, 0.25) * axisLine * 0.7;
      
      // Radar sweep
      float angle = atan(c.y, c.x);
      float sweep = fract((angle / 6.28318) - t * 0.4);
      col += vec3(0.0, 0.35, 0.5) * exp(-sweep * 6.0) * 0.4;
      
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
    const cy = H * 0.5 - 20;

    // 1. Rifling Barrel Geometry (Right side cross section)
    const barrelX = 1450, barrelY = 460, barrelR = 140;
    c.save();
    c.translate(barrelX, barrelY);
    c.rotate(t * 0.3);

    // Outer barrel ring
    c.strokeStyle = 'rgba(0, 220, 255, 0.6)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, barrelR, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(0, 220, 255, 0.3)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(0, 0, barrelR * 0.82, 0, Math.PI * 2); c.stroke();

    // 6 Rifling Grooves & Lands
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        c.beginPath();
        c.strokeStyle = 'rgba(0, 255, 200, 0.8)';
        c.lineWidth = 2.5;
        const r1 = barrelR * 0.82;
        const r2 = barrelR;
        c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        c.lineTo(Math.cos(a + 0.15) * r2, Math.sin(a + 0.15) * r2);
        c.stroke();
    }
    c.restore();

    // Rifling text
    c.font = font(F.mono(500), 16);
    c.fillStyle = '#00ffcc';
    c.fillText('CALIBER: 9×19mm PARABELLUM', barrelX - 120, barrelY + barrelR + 35);
    c.fillText('RIFLING: 6 GROOVES / RIGHT HAND TWIST 1:10"', barrelX - 120, barrelY + barrelR + 58);

    // 2. 3D Laser Trajectory Vector (Center Left across screen)
    const trajStartX = 180, trajStartY = 680;
    const trajEndX = 1180, trajEndY = 260;

    // Dashed guide vector
    c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    c.lineWidth = 1;
    c.setLineDash([6, 6]);
    c.beginPath();
    c.moveTo(trajStartX - 100, trajStartY + 42);
    c.lineTo(trajEndX + 200, trajEndY - 84);
    c.stroke();
    c.setLineDash([]);

    // Solid Laser Trajectory (Red Signal)
    c.strokeStyle = 'rgba(255, 45, 65, 0.95)';
    c.lineWidth = 3;
    c.shadowColor = '#ff2244';
    c.shadowBlur = 12;
    c.beginPath();
    c.moveTo(trajStartX, trajStartY);
    c.lineTo(trajEndX, trajEndY);
    c.stroke();
    c.shadowBlur = 0;

    // Impact Point & Dispersion Cone
    c.strokeStyle = '#ffdd33';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(trajEndX, trajEndY, 10 + 4 * Math.sin(t * 8.0), 0, Math.PI * 2);
    c.stroke();

    // Measurement Calipers along the trajectory
    c.font = font(F.mono(500), 17);
    c.fillStyle = '#ff5566';
    c.fillText('TRAJECTORY VECTOR V_0', trajStartX + 40, trajStartY - 25);
    c.fillStyle = '#ffffff';
    c.fillText('AZIMUTH: 142.6° | ELEVATION: +24.8°', trajStartX + 40, trajStartY - 5);
    c.fillText('ESTIMATED VELOCITY: 382 m/s', trajStartX + 40, trajStartY + 18);

    // 3. Blood Spatter Parabolic Arc Calculation (Top Left)
    const spatterX = 220, spatterY = 220;
    c.fillStyle = 'rgba(10, 18, 28, 0.85)';
    c.strokeStyle = 'rgba(0, 200, 255, 0.4)';
    c.lineWidth = 1.5;
    c.fillRect(spatterX, spatterY, 440, 200);
    c.strokeRect(spatterX, spatterY, 440, 200);

    c.font = font(F.mono(600), 16);
    c.fillStyle = '#00e5ff';
    c.fillText('BLOODSTAIN PATTERN ANALYSIS (BPA)', spatterX + 20, spatterY + 30);
    
    c.font = font(F.mono(400), 15);
    c.fillStyle = rgba('bone', 0.85);
    c.fillText('FORMULA: sin(θ) = Width / Length', spatterX + 20, spatterY + 60);
    c.fillText('IMPACT ANGLE: θ = arcsin(14.2 / 28.5) = 29.8°', spatterX + 20, spatterY + 85);
    c.fillText('ORIGIN OF CONVERGENCE: POINT (X: 412, Y: 188)', spatterX + 20, spatterY + 110);
    c.fillText('VELOCITY CLASS: HIGH VELOCITY IMPACT (>100 fps)', spatterX + 20, spatterY + 135);

    // Elliptical blood spatter droplet icon
    c.save();
    c.translate(spatterX + 360, spatterY + 80);
    c.rotate(-0.52);
    c.fillStyle = 'rgba(230, 20, 50, 0.85)';
    c.beginPath();
    c.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
    c.fill();
    // Minor spines
    c.strokeStyle = 'rgba(230, 20, 50, 0.85)';
    c.lineWidth = 1.5;
    for (let s = -2; s <= 2; s++) {
        c.beginPath();
        c.moveTo(25, s * 4);
        c.lineTo(38 + Math.abs(s) * 3, s * 7);
        c.stroke();
    }
    c.restore();

    // 4. Karaoke Lyric Display
    const line = lyrics.lines[2];
    if (line) {
        c.textAlign = 'center';
        const lyricY = H - 90;
        c.font = 'bold 46px "Archivo-1000-900", "PingFang SC", "Heiti SC", sans-serif';
        
        c.fillStyle = 'rgba(0, 0, 0, 0.85)';
        c.fillText(line.text, cx + 2, lyricY + 2);
        
        c.fillStyle = '#ff3355';
        c.fillText(line.text, cx, lyricY);

        c.font = font(F.mono(500), 18);
        c.fillStyle = rgba('bone', 0.8);
        c.fillText('BALLISTIC TELEMETRY & SPATTER TRAJECTORY CALCULATED', cx, lyricY - 45);
    }

    comp.draw(renderer, this.L.upload(), out);
    return {
        bloom: 0.6,
        halation: 0.35,
        grain: 0.22,
        vignette: 0.3
    };
  }
}
