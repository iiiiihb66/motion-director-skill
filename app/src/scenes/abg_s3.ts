import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS3Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  curve!: THREE.CatmullRomCurve3;
  tubeMesh!: THREE.Mesh;
  strikeMesh!: THREE.Mesh;
  headMesh!: THREE.Mesh;
  SEG = 72;
  RAD = 10;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.02, 0.03, 0.04);
      float r = length(uv);
      col += vec3(0.18, 0.06, 0.02) * exp(-r * 1.8);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 2.2, 19);

    // 3D Payoff Tube Curve
    this.curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, -2.5, 0),
      new THREE.Vector3(-2.5, -2.5, 0),
      new THREE.Vector3(0.5, -1, 0),
      new THREE.Vector3(3.5, 2, -1),
      new THREE.Vector3(7, 4, -2),
    ]);

    const tgeo = new THREE.TubeGeometry(this.curve, this.SEG, 0.12, this.RAD, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4d12 });
    this.tubeMesh = new THREE.Mesh(tgeo, mat);
    this.scene3D.add(this.tubeMesh);

    // Strike Line Box
    this.strikeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 5, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.4 })
    );
    this.strikeMesh.position.set(0.5, 0.5, 0);
    this.scene3D.add(this.strikeMesh);

    // Head Ball Pointer
    this.headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd9c4 })
    );
    this.scene3D.add(this.headMesh);
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

    const idxCount = this.SEG * this.RAD * 6;
    const segNow = Math.min(this.SEG, Math.floor(lt / BEAT) * 9 + 1);
    (this.tubeMesh.geometry as THREE.BufferGeometry).setDrawRange(0, Math.min(idxCount, segNow * this.RAD * 6));

    const p = clamp01(lt / 3.6);
    const pt = this.curve.getPoint(Math.min(0.985, p));
    this.headMesh.position.copy(pt);

    const jp = Math.pow(1 - ((t % BEAT) / BEAT), 3);
    const s = 1 + 0.5 * jp;
    this.headMesh.scale.set(s, s, s);
    (this.strikeMesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.25 * jp;

    const e = easeIO(clamp01(lt / 4));
    this.cam.position.set(Math.sin(t * 0.4) * 1.2, 2.2, 19 - 3 * e);
    this.cam.lookAt(0, 0.2, -0.5);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    c.font = font(F.mono(700), 22);
    c.fillStyle = '#8a8580';
    c.textAlign = 'center';
    c.fillText('K · 行权价与损益曲线', cx, H - 120);

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.5, grain: 0.12, vignette: 0.25 };
  }
}
