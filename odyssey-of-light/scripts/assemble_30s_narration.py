import subprocess
from pathlib import Path

work_dir = Path("odyssey-of-light")
audio_dir = work_dir / "audio/30s"

cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi", "-t", "30.0", "-i", "anullsrc=r=44100:cl=stereo",
    "-i", str(audio_dir / "s1_pinhole.mp3"),
    "-i", str(audio_dir / "s2_newton.mp3"),
    "-i", str(audio_dir / "s3_young_poisson.mp3"),
    "-i", str(audio_dir / "s4_maxwell_einstein.mp3"),
    "-i", str(audio_dir / "s5_duality.mp3"),
    "-filter_complex",
    "[1:a]adelay=100|100[a1];"
    "[2:a]adelay=6600|6600[a2];"
    "[3:a]adelay=11700|11700[a3];"
    "[4:a]adelay=17750|17750[a4];"
    "[5:a]adelay=23650|23650[a5];"
    "[0:a][a1][a2][a3][a4][a5]amix=inputs=6:duration=first:dropout_transition=0,volume=2.0[outa]",
    "-map", "[outa]",
    "-t", "30.0",
    "-b:a", "192k",
    "odyssey-of-light/audio/light_odyssey_30s_voice.mp3"
]
subprocess.run(cmd, check=True)
print("Created odyssey-of-light/audio/light_odyssey_30s_voice.mp3")
