import sys,subprocess,numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
a=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-ss","42","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout,np.float32)
segs,_=m.transcribe(a,language="th",beam_size=5,word_timestamps=True)
for s in segs:
  for w in s.words: print(f"{w.start+42:6.2f}-{w.end+42:6.2f} {w.word}")
