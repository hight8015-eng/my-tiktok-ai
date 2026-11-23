# EP3 audio v2 (THE PUPPET MASTER ตอน 3). Run from the render root (tools/score.py, src/timing.json, aud/vo.wav):  python audio_ep3.py
# v1 sounded messy (measured): music sat -5..-47 dB under the voice, SFX swung -25..-57 dB, 8 music cues in 93 s, SFX timed from the script not the picture.
# v2 = a LEVEL MODEL. Every sound is normalised to a target relative to the narration level V (RMS of the voice while it speaks):
#   beds -28 dB | small -18 (steps, paper, door) | mid -13 (whooshes, crowd) | big -8 (the 3 story hits) | music -19 dB, levelled, ducked 3 dB under speech.
# Picture sync: times are taken from shots.js / the animation, not guessed:  punch hits W01 1.75, W11 29.8 (28.7 + at 1.1); door light W05 14.45; paper lands W16 ~41.3;
#   Aren walks 15.0-23.62 (AW stops at x -3), walk() cycle = rate 1.45 -> heel strike every (k+.5)/(2*rate) s.
# Music = 5 acts, one cue each (crossfaded .9 s): hook 0 / inside 14.5 / reveal 47 / villain 55.3 / end 88.2; silence 87.0-88.2 before the last line's hit.
import sys, os, json, wave, numpy as np
sys.path.insert(0, 'tools'); from score import *
from scipy.signal import fftconvolve, butter, sosfilt
from scipy.ndimage import uniform_filter1d
LIB = os.environ.get('SFXLIB', 'E:/Claude Animate/projects/sfx_library/')
T = json.load(open('src/timing.json', encoding='utf-8')); END = T['end']; N = int(END * SR)
def rd(p):
    with wave.open(p) as w: sr = w.getframerate(); ch = w.getnchannels(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    a = a.reshape(-1, ch).mean(1)
    if sr != SR: a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    return a
def wr(p, x):
    x = x / max(1, np.abs(x).max() / .95)
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype(np.int16).tobytes())
vo = rd('aud/vo.wav')[:N]; vo = np.pad(vo, (0, N - len(vo)))
envf = np.array(T['env'], float); env = np.repeat(envf, SR // 30)[:N]; env = np.pad(env, (0, N - len(env)))
speak = np.abs(vo) > 0.02
V = np.sqrt((vo[speak] ** 2).mean())                                  # narration RMS while speaking = the reference for every level
db = lambda d: V * 10 ** (d / 20)
def win_rms_max(x, w=int(.3 * SR)):
    if len(x) < w: return np.sqrt((x ** 2).mean()) + 1e-9
    c = np.cumsum(np.r_[0, x.astype(np.float64) ** 2]); r = np.sqrt((c[w:] - c[:-w]) / w); return r.max() + 1e-9
def trim_lead(x, thr=.03):                                             # the transient lands ON the requested time
    k = np.argmax(np.abs(x) > thr * np.abs(x).max()); return x[max(0, k - int(.004 * SR)):]
B = np.zeros((2, N)); BED = np.zeros((2, N)); QUIET = np.ones(N)       # sfx bus, ambience bus, pre-hit dip curve for beds + music
def put(bus, x, t, pan=0.):
    i = int(t * SR)
    if i < 0 or i >= N: return
    n = min(len(x), N - i); bus[0, i:i + n] += x[:n] * np.sqrt((1 - pan) / 2) * 1.41; bus[1, i:i + n] += x[:n] * np.sqrt((1 + pan) / 2) * 1.41
LV = {'small': -18, 'mid': -13, 'big': -8}
def hit(name, t, tier='small', pan=0., dur=None, rev=0., lpf_hz=None, fade=.03, dip=False, jit=1.):
    x = rd(LIB + name + '.wav'); x = trim_lead(x)
    if dur: x = x[:int(dur * SR)]
    if lpf_hz: x = sosfilt(butter(2, lpf_hz, 'low', fs=SR, output='sos'), x)
    f = int(fade * SR); x = x.copy(); x[-f:] *= np.linspace(1, 0, min(f, len(x)))
    x = x * (db(LV[tier] + jit) / win_rms_max(x))
    if rev: ir = np.exp(-np.arange(int(1.2 * SR)) / SR / .35) * np.random.RandomState(3).randn(int(1.2 * SR)); ir /= np.sqrt((ir ** 2).sum()); x = x + fftconvolve(x, ir)[:len(x)] * rev
    put(B, x, t, pan)
    if dip:                                                           # pre-hit dip: beds + music duck 5 dB for .35 s so the hit lands out of near-silence
        a, z = int((t - .35) * SR), int(t * SR); QUIET[max(0, a):z] = np.minimum(QUIET[max(0, a):z], .56)
        QUIET[z:z + int(.5 * SR)] = np.minimum(QUIET[z:z + int(.5 * SR)], np.linspace(.56, 1, int(.5 * SR)))
def bed(name, t0, t1, rel=-28, xf=.9, pan=0.):                       # looped ambience with equal-power cross-fades at the loop seam and at both ends
    x = rd(LIB + name + '.wav'); x = x * (db(rel) / (np.sqrt((x ** 2).mean()) + 1e-9)); L = int(xf * SR); n = int((t1 - t0) * SR); out = np.zeros(n); pos = 0; first = True
    while pos < n:
        seg = x.copy()
        if not first: seg[:L] *= np.sin(np.linspace(0, np.pi / 2, L))
        end = pos + len(seg)
        if end < n: seg[-L:] *= np.cos(np.linspace(0, np.pi / 2, L))
        m = min(len(seg), n - pos); out[pos:pos + m] += seg[:m]; pos = end - L; first = False
    g = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (xf * SR)); put(BED, out * g, t0, pan)
# ---- ambience: warehouse room tone + fire inside, rain + neon hum on the street (cross-faded, never cut)
bed('drone_dark_m01', 0, 7.3, -30); bed('drone_dark_m01', 14.3, 70.2, -30); bed('amb_fire_m01', 0, 7.3, -32); bed('amb_fire_m01', 14.3, 70.2, -31)
bed('amb_rain_m01', 7.0, 14.7, -26); bed('amb_rain_m01', 69.8, END, -26); bed('neon_hum_m01', 7.0, 14.7, -34); bed('neon_hum_m01', 69.8, END, -34)
# ---- footsteps from the walk cycle (heel strike every (k+.5)/(2*rate) s); the real frames' steps are not logged for walk(), so phase is derived
def steps(t0, t1, rate, g_db=-28, stop=None):
    st = []; k = int(np.ceil(t0 * 2 * rate - .5))
    while True:
        t = (k + .5) / (2 * rate); k += 1
        if t > t1: break
        if t >= t0: st.append(t)
    for i, t in enumerate(st):
        sc = 1.0 if stop is None or t < stop else max(.35, 1 - (t - stop) * 1.5)
        hit('steps_m01', t, 'small', pan=(-.12 if i % 2 else .12), dur=.2, fade=.07, lpf_hz=2600, jit=g_db + 18 + (np.random.RandomState(i).rand() - .5) * 2 + 20 * np.log10(sc) )   # soft: low-passed, -27 dB (v2 at -20 was too much, user note)
steps(15.1, 23.62, 1.45); steps(67.2, 69.95, 1.45); steps(70.1, 73.9, 1.35); steps(74.2, 76.4, 1.35, stop=75.6); steps(84.0, 86.9, 1.0, g_db=-31)
# ---- story effects (t from the picture). Tiers: small -18 / mid -13 / big -8 rel. to the narration
hit('heavy_hit_n01', 1.75, 'big', rev=.3, dip=True); hit('rock_crumble_m01', 1.85, 'small', pan=.15, dur=1.6)        # W01: Aren's fist breaks the right wall
hit('whoosh_soft_n01', 3.55, 'small', dur=.7)                                                                          # blur into W02 (Victor)
hit('whoosh_n01', 6.85, 'mid', dur=.9)                                                                                # push into the street
hit('whoosh_n02', 14.0, 'mid', dur=.9); hit('door_m01', 14.45, 'small', pan=0.)                                         # fgwipe: the base door opens (light ramps 14.45-14.95)
hit('crowd_m01', 21.6, 'small', dur=2.4)                                                                              # fifty heads turn
hit('whoosh_n02', 29.45, 'mid', pan=.2, dur=.6); hit('heavy_hit_m01', 29.8, 'big', pan=-.15, dip=True); hit('rock_crumble_m01', 29.85, 'mid', pan=-.2, dur=2.0)   # W11: the fist passes his head, the wall behind breaks
hit('paper_n02', 41.3, 'small', pan=.1)                                                                              # W16: the list lands on the table
hit('suspense_hit_n01', 50.6, 'mid', dur=2.0)                                                                         # "ทรยศ"
hit('heartbeat_m01', 55.3, 'small', dur=3.0)                                                                          # Victor's smile fades
hit('whoosh_trail_n01', 66.8, 'mid', dur=1.2); hit('whip_n01', 69.85, 'mid', dur=.6)                                  # sweep out of the base, whip to the street
hit('hit_dramatic_10', 92.15, 'big', rev=.4, dip=True)                                                                # last line's button
# ---- bus balance: beds duck under speech; impacts + steps do not (they are timed to the picture)
duck = 1 - .3 * np.clip(env * 2.5, 0, 1)
bus = np.stack([vo, vo]) * .9 + BED * duck * QUIET + B
nom = bus; wr('aud/nomusic.wav', nom)
# ---- music: 5 acts, one cue each; levelled to -19 dB under the narration (measures ~-15 dB in 4 s windows), ducked 3 dB under speech; silent 87.0-88.2
S = Score(END)
S.cue('tension_pulse', 0, 14.9, bpm=92, key='D', k=.8); S.sting('hit_boom', 1.75, .9, 'D')
S.cue('mystery_pizz', 14.2, 33.2, key='D', k=.6, fadein=.9)
S.cue('suspense_reveal', 46.6, 8.9, key='D', k=.7, fadein=.9); S.sting('hit_boom', 50.9, .8, 'D')
S.cue('villain', 54.8, 32.2, bpm=72, key='D', k=.55, fadein=.9); S.sting('braam', 74.1, .6, 'D')
S.cue('dark_ambient', 88.2, 5.3, key='D', k=.65, fadein=.5); S.sting('braam', 92.15, .7, 'D')
S.duck(T['env'], depth=.35); S.voice_eq()
mb = S.mix(rev=.18, end=END); mb = mb[:, :N] if mb.ndim == 2 else np.stack([mb, mb])[:, :N]
m = np.zeros(N);
for c in range(2): m += np.abs(mb[c, :N])
m /= 2; sm = uniform_filter1d(m ** 2, int(3.0 * SR)) ** .5 + 1e-9        # 1.5 s RMS of the bed
tgt = db(-19); gain = np.clip(tgt / sm, 10 ** (-16 / 20), 10 ** (16 / 20)); gain[sm < tgt * 10 ** (-24 / 20)] = 1    # leveller (+-16 dB, 3 s window so stingers keep their punch), leaves true silence alone
gain = uniform_filter1d(gain, int(.5 * SR))
mb = mb * gain; mb = mb * (1 - .2 * np.clip(env * 2.5, 0, 1)) * QUIET
wr('aud/music_bed.wav', mb); wr('aud/music.wav', nom + mb)
print('audio v2 ok', END, 'V=%.1f dBFS' % (20 * np.log10(V)))
