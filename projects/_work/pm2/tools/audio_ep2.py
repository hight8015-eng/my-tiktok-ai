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
loop('amb_rain_m01', 0, 56.2, .09); loop('amb_rain_m01', 56.2, END, .06); loop('neon_hum_m01', 56.2, END, .04)
for t, n, g, pan, kw in [
  (.15, 'gun_cock_s01', .55, .2, {}), (12.55, 'whoosh_n01', .35, 0, {}), (14.8, 'draw_circle_n01', .3, .1, {}), (17.95, 'whoosh_n02', .3, 0, {}),
  (19.75, 'energy_m01', .25, 0, {'lpf_': 4000}), (20.25, 'whoosh_trail_n01', .3, .2, {}), (22.2, 'whisper_wind_m01', .3, -.2, {}),
  (25.1, 'swoosh_n01', .5, .3, {}), (25.2, 'cloth_n01', .35, .3, {}),
  (29.18, 'gunshot_pistol_s01', .85, -.2, {'rev': .5}), (29.65, 'casing_s01', .25, -.3, {}), (30.62, 'bullet_whiz_s01', .55, .4, {}), (31.1, 'ricochet_s01', .45, -.2, {}),
  (41.15, 'whoosh_soft_n01', .4, 0, {}), (41.4, 'steps_m01', .25, -.1, {'dur': 7.5}), (56.0, 'whoosh_n01', .35, 0, {}),
  (58.1, 'fire_burst_n01', .35, -.3, {}), (60.5, 'heavy_hit_n01', .4, .1, {}), (63.8, 'shimmer_63', .25, .2, {}), (66.3, 'reverse_whoosh_n01', .35, 0, {}),
  (68.9, 'energy_shot_n01', .25, 0, {'lpf_': 5000})]:
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
S.cue('tension_pulse', 0, 12.85, bpm=92, key='D', k=.8)
S.cue('dark_ambient', 12.5, 7.4, key='D', k=.8, fadein=.6); S.sting('dread', 12.85, .6, 'D')
S.cue('power_awakening', 19.6, 5.4, key='D', k=.6)
S.sting('reverse_hit', 25.15, .8, 'D')
S.cue('horror', 25.3, 3.2, key='D', k=.6, fade=.25)            # cut dead .2 s before the gunshot: a beat of silence
S.sting('hit_boom', 29.18, .9, 'D')
S.cue('confrontation', 30.4, 10.9, bpm=108, key='D', k=.75)
S.cue('villain', 41.1, 15.1, bpm=70, key='D', k=.55, fadein=.8); S.sting('piano_low', 52.75, .7, 'D')
S.cue('city_night', 56.15, 10.4, bpm=100, key='D', k=.6)
S.sting('riser_hit', 66.55, .8, 'D'); S.cue('dark_ambient', 66.6, 4.7, key='D', k=.6); S.sting('braam', 69.95, .7, 'D')
S.duck(T['env'], depth=.5); S.voice_eq()
mb = S.mix(rev=.18, end=END) * .24
wr('aud/music_bed.wav', mb); wr('aud/music.wav', nom + mb)
print('audio ok', END)
