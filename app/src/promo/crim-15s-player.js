'use strict';
const canvas = document.getElementById('screen'), ctx = canvas.getContext('2d');
const depthFrame = window.CrimCreateScene(document.getElementById('depth')).frame;
const W = 1080, H = 1920, D = 15.0, TAU = Math.PI * 2;
const CUTS = [0, 2.8, 5.8, 8.8, 11.8, 15.0];
const C = {
  white: '#f1f0e5',
  muted: '#9daeb7',
  green: '#ff3d55',
  mint: '#92e9ff',
  edge: '#35434c',
  amber: '#ffb340',
  dark: '#080c10'
};
const MOTION = window.CrimMotion;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const UI = {
  play: document.getElementById('toggle'),
  seek: document.getElementById('seek'),
  now: document.getElementById('now')
};

let t = 0, playing = false, raf = 0, lastPaint = -1, starting = false;
let showSafeArea = false;

// Drawing primitives
function text(s, x, y, size, color = C.white, weight = 600, align = 'left', font = 'sans') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${weight} ${size}px ${
    font === 'mono'
      ? 'ui-monospace,SFMono-Regular,Menlo,monospace'
      : font === 'serif'
      ? 'Georgia,serif'
      : 'Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif'
  }`;
  ctx.fillText(s, x, y);
}

function line(x1, y1, x2, y2, color = C.edge, width = 2, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function round(x, y, w, h, r, fill, stroke = null, lw = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function circ(x, y, r, fill, stroke = null, lw = 1) {
  if (r < 0.1) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

// Kinetic typography routines (PDOOM style)
function kinetic(str, u, start, size, y, color = C.white, mode = 'slam') {
  if (u < start) return;
  const age = u - start;
  const p = MOTION.prog(u, start, start + 0.32, MOTION.ease.outExpo);
  const settle = MOTION.springStep(age, 3.2, 0.62);

  ctx.save();
  ctx.translate(540, y);
  const scale = mode === 'slam' ? 1 + 0.15 * MOTION.pulse(u, start, 0.08) : 0.65 + 0.35 * settle;
  ctx.scale(scale, scale);
  ctx.rotate(mode === 'tilt' ? 0.08 * (1 - p) : 0);
  ctx.font = `800 ${size}px "PingFang SC","Hiragino Sans GB",sans-serif`;
  const fit = Math.min(1, 740 / Math.max(1, ctx.measureText(str).width));
  ctx.scale(fit, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (mode === 'echo') {
    for (let i = 3; i > 0; i--) {
      ctx.globalAlpha = 0.14 * (1 - p * 0.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeText(str, 0, -i * size * 0.14);
    }
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = Math.min(1, 0.2 + p);
  ctx.fillStyle = color;
  ctx.fillText(str, 0, (1 - p) * 40);
  ctx.restore();
}

function assemble(str, u, start, size, y, color = C.white) {
  ctx.font = `800 ${size}px "PingFang SC","Hiragino Sans GB",sans-serif`;
  const n = [...str];
  const width = n.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const fit = Math.min(1, 740 / width);

  ctx.save();
  ctx.translate(540, y);
  ctx.scale(fit, 1);
  let x = -width / 2;
  n.forEach((ch, i) => {
    const w = ctx.measureText(ch).width;
    const p = MOTION.prog(u, start + i * 0.065, start + i * 0.065 + 0.38, MOTION.ease.outBack);
    ctx.save();
    ctx.translate(x + w / 2, (1 - p) * (i % 2 ? 90 : -90));
    ctx.rotate((1 - p) * (i % 2 ? 0.25 : -0.25));
    ctx.globalAlpha = clamp(p);
    text(ch, 0, 0, size, color, 800, 'center');
    ctx.restore();
    x += w;
  });
  ctx.restore();
}

function label(s, u) {
  text(s, 540, 360, 30, C.muted, 700, 'center', 'mono');
  line(220, 400, 860, 400, C.edge, 2, 0.8);
}

function note(a, b = '') {
  text(a, 540, 1340, 42, C.white, 650, 'center');
  if (b) text(b, 540, 1400, 26, C.muted, 600, 'center', 'mono');
}

function stamp(str, u, start, y) {
  if (u < start) return;
  const p = MOTION.prog(u, start, start + 0.28, MOTION.ease.outExpo);
  ctx.save();
  ctx.translate(540, y);
  ctx.rotate(-0.08 * (1 - p * 0.3));
  ctx.scale(1 + 0.35 * (1 - p), 1 + 0.35 * (1 - p));
  ctx.globalAlpha = p;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 5;
  ctx.strokeRect(-220, -60, 440, 120);
  text(str, 0, 22, 70, C.green, 850, 'center');
  ctx.restore();
}

// 5 Cinematic Scenes (strictly within Safe Area: X: 100~900, Y: 220~1500)
function shot0(u) {
  label('CASE / 079 — SCENE INVESTIGATION', u);
  kinetic('079', u, 0, 220, 580, C.white, 'echo');
  if (u < 1.3) {
    assemble('物证建档', u, 0.2, 76, 760, C.green);
    note('现场封锁 · 建立法定物证链', 'CHAIN OF CUSTODY / LOCKED');
  } else {
    kinetic('现场警戒', u, 1.3, 98, 540, C.white, 'slam');
    kinetic('物证封锁', u, 1.8, 92, 690, C.green, 'tilt');
    note('封锁第一现场 · 痕迹禁止污染', 'CRIME SCENE PERIMETER SECURED');
  }
}

function shot1(u) {
  label('02 / ULTRAVIOLET FORENSICS', u);
  assemble('微量物证', u, 0.1, 104, 530, C.mint);
  kinetic('激光显影', u, 1.1, 88, 680, C.white, 'echo');
  note(u < 1.8 ? '紫外荧光扫描 · 潜藏痕迹重现' : '微量物质激活 · 显影吻合', 'TRACE EVIDENCE / UV SCAN');
  const p = clamp(u / 3.0);
  line(240, 1260, 840, 1260, C.mint, 2, 0.6);
  circ(240 + 600 * p, 1260, 6, C.mint);
}

function shot2(u) {
  label('03 / BALLISTIC RECONSTRUCTION', u);
  if (u < 1.4) {
    kinetic('弹道膛线', u, 0.1, 102, 530, C.green, 'echo');
    text('TRACE → VECTOR → FIRING POINT', 540, 680, 28, C.muted, 600, 'center', 'mono');
    note('沿三维空间轨迹 · 逆向追溯', 'TRAJECTORY CALCULATION / 3D MODEL');
  } else {
    assemble('反推真相', u, 1.4, 106, 530, C.white);
    kinetic('空间轨迹', u, 1.9, 90, 680, C.green, 'slam');
    note('枪口矢量与着弹点复原', 'SPATIAL RECONSTRUCTION COMPLETED');
  }
}

function shot3(u) {
  label('04 / LOCARD EXCHANGE PRINCIPLE', u);
  if (u < 1.5) {
    assemble('洛卡德定律', u, 0.1, 118, 520, C.white);
    text('物质交换法则', 540, 670, 54, C.mint, 700, 'center');
    note('凡两物接触 · 必发生物质交换', 'EVERY CONTACT LEAVES A TRACE');
  } else {
    kinetic('凡有接触', u, 1.5, 124, 510, C.white, 'tilt');
    kinetic('必留痕迹', u, 2.0, 108, 680, C.green, 'slam');
    note('微观粒子转移 · 证据永不消失', 'LOCARD PRINCIPLE VERIFIED');
  }
}

function shot4(u) {
  if (u < 1.0) {
    const k = u < 0.33 ? 0 : u < 0.66 ? 1 : 2;
    kinetic(['犯', '罪', '学'][k], u, [0, 0.33, 0.66][k], 340, 800, C.white, 'echo');
  } else {
    assemble('犯罪学', u, 1.0, 196, 680, C.white);
    text('CRIMINOLOGY', 540, 800, 48, C.green, 700, 'center', 'mono');
    line(250, 860, 830, 860, C.green, 3);
    text('让证据，穿透沉默。', 540, 940, 48, C.white, 700, 'center');
    stamp('结案归档', u, 1.7, 1160);
    stamp('真相永存', u, 2.2, 1320);
    text('CASE 079 / TRUTH IN THE TRACE', 540, 1440, 26, C.muted, 600, 'center', 'mono');
  }
}

const shots = [shot0, shot1, shot2, shot3, shot4];

function stage(sec) {
  let i = 0;
  while (i < 4 && sec >= CUTS[i + 1]) i++;
  return i;
}

// Forensic optics HUD
function optics(s, u) {
  const reveal = MOTION.prog(u, 0.1, 0.9, MOTION.ease.outExpo);
  ctx.save();
  ctx.translate(540, 1010);
  ctx.rotate(s === 2 ? u * 0.3 : 0);
  ctx.strokeStyle = s === 1 ? C.mint : C.green;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.38;

  for (let i = 0; i < 4; i++) {
    const angle = (i * TAU) / 4;
    const r = 240 + 16 * Math.sin(u * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, r, angle, angle + 0.35 * reveal);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.25;
  ctx.setLineDash([4, 16]);
  ctx.beginPath();
  ctx.arc(0, 0, 270, 0, TAU * reveal);
  ctx.stroke();
  ctx.restore();

  // Iris cut transition
  if (u < 0.28) {
    const p = MOTION.prog(u, 0, 0.28, MOTION.ease.outExpo);
    const cover = (1 - p) * 960;
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, W, cover);
    ctx.fillRect(0, H - cover, W, cover);
  }
}

// Social Media Safe Area Visual Overlay (Douyin / TikTok / Channels mock)
function drawSocialMediaOverlay() {
  ctx.save();

  // 1. Top Danger Zone (Status bar, Search, Back) - 0 to 220px
  ctx.fillStyle = 'rgba(255, 61, 85, 0.18)';
  ctx.fillRect(0, 0, W, 220);
  line(0, 220, W, 220, '#ff3d55', 2);
  text('⚠ 顶部危险区（避开手机状态栏、搜索栏、返回键）', 540, 130, 26, '#ff6e80', 600, 'center');

  // 2. Bottom Danger Zone (Title, Handle, Audio Disc) - 1520 to 1920px
  ctx.fillStyle = 'rgba(255, 61, 85, 0.18)';
  ctx.fillRect(0, 1520, W, 400);
  line(0, 1520, W, 1520, '#ff3d55', 2);
  text('⚠ 底部危险区（避开账号名称、自媒体文案、旋转唱片）', 540, 1710, 26, '#ff6e80', 600, 'center');

  // 3. Right Danger Zone (Like, Comment, Share) - 900 to 1080px (between Y: 400 ~ 1520)
  ctx.fillStyle = 'rgba(255, 61, 85, 0.22)';
  ctx.fillRect(900, 220, 180, 1300);
  line(900, 220, 900, 1520, '#ff3d55', 2);

  // Mock right side icons
  const rightIcons = [
    { y: 680, label: '头像' },
    { y: 820, label: '赞 88w' },
    { y: 960, label: '评 1.2w' },
    { y: 1100, label: '藏 3.5w' },
    { y: 1240, label: '转 8.9k' }
  ];
  rightIcons.forEach(ic => {
    circ(990, ic.y, 42, 'rgba(0,0,0,0.6)', '#ff3d55', 2);
    text(ic.label, 990, ic.y + 70, 20, '#ffffff', 500, 'center');
  });

  // 4. Safe Center Box
  ctx.strokeStyle = '#00ffaa';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.strokeRect(100, 230, 790, 1270);
  ctx.setLineDash([]);
  text('✔ 核心视觉安全区 (SAFE AREA: 100~890, 230~1500)', 500, 265, 24, '#00ffaa', 600, 'center');

  ctx.restore();
}

function render(sec) {
  t = clamp(sec, 0, D);
  const s = stage(t);
  const u = t - CUTS[s];

  depthFrame(t, s);
  ctx.clearRect(0, 0, W, H);

  // Vignette gradient behind text
  const shade = ctx.createLinearGradient(0, 360, 0, 820);
  shade.addColorStop(0, 'rgba(5,8,11,0.68)');
  shade.addColorStop(1, 'rgba(5,8,11,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 360, W, 460);

  // Strictly clip text within Safe Bounds
  ctx.save();
  ctx.beginPath();
  ctx.rect(90, 210, 820, 1310);
  ctx.clip();
  shots[s](u);
  ctx.restore();

  if (s < 4) optics(s, u);

  // Timeline progress line (inside safe zone bottom)
  if (t < 14.8) {
    line(240, 1490, 840, 1490, C.edge, 3);
    line(240, 1490, 240 + 600 * (t / D), 1490, C.green, 4);
  }

  // Draw overlay if safe mode is enabled
  if (showSafeArea) {
    drawSocialMediaOverlay();
  }

  return s;
}

// Audio System with Ducking
const audio = new Audio(document.getElementById('soundtrack').src);
const narration = new Audio(document.getElementById('narration-track').src);
audio.preload = narration.preload = 'auto';
narration.volume = 1;
let musicLevel = 0.65;
let playGeneration = 0;

// Speech activity windows for ducking in 15.00s cut
const voiceWindows = [
  [0.15, 2.76],
  [2.95, 5.48],
  [5.95, 8.52],
  [8.95, 11.45],
  [12.00, 14.30]
];

function mix(sec) {
  let speech = 0;
  for (const [start, end] of voiceWindows) {
    const rise = clamp((sec - start + 0.12) / 0.18);
    const fall = clamp((end + 0.2 - sec) / 0.25);
    speech = Math.max(speech, Math.min(rise, fall));
  }
  audio.volume = musicLevel * (1 - 0.58 * speech);
}

function update() {
  const s = render(t);
  mix(t);
  UI.seek.value = t;
  UI.now.textContent = '00:' + String(Math.floor(t)).padStart(2, '0');
  document.querySelectorAll('[data-jump]').forEach((b) =>
    b.classList.toggle('active', +b.dataset.jump === s)
  );
}

function paint(now) {
  if (!playing) return;
  t = clamp(audio.currentTime, 0, D);
  if (Math.abs(narration.currentTime - audio.currentTime) > 0.12) {
    narration.currentTime = audio.currentTime;
  }
  if (now - lastPaint >= 1000 / 30) {
    update();
    lastPaint = now;
  }
  raf = requestAnimationFrame(paint);
}

function pause() {
  playGeneration++;
  playing = false;
  audio.pause();
  narration.pause();
  cancelAnimationFrame(raf);
  raf = 0;
  UI.play.textContent = '▶　播放';
  t = clamp(audio.currentTime, 0, D);
  update();
}

async function toggle() {
  if (starting) return;
  if (playing) {
    pause();
    return;
  }
  starting = true;
  const generation = ++playGeneration;
  try {
    if (t >= D - 0.05) {
      t = 0;
      audio.currentTime = 0;
    }
    narration.currentTime = audio.currentTime;
    mix(t);
    await Promise.all([audio.play(), narration.play()]);
    if (generation !== playGeneration) {
      audio.pause();
      narration.pause();
      return;
    }
    playing = true;
    UI.play.textContent = 'Ⅱ　暂停';
    lastPaint = -1;
    raf = requestAnimationFrame(paint);
    document.getElementById('status').textContent = '';
  } catch (e) {
    audio.pause();
    narration.pause();
    document.getElementById('status').textContent = '播放失败：' + e.message;
  } finally {
    starting = false;
  }
}

function seek(sec) {
  t = clamp(sec, 0, D);
  audio.currentTime = narration.currentTime = t;
  update();
}

audio.addEventListener('ended', () => {
  playing = false;
  narration.pause();
  cancelAnimationFrame(raf);
  raf = 0;
  t = D;
  UI.play.textContent = '▶　重播';
  update();
});

UI.play.addEventListener('click', toggle);
UI.seek.addEventListener('input', (e) => seek(+e.target.value));
document.querySelectorAll('[data-jump]').forEach((b) =>
  b.addEventListener('click', () => seek(CUTS[+b.dataset.jump]))
);

document.getElementById('music').addEventListener('click', (e) => {
  audio.muted = !audio.muted;
  e.currentTarget.textContent = audio.muted ? '♪　音乐：关' : '♪　音乐：开';
  e.currentTarget.setAttribute('aria-pressed', String(!audio.muted));
});

document.getElementById('voice').addEventListener('click', (e) => {
  narration.muted = !narration.muted;
  e.currentTarget.textContent = narration.muted ? '旁白：关' : '旁白：开';
  e.currentTarget.setAttribute('aria-pressed', String(!narration.muted));
});

document.getElementById('volume').addEventListener('input', (e) => {
  musicLevel = +e.target.value / 100;
  mix(t);
});

document.getElementById('voice-volume').addEventListener('input', (e) => {
  narration.volume = +e.target.value / 100;
});

document.getElementById('safe').addEventListener('click', () => {
  showSafeArea = !showSafeArea;
  document.getElementById('safe').textContent = showSafeArea ? '📐 隐藏安全区' : '📐 显示安全区';
  update();
});

document.getElementById('fullscreen').addEventListener('click', async () => {
  document.body.classList.add('clean');
  try {
    await document.documentElement.requestFullscreen();
  } catch {}
  if (!playing) toggle();
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) document.body.classList.remove('clean');
});

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    seek(t + 0.5);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    seek(t - 0.5);
  } else if (e.key === ']') {
    seek(CUTS[Math.min(4, stage(t) + 1)]);
  } else if (e.key === '[') {
    seek(CUTS[Math.max(0, stage(t) - 1)]);
  } else if (e.key.toLowerCase() === 'h') {
    document.body.classList.toggle('clean');
  } else if (e.key.toLowerCase() === 's') {
    document.getElementById('safe').click();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (playing || starting)) pause();
});

update();
