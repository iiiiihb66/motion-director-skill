import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS5Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  posts: { dot: THREE.Mesh; x: number }[] = [];
  cursorMesh!: THREE.Mesh;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.02, 0.03, 0.04);
      float r = length(uv);
      col += vec3(0.18, 0.05, 0.01) * exp(-r * 1.8);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(-10, 6, 16);
    this.cam.lookAt(-9, 0.5, -3);

    const BONE = 0xf4f1ea;
    const SIGNAL = 0xff4d12;

    // Timeline Axis Line
    const tline = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.07, 0.07),
      new THREE.MeshBasicMaterial({ color: 0x8a8580 })
    );
    tline.position.set(0, 0, -3);
    this.scene3D.add(tline);

    // Posts & Dots (D1..D5)
    for (let i = 0; i < 5; i++) {
      const x = -9.6 + i * 4.8;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 2.2, 10),
        new THREE.MeshBasicMaterial({ color: BONE })
      );
      post.position.set(x, 1.1, -3);
      this.scene3D.add(post);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 14, 14),
        new THREE.MeshBasicMaterial({ color: SIGNAL })
      );
      dot.position.set(x, 2.8, -3);
      dot.visible = false;
      this.scene3D.add(dot);

      this.posts.push({ dot, x });
    }

    // Cursor
    this.cursorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd9c4 })
    );
    this.scene3D.add(this.cursorMesh);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const BEAT = 0.5;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const easeIO = (v: number) => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    const pi = Math.min(4, Math.floor(lt / BEAT));
    this.posts.forEach((p, i) => { p.dot.visible = i <= pi; });

    const cx = this.posts[pi].x;
    this.cursorMesh.position.set(cx, 0, -3);

    const jp = Math.pow(1 - ((t % BEAT) / BEAT), 3);
    const s = 1 + 0.4 * jp;
    this.cursorMesh.scale.set(s, s, s);

    const e = easeIO(clamp01(lt / 4));
    const dx = -10 + 20 * e;
    this.cam.position.set(dx, 6, 16);
    this.cam.lookAt(dx + 1, 0.5, -3);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const wCenter = W * 0.5;
    c.font = font(F.mono(700), 22);
    c.fillStyle = '#f4f1ea';
    c.textAlign = 'center';
    c.fillText('复盘时间轴 // D1 ~ D5 决策节点记录', wCenter, 90);

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.5, grain: 0.12, vignette: 0.25 };
  }
}
