"""Generate narration only after owner confirms this key uses an unbilled free-tier project.
Usage: python3 scripts/gemini_crim_voice.py --confirmed-free-tier
No keys are printed or written to generated HTML. No paid-model fallback.
"""
import os,json,base64,wave,urllib.request,urllib.error,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--confirmed-free-tier',action='store_true');args=p.parse_args()
if not args.confirmed_free_tier:raise SystemExit('Free-tier project confirmation required.')
key=os.environ.get('GEMINI_API_KEY')
if not key:raise SystemExit('GEMINI_API_KEY is not configured.')
text='案件编号，零七九。现场警戒，物证封锁。\n紫外光下，微量物证，正在显影。\n指纹回路，弹道膛线。沿着痕迹，重建轨迹。\n洛卡德，物质交换定律。每一次接触，都留下痕迹。\n行为侧写，动机解构。无声的证据，拼出事件的轮廓。\n这里是，犯罪学。\n真相，永不泯灭。结案，归档。'
style='请用普通话为犯罪学纪录片预告配音。成熟、低沉、冷静、克制的男性叙述者；清晰自然，不要机器人腔，不要电台滤镜，不要喊叫。语速稍快，全文约三十秒，各段之间停顿半秒。仅朗读下列正文，不读说明、不增加内容：\n'
body={'contents':[{'parts':[{'text':style+text}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':'Charon'}}}}}
req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':key})
try:
 with urllib.request.urlopen(req,timeout=90) as r:result=json.load(r)
except urllib.error.HTTPError as e:
 try:message=json.loads(e.read()).get('error',{}).get('message','API failed')
 except Exception:message='API failed'
 raise SystemExit(f'Gemini HTTP {e.code}: {message}; no fallback was called.')
parts=result.get('candidates',[{}])[0].get('content',{}).get('parts',[])
inline=next((x['inlineData'] for x in parts if 'inlineData' in x),None)
if not inline:raise SystemExit('No audio returned; no fallback was called.')
b=base64.b64decode(inline['data']);out=Path('audio/criminology-gemini-raw.wav')
if b[:4]==b'RIFF':out.write_bytes(b)
else:
 with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b)
print('Saved Gemini narration WAV; verify duration and align before publishing.')
