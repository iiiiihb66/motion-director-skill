import json
import subprocess
from pathlib import Path

work_dir = Path("odyssey-of-light")
audio_dir = work_dir / "audio"

screenplay = json.loads((work_dir / "screenplay.json").read_text())

# Convert ambient score
score_wav = audio_dir / "ambient_light_score.wav"
score_mp3 = audio_dir / "ambient_light_score.mp3"
if score_wav.exists() and not score_mp3.exists():
    subprocess.run(["ffmpeg", "-y", "-i", str(score_wav), "-b:a", "128k", str(score_mp3)], check=True)
    print(f"Compressed ambient score to {score_mp3}")

# Process each act
total_offset = 0.0
timing_data = []

for act in screenplay:
    act_id = act["id"]
    wav_path = audio_dir / f"{act_id}.wav"
    mp3_path = audio_dir / f"{act_id}.mp3"
    
    if not wav_path.exists():
        print(f"Waiting for {wav_path}...")
        continue

    if not mp3_path.exists():
        subprocess.run(["ffmpeg", "-y", "-i", str(wav_path), "-b:a", "96k", str(mp3_path)], check=True)
        print(f"Compressed {act_id} to {mp3_path}")
    
    # Get exact duration via ffprobe
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(mp3_path)],
        capture_output=True, text=True, check=True
    )
    duration = float(res.stdout.strip())
    
    act_info = {
        **act,
        "duration": round(duration, 3),
        "start": round(total_offset, 3),
        "end": round(total_offset + duration, 3),
        "mp3_size": mp3_path.stat().st_size
    }
    timing_data.append(act_info)
    total_offset += duration

(work_dir / "acts_timing.json").write_text(json.dumps(timing_data, ensure_ascii=False, indent=2))
print(f"\nTotal video timeline duration: {total_offset:.2f}s ({total_offset/60:.2f} min)")
print(f"Saved {work_dir / 'acts_timing.json'} with {len(timing_data)} acts.")
