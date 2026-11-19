# python3 tools/sfx_clean.py <in.wav> <out.wav> [start] [end]
# v6.4 clean one sound cut from an SFX compilation: rumble high-pass (35 Hz), non-stationary spectral noise gate
# (noisereduce; strength by the cut's own signal-to-noise: .85 when SNR < 45 dB, else .5), trim to the sound
# (onset -40 dB, tail -50 dB of peak), 3 ms fade-in / 40 ms fade-out, peak .89. pip install noisereduce
import sys, wave, numpy as np, noisereduce as nr
from scipy.signal import butter, sosfilt
SR = 48000
def clean(x):
    pk = np.max(np.abs(x)) + 1e-9; fr = x[:len(x) // 960 * 960].reshape(-1, 960); q = np.percentile(np.sqrt((fr ** 2).mean(1)), 10)
    snr = 20 * np.log10(pk / (q + 1e-9)); y = sosfilt(butter(2, 35, 'high', fs=SR, output='sos'), x)
    y = nr.reduce_noise(y=y, sr=SR, stationary=False, prop_decrease=.85 if snr < 45 else .5, n_fft=1024)
    fr = y[:len(y) // 480 * 480].reshape(-1, 480); db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9) - 20 * np.log10(np.max(np.abs(y)) + 1e-9)
    i = np.where(db > -40)[0]; j = np.where(db > -50)[0]; y = y[max(0, i[0] - 1) * 480:min(len(y), (j[-1] + 2) * 480)]
    n = len(y); f = np.ones(n); fi, fo = min(n, 144), min(n, 1920); f[:fi] = np.linspace(0, 1, fi); f[n - fo:] = np.linspace(1, 0, fo)
    return y * f / np.max(np.abs(y * f)) * .89, snr
if __name__ == '__main__':
    w = wave.open(sys.argv[1]); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    s, e = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (0, len(a) / SR)
    y, snr = clean(a[int(s * SR):int(e * SR)])
    with wave.open(sys.argv[2], 'wb') as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((y * 32767).astype(np.int16).tobytes())
    print(f'ok {len(y) / SR:.2f}s, source SNR {snr:.0f} dB (check by ear if < 25 dB: voice / music bleed)')
