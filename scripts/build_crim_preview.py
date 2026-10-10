from pathlib import Path
import base64
root=Path.cwd()
main=(root/"app/src/promo/crim-player.js").read_text()
prev=(root/'assets/getabg-promo.html').read_text();shell=prev[:prev.index('<body>')]
shell=shell.replace('ABG · Review the decision','犯罪学 · 079').replace('#c8f36b','#ff3d55').replace('#8ddab2','#92e9ff').replace('#101310','#080c10').replace('#111411','#080c10').replace('#d5ff7399','#ff3d5599')
shell+='''<body>
<div class="reel"><canvas id="depth" aria-hidden="true"></canvas><canvas id="screen" width="1080" height="1920" aria-label="犯罪学竖屏动画"></canvas></div>
<aside class="controls">
<div><h1>犯罪学 / CASE 079</h1><p>34 秒 · 9:16 · 七个镜头。微软男声旁白与电影配乐均已内嵌，可离线打开。文字与主要信息在中央安全区，背景铺满画面。</p></div>
<button id="toggle">▶　播放</button>
<div class="row music"><button id="music" aria-pressed="true">♪　音乐：开</button><label for="volume">音量</label><input id="volume" type="range" min="0" max="100" value="55" aria-label="背景音乐音量"></div>
<div class="row music"><button id="voice" aria-pressed="true">旁白：开</button><label for="voice-volume">音量</label><input id="voice-volume" type="range" min="0" max="100" value="100" aria-label="旁白音量"></div>
<input id="seek" type="range" min="0" max="34" step="0.01" value="0" aria-label="播放位置">
<div class="clock"><span id="now">00:00</span><span>00:34</span></div>
<div class="row"><button data-jump="0">现场</button><button data-jump="1">显影</button><button data-jump="2">弹道</button></div>
<div class="row"><button data-jump="3">交换</button><button data-jump="4">侧写</button><button data-jump="5">片名</button><button data-jump="6">归档</button></div>
<div class="row"><button id="safe">显示安全区</button><button id="fullscreen">⛶ 全屏录屏</button></div>
<div class="tip"><p>空格 播放 / 暂停 · ← → 跳转 · [ ] 上下镜头 · H 隐藏控制栏</p><p class="tiny">微软云健男声 · 旁白期间音乐自动降低。音乐：Signal to Noise — Scott Buckley，CC BY 4.0（节选、淡入淡出）。发布视频时请在简介中保留署名。 <a href="https://www.scottbuckley.com.au/library/signal-to-noise/" target="_blank" rel="noopener" style="color:inherit">音乐来源</a></p></div><p id="status" role="status"></p>
</aside>
'''
a=base64.b64encode((root/'audio/criminology-score.mp3').read_bytes()).decode()
shell+='<audio id="soundtrack" src="data:audio/mpeg;base64,'+a+'" preload="auto" hidden></audio>\n'
v=base64.b64encode((root/'audio/criminology-narration.mp3').read_bytes()).decode()
shell+='<audio id="narration-track" src="data:audio/mpeg;base64,'+v+'" preload="auto" hidden></audio>\n'
license=(root/'LICENSE').read_text()+'\n'+(root/'app/node_modules/three/LICENSE').read_text()
shell+='<!-- Bundled source licenses:\n'+license.replace('--','—')+'\n-->\n'
shell+='<script>'+Path('/private/tmp/crim-motion-bundle.js').read_text()+'</script>\n<script>'+main+'</script>\n</body></html>'
(root/'assets/criminology-preview.html').write_text(shell)
print('HTML bytes:',len(shell.encode()))
