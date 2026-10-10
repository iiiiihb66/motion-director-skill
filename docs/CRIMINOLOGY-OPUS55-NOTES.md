# 犯罪学｜3D 宣传片

成品：`assets/criminology-opus55.html`，42 秒、七幕、21 个镜头、16:9，约 3.1 MB。Three.js、配乐和旁白均嵌入单个 HTML，可直接用支持 WebGL 的现代浏览器离线播放。

## 作者与模型

本次 3D 场景原稿实际由本机 Claude Code 2.1.289 生成，请求模型为 `claude-opus-5-5`，完成结果的 modelUsage 也记录该名称。连接使用用户配置的本机网关；这是调用记录所报告的模型，不能独立验证网关上游。调用禁用所有工具，只发送本次新写的原创创作说明，没有发送既有项目代码或素材。

Claude 编写 3D 场景原稿；Codex 调整镜头、场景构图、材质、可重复渲染和字幕，并完成播放器、音频制作、打包与浏览器验收。原创提示词保存在 `docs/CRIMINOLOGY-OPUS55-CINEMATIC-PROMPT.md`，原稿及模型元数据在 Git 忽略的 `out/opus55-cinematic/` 中。

## 画面与声音

七幕：档案峡谷穿行、指纹浮雕微距扫描、犯罪成因结构环绕、受害者缺席与修复、城市街道穿行及鸟瞰、机械天平校准、立体片名碎片汇聚。包含远景、中景、近景、特写及实际透视相机运动。

配乐由本项目代码原创合成，含鼓点、低音、旋律、上升音及转场冲击；中文男声由 Edge TTS 云服务根据本次原创七句文案生成。两条 MP3 均为 42 秒并嵌入 HTML。默认开启音乐和旁白，首次点击后启动音频；旁白期间音乐降低。音频时钟驱动画面，拖动后两轨在相同时间恢复。

内容为犯罪学的概念宣传，不包含真实案件或实证统计。控件支持播放、暂停、重播、独立音乐／旁白开关、静音、时间轴、章节、全屏与隐藏。空格播放，左右方向键跳转，方括号切章节，H 隐藏／恢复；表单控件保留原生键盘操作。

## 已验证

本机 Chrome 实测：21 镜头在随机跳转后相同时间的画布像素一致；两轨正确解码，分别单独播放时检测到声音，静音输出为零；暂停停止音源，拖动重新对齐音频时钟；章节、键盘、全屏、隐藏恢复、片尾及重播通过。390×844、844×390、1440×600 无横向溢出，控件不遮挡画布。无 JavaScript 异常，无外部资源请求。

验收报告：`out/opus55-cinematic/player-validation.json`，抽帧及场景信息在同目录。使用独立临时 Chrome，不访问用户浏览器资料。Safari／Firefox 未实测；播放需要 WebGL，性能取决于设备。

## 源文件

- `app/src/promo/crim-opus55-cinematic.js`：3D 场景与镜头。
- `app/src/promo/crim-opus55-player.js`：音频与播放器。
- `assets/criminology-opus55-cinematic-shell.html`：单文件模板。
- `scripts/build_crim_opus55_audio.py`：原创配乐与旁白制作。
- `scripts/build_crim_opus55_cinematic.mjs`：HTML 打包。

Three.js MIT 许可证已嵌入成品。旧 2D 成品备份在 `out/opus55-cinematic/previous-2d.html`。
