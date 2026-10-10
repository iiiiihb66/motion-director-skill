import base64
from pathlib import Path

root = Path(__file__).resolve().parent.parent

# Read bundled JS
bundle_3d = Path("/private/tmp/crim-15s-bundle.js").read_text()
player_2d = (root / "app/src/promo/crim-15s-player.js").read_text()

# Base64 encode the 15-second audio tracks
score_b64 = base64.b64encode((root / "audio/criminology-15s-score.mp3").read_bytes()).decode()
narr_b64 = base64.b64encode((root / "audio/criminology-15s-narration.mp3").read_bytes()).decode()

html_content = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#080c10">
<title>犯罪学 · 15秒自媒体竖屏宣传片 (9:16)</title>
<style>
:root {{
  color-scheme: dark;
  --bg: #06090e;
  --panel: #0d1219;
  --panel2: #141b24;
  --edge: #232d3a;
  --white: #f1f0e5;
  --muted: #8b9baa;
  --red: #ff3d55;
  --red-hover: #ff5e72;
  --cyan: #92e9ff;
  --safe-green: #00ffaa;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--white);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
}}
body {{
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: center;
  gap: 24px;
  padding: 24px;
  min-height: 100svh;
}}

/* 9:16 Vertical Video Reel Frame */
.reel-wrapper {{
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}}
.reel {{
  height: min(92svh, 960px, calc((100vw - 380px) * 16 / 9));
  aspect-ratio: 9 / 16;
  max-width: none;
  background: #080c10;
  border: 1px solid var(--edge);
  overflow: hidden;
  position: relative;
  border-radius: 14px;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 61, 85, 0.15);
}}
.reel canvas {{
  width: 100%;
  height: 100%;
  display: block;
}}
.reel #depth {{
  position: absolute;
  inset: 0;
  z-index: 0;
}}
.reel #screen {{
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}}

/* Control Sidebar */
.controls {{
  width: min(100%, 320px);
  margin-right: max(0px, calc((100vw - 1280px) / 2));
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(13, 18, 25, 0.95);
  border: 1px solid var(--edge);
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: blur(16px);
}}
.controls h1 {{
  font-size: 19px;
  letter-spacing: .03em;
  display: flex;
  align-items: center;
  gap: 8px;
}}
.tag-15s {{
  font-size: 11px;
  padding: 2px 7px;
  background: rgba(255, 61, 85, 0.2);
  color: var(--red);
  border: 1px solid rgba(255, 61, 85, 0.4);
  border-radius: 4px;
  font-weight: 700;
}}
.controls p {{
  font-size: 12px;
  color: var(--muted);
  line-height: 1.55;
  margin-top: 4px;
}}
.badge-row {{
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 4px 0;
}}
.badge {{
  font-size: 11px;
  background: var(--panel2);
  color: var(--muted);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--edge);
}}
.badge.safe {{
  color: var(--safe-green);
  border-color: rgba(0, 255, 170, 0.3);
  background: rgba(0, 255, 170, 0.08);
}}

/* Buttons & Inputs */
.row {{
  display: flex;
  gap: 8px;
}}
button {{
  cursor: pointer;
  background: var(--panel2);
  color: var(--white);
  border: 1px solid var(--edge);
  padding: 9px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  transition: all .2s;
}}
button:hover {{
  border-color: var(--red);
  color: #fff;
}}
button.active {{
  background: var(--red);
  color: #fff;
  border-color: var(--red);
}}
#toggle {{
  background: linear-gradient(135deg, var(--red), var(--red-hover));
  color: #fff;
  border: none;
  font-size: 15px;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 18px rgba(255, 61, 85, 0.35);
}}
#toggle:hover {{
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(255, 61, 85, 0.5);
}}
input[type=range] {{
  width: 100%;
  accent-color: var(--red);
  cursor: pointer;
}}
.music-row {{
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel2);
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--edge);
}}
.music-row label {{
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}}
.music-row button {{
  padding: 4px 8px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--edge);
}}
.clock {{
  font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
}}
.scene-btns {{
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}}
.scene-btns button {{
  padding: 7px 2px;
  font-size: 11px;
  text-align: center;
}}
.tool-btns button {{
  flex: 1;
  padding: 9px 8px;
}}
#safe {{
  border-color: rgba(0, 255, 170, 0.5);
  color: var(--safe-green);
}}
#safe:hover {{
  background: rgba(0, 255, 170, 0.15);
}}
.tip {{
  border-top: 1px solid var(--edge);
  padding-top: 10px;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}}
.status-msg {{
  font-size: 11px;
  color: var(--red);
  min-height: 16px;
}}

/* Responsive Layout */
@media (max-width: 800px) {{
  body {{
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
    justify-content: center;
  }}
  .reel {{
    height: min(72svh, 680px);
  }}
  .controls {{
    width: 100%;
    margin: 0;
    padding: 12px;
  }}
  .controls p, .tip {{ display: none; }}
}}

/* Clean / Immersive Recording Mode */
body.clean {{
  display: block;
  padding: 0;
  background: #000;
}}
.clean .reel-wrapper {{
  width: 100vw;
  height: 100vh;
}}
.clean .reel {{
  position: absolute;
  height: min(100svh, 177.78vw);
  width: min(100vw, 56.25svh);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}}
.clean .controls {{
  display: none;
}}
</style>
</head>
<body>

<div class="reel-wrapper">
  <div class="reel">
    <canvas id="depth" aria-hidden="true"></canvas>
    <canvas id="screen" width="1080" height="1920" aria-label="犯罪学15秒竖屏动画"></canvas>
  </div>
</div>

<aside class="controls">
  <div>
    <h1>犯罪学 <span class="tag-15s">15s 宣发</span></h1>
    <div class="badge-row">
      <span class="badge">9:16 竖屏</span>
      <span class="badge safe">自媒体安全区适配</span>
      <span class="badge">双音轨闪避</span>
    </div>
    <p>专为抖音/视频号/快手/小红书打造的 15 秒短视频宣传片。微软云健男声旁白 + 电影配乐已完整内嵌（离线即播）。关键文案与视觉元素严格收束在平台安全视区内。</p>
  </div>

  <button id="toggle">▶　播放</button>

  <div class="music-row">
    <button id="music" aria-pressed="true">♪ 音乐：开</button>
    <label for="volume">音量</label>
    <input id="volume" type="range" min="0" max="100" value="65" aria-label="配乐音量">
  </div>

  <div class="music-row">
    <button id="voice" aria-pressed="true">🎙 旁白：开</button>
    <label for="voice-volume">音量</label>
    <input id="voice-volume" type="range" min="0" max="100" value="100" aria-label="旁白音量">
  </div>

  <input id="seek" type="range" min="0" max="15" step="0.01" value="0" aria-label="播放进度">
  <div class="clock">
    <span id="now">00:00</span>
    <span>00:15</span>
  </div>

  <div class="scene-btns">
    <button data-jump="0">01 警戒</button>
    <button data-jump="1">02 显影</button>
    <button data-jump="2">03 弹道</button>
    <button data-jump="3">04 交换</button>
    <button data-jump="4">05 片名</button>
  </div>

  <div class="row tool-btns">
    <button id="safe">📐 显示安全区</button>
    <button id="fullscreen">⛶ 沉浸录屏模式</button>
  </div>

  <div class="tip">
    <p><b>快捷键：</b>空格 播放/暂停 · ← → 快退进 · S 安全区参考线 · H 沉浸全屏模式 · [ ] 上下镜头</p>
    <p style="margin-top:4px; opacity:0.8;">配乐：Signal to Noise — Scott Buckley (CC BY 4.0)，旁白说话期间背景音乐自动平滑下潜 -58%。</p>
  </div>

  <div id="status" class="status-msg"></div>
</aside>

<!-- Embedded Dual Audio Tracks (100% Offline, Zero-CORS) -->
<audio id="soundtrack" src="data:audio/mpeg;base64,{score_b64}" preload="auto" hidden></audio>
<audio id="narration-track" src="data:audio/mpeg;base64,{narr_b64}" preload="auto" hidden></audio>

<!-- 3D Three.js Engine Bundle -->
<script>
{bundle_3d}
</script>

<!-- 2D Kinetic Typography & Dual Audio Controller -->
<script>
{player_2d}
</script>

</body>
</html>
"""

# Write to assets/criminology-15s.html and criminology-15s.html
dest_assets = root / "assets/criminology-15s.html"
dest_root = root / "criminology-15s.html"

dest_assets.write_text(html_content, encoding="utf-8")
dest_root.write_text(html_content, encoding="utf-8")

print(f"✓ Successfully built: {dest_assets} ({len(html_content.encode()) / 1024:.1f} KB)")
print(f"✓ Successfully built: {dest_root}")
