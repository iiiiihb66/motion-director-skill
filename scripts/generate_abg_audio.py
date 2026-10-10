#!/usr/bin/env python3
"""
Quant Noir Audio Generator for αβΓ✻1 (ABG One).
Combines Dark Synthwave, Forensic EQ Vocals, Sub-Bass Hits & Beat Grid.
"""

import math
import struct
import wave
import subprocess
import json
import os
import random

SAMPLE_RATE = 44100
BPM = 120.0
BEAT_DUR = 60.0 / BPM  # 0.5s
TOTAL_BARS = 17
TOTAL_DUR = TOTAL_BARS * 4 * BEAT_DUR  # 34.0 seconds
TOTAL_SAMPLES = int(TOTAL_DUR * SAMPLE_RATE)

def generate_abg_audio():
    print(f"Generating Quant Noir ABG One audio track: {TOTAL_DUR:.1f}s at {BPM} BPM...")
    
    # Vocal cues: Forensic & Quant Deciphering Narrative
    vocal_cues = [
        (
            "intro",
            0.5,
            "市场无声，痕迹显影。阿尔法、贝塔、伽玛一，破解期权密码。",
            [
                ("市场无声", 0.50, 1.20),
                ("痕迹显影", 1.30, 2.00),
                ("阿尔法贝塔伽玛一", 2.10, 3.20),
                ("破解期权密码", 3.20, 4.20),
            ]
        ),
        (
            "payoff",
            4.5,
            "损益曲线实时模拟，铁鹰与价差组合，风险收益一目了然。",
            [
                ("损益曲线", 4.50, 5.50),
                ("实时模拟", 5.50, 6.30),
                ("铁鹰与价差组合", 6.40, 7.80),
                ("风险收益一目了然", 7.90, 9.40),
            ]
        ),
        (
            "greeks",
            10.0,
            "Delta 捕捉方向，Gamma 测量加速，Theta 掌控时间，Vega 预警波动。",
            [
                ("Delta捕捉方向", 10.00, 11.20),
                ("Gamma测量加速", 11.30, 12.50),
                ("Theta掌控时间", 12.60, 13.90),
                ("Vega预警波动", 14.00, 15.30),
            ]
        ),
        (
            "journal",
            15.8,
            "记录每一笔交易决策，深度归因复盘，提升实战胜率。",
            [
                ("记录交易决策", 15.80, 17.00),
                ("深度归因复盘", 17.10, 18.40),
                ("提升实战胜率", 18.50, 19.80),
            ]
        ),
        (
            "title",
            20.4,
            "αβΓ✻1，你的全能期权学习与实战工作台。",
            [
                ("阿尔法贝塔伽玛一", 20.40, 21.90),
                ("全能期权工作台", 22.00, 23.60),
            ]
        ),
        (
            "outro",
            24.2,
            "即刻访问 getabg.one，解锁专业期权视角。解密，归档。",
            [
                ("即刻访问", 24.20, 25.10),
                ("getabg.one", 25.10, 26.60),
                ("解锁专业期权视角", 26.70, 28.50),
                ("解密归档", 28.60, 30.50),
            ]
        )
    ]
    
    os.makedirs("/tmp/abg_audio", exist_ok=True)
    vocal_files = []
    for tag, start_t, text, _ in vocal_cues:
        aiff = f"/tmp/abg_audio/{tag}.aiff"
        wav = f"/tmp/abg_audio/{tag}.wav"
        subprocess.run(["say", "-v", "Tingting", "-r", "180", "-o", aiff, text], check=True)
        # Forensic Radio EQ filter
        filter_str = "highpass=f=250,lowpass=f=5500,volume=1.5,aecho=0.8:0.5:22:0.2"
        subprocess.run(["ffmpeg", "-y", "-i", aiff, "-af", filter_str, "-ar", str(SAMPLE_RATE), "-ac", "1", wav], stderr=subprocess.DEVNULL, check=True)
        vocal_files.append((tag, start_t, wav))
    
    # Synthesize Dark Synthesizer Instrumental
    inst_left = [0.0] * TOTAL_SAMPLES
    inst_right = [0.0] * TOTAL_SAMPLES
    drums_track = [0.0] * TOTAL_SAMPLES
    bass_track = [0.0] * TOTAL_SAMPLES
    
    # 1. Tech Ticking (every 8th note)
    tick_interval = int(0.25 * SAMPLE_RATE)
    for i in range(0, TOTAL_SAMPLES, tick_interval):
        t = i / SAMPLE_RATE
        vol = 0.14 if (i // tick_interval) % 2 == 0 else 0.07
        if t < 4.0: vol *= 1.5
        for s in range(min(int(0.018 * SAMPLE_RATE), TOTAL_SAMPLES - i)):
            decay = math.exp(-s / (0.003 * SAMPLE_RATE))
            val = vol * decay * math.sin(2 * math.pi * 3800 * (s / SAMPLE_RATE))
            inst_left[i + s] += val
            inst_right[i + s] += val
            
    # 2. Kick Drum
    kick_times = []
    for bar in range(2, TOTAL_BARS):
        bar_start = bar * 2.0
        if bar in [10, 11]:
            kick_times.extend([bar_start + 0.0, bar_start + 0.5, bar_start + 1.0, bar_start + 1.5])
        elif bar >= 12 and bar < 14:
            kick_times.extend([bar_start + 0.0, bar_start + 0.5, bar_start + 1.0, bar_start + 1.25, bar_start + 1.5])
        else:
            kick_times.extend([bar_start + 0.0, bar_start + 1.0, bar_start + 1.75])
            
    for kt in kick_times:
        idx = int(kt * SAMPLE_RATE)
        if idx >= TOTAL_SAMPLES: continue
        kick_len = int(0.35 * SAMPLE_RATE)
        for s in range(min(kick_len, TOTAL_SAMPLES - idx)):
            tau = s / SAMPLE_RATE
            freq = 42.0 + 120.0 * math.exp(-tau / 0.04)
            phase = 2 * math.pi * (42.0 * tau - 120.0 * 0.04 * (math.exp(-tau / 0.04) - 1.0))
            env = math.exp(-tau / 0.12)
            val = 0.85 * env * math.sin(phase)
            val = math.tanh(val * 1.5) * 0.75
            inst_left[idx + s] += val
            inst_right[idx + s] += val
            drums_track[idx + s] += val

    # 3. Snare / Rimshot
    snare_times = []
    for bar in range(2, TOTAL_BARS - 1):
        bar_start = bar * 2.0
        snare_times.extend([bar_start + 0.5, bar_start + 1.5])
        
    rng = random.Random(99)
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

    # 4. Dark Sub-Bass (D-Minor)
    notes_d_min = {'D1': 36.71, 'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'Bb1': 58.27, 'D2': 73.42}
    bass_chords = [
        (4.0, 8.0, 'D2'), (8.0, 12.0, 'F1'), (12.0, 16.0, 'G1'),
        (16.0, 20.0, 'D2'), (20.0, 24.0, 'D1'), (24.0, 34.0, 'D2')
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
            sub = math.sin(2 * math.pi * freq * tau) * 0.55
            saw1 = (2.0 * ((tau * (freq * 1.004)) % 1.0) - 1.0) * 0.25
            val = (sub + saw1) * env * 0.75
            inst_left[idx0 + s] += val
            inst_right[idx0 + s] += val
            bass_track[idx0 + s] += val

    # Mix Vocals
    final_left = list(inst_left)
    final_right = list(inst_right)
    vocal_track = [0.0] * TOTAL_SAMPLES
    
    for tag, start_t, wav_path in vocal_files:
        with wave.open(wav_path, 'rb') as wf:
            n_frames = wf.getnframes()
            data = wf.readframes(n_frames)
            samples = struct.unpack(f"<{n_frames}h", data)
            idx0 = int(start_t * SAMPLE_RATE)
            for i, s_val in enumerate(samples):
                if idx0 + i >= TOTAL_SAMPLES: break
                v_norm = (s_val / 32768.0) * 1.3
                final_left[idx0 + i] += v_norm
                final_right[idx0 + i] += v_norm
                vocal_track[idx0 + i] += v_norm

    wav_out = "/tmp/abg_full.wav"
    with wave.open(wav_out, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        
        max_amp = max(max(abs(x) for x in final_left), max(abs(x) for x in final_right), 1.0)
        scale = 0.92 / max_amp
        
        out_bytes = bytearray()
        for l, r in zip(final_left, final_right):
            sl = int(l * scale * 32767.0)
            sr = int(r * scale * 32767.0)
            sl = max(-32768, min(32767, sl))
            sr = max(-32768, min(32767, sr))
            out_bytes.extend(struct.pack("<hh", sl, sr))
        wf.writeframes(out_bytes)
        
    os.makedirs("audio", exist_ok=True)
    mp3_out = "audio/abg.mp3"
    subprocess.run(["ffmpeg", "-y", "-i", wav_out, "-b:a", "192k", mp3_out], stderr=subprocess.DEVNULL, check=True)
    subprocess.run(["cp", "audio/abg.mp3", "audio/audio.mp3"], check=True)
    print(f"Quant Noir Audio generated successfully: {mp3_out}")

    # Envelope & JSON
    win = int(SAMPLE_RATE / 100)
    num_frames = int(TOTAL_DUR * 100)
    rms, low, mid, high, vocal_env, drums_env, bass_env = [], [], [], [], [], [], []
    
    for f in range(num_frames):
        idx0 = f * win
        idx1 = min(idx0 + win, TOTAL_SAMPLES)
        if idx1 <= idx0:
            rms.append(0.0); low.append(0.0); mid.append(0.0); high.append(0.0)
            vocal_env.append(0.0); drums_env.append(0.0); bass_env.append(0.0)
            continue
            
        sum_sq = sum((final_left[i]**2 + final_right[i]**2)*0.5 for i in range(idx0, idx1))
        r = math.sqrt(sum_sq / (idx1 - idx0))
        rms.append(round(min(1.0, r * 1.5), 3))
        
        v_sum = sum(abs(vocal_track[i]) for i in range(idx0, idx1)) / (idx1 - idx0)
        d_sum = sum(abs(drums_track[i]) for i in range(idx0, idx1)) / (idx1 - idx0)
        b_sum = sum(abs(bass_track[i]) for i in range(idx0, idx1)) / (idx1 - idx0)
        
        vocal_env.append(round(min(1.0, v_sum * 1.8), 3))
        drums_env.append(round(min(1.0, d_sum * 1.6), 3))
        bass_env.append(round(min(1.0, b_sum * 1.6), 3))
        
        low.append(round(min(1.0, b_sum * 1.4 + d_sum * 0.8), 3))
        mid.append(round(min(1.0, v_sum * 1.2), 3))
        high.append(round(min(1.0, (r - b_sum - v_sum)*1.5), 3))

    beats = [round(b * BEAT_DUR, 3) for b in range(int(TOTAL_DUR / BEAT_DUR))]
    downbeats = [round(b * BEAT_DUR * 4, 3) for b in range(int(TOTAL_DUR / (BEAT_DUR * 4)))]

    audio_json = {
        "duration": TOTAL_DUR,
        "bpm": BPM,
        "beats": beats,
        "downbeats": downbeats,
        "sections": [
            {"id": "intro", "start": 0.0, "end": 4.5},
            {"id": "payoff", "start": 4.5, "end": 10.0},
            {"id": "greeks", "start": 10.0, "end": 15.8},
            {"id": "journal", "start": 15.8, "end": 20.4},
            {"id": "title", "start": 20.4, "end": 24.2},
            {"id": "outro", "start": 24.2, "end": TOTAL_DUR}
        ],
        "envelope": {
            "fps": 100,
            "rms": rms,
            "low": low,
            "mid": mid,
            "high": high,
            "vocal": vocal_env,
            "drums": drums_env,
            "bass": bass_env
        }
    }
    
    os.makedirs("data/abg", exist_ok=True)
    with open("data/abg/audio.json", "w", encoding="utf-8") as f:
        json.dump(audio_json, f, indent=2, ensure_ascii=False)
    with open("data/audio.json", "w", encoding="utf-8") as f:
        json.dump(audio_json, f, indent=2, ensure_ascii=False)

    lyrics_lines = []
    for i, (tag, start_t, text, words_def) in enumerate(vocal_cues):
        w_list = []
        for w_text, w_start, w_end in words_def:
            n_chars = len(w_text)
            dur = (w_end - w_start) / max(1, n_chars)
            syl = [[round(w_start + k*dur, 3), round(w_start + (k+1)*dur, 3)] for k in range(n_chars)]
            w_list.append({
                "w": w_text,
                "start": w_start,
                "end": w_end,
                "conf": 1.0,
                "syl": syl
            })
        end_t = words_def[-1][2]
        lyrics_lines.append({
            "i": i,
            "text": text,
            "start": start_t,
            "end": end_t,
            "words": w_list
        })
        
    lyrics_json = {
        "duration": TOTAL_DUR,
        "lines": lyrics_lines
    }
    
    with open("data/abg/lyrics.json", "w", encoding="utf-8") as f:
        json.dump(lyrics_json, f, indent=2, ensure_ascii=False)
    with open("data/lyrics.json", "w", encoding="utf-8") as f:
        json.dump(lyrics_json, f, indent=2, ensure_ascii=False)
        
    print("Quant Noir audio analysis and lyrics written successfully!")

if __name__ == "__main__":
    generate_abg_audio()
