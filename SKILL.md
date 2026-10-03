---
name: motion-director
description: 代码驱动的动态视觉与音乐卡拉OK视频生成引擎（基于 Three.js + WebGL + Canvas2D）。支持音频节奏分析（BPM/低音/鼓点）、字词级时码同步以及电影级动态排版场景。严禁运行耗费资源的逐帧离线截图压制，默认启动轻量 Web 服务（http://localhost:5173）提供 60FPS 实时音画同步交互预览。
---

# Motion Director Skill（代码动效视觉导演）

本 Skill 沉淀自前沿代码渲染音乐视频方案（参考 `mexicat/pdoom-video` 架构），通过编写确定性的数学函数与着色器，使 Web 动画的每一帧与音频时间轴、节拍网格及歌词字词严格对齐。

---

## 核心原则 (Core Tenets)

1. **实时优先，杜绝离线截图与重度压制**：
   - 严禁使用 Headless Chrome 运行多采样（samples > 1）的逐帧离线截图与 ffmpeg 拼合视频，避免导致用户主机严重卡顿。
   - 默认采用 Vite + Three.js 实时渲染方案，启动本地轻量 Web 开发服务器（如 `http://localhost:5173`），用户在浏览器中即可直接享受 60 FPS 的流畅视听交互。
2. **纯函数式与确定性驱动**：
   - 任何场景的画面状态必须是时间 `f.t` 或局部进度 `f.p` 的纯函数，避免使用依赖系统物理时间的非确定性逻辑。
3. **声画协同与节拍锚定**：
   - 所有转场与视觉高潮必须锚定在小节下拍（Downbeat）或重音打击点（Kick / Snare）。
   - 字词卡拉OK排版严格依据 `data/lyrics.json` 中的字词区间计算高亮。

---

## 目录结构规范

```text
motion-director-skill/
├── audio/                   # 音乐与旁白音频 (mp3/wav)
├── data/
│   ├── audio.json           # BPM、节拍网格 (beats/downbeats) 与包络特征
│   └── lyrics.json          # 逐行/逐词/音节的时间戳数据
├── app/
│   ├── index.html           # 播放器入口页面
│   ├── src/
│   │   ├── engine/          # 核心引擎 (音频驱动、WebGL、后处理、字体排版)
│   │   ├── scenes/          # 各视觉镜头模块 (*.ts)
│   │   ├── timeline.ts      # 镜头剪辑与时间轴路由
│   │   └── main.ts          # 交互播放器控制逻辑
│   └── package.json
└── scripts/
    └── generate_audio.py    # 音频合成与特征提取分析脚本
```

---

## 工作流与操作指南

### 1. 音乐与节拍数据准备
- 若用户提供新音乐或新主题，在 `scripts/` 中编写或调用音频生成/分析脚本。
- 输出 `audio/<name>.mp3`，并生成标准化结构：
  - `data/audio.json`：包含 `duration`, `bpm`, `beats`, `downbeats`, `sections` 及 100fps 的音频频段包络（`rms`, `low`, `mid`, `high`, `vocal`, `drums`, `bass`）。
  - `data/lyrics.json`：包含每句台词/歌词的 `start`, `end`, 及逐词 `words: [{ w, start, end, syl }]`。

### 2. 场景开发规范 (`app/src/scenes/<name>.ts`)
- 每个场景继承自 `Scene` 基类：
```typescript
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';

export default class CustomScene extends Scene {
  L = new Layer2D();
  bg = new FSPass(`
    uniform float t;
    void main() {
      // 编写定制 GLSL 动态背景
      fragColor = vec4(0.02, 0.03, 0.05, 1.0);
    }
  `, { t: { value: 0 } });

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio } = this.ctx;
    
    // 1. 渲染着色器背景
    this.bg.u.t!.value = f.t;
    this.bg.render(renderer, out);

    // 2. 使用 Canvas2D 绘制高精度动态排版与几何元素
    const c = this.L.ctx;
    this.L.clear();
    // ... 绘图逻辑 ...

    // 3. 合成图层
    comp.draw(renderer, this.L.upload(), out);

    // 4. 返回后处理覆写参数 (辉光、胶片颗粒、色散、微震等)
    return {
      bloom: 0.5,
      grain: 0.2,
      vignette: 0.3
    };
  }
}
```

### 3. 时间轴注册 (`app/src/timeline.ts`)
- 在 `makeTimeline` 中将镜头与音乐时间区间绑定：
```typescript
return [
  E('scene1', 'custom_scene1', 0.0, 4.0),
  E('scene2', 'custom_scene2', 4.0, 10.0),
  // ...
];
```

### 4. 预览与交付
- 执行启动命令（以后台守护进程形式启动）：
  ```bash
  cd app && bunx vite --port 5173 --host
  ```
- 提示用户直接访问：`http://localhost:5173`。
- 播放控制：
  - `Space`：播放 / 暂停
  - `← / →`：快退 / 快进 1 秒
  - `[ / ]`：上一镜头 / 下一镜头
  - `h`：隐藏/显示控制栏（全屏沉浸纯享）
