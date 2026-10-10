import base64
from pathlib import Path

root = Path(__file__).resolve().parent.parent

# Read bundled JS
bundle_3d = (root / "assets/motion-30s-bundle.js").read_text(encoding="utf-8")
player_2d = (root / "src/player-30s.js").read_text(encoding="utf-8")

# Base64 encode the 30-second audio tracks
score_b64 = base64.b64encode((root / "audio/light_odyssey_30s_score.mp3").read_bytes()).decode()
voice_b64 = base64.b64encode((root / "audio/light_odyssey_30s_voice.mp3").read_bytes()).decode()

html_content = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#05080f">
<title>光的历程 · 30秒动态图形作品集大作 (The Odyssey of Light · 30s Motion Reel)</title>
<style>
:root {{
  color-scheme: dark;
  --bg: #05080f;
  --panel: #0a101b;
  --panel2: #121c2d;
  --edge: #1c2b3f;
  --gold: #ffd15c;
  --amber: #ff9800;
  --cyan: #00e5ff;
  --ruby: #ff3d55;
  --violet: #b388ff;
  --white: #f4eedb;
  --muted: #7e91a4;
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

/* Main Showcase Card */
.showcase-container {{
  width: min(96vw, 1320px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}}

/* Header Bar */
header {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}}
.brand {{
  display: flex;
  align-items: center;
  gap: 12px;
}}
h1 {{
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .04em;
  color: var(--gold);
  font-family: "Songti SC", "PingFang SC", serif;
}}
.tag-reel {{
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(255, 209, 92, 0.15);
  color: var(--gold);
  border: 1px solid rgba(255, 209, 92, 0.4);
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: .05em;
}}
.badge-specs {{
  font-size: 11px;
  color: var(--muted);
  font-family: ui-monospace, Menlo, monospace;
}}

/* 16:9 Cinematic Video Frame */
.video-frame {{
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 14px;
  border: 1px solid var(--edge);
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 229, 255, 0.12);
}}
.video-frame canvas {{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}}
#depth {{ z-index: 1; }}
#screen {{ z-index: 2; pointer-events: none; }}

/* Controls Bar */
.controls-bar {{
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(10, 16, 27, 0.95);
  border: 1px solid var(--edge);
  padding: 10px 18px;
  border-radius: 12px;
  backdrop-filter: blur(16px);
}}
#btn-play {{
  cursor: pointer;
  background: linear-gradient(135deg, var(--gold), var(--amber));
  color: #05080f;
  border: none;
  font-size: 14px;
  padding: 9px 20px;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(255, 209, 92, 0.35);
  transition: transform .15s;
}}
#btn-play:hover {{ transform: scale(1.04); }}
.time {{
  font: 12px ui-monospace, Menlo, monospace;
  color: var(--muted);
  min-width: 90px;
}}
input[type=range] {{
  flex: 1;
  accent-color: var(--gold);
  cursor: pointer;
  height: 5px;
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
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: all .2s;
}}
.scene-pill:hover {{
  border-color: var(--gold);
  color: #fff;
}}
.scene-pill.active {{
  background: var(--gold);
  color: #05080f;
  border-color: var(--gold);
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
      <h1>光的历程 · 30秒动态视觉大作</h1>
      <span class="tag-reel">PORTFOLIO HERO REEL</span>
    </div>
    <div class="badge-specs">
      30.00S · 60FPS THREE.JS + WEBGL SHADER · 民国格致雅言 · 双音轨闪避
    </div>
  </header>

  <div class="video-frame">
    <canvas id="depth" width="1920" height="1080"></canvas>
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
    <button id="btn-clean" class="btn-tool">⛶ 纯净沉浸 (H)</button>
  </div>
</div>

<!-- Embedded Audio Tracks (Base64 Zero-CORS) -->
<audio id="audio-voice" src="data:audio/mpeg;base64,{voice_b64}" preload="auto" hidden></audio>
<audio id="audio-score" src="data:audio/mpeg;base64,{score_b64}" preload="auto" hidden></audio>

<!-- Bundled 3D Engine -->
<script>
{bundle_3d}
</script>

<!-- 2D Kinetic Typography Engine -->
<script>
{player_2d}
</script>

</body>
</html>
"""

# Output paths
dest_local = root / "odyssey-30s.html"
dest_project = root.parent / "odyssey-30s.html"

dest_local.write_text(html_content, encoding="utf-8")
dest_project.write_text(html_content, encoding="utf-8")

print(f"✓ Built: {dest_local} ({len(html_content.encode()) / 1024:.1f} KB)")
print(f"✓ Built: {dest_project}")
