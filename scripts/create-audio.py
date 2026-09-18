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
roots={'prologue':110,'light':146.83,'approach':164.81,'silence':130.81,'noise':98,'cafe':146.83,'resolution':164.81,'finale':130.81}
for name,root in roots.items():
    duration=24; samples=[]; notes=[1,1.5,2,2.25,1.5,1.25,2,1.5]
    for i in range(rate*duration):
        t=i/rate; edge=min(1,t/2,(duration-t)/2);v=0
        for ratio,amp in [(1,.09),(1.5,.055),(2.5,.025)]:
            v+=amp*math.sin(2*math.pi*round(root*ratio*duration)/duration*t)*(1+.15*math.sin(2*math.pi*t/12))
        step=int(t/3);local=t%3;freq=root*notes[step%len(notes)]*2
        env=(1-math.exp(-local*10))*math.exp(-local*1.8)
        v+=.13*math.sin(2*math.pi*freq*t)*env
        if name=='noise':
            beat=t%.6;v+=.16*math.sin(2*math.pi*(48+28*math.exp(-beat*18))*beat)*math.exp(-beat*14)
        if name=='resolution':v+=.025*(1 if math.sin(2*math.pi*freq*t)>0 else -1)*env
        samples.append(v*edge*(.4 if name in ['prologue','silence'] else .8))
    save(name,samples)
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
