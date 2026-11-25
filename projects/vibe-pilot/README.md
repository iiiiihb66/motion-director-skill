# 知识手记 · 第一轮换题复试

三个预览均可直接在浏览器打开，无服务依赖：

- [吸管为什么看起来折了](refraction.html)：43.80 秒，空间机制 → 光路解释；有 Puck 旁白。
- [冰箱怎样把热搬出去](refrigerator.html)：36.68 秒，四步循环 → 能量收支；有 Puck 旁白。
- [功率大，一定更费电吗](power-energy.html)：39.08 秒，概念对比 → 算例；有 Puck 旁白。三集均已完成声画装配。

已完成通用配音服务（Universal Voice Hub）解耦改造，支持接入 MiniMax 免费/付费配音额度，彻底解决单日配额耗尽与抽卡打磨受限问题：
- **多引擎支持**：支持 `minimax`（Speech-01-turbo/hd、Speech-02，青涩/精英/少女音色）、`gemini`（Gemini 3.8 Flash TTS）、`edge`（免凭证备用）。
- **段落级指纹缓存**：按正文、语气、音色和引擎严格计算 SHA-256，已确认的段落直接复用，微调单句只消耗单句额度。
- **凭证安全隔离**：MiniMax 凭证存放在 `~/.config/vibe-knowledge/minimax.env`（0600权限）或环境变量中，不写入项目与 Git。

```sh
# 1. 接入 MiniMax 额度（仅需配置一次）
python3 projects/vibe-pilot/voice.py --set-minimax <MINIMAX_API_KEY> [GROUP_ID]

# 2. 连通性测试与试听诊断
python3 projects/vibe-pilot/voice.py --check-minimax

# 3. 查看段落生成与复用计划（离线）
python3 projects/vibe-pilot/voice.py --plan --engine minimax

# 4. 生成声音并拼装时码（可针对特定单集或全部）
python3 projects/vibe-pilot/voice.py --episode power-energy --engine minimax --generate --assemble

# 5. 重构页面与运行时
node projects/vibe-pilot/build.mjs
node projects/vibe-pilot/verify.mjs
```

配音凭证只读继承环境，不写入网页。WAV 片段按内容指纹保存，已有确认作品未覆盖。音轨按实际时长拼接并作本地响度处理，没有压缩语速凑时长。轻音乐只是 WebAudio 合成试听，可关闭；没有固定为账号配乐，未单独制作混音成片。

事实与示意范围见 [facts.md](facts.md)，独立旁白审查见 `script-review.json`。浏览器检查覆盖多尺寸、各段中点、切点、字幕、离线请求、播放跳转与改稿静音；具体记录以 `qa-report.json` 为准。未进行听众主观自然度验收或 ASR 全文回读，第三条尚未完成声画审片。

没有生成视频。这是供用户审阅的 SOP 试做，不代表已经跨主题验证成熟或具备自动发布能力。
