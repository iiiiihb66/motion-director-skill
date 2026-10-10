import subprocess
from pathlib import Path

# Build 15.00s unified narration track
# Cut points:
# S1: start 0.15s
# S2: start 2.95s
# S3: start 5.95s
# S4: start 8.95s
# S5: start 12.00s

cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi", "-t", "15.0", "-i", "anullsrc=r=44100:cl=stereo",
    "-i", "audio/crim-voice-15s/s1_intro.mp3",
    "-i", "audio/crim-voice-15s/s2_uv.mp3",
    "-i", "audio/crim-voice-15s/s3_path.mp3",
    "-i", "audio/crim-voice-15s/s4_locard.mp3",
    "-i", "audio/crim-voice-15s/s5_title_short.mp3",
    "-filter_complex",
    "[1:a]adelay=150|150[a1];"
    "[2:a]adelay=2950|2950[a2];"
    "[3:a]adelay=5950|5950[a3];"
    "[4:a]adelay=8950|8950[a4];"
    "[5:a]adelay=12000|12000[a5];"
    "[0:a][a1][a2][a3][a4][a5]amix=inputs=6:duration=first:dropout_transition=0,volume=1.8[outa]",
    "-map", "[outa]",
    "-t", "15.0",
    "-b:a", "192k",
    "audio/criminology-15s-narration.mp3"
]
subprocess.run(cmd, check=True)
print("Created audio/criminology-15s-narration.mp3")

# Now create the 15.00s score from Scott Buckley's Signal to Noise (audio/criminology-score.mp3)
# We take the most energetic 15 seconds (e.g. from 4.0s to 19.0s or 0.0s to 15.0s with clean fade out at 14.5s)
cmd_score = [
    "ffmpeg", "-y",
    "-i", "audio/criminology-score.mp3",
    "-t", "15.0",
    "-filter_complex",
    "[0:a]afade=t=in:ss=0:d=0.3,afade=t=out:st=14.2:d=0.8,volume=1.0[outm]",
    "-map", "[outm]",
    "-b:a", "192k",
    "audio/criminology-15s-score.mp3"
]
subprocess.run(cmd_score, check=True)
print("Created audio/criminology-15s-score.mp3")
