import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class AbgIntroScene extends Scene {
  cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  scene3D = new THREE.Scene();
  tunnelParticles!: THREE.Points;
  L = new Layer2D();
  
  bg = new FSPass(`
    uniform float t;
    uniform float bass;
    void main() {
      vec2 uv = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
      float r = length(uv);
      float angle = atan(uv.y, uv.x);
      
      // Quantum Tunnel Raymarching Effect
      float tunnel = sin(r * 20.0 - t * 4.0 + sin(angle * 6.0));
      tunnel = smoothstep(0.2, 0.9, tunnel);
      
      vec3 col = vec3(0.01, 0.04, 0.07);
      col += vec3(0.0, 0.6, 0.5) * tunnel * (0.4 + bass * 0.6);
      col += vec3(0.0, 0.9, 0.7) * exp(-r * 3.0) * (0.8 + bass * 0.5);
      
      fragColor = vec4(col, 1.0);
    }
  `, { t: { value: 0 }, bass: { value: 0 } });

  override init() {
    this.cam.position.set(0, 0, 15);
    
    // Create 3D Particle Field
    const pCount = 1200;
    const pos = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    
    for (let i = 0; i < pCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      colors[i * 3 + 0] = 0.0;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    this.tunnelParticles = new THREE.Points(geo, mat);
    this.scene3D.add(this.tunnelParticles);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    const t = f.t;
    const lt = f.lt;
    const bass = audio.env('bass', t);

    // 1. Render Shader Background
    this.bg.u.t!.value = t;
    this.bg.u.bass!.value = bass;
    this.bg.render(renderer, out);

    // 2. Animate 3D Camera & Particles
    this.cam.position.z = 15 - (lt * 2.5);
    this.tunnelParticles.rotation.z = t * 0.2;
    this.tunnelParticles.rotation.y = Math.sin(t * 0.5) * 0.2;

    // Render 3D Scene to compositor
    renderer.render(this.scene3D, this.cam);

    // 3. Render 2D Dynamic Text Overlay
    const c = this.L.ctx;
    this.L.clear();

    const cx = W * 0.5;
    const cy = H * 0.5;

    // Title Scale Slam
    const titleScale = Math.min(1.0, 0.7 + (1.0 - Math.exp(-lt * 5.0)) * 0.3 + bass * 0.05);

    c.save();
    c.translate(cx, cy - 30);
    c.scale(titleScale, titleScale);

    // Glowing main Title
    c.font = '900 130px "Archivo-1000-900", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillStyle = 'rgba(0, 255, 195, 0.25)';
    c.shadowColor = '#00ffc3';
    c.shadowBlur = 35 + bass * 25;
    c.fillText('αβΓ✻1', 0, 0);
    c.shadowBlur = 0;

    c.fillStyle = '#ffffff';
    c.fillText('αβΓ✻1', 0, 0);

    // Subtitle Tagline
    c.font = font(F.mono(700), 26);
    c.fillStyle = '#00e6b4';
    c.fillText('DECIPHER OPTIONS // MASTER THE GREEKS', 0, 60);
    c.restore();

    // Lyric line
    const curLine = lyrics.lineAt(t);
    if (curLine) {
      c.textAlign = 'center';
      c.font = font(F.archivo(100, 700), 40);
      c.fillStyle = 'rgba(0, 255, 195, 0.4)';
      c.fillText(curLine.text, cx, H - 118);
      c.fillStyle = '#ffffff';
      c.fillText(curLine.text, cx, H - 120);
    }

    comp.draw(renderer, this.L.upload(), out);

    return {
      bloom: 0.55 + bass * 0.2,
      grain: 0.15,
      vignette: 0.3
    };
  }
}
