# 参考库索引 REPOS.md

> 建库日期 2026-10-03。来源：Hamza Khalid 教程的 8 个 repo（7 个已 clone 到 `repos/`，Remotion 是文档页）+ mexicat 原仓库（第 9 个，我们的锚点）。
> 每条强制字段：链接 / 一句话 / 技术栈 / 关键 pattern / 适用与不适用 / 可以借鉴什么（1-3 步动作）/ 资料完备度。
> 资料完备度分三档：**原文**（读过 README/源码）/ **转述**（只看过介绍）/ **未知**。不拿转述冒充原文。

---

## 1. mexicat/pdoom-video —— 我们的锚点

- 链接：https://github.com/mexicat/pdoom-video
- 一句话：黑橙 HUD 风 P(doom) MV 的完整实现，17 幕，TypeScript + Three.js 确定性时间轴驱动。
- 技术栈：TypeScript + Three.js + WebGL + GLSL；单文件构建；浏览器内播放。
- 关键 pattern：① 每一帧是歌曲时间 t 的纯函数，逐帧确定性渲染；② 后期链（bloom/halation/grain/vignette）统一美术；③ TREATMENT.md 风格圣经（每幕一个"乐器"、母题复现、克制）；④ 歌词/节拍锚定时间轴。
- 适用：黑橙 HUD/技术图纸风歌词 MV，我们的主路线。不适用：无 GPU 环境（本机 SwiftShader 10–60s/帧，只能跑不能渲）。
- 可以借鉴什么：① 新场景先读 TREATMENT 再动手；② 后期链做成可复用模块；③ 时间轴锚定歌词行而非秒表。
- 资料完备度：**原文**（跑过构建，验证过 `window.__pdoom.ready`）。

## 2. JohnHeibel/PDoomVideo —— p5.js 水彩路线

- 链接：https://github.com/JohnHeibel/PDoomVideo
- 一句话：p5.js + p5.brush 手绘水彩风的完整 P(doom) MV，9 章节、角色主演、卡拉 OK 全片。
- 技术栈：p5.js 2.x + p5.brush + puppeteer + ffmpeg；无构建，直接 script 引入。
- 关键 pattern：① t 纯函数 + `hash(i)` 稳定随机 + `jit()` 12fps boiling 抖动；② 章节/镜头注册制 `chapter(name,start,end,shots)`；③ 节拍驱动（88BPM 换算脉冲）；④ `camBegin/camEnd` 相机语言 + brushWipe 转场；⑤ sheet/strip/crop 三级自检。
- 适用：手绘/绘本/水彩风、角色动画、歌词可视化。不适用：HUD 风、真 3D、精确排印、重型 shader。
- 可以借鉴什么：① boiling 抖动的种子隔离写法；② 三级自检管线直接抄；③ 章节注册制的时间轴组织。
- 资料完备度：**原文**（读过 README + render.mjs + 提炼文档 `docs/notes（未收录）repo-pdoomvideo.md`）。
- 取舍：mexicat 用算力换精确，PDoomVideo 用笔触换温度；时间轴思想同源，美学相反。

## 3. JohnHeibel/ClaudeAnimationBase —— starter + 导演方法论

- 链接：https://github.com/JohnHeibel/ClaudeAnimationBase
- 一句话：从 PDoomVideo 提炼的 starter kit，核心资产是 `ANIMATION_GUIDE.md` 导演方法论。
- 技术栈：同 PDoomVideo（p5.js 系）。
- 关键 pattern：① 三目标七规则（prompt 定"拍什么"、guide 定"怎么做"）；② reads 时间模型（为观众建模，一次只给一个 read，带起止时间）；③ 表演系统（情绪过渡禁硬切）；④ 强制 review loop。
- 适用：任何新片子的"导演层"规范，不限技术栈。不适用：单独作为渲染引擎。
- 可以借鉴什么：① 开工先写 PLAN.md（logline/world/motif/情绪弧线/shots+reads）；② reads 没落地不许切；③ 它正是"setup 占 90%"的实例化——我们缺的导演一半。
- 资料完备度：**原文**（`docs/notes（未收录）repo-claudeanimationbase.md`）。

## 4. buildwithhanif/claude-animation-skill —— Node canvas 手绘短片 skill

- 链接：https://github.com/buildwithhanif/claude-animation-skill
- 一句话：让模型用纯代码画"像手绘"的 2D 动画短片的 skill；Node 直跑，无需浏览器/GPU。
- 技术栈：Node canvas + ffmpeg；`frame(ctx,t)` 纯函数 → harness（render/sheet/strip/verify）→ PNG 序列 → ffmpeg；声音 `sound.mjs` 按 cue 时间轴合成。
- 关键 pattern：① 三层细节法则 base→texture→edge + 材质清单；② 带解剖结构的 rig（非 blob）；③ 先看后渲（sheet/strip/contact sheet）；④ 声音 cue 早 0.03s；⑤ 防猜机制：Read-first 路由表 + traps.md（13 个真实踩坑）+ 8 条硬规则。
- 适用：手绘/绘本/水彩风 2D 短片、无 GPU 快速迭代。不适用：3D、写实、HUD/歌词 MV、UI 动效。
- 可以借鉴什么：① traps.md 机制——每次踩坑记一条，持续积累；② 风格圣经贴文件头防漂移；③ cue 早 0.03s 的声音习惯。
- 资料完备度：**原文**（`docs/notes（未收录）repo-claude-animation-skill.md`）。注意：它的美学（暖纸绘本）和我们的黑橙 HUD 是相反方向，视觉词汇不直接套。

## 5. heygen-com/hyperframes —— HTML 动效框架（AI agent 专用）

- 链接：https://github.com/heygen-com/hyperframes
- 一句话：HeyGen 开源的"Write HTML. Render video"框架——专为 AI agent 设计的确定性 HTML→MP4 管线。
- 技术栈：HTML + CSS + JS（含 GSAP 时间轴）；不播放视频，而是每帧算 `t = frame / fps`（整数数学，不读系统时钟），把动画 seek 到精确时刻，用 Chrome `HeadlessExperimental.beginFrame` 原子抓帧 → ffmpeg。
- 关键 pattern：① 帧是时间的纯函数（frame→t→像素），与 mexicat 确定性引擎同源，载体是 DOM；② **seek 而非 play**：时间轴暂停并 seek，慢机器不丢帧；③ 确定性四戒：不用 Date.now/计时器、不用未播种随机、渲染中途不 fetch、fps/宽高/时长第 0 帧前锁定；④ skill 路由防猜：`/hyperframes` 路由器先教生产循环再干活；⑤ 自带 catalog/blocks 组件库。
- 适用：产品介绍、营销视频、数据图表动画、UI 动效（版式/文字/图表类）。不适用：黑橙 HUD 故障美学、3D 粒子、shader 级视觉（DOM 天花板不够）。
- 可以借鉴什么：① 确定性四戒抄进硬规范（§G 已补）；② "seek 而非 play"思想——渲染与播放解耦；③ skill 路由器模式：先教流程再干活。
- 资料完备度：**原文**（`docs/notes（未收录）repo-hyperframes.md`）。

## 6. Remotion Agent Skills —— React 视频框架的 skill 组

- 链接：https://www.remotion.dev/docs/ai/skills（文档页，不可 clone）
- 一句话：React 组件即视频的框架 + 官方 agent skill 组（best-practices/create/markup/studio/render/captions/maps/multimedia）。
- 技术栈：React + `useCurrentFrame()`；Studio 预览 → 无头渲染 MP4。
- 关键 pattern：① 视频即 React 树，时间轴声明式；② skill 即文档路由——`/remotion-docs` 让 agent 运行时查 API 而不是靠记忆；③ captions skill 专管字幕排版。
- 适用：UI 动效、营销视频、数据可视化、字幕/歌词排版参考。不适用：逐像素艺术控制（shader 粒子不是它的主场）。
- 可以借鉴什么：① "运行时查阅 > 靠记忆"的防猜机制；② 歌词字幕排版规范参考 captions 思路。
- 资料完备度：**转述**（读过 skills 列表页；`docs/notes（未收录）repo-remotion.md`）。

## 7. WinterArc21/Battle-of-Austerlitz-Film —— 长篇代码电影

- 链接：https://github.com/WinterArc21/Battle-of-Austerlitz-Film
- 一句话：纯代码拍 5 分钟历史战争电影：WebGL2 + GLSL + 全合成声音，电影=时间的确定性函数。
- 技术栈：WebGL2 + GLSL（Kuwahara 油画滤镜后期）+ 程序化精灵图集 + Playwright + ffmpeg；声音全合成（Kokoro TTS 离线旁白 + Python 混音）。
- 关键 pattern：① 场景=纯函数 f(t)，预览与导出同一套代码；② 声音从画面反推（声速 343m/s，远炮看得见、听得晚）；③ 风格化靠后期栈（油画滤镜+颗粒+黑边）不靠建模精度；④ 分块并行渲染（10 秒一段、多 worker、断点续跑）。
- 适用：长篇叙事、需要统一美术质感的片子。不适用：短平快 MV（管线重）。
- 可以借鉴什么：① "后期栈统一美术"——bloom/颗粒/暗角做成可复用链，不要每场景各写一套；② 声音触发点从时间轴数据推导，不再人肉对齐；③ 10 秒分块 + 断点续跑的渲染工程化。
- 资料完备度：**原文**（`docs/notes（未收录）repo-austerlitz.md`）。

## 8. guanmo-ai/awesome-ai-motion —— 441 个案例的 prompt 图书馆

- 链接：https://github.com/guanmo-ai/awesome-ai-motion
- 一句话：X 上 AI 代码动效视频的案例目录库：441 个作品、69 份公开提示词、25 个附源码。
- 组织：主维度按用途 7 类（产品宣传/知识讲解/短动效/3D 与交互/叙事短片/音乐与歌词/像素与角色）；每案例固定字段：原帖链接、模型归因、"可以借鉴什么"、使用前警告；`data/cases.json` 单一数据源 + 脚本生成展示。
- 关键 takeaway：① "一句话生成"是假象，病毒 prompt 背后都是万字 setup；② **视频参考 > 文字描述**（给模型参考视频照着做，接近 1:1）；③ 歌词 MV 核心是"逐句回应"，歌词大字出现时背景要让位；④ "可以借鉴什么"比 prompt 本身更值钱；⑤ 诚实标注资料边界（原文/转述/未知）。
- 适用：找参考、找"别人是怎么做的"。不适用：直接当教程（很多案例资料不全）。
- 可以借鉴什么：① 做新场景前先找/生成参考帧，贴进 prompt；② 我们的索引照抄它的 7 类 + 加"技术栈"维度（它缺的）；③ 每条索引配"怎么用"，不只堆链接。
- 资料完备度：**原文**（`docs/notes（未收录）repo-awesome-ai-motion.md`）。

## 9. athemeroy/awesome-opus-5-5-videos —— 1401 个作品的取证数据集

- 链接：https://github.com/athemeroy/awesome-opus-5-5-videos
- 一句话：1401 个 Opus 5.5 视频的取证级数据集：7 条生产路线 + 每条的失败测试验收清单。
- 关键 takeaway：① 我们的 Three.js 确定性渲染路线是数据集中验证过的主流路线（动效/UI 类 350 例居首），坚持走；② **三段式验收**：brief 定稿 → 最难 2–4 秒小样 → 全片可复现交付，直接抄；③ "一句话出片"真相是触发预置风格库——目标是攒"黑橙 HUD 风格库"，不是每次从零 prompt；④ 公开 prompt 172–17664 字符是"10% prompt / 90% setup"的实证。
- 适用：路线选择、验收标准。不适用：具体技法（它是数据集不是教程）。
- 可以借鉴什么：① 三段式验收做成硬流程；② 每次做完沉淀可复用模块进风格库。
- 资料完备度：**原文**（`docs/notes（未收录）repo-awesome-opus55.md`）。

---

## 路线决策表（做什么任务 → 用哪条路线）

| 任务 | 首选路线 | 依据 |
|---|---|---|
| 黑橙 HUD / 技术图纸风 / 歌词 MV | mexicat Three.js 确定性引擎（有 GPU）；无 GPU 时 Canvas 2D 投影 | 数据集验证的主流路线；我们的锚点 |
| 手绘 / 水彩 / 绘本风短片 | PDoomVideo（p5.js + p5.brush） | 笔触换温度；自检管线成熟 |
| 2D 手绘、无浏览器环境 | claude-animation-skill（Node canvas） | Node 直跑；traps.md 防猜 |
| UI 动效 / 营销视频 / 字幕排版 | Remotion / hyperframes | 声明式时间轴；captions 强项 |
| 长篇叙事（>2 分钟） | Austerlitz 模式（f(t) + 分块并行渲染） | 5 分钟实证；断点续跑 |
| 写实人物/舞蹈 | 混合管线：视频模型出人物 + 代码搭场景/包装 | xilo 案例4、forest-dream 实证；代码画不出毛孔 |
| 找参考 / 学别人怎么做 | awesome-ai-motion（441 案例） | 按用途 7 类检索 |
| 定验收标准 / 选路线 | awesome-opus-5-5-videos（1401 数据集） | 7 条路线 + 失败测试清单 |
| 中文 prompt 模板 | xilo-opus-video（7 块 XML brief） | 中文可直接复用 |

**选型原则**（from xilo-opus-video）：先定风格，再选能做出它的**最简单的**代码；能一种做完不混三种。

---

## 10. lemomo-ai/lemo-opuscar —— 43 种影片风格库（设计风格弹药库）

- 链接：https://github.com/lemomo-ai/lemo-opuscar
- 一句话：43 种影片风格，每种 = 可复用的风格提示词 + 一支 Opus 5.5 纯代码短片；"选一个风格、带上自己的故事，让 agent 当导演"。
- 分类（8 大类）：手绘与绘画 / 东方传统 / 印刷与版画 / 图形与排版 / 信息与发布 / 卡通与动画 / 游戏 / 电影与时代 / 材质与 3D。
- 关键机制：skill 安装后按风格名查 `styles/README.md`；每支片子工程独立，风格资产共用（`~/lemo-opuscar`）。
- 适用：**任何"换风格"的需求先查这个库**，而不是从零 prompt。这是 SPEC §H"黑橙 HUD 风格库"的对标物——我们的目标就是攒出自己的风格库。
- 可以借鉴什么：① 风格 = 提示词 + 样片 + 导演指南 + 技术指南，四件套；② 做新风格前先看它的同类样片。
- 资料完备度：**原文**（`docs/notes（未收录）repo-lemo-opuscar.md`）。43 风格完整目录见 `STYLES.md`。

## 11. francozanardi/papermotion —— 剪纸定格动画引擎

- 链接：https://github.com/francozanardi/papermotion
- 一句话：专为 AI agent 设计的剪纸定格动画 TypeScript 引擎：撕纸边缘 boiling、纤维质感、骨骼+弹簧角色、确定性 Verlet 物理、离线渲染 + 自检帧。
- 技术栈：TypeScript + Playwright 无头渲染 + ffmpeg；场景写成代码注册进 `examples/catalog.ts`；自带 agent skill（`.claude/skills/papermotion`）。
- 适用：剪纸/拼贴风短片、需要"手工质感+物理可信"的角色动画。不适用：HUD 风、精确排印。
- 可以借鉴什么：① "capture contract"（渲染抓帧契约）；② 纸质感做法（撕纸边缘+纤维+投影）；③ references/ 按需加载的 skill 组织。
- 资料完备度：**原文**（`docs/notes（未收录）repo-papermotion.md`）。
- 关键区别：它是**有状态物理仿真**（Verlet），帧只能顺序拉取、不能随机 seek/并行分块——与 t 纯函数引擎根本不同。长片分块渲染不抄它。

## 12. Kianzzz/xilo-opus-video —— 中文代码视频 skill

- 链接：https://github.com/Kianzzz/xilo-opus-video
- 一句话：中文 Opus 5.5 代码视频 skill：三方案让用户选 → brief.md（7 块 XML）→ 逐镜头做 → 打分 8 分+才交付。
- 关键机制：① 三方案（A 稳妥/B 换画面语言/C 换讲法）；② brief.md 七块：role/inputs/direction（含禁止清单）/structure（节拍网格+逐镜头）/build/gotchas/start；③ 自检 7 项 1–10 分（开场2秒/手机可读/动作/变化/构图/贴合/声画同步），8 分过，review_log 记每轮；④ CLAUDE.md 项目级规矩（render(t) 纯函数）；⑤ audio_tools（beats/sfx/响度-14 LUFS）。
- 已并入我方 setup：三方案→SPEC §A；量化打分→SPEC §I；响度标准→SPEC §D。
- 资料完备度：**原文**（`docs/notes（未收录）repo-xilo-opus-video.md`，`docs/notes（未收录）article-xilo-opus55.md`）。

---

## 方法文档（非 repo）

| 文档 | 来源 | 内容 | 状态 |
|---|---|---|---|
| `docs/notes（未收录）article-hamza-opus55.md` | Hamza Khalid X 文章 | 10/90 规则、搭建顺序、8 repo 清单 | 原文（上半）；newsletter 部分未获取 |
| `docs/notes（未收录）method-guanmo-director.md` | 观默 X 长文 | 导演系统：拍点/错相/物理/光/切/自检 | 转述（已进 skill §1–§6、§9） |
| `docs/notes（未收录）cases-music-lyrics.md` | awesome-ai-motion 35 个音乐案例 | 歌词 MV 可复用方法 | 挖掘中 |
| 余弦 blog.cosine.ren《用 Opus 5.5 做视频》 | 中文博客 | 制作流程与提示词资源记录 | **待补**（文章链接解析失败） |
| xilo xycost.com | 中文博客 | Opus 5.5 视频教程 | **待补**（未定位到具体文章） |

## 维护规则

- 新增参考只加**读过原文**的；转述的标转述，不冒充。
- 每次踩坑 → 对应库的"可以借鉴什么"追加一条（学 claude-animation-skill 的 traps.md）。
- 每次做完片子 → 沉淀可复用模块到"黑橙 HUD 风格库"（目标见 SPEC.md §H）。
