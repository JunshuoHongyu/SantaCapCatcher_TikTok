"""Synthesize the two extra SFX needed by Santa Cap Catcher (offline)."""
import math
import os
import random
import struct
import wave

OUT = r"E:\HatGame\art"
SR = 44100


def write_wav(name, samples):
    path = os.path.join(OUT, name)
    peak = max(1e-6, max(abs(s) for s in samples))
    norm = 0.92 / peak
    data = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s * norm)) * 32767)) for s in samples)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)
    print(f"{name}  {len(samples) / SR:.2f}s  {len(data) // 1024}KB")


def env(i, n, attack=0.01, decay=0.5, power=2.0):
    t = i / SR
    a = min(1.0, t / attack) if attack > 0 else 1.0
    d = math.exp(-t / max(0.02, decay)) ** power
    return a * d


def boom(dur=0.85):
    random.seed(7)
    n = int(SR * dur)
    out = []
    lp = 0.0
    for i in range(n):
        t = i / SR
        noise = random.uniform(-1, 1)
        lp = lp * 0.86 + noise * 0.14
        # low thump sliding down
        thump = math.sin(2 * math.pi * (110 * math.exp(-t * 4.0) + 42) * t)
        crack = noise * math.exp(-t * 26.0) * 0.9
        body = lp * math.exp(-t * 5.5) * 1.5
        s = crack + body + thump * math.exp(-t * 3.2) * 0.8
        out.append(s * min(1.0, (dur - t) * 8.0))
    return out


def bell(freq, t0, dur, amp=1.0):
    out = []
    n = int(SR * dur)
    for i in range(n):
        t = i / SR
        e = math.exp(-t * 5.5) * min(1.0, t / 0.004)
        s = 0.0
        for k, w in ((1.0, 1.0), (2.01, 0.45), (3.02, 0.22), (4.7, 0.12), (6.3, 0.06)):
            s += w * math.sin(2 * math.pi * freq * k * t)
        out.append(s * e * amp)
    return out


def mix(*tracks):
    n = max(len(t) for t in tracks)
    out = [0.0] * n
    for tr in tracks:
        for i, v in enumerate(tr):
            out[i] += v
    return out


def offset(track, sec):
    return [0.0] * int(SR * sec) + track


def jackpot():
    base = 880.0
    notes = [1.0, 1.26, 1.5, 2.0]
    tracks = [offset(bell(base * m, 0, 1.1, 0.9), i * 0.075) for i, m in enumerate(notes)]
    shimmer = []
    random.seed(3)
    for i in range(int(SR * 0.9)):
        t = i / SR
        shimmer.append(random.uniform(-1, 1) * math.exp(-t * 9) * 0.12)
    return mix(*tracks, shimmer)


if __name__ == "__main__":
    write_wav("Boom.wav", boom())
    write_wav("Jackpot.wav", jackpot())
