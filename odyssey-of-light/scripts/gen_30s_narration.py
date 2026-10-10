import asyncio
from pathlib import Path
import edge_tts

# 5 clean lines for the 30-second showcase
CLIPS = [
    ("s1_pinhole", "混沌初开。两千年前，先贤借一孔暗室，始窥光行之直。"),
    ("s2_newton", "牛顿剖分七彩，断言光是微粒，称霸物理百载！"),
    ("s3_young_poisson", "双缝干涉，光加光竟得黑暗；泊松亮斑，阴影中奇迹绽放！"),
    ("s4_maxwell_einstein", "麦克斯韦奏响电磁交响，爱因斯坦唤醒光量子——微粒重生！"),
    ("s5_duality", "它非凡俗水波，亦非世间弹珠——它是光，造化至深的量子交响！")
]

async def main():
    out_dir = Path("odyssey-of-light/audio/30s")
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, text in CLIPS:
        dest = out_dir / f"{name}.mp3"
        print(f"Generating {name}...")
        # YunyangNeural is the famous authoritative, dignified Chinese scholarly tone
        # rate -4% gives that slow, elegant, deliberate pacing
        comm = edge_tts.Communicate(text, "zh-CN-YunyangNeural", rate="-4%", pitch="-2Hz")
        await comm.save(str(dest))
        print(f"Saved {dest}")

if __name__ == "__main__":
    asyncio.run(main())
