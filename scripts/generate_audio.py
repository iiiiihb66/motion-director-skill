#!/usr/bin/env python3
"""
Multi-project Unified Audio Generator for Motion Director Skill.
Supports:
  - criminology (《犯罪学》MV)
  - abg (αβΓ✻1 期权平台宣传片)
"""

import sys
import os
import shutil

from generate_criminology_audio import generate_audio as gen_crim
from generate_abg_audio import generate_abg_audio as gen_abg

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    print(f"=== Generating Multi-Project Audio Assets (Target: {target}) ===")

    os.makedirs("data/criminology", exist_ok=True)
    os.makedirs("data/abg", exist_ok=True)

    if target in ["criminology", "crim", "all"]:
        print("\n--- Generating Criminology Audio Assets ---")
        gen_crim()
        # Copy output to data/criminology/
        shutil.copy("data/audio.json", "data/criminology/audio.json")
        shutil.copy("data/lyrics.json", "data/criminology/lyrics.json")
        # Ensure criminology.mp3 is preserved and not overwritten by shared audio.mp3
        if os.path.exists("audio/criminology-score.mp3") and os.path.exists("audio/criminology-narration.mp3"):
            # Mix official high-fidelity Edge TTS voice with cinematic score
            import subprocess
            cmd = [
                "ffmpeg", "-y",
                "-i", "audio/criminology-score.mp3",
                "-i", "audio/criminology-narration.mp3",
                "-filter_complex", "[0:a]volume=0.55[music]; [music][1:a]sidechaincompress=threshold=0.04:ratio=3:attack=15:release=250[ducked]; [ducked][1:a]amix=inputs=2:duration=first:normalize=0[mixed]; [mixed]alimiter=limit=0.95[out]",
                "-map", "[out]", "-b:a", "320k", "audio/criminology.mp3"
            ]
            subprocess.run(cmd, check=True)


    if target in ["abg", "all"]:
        print("\n--- Generating ABG One Audio Assets ---")
        gen_abg()
        # Copy output to data/abg/
        shutil.copy("data/audio.json", "data/abg/audio.json")
        shutil.copy("data/lyrics.json", "data/abg/lyrics.json")
        if os.path.exists("audio/audio.mp3"):
            shutil.copy("audio/audio.mp3", "audio/abg.mp3")

    print("\n=== Multi-Project Audio Generation Complete! ===")

if __name__ == "__main__":
    main()
