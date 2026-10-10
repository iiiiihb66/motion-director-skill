"""Align real Edge voice clips to authored shot windows; audio only."""
from pathlib import Path
import json,subprocess,math
cues=json.loads(Path('data/criminology/narration-cues.json').read_text())
cues[0]['start']=.10
cues[5]['start']=21.10
inputs=[];filters=[];timings=[]
for i,c in enumerate(cues):
 name=c['id'];raw=Path('audio/crim-voice')/(name+'.mp3');trim=Path('/private/tmp')/('crim-trim-'+name+'.wav')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse','-ar','24000','-ac','1',str(trim)],check=True)
 length=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(trim)]))
 window=c['end']-c['start'];tempo=max(1,length/window)
 inputs+=['-i',str(trim)]
 filters.append(f'[{i}:a]atempo={tempo:.6f},afade=t=in:d=0.015,afade=t=out:st={max(0,length/tempo-.035):.4f}:d=0.035,adelay={round(c["start"]*1000)}:all=1[v{i}]')
 timings.append({**c,'end':round(c['start']+length/tempo,4),'source_duration':length,'tempo':round(tempo,4)})
filters.append(''.join(f'[v{i}]' for i in range(len(cues)))+f'amix=inputs={len(cues)}:normalize=0,loudnorm=I=-16:TP=-2:LRA=7,apad,atrim=duration=34[narration]')
subprocess.run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(filters),'-map','[narration]','-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','128k','audio/criminology-narration.mp3'],check=True)
Path('data/criminology/narration-timing.json').write_text(json.dumps(timings,ensure_ascii=False,indent=2))
print(json.dumps([{k:c[k] for k in ['id','start','end','tempo']} for c in timings],indent=2))
