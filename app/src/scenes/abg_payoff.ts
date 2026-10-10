import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgPayoffScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  payoffMesh!: THREE.LineSegments;
  L = new Layer2D();
  
  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = vUv;
      vec3 col = vec3(0.01, 0.03, 0.05);
      
      // Dynamic 3D Financial Grid Glow
      float gridX = step(0.97, fract(uv.x * 32.0 + t * 0.2));
      float gridY = step(0.97, fract(uv.y * 18.0));
      col += vec3(0.0, 0.35, 0.28) * (gridX + gridY) * 0.4;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 5, 12);
    this.cam.lookAt(0, 0, 0);

    // Create 3D Payoff Topography Grid
    const geo = new THREE.WireframeGeometry(new THREE.PlaneGeometry(16, 10, 32, 20));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffc3,
      transparent: true,
      opacity: 0.5
    });
    this.payoffMesh = new THREE.LineSegments(geo, mat);
    this.payoffMesh.rotation.x = -Math.PI * 0.4;
    this.scene3D.add(this.payoffMesh);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    // Animate 3D Camera Orbit
    this.cam.position.x = Math.sin(t * 0.5) * 2.5;
    this.cam.lookAt(0, 0, 0);
    this.payoffMesh.rotation.z = Math.cos(t * 0.4) * 0.1;

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Header
    c.font = font(F.mono(700), 22);
    c.fillStyle = '#00ffc3';
    c.fillText('SIMULATION ENGINE // 3D STRATEGY PAYOFF TOPOGRAPHY', 60, 65);

    // 2D High-res Overlay Curves
    const originX = 140;
    const originY = cy + 50;
    const axisW = W - 280;

    // Zero Line
    c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    c.lineWidth = 2;
    c.setLineDash([8, 8]);
    c.beginPath();
    c.moveTo(originX, originY);
    c.lineTo(originX + axisW, originY);
    c.stroke();
    c.setLineDash([]);

    // Dynamic Iron Condor Curve Points
    const k1 = originX + axisW * 0.2;
    const k2 = originX + axisW * 0.38;
    const k3 = originX + axisW * 0.62;
    const k4 = originX + axisW * 0.8;

    const gainY = originY - 140;
    const lossY = originY + 110;

    // Green Profit Area
    c.fillStyle = 'rgba(0, 255, 195, 0.22)';
    c.beginPath();
    c.moveTo(k1 + (k2 - k1) * 0.5, originY);
    c.lineTo(k2, gainY);
    c.lineTo(k3, gainY);
    c.lineTo(k4 - (k4 - k3) * 0.5, originY);
    c.closePath();
    c.fill();

    // Red Loss Areas
    c.fillStyle = 'rgba(255, 60, 90, 0.2)';
    c.beginPath();
    c.moveTo(originX, originY);
    c.lineTo(k1, lossY);
    c.lineTo(k1 + (k2 - k1) * 0.5, originY);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(k4 - (k4 - k3) * 0.5, originY);
    c.lineTo(k4, lossY);
    c.lineTo(originX + axisW, lossY);
    c.lineTo(originX + axisW, originY);
    c.closePath();
    c.fill();

    // Payoff Line
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 4 + bass * 2;
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 20;
    c.beginPath();
    c.moveTo(originX, lossY);
    c.lineTo(k1, lossY);
    c.lineTo(k2, gainY);
    c.lineTo(k3, gainY);
    c.lineTo(k4, lossY);
    c.lineTo(originX + axisW, lossY);
    c.stroke();
    c.shadowBlur = 0;

    // Scanning Spot Cursor
    const spotX = originX + axisW * (0.5 + Math.sin(t * 2.0) * 0.15);
    c.strokeStyle = '#ffff00';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(spotX, originY - 160);
    c.lineTo(spotX, originY + 130);
    c.stroke();

    c.fillStyle = '#ffff00';
    c.font = font(F.mono(700), 16);
    c.fillText('SPOT: $512.80 (LIVE SIMULATION)', spotX + 12, originY - 130);

    // Callout
    c.fillStyle = '#00ffc3';
    c.font = font(F.mono(700), 20);
    c.fillText('MAX GAIN: +$1,650.00', k2, gainY - 15);

    // Lyric display
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 40);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 90);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.5 + bass * 0.2,
      grain: 0.12,
      vignette: 0.25
    };
  }
}
