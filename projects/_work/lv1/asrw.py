import sys, numpy as np, subprocess
from faster_whisper import WhisperModel
m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8', cpu_threads=4)
a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, np.float32)
segs, _ = m.transcribe(a, language='th', beam_size=5, vad_filter=False)
for s in segs: print(f"{s.start:6.2f}-{s.end:6.2f} {s.text}", flush=True)
