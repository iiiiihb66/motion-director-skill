# motion-director-skill · 竖屏自媒体科技宣传片系统

给 coding agent 用的**竖屏 9:16 科技/金融类短视频**制作系统： deterministic（确定性）时间轴渲染 + 三段式验收 + 自媒体安全区排版。目标是一句话——**在手机上看起来像花钱做的宣传片**。

## 这是什么 / 不是什么

- **是**：一套"导演方法论 + 技法手册 + 参考库索引"，专攻竖屏 9:16 的科技感宣传片（产品发布、金融科普、AI 作品集）。
- **不是**：通用动画 skill。艺术史风格、横屏解说动画请用 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)（35 种艺术风格 + 9 种解说语法，强烈推荐，互补不重叠）。
- **底座**：渲染引擎与美学源自 [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video)（黑橙 HUD 技术图纸风，MIT），本仓库基于其二次开发，见 [归属](#归属)。

## 安装（Claude Code）

```sh
# 方式一：直接复制为本地 skill
git clone https://github.com/iiiiihb66/motion-director-skill.git
cp -r motion-director-skill ~/.claude/skills/motion-director

# 方式二：项目级（只对当前项目生效）
cp -r motion-director-skill .claude/skills/motion-director
```

装完后在 Claude Code 里直接说"用 motion-director 做一条 9:16 宣传片"即可。

## 方法论（三件套）

| 文件 | 作用 |
|---|---|
| `docs/SPEC.md` | **开工总纲**：setup 清单、三段式验收（brief → 最难 2–4 秒小样 → 全片）、量化打分（7 项 8 分过）、自媒体安全区 §K |
| `SKILL.md` | **技法手册**：拍点网格、错相、物理写进代码、运动模糊、胶片颗粒、Reads 时间模型、动效时序数值表、禁止清单 |
| `docs/REPOS.md` | **路线决策表**：12 个参考库索引（mexicat、JohnHeibel、hyperframes、Remotion、xilo-opus-video…），做什么任务走哪条路线 |

另有 `docs/ENGINE.md` / `docs/TREATMENT.md`（mexicat 原版引擎与风格圣经）、`docs/PROMPT_LIBRARY.md`（提示词库）。

## 核心纪律（速览）

1. **每一帧是时间的纯函数** `render(t)`：无跨帧状态、固定种子随机，预览像素 = 成片像素。
2. **三段式验收**：小样不过，不开全片。
3. **9:16 安全区**：顶部 12%、底部 22% 不放关键文字（会被平台 UI 遮挡）；字幕默认 68% 高度处 + 半透明底衬。
4. **本地预览 + 服务器渲染**：Mac 上不跑离线截图（会卡死），只看 HTML 预览拍板；逐帧渲染压片走服务器。
5. **Not slop**：紫青霓虹、代码雨、通用粒子星云、居中大字+淡入淡出——出现即返工。

## 演示

根目录的单文件 HTML 双击即播（9:16 竖屏）：

- `portfolio_15s_showreel.html` — 四种动态视觉风格 15 秒 showreel（旗舰演示）
- `abg_one_opus55_trailer.html` — 期权学习工作台 30 秒宣传片
- `criminology-opus55.html` / `criminology-15s.html` — 罪案学 kinetic typography 演示
- `odyssey-30s.html` / `odyssey-of-light/` — 光之奥德赛系列

## 仓库结构

```
├── SKILL.md              # 技法手册（给 agent 读）
├── docs/
│   ├── SPEC.md           # 开工总纲（给 agent 读，先读这个）
│   ├── REPOS.md          # 12 个参考库索引 + 路线决策表
│   ├── ENGINE.md         # 渲染引擎（mexicat 原版）
│   ├── TREATMENT.md      # 风格圣经（mexicat 原版）
│   └── PROMPT_LIBRARY.md # 提示词库
├── references/           # 方法论文档（观默导演法、pdoom 学习笔记）
├── scripts/              # 音频/构建脚本
├── app/                  # pdoom 引擎（TypeScript + three.js，mexicat 原版）
├── analysis/             # 音频分析工具（mexicat 原版）
├── *.html                # 演示片（双击即播）
└── opus55_code_video_guide.md  # Opus 5.5 代码视频方法论合集
```

## 归属

- 本仓库基于 [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video)（MIT）二次开发，`app/`、`analysis/`、`docs/ENGINE.md`、`docs/TREATMENT.md` 为原仓库内容。
- `SKILL.md`、`docs/SPEC.md`、`docs/REPOS.md`、演示 HTML 为本仓库新增（MIT）。
- 方法论吸收自：观默（@guanmo_ai）导演系统、xilo《Opus 5.5 做视频万字拆解》、Hamza Khalid 课程、Vincent Wei 制作纪律、makevoid 动效库、JohnHeibel 水彩路线。

## License

MIT。`app/public/fonts/` 内字体保留各自协议；`audio/`、`lyrics/` 内歌曲与歌词归原作者。
