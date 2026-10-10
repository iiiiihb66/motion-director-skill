# Opus 5.5 代码做视频：链接、文章与方法论合集

> 整理给我（ChatGPT）的说明：下面是一套"用 AI 写代码做视频"的方法论合集。
> 核心观点先讲清楚——**Opus 5.5 的"品味"不在模型里，在公开的方法论文档里**。
> 这意味着换一个代码能力强的模型（比如你），照着这套 setup 和规则做，也能做出接近的效果。
> 差距不在模型，在有没有：参考库（知道好成品长什么样）+ 工作规则（不让模型瞎猜）+ 品味清单（知道什么算丑）。

---

## 一、一句话原理

写一个网页，里面一个函数 `render(t)`：告诉它"第几秒"，它就画出那一秒的画面。
然后用程序按 24/30/60fps 逐帧截图，拼成 MP4。
不管用 Canvas 2D、Three.js 还是 Remotion，逻辑都一样：
**每一帧都是时间的纯函数**（无跨帧状态、固定种子随机），这是能并行渲染、不翻车的基础。

---

## 二、链接清单（原始来源）

### X 帖子
| 来源 | 链接 | 说明 |
|---|---|---|
| _mexicat 原帖 | https://x.com/_mexicat/status/2103487098258911323 | pdoom-video 原片，154 万播放。黑橙技术图纸风代码渲染 MV |
| xilo 万字拆解 | https://x.com/xilo2991/status/2104912748794589515 | 《零基础入门Opus5.5做视频，万字拆解AI是如何用代码做视频的》，2026-09-29，16.9万浏览，提示词+Skill全开源 |
| Hamza 完整课程 | https://x.com/humzaakhalid/status/2105203643758895454 | 《How to create motion graphics with Claude Opus 5.5 (Full Course)》，2026-09-30。注意：后半部分（brand brief、CLAUDE.md、exact prompt）在付费 newsletter 里 |
| Vincent Wei 转发 | https://x.com/vincentwei93/status/2104252158929674614 | "看了这么多 Opus 5.5 的视频，还是会被这个视频惊艳到" |
| 观默导演系统 | （X 长文，用户转述，原链接未留档） | 给 coding agent 用的"反 PPT"导演法 |

### GitHub 仓库
| 仓库 | 说明 |
|---|---|
| https://github.com/mexicat/pdoom-video | **必看**。黑橙技术图纸风三维代码渲染 MV，2200+ star，MIT 开源。`docs/ENGINE.md`（渲染引擎方法）+ `docs/TREATMENT.md`（导演品味）是美感的核心来源 |
| https://github.com/Kianzzz/xilo-opus-video | 中文的 Opus 5.5 代码视频 skill：三方案→brief.md→逐镜头制作→打分验收，MIT |
| https://github.com/JohnHeibel/PDoomVideo | p5.js + p5.brush 手绘水彩风 MV（另一种美学路线：用笔触换温度） |
| https://github.com/makevoid/motion-graphics-music-video-skill | 给 Claude Code 用的音乐视频插件，含 easing/入场动画 helper 库 |

### 中文博客
| 博客 | 说明 |
|---|---|
| 余弦 blog.cosine.ren | 《用 Opus 5.5 做视频：制作流程与提示词资源记录》 |
| xilo xycost.com | Opus 5.5 做视频相关文章 |

---

## 三、xilo 万字拆解精华

### 7 类代码（按风格选，不是按喜好）
1. **JS + Canvas 2D**：像素风、扁平插画、手绘线条
2. **HTML / CSS / SVG**：网页元素、界面动效
3. **WebGL 着色器**：质感层（扫描线、颗粒、发光粒子），配合 Canvas 叠加做 3D 感
4. **Three.js**：真 3D，镜头在空间里推/拉/环绕；局限是只能拼基础形状
5. **p5.js + p5.brush**：手绘笔触（彩铅/水彩/蜡笔）
6. **HyperFrames / Remotion**：成熟框架；Remotion 按帧控制，可控性更好
7. **Manim**：Python 动画引擎（3Blue1Brown 作者所写）

**选型原则**：先定风格，再选"能做出它的最简单的代码"；能一种做完不混三种。
实测成本参考：3 秒 90 帧，纯 Canvas 7 秒，加着色器层 48 秒。

### 5 个案例的方法点
- **像素巫师**（@majidmanzarpour）：128×96 小画布整数倍放大、关平滑；11 秒 = 5 秒循环 × 2
- **界面变形**（@twoclipping，102万浏览）：**先用 Python 分析音乐找拍点**，所有变化全落拍上
- **游戏史短片**（@prasenx）：Canvas + 着色器 + Three.js 混用；配乐纯代码合成、不要采样
- **甜酷舞蹈**（@Gorden_Sun）：**混合路线**——写实人物走视频模型生成，场景包装走代码
- **AI发展史**（@kimmonismus）：Remotion + SVG + Canvas，开源语音配音

### 提示词 7 块 XML 结构（Anthropic 官方推荐用 XML 包裹）
`<role>` 角色 / `<inputs>` 开工先问什么（没给的不许编）/ `<structure>` 分镜节奏 /
`<build>` 技术路线 / `<gotchas>` 易错点 / `<start>` 第一步做什么等确认

**默认风格警告**：模型无限制时会回到"深色背景 + 居中大字 + 淡入淡出"——必须在 prompt 里明确禁止。

### xilo-opus-video Skill 工作流
1. 先给**三个拉开差别的方案 + 预览**让用户选（防一次定稿返工的最便宜保险）
2. 确认后写成 `brief.md`（即上面的 7 块提示词）
3. 逐镜头制作，每镜头 3 张静帧自检
4. 整片按 7 项清单打分（开场/手机可读/动作/变化/构图/贴合/声画同步），8 分以上才交付
5. 渲染耗时估算公式：**单帧实测耗时 × 总帧数 × 子帧数 × 1.3**（开工前先报价）

---

## 四、Hamza 课程精华：setup 占 90%

**"the prompt is 10% of the result, and the setup is the other 90%"**

实证：帖子写"Claude one-shot this"，背后的 prompt 是 10k 字符 + skills + examples。
反例：没有 setup 时模型在"猜"——人物脖子下没有结构、文字和背景打架到看不清。prompt 没坏，是模型没有 brand、没有 references、没有 rules，只能用猜填补空白。

搭建顺序：
1. **brand folder**：repo、skills、品牌文件、渲染成品放一处，每部新片站在上一部肩上
2. **参考库**：只靠记忆的模型只会输出"最平均"的动画，必须给它看好成品长什么样
3. **skills**：让模型停止猜测的 instruction pack（工作规则）
4. 把片子当**系统**不当 prompt：先锁定视觉语法，再追镜头数量

---

## 五、mexicat pdoom-video：ENGINE 三条硬货

1. **运动模糊**：快门内多子帧平均（切点/冲击处子帧更多）
2. **硬切打在重拍**："Most cuts should be hard cuts on downbeats"，转场是故事的一部分
3. **胶片颗粒每帧一次**：`noise=alls=5:allf=t`，每帧不同的颗粒

## 六、mexicat pdoom-video：TREATMENT 品味规则（决定"美不美"的关键）

- **每幕一个"乐器"**：共享配色/字体/颗粒，但每幕必须有一个独特的视觉动作，五幕不能长一个样
- **永远有东西在动**：强缓动（outExpo/inOutCubic/弹簧）+ 停顿 + 急停；禁止"屏保式"匀速漂移
- **克制**：辉光只给强调色；色彩 restraint；纵深靠光线，不靠堆特效
- **字是画面的一部分**：标题尽量与视觉元素发生关系（标注长在曲线上、数字嵌进卡片），不贴"字幕式"大字
- **母题复现 + 升级**：核心符号在收束时以更强形态回归，一浪高过一浪
- **默认不对称**：瑞士网格，不对称构图，慷慨留白；居中需要理由
- **敢删**：高级感来自删掉自由度，不是加特效
- **Not slop 清单**（出现即返工）：紫青霓虹 cyberpunk、代码雨、镜头光斑 soup、通用粒子星云、"一看就是 AI 生成的"

## 七、观默导演法（管"动得好不好看"）

1. **拍点网格先行**：先定 BPM，所有切点落在整拍上；重动作不对拍 = "差一口气"
2. **运动链**：预备 → 冲击 → 过冲 → 回稳（不要只有过冲没有预备）
3. **错相**（核心反 PPT 手段）：主体先动 → 冲击波在过冲峰值启动 → 背景脉冲晚 0.1s → 装饰最后。**禁止所有图层共用一个进度**
4. **物理写进代码**：冲击波环 = 受力传播、标题 = 弹簧、粒子 = 惯性 + 噪声场；禁止匀速位移
5. **光统一**：主光方向固定；暗角服务主次
6. **切**：场景间默认硬切，切点 = 整拍
7. **自检链**：静帧先行 → 全片拼图 → 切点抽查；有问题只改对应时间段

---

## 八、给 ChatGPT 的实操建议

1. **先读 mexicat/pdoom-video 的 `docs/ENGINE.md` 和 `docs/TREATMENT.md`**（GitHub 上直接能看），这是审美地基
2. 开工前用上面的 XML 7 块结构写 `brief.md`，把"禁止清单"写进去（尤其禁掉"深色背景+居中大字+淡入淡出"默认风格）
3. 技术路线：`render(t)` 纯函数 + Playwright/Puppeteer 按帧截图 + FFmpeg 合成；音乐可用 numpy 合成（120BPM 电子乐无版权问题），或直接配现成音乐
4. 流程：三方案 → 关键帧/2-4秒小样 → 全片；每轮按 7 项清单打分，8 分以下不交付
5. 渲染前先实测单帧耗时，用"单帧 × 总帧 × 子帧 × 1.3"估算，别跑起来才发现要十几个小时
6. 安全区：9:16 竖屏下方约 20% 会被平台 UI（描述栏/按钮）遮挡，关键文字放中上部

---

*整理时间：2026-10-03。来源：用户陆续发来的 X 帖子、GitHub 仓库、中文博客，以及我对这些来源的提炼。部分博客正文未能完整获取（已标注），以原文链接为准。*
