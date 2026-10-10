import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgS4Scene extends Scene {
  cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 220);
  scene3D = new THREE.Scene();
  dialGroup = new THREE.Group();
  needleMesh!: THREE.Mesh;
  L = new Layer2D();

  bg = new FSPass(`
    uniform float t;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      vec3 col = vec3(0.02, 0.03, 0.05);
      float r = length(uv);
      col += vec3(0.2, 0.05, 0.01) * exp(-r * 1.5);
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 } });

  override init() {
    this.cam.position.set(0, 2.0, 12);
    this.cam.lookAt(0, 0.6, -4);

    this.dialGroup.position.set(0, 1.2, -4);
    this.dialGroup.scale.setScalar(0.85);
    this.scene3D.add(this.dialGroup);

    const BONE = 0xf4f1ea;
    const SIGNAL = 0xff4d12;

    // Torus Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.08, 12, 72),
      new THREE.MeshBasicMaterial({ color: BONE })
    );
    this.dialGroup.add(ring);

    // Ticks
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * 0.75 - i * (Math.PI * 1.5 / 12);
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, i % 3 === 0 ? 0.55 : 0.3, 0.09),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? SIGNAL : BONE })
      );
      tick.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0);
      tick.rotation.z = a - Math.PI / 2;
      this.dialGroup.add(tick);
    }

    // Needle
    this.needleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.7, 0.12),
      new THREE.MeshBasicMaterial({ color: SIGNAL })
    );
    this.needleMesh.geometry.translate(0, 1.15, 0);
    this.dialGroup.add(this.needleMesh);

    // Hub
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshBasicMaterial({ color: BONE })
    );
    this.dialGroup.add(hub);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const lt = f.lt;

    this.bg.u.t!.value = t;
    this.bg.render(renderer, out);

    const BEAT = 0.5;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const step = Math.floor(lt / BEAT);
    const a = Math.PI * 0.75 - clamp01(step / 8) * (Math.PI * 1.5);
    this.needleMesh.rotation.z = a - Math.PI / 2;

    this.cam.position.set(Math.sin(t * 0.5) * 3, 2.0, 12);
    this.cam.lookAt(0, 0.6, -4);

    renderer.render(this.scene3D, this.cam);

    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5 + 140;

    const pulse = Math.pow(1 - ((t % BEAT) / BEAT), 3);
    const scale = 1 + 0.04 * pulse;

    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.font = '900 130px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#ff4d12';
    c.shadowColor = '#ff4d12';
    c.shadowBlur = 35;
    c.fillText('×50 杠杆倍率', 0, 0);
    c.restore();

    comp.draw(renderer, this.L.upload(), out);

    return { bloom: 0.5, grain: 0.12, vignette: 0.25 };
  }
}
