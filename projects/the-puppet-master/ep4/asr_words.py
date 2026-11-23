# python asr_words.py <audio> <out.json> : Thai ASR with word times (faster-whisper large-v3-turbo; cache on E:)
import sys, json, os, subprocess
import numpy as np
os.environ.setdefault('HF_HOME', r'E:\Claude Animate\render\hf-cache')
from faster_whisper import WhisperModel
m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8', cpu_threads=12)
# decode with ffmpeg (faster-whisper's own av.open call breaks with av 19)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, info = m.transcribe(audio, language='th', word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
out = []
for s in segs:
    out.append({'s': round(s.start, 2), 'e': round(s.end, 2), 'text': s.text.strip(), 'words': [[round(w.start, 2), round(w.end, 2), w.word] for w in (s.words or [])]})
    print(out[-1]['s'], out[-1]['e'], out[-1]['text'], flush=True)
json.dump({'duration': len(audio) / 16000.0, 'segments': out}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print('done', len(audio) / 16000.0)
