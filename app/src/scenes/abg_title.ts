import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgTitleScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  starMesh!: THREE.LineSegments;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    uniform float drop;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      float r = length(uv);
      
      // Intense Climax Shockwave Explosion Shader
      float ring = abs(r - fract(drop * 2.5));
      float shock = exp(-ring * 25.0) * drop;
      
      vec3 col = vec3(0.02, 0.06, 0.12);
      col += vec3(0.0, 0.9, 0.75) * exp(-r * 1.5) * (1.0 + drop * 2.0);
      col += vec3(0.1, 1.0, 0.8) * shock;
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, drop: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0, 10);

    // Create 3D Metallic Star Symbol Mesh
    const geo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.5, 1));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffc3,
      transparent: true,
      opacity: 0.8
    });
    this.starMesh = new THREE.LineSegments(geo, mat);
    this.scene3D.add(this.starMesh);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    const dropT = 19.8;
    const timeSinceDrop = Math.max(0, t - dropT);
    const dropAnim = Math.exp(-timeSinceDrop * 3.0);
    const shake = Math.exp(-timeSinceDrop * 4.0) * 18.0;

    this.bg.u.t!.value = t;
    this.bg.u.drop!.value = Math.min(1.0, timeSinceDrop);
    this.bg.render(renderer, out);

    // Animate 3D Starburst
    this.starMesh.rotation.x = t * 1.2;
    this.starMesh.rotation.y = t * 1.6;
    this.starMesh.scale.setScalar(1.0 + Math.sin(t * 8.0) * 0.15 + bass * 0.3);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const shakeX = (Math.sin(t * 70.0) * shake);
    const shakeY = (Math.cos(t * 85.0) * shake);

    const cx = W * 0.5 + shakeX;
    const cy = H * 0.5 + shakeY;

    // Outer Perimeter Bracket
    c.strokeStyle = '#00ffc3';
    c.lineWidth = 3;
    c.strokeRect(50, 50, W - 100, H - 100);

    // Title Slam Scale
    const titleScale = Math.min(1.0, 0.85 + (1.0 - Math.exp(-lt * 12.0)) * 0.15 + bass * 0.08);

    c.save();
    c.translate(cx, cy - 20);
    c.scale(titleScale, titleScale);

    // Massive Glowing Metallic Title
    c.font = '900 160px "Archivo-1000-900", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#00ffc3';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 50 + bass * 35;
    c.fillText('αβΓ✻1', 0, 10);
    c.shadowBlur = 0;

    c.fillStyle = '#ffffff';
    c.fillText('αβΓ✻1', 0, 10);

    // Subtitle
    c.font = font(F.mono(700), 32);
    c.fillStyle = '#00ffc3';
    c.fillText('YOUR ALL-IN-ONE OPTIONS WORKSPACE', 0, 85);
    c.restore();

    // Lyric display
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 42);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 90);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.7 + bass * 0.3,
      grain: 0.15,
      vignette: 0.3
    };
  }
}
