'use strict';
(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const depthCanvas = document.getElementById('depth');
  const depthFrame = window.createLight30sScene(depthCanvas).frame;

  const W = 1920, H = 1080, D = 30.0, TAU = Math.PI * 2;
  const CUTS = [0, 6.5, 11.6, 17.6, 23.6, 30.0];

  const C = {
    white: '#fbf8ee',
    gold: '#ffd15c',
    amber: '#ffd15c',
    cyan: '#e8f0fe',
    ruby: '#e24e4e',
    violet: '#fbf8ee',
    muted: '#8b9bb4',
    edge: '#1c2b3f',
    bg: '#05080f'
  };

  const MOTION = window.MotionUtil;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

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

  let t = 0, playing = false, raf = 0, lastPaint = -1, starting = false;

  // Drawing primitives
  function text(s, x, y, size, color = C.white, weight = 600, align = 'left', font = 'sans') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${weight} ${size}px ${
      font === 'mono'
        ? 'ui-monospace,SFMono-Regular,Menlo,monospace'
        : font === 'serif'
        ? 'Georgia,"Songti SC",serif'
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

  // Kinetic typography routines (PDOOM & Opus 5.5 Level)
  function kinetic(str, u, start, size, y, color = C.white, mode = 'slam', font = 'sans') {
    if (u < start) return;
    const age = u - start;
    const p = MOTION.prog(u, start, start + 0.35, MOTION.ease.outExpo);
    const settle = MOTION.springStep(age, 3.2, 0.65);

    ctx.save();
    ctx.translate(960, y);
    const scale = mode === 'slam' ? 1 + 0.18 * MOTION.pulse(u, start, 0.08) : 0.65 + 0.35 * settle;
    ctx.scale(scale, scale);
    ctx.rotate(mode === 'tilt' ? 0.06 * (1 - p) : 0);

    ctx.font = `800 ${size}px ${font === 'serif' ? '"Songti SC",Georgia,serif' : '"PingFang SC",sans-serif'}`;
    const fit = Math.min(1, 1400 / Math.max(1, ctx.measureText(str).width));
    ctx.scale(fit, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (mode === 'echo') {
      for (let i = 3; i > 0; i--) {
        ctx.globalAlpha = 0.15 * (1 - p * 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeText(str, 0, -i * size * 0.14);
      }
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = Math.min(1, 0.15 + p);
    ctx.fillStyle = color;
    ctx.fillText(str, 0, (1 - p) * 35);
    ctx.restore();
  }

  function assemble(str, u, start, size, y, color = C.white, font = 'sans') {
    ctx.font = `800 ${size}px ${font === 'serif' ? '"Songti SC",Georgia,serif' : '"PingFang SC",sans-serif'}`;
    const n = [...str];
    const width = n.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
    const fit = Math.min(1, 1380 / width);

    ctx.save();
    ctx.translate(960, y);
    ctx.scale(fit, 1);
    let x = -width / 2;
    n.forEach((ch, i) => {
      const w = ctx.measureText(ch).width;
      const p = MOTION.prog(u, start + i * 0.055, start + i * 0.055 + 0.35, MOTION.ease.outBack);
      ctx.save();
      ctx.translate(x + w / 2, (1 - p) * (i % 2 ? 80 : -80));
      ctx.rotate((1 - p) * (i % 2 ? 0.2 : -0.2));
      ctx.globalAlpha = clamp(p);
      text(ch, 0, 0, size, color, 800, 'center', font);
      ctx.restore();
      x += w;
    });
    ctx.restore();
  }

  function label(s, u) {
    text(s, 960, 240, 24, C.gold, 700, 'center', 'mono');
    line(420, 270, 1500, 270, C.edge, 2, 0.7);
  }

  function note(a, b = '') {
    text(a, 960, 800, 32, C.white, 600, 'center', 'serif');
    if (b) text(b, 960, 842, 20, C.muted, 600, 'center', 'mono');
  }

  function stamp(str, u, start, y, col = C.ruby) {
    if (u < start) return;
    const p = MOTION.prog(u, start, start + 0.26, MOTION.ease.outExpo);
    ctx.save();
    ctx.translate(960, y);
    ctx.rotate(-0.06 * (1 - p * 0.3));
    ctx.scale(1 + 0.35 * (1 - p), 1 + 0.35 * (1 - p));
    ctx.globalAlpha = p;
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.strokeRect(-220, -50, 440, 100);
    text(str, 0, 18, 56, col, 850, 'center', 'serif');
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // The 5 Animated Beats (Choreographed to 30.00 Seconds) - Refined Color Hierarchy
  // --------------------------------------------------------------------------
  function beat0(u) {
    label('ACT 01 / THE PRIMAL RAY — 公元前400年 墨子 · 公元1011年 海什木', u);
    kinetic('光行于直', u, 0.4, 150, 470, C.gold, 'slam', 'serif');
    assemble('墨子小孔暗室', u, 2.0, 76, 610, C.white);
    note('景到在午 · 有端与景长 · 窥破光线直行之秘', 'CAMERA OBSCURA & ANCIENT GEOMETRIC OPTICS');
  }

  function beat1(u) {
    label('ACT 02 / NEWTON\'S CORPUSCULAR REIGN — 1704 艾萨克·牛顿爵士', u);
    kinetic('七彩色散', u, 0.3, 140, 450, C.white, 'echo', 'serif');
    assemble('牛顿微粒说', u, 1.8, 96, 580, C.gold);
    stamp('称霸物理百载', u, 3.2, 700, C.ruby);
    note('白光乃七色微粒之集聚 · 声威赫赫统治学界整整百年', 'CORPUSCULAR EMPIRE · CENTURY OF PARTICLE SUPREMACY');
  }

  function beat2(u) {
    label('ACT 03 / WAVE REBELLION & POISSON MIRACLE — 1801 托马斯·杨 · 1818 泊松亮斑', u);
    if (u < 2.8) {
      assemble('光 ＋ 光 ＝ 黑暗', u, 0.3, 130, 470, C.white);
      note('双缝相消干涉 · 唯有波动方能解释', 'DOUBLE SLIT DESTRUCTIVE INTERFERENCE');
    } else {
      kinetic('泊松亮斑', u, 2.8, 150, 470, C.gold, 'slam', 'serif');
      stamp('科学绝地反转', u, 3.8, 620, C.ruby);
      note('阴影正央赫然绽放奇迹光芒 · 微粒神话彻底坍塌', 'THE POISSON DISK MIRACLE · WAVE THEORY TRIUMPH');
    }
  }

  function beat3(u) {
    label('ACT 04 / ELECTROMAGNETIC SYMPHONY & LIGHT QUANTA — 1865 麦克斯韦 · 1905 爱因斯坦', u);
    if (u < 2.9) {
      kinetic('光即电磁波', u, 0.2, 135, 460, C.gold, 'echo');
      note('电激磁 · 磁生电 · 每秒三十万公里交响奔涌', 'MAXWELL EQUATIONS · c = 1 / √(μ₀ε₀) = 299,792,458 m/s');
    } else {
      assemble('光量子重生', u, 2.9, 140, 460, C.white);
      stamp('爱因斯坦光电效应', u, 3.9, 620, C.ruby);
      note('红光十年打不出电子 · 弱紫光瞬间激发电弧！', 'PHOTOELECTRIC REVOLUTION · DISCRETE ENERGY PACKETS (hν)');
    }
  }

  function beat4(u) {
    if (u < 2.5) {
      assemble('非水波 · 亦非弹珠', u, 0.2, 120, 450, C.white, 'serif');
      note('单光子穿行自己与自己干涉 · 观测坍缩为粒子', 'WAVE-PARTICLE DUALITY & PROBABILITY CLOUD');
    } else {
      kinetic('光的历程', u, 2.5, 170, 450, C.gold, 'slam', 'serif');
      text('THE ODYSSEY OF LIGHT', 960, 560, 36, C.gold, 700, 'center', 'mono');
      line(480, 605, 1440, 605, C.gold, 2);
      text('它非寻常水波，亦非世间弹珠——它是光，造化最深的量子交响！', 960, 665, 34, C.white, 700, 'center', 'serif');
      stamp('造化觉醒', u, 3.8, 770, C.ruby);
    }
  }

  const beats = [beat0, beat1, beat2, beat3, beat4];

  function stage(sec) {
    let i = 0;
    while (i < 4 && sec >= CUTS[i + 1]) i++;
    return i;
  }

  // Optics HUD Overlay
  function optics(s, u) {
    const reveal = MOTION.prog(u, 0.1, 0.8, MOTION.ease.outExpo);
    ctx.save();
    ctx.translate(960, 540);
    ctx.rotate(s === 2 ? u * 0.25 : s === 3 ? -u * 0.2 : 0);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.35;

    for (let i = 0; i < 4; i++) {
      const angle = (i * TAU) / 4;
      const r = 360 + 20 * Math.sin(u * 1.5);
      ctx.beginPath();
      ctx.arc(0, 0, r, angle, angle + 0.35 * reveal);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.22;
    ctx.setLineDash([4, 18]);
    ctx.beginPath();
    ctx.arc(0, 0, 400, 0, TAU * reveal);
    ctx.stroke();
    ctx.restore();

    // Subtle Iris cut transition
    if (u < 0.25) {
      const p = MOTION.prog(u, 0, 0.25, MOTION.ease.outExpo);
      const cover = (1 - p) * 540;
      ctx.fillStyle = '#05080f';
      ctx.fillRect(0, 0, W, cover);
      ctx.fillRect(0, H - cover, W, cover);
    }
  }

  // Synchronized Subtitles System
  const SUBTITLES = [
    { start: 0.10, end: 6.45, text: "混沌初开。两千年前，先贤借一孔暗室，始窥光行之直。" },
    { start: 6.60, end: 11.45, text: "牛顿剖分七彩，断言光是微粒，称霸物理百载！" },
    { start: 11.70, end: 17.50, text: "双缝干涉，光加光竟得黑暗；泊松亮斑，阴影中奇迹绽放！" },
    { start: 17.75, end: 23.40, text: "麦克斯韦奏响电磁交响，爱因斯坦唤醒光量子——微粒重生！" },
    { start: 23.65, end: 29.80, text: "它非凡俗水波，亦非世间弹珠——它是光，造化至深的量子交响！" }
  ];

  function renderSubtitles(t) {
    const sub = SUBTITLES.find(s => t >= s.start - 0.15 && t <= s.end + 0.35);
    if (!sub) return;

    const fadeIn = clamp((t - (sub.start - 0.15)) / 0.28, 0, 1);
    const fadeOut = clamp(((sub.end + 0.35) - t) / 0.32, 0, 1);
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const fontSize = 36;
    ctx.font = `600 ${fontSize}px "Songti SC", "PingFang SC", "Noto Serif CJK SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(sub.text).width;
    const boxW = Math.max(380, textWidth + 60);
    const boxH = fontSize + 28;
    const boxX = 960 - boxW / 2;
    const boxY = 940 - boxH / 2;

    // Dark sleek capsule pill background with subtle golden edge
    ctx.fillStyle = 'rgba(5, 8, 15, 0.92)';
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
    ctx.fillText(sub.text, 960, 940);

    ctx.restore();
  }

  // Main Render Frame
  function render(sec) {
    t = clamp(sec, 0, D);
    const s = stage(t);
    const u = t - CUTS[s];

    depthFrame(t);
    ctx.clearRect(0, 0, W, H);

    // Subtle background vignette for typography readability
    const shade = ctx.createRadialGradient(960, 540, 200, 960, 540, 900);
    shade.addColorStop(0, 'rgba(5,8,15,0.4)');
    shade.addColorStop(1, 'rgba(5,8,15,0.75)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);

    // Render current beat typography
    beats[s](u);
    optics(s, u);

    // Render synchronized subtitles
    renderSubtitles(t);

    // Progress bar inside HUD (bottom)
    line(380, 1020, 1540, 1020, C.edge, 3, 0.8);
    line(380, 1020, 380 + 1160 * (t / D), 1020, C.gold, 4);

    return s;
  }

  // Audio Ducking Controller
  const speechIntervals = [
    [0.10, 6.45],
    [6.60, 11.45],
    [11.70, 17.50],
    [17.75, 23.40],
    [23.65, 29.80]
  ];

  function mixAudio(sec) {
    let speech = 0;
    for (const [start, end] of speechIntervals) {
      const rise = clamp((sec - start + 0.12) / 0.18);
      const fall = clamp((end + 0.2 - sec) / 0.25);
      speech = Math.max(speech, Math.min(rise, fall));
    }
    // Duck score volume by 52% when voiceover speaks
    audioScore.volume = 0.75 * (1 - 0.52 * speech);
  }

  function updateUI() {
    const s = render(t);
    mixAudio(t);
    seekSlider.value = t;
    const secStr = String(Math.floor(t % 60)).padStart(2, '0');
    timeCurrent.textContent = `00:${secStr}`;
    timeTotal.textContent = `00:30`;

    scenePills.forEach((p, idx) => p.classList.toggle('active', idx === s));
  }

  function paint(now) {
    if (!playing) return;
    t = clamp(audioVoice.currentTime, 0, D);
    if (Math.abs(audioScore.currentTime - audioVoice.currentTime) > 0.1) {
      audioScore.currentTime = audioVoice.currentTime;
    }
    if (now - lastPaint >= 1000 / 60) {
      updateUI();
      lastPaint = now;
    }
    raf = requestAnimationFrame(paint);
  }

  function pause() {
    playing = false;
    audioVoice.pause();
    audioScore.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    btnPlay.textContent = '▶　播放';
    t = clamp(audioVoice.currentTime, 0, D);
    updateUI();
  }

  async function toggle() {
    if (starting) return;
    if (playing) {
      pause();
      return;
    }
    starting = true;
    try {
      if (t >= D - 0.05) {
        t = 0;
        audioVoice.currentTime = 0;
        audioScore.currentTime = 0;
      }
      audioScore.currentTime = audioVoice.currentTime;
      mixAudio(t);
      await Promise.all([audioVoice.play(), audioScore.play()]);
      playing = true;
      btnPlay.textContent = '⏸　暂停';
      lastPaint = -1;
      raf = requestAnimationFrame(paint);
    } catch (e) {
      console.warn("Audio play error:", e);
    } finally {
      starting = false;
    }
  }

  function seek(sec) {
    t = clamp(sec, 0, D);
    audioVoice.currentTime = audioScore.currentTime = t;
    updateUI();
  }

  audioVoice.addEventListener('ended', () => {
    playing = false;
    audioScore.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    t = D;
    btnPlay.textContent = '▶　重播';
    updateUI();
  });

  btnPlay.addEventListener('click', toggle);
  seekSlider.addEventListener('input', (e) => seek(+e.target.value));

  scenePills.forEach((p) => {
    p.addEventListener('click', () => {
      const idx = +p.dataset.beat;
      seek(CUTS[idx] + 0.05);
      if (!playing) toggle();
    });
  });

  btnVoice.addEventListener('click', () => {
    audioVoice.muted = !audioVoice.muted;
    btnVoice.textContent = audioVoice.muted ? '🎙 旁白：关' : '🎙 旁白：开';
  });

  btnScore.addEventListener('click', () => {
    audioScore.muted = !audioScore.muted;
    btnScore.textContent = audioScore.muted ? '♪ 配乐：关' : '♪ 配乐：开';
  });

  document.getElementById('btn-clean').addEventListener('click', () => {
    document.body.classList.toggle('clean');
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seek(t + 1.0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seek(t - 1.0);
    } else if (e.key === ']') {
      seek(CUTS[Math.min(4, stage(t) + 1)]);
    } else if (e.key === '[') {
      seek(CUTS[Math.max(0, stage(t) - 1)]);
    } else if (e.key.toLowerCase() === 'h') {
      document.body.classList.toggle('clean');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) pause();
  });

  updateUI();
})();
