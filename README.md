# 动态解说工作台

日常只打开 [index.html](index.html)。按选题管理制作状态、已有版本和你的判断。

当前生产目标是稳定制作「Vibe 知识大赏」：逐步固定美感、声音和字幕标准，按主题调整讲法与节奏，先在 Web 中审片和修改，再按需导出视频。具体约定见 [Web 优先制作工作流](docs/VIBE-KNOWLEDGE-WORKFLOW.md)；现有风格与作品用于换题复试，整套 SOP 尚待验证。

- 一个题目一张卡，HTML、MP4、配音或风格变体放进同一题目的版本列表。
- 从“待你审阅”选择已有成果；决定继续做就移到“制作中”，满意的移到“定稿与参考”，历史试验移到“历史归档”。
- 3D / 2D 在页面内筛选。旧的 `projects.html`、`3d.html`、`format-lab/index.html` 自动进入同一个工作台。
- 可以记录新选题、登记仓库内的新生成文件、选择主版本、写下一步；登记文件不会自动制作视频。
- 整理结果保存在当前浏览器。请点“备份整理结果”下载 JSON；换浏览器后用“恢复备份”。这不是自动同步到磁盘的系统。

[管理规划与审查记录](docs/WORKSPACE-PLAN.md) 解释现在如何整理、哪些已修、哪些待你审。
项目目录的基础数据在 [management/catalog.js](management/catalog.js)；审计证据在 [management/audit-evidence.json](management/audit-evidence.json)。

现有源工程、素材、成片和棱镜确认版仍在原目录。文件路径存在不代表已完成实际播放验收；源码入口需要开发服务时，工作台会明确提示。

P(doom) 原制作说明和署名保存在 [docs/PDOOM-VIDEO.md](docs/PDOOM-VIDEO.md)。代码许可见 [LICENSE](LICENSE)，各项目音频、字体和第三方素材遵循各自许可。

此前补齐当前仓库和同级 `opus-video-workbench`，收录了 32 项、131 个版本；项目详情可筛选原素材、声音、逐镜视频与源文件。缺素材的原稿明确保留为待补。详见 [恢复记录](docs/RECOVERED-WORKS.md)。

第一轮 Vibe 换题复试已在统一工作台置顶：吸管折射、冰箱循环、功率与电量。当前共 35 项、134 个版本；前两条有实际旁白，第三条因当日免费配额不足暂缺旁白，等待 Web 审阅。
