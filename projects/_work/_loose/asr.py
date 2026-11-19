import sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2], device="cpu", compute_type="int8", cpu_threads=4)
import subprocess,numpy as np; a=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout,np.float32)
segs, info = m.transcribe(a, language="th", beam_size=5, word_timestamps=False, vad_filter=False)
for s in segs: print(f"{s.start:6.2f}-{s.end:6.2f} {s.text}", flush=True)
