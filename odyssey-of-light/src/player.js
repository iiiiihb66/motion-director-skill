/**
 * Odyssey of Light - 2D Cartoon Educational Overlay & Interactive Film Controller
 */
(function () {
  'use strict';

  // Elements
  const canvas3D = document.getElementById('webgl-canvas');
  const canvasHUD = document.getElementById('hud-canvas');
  const ctx = canvasHUD.getContext('2d');

  // Audio elements
  const audioVoice = document.getElementById('audio-voice');
  const audioBGM = document.getElementById('audio-bgm');

  // UI Elements
  const btnPlay = document.getElementById('btn-play');
  const seekSlider = document.getElementById('seek-slider');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const chapterTitle = document.getElementById('chapter-title');
  const subtitleZh = document.getElementById('subtitle-zh');
  const subtitleEn = document.getElementById('subtitle-en');
  const chapterList = document.querySelectorAll('.chapter-pill');
  const btnMuteBgm = document.getElementById('btn-mute-bgm');
  const btnMuteVoice = document.getElementById('btn-mute-voice');
  const btnInteract = document.getElementById('btn-interact');

  // State
  let engine = null;
  let isPlaying = false;
  let currentTime = 0;
  let totalDuration = 555.94;
  let currentActIdx = 0;
  let isInteractiveMode = false;

  // Screenplay & Timing Data (loaded from acts_timing.json)
  const ACTS = [
    {
      id: "act0_prologue",
      title: "序幕 · 暗室与烛光",
      subtitle: "Prologue: The Ancient Light & Pinhole",
      start: 0.0,
      end: 78.528,
      duration: 78.528,
      quote: "墨子《墨经》：景到在午，有端与景长。两千年前先贤借一孔暗室，始窥光行之直。",
      formula: "Camera Obscura (公元前400年 - 公元1000年海什木)",
      file: "audio/act0_prologue.mp3"
    },
    {
      id: "act1_newton",
      title: "第一幕 · 巨人的独断：三棱镜与微粒说",
      subtitle: "Act I: Newton's Particles & The Hundred-Year Reign",
      start: 78.528,
      end: 159.504,
      duration: 80.976,
      quote: "牛顿断言：光乃千万微小疾驰之弹丸。微粒之说遂成圣训，独步学界达百载之久。",
      formula: "Corpuscular Theory (1704) vs. Huygens Wavelets (1690)",
      file: "audio/act1_newton.mp3"
    },
    {
      id: "act2_young_poisson",
      title: "第二幕 · 惊世涟漪：托马斯·杨与泊松亮斑",
      subtitle: "Act II: Young's Slits & The Poisson Miracle",
      start: 159.504,
      end: 242.52,
      duration: 83.016,
      quote: "光与光相融，竟然生出黑暗！阴影正央赫然绽放一枚光核——泊松亮斑终结微粒神话。",
      formula: "Young's Interference (1801) & Poisson's Spot (1818) · I ∝ cos²(πd·sinθ / λ)",
      file: "audio/act2_young_poisson.mp3"
    },
    {
      id: "act3_maxwell",
      title: "第三幕 · 电磁冠冕：麦克斯韦的光之交响",
      subtitle: "Act III: Maxwell's Electromagnetic Crown",
      start: 242.52,
      end: 323.808,
      duration: 81.288,
      quote: "电激磁，磁生电，在虚空中交叠奔涌。光，正是一曲浩瀚的电磁交响！",
      formula: "Maxwell Equations (1865) · c = 1 / √(μ₀ε₀) = 299,792,458 m/s",
      file: "audio/act3_maxwell.mp3"
    },
    {
      id: "act4_photoelectric",
      title: "第四幕 · 晴空骤雷：光电效应与光量子",
      subtitle: "Act IV: The Photoelectric Tempest & Quanta",
      start: 323.808,
      end: 396.384,
      duration: 72.576,
      quote: "烈日之红光激不出一枚电子，冷冽之紫光瞬间击落电子！爱因斯坦光量子浴火重生。",
      formula: "Photoelectric Effect (1905) · E = hν = W₀ + Eₖ",
      file: "audio/act4_photoelectric.mp3"
    },
    {
      id: "act5_duality",
      title: "第五幕 · 乾坤莫辨：波粒二象性与量子深渊",
      subtitle: "Act V: The Quantum Duality & Ghostly Interference",
      start: 396.384,
      end: 478.752,
      duration: 82.368,
      quote: "光子单个穿行留下确凿的点，千百光子落毕却成干涉条纹！难道光子在与自己干涉？",
      formula: "De Broglie Matter Waves (1924) · λ = h / p · |ψ(x)|² 概率坍缩",
      file: "audio/act5_duality.mp3"
    },
    {
      id: "act6_epilogue",
      title: "终曲 · 两者皆非，两者皆是",
      subtitle: "Epilogue: Neither and Both — The Light of Reason",
      start: 478.752,
      end: 555.936,
      duration: 77.184,
      quote: "光，既非世俗水池之波澜，亦非人间粗粝之飞弹。以理性之幽光，照亮无垠的真理长夜。",
      formula: "Quantum Electrodynamics (QED) · Wave-Particle Duality Unification",
      file: "audio/act6_epilogue.mp3"
    }
  ];

  // Initialize 3D Engine
  function initEngine() {
    if (window.LightOdysseyEngine) {
      engine = new window.LightOdysseyEngine(canvas3D);
    } else {
      console.error("LightOdysseyEngine not loaded yet.");
    }
  }

  // Format time mm:ss
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Find Act index by global time
  function getActIndex(time) {
    for (let i = 0; i < ACTS.length; i++) {
      if (time >= ACTS[i].start && time <= ACTS[i].end) {
        return i;
      }
    }
    return ACTS.length - 1;
  }

  // HUD Drawing (Vintage Educational Blueprint & Cartoon Optics)
  function renderHUD(actIdx, tInAct, globalT) {
    const w = canvasHUD.width;
    const h = canvasHUD.height;
    ctx.clearRect(0, 0, w, h);

    const act = ACTS[actIdx];

    // 1. Vintage Frame Brackets (Chalk / Blueprint Gold)
    ctx.strokeStyle = 'rgba(255, 209, 92, 0.4)';
    ctx.lineWidth = 1.5;
    const pad = 24;
    // Corners
    ctx.beginPath();
    // Top-left
    ctx.moveTo(pad, pad + 30); ctx.lineTo(pad, pad); ctx.lineTo(pad + 30, pad);
    // Top-right
    ctx.moveTo(w - pad - 30, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + 30);
    // Bottom-left
    ctx.moveTo(pad, h - pad - 30); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + 30, h - pad);
    // Bottom-right
    ctx.moveTo(w - pad - 30, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - 30);
    ctx.stroke();

    // 2. Compass Dial & Grid Marks
    ctx.fillStyle = 'rgba(255, 209, 92, 0.2)';
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.fillText(`OPTICAL ODYSSEY · ACT 0${actIdx} / 06 · TIME ${formatTime(globalT)}`, pad + 40, pad + 20);
    ctx.textAlign = 'right';
    ctx.fillText(`60 FPS · 3.8 FLASH SCHOLARLY TTS · REPUBLICAN ERA VOICE`, w - pad - 40, pad + 20);
    ctx.textAlign = 'left';

    // 3. Act-specific Educational Diagrams and Annotations
    drawActAnnotations(actIdx, tInAct, globalT, w, h);

    // 4. Central Calligraphic Seal / Badge in corner
    ctx.save();
    ctx.translate(w - 120, h - 90);
    ctx.strokeStyle = 'rgba(255, 61, 85, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-40, -18, 80, 36);
    ctx.font = '600 13px "PingFang SC", serif';
    ctx.fillStyle = 'rgba(255, 61, 85, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const seals = ['格致初照', '牛顿微粒', '泊松亮斑', '电磁交响', '光电量子', '互补坍缩', '造化真如'];
    ctx.fillText(seals[actIdx], 0, 0);
    ctx.restore();
  }

  function drawActAnnotations(actIdx, t, gt, w, h) {
    ctx.save();

    // Act 0: Pinhole Ray Diagram
    if (actIdx === 0) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【小孔成像：景到于午，直而不回】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('墨子《墨经》公元前400年 · 伊本·海什木《光学之书》公元1011年', 60, 115);
      
      // Educational Diagram Box
      drawBox(w - 320, 80, 260, 110, '物距与像距倒立几何', [
        '1. 光线沿极小直线行进',
        '2. 上方光线穿孔直抵下方',
        '3. 下方光线穿孔直抵上方',
        '结论：投影倒立，证实光的直线传播'
      ]);
    }

    // Act 1: Newton's Prism
    if (actIdx === 1) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【巨人的独断：三棱镜色散与微粒说】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('艾萨克·牛顿爵士《光学》(1704) · 柯西折射率公式 n(λ) = A + B/λ²', 60, 115);

      drawBox(w - 320, 80, 260, 120, '牛顿微粒说 vs 惠更斯波动说', [
        '牛顿观点：白光乃七色微粒之混合',
        '折射机理：不同质量微粒受引力偏折',
        '惠更斯异议：两束光交叉何以不散？',
        '历史结果：牛顿声威压倒一切，垄断百年'
      ]);
    }

    // Act 2: Young's Slits & Poisson's Spot
    if (actIdx === 2) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【托马斯·杨双缝干涉 ＆ 泊松亮斑奇迹】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('光＋光＝黑暗 · 菲涅耳衍射积分 (1818)', 60, 115);

      drawBox(w - 320, 80, 260, 125, '科学史上最震撼的反转', [
        '托马斯·杨(1801)：相长干涉与相消干涉',
        '泊松(1818)：圆盘阴影中心必有亮斑(归谬)',
        '阿拉果实验：阴影正中心赫然绽放红光！',
        '裁决：微粒说惨败，波动说君临天下'
      ]);
    }

    // Act 3: Maxwell's Equations
    if (actIdx === 3) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【麦克斯韦电磁大统一定律：光即是电磁波】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('麦克斯韦方程组 (1865) · 赫兹证实电磁波 (1887)', 60, 115);

      drawBox(w - 320, 80, 260, 120, '电磁波正交对称性', [
        '电生磁：∇×E = -∂B/∂t (法拉第)',
        '磁生电：∇×B = μ₀ε₀ ∂E/∂t (麦克斯韦)',
        '波速算定：c = 1/√(μ₀ε₀) ≈ 3×10⁸ m/s',
        '19世纪末结论：物理学大厦已经落成'
      ]);
    }

    // Act 4: Photoelectric Effect
    if (actIdx === 4) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【两朵乌云的暴雷：光电效应之谜】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('普朗克能量子 E=hν (1900) · 爱因斯坦光量子说 (1905)', 60, 115);

      drawBox(w - 320, 80, 260, 120, '波动理论的彻底破产', [
        '经典困境：强红光十年照不出电子',
        '量子破局：微弱紫光瞬间激出光电子',
        '核心机制：单个光子能量 hν 克服逸出功',
        '结论：光并非连续溪流，乃离散能量子'
      ]);
    }

    // Act 5: Quantum Double Slit
    if (actIdx === 5) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【单光子双缝实验：量子几率波与坍缩】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('德布罗意物质波 λ=h/p (1924) · 玻尔互补原理 (1927)', 60, 115);

      drawBox(w - 320, 80, 260, 120, '单光子与自身的干涉', [
        '单个发射：屏幕每次只落一个确定点',
        '成千上万：落点几率密度累积成干涉条纹',
        '深邃之谜：光子究竟穿过了哪道缝？',
        '哥本哈根诠释：未观测为波，观测坍缩为粒'
      ]);
    }

    // Act 6: Epilogue
    if (actIdx === 6) {
      ctx.fillStyle = 'rgba(244, 238, 219, 0.85)';
      ctx.font = '500 16px "PingFang SC", serif';
      ctx.fillText('【终曲：两者皆非，两者皆是】', 60, 90);
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
      ctx.fillText('波粒二象性 · 量子电动力学 (QED) · 理性觉醒之路', 60, 115);

      drawBox(w - 320, 80, 260, 120, '三百年格致追问之归宿', [
        '光非宏观水波，亦非世俗弹珠',
        '传播表现为几率波，吸收表现为光子',
        '宇宙之浩瀚，非迎合人类狭隘经验而生',
        '以理性之幽光，照彻无垠之真理长夜'
      ]);
    }

    ctx.restore();
  }

  function drawBox(x, y, w, h, title, items) {
    ctx.fillStyle = 'rgba(7, 12, 20, 0.85)';
    ctx.strokeStyle = 'rgba(255, 209, 92, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'rgba(255, 209, 92, 0.95)';
    ctx.font = '600 12px "PingFang SC", sans-serif';
    ctx.fillText(`◆ ${title}`, x + 12, y + 20);

    ctx.fillStyle = 'rgba(244, 238, 219, 0.75)';
    ctx.font = '11px "PingFang SC", sans-serif';
    items.forEach((item, idx) => {
      ctx.fillText(item, x + 12, y + 42 + idx * 18);
    });
  }

  // Audio Playback & Sync
  function syncAudio(time) {
    currentTime = Math.max(0, Math.min(totalDuration, time));
    const actIdx = getActIndex(currentTime);
    const act = ACTS[actIdx];

    // Update UI labels
    chapterTitle.textContent = `${act.title} · ${act.subtitle}`;
    subtitleZh.textContent = act.quote;
    subtitleEn.textContent = act.formula;

    chapterList.forEach((btn, i) => {
      btn.classList.toggle('active', i === actIdx);
    });

    seekSlider.value = currentTime;
    timeCurrent.textContent = formatTime(currentTime);
    timeTotal.textContent = formatTime(totalDuration);

    // Audio sync
    if (Math.abs(audioVoice.currentTime - currentTime) > 0.5) {
      audioVoice.currentTime = currentTime;
    }

    // Audio Ducking (reduce BGM when voice is active)
    if (isPlaying && !audioVoice.paused) {
      audioBGM.volume = 0.28; // dip background
    } else {
      audioBGM.volume = 0.55;
    }
  }

  function play() {
    isPlaying = true;
    btnPlay.textContent = '⏸　暂停';
    audioVoice.play().catch(e => console.warn("Voice play blocked:", e));
    audioBGM.play().catch(e => console.warn("BGM play blocked:", e));
  }

  function pause() {
    isPlaying = false;
    btnPlay.textContent = '▶　播放';
    audioVoice.pause();
    audioBGM.pause();
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function seek(time) {
    currentTime = time;
    audioVoice.currentTime = time;
    syncAudio(time);
  }

  // Animation Frame Loop
  function tick(timestamp) {
    const globalT = audioVoice.currentTime || currentTime;
    const actIdx = getActIndex(globalT);
    const act = ACTS[actIdx];
    const timeInAct = globalT - act.start;

    if (isPlaying) {
      currentTime = globalT;
      syncAudio(currentTime);
    }

    // Render 3D Engine
    if (engine) {
      engine.update(actIdx, timeInAct, globalT);
    }

    // Render 2D Cartoon HUD
    renderHUD(actIdx, timeInAct, globalT);

    requestAnimationFrame(tick);
  }

  // Event Listeners
  btnPlay.addEventListener('click', togglePlay);

  seekSlider.addEventListener('input', (e) => {
    seek(parseFloat(e.target.value));
  });

  chapterList.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.act, 10);
      seek(ACTS[idx].start + 0.1);
      if (!isPlaying) play();
    });
  });

  btnMuteBgm.addEventListener('click', () => {
    audioBGM.muted = !audioBGM.muted;
    btnMuteBgm.textContent = audioBGM.muted ? '♪ 配乐：关' : '♪ 配乐：开';
  });

  btnMuteVoice.addEventListener('click', () => {
    audioVoice.muted = !audioVoice.muted;
    btnMuteVoice.textContent = audioVoice.muted ? '🎙 旁白：关' : '🎙 旁白：开';
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seek(currentTime + 5.0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seek(currentTime - 5.0);
    } else if (e.key === ']') {
      const nextIdx = Math.min(ACTS.length - 1, currentActIdx + 1);
      seek(ACTS[nextIdx].start + 0.1);
    } else if (e.key === '[') {
      const prevIdx = Math.max(0, currentActIdx - 1);
      seek(ACTS[prevIdx].start + 0.1);
    }
  });

  // Init sequence
  initEngine();
  syncAudio(0);
  requestAnimationFrame(tick);
})();
