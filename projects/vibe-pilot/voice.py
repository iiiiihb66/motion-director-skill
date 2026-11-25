"""Segment-cached Narration Hub with Multi-Engine Support (MiniMax / Gemini / Edge).
Keys remain in the environment or ~/.config/vibe-knowledge/minimax.env.
--plan never calls the network.
--generate reuses identical segments and never retries an uncertain submission.
--assemble regenerates timing and a speech track locally.
"""
import argparse, base64, hashlib, io, json, os, re, subprocess, sys, tempfile, time, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FFMPEG = '/opt/homebrew/bin/ffmpeg' if Path('/opt/homebrew/bin/ffmpeg').exists() else 'ffmpeg'

# --- Configuration & Credentials ---

def get_minimax_config():
    key = os.environ.get('MINIMAX_API_KEY')
    group = os.environ.get('MINIMAX_GROUP_ID')
    base = os.environ.get('MINIMAX_BASE_URL') or 'https://api.minimax.cn/v1'
    config_paths = [
        Path.home() / '.config' / 'vibe-knowledge' / 'minimax.env',
        Path.home() / '.config' / 'minimax.env',
        ROOT / '.env.voice'
    ]
    for p in config_paths:
        if (not key or not group) and p.exists():
            for line in p.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if not line or line.startswith('#'): continue
                k, _, v = line.partition('=')
                k = k.strip()
                v = v.strip().strip('"\'')
                if k == 'MINIMAX_API_KEY' and not key: key = v
                elif k == 'MINIMAX_GROUP_ID' and not group: group = v
                elif k == 'MINIMAX_BASE_URL' and not base: base = v
    return key, group, base

def save_minimax_config(api_key, group_id=None, base_url=None):
    cfg_dir = Path.home() / '.config' / 'vibe-knowledge'
    cfg_dir.mkdir(parents=True, exist_ok=True)
    env_file = cfg_dir / 'minimax.env'
    lines = [f"MINIMAX_API_KEY={api_key.strip()}"]
    if group_id:
        lines.append(f"MINIMAX_GROUP_ID={group_id.strip()}")
    if base_url:
        lines.append(f"MINIMAX_BASE_URL={base_url.strip()}")
    env_file.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    os.chmod(env_file, 0o600)
    print(f"MiniMax configuration securely saved to {env_file}")

# --- Fingerprinting & Cache ---

def get_engine(voice):
    if voice.get('engine'): return voice['engine'].lower()
    model = voice.get('model', '').lower()
    if 'speech' in model or 'minimax' in model: return 'minimax'
    if 'neural' in voice.get('name', '').lower() or 'edge' in model: return 'edge'
    return 'gemini'

def fingerprint(voice, segment):
    engine = get_engine(voice)
    if engine == 'gemini':
        # Preserve exact backwards-compatible hash for existing Gemini caches
        d = {
            'model': voice.get('model', 'gemini-3.8-flash-tts'),
            'voice': voice.get('name', 'Puck'),
            'direction': voice.get('direction', ''),
            'text': segment['text'],
            'emphasis': segment.get('emphasis', '')
        }
    else:
        d = {
            'engine': engine,
            'model': voice.get('model', 'speech-2.8-hd' if engine == 'minimax' else 'default'),
            'voice': voice.get('name', 'male-qn-qingse' if engine == 'minimax' else 'zh-CN-YunxiNeural'),
            'speed': voice.get('speed', 1.0),
            'text': segment['text'],
            'emphasis': segment.get('emphasis', '')
        }
    return hashlib.sha256(json.dumps(d, ensure_ascii=False, sort_keys=True).encode()).hexdigest()

def paths(voice, segment):
    stem = ROOT / 'audio' / f"{segment['id']}-{fingerprint(voice, segment)[:16]}"
    return stem.with_suffix('.wav'), stem.with_suffix('.json')

def reusable(voice, segment):
    wav, meta = paths(voice, segment)
    if not (wav.exists() and meta.exists()): return False
    try:
        m = json.loads(meta.read_text(encoding='utf-8'))
        with wave.open(str(wav)) as r:
            return m['fingerprint'] == fingerprint(voice, segment) and r.getnframes() == m['frames'] and r.getsampwidth() == 2 and r.getnchannels() == 1
    except (ValueError, KeyError, wave.Error):
        return False

# --- Normalization via FFmpeg ---

def normalize_to_wav(raw_bytes, input_format, target_wav):
    with tempfile.NamedTemporaryFile(suffix=f'.{input_format}', delete=False) as tmp_in:
        tmp_in.write(raw_bytes)
        tmp_in_path = tmp_in.name
    try:
        cmd = [
            FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
            '-i', tmp_in_path,
            '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse',
            '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le',
            str(target_wav)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FFmpeg audio normalization failed: {res.stderr}")
    finally:
        if os.path.exists(tmp_in_path):
            os.unlink(tmp_in_path)

# --- Engine Generators ---

def generate_gemini(voice, seg, wav, meta):
    key = os.environ.get('GEMINI_API_KEY')
    if not key: raise RuntimeError('GEMINI_API_KEY is not configured; no fallback called.')
    payload = {
        'model': voice.get('model', 'gemini-3.8-flash-tts'),
        'input': [{
            'type': 'user_input',
            'content': [{
                'type': 'text',
                'text': seg['text'],
                'annotations': [{'type': 'speech_metadata', 'style': (voice.get('direction', '') + ' ' + seg.get('emphasis', '')).strip()}]
            }]
        }],
        'response_format': {'type': 'audio', 'mime_type': 'audio/wav'},
        'generation_config': {'speech_config': [{'voice': voice.get('name', 'Puck')}]}
    }
    request = wav.with_suffix('.request.json')
    request.write_text(json.dumps(payload, ensure_ascii=False))
    config = '\n'.join([
        'url = "https://generativelanguage.googleapis.com/v1beta/interactions"',
        'request = "POST"',
        'header = "Content-Type: application/json"',
        'header = "x-goog-api-key: ' + key + '"',
        'data-binary = "@' + str(request) + '"',
        'max-time = 120',
        'silent',
        'show-error'
    ]) + '\n'
    submitted = wav.with_suffix('.pending')
    submitted.write_text('Submission may be billed; inspect outcome before retrying this segment.\n')
    response = subprocess.run(['curl', '--config', '-'], input=config, text=True, capture_output=True)
    if response.returncode: raise RuntimeError(f"{seg['id']}: transport failure {response.returncode}; outcome uncertain; no retry.")
    try: data = json.loads(response.stdout)
    except ValueError: raise RuntimeError(f"{seg['id']}: non-JSON response; outcome uncertain; no retry.")
    if 'error' in data:
        error = data['error']
        status = str(error.get('status', error.get('code', 'API_ERROR')))[:60] if isinstance(error, dict) else 'API_ERROR'
        message = (str(error.get('message', '')) if isinstance(error, dict) else str(error)).replace(key, '[redacted]')[:400]
        wav.with_suffix('.rejected.json').write_text(json.dumps({'status': status, 'message': message}, ensure_ascii=False, indent=2) + '\n')
        submitted.unlink(missing_ok=True)
        raise RuntimeError(f"{seg['id']}: Gemini rejected request: {status}: {message}; no automatic retry or fallback.")
    blocks = [part for step in data.get('steps', []) if step.get('type') == 'model_output' for part in step.get('content', []) if part.get('type') == 'audio' and part.get('data')]
    if not blocks and data.get('output_audio', {}).get('data'): blocks = [data['output_audio']]
    if not blocks: raise RuntimeError(f"{seg['id']}: no audio returned; inspect submission before retry.")
    raw = base64.b64decode(blocks[-1]['data'])
    normalize_to_wav(raw, 'wav', wav)
    with wave.open(str(wav)) as r:
        info = (r.getnchannels(), r.getsampwidth(), r.getframerate())
        frames = r.getnframes()
    meta.write_text(json.dumps({
        'fingerprint': fingerprint(voice, seg),
        'engine': 'gemini',
        'requestedModel': voice.get('model', 'gemini-3.8-flash-tts'),
        'responseModel': data.get('model'),
        'voice': voice.get('name', 'Puck'),
        'text': seg['text'],
        'frames': frames,
        'sampleRate': info[2],
        'duration': frames / info[2]
    }, ensure_ascii=False, indent=2) + '\n')
    submitted.unlink(missing_ok=True)
    print(seg['id'], 'generated via Gemini', round(frames / info[2], 3), 'seconds', flush=True)

def generate_minimax(voice, seg, wav, meta):
    key, group, base = get_minimax_config()
    if not key:
        raise RuntimeError("MINIMAX_API_KEY is not configured. Set env or run: python3 voice.py --set-minimax <KEY> [GROUP_ID]")
    
    url = f"{base}/t2a_v2"
    if group:
        url += f"?GroupId={group}"
        
    model = voice.get('model', 'speech-2.8-hd')
    voice_name = voice.get('name', 'male-qn-qingse')
    if voice_name == 'Puck':
        voice_name = 'male-qn-qingse'
    speed = float(voice.get('speed', 1.0))
    vol = float(voice.get('vol', 1.0))
    pitch = int(voice.get('pitch', 0))

    payload = {
        "model": model,
        "text": seg['text'],
        "stream": False,
        "voice_setting": {
            "voice_id": voice_name,
            "speed": speed,
            "vol": vol,
            "pitch": pitch
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1
        }
    }
    
    import urllib.request, urllib.error
    req = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp_body = resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f"MiniMax HTTP {e.code}: {err_msg}")
    except Exception as e:
        raise RuntimeError(f"MiniMax network failure: {e}")
        
    try:
        data = json.loads(resp_body)
    except ValueError:
        raise RuntimeError(f"MiniMax returned invalid JSON: {resp_body[:200]}")
        
    base_resp = data.get('base_resp', {})
    if base_resp.get('status_code', 0) != 0:
        code = base_resp.get('status_code')
        msg = base_resp.get('status_msg')
        raise RuntimeError(f"MiniMax API Error ({code}): {msg}")
        
    audio_str = data.get('data', {}).get('audio')
    if not audio_str:
        raise RuntimeError(f"No audio data in MiniMax response: {data}")
        
    try:
        raw_audio = bytes.fromhex(audio_str)
    except ValueError:
        raw_audio = base64.b64decode(audio_str)
        
    normalize_to_wav(raw_audio, 'mp3', wav)
    with wave.open(str(wav)) as r:
        info = (r.getnchannels(), r.getsampwidth(), r.getframerate())
        frames = r.getnframes()
        
    meta.write_text(json.dumps({
        'fingerprint': fingerprint(voice, seg),
        'engine': 'minimax',
        'requestedModel': model,
        'voice': voice_name,
        'text': seg['text'],
        'frames': frames,
        'sampleRate': info[2],
        'duration': frames / info[2]
    }, ensure_ascii=False, indent=2) + '\n')
    print(seg['id'], 'generated via MiniMax', round(frames / info[2], 3), 'seconds', flush=True)

def generate_edge(voice, seg, wav, meta):
    import asyncio, edge_tts
    voice_name = voice.get('name', 'zh-CN-YunxiNeural')
    if voice_name == 'Puck':
        voice_name = 'zh-CN-YunxiNeural'
    rate = voice.get('rate', '+0%')
    
    async def _synth():
        c = edge_tts.Communicate(seg['text'], voice_name, rate=rate)
        buf = bytearray()
        async for ch in c.stream():
            if ch["type"] == "audio":
                buf += ch["data"]
        return bytes(buf)
        
    raw_audio = asyncio.run(_synth())
    normalize_to_wav(raw_audio, 'mp3', wav)
    with wave.open(str(wav)) as r:
        info = (r.getnchannels(), r.getsampwidth(), r.getframerate())
        frames = r.getnframes()
        
    meta.write_text(json.dumps({
        'fingerprint': fingerprint(voice, seg),
        'engine': 'edge',
        'requestedModel': 'edge-tts',
        'voice': voice_name,
        'text': seg['text'],
        'frames': frames,
        'sampleRate': info[2],
        'duration': frames / info[2]
    }, ensure_ascii=False, indent=2) + '\n')
    print(seg['id'], 'generated via EdgeTTS', round(frames / info[2], 3), 'seconds', flush=True)

def generate(voice, seg, allow_fallback=True):
    wav, meta = paths(voice, seg)
    if reusable(voice, seg):
        print(seg['id'], 'reused', flush=True)
        return
    engine = get_engine(voice)
    if engine == 'gemini':
        try:
            generate_gemini(voice, seg, wav, meta)
        except Exception as e:
            if allow_fallback:
                print(f"[!] Gemini generation encountered issue ({e}). Seamlessly falling back to Edge-TTS...", file=sys.stderr)
                fallback_voice = {**voice, 'engine': 'edge', 'name': 'zh-CN-YunxiNeural'}
                generate_edge(fallback_voice, seg, wav, meta)
            else:
                raise
    elif engine == 'minimax':
        generate_minimax(voice, seg, wav, meta)
    elif engine == 'edge':
        generate_edge(voice, seg, wav, meta)
    else:
        raise RuntimeError(f"Unknown voice engine: {engine}")

# --- Staggered Assembly ---

def assemble(voice, ep):
    gap = .22; lead = .24; tail = .8; pcm = bytearray(); rate = None; clock = lead; segments = []
    ep_voice = {**voice, **ep.get('voice', {})}
    for seg in ep['segments']:
        if not reusable(ep_voice, seg):
            raise RuntimeError('Voice is missing/stale for ' + seg['id'] + '; run --plan before regeneration.')
        wav, meta = paths(ep_voice, seg)
        with wave.open(str(wav)) as r:
            if rate is None:
                rate = r.getframerate()
                pcm.extend(bytes(round(lead * rate) * 2))
            if rate != r.getframerate():
                raise RuntimeError(f"Sample rates differ for {seg['id']}: {r.getframerate()} vs {rate}")
            frames = r.getnframes()
            body = r.readframes(frames)
        duration = frames / rate
        segments.append({**seg, 'start': clock, 'end': clock + duration, 'audioFile': wav.name, 'voiceFingerprint': fingerprint(ep_voice, seg)})
        pcm.extend(body)
        pcm.extend(bytes(round(gap * rate) * 2))
        clock += duration + gap
    pcm.extend(bytes(round(tail * rate) * 2))
    output = ROOT / 'audio' / f"{ep['id']}-assembled.wav"
    with wave.open(str(output), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(pcm)
    final = ROOT / 'audio' / f"{ep['id']}.mp3"
    result = subprocess.run([
        FFMPEG, '-hide_banner', '-loglevel', 'info', '-y',
        '-i', str(output),
        '-af', 'loudnorm=I=-18:TP=-2:LRA=9:print_format=json',
        '-ar', str(rate), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '112k',
        str(final)
    ], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Local voice mastering failed: {result.stderr}")
    loudness = {}
    try:
        loudness = json.loads(re.search(r'\{[\s\S]*?\}', result.stderr).group())
    except (ValueError, AttributeError):
        pass
    return {
        **ep,
        'segments': segments,
        'duration': len(pcm) / (rate * 2),
        'audioStatus': 'generated-not-user-approved',
        'audioFile': 'audio/' + final.name,
        'loudness': loudness
    }

# --- CLI & Dispatcher ---

def check_minimax_connectivity():
    key, group, base = get_minimax_config()
    print("=== MiniMax Integration Diagnostics ===")
    print(f"Base URL: {base}")
    print(f"Group ID: {group or '(none/not configured)'}")
    print(f"API Key:  {'Configured (' + key[:6] + '...' + key[-4:] + ')' if key else 'MISSING'}")
    if not key:
        print("\n[!] MINIMAX_API_KEY is not set.")
        print("To configure, run:\n  python3 projects/vibe-pilot/voice.py --set-minimax <YOUR_API_KEY> [GROUP_ID]")
        return False
    print("\nTesting TTS synthesis on sample phrase ('折射让光线改变了方向')...")
    test_seg = {'id': 'TEST', 'text': '折射让光线改变了方向。'}
    test_voice = {'engine': 'minimax', 'model': 'speech-2.8-hd', 'name': 'male-qn-qingse'}
    test_wav = ROOT / 'audio' / 'test_minimax.wav'
    test_meta = ROOT / 'audio' / 'test_minimax.json'
    try:
        generate_minimax(test_voice, test_seg, test_wav, test_meta)
        print("✓ MiniMax synthesis SUCCESS! Audio generated and normalized cleanly.")
        if test_wav.exists(): test_wav.unlink()
        if test_meta.exists(): test_meta.unlink()
        return True
    except Exception as e:
        print(f"✗ MiniMax synthesis FAILED: {e}")
        return False

def main():
    p = argparse.ArgumentParser(description="Vibe Universal Voice Pipeline")
    p.add_argument('--plan', action='store_true', help='Inspect segment cache state without network')
    p.add_argument('--generate', action='store_true', help='Generate missing voice segments')
    p.add_argument('--assemble', action='store_true', help='Master audio and assemble timings.json')
    p.add_argument('--episode', help='Target specific episode ID')
    p.add_argument('--only', help='Target specific segment ID')
    p.add_argument('--allow-incomplete', action='store_true', help='Allow incomplete draft timing')
    p.add_argument('--engine', choices=['minimax', 'gemini', 'edge'], help='Override TTS engine')
    p.add_argument('--voice-name', help='Override voice persona name')
    p.add_argument('--model', help='Override model name')
    p.add_argument('--set-minimax', nargs='+', metavar=('KEY', '[GROUP]'), help='Save MiniMax API credentials')
    p.add_argument('--check-minimax', action='store_true', help='Verify MiniMax credentials and connectivity')
    args = p.parse_args()

    if args.set_minimax:
        key = args.set_minimax[0]
        group = args.set_minimax[1] if len(args.set_minimax) > 1 else None
        save_minimax_config(key, group)
        check_minimax_connectivity()
        return

    if args.check_minimax:
        check_minimax_connectivity()
        return

    plan = json.loads((ROOT / 'episodes.json').read_text(encoding='utf-8'))
    root_voice = dict(plan.get('voice', {}))
    base_voice = dict(root_voice)
    if args.engine: base_voice['engine'] = args.engine
    if args.voice_name: base_voice['name'] = args.voice_name
    if args.model: base_voice['model'] = args.model

    episodes = [e for e in plan['episodes'] if not args.episode or e['id'] == args.episode]
    if not episodes: raise RuntimeError('Unknown episode')

    if args.plan:
        out_plan = []
        for ep in episodes:
            ep_voice = {**base_voice, **ep.get('voice', {})}
            out_plan.append({
                'episode': ep['id'],
                'engine': get_engine(ep_voice),
                'voice': ep_voice.get('name'),
                'segments': [
                    {
                        'id': s['id'],
                        'action': 'reuse' if reusable(ep_voice, s) else 'generate',
                        'fingerprint': fingerprint(ep_voice, s)[:16]
                    }
                    for s in ep['segments'] if not args.only or s['id'] == args.only
                ]
            })
        print(json.dumps(out_plan, ensure_ascii=False, indent=2))

    if args.generate:
        for ep in episodes:
            ep_voice = {**base_voice, **ep.get('voice', {})}
            engine = get_engine(ep_voice)
            for seg in ep['segments']:
                if args.only and seg['id'] != args.only: continue
                was_cached = reusable(ep_voice, seg)
                generate(ep_voice, seg)
                if not was_cached:
                    sleep_time = 1.0 if engine == 'minimax' else (0.5 if engine == 'edge' else 16.0)
                    time.sleep(sleep_time)

    if args.assemble:
        assembled = []
        for ep in plan['episodes']:
            use_override = (not args.episode) or (ep['id'] == args.episode)
            ep_voice = {**(base_voice if use_override else root_voice), **ep.get('voice', {})}
            if all(reusable(ep_voice, s) for s in ep['segments']):
                assembled.append(assemble(base_voice if use_override else root_voice, ep))
            elif args.allow_incomplete:
                clock = .24; segments = []
                for seg in ep['segments']:
                    duration = len(seg['text']) / 4.3
                    segments.append({**seg, 'start': clock, 'end': clock + duration})
                    clock += duration + .22
                assembled.append({
                    **ep,
                    'segments': segments,
                    'duration': clock + .8,
                    'audioStatus': 'not-generated-quota',
                    'audioBlocker': 'Voice segments not yet generated'
                })
            else:
                raise RuntimeError('Voice incomplete for ' + ep['id'])
        result = {'schemaVersion': 1, 'voice': root_voice, 'episodes': assembled}
        (ROOT / 'timings.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        print('Assembled', [(ep['id'], round(ep['duration'], 2)) for ep in result['episodes']], flush=True)

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
