import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgOutroScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  gateMesh!: THREE.LineSegments;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.01, 0.03, 0.05);
      
      float glow = exp(-length(uv) * 2.5);
      col += vec3(0.0, 0.35, 0.3) * glow;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0, 12);

    // Create 3D Holographic Cyber Gate Framework
    const geo = new THREE.WireframeGeometry(new THREE.BoxGeometry(10, 6, 2));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffc3,
      transparent: true,
      opacity: 0.5
    });
    this.gateMesh = new THREE.LineSegments(geo, mat);
    this.scene3D.add(this.gateMesh);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Animate 3D Gate Rotation
    this.gateMesh.rotation.y = Math.sin(t * 0.5) * 0.15;
    this.gateMesh.rotation.x = Math.cos(t * 0.4) * 0.1;

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Terminal Card
    const cardW = 760;
    const cardH = 400;
    c.fillStyle = 'rgba(6, 16, 24, 0.92)';
    c.fillRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, cardH);
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 2 + bass * 1.5;
    c.strokeRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, cardH);

    // Header Bar
    c.fillStyle = 'rgba(0, 255, 195, 0.18)';
    c.fillRect(cx - cardW * 0.5, cy - cardH * 0.5 - 10, cardW, 48);
    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 16);
    c.fillText('ACCESS TERMINAL // αβΓ✻1 AUTHORIZATION PORTAL', cx - cardW * 0.5 + 20, cy - cardH * 0.5 + 20);

    // Subtext
    c.textAlign = 'center';
    c.font = font(F.mono(700), 22);
    c.fillStyle = 'rgba(255, 255, 255, 0.75)';
    c.fillText('START YOUR OPTIONS SIMULATION AT', cx, cy - 50);

    // Main Web Link
    c.font = '900 60px "Archivo-1000-900", sans-serif';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 30 + bass * 20;
    c.fillText('www.getabg.one', cx, cy + 20);
    c.shadowBlur = 0;

    // PIN Authentication Simulator
    const pinProgress = Math.min(4, Math.floor((lt % 1.8) * 3));
    const pinStr = '● '.repeat(pinProgress) + '_ '.repeat(4 - pinProgress);

    c.fillStyle = 'rgba(0, 255, 195, 0.1)';
    c.fillRect(cx - 200, cy + 60, 400, 52);
    c.strokeStyle = '#00ffc3';
    c.strokeRect(cx - 200, cy + 60, 400, 52);

    c.font = font(F.mono(700), 24);
    c.fillStyle = '#ffffff';
    c.fillText(`PIN CODE: [ ${pinStr.trim()} ]`, cx, cy + 95);

    // Lyric display
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 38);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 90);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.5 + bass * 0.2,
      grain: 0.12,
      vignette: 0.3
    };
  }
}
