"""Original procedural ambient score. No borrowed melody, recordings or lyrics."""
from pathlib import Path
import math, wave, random, struct
out=Path('public/assets/audio');out.mkdir(parents=True,exist_ok=True)
rate=22050
def save(name,samples):
    peak=max(.01,max(abs(x) for x in samples)); gain=min(1,.67/peak)
    with wave.open(str(out/(name+'.wav')),'w') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate)
        f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x*gain))*32767)) for x in samples))
# Long music arrangements are rendered separately by create-score.py.
rng=random.Random(14);last=0;air=[]
for i in range(rate*12):
    last=.97*last+.03*rng.uniform(-1,1);air.append(last*.18*min(1,i/rate,(rate*12-i)/rate))
save('air',air)
for name in ['pencil','chime','door','breath','tap']:
    samples=[]
    for i in range(rate*2):
        t=i/rate
        if name in ['pencil','breath']:v=rng.uniform(-1,1)*.06*math.sin(math.pi*t/2)**2
        elif name=='door':v=.08*math.sin(2*math.pi*(110-t*22)*t)*math.exp(-t*4)+rng.uniform(-1,1)*.025*math.exp(-t*7)
        else:v=.09*(math.sin(2*math.pi*523.25*t)+.3*math.sin(2*math.pi*784*t))*math.exp(-t*4)*min(1,t*70)
        samples.append(v)
    save(name,samples)
print('Original score and SFX rendered')
