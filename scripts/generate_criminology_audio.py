#!/usr/bin/env python3
"""
Generate the full music track, audio analysis (data/audio.json) and lyrics (data/lyrics.json)
for 《犯罪学》(CRIMINOLOGY).
"""

import math
import struct
import wave
import subprocess
import json
import os

SAMPLE_RATE = 44100
BPM = 120.0
BEAT_DUR = 60.0 / BPM  # 0.5s
TOTAL_BARS = 17
TOTAL_DUR = TOTAL_BARS * 4 * BEAT_DUR  # 34.0 seconds
TOTAL_SAMPLES = int(TOTAL_DUR * SAMPLE_RATE)

def generate_audio():
    print(f"Generating Criminology audio: {TOTAL_DUR:.1f}s at {BPM} BPM...")
    
    # Generate vocal lines with macOS say
    vocal_cues = [
        # (tag, start_time, text, words)
        (
            "intro",
            0.5,
            "案件编号零七九。现场警戒，物证封锁。",
            [
                ("案件编号", 0.50, 1.30),
                ("零七九", 1.30, 2.10),
                ("现场警戒", 2.30, 3.10),
                ("物证封锁", 3.10, 4.00),
            ]
        ),
        (
            "verse1",
            4.4,
            "在紫外光下，微量物证正在苏醒。",
            [
                ("在紫外光下", 4.40, 5.60),
                ("微量物证", 5.70, 6.70),
                ("正在苏醒", 6.80, 7.80),
            ]
        ),
        (
            "verse2",
            8.2,
            "指纹回路，弹道膛线，血液喷溅的抛物线。",
            [
                ("指纹回路", 8.20, 9.30),
                ("弹道膛线", 9.40, 10.40),
                ("血液喷溅", 10.50, 11.50),
                ("抛物线", 11.50, 12.30),
            ]
        ),
        (
            "locard",
            12.5,
            "洛卡德物质交换定律：凡走过，必留下痕迹。",
            [
                ("洛卡德", 12.50, 13.30),
                ("物质交换定律", 13.30, 14.60),
                ("凡走过", 14.80, 15.60),
                ("必留下痕迹", 15.60, 16.70),
            ]
        ),
        (
            "profiling",
            17.0,
            "行为侧写，动机解构，尸体在冷光中供述。",
            [
                ("行为侧写", 17.00, 18.00),
                ("动机解构", 18.10, 19.10),
                ("尸体", 19.30, 19.90),
                ("在冷光中供述", 19.90, 21.10),
            ]
        ),
        (
            "climax",
            21.5,
            "无声的证据，拼凑出罪恶的轮廓。",
            [
                ("无声的证据", 21.50, 22.80),
                ("拼凑出", 22.90, 23.50),
                ("罪恶的轮廓", 23.50, 24.50),
            ]
        ),
        (
            "title",
            24.8,
            "这里是——犯罪学。",
            [
                ("这里是", 24.80, 25.50),
                ("犯罪学", 25.60, 26.80),
            ]
        ),
        (
            "outro",
            28.2,
            "真相永不泯灭。结案，归档。",
            [
                ("真相", 28.20, 28.80),
                ("永不泯灭", 28.80, 29.80),
                ("结案", 30.00, 30.70),
                ("归档", 30.80, 31.80),
            ]
        )
    ]
    
    os.makedirs("/tmp/crim_audio", exist_ok=True)
    vocal_files = []
    for tag, start_t, text, _ in vocal_cues:
        aiff = f"/tmp/crim_audio/{tag}.aiff"
        wav = f"/tmp/crim_audio/{tag}.wav"
        subprocess.run(["say", "-v", "Tingting", "-r", "180", "-o", aiff, text], check=True)
        # Apply forensic radio EQ and subtle compressor
        filter_str = "highpass=f=250,lowpass=f=4500,volume=1.4,aecho=0.8:0.5:25:0.25"
        subprocess.run(["ffmpeg", "-y", "-i", aiff, "-af", filter_str, "-ar", str(SAMPLE_RATE), "-ac", "1", wav], stderr=subprocess.DEVNULL, check=True)
        vocal_files.append((tag, start_t, wav))
    
    # Synthesize the instrumental track
    inst_left = [0.0] * TOTAL_SAMPLES
    inst_right = [0.0] * TOTAL_SAMPLES
    drums_track = [0.0] * TOTAL_SAMPLES
    bass_track = [0.0] * TOTAL_SAMPLES
    
    # 1. Metronome / Forensic ticking (every 8th note, i.e. 0.25s)
    tick_interval = int(0.25 * SAMPLE_RATE)
    for i in range(0, TOTAL_SAMPLES, tick_interval):
        t = i / SAMPLE_RATE
        # Decay click
        vol = 0.15 if (i // tick_interval) % 2 == 0 else 0.08
        if t < 4.0: vol *= 1.5 # clearer in intro
        for s in range(min(int(0.02 * SAMPLE_RATE), TOTAL_SAMPLES - i)):
            decay = math.exp(-s / (0.003 * SAMPLE_RATE))
            val = vol * decay * math.sin(2 * math.pi * 3200 * (s / SAMPLE_RATE))
            inst_left[i + s] += val
            inst_right[i + s] += val
    
    # 2. Kick Drum (Starts at bar 2 = 4.0s, hits on beat 1, 3 and syncopations)
    # At bar 12 (24.0s - drop), double-time kick
    kick_times = []
    for bar in range(2, TOTAL_BARS):
        bar_start = bar * 2.0
        if bar in [10, 11]:  # Pre-drop tension, kick on every beat
            kick_times.extend([bar_start + 0.0, bar_start + 0.5, bar_start + 1.0, bar_start + 1.5])
        elif bar >= 12 and bar < 14:  # Climax drop! heavy kicks
            kick_times.extend([bar_start + 0.0, bar_start + 0.5, bar_start + 1.0, bar_start + 1.25, bar_start + 1.5])
        elif bar >= 14:  # Outro
            kick_times.extend([bar_start + 0.0, bar_start + 1.0])
        else:  # Standard groove
            kick_times.extend([bar_start + 0.0, bar_start + 1.0, bar_start + 1.75])
            
    for kt in kick_times:
        idx = int(kt * SAMPLE_RATE)
        if idx >= TOTAL_SAMPLES: continue
        kick_len = int(0.35 * SAMPLE_RATE)
        for s in range(min(kick_len, TOTAL_SAMPLES - idx)):
            tau = s / SAMPLE_RATE
            # Pitch drop from 160Hz to 42Hz
            freq = 42.0 + 118.0 * math.exp(-tau / 0.04)
            phase = 2 * math.pi * (42.0 * tau - 118.0 * 0.04 * (math.exp(-tau / 0.04) - 1.0))
            env = math.exp(-tau / 0.12)
            val = 0.85 * env * math.sin(phase)
            # soft saturation
            val = math.tanh(val * 1.4) * 0.75
            inst_left[idx + s] += val
            inst_right[idx + s] += val
            drums_track[idx + s] += val
            
    # 3. Snare / Rimshot (On beats 2 and 4, starting at bar 2)
    snare_times = []
    for bar in range(2, TOTAL_BARS - 1):
        bar_start = bar * 2.0
        snare_times.extend([bar_start + 0.5, bar_start + 1.5])
        if bar in [9, 11]: # snare rolls before drop
            snare_times.extend([bar_start + 1.75])
            
    import random
    rng = random.Random(42)
    for st in snare_times:
        idx = int(st * SAMPLE_RATE)
        if idx >= TOTAL_SAMPLES: continue
        snare_len = int(0.25 * SAMPLE_RATE)
        for s in range(min(snare_len, TOTAL_SAMPLES - idx)):
            tau = s / SAMPLE_RATE
            noise = (rng.random() * 2.0 - 1.0) * math.exp(-tau / 0.07)
            body = math.sin(2 * math.pi * 185.0 * tau) * math.exp(-tau / 0.05)
            val = (0.5 * noise + 0.4 * body) * 0.65
            inst_left[idx + s] += val * 0.95
            inst_right[idx + s] += val * 1.05
            drums_track[idx + s] += val
            
    # 4. Hi-Hats (16th notes: 0.125s, starting at bar 2)
    hat_interval = int(0.125 * SAMPLE_RATE)
    for i in range(int(4.0 * SAMPLE_RATE), int(30.0 * SAMPLE_RATE), hat_interval):
        hat_len = int(0.04 * SAMPLE_RATE)
        accent = 0.28 if (i // hat_interval) % 4 == 2 else 0.14
        for s in range(min(hat_len, TOTAL_SAMPLES - i)):
            tau = s / SAMPLE_RATE
            noise = (rng.random() * 2.0 - 1.0) * math.exp(-tau / 0.015)
            val = noise * accent
            inst_left[i + s] += val * 0.8
            inst_right[i + s] += val * 1.2
            drums_track[i + s] += val
            
    # 5. Bassline (Dark D-Minor Sub & Reese Synth)
    # Chords/Roots: Bar 2-3: D2, Bar 4-5: F2 -> G2, Bar 6-7: Bb1 -> A1, Bar 8-9: D2, Bar 10-11: Eb2 -> D2, Bar 12-14 (Drop): D1 -> F1 -> G1 -> D1
    notes_d_min = {
        'D1': 36.71, 'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'Bb1': 58.27,
        'C2': 65.41, 'D2': 73.42, 'Eb2': 77.78, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00
    }
    
    bass_chords = [
        (4.0, 8.0, 'D2'),
        (8.0, 10.0, 'F2'),
        (10.0, 12.0, 'G2'),
        (12.0, 14.0, 'Bb1'),
        (14.0, 16.0, 'A1'),
        (16.0, 20.0, 'D2'),
        (20.0, 22.0, 'Eb2'),
        (22.0, 24.0, 'A1'),
        (24.0, 26.0, 'D1'), # DROP!
        (26.0, 28.0, 'F1'),
        (28.0, 32.0, 'D2'),
        (32.0, 34.0, 'D1')
    ]
    
    for t_start, t_end, note in bass_chords:
        idx0 = int(t_start * SAMPLE_RATE)
        idx1 = min(int(t_end * SAMPLE_RATE), TOTAL_SAMPLES)
        freq = notes_d_min[note]
        for s in range(idx1 - idx0):
            tau = s / SAMPLE_RATE
            total_dur = t_end - t_start
            fade_in = min(1.0, tau / 0.05)
            fade_out = min(1.0, (total_dur - tau) / 0.08)
            env = fade_in * fade_out
            # Reese detuned dual saw + sub sine
            sub = math.sin(2 * math.pi * freq * tau) * 0.5
            saw1 = (2.0 * ((tau * (freq * 1.004)) % 1.0) - 1.0) * 0.25
            saw2 = (2.0 * ((tau * (freq * 0.996)) % 1.0) - 1.0) * 0.25
            val = (sub + saw1 + saw2) * env * 0.75
            inst_left[idx0 + s] += val
            inst_right[idx0 + s] += val
            bass_track[idx0 + s] += val
            
    # 6. Eerie minor synth drone & tension pads
    pad_harmonics = [146.83, 220.0, 261.63, 349.23] # D3, A3, C4, F4
    for i in range(TOTAL_SAMPLES):
        tau = i / SAMPLE_RATE
        val = 0.0
        # slow filter sweep LFO
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.15 * tau)
        for h in pad_harmonics:
            val += math.sin(2 * math.pi * h * tau) * 0.04
        val *= lfo
        # Fade in over first 2s, fade out at end
        env = min(1.0, tau / 2.0) * min(1.0, (TOTAL_DUR - tau) / 3.0)
        inst_left[i] += val * env
        inst_right[i] += val * env
        
    # Write intermediate instrumental WAV
    raw_inst_wav = "/tmp/crim_audio/inst.wav"
    with wave.open(raw_inst_wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        data = bytearray()
        for i in range(TOTAL_SAMPLES):
            # Clamp to -1..1
            l = max(-1.0, min(1.0, inst_left[i]))
            r = max(-1.0, min(1.0, inst_right[i]))
            data.extend(struct.pack('<hh', int(l * 31000), int(r * 31000)))
        w.writeframes(data)
        
    # Combine instrumental with all vocal tracks at their exact timestamps using ffmpeg
    inputs = ["-i", raw_inst_wav]
    filter_parts = ["[0:a]volume=0.9[a0]"]
    mix_inputs = ["[a0]"]
    
    for idx, (tag, start_t, wav) in enumerate(vocal_files, start=1):
        inputs.extend(["-i", wav])
        delay_ms = int(start_t * 1000)
        filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.4[v{idx}]")
        mix_inputs.append(f"[v{idx}]")
        
    filter_complex = ";".join(filter_parts) + ";" + "".join(mix_inputs) + f"amix=inputs={len(mix_inputs)}:normalize=0,volume=1.3[out]"
    
    out_mp3 = "audio/criminology.mp3"
    out_wav = "audio/criminology.wav"
    os.makedirs("audio", exist_ok=True)
    
    cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_complex, "-map", "[out]", "-ar", "44100", "-ac", "2", out_wav]
    subprocess.run(cmd, check=True)
    
    subprocess.run(["ffmpeg", "-y", "-i", out_wav, "-b:a", "320k", out_mp3], check=True)
    # Also overwrite pdoom.mp3 for preview player compatibility
    subprocess.run(["ffmpeg", "-y", "-i", out_wav, "-b:a", "320k", "audio/pdoom.mp3"], check=True)
    print("Audio generated successfully at audio/criminology.mp3 and audio/pdoom.mp3!")
    
    # 7. Generate data/audio.json and data/lyrics.json
    print("Generating timing analysis and lyrics data...")
    generate_analysis(out_wav, vocal_cues)

def generate_analysis(audio_wav, vocal_cues):
    # Read synthesized audio frames to compute 100fps envelopes
    with wave.open(audio_wav, 'rb') as w:
        nframes = w.getnframes()
        channels = w.getnchannels()
        raw = w.readframes(nframes)
        samples = struct.unpack(f'<{nframes * channels}h', raw)
        
    # mono float
    mono = []
    for i in range(0, len(samples), channels):
        mono.append(samples[i] / 32768.0)
        
    fps = 100
    total_frames = int(TOTAL_DUR * fps)
    hop = SAMPLE_RATE // fps
    
    rms_arr = []
    low_arr = []
    mid_arr = []
    high_arr = []
    vocal_arr = [0.0] * total_frames
    drums_arr = [0.0] * total_frames
    bass_arr = [0.0] * total_frames
    other_arr = [0.0] * total_frames
    
    for f in range(total_frames):
        s0 = f * hop
        s1 = min(s0 + hop, len(mono))
        chunk = mono[s0:s1]
        if not chunk:
            rms_arr.append(0.0)
            low_arr.append(0.0)
            mid_arr.append(0.0)
            high_arr.append(0.0)
            continue
        sum_sq = sum(x * x for x in chunk)
        rms = math.sqrt(sum_sq / len(chunk))
        rms_arr.append(round(min(1.0, rms * 2.5), 4))
        
        t = f / fps
        # Bass envelope
        if 4.0 <= t <= 32.0:
            bass_val = 0.6 if (t < 24.0) else 0.95
            bass_arr[f] = round(bass_val, 4)
        # Drums envelope (kicks/snares)
        bar_pos = (t % 2.0)
        if t >= 4.0 and (abs(bar_pos - 0.0) < 0.15 or abs(bar_pos - 1.0) < 0.15 or abs(bar_pos - 0.5) < 0.15 or abs(bar_pos - 1.5) < 0.15):
            drums_arr[f] = 0.85
        else:
            drums_arr[f] = 0.2 if t >= 4.0 else 0.05
            
        low_arr.append(round(drums_arr[f] * 0.8 + bass_arr[f] * 0.5, 4))
        mid_arr.append(round(rms * 1.5, 4))
        high_arr.append(round(drums_arr[f] * 0.4 + 0.1, 4))
        other_arr[f] = round(0.3 if t < 32.0 else 0.0, 4)

    # Vocal envelope from cues
    for _, start_t, _, words in vocal_cues:
        w_end = words[-1][2]
        f0 = int(start_t * fps)
        f1 = min(int(w_end * fps), total_frames)
        for f in range(f0, f1):
            vocal_arr[f] = 0.85
            
    # Beats and downbeats at 120 BPM (0.5s per beat, 2.0s per downbeat)
    beats = [round(i * 0.5, 4) for i in range(int(TOTAL_DUR / 0.5))]
    downbeats = [round(i * 2.0, 4) for i in range(int(TOTAL_DUR / 2.0))]
    
    sections = [
        {"name": "intro", "start": 0.0, "end": 4.0},
        {"name": "verse1", "start": 4.0, "end": 8.0},
        {"name": "ballistics", "start": 8.0, "end": 12.0},
        {"name": "locard", "start": 12.0, "end": 16.0},
        {"name": "profiling", "start": 16.0, "end": 20.0},
        {"name": "pre_drop", "start": 20.0, "end": 24.0},
        {"name": "climax", "start": 24.0, "end": 28.0},
        {"name": "archive", "start": 28.0, "end": 34.0}
    ]
    
    # Onsets: kick, snare, hat, vocal
    kick_onsets = [[round(b, 3), 1.0] for b in beats if (b >= 4.0 and (int(b * 2) % 2 == 0 or b >= 24.0))]
    snare_onsets = [[round(b, 3), 0.9] for b in beats if (b >= 4.0 and int(b * 2) % 4 == 1)]
    hat_onsets = [[round(i * 0.125, 3), 0.4] for i in range(int(4.0 / 0.125), int(30.0 / 0.125))]
    vocal_onsets = [[round(start_t, 3), 1.0] for _, start_t, _, _ in vocal_cues]
    
    audio_data = {
        "duration": TOTAL_DUR,
        "bpm": BPM,
        "beat_period": BEAT_DUR,
        "time_signature": 4,
        "beats": beats,
        "downbeats": downbeats,
        "sections": sections,
        "fps": fps,
        "rms": rms_arr,
        "low": low_arr,
        "mid": mid_arr,
        "high": high_arr,
        "vocal": vocal_arr,
        "drums": drums_arr,
        "bass": bass_arr,
        "other": other_arr,
        "onsets": {
            "kick": kick_onsets,
            "snare": snare_onsets,
            "hat": hat_onsets,
            "vocal": vocal_onsets
        },
        "notes": []
    }
    
    with open("data/audio.json", "w", encoding="utf-8") as f:
        json.dump(audio_data, f, indent=2)
    with open("data/audio.approx.json", "w", encoding="utf-8") as f:
        json.dump(audio_data, f, indent=2)
        
    # Lyrics JSON
    lines_data = []
    for idx, (tag, start_t, full_text, words) in enumerate(vocal_cues):
        w_list = []
        for w_text, ws, we in words:
            # Generate syllable timings for Chinese characters
            n_chars = len(w_text)
            char_dur = (we - ws) / max(1, n_chars)
            syl = [[round(ws + k * char_dur, 3), round(ws + (k + 1) * char_dur, 3)] for k in range(n_chars)]
            w_list.append({
                "w": w_text,
                "start": round(ws, 3),
                "end": round(we, 3),
                "conf": 1.0,
                "syl": syl
            })
        lines_data.append({
            "i": idx,
            "text": full_text,
            "start": round(start_t, 3),
            "end": round(words[-1][2], 3),
            "words": w_list
        })
        
    lyrics_data = {
        "duration": TOTAL_DUR,
        "lines": lines_data
    }
    
    with open("data/lyrics.json", "w", encoding="utf-8") as f:
        json.dump(lyrics_data, f, ensure_ascii=False, indent=2)
    with open("data/lyrics.approx.json", "w", encoding="utf-8") as f:
        json.dump(lyrics_data, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {len(lines_data)} lyric lines and {len(beats)} beats in data/lyrics.json and data/audio.json!")

if __name__ == '__main__':
    generate_audio()
