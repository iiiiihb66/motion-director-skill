import subprocess
from pathlib import Path

# Create a 30.00s hybrid score:
# Layer A: Scott Buckley's driving orchestral pulse (audio/criminology-score.mp3, first 30s with crescendo and clean fade)
# Layer B: Procedural crystalline ambient overtones (odyssey-of-light/audio/ambient_light_score.wav)
# This gives it both cinematic rhythm AND high-science ethereal light harmonics!

cmd = [
    "ffmpeg", "-y",
    "-i", "audio/criminology-score.mp3",
    "-i", "odyssey-of-light/audio/ambient_light_score.wav",
    "-filter_complex",
    "[0:a]atrim=0:30,asetpts=PTS-STARTPTS,afade=t=in:ss=0:d=0.5,afade=t=out:st=28.8:d=1.2,volume=0.85[a1];"
    "[1:a]atrim=0:30,asetpts=PTS-STARTPTS,afade=t=in:ss=0:d=1.0,afade=t=out:st=28.5:d=1.5,volume=0.6[a2];"
    "[a1][a2]amix=inputs=2:duration=first:dropout_transition=0,volume=1.1[outm]",
    "-map", "[outm]",
    "-t", "30.0",
    "-b:a", "192k",
    "odyssey-of-light/audio/light_odyssey_30s_score.mp3"
]
subprocess.run(cmd, check=True)
print("Created odyssey-of-light/audio/light_odyssey_30s_score.mp3")
