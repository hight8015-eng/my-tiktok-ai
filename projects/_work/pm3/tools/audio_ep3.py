# EP2 audio: VO + SFX bus (projects/sfx_library) -> aud/nomusic.wav ; + score.py music bed (ducked) -> aud/music.wav
import sys, json, wave, numpy as np
sys.path.insert(0, 'tools'); from score import *
from scipy.signal import fftconvolve
LIB = '/home/user/my-tiktok-ai/projects/sfx_library/'
T = json.load(open('src/timing.json')); END = T['end']; N = int(END * SR)
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
loop('amb_fire_m01', 0, 7.1, .05); loop('amb_rain_m01', 7.1, 14.45, .08); loop('amb_fire_m01', 14.45, 69.95, .05); loop('amb_rain_m01', 69.95, END, .08)
loop('steps_m01', 15.0, 23.4, .2); loop('steps_m01', 67.2, 69.9, .2); loop('crowd_m01', 19.8, 26.5, .06)
for t, n, g, pan, kw in [
  (1.55, 'swoosh_n02', .4, .3, {}), (1.75, 'heavy_hit_m01', .8, .3, {}), (1.8, 'crash_13', .45, .3, {}), (1.85, 'rock_crumble_m01', .5, .3, {}),
  (4.65, 'draw_circle_n01', .3, 0, {}), (6.95, 'whoosh_n01', .35, 0, {}), (10.9, 'cloth_n01', .35, -.2, {}), (12.8, 'cloth_n02', .3, .2, {}),
  (14.35, 'whoosh_soft_n01', .4, 0, {}), (14.5, 'door_creak_m01', .4, 0, {}), (20.1, 'cloth_n01', .25, -.4, {}), (20.6, 'cloth_n02', .25, .4, {}), (21.2, 'cloth_n01', .22, 0, {}),
  (26.8, 'laugh_31', .3, -.1, {}), (27.0, 'crowd_m01', .15, .3, {'dur': 2.0}),
  (29.6, 'swoosh_n02', .45, .3, {}), (29.8, 'heavy_hit_m01', .85, .2, {}), (29.85, 'rock_crumble_m01', .55, .2, {}), (29.9, 'crash_14', .35, .2, {}),
  (41.2, 'paper_n01', .45, 0, {}), (42.4, 'paper_n02', .25, 0, {}), (66.85, 'whoosh_soft_n01', .35, 0, {}), (69.6, 'door_m01', .3, 0, {}), (69.85, 'whoosh_n01', .4, 0, {}),
  (74.1, 'suspense_hit_m01', .5, 0, {}), (78.25, 'draw_circle_n01', .3, 0, {}), (87.0, 'heartbeat_m01', .45, 0, {}), (89.5, 'reverse_whoosh_n01', .35, 0, {})]:
    sfx(n, t, g, pan, **kw)
# voice ducking of the SFX bus (light) and the dry mix
env = np.repeat(np.array(T['env']), SR // 30)[:N]; env = np.pad(env, (0, N - len(env))); duck = 1 - .35 * np.clip(env * 2.5, 0, 1)
nom = np.stack([vo, vo]) * .9 + B * duck
def wr(p, x):
    x = x / max(1, np.abs(x).max() / .95)
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype(np.int16).tobytes())
wr('aud/nomusic.wav', nom)
# ---- music: spotted cues (D minor), hit points on the beat, silence before the shot, button at the end ----
S = Score(END)
S.cue('villain', 0, 7.1, bpm=70, key='D', k=.7); S.sting('hit_boom', 1.75, .9, 'D'); S.sting('braam', 3.9, .5, 'D')
S.cue('tension_pulse', 7.1, 7.35, bpm=92, key='D', k=.7)
S.cue('dark_ambient', 14.45, 9.2, key='D', k=.8, fadein=.6)
S.cue('confrontation', 23.6, 5.9, bpm=108, key='D', k=.7, fade=.15)          # cut .3 s before the punch: silence, then the hit
S.sting('hit_boom', 29.8, 1.0, 'D'); S.cue('dark_ambient', 30.3, 10.0, key='D', k=.7, fadein=.8)
S.cue('mystery_pizz', 40.3, 14.7, bpm=104, key='D', k=.55); S.sting('dread', 55.0, .5, 'D')
S.cue('tension_pulse', 55.0, 11.9, bpm=92, key='D', k=.7)
S.cue('bossa_lounge', 66.95, 7.0, bpm=126, key='D', k=.5, fade=.1)            # 'everything went to plan' ... cut dead
S.sting('dread', 74.05, .8, 'D'); S.cue('dark_musicbox', 74.2, 12.8, bpm=84, key='D', k=.65)
S.sting('piano_low', 87.0, .8, 'D'); S.sting('riser_hit', 90.0, .7, 'D'); S.sting('braam', 92.0, .6, 'D')
S.duck(T['env'], depth=.5); S.voice_eq()
mb = S.mix(rev=.18, end=END) * .17
wr('aud/music_bed.wav', mb); wr('aud/music.wav', nom + mb)
print('audio ok', END)
