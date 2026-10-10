"""Microsoft Edge narration clips. No API key, no Gemini/Azure paid calls."""
import asyncio,json
from pathlib import Path
import edge_tts
# Short clauses let narration follow each shot without hurried time compression.
CUES=[('intro',.45,3.9,'案件编号零七九。现场警戒，物证封锁。'),('uv',4.3,7.8,'紫外光下，微量物证，正在显影。'),('path',8.3,12.2,'指纹回路，弹道膛线。重建轨迹。'),('exchange',12.7,16.8,'洛卡德交换定律。接触，留下痕迹。'),('profile',17.2,21.0,'行为侧写，动机解构。连接线索。'),('outline',21.5,24.3,'无声的证据，拼出事件的轮廓。'),('title',25.0,27.9,'这里是，犯罪学。'),('end',28.8,32.8,'真相永不泯灭。结案，归档。')]
async def main():
 d=Path('audio/crim-voice');d.mkdir(exist_ok=True)
 for name,start,end,text in CUES:
  f=d/(name+'.mp3')
  if not f.exists():
   await edge_tts.Communicate(text,'zh-CN-YunjianNeural',rate='+12%',pitch='-4Hz').save(str(f))
  print(name,'saved',flush=True)
 Path('data/criminology/narration-cues.json').write_text(json.dumps([{'id':name,'start':start,'end':end,'text':text} for name,start,end,text in CUES],ensure_ascii=False,indent=2))
asyncio.run(main())
