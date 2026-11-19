import sys,subprocess,numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
f,a,b=sys.argv[1],float(sys.argv[2]),float(sys.argv[3])
x=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-t",str(b-a),"-i",f,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout,np.float32)
segs,_=m.transcribe(x,language="th",beam_size=5,vad_filter=False)
for s in segs: print(f"{s.start+a:6.2f}-{s.end+a:6.2f} {s.text}")
