# EP3 audio (THE PUPPET MASTER ตอน 3): VO + SFX bus (projects/sfx_library) -> aud/nomusic.wav ; + score.py music bed (ducked) -> aud/music.wav
# run from the render root (has tools/score.py, src/timing.json, aud/vo.wav):  python audio_ep3.py
# vo.wav = voice/ep3_raw.mp3 through: silenceremove (gap .35 / keep .22) + atempo 1.12  (verified: envelope matches src/timing.json, corr .992 at lag 0)
# Sound plan (SKILL v4.35): ~1 effect per 3 s, voice is the star, silence before the twist, meme sounds none, music enters on turns and is cut dead for shock.
import sys, os, json, wave, numpy as np
sys.path.insert(0, 'tools'); from score import *
from scipy.signal import fftconvolve
LIB = os.environ.get('SFXLIB', 'E:/Claude Animate/projects/sfx_library/')
T = json.load(open('src/timing.json', encoding='utf-8')); END = T['end']; N = int(END * SR)
def rd(p):
    with wave.open(p) as w: sr = w.getframerate(); ch = w.getnchannels(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    a = a.reshape(-1, ch).mean(1)
    if sr != SR: a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    return a
vo = rd('aud/vo.wav')[:N]; vo = np.pad(vo, (0, N - len(vo)))
B = np.zeros((2, N))
def sfx(name, t, g=.5, pan=0., rev=0., lpf_=None, dur=None):
    x = rd(LIB + name + '.wav'); x = x / (np.abs(x).max() + 1e-9)
    if dur: x = x[:int(dur * SR)] * np.linspace(1, 0, min(len(x), int(dur * SR))) ** .3
    if lpf_: x = lpf(x, lpf_)
    if rev: ir = np.exp(-np.arange(int(1.2 * SR)) / SR / .35) * RS.randn(int(1.2 * SR)); ir /= np.sqrt((ir ** 2).sum()); x = x + fftconvolve(x, ir)[:len(x) + int(.6 * SR)][:len(x)] * rev
    i = int(t * SR); n = min(len(x), N - i)
    if n <= 0: return
    B[0, i:i + n] += x[:n] * g * np.sqrt((1 - pan) / 2) * 1.41; B[1, i:i + n] += x[:n] * g * np.sqrt((1 + pan) / 2) * 1.41
def loop(name, t0, t1, g):
    x = rd(LIB + name + '.wav'); x /= np.abs(x).max() + 1e-9; t = t0
    while t < t1: d = min(len(x) / SR, t1 - t); sfx(name, t, g, dur=d); t += len(x) / SR - .5
# ---- beds: warehouse room tone + fire crackle (inside), rain + neon hum (street shots W03-W04 7.1-14.45 and W26-W32 69.95-end)
loop('drone_dark_m01', 0, 7.1, .05); loop('drone_dark_m01', 14.45, 69.95, .05); loop('amb_fire_m01', 0, 7.1, .05); loop('amb_fire_m01', 14.45, 69.95, .06)
loop('amb_rain_m01', 7.1, 14.5, .1); loop('amb_rain_m01', 69.95, END, .09); loop('neon_hum_m01', 7.1, 14.5, .04); loop('neon_hum_m01', 69.95, END, .04)
# ---- effects (t, name, gain, pan, kwargs)
for t, n, g, pan, kw in [
  (1.8, 'heavy_hit_n01', .7, 0, {'rev': .3}), (1.95, 'rock_crumble_m01', .45, .1, {}),           # the wall punch (W01)
  (3.8, 'whoosh_soft_n01', .3, 0, {}), (7.05, 'whoosh_n01', .35, 0, {}),                             # blur into W02, push into the street
  (14.3, 'whoosh_n02', .3, 0, {}), (14.55, 'door_m01', .4, 0, {}),                                   # fgwipe: into the base
  (18.5, 'steps_m01', .22, -.1, {'dur': 5.0}), (21.9, 'crowd_m01', .25, 0, {'dur': 2.0}),            # walking in, fifty heads turn
  (26.95, 'laugh_32', .3, .1, {}),                                                                   # Victor laughs
  (28.95, 'whoosh_n02', .5, .2, {}), (29.3, 'fight_hit_n03', .45, .2, {}),                           # the fist passes the head
  (31.5, 'rock_crumble_m01', .5, -.2, {}), (31.5, 'heavy_hit_m01', .45, -.2, {}),                    # the wall cracks behind
  (40.9, 'paper_n02', .4, .1, {}),                                                                   # the list goes on the table
  (50.5, 'suspense_hit_n01', .45, 0, {}),                                                            # "ทรยศ"
  (55.2, 'heartbeat_m01', .3, 0, {'dur': 3.0}),                                                      # Victor's smile fades
  (66.9, 'whoosh_trail_n01', .35, 0, {}),                                                            # sweep out of the base
  (69.9, 'whip_n01', .35, 0, {}),                                                                    # whip to the street
  (74.1, 'drone_tension_m01', .2, 0, {'dur': 4.0}),                                                  # the cloaked man
  (87.2, 'heartbeat_m01', .25, 0, {'dur': 1.5}), (92.1, 'hit_dramatic_10', .4, 0, {'rev': .4})]:     # "I stop walking" / final hit
    sfx(n, t, g, pan, **kw)
env = np.repeat(np.array(T['env']), SR // 30)[:N]; env = np.pad(env, (0, N - len(env))); duck = 1 - .35 * np.clip(env * 2.5, 0, 1)
nom = np.stack([vo, vo]) * .9 + B * duck
def wr(p, x):
    x = x / max(1, np.abs(x).max() / .95)
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype(np.int16).tobytes())
wr('aud/nomusic.wav', nom)
# ---- music (D minor): enters on turns, silent under the dialogue exchange (23.7-26.3) and before the final reveal (87-88.2)
S = Score(END)
S.cue('tension_pulse', 0, 4.0, bpm=92, key='D', k=.8); S.sting('hit_boom', 1.85, .9, 'D')
S.cue('villain', 4.0, 3.1, bpm=70, key='D', k=.55, fadein=.6)
S.cue('city_night', 7.1, 7.3, bpm=100, key='D', k=.6)
S.sting('dread', 14.5, .6, 'D'); S.cue('mystery_pizz', 14.7, 8.9, key='D', k=.55, fadein=.8)
S.cue('confrontation', 28.5, 6.2, bpm=108, key='D', k=.7); S.sting('hit_boom', 31.5, .8, 'D')
S.cue('lofi_investigation', 35.2, 11.4, bpm=96, key='D', k=.5, fadein=.8)
S.cue('suspense_reveal', 47.3, 7.5, key='D', k=.7); S.sting('hit_boom', 50.9, .8, 'D')
S.cue('tension_pulse', 55.3, 8.0, bpm=84, key='D', k=.5, fadein=.6)
S.cue('city_night', 66.95, 6.8, bpm=100, key='D', k=.5, fadein=.6)
S.cue('dark_ambient', 72.0, 4.2, key='D', k=.6); S.sting('braam', 74.1, .7, 'D')
S.cue('villain', 77.2, 9.6, bpm=72, key='D', k=.55, fadein=.8)
S.cue('dark_ambient', 88.2, 5.2, key='D', k=.65, fadein=.5); S.sting('braam', 92.1, .7, 'D')
S.duck(T['env'], depth=.5); S.voice_eq()
mb = S.mix(rev=.18, end=END) * .24
wr('aud/music_bed.wav', mb); wr('aud/music.wav', nom + mb)
print('audio ok', END)
