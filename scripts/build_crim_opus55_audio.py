"""Original cinematic score + new Chinese narration; no video export."""
from pathlib import Path
import json, math, subprocess, wave, argparse
ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'audio/crim-opus55-cinematic'
DATA = ROOT / 'data/crim-opus55-cinematic'
AUDIO.mkdir(exist_ok=True); DATA.mkdir(exist_ok=True)
CUES = [
 ('entry', .65, 5.7, '一桩案件，是通向整个社会的入口。'),
 ('evidence', 6.65, 11.7, '让证据说话，让判断经得起检验。'),
 ('causes', 12.65, 17.7, '个体，环境，机会。犯罪如何发生？'),
 ('victims', 18.65, 23.7, '看见伤害，倾听沉默，让保护抵达。'),
 ('prevention', 24.65, 29.7, '从理解到预防，让改变先于伤害。'),
 ('justice', 30.65, 35.7, '以事实为基础，以公平为尺度。'),
 ('title', 36.5, 41.6, '犯罪学。理解犯罪，让社会更安全。'),
]

def run(args):
 subprocess.run(args, check=True)

def narrate():
 import asyncio, edge_tts
 async def create():
  for name, start, end, text in CUES:
   target = AUDIO / (name + '.mp3')
   if not target.exists():
    await edge_tts.Communicate(text, 'zh-CN-YunjianNeural', rate='+3%', pitch='-3Hz').save(str(target))
   print('Voice:', name, flush=True)
 asyncio.run(create())

def assemble_voice():
 ins=[]; filters=[]; timings=[]
 for i,(name,start,end,text) in enumerate(CUES):
  raw=AUDIO/(name+'.mp3'); trimmed=AUDIO/(name+'-trim.wav')
  run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse','-ar','44100','-ac','1',str(trimmed)])
  length=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(trimmed)]))
  tempo=max(1,length/(end-start))
  ins+=['-i',str(trimmed)]
  filters.append(f'[{i}:a]atempo={tempo:.7f},afade=t=in:d=0.015,afade=t=out:st={max(0,length/tempo-.04):.5f}:d=0.04,adelay={round(start*1000)}:all=1[v{i}]')
  timings.append({'name':name,'start':start,'end':round(start+length/tempo,4),'text':text,'sourceDuration':length,'tempo':tempo})
 filters.append(''.join(f'[v{i}]' for i in range(len(CUES)))+f'amix=inputs={len(CUES)}:normalize=0,apad,atrim=duration=42,loudnorm=I=-16:TP=-1.5:LRA=6[voice]')
 run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(filters),'-map','[voice]','-ar','44100','-ac','2','-b:a','160k',str(AUDIO/'narration.mp3')])
 (DATA/'narration.json').write_text(json.dumps(timings,ensure_ascii=False,indent=2))
 print('Narration assembled:', json.dumps(timings,ensure_ascii=False),flush=True)

def score():
 import numpy as np
 SR=44100; D=42; n=SR*D
 mix=np.zeros((n,2),dtype=np.float64); rng=np.random.default_rng(55079)
 def add(start,a,gain=1,pan=0):
  offset=round(start*SR)
  if offset<0:a=a[-offset:];offset=0
  m=min(len(a),n-offset)
  if m<=0:return
  gains=np.array([math.cos((pan+1)*math.pi/4),math.sin((pan+1)*math.pi/4)])
  mix[offset:offset+m]+=a[:m,None]*gain*gains
 def env(t,length,attack=.012,release=.2):
  return np.minimum(1,t/attack)*np.clip((length-t)/release,0,1)
 def tone(freq,length,kind='pad'):
  t=np.arange(round(length*SR))/SR
  if kind=='pad':
   a=sum(np.sin(2*np.pi*(freq*(1+d))*t+phase)*amp for d,phase,amp in [(-.003,.1,.23),(0,0,.4),(.003,.4,.23)])
   a+=np.sin(2*np.pi*freq*2*t)*.08
   return a*env(t,length,.5,.6)*(1+.08*np.sin(2*np.pi*.45*t))
  a=np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t)+.045*np.sin(2*np.pi*freq*3*t)
  return a*np.exp(-t*(8 if kind=='pluck' else 3))*env(t,length,.006,.08)
 def kick(length=.48):
  t=np.arange(round(length*SR))/SR
  phase=2*np.pi*(42*t+90*.028*(1-np.exp(-t/.028)))
  return (np.sin(phase)*np.exp(-t*10)+.05*rng.uniform(-1,1,len(t))*np.exp(-t*100))*env(t,length,.002,.06)
 def noise(length,decay=20,bright=False):
  t=np.arange(round(length*SR))/SR; a=rng.uniform(-1,1,len(t))
  if bright:a=a-np.convolve(a,np.ones(12)/12,'same')
  else:a=np.convolve(a,np.ones(24)/24,'same')
  return a*np.exp(-t*decay)*env(t,length,.003,.035)
 # Harmonic bed: D minor, B-flat, F, C; one six-second phrase per scene.
 chords=[[50,57,62,65],[46,53,58,62],[53,60,65,69],[48,55,60,64],[50,57,62,65],[46,53,58,62],[50,57,62,65]]
 for section,chord in enumerate(chords):
  start=section*6
  strength=.55 if section==3 else (1.1 if section>=4 else .85)
  for j,midi in enumerate(chord):
   add(start,tone(440*2**((midi-69)/12),6.6),.14*strength,(-.55,-.2,.2,.55)[j])
  for beat in range(12):
   t=start+beat*.5
   if section!=3 or beat%4==0:add(t,kick(),.62*strength)
   bass=chord[0]-12
   if beat%2==0:add(t,tone(440*2**((bass-69)/12),.7,'bass'),.27*strength)
   if beat%4 in (2,):
    add(t,noise(.22,19,True),.18*strength,.1)
    add(t,tone(185,.13,'bass'),.05*strength,-.1)
   for sub in (0,.25):
    if section!=3:add(t+sub,noise(.07,50,True),.06*strength,(-.3 if sub==0 else .3))
   midi=chord[[0,2,1,3,2,1][beat%6]]+12
   add(t+.25,tone(440*2**((midi-69)/12),.62,'pluck'),.066*strength,math.sin(beat*.8)*.55)
  # Air riser and sub impacts anchor every scene cut.
  if section>0:
   length=1.4;tt=np.arange(round(length*SR))/SR
   air=rng.uniform(-1,1,len(tt)); air=np.convolve(air,np.ones(18)/18,'same')
   rise=(tt/length)**2*np.sin(np.pi*tt/length*.5)
   add(start-length,air*rise,.22,.15)
   add(start,kick(.85),.64)
   add(start,noise(.7,5,True),.18,-.2)
  if section>=4:
   for shot in (1.5,3.5):add(start+shot,noise(.25,12,True),.15,.3)
 # Audible final resolved chord, with a decaying tail into the end.
 for midi in (50,57,62,65,74):add(39.5,tone(440*2**((midi-69)/12),2.5,'pad'),.085)
 t=np.arange(n)/SR
 fade=np.minimum(1,t/.12)*np.minimum(1,(D-t)/.75)
 mix=np.tanh(mix*1.15)*fade[:,None]
 peak=np.max(np.abs(mix)); mix=mix/max(peak,1e-5)*.88
 wav=AUDIO/'score-original.wav'
 with wave.open(str(wav),'wb') as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
 run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-17:TP=-2:LRA=8','-ar','44100','-b:a','192k',str(AUDIO/'score.mp3')])
 print('Original cinematic score created: 42 sec, stereo, 120 BPM',flush=True)

if __name__=='__main__':
 mode=argparse.ArgumentParser();mode.add_argument('mode',choices=['narrate','voice','score']);args=mode.parse_args()
 {'narrate':narrate,'voice':assemble_voice,'score':score}[args.mode]()
