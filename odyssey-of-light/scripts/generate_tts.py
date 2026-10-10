import os
import json
import base64
import wave
import time
import urllib.request
import urllib.error
from pathlib import Path

work_dir = Path("odyssey-of-light")
audio_dir = work_dir / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)

screenplay = json.loads((work_dir / "screenplay.json").read_text())
key = os.environ.get("GEMINI_API_KEY")
if not key:
    raise SystemExit("GEMINI_API_KEY environment variable is missing.")

# Specific voice instructions for the 100-year-old elegant scholarly tone
SYSTEM_STYLE = (
    "请用一百年前民国初期中国文人、学者、大学堂格致导师的口吻朗读。"
    "语速缓慢舒缓、优雅从容、字正腔圆、余音悠长，充满哲思与对宇宙造化深邃奥秘的深情敬畏。"
    "半文半白，句读分明，吐字凝练。仅朗读下列正文，不读标题或任何附注：\n"
)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key={key}"

for act in screenplay:
    act_id = act["id"]
    dest_wav = audio_dir / f"{act_id}.wav"
    dest_mp3 = audio_dir / f"{act_id}.mp3"
    
    if dest_wav.exists() and dest_wav.stat().st_size > 1000:
        print(f"Skipping {act_id}, already exists ({dest_wav.stat().st_size} bytes).")
        continue

    print(f"Generating audio for [{act['title']}] ({act_id})...")
    payload = {
        "contents": [{
            "parts": [{"text": SYSTEM_STYLE + act["text"]}]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": "Charon"  # Mature, calm, resonance
                    }
                }
            }
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                res_data = json.load(resp)
                candidates = res_data.get("candidates", [])
                parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
                inline = next((p["inlineData"] for p in parts if "inlineData" in p), None)
                if not inline:
                    raise RuntimeError(f"No inline audio returned for {act_id}")
                
                audio_bytes = base64.b64decode(inline["data"])
                if audio_bytes[:4] == b"RIFF":
                    dest_wav.write_bytes(audio_bytes)
                else:
                    # Raw PCM 24kHz
                    with wave.open(str(dest_wav), "wb") as w:
                        w.setnchannels(1)
                        w.setsampwidth(2)
                        w.setframerate(24000)
                        w.writeframes(audio_bytes)
                
                print(f"✓ Saved {dest_wav} ({dest_wav.stat().st_size / 1024:.1f} KB)")
                break
        except urllib.error.HTTPError as err:
            err_msg = err.read().decode("utf-8")
            print(f"Attempt {attempt+1} failed with HTTP {err.code}: {err_msg}")
            if attempt < max_retries - 1:
                time.sleep(3)
            else:
                raise
        except Exception as ex:
            print(f"Attempt {attempt+1} error: {ex}")
            if attempt < max_retries - 1:
                time.sleep(3)
            else:
                raise

    time.sleep(1)

print("\nAll acts voiceover successfully synthesized via gemini-3.8-flash-tts!")
