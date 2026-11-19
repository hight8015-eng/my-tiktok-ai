import sys,subprocess,numpy as np,json
from faster_whisper import WhisperModel
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
a=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout,np.float32)
segs,_=m.transcribe(a,language="th",beam_size=5,word_timestamps=True,vad_filter=False)
out=[]
for s in segs:
    print(f"{s.start:6.2f}-{s.end:6.2f} {s.text}",flush=True); out.append([s.start,s.end,s.text,[[w.start,w.end,w.word] for w in s.words]])
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
