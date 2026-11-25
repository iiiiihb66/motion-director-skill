# 本轮事实清单与示意范围

核查日期：2026-11-15。`episodes.json` 的每段 `facts` 对应下列资料 ID；本项目旁白为原创编排，未复制教材段落。

| ID | 支持的讲解内容 | 原始资料 |
| --- | --- | --- |
| O1 | 折射角相对法线测量；从水斜射入空气时偏离法线 | [OpenStax · University Physics 3, 1.3 Refraction](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction) |
| O2 | 水面上方观察斜插的直杆，水下部分形成较浅的虚像；视深随视角变化 | [OpenStax · 2.3 Apparent depth](https://openstax.org/books/university-physics-volume-3/pages/2-3-images-formed-by-refraction) |
| E1 | 常见蒸气压缩制冷系统中蒸发器、压缩机、冷凝器和节流装置的作用 | [美国能源部 · 技术支持文件，制冷系统部件](https://www.energy.gov/sites/default/files/2022-01/mref-pa-tsd.pdf) |
| W1 | W/kW 表示功率，Wh/kWh 表示累计能量；恒功率下用能量由功率乘时间计算 | [美国 EIA · Measuring electricity](https://www.eia.gov/energyexplained/electricity/measuring-electricity.php) |

光学画面仅跟踪穿过自由水面的光，省略杯壁。实线箭头指向眼睛，虚线为出射光的反向延长。`math.mjs` 用 Snell 关系求界面交点，再用相邻视线求局部虚像；没有把近法线的 3/4 比例套到所有视角。3D 画面是光学情景示意，非完整流体与玻璃光线追踪。

冰箱图是部件与热流示意。压缩机接收气态制冷剂，蒸发器吸热，冷凝器放热且凝结。片尾收支在稳定循环、忽略储能变化时成立；颜色、管路长度和颗粒运动不代表真实尺寸或分子运动。

用电图使用原创恒功率算例：2 kW × 3/60 h = 0.10 kWh；0.10 kW × 2 h = 0.20 kWh。柱图均使用同一条 0～0.20 kWh 电量标尺；没有用不同时间尺度的功率面积直接比较。实际家电可能间歇运行或改变功率。
