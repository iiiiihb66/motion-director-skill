"""Create a restrained 34 s original forensic ambience; audio only, no video render."""
import math,random,wave,struct,subprocess
from pathlib import Path
R=24000;D=34;N=R*D;rng=random.Random(79)
a=[0.0]*N
for i in range(N):
 t=i/R
 env=min(1,t/2,(D-t)/2)
 # Low sustained minor textures with slow, quiet amplitude motion.
 drone=sum(math.sin(2*math.pi*f*t+.3*math.sin(t*.3+j))*.006 for j,f in enumerate([55,82.41,110.15,130.81]))
 a[i]=drone*env
for start in [0,4,8,12.5,17,24.5,28.5]:
 for j in range(min(int(R*1.6),N-int(start*R))):
  t=j/R;e=math.exp(-t*5)
  a[int(start*R)+j]+=.045*e*math.sin(2*math.pi*(46*t+3*(1-math.exp(-t*8))))
# Sparse soft ticks rather than a loud club rhythm.
for k in range(1,32):
 start=k+.18
 for j in range(int(R*.08)):
  i=int(start*R)+j;t=j/R
  a[i]+=.009*math.exp(-t*65)*(math.sin(2*math.pi*920*t)+rng.uniform(-.3,.3))
# Rising friction signals before title, falling air on closure.
noise=0
for i in range(N):
 t=i/R;noise=.94*noise+.06*rng.uniform(-1,1)
 rise=max(0,min(1,(t-21)/3.5)) if t<24.5 else math.exp(-(t-24.5)*3)
 a[i]+=.025*noise*rise
out=Path('audio/criminology-ambience.wav')
with wave.open(str(out),'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(R)
 w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in a))
subprocess.run(['ffmpeg','-y','-v','error','-i',str(out),'-c:a','libmp3lame','-b:a','96k','audio/criminology-ambience.mp3'],check=True)
print('Created restrained ambience; peak amplitude',round(max(map(abs,a)),3))
