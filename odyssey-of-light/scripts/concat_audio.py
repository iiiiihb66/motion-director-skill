import subprocess
from pathlib import Path

work_dir = Path("odyssey-of-light").resolve()
audio_dir = work_dir / "audio"

concat_list = audio_dir / "concat_list.txt"
lines = [f"file '{(audio_dir / f'act{i}_{name}.mp3').resolve()}'" for i, name in enumerate([
    "prologue", "newton", "young_poisson", "maxwell", "photoelectric", "duality", "epilogue"
])]
concat_list.write_text("\n".join(lines))

out_narration = audio_dir / "odyssey_narration_full.mp3"
subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
    "-i", str(concat_list),
    "-c", "copy",
    str(out_narration)
], check=True)
print(f"Created unified narration track: {out_narration}")
