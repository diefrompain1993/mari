"""Original 192-second cyclic scores. Requires numpy and imageio-ffmpeg.
Four eight-bar sections: sparse statement, response, fuller variation, return.
Notes and reverb tails wrap around the buffer for a continuous loop.
SFX remain authored by create-audio.py; no recordings or borrowed melodies.
"""
from pathlib import Path
import json, subprocess
import numpy as np
import imageio_ffmpeg

RATE, DURATION, BAR = 22050, 192, 6
N = RATE * DURATION
out = Path('public/assets/audio')
roots = dict(prologue=45, light=50, approach=52, silence=48, noise=43, cafe=50, resolution=52, finale=48)
report = {}
for track, (name, root) in enumerate(roots.items()):
    rng = np.random.default_rng(1400 + track)
    score = np.zeros((N, 2), dtype=np.float32)
    def note(start, midi, duration, volume, pan, pad=False):
        t = np.arange(int(duration*RATE), dtype=np.float32)/RATE
        freq = 440 * 2**((midi-69)/12)
        if pad:
            env = np.sin(np.pi*t/duration)**2
            sound = np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*freq*1.0018*t)
        else:
            env = (1-np.exp(-t*32))*np.exp(-t/1.65)*np.minimum(1,(duration-t)/.3)
            sound = np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2*t)*np.exp(-t*2)
        signal = sound*env*volume
        stereo = np.column_stack((signal*np.sqrt((1-pan)/2),signal*np.sqrt((1+pan)/2)))
        for delay, gain in [(0,1),(.23,.16),(.51,.10),(1.07,.055)]:
            idx = (int((start+delay)*RATE)+np.arange(len(t)))%N
            score[idx] += stereo*gain
    progression = [0,5,9,7,0,9,5,7]
    motif = [0,7,12,4,9,7,2,4]
    for bar in range(32):
        section = bar//8
        degree = progression[(bar+section*2)%8]
        chord = root + degree
        strength = [.72,.86,1,.65][section]
        for j, interval in enumerate([0,7,16]):
            note(bar*BAR, chord+interval, 8.5, .045*strength, (j-1)*.5, True)
        # Space between notes and alternate responses prevent a short ostinato.
        events = [0.5,3.5] if section in [0,3] else [.5,2.0,3.5,5.0]
        for j, offset in enumerate(events):
            if rng.random()<(.22 if name in ['prologue','silence'] else .08): continue
            tone = motif[(bar*3+j+section+track)%8]
            note(bar*BAR+offset, chord+12+tone, 5, .07*strength, float(rng.uniform(-.55,.55)))
        if section==2 or name=='finale' and section==1:
            note(bar*BAR+4.5, chord+31, 6, .025, -.35)
        if name=='resolution' and section in [1,2]:
            note(bar*BAR+1, chord+24, 3, .022, .45)
    score *= .65 if name in ['prologue','silence'] else .85
    peak = float(np.max(np.abs(score)))
    if peak>.8: score *= .8/peak
    pcm = (score*32767).astype('<i2').tobytes()
    target = out/(name+'.mp3')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','2','-i','pipe:0','-codec:a','libmp3lame','-b:a','96k',str(target)],input=pcm,check=True)
    report[name] = dict(duration=DURATION, sections=4, peak=round(peak,4), bytes=target.stat().st_size)
    print(name, 'rendered', flush=True)
Path('art/score-report.json').write_text(json.dumps(report,indent=2))
