import numpy as np
import wave
import struct
from pathlib import Path

# Generate a 10-minute looping sublime philosophical ambient score:
# Features:
# 1. Warm low cello/drone fundamentals (C2 = 65.4Hz, G2 = 98Hz, C3 = 130.8Hz)
# 2. Singing bowl / Tibetan crystal overtone resonance with gentle binaural beating (1.5Hz theta waves)
# 3. Delicate celeste / glass harmonica crystal arpeggios that shimmer like light dispersion
# 4. Filtered oceanic pink noise drift (stellar ether)

sr = 44100
dur = 120.0  # 2-minute seamless atmospheric cycle
t = np.linspace(0, dur, int(sr * dur), endpoint=False)

# Fundamental drone chords (C minor / mystic Lydian: C - G - D - E - G)
freqs = [65.41, 98.0, 130.81, 196.0, 261.63, 392.0, 523.25]
drone = np.zeros_like(t)

for i, f in enumerate(freqs):
    # Gentle amplitude modulation (slow breathing rate 0.08Hz ~ 12s per breath)
    amp_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t + i * 0.7)
    detune = 0.3 * np.sin(2 * np.pi * 0.1 * t + i)
    weight = 1.0 / (1.0 + i * 0.6)
    drone += weight * amp_lfo * np.sin(2 * np.pi * (f + detune) * t)

# Shimmering crystal bells (Pythagorean harmonics)
shimmer = np.zeros_like(t)
bell_notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]

# Spawn periodic soft chime hits
np.random.seed(42)
num_chimes = 45
for _ in range(num_chimes):
    hit_time = np.random.uniform(2.0, dur - 4.0)
    note = np.random.choice(bell_notes)
    hit_idx = int(hit_time * sr)
    decay_dur = np.random.uniform(4.0, 9.0)
    decay_len = int(decay_dur * sr)
    if hit_idx + decay_len > len(t):
        decay_len = len(t) - hit_idx
    
    t_hit = np.linspace(0, decay_dur, decay_len, endpoint=False)
    envelope = np.exp(-t_hit / 2.2) * (1.0 - np.exp(-t_hit * 30))  # soft strike
    harmonic = np.sin(2 * np.pi * note * t_hit) + 0.4 * np.sin(2 * np.pi * note * 2.756 * t_hit) * np.exp(-t_hit / 1.2)
    shimmer[hit_idx:hit_idx + decay_len] += 0.25 * envelope * harmonic

# Soft pink noise / cosmic wash
noise = np.random.normal(0, 0.02, len(t))
# Simple low-pass filter via moving average
window = 500
noise = np.convolve(noise, np.ones(window)/window, mode='same')
noise_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.03 * t)
wash = noise * noise_lfo * 0.6

# Mix together
master = 0.35 * drone / np.max(np.abs(drone)) + 0.28 * shimmer + 0.15 * wash
# Soft normalize
master = master / np.max(np.abs(master) + 1e-5) * 0.72

# Fade in and fade out for seamless loop
fade_len = int(4.0 * sr)
fade_in = np.linspace(0, 1, fade_len)
fade_out = np.linspace(1, 0, fade_len)
master[:fade_len] *= fade_in
master[-fade_len:] *= fade_out

# Convert to 16-bit stereo PCM
master_16 = (master * 32767).astype(np.int16)

dest_wav = Path("odyssey-of-light/audio/ambient_light_score.wav")
with wave.open(str(dest_wav), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(master_16.tobytes())

print(f"Generated procedural ambient score: {dest_wav} ({dur}s)")
