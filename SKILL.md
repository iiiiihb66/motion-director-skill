---
name: motion-director
description: 竖屏 9:16 科技/金融类短视频的代码动效导演系统。确定性时间轴渲染 render(t)、三段式验收、自媒体安全区排版。先读 docs/SPEC.md（开工总纲），再读本文件（技法手册）。
---

# Motion Director — 代码动效视频导演系统

> **开工必读（2026-10-03 接入）**：先读 `docs/SPEC.md`（开工总纲：setup 清单、验收标准、迭代纪律），再读本文件（技法手册）。
> 选路线、找参考：查 `docs/REPOS.md`（8 个参考库索引 + 路线决策表），原文在 `docs/REPOS.md（索引，原文在各仓库）`。
> 本文件与 SPEC 冲突时，以 SPEC 为准。

给 coding agent 用的可复现动效制作链。来源：mexicat/pdoom-video（deterministic render + motion blur + hard cuts）、观默导演系统（拍点/错相/物理/自检）、skillry.ai-videos 实战。

## 0. 铁契约（渲染前必须满足）

- 单文件（或固定入口）HTML，`window.FILM={width,height,duration,fps}`，`window.renderFrame(t)` 为时间 t 的**纯函数**。
- 禁止 `Math.random()`/`Date.now()` 做视觉；随机用固定种子 `mulberry32`。
- 预览用 `?t=` 定格抽帧，`requestAnimationFrame` 循环只在无参数时跑。
- 同一帧多次渲染必须像素一致（运动模糊要求子帧可任意顺序渲染）。

## 1. 拍点网格先行（第一步，不是最后）

1. 先定 BPM（如 120 → 0.5s/拍），配乐按网格写。
2. 所有**切点**落在整拍上；所有**重动作**（标题 punch、冲击音、闪切）对准拍。
3. 轻动作（装饰、次级元素）可以不卡拍，但重动作不对拍 = "差一口气"。

## 2. 运动链：预备 → 冲击 → 过冲 → 回稳

- 不要只有 easeOutBack（只有过冲，没有预备）。
- 用单连续函数，一气呵成，动量不断：
  - `punchScale(p)`：p∈[0,0.3] 下沉到 0.94（预备蓄力）；p∈[0.3,1] 从 0.94 弹到 ~1.12（冲击+过冲）再回稳到 1.0。
- 压扁/拉伸必须来自速度与冲量，不是随机 easing。

## 3. 错相（核心反 PPT 手段）

- 主体先动 → 冲击波在"砸中"瞬间（过冲峰值）启动 → 背景/环境脉冲再晚 0.1s → 阴影装饰最后。
- **禁止所有图层共用一个进度**——全体同步 = PPT 感，这是翻车第一信号。
- SFX 打在接触帧，可故意偏一两帧，更自然。

## 4. 物理写进代码

- 冲击波环 = 受力传播；标题 punch = 弹簧；粒子/星空用惯性+噪声场。
- 禁止匀速位移、禁止整幅推拉、禁止死轮廓位移。

## 5. 光统一

- 主光方向固定（如顶部中央）；高光沿边缘走；冲击只亮环境一瞬，不全局乱抖。
- 暗角/渐晕服务主次，别糊成奶油背景。

## 6. 切：硬切打在重拍上

- 场景之间默认**硬切**（无叠化），切点 = 整拍；0.2s 渐变闪 + sub drop 冲击音覆盖切点。
- 场景内部的转场（如代码→截图）可以用短叠化，但标题等重元素必须先淡出再进，避免重影。

## 7. 运动模糊（视频感 vs 代码感的分水岭）

- 每帧 = 快门内 K 个子帧的平均。快门取 0.5 帧时长，子帧均匀分布、 centered。
- 自适应采样：切点/重动作前后 0.8s 用 K=12，其余 K=4。
- 子帧按时间顺序无关——靠铁契约保证。

## 8. 胶片颗粒（每帧一次）

- 模糊之后、编码之前加：`ffmpeg -vf noise=alls=6:allf=t`。颗粒按帧变，不按子帧。
- **血泪教训（2026-10-03，ABG pdoom 版实测）**：**禁止在 canvas 里逐帧画随机颗粒再喂给 x264**。随机颗粒会摧毁帧间预测，x264 码率泵吸，暗部出现肉眼可见的"呼吸式"闪烁（实测：900 帧里 11 处亮度交替跳变、最大跳变 16.79/255，夜间手机上非常晃眼）。canvas 帧必须干净，颗粒只走编码时的 noise 滤镜（实测 0 闪烁）。自检方法：抽每帧平均亮度，连续帧差若交替变号且 >0.15 即判定闪烁。
- **辉光 bloom（2026-10-03 验证）**：真 bloom 不用 three.js，ffmpeg 后期链即可，C 代码飞快（900 帧约 6 分钟），不用重渲染：
  `format=gbrp,split[a][b];[b]curves=all='0/0 0.72/0 1/1',scale=540:960,gblur=sigma=16,scale=1080:1920[bl];[a][bl]blend=all_mode=screen,format=yuv420p`
  要点：①必须在 **RGB（gbrp）空间**做 screen 混合——在 YUV 下 screen 会把色度平面也糊掉（中性灰 128→192），全片发紫；②curves 先压掉 72% 以下的暗部，只让亮部参与辉光；③半分辨率模糊再放大，又快又柔。暗角 `vignette=PI/4.2`、颗粒 `noise=alls=5:allf=t` 串在后面一次成型。

## 9. 自检链（必须跑完才交付）

1. **静帧先行**：关键帧（标题砸中瞬间、切点、转场中间态）抽 PNG，逐张看。
2. **contact sheet**：全片每 2–3 秒一张拼图，查黑场/重影/溢出。
3. **切点抽查**：每个切点前后各抽一帧。
4. 有问题只改对应时间段，重渲（seek(t) 的好处）。

## 10. 渲染管线（本机验证过）

```bash
# 子帧渲染（puppeteer + headless chrome）
node render_blur.mjs        # -> frames/f%04d.jpg（已做运动模糊平均）
# 合成
ffmpeg -y -framerate 30 -i frames/f%04d.jpg -i music.wav \
  -vf "noise=alls=6:allf=t" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -shortest -movflags +faststart out.mp4
```

- `file://` 下 `page.goto` 用 `waitUntil:'domcontentloaded'`（`networkidle0` 会超时）。
- 逐帧 `page.evaluate(renderFrame, t)` + screenshot，不要每帧 reload 页面。
- 2026-10-03 实测：本机任何 ANGLE 后端（vulkan/gl-egl/gl）都拿不到 WebGL 上下文，无 GPU。three.js 只能走 SwiftShader 软件渲染（10–60s/帧），不可用。要 3D 感走"3D 数学 + Canvas 2D 投影"（CPU 算旋转/透视/粒子坐标，Canvas 画点线框），不用 three.js。

## 11. 品味规则（from mexicat/pdoom-video TREATMENT）

- **每幕一个"乐器"**：共享 palette/type/grain，但每幕必须有一个独特的视觉动作（开场=字母演绎，学习=轨道环绕，模拟=曲线绘制，计划=日历脉冲，收束=光线汇聚）。五幕不能长一个样。
- **永远有东西在动**：strong eases（outExpo/inOutCubic/弹簧）+ holds + snaps；禁止 floaty 的屏保式匀速漂移。
- **克制**：bloom/辉光只给 signal 色；色彩 restraint；depth 靠光线，不靠堆特效。
- **字是画面的一部分**：标题尽量与视觉元素发生关系（标注长在曲线上、数字嵌进卡片），不贴"字幕式"大字。
- **母题复现+升级**：核心符号（logo/字母）在收束幕以更强形态回归，一浪高过一浪。
- **默认不对称**：瑞士网格，不对称构图，慷慨留白；居中需要理由。
- **敢删**：每次迭代列出"删了什么"。高级感来自删掉自由度，不是加特效。
- **Not slop 清单**：紫青霓虹 cyberpunk、代码雨、镜头光斑 soup、通用粒子星云、"一看就是 AI 生成的"——出现即返工。（品牌自带渐变色除外，但 glow 要克制）

## 13. 制作纪律（from Vincentwei1021/anything2explainer SKILL）

- **持续动作 + 落位停留**：每幕都要有一个"动词"（数据流/绘制/点亮/光点跑线）持续到下一拍；元素入场后不许完全静止 >3s；**禁止为凑数给静止物体加无意义的漂浮/呼吸**；落位后留 30–45 帧（1–1.5s）稳定期再离场/切走。
- **特效预算**：高光/闪烁全片定量——闪切只给切点，冲击波只给标题，不超发。特效是货币，花在刀刃上。
- **一镜一主角**：主角 = 大字 ≥96px 或视觉主体，带光（渐变/辉光/描边）；配角不发光。背景只有幕底，不撒碎屑。
- **四个确认点（越早改越便宜）**：方向 → 关键静帧 → 样片/配乐 → 成片。静帧阶段改 1 处 = 1 张图的成本；成片后再改 = 全片重渲。
- **衔接干净**：离场到 α=0 再入场，无半透明"啪"断；硬切时用闪 + 冲击音覆盖切点。
- **事实有出处**：画面上的截图、数字、文案必须来自真实产品资料，不编造产品界面。
- **量化自检（未来）**：最长静止段、末拍稳定期可做成自动化检查（帧差法），目前先用 contact sheet 人工过。

## 14. p5.brush 水彩路线（from JohnHeibel/PDoomVideo，2026-10-02 复现验证）

- 库：p5.js **2.x** + `dist/p5.brush.js`（p5 构建版），canvas 必须 **WEBGL** 模式；`brush.instance(p)` 绑定实例。
- **渲染架构（关键）**：绘制必须放在 p5 的 `draw()` 里，逐帧调用 `await P.redraw()`（p5 2.x 返回 Promise）——p5.brush 的自动刷新挂在 draw 周期末尾。直接在外部函数里画再截图，水彩层会因 compositor 竞态随机丢失；`readPixels`/`brush.render()` 都救不了。这是 JohnHeibel 原仓库 `renderAt` 的做法（`T=t; await redraw(); composite(); outC.toDataURL()`）。
- **opacity 是 0–255**，不是 0–1！传 0.8 ≈ 透明，这是第一个坑。
- 笔刷名（2.2.2）：pen, rotring, 2B, HB, 2H, cpencil, pastel, crayon, charcoal, spray, marker（没有 ink/inkfine/dry）。
- 沸腾线条：每帧 `p.randomSeed(固定+boil*K)`，`boil=Math.floor(t*12)` —— 12次/秒重抖，线条像手绘动画一样"沸腾"；`randomSeed` 会同时 seed brush。
- 大字：Permanent Marker 字体 + ink drop-shadow（`5px 5px 0 rgba(43,38,32,.28)`），入场用 backOut 过冲。
- 结构：chapter → shots，`fn(t, lt, dur)` 纯函数；卡拉OK条放底部；纸纹底 + 顶部颗粒。
- 性能：单页连续 `redraw()` 会累积变慢（0.38s→3.93s/8帧，GPU 资源不释放），**每 30 帧换新页面**；600帧约15分钟。断点续渲：跳过已存在且 >5KB 的帧。

## 15. 动效 helper 库（from makevoid/motion-graphics-music-video-skill，2026-10-03 移植）

p5 版改写为 Canvas 2D 原生（`lib/*.js`），`<script>` 引入即用，命名空间 `Anim`。2026-10-03 已用测试页全量验证（slap/pop/shake/trace/sparkle/twinkle/karaoke/typed/slip/cues 零报错）。

- `lib/anim-time.js`：easing（linear/inCubic/outCubic/inOutCubic/outExpo/outBack/outElastic）+ `progress` / `tween` / `live` / `envelope(t,start,end,fadeIn,fadeOut)` / `steps` / `sinceStep(t,start,period,fps)`。`envelope` 是"柔和入场"的标准解（开场淡入、字幕淡入都用它，不许直接 alpha=1 弹出）。
- `lib/anim-core.js`：`rng(seed)`（mulberry32，铁契约唯一合法随机源）、`at(ctx,x,y,{scale,rot,alpha},fn)`（变换包装）、`cues(words)`（按词查时间点，词不存在抛错，防时间轴漂移）。
- `lib/anim-fx.js`：`slap` / `pop` / `slam`（返回 `{scale,rot,alpha}`，直接喂 `Anim.at`）+ `shake(t,start,{dur,amp,rnd})`（rnd 必须传 `Anim.rng` 实例）+ `sparkle` / `twinkle` / `trace`（折线生长+焊点）。
- `lib/anim-type.js`：`knockout`（描边贴纸字）/ `typed` / `typedWords` / `karaoke(ctx,t,words,x,y,opts)`（**逐词** karaoke，words=`{text,s,e}`，当前词 active 色 + 下划线随词时长生长；`align:'center'` 居中）。中文 karaoke 用这个，不再用按 block 的旧写法。
- `lib/anim-paper.js`：`slip(ctx,w,h,opts)` 撕纸边缘标签（字幕条/标注卡片），形状按 seed 缓存跨帧不变。
- `tools/beats.py`（numpy only）：`python3 tools/beats.py song.wav 30` 输出 BPM/节拍网格/每拍强度/鼓点/ onsets。**音乐版**的切点、标题 punch 必须对准 `beats[].t`，重拍用 `bar_pos==0`。
- `tools/audio_energy.py`：每 0.5s 音量 + 人声频段占比，旁白版用 `vocal_ratio` 定位说话段落。

刻意没搬的：`riso.js` 的逐像素 grain（1080×1920 下 `getImageData` 每帧太慢；颗粒走 §8 的 ffmpeg noise）；p5 专属的 `createCanvas/loadFont/clip` 精灵管线（我们是单 canvas + 系统字体）；Ruby 脚手架 + Fal 付费生成（重、不适合我们）。

## 16. Reads 时间模型（from JohnHeibel/ClaudeAnimationBase ANIMATION_GUIDE Rule 4）

观众第一次看、只看一遍、正常速度。你写代码所以知道发生了什么，观众不知道。**为每个镜头列出观众必须理解的东西（reads），按顺序，每项带起止时间。**

- 每个 read 需要三段时间：眼睛找到它 → 理解它 → 注册它（喘息），然后才能开始下一个 read。
- **一次只做一个 read**：两个重要 read 不能重叠。因果和反应必须串行（先让观众看清原因，再给反应）。
- **快的动作、慢的含义**：动作本身可以很快（有预备动作 anticipation 就读得懂），但它意味着什么需要 hold 住。预备告诉观众往哪看，hold 让观众理解。快与慢的对比就是节奏；一个速度从头到尾=平。
- **reads 决定镜头长度**：reads 没落地不能切；reads 都落地了别拖尾。最后一幕的最后一个 read 也要留时间落地再结束。
- 每个镜头必须有一个 EVENT：第一帧和最后一帧之间有变化（想要/找到/尝试/失败/反应/得到）。"站在那很可爱"不是镜头。
- Storyboard 格式（写进 PLAN.md）：`Logline（一句话）/ World（场景+调色板+色彩弧线）/ Motif（复现并收束的母题）/ 情绪弧线 / Shots：每 shot 起止、转场、画面、EVENT、反应、reads（起止+观众眼睛在哪）`。对照检查：每 shot 有 event 吗？每 read 有落地时间吗？每条缝有转场吗？

## 17. 动效时序数值表（from buildwithhanif/claude-animation-skill references/motion.md）

§2 的"预备→冲击→过冲→回稳"配上这些具体数值才好用：

- **Snap, then hold**：变化在 1–2 帧（0.04–0.07s）内完成，然后 hold。干脆的变化读作"有意为之"；0.5s 的 ease 读作幻灯片转场。ease 用在 settle（回稳）上，不用在变化上。
- pop 入场过冲：`eBack` s≈1.8–2.2，时长 0.3–0.4s。
- 冲击定格（打击感）：game time 冻结 2–3 帧（0.083s；大招 0.125s；终结 0.3s），火花/冲击环/震屏在 real time 继续动。
- 落地 squash：1.35 → 1 用 0.18s；起跳预备：1.22 压 2 帧。
- 组内错相：0.05–0.14s 递进；**一次只动一个东西**（除非它们是一组）。
- 循环的元素相位全部错开（`i*1.1`），循环从中间开始（第一帧不许空）。
- Hold 要有生命：呼吸 ±2%、眨眼每 ~3.3s、光带漂移。静帧=bug。
- 相机：变换只加在场景层；字幕/标注/UI 覆盖层不要进相机。慢推 +5–10%/shot。
- **bake-once-blit**（from lowpoly.mjs）：贵的东西（facet 背景、复杂装饰）在 setup() 里烘成离屏 canvas，每帧 `drawImage`，不要每帧重算。

## 18. QA 升级：strip / crop-at / 缓存陷阱（from ClaudeAnimationBase render.mjs + traps.md）

§9 自检链加两个工具：

- **strip**：关键动作（转身、take、跳跃、转场）逐帧拼条（2.1:2.6 全帧拼），看有没有预备/跟随、有没有 pop、有没有左右镜像/同步。
- **crop-at**：跟随世界坐标点的裁剪（脚/手/道具接触点），查接触：脚着地了吗？手里的东西碰到手了吗？
- timing 读法：固定步长（0.1–0.15s）拼 sheet 按顺序读；每帧问"观众现在看哪、看懂了吗"；数帧数（24帧=1s）；重要 read 之间必须有喘息帧。
- **缓存陷阱**：预览图可能读回缓存的旧版本，修好了看起来像没修（我们 v2 吃过这个亏）。每次输出写新文件名（v2/v3），或查 mtime。
- Frame 0 不许空：开场画面里已经有东西（开场中段开场），不许全黑等东西弹进来。

## 19. 解说词讲故事 12 原则（from VincentWei1021/anything2explainer reference/narration-guidance.md）

跟 §16 的故事片方法互补：§16 管"画面怎么讲故事"（人物、事件、情绪弧线），这里管"文案怎么讲故事"（旁白版/解说版宣传片直接用）。

- **每句话测试**：念出来问——听众是否知道了/看到了/感受到了之前没有的东西？没有就是废话，删。
- **处境开场**：先给具体场景/问题/悬念，再给定义。以"X 是指…"或"本视频将…"开场=最宝贵的几秒浪费了。
- **一条主线**：全片回答一个问题或走完一段旅程（从头到尾的流程、一个解决的悬念）。章节能随意调换顺序=没有主线=失败（术语叫 glossary 式失败）。
- **先因后果**：每讲一个东西，顺序是"没它会出什么问题 → 它怎么工作 → 带来什么"。永远不要解释听众还不想知道的机制；砍长度时先砍机制细节。
- **数字换算成可感尺度**：数字不许直接念，必须换算成日常可感的尺度（对比、类比），换算不了就删。
- **比喻承重**：比喻只在能让听众推出新结论时用；一个比喻贯穿始终，胜过六个一次性小聪明；比喻失效立刻扔掉。
- **说话人有判断**：像对一个聪明的朋友说话，允许有观点（"关键是这部分"），诚实面对不确定性（"大概""没人完全知道为什么"）。
- **节奏变化**：长短句交错；连续三句同长度同句式必改。念出来检查。
- **术语后置**：先用大白话讲清楚，再贴术语标签（"…这就是人们说的 X"）。每个引入的术语后面必须再用一次，否则不配拥有名字。
- **结尾回扣**：1 分钟内让听众知道"做好/做坏有什么后果"；结尾回到开场场景/问题，用新理解重新框定。是收束，不是总结列表，更不是告别。
- **不描述画面**：旁白扛原因/后果/比较/判断，画面扛结构/顺序/数量。只描述画面内容的句子删掉，让画面自己说话。
- **精确赢得信任**：真名真数有出处，约数标明是约数。宁可平静但对，不要刺激但错。

起飞前检查表：开场第一句有人处在处境里了吗？章节能调换顺序吗（能=没主线）？每句都通过"每句话测试"了吗？结尾回扣了吗？

## 12. 禁止清单（出现即返工）

- 居中大字 + 霓虹渐变背景（默认模板味）
- 全体元素同步淡入/淡出
- 匀速直线位移
- 切点/重动作不在拍子上
- 转场处两版标题重影
- 文字溢出画面边缘（CJK 按 1em/字 + letterSpacing 估算宽度）
- **Opus 默认风格**（from xilo）：无限制时模型会回到"深色背景+居中大字+所有东西淡入淡出"——开工 prompt 必须明禁，用 XML `<direction>` 写清不要什么
