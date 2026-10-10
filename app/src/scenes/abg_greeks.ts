import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgGreeksScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  waveMesh!: THREE.Mesh;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      float r = length(uv);
      
      // Cyber Radial Radar Beam
      float beam = sin(atan(uv.y, uv.x) * 4.0 + t * 2.0);
      vec3 col = vec3(0.01, 0.03, 0.06);
      col += vec3(0.0, 0.4, 0.35) * exp(-r * 2.0) * (0.6 + beam * 0.4);
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0, 14);

    // Create 3D Volatility Wave Mesh
    const geo = new THREE.PlaneGeometry(24, 14, 48, 28);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffc3,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.waveMesh = new THREE.Mesh(geo, mat);
    this.waveMesh.position.z = -5;
    this.scene3D.add(this.waveMesh);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Wave Mesh Animation
    const pos = this.waveMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const z = Math.sin(u * 0.5 + t * 3.0) * Math.cos(v * 0.5 + t * 2.0) * (1.2 + bass * 0.8);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Header
    c.font = font(F.mono(700), 22);
    c.fillStyle = '#00ffc3';
    c.fillText('REALTIME ANALYTICS // GREEKS RISK MATRIX (Δ, Γ, Θ, ν)', 60, 65);

    // 4 Holographic 3D Glass Cards
    const qw = (W - 180) * 0.5;
    const qh = (H - 220) * 0.5;

    const cards = [
      { title: 'DELTA (Δ) — DIRECTION', symbol: 'Δ', val: (0.64 + Math.sin(t * 3.0) * 0.03).toFixed(2), desc: 'Price Sensitivity per $1 Move', col: '#00ffc3', x: 60, y: 100 },
      { title: 'GAMMA (Γ) — ACCELERATION', symbol: 'Γ', val: (0.082 + Math.cos(t * 2.5) * 0.004).toFixed(3), desc: 'Delta Acceleration Rate', col: '#00d8ff', x: 60 + qw + 60, y: 100 },
      { title: 'THETA (Θ) — TIME DECAY', symbol: 'Θ', val: `-$${(42.8 + Math.sin(t * 4.0) * 2.0).toFixed(1)}/d`, desc: 'Daily Time Premium Harvest', col: '#ffbb00', x: 60, y: 100 + qh + 40 },
      { title: 'VEGA (ν) — VOLATILITY', symbol: 'ν', val: `+$${(185 + Math.cos(t * 3.0) * 8).toFixed(0)}/%`, desc: 'Implied Volatility Exposure', col: '#ff3c5a', x: 60 + qw + 60, y: 100 + qh + 40 }
    ];

    cards.forEach((q, idx) => {
      c.fillStyle = 'rgba(8, 22, 32, 0.85)';
      c.fillRect(q.x, q.y, qw, qh);
      c.strokeStyle = q.col;
      c.lineWidth = 2 + (idx === 0 ? bass * 2 : 0);
      c.strokeRect(q.x, q.y, qw, qh);

      c.fillStyle = q.col;
      c.font = font(F.mono(700), 16);
      c.fillText(q.title, q.x + 20, q.y + 35);

      // Symbol
      c.font = '900 85px "Archivo-1000-900", sans-serif';
      c.fillStyle = 'rgba(255, 255, 255, 0.05)';
      c.fillText(q.symbol, q.x + qw - 90, q.y + qh - 20);

      // Main Value
      c.font = '900 50px "Archivo-1000-900", sans-serif';
      c.fillStyle = '#ffffff';
      c.shadowColor = q.col;
      c.shadowBlur = 15;
      c.fillText(q.val, q.x + 25, q.y + 98);
      c.shadowBlur = 0;

      c.font = font(F.mono(500), 14);
      c.fillStyle = 'rgba(255, 255, 255, 0.7)';
      c.fillText(q.desc, q.x + 25, q.y + 132);
    });

    // Lyric display
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 40);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 55);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.55 + bass * 0.25,
      grain: 0.12,
      vignette: 0.25
    };
  }
}
