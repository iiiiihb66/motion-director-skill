import os, json, base64, wave, urllib.request

key = os.environ.get("GEMINI_API_KEY")
if not key:
    raise SystemExit("Missing GEMINI_API_KEY")

# 30-second crisp, elegant Republican scholar script
# Exactly 5 sentences, structured for 30s motion beats
text = (
    "混沌初开。先贤借一孔暗室，始窥光行之直。"
    "牛顿剖分七彩，断言光是微粒，称霸物理百载！"
    "双缝干涉，光加光竟得黑暗；泊松亮斑，阴影中奇迹绽放！"
    "麦克斯韦奏响电磁，爱因斯坦唤醒光量子！"
    "它非凡俗水波，亦非世间弹珠——它是光，造化至深的量子交响！"
)

# Note: In Gemini TTS, the prompt instructions should be passed carefully
# or style can be specified, but we must instruct: "请仅朗读以下文本，切勿朗读任何提示语"
# Better yet, let's test if passing just the text with systemInstruction or clean style prompt works!
style = "请以一百年前民国学堂大师典雅沉郁、字正腔圆的国语朗读。慢速而充满张力，各句停顿半秒。仅朗读正文：\n"

body = {
    "contents": [{"parts": [{"text": style + text}]}],
    "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {
            "voiceConfig": {
                "prebuiltVoiceConfig": {
                    "voiceName": "Charon"
                }
            }
        }
    }
}

req = urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key={key}",
    data=json.dumps(body).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req, timeout=30) as r:
    res = json.load(r)
    parts = res.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    inline = next((x["inlineData"] for x in parts if "inlineData" in x), None)
    if inline:
        b = base64.b64decode(inline["data"])
        out = "odyssey-of-light/audio/light_30s_test.wav"
        if b[:4] == b"RIFF":
            open(out, "wb").write(b)
        else:
            with wave.open(out, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(24000)
                w.writeframes(b)
        print("Generated:", out)
