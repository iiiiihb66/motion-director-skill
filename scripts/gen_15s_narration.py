import asyncio
from pathlib import Path
import edge_tts

# Concise, punchy 15s script: 5 cuts, exactly fitting a 15-second promo
CLIPS = [
    ("s1_intro", "现场警戒，物证封锁。"),
    ("s2_uv", "微量物证，激光显影。"),
    ("s3_path", "弹道轨迹，反推真相。"),
    ("s4_locard", "凡有接触，必留痕迹。"),
    ("s5_title", "这里是，犯罪学。让证据穿透沉默！")
]

async def main():
    out_dir = Path("audio/crim-voice-15s")
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, text in CLIPS:
        dest = out_dir / f"{name}.mp3"
        # +18% rate for suspenseful, tight commercial rhythm
        comm = edge_tts.Communicate(text, "zh-CN-YunjianNeural", rate="+18%", pitch="-3Hz")
        await comm.save(str(dest))
        print(f"Saved {dest}")

if __name__ == "__main__":
    asyncio.run(main())
