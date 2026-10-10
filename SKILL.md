---
name: motion-director
description: 代码驱动的动态视觉与网页视频/宣传片生成引擎（基于 Three.js + WebGL + Canvas2D）。将任何创意主题（科技、金融、学术、艺术、产品发布、科幻等）转化为高质感单文件 HTML 互动视频或 60FPS 实时音画同步视听大片。完全不需要逐帧离线截图压制，纯原生 HTML/JS 运行。
---

# Motion Director Skill（代码动效与 HTML 宣传片导演）

本 Skill 沉淀自前沿代码生成音乐视频神作（参考 `mexicat/pdoom-video` 架构与 Opus 5.5 / Gemini 4 方法论），致力于通过编写**确定性的数学函数、Three.js 3D 场景与 WebGL 着色器**，将任何创意主题直接转化为**可在浏览器中 60 FPS 流畅运行、可交互拖拽进度、具备顶级电影级质感的单文件 HTML 动态宣传片**。

> **核心宗旨**：彻底摒弃耗时费卡、动辄卡死系统的“离线逐帧截图 + ffmpeg 压制”黑盒流程，以**纯原生 HTML / WebGL / Canvas2D** 交付极致的实时代码艺术。

---

## 🎯 一、 顶级代码动效的五大设计哲学 (The Core Tenets)

### 1. 确定性纯时间函数架构：$F = f(t)$
- **严禁使用** `Math.random()`、`Date.now()`、`performance.now()` 等有状态/非确定性调用。
- 随机效果必须使用带种子的伪随机函数（`hash12`, `mulberry32`, `snoise`），输入参数为时间 $t$ 或帧索引。
- **效果**：无论进度条如何随意拖拽、逐帧步进（`,` / `.`），画面的每个像素与几何状态百分之百确定、严密可复现。

### 2. 瑞士网格排印学：文字即画面骨骼 (Typography as Geometry)
- **拒绝“居中大字 + 淡入淡出”的 PPT 劣质感**，文字必须是构图的几何主体：
  - **动态字宽字重拉伸**：在重音或长音处，文字发生物理拉伸（Width 62% $\to$ 125%，Weight 300 $\to$ 900）；
  - **微排印字偶修正 (Micro-Kerning)**：使用 `opentype.js` 或精密字宽测量，标点（’ “ ” —）符合最高规格出版物标准；
  - **拆字重组与撞击汇聚**：文字以错相轨迹（Offset Kinematics）飞入、盖印戳（Rubber Stamp）、或随引线字符烧灼显影。

### 3. 算法即材质：GLSL 程序化质感 (Procedural Shaders)
- 抛弃粗糙的低质贴图，使用数学实时计算微观质感：
  - **自适应铜版雕版排线 (`hatch` / `engrave`)**：利用屏幕导数 `fwidth`，随光影明暗自适应改变排线密度与宽度；
  - **数学解析曲面 (Raymarched SDF)**：用平滑极小值（`smin`）与连续噪声生成等高线地形与有机形态；
  - **发丝级线条批处理 (LineBatch)**：即使细于 0.7px 也不走样闪烁，自动转为亚像素透明度淡化。

### 4. 电影级光学后处理 (Linear HDR Filmic Pipeline)
- 在线性浮点纹理（Linear HDR）中合成，高光经过软指数肩部曲线（Tone Shoulder）优雅压缩；
- 配合**高斯绽光金字塔 (Bloom Pyramid)**、**胶片暗房微红光晕 (Halation)**、**边缘定焦色散 (Chromatic Aberration)** 与 **双尺度胶片颗粒 (Dual-scale Film Grain)**，消除数码生硬感，赋予实体纸本与胶片厚重感。

### 5. 神经元级强卡点律动 (Neuro-synchronous Editing)
- 拒绝匀速漂移屏保动画，使用高张力曲线（`outExpo`, `inOutCubic`, 弹簧过冲）；
- **镜头大切分（Cut）必在小节强拍（Downbeat）**；
- **视觉冲击（Hit / Flash / Shake）必在底鼓（Kick）与军鼓（Snare）**；
- 动效执行错相运动链：预备 $\to$ 主体冲击 $\to$ 冲击波 $\to$ 装饰回稳。

---

## 🚫 Not-Slop 品味禁忌清单（红线原则）

* ✖ **禁止廉价赛博朋克紫青霓虹（Neon Soup）**。
* ✖ **禁止漂浮的屏保式匀速移动**。
* ✖ **禁止无联系的发光大脑、数字雨或通用粒子群**。
* ✖ **禁止把文字当成单纯的居中字幕贴在画面下方**。

---

## 🛠️ 二、 单文件纯 HTML 独立播放器架构规范

无论面向何种主题，最终生成的单文件 HTML 均需遵循标准 **双层画布 + 交互控制器** 结构：

```text
┌─────────────────────────────────────────────────────────────┐
│                      HTML 宿主容器                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  Reel 视口 (支持 16:9 桌面宽屏 或 9:16 社媒竖屏切换)    │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ #depth 底层画布: Three.js WebGL 3D / GLSL 着色器  │  │ │
│ │  ├───────────────────────────────────────────────────┤  │ │
│ │  │ #screen 顶层画布: Canvas2D 高精排印、线框与 HUD   │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  交互控制面板 (Controls Aside):                          │ │
│ │  - 播放/暂停按键 (Space 快捷键)                         │ │
│ │  - 毫秒级时间轴滑块 (Seekbar: 0.00s ~ 34.00s)           │ │
│ │  - 分镜快速跳转按钮 ([data-jump] 镜头 1~7)              │ │
│ │  - 音量控制与侧链闪避开关联动                           │ │
│ │  - 快捷键提示: Space 播放 | ←/→ 跳步 | [] 换镜 | H 隐UI │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 三、 任意新主题的 5 步极速创制法

当你需要针对一个**全新主题**（如：脑机接口、量子计算、超跑工程、黑暗金融、生命科学等）创建作品时，按照以下 5 个步骤执行：

### Step 1. 确立主题概念与调色板 (Theme & Palette)
定义 1 个主背景色（通常为极深墨色）、1 个纸张文字色（骨白或纯白）、1~2 个专属强调色。
- **示例（量子计算）**：深海黑 `#050811` + 骨白 `#EBF2FA` + 跃迁蓝 `#00D2FF` + 纠缠紫 `#9D4EDD`
- **示例（瑞士工业）**：工业灰黑 `#0F1115` + 纯白 `#FFFFFF` + 警戒红 `#FF2A00` + 标线黄 `#FFCC00`

### Step 2. 划分 5~7 幕镜头大纲 (Acts / Cuts)
设定总时长（典型为 15 秒短视频 或 30~34 秒完整版），并划分切点时间数组 `CUTS = [0, 4.0, 8.5, 13.0, 18.5, 24.0, 30.0]`。为每一幕设计一个核心**“视觉乐器”**：
- Act 1：**起笔/建档**（网格标尺、坐标原点、微观引线被点燃）
- Act 2：**解析展开**（3D 拓扑地形、剖面切片、数据流涌现）
- Act 3：**冲突对撞**（双轨轨迹交织、矢量箭头冲击、极端数值飙升）
- Act 4：**微观重构**（符号网格、高密度排印压缩、特征解构）
- Act 5：**高潮爆发**（巨型文字冲击、全屏冲击波、多重残影）
- Act 6：**收束归档**（印章敲落、红框锁定、核心定格、平滑循环）

### Step 3. 准备音频与时间码 (Audio & Rhythm)
- 方案 A（全内嵌）：将音频转为 Base64 字符串嵌入 `<audio id="soundtrack">`；
- 方案 B（Web Audio 程序化声效）：使用 Web Audio 振荡器生成 120 BPM 极简底鼓、贝斯滤波与故障白噪声打击点；
- 建立文字时间窗数组 `voiceWindows = [[start, end], ...]`，驱动声画同步。

### Step 4. 编写确定性渲染函数 `render(sec)`
实现纯数学驱动管线：
```javascript
function render(sec) {
  const t = clamp(sec, 0, D);
  const s = stage(t);       // 计算当前处于哪个镜头
  const u = t - CUTS[s];    // 当前镜头的局部时间 (0 ~ cut_duration)

  // 1. 驱动底层 3D / GLSL
  depthFrame(t, s, u);

  // 2. 清空顶层 2D 画布
  ctx.clearRect(0, 0, W, H);

  // 3. 运行当前镜头的 2D 排印与几何动效
  shots[s](u);

  // 4. 叠加全局辅助构图（刻度标尺、HUD、时间码）
  drawHUD(t);
}
```

### Step 5. 组装为单个 `.html` 并验证
直接输出为独立的 `.html` 文件，确保双击即可在任何现代浏览器中秒级打开，全特性 60FPS 运行。

---

## 💻 四、 核心动效数学与排印函数库 (The Essential Toolkit)

在单文件脚本中，直接内嵌以下高能运动学与排印辅助函数：

```javascript
// === 1. 运动学缓动与弹簧 ===
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = {
  outExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
};
const prog = (x, a, b, fn = ease.outExpo) => fn(clamp((x - a) / (b - a)));
const springStep = (age, freq = 3.5, decay = 0.6) => 1 - Math.exp(-age * freq) * Math.cos(age * freq * Math.PI);
const pulse = (t, hit, dur = 0.1) => Math.max(0, 1 - Math.abs(t - hit) / dur);

// === 2. 动效排印与图形组件 ===
// 单字错相汇聚
function assembleText(ctx, str, u, start, size, y, color = '#FFFFFF', fitWidth = 740) {
  ctx.font = `750 ${size}px "PingFang SC", sans-serif`;
  const chars = [...str];
  const totalW = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const fit = Math.min(1, fitWidth / Math.max(1, totalW));
  ctx.save();
  ctx.translate(540, y);
  ctx.scale(fit, 1);
  let curX = -totalW / 2;
  chars.forEach((ch, i) => {
    const cw = ctx.measureText(ch).width;
    const p = prog(u, start + i * 0.08, start + i * 0.08 + 0.45, ease.outBack);
    ctx.save();
    ctx.translate(curX + cw / 2, (1 - p) * (i % 2 ? 90 : -90));
    ctx.rotate((1 - p) * (i % 2 ? 0.25 : -0.25));
    ctx.globalAlpha = clamp(p);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    curX += cw;
  });
  ctx.restore();
}

// 冲击砸字 (Kinetic Slam)
function kineticSlam(ctx, str, u, start, size, y, color = '#FFFFFF', mode = 'slam') {
  if (u < start) return;
  const p = prog(u, start, start + 0.35, ease.outExpo);
  const scale = mode === 'slam' ? 1 + 0.18 * pulse(u, start, 0.08) : 0.6 + 0.4 * p;
  ctx.save();
  ctx.translate(540, y);
  ctx.scale(scale, scale);
  ctx.font = `800 ${size}px "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.globalAlpha = p;
  ctx.fillText(str, 0, (1 - p) * 35);
  ctx.restore();
}

// 印章砸盖 (Rubber Stamp)
function stampBox(ctx, str, u, start, y, color = '#FF4D12') {
  if (u < start) return;
  const p = prog(u, start, start + 0.28, ease.outExpo);
  ctx.save();
  ctx.translate(540, y);
  ctx.rotate(-0.08 * (1 - p * 0.2));
  ctx.scale(1 + 0.3 * (1 - p), 1 + 0.3 * (1 - p));
  ctx.globalAlpha = p;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeRect(-220, -65, 440, 130);
  ctx.fillStyle = color;
  ctx.font = `800 72px "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, 0, 0);
  ctx.restore();
}
```

---

## 🤖 五、 Gemini 4 专属神级生成指令 (Gemini 4 Prompt Template)

当需要命令 Gemini 4 根据特定主题创建完整的 HTML 动态宣传片时，使用如下标准指令格式：

```markdown
请以最高水准的动态设计视觉导演（Motion Director）角色，为主题【在此输入你的主题，如：未来深空引力波观测台】创作一段 30 秒的纯代码驱动动态视觉宣传片，直接输出为可直接离线双击打开的单文件 HTML。

核心设计与技术规范：
1. 视觉语言：采用冷峻精密的瑞士工程制图与学术图版风格，底色墨黑 #06080C，文字骨白 #F4F2EB，核心高亮为【输入你的专属色，如：引力金 #FFB703】。严禁紫青霓虹与劣质浮夸特效。
2. 架构模式：采用单文件双层画布（底层 Three.js / WebGL 3D 深度，顶层 Canvas2D 毫秒级微排印），包含完整的交互播放控制器（Play/Pause、时码滑块、分镜跳转、快捷键）。
3. 纯确定性：全局使用 render(t) 确定性数学函数，运动采用 outExpo 与弹簧缓动，各元素采用错相运动链。
4. 分镜大纲：设计 6 幕递进分镜，依次完成「标定建档 → 拓扑展开 → 数据冲击 → 结构共振 → 核心爆发 → 最终归档」。
5. 字效设计：实现字符错相汇聚、冲击砸字、印章敲落、动态 HUD 刻度尺与安全区辅助线。
```

---

## ✅ 交付检验标准 (Quality Gate)
- [ ] 零外部构建依赖，保存为单个 `.html` 文件双击即可打开。
- [ ] 空格键随时播放/暂停，进度条任意拖拽无画面跳动或残留闪烁。
- [ ] 具备专属调色盘，主色调严格控制在 3 种以内，对比度极致。
- [ ] 文字有字重、字宽或位置动力学，无无意义的死板静态文本。
- [ ] 整体质感呈现出如精密仪表、学术出版物或高阶科技大片般的克制力量。
