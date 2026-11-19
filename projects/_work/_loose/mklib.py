import sys, json, subprocess, time
sys.path.insert(0, '/home/user/my-tiktok-ai/.claude/skills/storybook-3d-selfdrawn-story/tools')
from score import *
OUT = '/home/user/my-tiktok-ai/projects/music_library'
cat = {}
keys = {'tension_pulse': 'D', 'dark_ambient': 'C', 'mystery_pizz': 'E', 'sneaky': 'A', 'action_drums': 'D', 'chase': 'E', 'epic_rise': 'D', 'villain': 'C',
        'sad_piano': 'A', 'hope': 'G', 'victory': 'C', 'heartbreak': 'E', 'horror': 'C#', 'lofi_investigation': 'F', 'power_awakening': 'D', 'city_night': 'A',
        'flashback': 'G', 'confrontation': 'D', 'calm': 'D', 'comedy': 'F', 'suspense_reveal': 'D'}
for name, c in CUES.items():
    t = time.time(); d = 20.0; S = Score(d + 2); S.cue(name, 0, d, key=keys[name]); S.write(f'/tmp/cue.wav', end=d + (1.8 if c.get('ring') else .1))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/cue.wav', '-b:a', '160k', f'{OUT}/{name}.mp3'])
    cat[name] = {'mood': c['mood'], 'bpm': c['bpm'], 'key': keys[name], 'file': f'{name}.mp3'}; print(name, round(time.time() - t, 1), 's', flush=True)
S = Score(40); x = 0.5
for n in STINGS: S.sting(n, x + 3.2 if n in ('riser_hit', 'reverse_hit') else x); x += 3.6 + (3.2 if n in ('riser_hit', 'reverse_hit') else 0)
S.dur = x; S.write('/tmp/st.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/st.wav', '-b:a', '160k', f'{OUT}/stingers_all.mp3'])
cat['_stingers'] = list(STINGS); json.dump(cat, open(f'{OUT}/music.json', 'w'), indent=1, ensure_ascii=False); print('ok')
