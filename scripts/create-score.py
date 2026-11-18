"""Render the original book score and its interactive Foley. Run from the repository root."""
import json
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

RATE = 22050
BAR = 6
SECONDS = 192
OUT = Path("public/assets/audio")
OUT.mkdir(parents=True, exist_ok=True)
# Each bar is in the same D/G tonal family so interactive notes can ring across cuts.
CHORDS = {
    "G": (43, 50, 59, 64), "D": (38, 52, 57, 66), "Em": (40, 50, 55, 59),
    "C": (36, 52, 55, 62), "Am": (45, 52, 60, 67), "Bm": (47, 54, 57, 62),
}
# Melody, accompaniment, harmonic phrase, subdivisions per bar.
SCENES = {
    "prologue": ("felt", "air", "Em C G D", (0,)),
    "light": ("wood", "felt", "G D Em C", (0, 3)),
    "approach": ("pluck", "wood", "C G Am D", (0, 2, 4)),
    "silence": ("felt", "air", "G C Em C", (0,)),
    "noise": ("wood", "pluck", "Am Em C D", (0, 1.5, 3.75)),
    "cafe": ("felt", "wood", "G Bm C D", (0, 3.5)),
    "resolution": ("pixel", "glass", "Em G C D", (0, 2.25, 4.5)),
    "finale": ("felt", "bow", "G Bm C G Am Em C D", (0, 3)),
}
# One breath, a rise, then a falling answer. Second and fourth phrases vary the ending.
PHRASES = [(67, 69, 74, 71), (67, 69, 74, 76), (71, 74, 69, 67), (67, 69, 74, 67)]


def voice(midi, duration, instrument):
    t = np.arange(round(duration * RATE)) / RATE
    phase = (2 * np.pi * 440 * 2 ** ((midi - 69) / 12)) * t
    if instrument in ("air", "bow"):
        phase += .08 * np.sin(2 * np.pi * 4.7 * t)
        sound = np.sin(phase) + .17 * np.sin(2 * phase) + .09 * np.sin(3 * phase)
        if instrument == "bow":
            sound += .36 * np.sin(phase * 1.0016) + .15 * np.sin(4 * phase)
        envelope = np.sin(np.pi * t / duration) ** 1.5
    else:
        partials, decay = {
            "wood": ((1, 2.74, 5.42), .47), "felt": ((1, 2.001, 3.005), 1.45),
            "glass": ((1, 2.42, 4.13), 1.7), "pluck": ((1, 2, 3.01), .86),
            "pixel": ((1, 3, 5), .97),
        }[instrument]
        sound = sum(np.sin(phase * ratio) * np.exp(-t * i * 1.8) / (1 + i * 2)
                    for i, ratio in enumerate(partials))
        envelope = (1 - np.exp(-t * 105)) * np.exp(-t / decay)
    return (sound * envelope * np.minimum(1, (duration - t) / .08)).astype(np.float32)


def render_track(name, lead, backing, harmony, offsets):
    score = np.zeros((RATE * SECONDS, 2), dtype=np.float32)
    def play(start, midi, duration, instrument, level, pan):
        samples = voice(midi, duration, instrument)
        stereo = samples[:, None] * (level * np.sqrt([(1-pan)/2, (1+pan)/2]))
        for delay, gain in [(0, 1), (.21, .13), (.47, .07)]:
            begin = round((start + delay) * RATE) % len(score)
            n = min(len(stereo), len(score)-begin)
            score[begin:begin+n] += stereo[:n] * gain
            score[:len(stereo)-n] += stereo[n:] * gain
    chords = harmony.split()
    for bar in range(32):
        section, phrase = bar // 8, bar % 8
        start = bar * BAR
        bass, *upper = CHORDS[chords[bar % len(chords)]]
        play(start-.3, bass, 6.9, "air", .10, -.08)
        for j, offset in enumerate(offsets):
            play(start+offset, upper[(bar+j)%3], 4.8, backing, .105, (-1)**j*.32)
        if section in (1, 2) or name == "finale":
            play(start+.4, upper[1], 6.4, "bow", .075, .25)
        # Leave complete bars empty around the opening fragments and the night conversation.
        if phrase % 2 == 0 or (section == 2 and name != "silence"):
            melody = PHRASES[(section + phrase//2) % 4]
            for j, offset in enumerate((.55, 1.45, 3.05, 4.65)):
                if name in ("prologue", "silence") and section != 2 and j in (1, 3):
                    continue
                play(start+offset, melody[j], 3.8, lead, (.155,.102,.142,.116)[j], -.12)
        if name == "finale" and phrase in (3,7):
            play(start+2, 62, 4.5, "bow", .13, .18)
    target = OUT / (name + ".mp3")
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v","error","-y","-f","s16le",
                    "-ar",str(RATE),"-ac","2","-i","pipe:0","-codec:a","libmp3lame",
                    "-b:a","96k",str(target)],input=(score*32767).astype("<i2").tobytes(),check=True)
    return dict(duration=SECONDS, sections=4, peak=round(float(np.abs(score).max()),4), bytes=target.stat().st_size)


def cue(name, samples):
    with wave.open(str(OUT/(name+".wav")), "wb") as wav:
        wav.setparams((1,2,RATE,0,"NONE","not compressed"))
        wav.writeframes((samples * 32767).astype("<i2").tobytes())


if __name__ == "__main__":
    rng = np.random.default_rng(14)
    t = np.arange(RATE)/RATE
    grit = np.convolve(rng.normal(0,.3,RATE), [1, .4, -.6, -.8], mode="same")
    folds = sum(np.exp(-((t-center)/width)**2) for center,width in [(.12,.055),(.29,.085),(.53,.11)])
    cue("paper", grit * folds * .22)
    cue("escapement", .4*voice(59,.48,"wood") + .12*voice(78,.48,"wood"))
    for i, midi in enumerate((67,69,74,71,69,74,79)):
        samples = .31 * voice(midi,2.6,"pixel")
        if i == 6:
            samples += .19*voice(71,2.6,"glass") + .13*voice(62,2.6,"felt")
        cue(f"star-{i+1}", samples)
    report = {}
    for name, arrangement in SCENES.items():
        report[name] = render_track(name,*arrangement)
        print(name, flush=True)
    Path("art/score-report.json").write_text(json.dumps(report,indent=2))
