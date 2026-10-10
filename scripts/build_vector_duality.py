import base64
from pathlib import Path

root = Path(__file__).resolve().parent.parent

# Read the audio files
audio_dir = root / "odyssey-of-light/audio"
score_b64 = base64.b64encode((audio_dir / "light_odyssey_30s_score.mp3").read_bytes()).decode()
voice_b64 = base64.b64encode((audio_dir / "light_odyssey_30s_voice.mp3").read_bytes()).decode()

html_content = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#060911">
<title>光的历程 · 极简硬核矢量蓝图版 (The Odyssey of Light · Vector Duality Edition)</title>
<style>
:root {{
  color-scheme: dark;
  --bg: #060911;
  --panel: #0a101b;
  --panel2: #101927;
  --edge: #18283d;
  --cyan: #00d8f6;
  --gold: #ffd15c;
  --white: #fbf8ee;
  --muted: #8b9bb4;
  --ruby: #e24e4e;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--white);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Songti SC", serif;
}}
body {{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  min-height: 100vh;
}}

.showcase-container {{
  width: min(96vw, 1320px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}}

header {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}}
.brand {{
  display: flex;
  align-items: center;
  gap: 14px;
}}
h1 {{
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .04em;
  color: var(--cyan);
  font-family: ui-monospace, Menlo, monospace;
}}
.tag-badge {{
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 216, 246, 0.15);
  color: var(--cyan);
  border: 1px solid rgba(0, 216, 246, 0.4);
  border-radius: 4px;
  font-weight: 700;
  font-family: ui-monospace, Menlo, monospace;
}}
.badge-specs {{
  font-size: 11px;
  color: var(--muted);
  font-family: ui-monospace, Menlo, monospace;
}}

.video-frame {{
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #04060b;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--edge);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 216, 246, 0.06);
}}
canvas {{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}}

.controls-bar {{
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--panel);
  border: 1px solid var(--edge);
  padding: 10px 14px;
  border-radius: 10px;
}}
#btn-play {{
  cursor: pointer;
  background: var(--cyan);
  color: #04070e;
  border: none;
  font-weight: 800;
  font-size: 13px;
  padding: 7px 16px;
  border-radius: 6px;
  transition: transform .1s, opacity .2s;
}}
#btn-play:hover {{ transform: scale(1.03); opacity: 0.95; }}

.time {{
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--muted);
}}
.time span#time-current {{ color: var(--white); font-weight: 700; }}

#seek-slider {{
  flex: 1;
  appearance: none;
  height: 5px;
  background: var(--panel2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}}
#seek-slider::-webkit-slider-thumb {{
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--cyan);
  cursor: pointer;
  box-shadow: 0 0 10px var(--cyan);
}}

.scene-pills {{
  display: flex;
  gap: 6px;
}}
.scene-pill {{
  cursor: pointer;
  background: var(--panel2);
  border: 1px solid var(--edge);
  color: var(--muted);
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: all .2s;
}}
.scene-pill:hover {{
  border-color: var(--cyan);
  color: #fff;
}}
.scene-pill.active {{
  background: rgba(0, 216, 246, 0.18);
  color: var(--cyan);
  border-color: var(--cyan);
}}
.btn-tool {{
  cursor: pointer;
  background: var(--panel2);
  border: 1px solid var(--edge);
  color: var(--white);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  transition: all .2s;
}}
.btn-tool:hover {{ border-color: var(--cyan); color: var(--cyan); }}

/* Clean Theater Mode */
body.clean {{
  padding: 0;
  background: #000;
}}
.clean .showcase-container {{
  width: 100vw;
  height: 100vh;
  gap: 0;
}}
.clean .video-frame {{
  border: 0;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
}}
.clean header, .clean .controls-bar {{
  display: none;
}}
</style>
</head>
<body>

<div class="showcase-container">
  <header>
    <div class="brand">
      <h1>THE ODYSSEY OF LIGHT</h1>
      <span class="tag-badge">VECTOR DUALITY EDITION</span>
    </div>
    <div class="badge-specs">
      30.00S · 60FPS CODE-DRIVEN GEOMETRIC OPTICS BLUEPRINT · 东方雅言双轨音画
    </div>
  </header>

  <div class="video-frame">
    <canvas id="screen" width="1920" height="1080"></canvas>
  </div>

  <div class="controls-bar">
    <button id="btn-play">▶　播放</button>
    <div class="time">
      <span id="time-current">00:00</span> / <span id="time-total">00:30</span>
    </div>
    <input id="seek-slider" type="range" min="0" max="30" step="0.05" value="0" aria-label="播放进度">

    <div class="scene-pills">
      <button class="scene-pill active" data-beat="0">01 初光</button>
      <button class="scene-pill" data-beat="1">02 棱镜</button>
      <button class="scene-pill" data-beat="2">03 泊松亮斑</button>
      <button class="scene-pill" data-beat="3">04 电磁量子</button>
      <button class="scene-pill" data-beat="4">05 终极交响</button>
    </div>

    <button id="btn-voice" class="btn-tool">🎙 旁白：开</button>
    <button id="btn-score" class="btn-tool">♪ 配乐：开</button>
    <button id="btn-clean" class="btn-tool">⛶ 沉浸全屏 (H)</button>
  </div>
</div>

<!-- Embedded Audio Tracks (Base64 Zero-CORS) -->
<audio id="audio-voice" src="data:audio/mpeg;base64,{voice_b64}" preload="auto" hidden></audio>
<audio id="audio-score" src="data:audio/mpeg;base64,{score_b64}" preload="auto" hidden></audio>

<script>
(function() {{
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');

  const W = 1920, H = 1080, D = 30.0, TAU = Math.PI * 2;
  const CUTS = [0, 6.5, 11.6, 17.6, 23.6, 30.0];

  const C = {{
    bg: '#060911',
    white: '#ffffff',
    bone: '#fbf8ee',
    gold: '#ffd15c',
    cyan: '#00d8f6',
    cyanMuted: 'rgba(0, 216, 246, 0.45)',
    cyanDim: 'rgba(0, 216, 246, 0.15)',
    muted: '#8b9bb4',
    edge: '#18283d',
    ruby: '#e24e4e',
    // 7 Spectrum colors
    spec: [
      '#ff3d55', // Red
      '#ff8533', // Orange
      '#ffd15c', // Yellow
      '#00e575', // Green
      '#00e5ff', // Cyan
      '#3d75ff', // Blue
      '#9d4edd'  // Violet
    ]
  }};

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeOutExpo = x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  const easeInOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  // Audio elements
  const audioVoice = document.getElementById('audio-voice');
  const audioScore = document.getElementById('audio-score');

  // UI elements
  const btnPlay = document.getElementById('btn-play');
  const seekSlider = document.getElementById('seek-slider');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const scenePills = document.querySelectorAll('.scene-pill');
  const btnVoice = document.getElementById('btn-voice');
  const btnScore = document.getElementById('btn-score');
  const btnClean = document.getElementById('btn-clean');

  let t = 0, playing = false, raf = 0, lastPaint = -1, starting = false;

  // Basic drawing primitives
  function text(s, x, y, size, color = C.white, weight = 600, align = 'left', font = 'sans') {{
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${{weight}} ${{size}}px ${{
      font === 'mono'
        ? 'ui-monospace,SFMono-Regular,Menlo,monospace'
        : font === 'serif'
        ? 'Georgia,"Songti SC",serif'
        : 'Inter,-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'
    }}`;
    ctx.fillText(s, x, y);
  }}

  function line(x1, y1, x2, y2, color = C.edge, width = 2, alpha = 1) {{
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }}

  function circ(x, y, r, fill = null, stroke = null, lw = 1.5, alpha = 1) {{
    if (r < 0.2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    if (fill) {{ ctx.fillStyle = fill; ctx.fill(); }}
    if (stroke) {{ ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }}
    ctx.restore();
  }}

  // Stamp badge
  function stamp(str, u, start, x, y, col = C.ruby) {{
    if (u < start) return;
    const p = clamp((u - start) / 0.25);
    const e = easeOutExpo(p);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.05 * (1 - e * 0.4));
    ctx.scale(1 + 0.3 * (1 - e), 1 + 0.3 * (1 - e));
    ctx.globalAlpha = p;
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-180, -42, 360, 84);
    text(str, 0, 15, 48, col, 850, 'center', 'serif');
    ctx.restore();
  }}

  // Subtitles
  const SUBTITLES = [
    {{ start: 0.10, end: 6.45, text: "混沌初开。两千年前，先贤借一孔暗室，始窥光行之直。" }},
    {{ start: 6.60, end: 11.45, text: "牛顿剖分七彩，断言光是微粒，称霸物理百载！" }},
    {{ start: 11.70, end: 17.50, text: "双缝干涉，光加光竟得黑暗；泊松亮斑，阴影中奇迹绽放！" }},
    {{ start: 17.75, end: 23.40, text: "麦克斯韦奏响电磁交响，爱因斯坦唤醒光量子——微粒重生！" }},
    {{ start: 23.65, end: 29.80, text: "它非凡俗水波，亦非世间弹珠——它是光，造化至深的量子交响！" }}
  ];

  function renderSubtitles(curT) {{
    const sub = SUBTITLES.find(s => curT >= s.start - 0.15 && curT <= s.end + 0.35);
    if (!sub) return;

    const fadeIn = clamp((curT - (sub.start - 0.15)) / 0.28);
    const fadeOut = clamp(((sub.end + 0.35) - curT) / 0.32);
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const fontSize = 35;
    ctx.font = `600 ${{fontSize}}px "Songti SC", "PingFang SC", "Noto Serif CJK SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(sub.text).width;
    const boxW = Math.max(380, textWidth + 56);
    const boxH = fontSize + 26;
    const boxX = 960 - boxW / 2;
    const boxY = 918 - boxH / 2;

    // Dark sleek capsule pill background with subtle golden edge
    ctx.fillStyle = 'rgba(6, 10, 18, 0.92)';
    ctx.strokeStyle = 'rgba(255, 209, 92, 0.4)';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    // High legibility bone white
    ctx.fillStyle = '#fdfbf7';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(sub.text, 960, 918);

    ctx.restore();
  }}

  // Technical HUD Bar (Bottom) - As seen in the user's thumbnail screenshot
  function renderTechnicalHUD(curT) {{
    const yLine = 995;
    line(50, yLine, W - 50, yLine, C.cyan, 2);

    // Left metadata in Cyan
    text('THE ODYSSEY OF LIGHT // 30S HERO DUALITY', 52, yLine + 38, 22, C.cyan, 700, 'left', 'mono');

    // Ticks on left
    for (let i = 0; i < 8; i++) {{
      line(50 + i * 24, yLine - 8, 50 + i * 24, yLine, C.cyan, 1.5);
    }}

    // Center Coordinates
    const tc = `TIME [${{String(Math.floor(curT)).padStart(2,'0')}}:${{String(Math.floor((curT % 1) * 60)).padStart(2,'0')}}]  FPS: 60  SYS: VECTOR`;
    text(tc, 960, yLine + 38, 16, C.muted, 600, 'center', 'mono');

    // Right metadata in Warm Gold
    text('WAVE · PARTICLE', W - 52, yLine + 38, 22, C.gold, 700, 'right', 'mono');

    // Ticks on right
    for (let i = 0; i < 8; i++) {{
      line(W - 50 - i * 24, yLine - 8, W - 50 - i * 24, yLine, C.gold, 1.5);
    }}
  }}

  // --------------------------------------------------------------------------
  // Vector Prism & Rainbow Dispersion (The Signature Icon from User's Screenshot)
  // --------------------------------------------------------------------------
  function drawPrismSchematic(px, py, scale = 1, showWaves = true, showParticles = true, timeOffset = 0) {{
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);

    // 1. Warm radial amber glow behind prism
    const glow = ctx.createRadialGradient(0, 0, 30, 0, 0, 340);
    glow.addColorStop(0, 'rgba(255, 180, 50, 0.22)');
    glow.addColorStop(0.5, 'rgba(255, 140, 30, 0.08)');
    glow.addColorStop(1, 'rgba(255, 140, 30, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 340, 0, TAU);
    ctx.fill();

    // 2. Incident stark white beam from bottom-left
    const inStartX = -520, inStartY = 160;
    const hitX = -65, hitY = 0;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(inStartX, inStartY);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();
    ctx.restore();

    // 3. Prism triangle
    const topY = -180, btmY = 160, halfW = 140;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(halfW, btmY);
    ctx.lineTo(-halfW, btmY);
    ctx.closePath();

    ctx.fillStyle = '#0b1320';
    ctx.fill();
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Beam inside prism
    const exitX = 65, exitY = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(exitX, exitY);
    ctx.stroke();

    // 4. 7 Refracted Spectral Vector Rays fanning out to the right
    const rayLength = 1200;
    const angles = [-0.18, -0.12, -0.06, 0.0, 0.06, 0.12, 0.18]; // Fan angles

    angles.forEach((ang, idx) => {{
      const col = C.spec[idx];
      const endX = exitX + Math.cos(ang) * rayLength;
      const endY = exitY + Math.sin(ang) * rayLength;

      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.8;
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(exitX, exitY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();

      // Flowing photon particle beads along the rays
      if (showParticles) {{
        for (let pIdx = 0; pIdx < 3; pIdx++) {{
          const pProgress = ((timeOffset * 0.45 + pIdx * 0.33 + idx * 0.08) % 1);
          const pxPos = exitX + Math.cos(ang) * rayLength * pProgress;
          const pyPos = exitY + Math.sin(ang) * rayLength * pProgress;

          ctx.save();
          ctx.shadowColor = C.gold;
          ctx.shadowBlur = 18;
          circ(pxPos, pyPos, 9, C.gold);
          circ(pxPos, pyPos, 4, '#ffffff');
          ctx.restore();
        }}
      }}
    }});

    // 5. Cyan Concentric Wavefronts (Wave Nature)
    if (showWaves) {{
      const waveOriginX = 480, waveOriginY = 0;
      for (let w = 0; w < 7; w++) {{
        const r = ((timeOffset * 90 + w * 70) % 490) + 60;
        const waveAlpha = clamp((490 - r) / 380) * 0.75;

        ctx.save();
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = waveAlpha;
        ctx.beginPath();
        // Elliptical wavefront arcs
        ctx.ellipse(waveOriginX, waveOriginY, r * 1.35, r, 0, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        ctx.restore();
      }}
    }}

    ctx.restore();
  }}

  // --------------------------------------------------------------------------
  // The 5 Animated Beats (Choreographed to 30.00 Seconds in Vector Blueprint Style)
  // --------------------------------------------------------------------------

  // Beat 0: 0.0 - 6.5s / 初光与小孔暗室 (Camera Obscura)
  function beat0(u) {{
    // Background technical blueprint grid
    drawGrid(0.04);

    // Camera Obscura Chamber
    const boxX = 760, boxY = 480, boxW = 400, boxH = 460;
    ctx.save();
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX - boxW/2, boxY - boxH/2, boxW, boxH);

    // Front aperture hole
    const holeX = boxX - boxW/2, holeY = boxY;
    ctx.fillStyle = '#060911';
    ctx.fillRect(holeX - 6, holeY - 24, 12, 48);
    circ(holeX, holeY, 8, C.gold, C.cyan, 2);

    // Candle object on left
    const objX = 240, topObjY = boxY - 140, btmObjY = boxY + 140;
    line(objX, topObjY, objX, btmObjY, C.gold, 5);
    circ(objX, topObjY - 15, 14, C.gold, '#ffffff', 2); // flame

    // Ray tracing lines crossing at the pinhole
    const screenX = boxX + boxW/2 - 10;
    const invTopY = boxY + 120, invBtmY = boxY - 120;

    // Ray 1: Top of flame through pinhole to bottom of screen
    line(objX, topObjY, screenX, invTopY, 'rgba(255, 255, 255, 0.75)', 2.5);
    // Ray 2: Base of candle through pinhole to top of screen
    line(objX, btmObjY, screenX, invBtmY, 'rgba(0, 216, 246, 0.75)', 2.5);

    // Inverted image projected on rear screen
    line(screenX, invTopY, screenX, invBtmY, C.gold, 4);
    circ(screenX, invTopY + 12, 10, C.gold);

    // Concentric calibration rings around pinhole
    for (let r = 40; r < 240; r += 50) {{
      circ(holeX, holeY, r, null, C.cyanDim, 1.2);
    }}

    ctx.restore();

    // Typography & Blueprint Notes
    text('ACT 01 / THE PRIMAL RAY // 墨子 · 墨经光学 · 公元前400年', 960, 160, 22, C.cyan, 700, 'center', 'mono');
    line(440, 185, 1480, 185, C.edge, 2);

    text('光行于直', 960, 260, 110, C.gold, 800, 'center', 'serif');
    text('墨子小孔暗室', 960, 340, 52, C.white, 700, 'center', 'serif');

    // Technical note
    text('景到在午 · 有端与景长 · 窥破光线直行之秘', 960, 840, 28, C.bone, 600, 'center', 'serif');
    text('CAMERA OBSCURA // GEOMETRIC OPTICS RAY TRACING', 960, 875, 18, C.muted, 600, 'center', 'mono');
  }}

  // Beat 1: 6.5 - 11.6s / 牛顿三棱镜色散与微粒说 (Newton's Corpuscular Dispersion)
  function beat1(u) {{
    drawGrid(0.04);

    // The iconic prism schematic at center
    drawPrismSchematic(900, 500, 0.95, false, true, u);

    // Typography
    text('ACT 02 / NEWTONIAN CORPUSCULAR REIGN // 1704 艾萨克·牛顿爵士', 960, 160, 22, C.cyan, 700, 'center', 'mono');
    line(440, 185, 1480, 185, C.edge, 2);

    text('七彩色散', 960, 250, 110, C.white, 800, 'center', 'serif');
    text('牛顿微粒说', 960, 330, 52, C.gold, 700, 'center', 'serif');

    stamp('称霸物理百载', u, 2.5, 960, 410, C.ruby);

    // Technical note
    text('白光乃七色微粒之集聚 · 声威赫赫统治学界整整百年', 960, 840, 28, C.bone, 600, 'center', 'serif');
    text('DISPERSION MATRIX // CORPUSCULAR BULLETS STREAM', 960, 875, 18, C.muted, 600, 'center', 'mono');
  }}

  // Beat 2: 11.6 - 17.6s / 托马斯·杨双缝干涉与泊松亮斑 (Wave Interference & Poisson Disk)
  function beat2(u) {{
    drawGrid(0.04);

    if (u < 3.2) {{
      // Double Slits Wave Interference
      const slitX = 480, slitY1 = 440, slitY2 = 560;

      // Slit Barrier
      line(slitX, 200, slitX, slitY1 - 20, C.cyan, 6);
      line(slitX, slitY1 + 20, slitX, slitY2 - 20, C.cyan, 6);
      line(slitX, slitY2 + 20, slitX, 800, C.cyan, 6);

      // Two dual interfering wavefront sources
      for (let r = 20; r < 600; r += 45) {{
        const waveR = (r + u * 120) % 600;
        const alpha = clamp((600 - waveR) / 450) * 0.65;
        circ(slitX, slitY1, waveR, null, C.cyan, 1.8, alpha);
        circ(slitX, slitY2, waveR, null, C.cyan, 1.8, alpha);
      }}

      // Projection screen on right showing interference fringes
      const scrX = 1450;
      line(scrX, 220, scrX, 780, C.edge, 4);

      // Alternating bright and dark bands
      for (let y = 240; y <= 760; y += 40) {{
        const isBright = Math.abs(y - 500) % 80 < 40;
        if (isBright) {{
          line(scrX - 30, y, scrX + 30, y, C.cyan, 6);
          circ(scrX, y, 6, C.gold);
        }} else {{
          line(scrX - 10, y, scrX + 10, y, 'rgba(255,255,255,0.15)', 2);
        }}
      }}

      text('ACT 03 / WAVE REBELLION // 1801 托马斯·杨 双缝干涉实验', 960, 160, 22, C.cyan, 700, 'center', 'mono');
      line(440, 185, 1480, 185, C.edge, 2);

      text('光 ＋ 光 ＝ 黑暗', 960, 250, 105, C.white, 800, 'center', 'serif');
      text('唯有波动方能相消干涉', 960, 330, 46, C.gold, 700, 'center', 'serif');
    }} else {{
      // Poisson's Disk Miracle
      const diskX = 960, diskY = 500, diskR = 120;

      // Dark shadow of the disk
      circ(diskX, diskY, diskR * 1.8, 'rgba(5, 8, 15, 0.95)', C.cyanDim, 2);
      circ(diskX, diskY, diskR, '#080d16', C.cyan, 2.5);

      // Diffraction rings around the disk
      for (let r = diskR + 25; r < 400; r += 35) {{
        circ(diskX, diskY, r, null, C.cyan, 1.5, clamp((400 - r) / 300) * 0.6);
      }}

      // THE MIRACLE BRIGHT SPOT IN THE EXACT CENTER!
      const spotPulse = 14 + 4 * Math.sin(u * 8);
      ctx.save();
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 30;
      circ(diskX, diskY, spotPulse, C.gold);
      circ(diskX, diskY, spotPulse * 0.5, '#ffffff');
      ctx.restore();

      text('ACT 03 / THE POISSON DISK MIRACLE // 1818 泊松亮斑 绝地反转', 960, 160, 22, C.cyan, 700, 'center', 'mono');
      line(440, 185, 1480, 185, C.edge, 2);

      text('泊松亮斑', 960, 250, 110, C.gold, 800, 'center', 'serif');
      stamp('科学绝地反转', u, 3.5, 960, 340, C.ruby);
    }}

    text('阴影正央赫然绽放奇迹光芒 · 微粒神话彻底坍塌', 960, 840, 28, C.bone, 600, 'center', 'serif');
    text('THE POISSON DISK MIRACLE // WAVE THEORY TRIUMPH', 960, 875, 18, C.muted, 600, 'center', 'mono');
  }}

  // Beat 3: 17.6 - 23.6s / 麦克斯韦电磁波与爱因斯坦光电效应
  function beat3(u) {{
    drawGrid(0.04);

    if (u < 3.0) {{
      // Maxwell Electromagnetic Orthogonal Waves
      const startX = 320, endX = 1600, midY = 510;
      line(startX, midY, endX, midY, C.edge, 2);

      // Draw E-wave (Electric Field: Vertical in Cyan)
      ctx.save();
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 6) {{
        const phase = (x - startX) * 0.015 - u * 6;
        const ey = midY + Math.sin(phase) * 110;
        if (x === startX) ctx.moveTo(x, ey);
        else ctx.lineTo(x, ey);
      }}
      ctx.stroke();
      ctx.restore();

      // Draw B-wave (Magnetic Field: Projected Orthogonal in Gold)
      ctx.save();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 6) {{
        const phase = (x - startX) * 0.015 - u * 6;
        const by = midY + Math.cos(phase) * 60; // tilted ellipse projection
        if (x === startX) ctx.moveTo(x, by);
        else ctx.lineTo(x, by);
      }}
      ctx.stroke();
      ctx.restore();

      text('ACT 04 / ELECTROMAGNETIC SYMPHONY // 1865 麦克斯韦方程组', 960, 160, 22, C.cyan, 700, 'center', 'mono');
      line(440, 185, 1480, 185, C.edge, 2);

      text('光即电磁波', 960, 250, 110, C.gold, 800, 'center', 'serif');
      text('电生磁 · 磁生电 · 每秒三十万公里交响奔涌', 960, 330, 44, C.white, 700, 'center', 'serif');
    }} else {{
      // Photoelectric Effect (Einstein 1905)
      const plateX = 960, plateY = 560;

      // Metal Plate
      ctx.fillStyle = '#0c1626';
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 3;
      ctx.strokeRect(400, plateY, 1120, 50);
      ctx.fillRect(400, plateY, 1120, 50);

      // Incoming high-frequency violet/gold photon bullets
      for (let i = 0; i < 4; i++) {{
        const bx = 550 + i * 240 - (u - 3) * 60;
        const by = plateY - 180 + (u - 3) * 200;
        if (by < plateY) {{
          ctx.save();
          ctx.shadowColor = C.gold;
          ctx.shadowBlur = 15;
          circ(bx, by, 10, C.gold);
          ctx.restore();
        }} else {{
          // Liberated ejected electron flying up-right!
          const ex = bx + (u - 3) * 160;
          const ey = plateY - (u - 3) * 190;
          ctx.save();
          ctx.shadowColor = C.cyan;
          ctx.shadowBlur = 15;
          circ(ex, ey, 7, C.cyan);
          line(bx, plateY, ex, ey, 'rgba(0, 216, 246, 0.4)', 2);
          ctx.restore();
        }}
      }}

      text('ACT 04 / PHOTOELECTRIC QUANTA // 1905 爱因斯坦 光电效应', 960, 160, 22, C.cyan, 700, 'center', 'mono');
      line(440, 185, 1480, 185, C.edge, 2);

      text('光量子重生', 960, 250, 110, C.white, 800, 'center', 'serif');
      stamp('爱因斯坦光电效应', u, 3.6, 960, 340, C.ruby);
    }}

    text('红光十年打不出电子 · 弱紫光瞬间激发电弧！', 960, 840, 28, C.bone, 600, 'center', 'serif');
    text('PHOTOELECTRIC REVOLUTION // E = hν DISCRETE PACKETS', 960, 875, 18, C.muted, 600, 'center', 'mono');
  }}

  // Beat 4: 23.6 - 30.0s / 终极波粒二象性全景 (Wave-Particle Duality Grand Finale)
  function beat4(u) {{
    drawGrid(0.05);

    // Full culmination of the thumbnail artwork in 60FPS motion
    drawPrismSchematic(600, 500, 1.0, true, true, u);

    text('ACT 05 / QUANTUM DUALITY // 终极交响 · 造化最深', 960, 150, 22, C.cyan, 700, 'center', 'mono');
    line(440, 175, 1480, 175, C.edge, 2);

    text('光的历程', 960, 250, 125, C.gold, 800, 'center', 'serif');
    text('THE ODYSSEY OF LIGHT', 960, 325, 34, C.cyan, 700, 'center', 'mono');

    if (u > 2.0) {{
      stamp('造化觉醒', u, 2.0, 960, 395, C.ruby);
    }}

    text('它非寻常水波，亦非世间弹珠——它是光，造化最深的量子交响！', 960, 840, 28, C.bone, 700, 'center', 'serif');
    text('WAVE-PARTICLE DUALITY // 300年格致求索 · 以理性之幽光照亮长夜', 960, 875, 18, C.muted, 600, 'center', 'mono');
  }}

  function drawGrid(alpha = 0.04) {{
    ctx.save();
    ctx.strokeStyle = C.cyan;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) {{
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }}
    for (let y = 0; y < H; y += 80) {{
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }}
    ctx.restore();
  }}

  const beats = [beat0, beat1, beat2, beat3, beat4];

  function stage(sec) {{
    let i = 0;
    while (i < 4 && sec >= CUTS[i + 1]) i++;
    return i;
  }}

  // Main Render Frame
  function render(sec) {{
    t = clamp(sec, 0, D);
    const s = stage(t);
    const u = t - CUTS[s];

    ctx.clearRect(0, 0, W, H);

    // Deep void gradient background
    const bgGrad = ctx.createRadialGradient(960, 540, 200, 960, 540, 1000);
    bgGrad.addColorStop(0, '#0a101b');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Render current beat vector animation
    beats[s](u);

    // Synchronized subtitle bar
    renderSubtitles(t);

    // Technical Blueprint HUD Bar (User's screenshot style)
    renderTechnicalHUD(t);

    return s;
  }}

  // Audio Ducking Controller
  const speechIntervals = [
    [0.10, 6.45],
    [6.60, 11.45],
    [11.70, 17.50],
    [17.75, 23.40],
    [23.65, 29.80]
  ];

  function mixAudio(sec) {{
    let speech = 0;
    for (const [start, end] of speechIntervals) {{
      const rise = clamp((sec - start + 0.12) / 0.18);
      const fall = clamp((end + 0.2 - sec) / 0.25);
      speech = Math.max(speech, Math.min(rise, fall));
    }}
    audioScore.volume = 0.75 * (1 - 0.52 * speech);
  }}

  function updateUI() {{
    const s = render(t);
    mixAudio(t);
    seekSlider.value = t;
    const secStr = String(Math.floor(t % 60)).padStart(2, '0');
    timeCurrent.textContent = `00:${{secStr}}`;
    timeTotal.textContent = `00:30`;

    scenePills.forEach((p, idx) => p.classList.toggle('active', idx === s));
  }}

  function paint(now) {{
    if (!playing) return;
    t = clamp(audioVoice.currentTime, 0, D);
    if (Math.abs(audioScore.currentTime - audioVoice.currentTime) > 0.1) {{
      audioScore.currentTime = audioVoice.currentTime;
    }}
    if (now - lastPaint >= 1000 / 60) {{
      updateUI();
      lastPaint = now;
    }}
    raf = requestAnimationFrame(paint);
  }}

  function pause() {{
    playing = false;
    audioVoice.pause();
    audioScore.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    btnPlay.textContent = '▶　播放';
    t = clamp(audioVoice.currentTime, 0, D);
    updateUI();
  }}

  async function toggle() {{
    if (starting) return;
    if (playing) {{
      pause();
      return;
    }}
    starting = true;
    try {{
      if (t >= D - 0.05) {{
        t = 0;
        audioVoice.currentTime = 0;
        audioScore.currentTime = 0;
      }}
      audioScore.currentTime = audioVoice.currentTime;
      mixAudio(t);
      await Promise.all([audioVoice.play(), audioScore.play()]);
      playing = true;
      btnPlay.textContent = '⏸　暂停';
      lastPaint = -1;
      raf = requestAnimationFrame(paint);
    }} catch (e) {{
      console.warn("Audio play error:", e);
    }} finally {{
      starting = false;
    }}
  }}

  function seek(sec) {{
    t = clamp(sec, 0, D);
    audioVoice.currentTime = audioScore.currentTime = t;
    updateUI();
  }}

  audioVoice.addEventListener('ended', () => {{
    playing = false;
    audioScore.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    t = D;
    btnPlay.textContent = '▶　重播';
    updateUI();
  }});

  btnPlay.addEventListener('click', toggle);
  seekSlider.addEventListener('input', (e) => seek(+e.target.value));

  scenePills.forEach((p) => {{
    p.addEventListener('click', () => {{
      const idx = +p.dataset.beat;
      seek(CUTS[idx] + 0.05);
      if (!playing) toggle();
    }});
  }});

  btnVoice.addEventListener('click', () => {{
    audioVoice.muted = !audioVoice.muted;
    btnVoice.textContent = audioVoice.muted ? '🎙 旁白：关' : '🎙 旁白：开';
  }});

  btnScore.addEventListener('click', () => {{
    audioScore.muted = !audioScore.muted;
    btnScore.textContent = audioScore.muted ? '♪ 配乐：关' : '♪ 配乐：开';
  }});

  btnClean.addEventListener('click', () => {{
    document.body.classList.toggle('clean');
  }});

  document.addEventListener('keydown', (e) => {{
    if (e.code === 'Space') {{
      e.preventDefault();
      toggle();
    }} else if (e.code === 'ArrowRight') {{
      seek(t + (e.shiftKey ? 5 : 1));
    }} else if (e.code === 'ArrowLeft') {{
      seek(t - (e.shiftKey ? 5 : 1));
    }} else if (e.key.toLowerCase() === 'h') {{
      document.body.classList.toggle('clean');
    }}
  }});

  // Initial draw
  updateUI();
}})();
</script>

</body>
</html>
"""

dest_project = root / "odyssey-vector-duality.html"
dest_project.write_text(html_content, encoding="utf-8")
print(f"✓ Built: {dest_project} ({len(html_content.encode()) / 1024:.1f} KB)")
