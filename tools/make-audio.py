#!/usr/bin/env python3
"""Саундтрек для ролика: мягкий пэд, арпеджио и шипение-«вуш» на переходах между сценами.
Запуск: python3 tools/make-audio.py <выход.wav> [длительность] ; тайминги переходов совпадают с tools/record-video.mjs"""
import math, random, struct, sys, wave

out = sys.argv[1]
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 60.5
SR = 44100
N = int(SR * DUR)
L = [0.0] * N
R = [0.0] * N
random.seed(7)

BPM = 96
BEAT = 60 / BPM
BAR = BEAT * 4
CHORDS = [  # Am9, Fmaj7, Cmaj7, G6
    [110.0, 164.81, 196.0, 246.94, 261.63],
    [87.31, 130.81, 164.81, 220.0, 261.63],
    [130.81, 196.0, 246.94, 329.63, 392.0],
    [98.0, 146.83, 246.94, 329.63, 293.66],
]
ARP = [[0, 2, 3, 4, 3, 2, 1, 2], [1, 3, 4, 5, 4, 3, 2, 3]]

def add(buf, start, samples, gain=1.0):
    i0 = int(start * SR)
    for k, v in enumerate(samples):
        j = i0 + k
        if 0 <= j < N:
            buf[j] += v * gain

# --- пэд: каждый аккорд звучит один такт, с плавным входом и выходом
for bar in range(int(DUR / BAR) + 2):
    ch = CHORDS[bar % 4]
    t0 = bar * BAR - 0.35
    length = BAR + 0.9
    n = int(length * SR)
    for f in ch:
        for det, pan in ((0.0, 0.35), (0.6, 0.65)):
            w = [0.0] * n
            for k in range(n):
                t = k / SR
                a = min(1.0, t / 0.9) * min(1.0, (length - t) / 0.9)
                ph = 2 * math.pi * (f + det) * t
                w[k] = (math.sin(ph) + 0.35 * math.sin(2 * ph) + 0.12 * math.sin(3 * ph)) * a * a * 0.028
            add(L, t0, w, 1 - pan)
            add(R, t0, w, pan)

# --- арпеджио-«щипок»
def pluck(f, dur=1.6):
    n = int(dur * SR)
    return [(math.sin(2 * math.pi * f * k / SR) + 0.45 * math.sin(4 * math.pi * f * k / SR) + 0.18 * math.sin(6 * math.pi * f * k / SR)) * math.exp(-5.2 * k / SR) * min(1.0, k / 120) for k in range(n)]

ARP_START = 3.0
step = BEAT / 2
for bar in range(int(DUR / BAR) + 1):
    base = bar * BAR
    ch = CHORDS[bar % 4]
    notes = [ch[1], ch[2], ch[3], ch[4], ch[1] * 2, ch[2] * 2]
    for i, idx in enumerate(ARP[bar % 2]):
        t = base + i * step
        if t < ARP_START or t > DUR - 3.5:
            continue
        f = notes[idx % len(notes)]
        p = pluck(f)
        pan = 0.3 if i % 2 == 0 else 0.7
        add(L, t, p, 0.11 * (1 - pan) * 2)
        add(R, t, p, 0.11 * pan * 2)

# --- эхо
def echo(buf, delays):
    src = buf[:]
    for d, g in delays:
        off = int(d * SR)
        for i in range(off, N):
            buf[i] += src[i - off] * g

echo(L, [(0.47, 0.30), (0.94, 0.16)])
echo(R, [(0.62, 0.30), (1.10, 0.16)])

# --- вуш на переходах
def whoosh(t, dur=0.8, gain=0.16):
    n = int(dur * SR)
    lp = 0.0
    res = []
    for k in range(n):
        x = k / n
        env = math.sin(math.pi * x) ** 2
        c = 0.02 + 0.5 * x * x  # коэффициент фильтра растёт: шум «раскрывается»
        lp += c * ((random.random() * 2 - 1) - lp)
        res.append(lp * env * gain)
    add(L, t, res, 1.0)
    add(R, t + 0.012, res, 1.0)

for t in (2.75, 11.8, 19.2, 32.4, 38.0, 47.8, 55.2):
    whoosh(t)

# --- тихие «клики» на нажатиях в сценах (по сетке, чтобы подчеркнуть интерактив)
def tick(t, f=1500, gain=0.05):
    n = int(0.06 * SR)
    s = [math.sin(2 * math.pi * f * k / SR) * math.exp(-60 * k / SR) * gain for k in range(n)]
    add(L, t, s); add(R, t, s)

for t in (4.9, 7.3, 9.6, 10.2, 11.0, 13.0, 14.0, 15.1, 18.7, 21.2, 22.2, 23.0, 26.8, 28.1, 28.9, 30.1, 34.4, 37.1, 40.0, 44.8, 47.3, 50.2, 51.8, 52.6):
    tick(t)

# --- мастер: громкость, вход и выход, нормализация
peak = max(max(abs(x) for x in L), max(abs(x) for x in R)) or 1
g = 0.82 / peak
fin, fout = 1.2, 3.2
frames = bytearray()
for i in range(N):
    t = i / SR
    f = min(1.0, t / fin) * min(1.0, (DUR - t) / fout)
    l = max(-1, min(1, L[i] * g * f))
    r = max(-1, min(1, R[i] * g * f))
    frames += struct.pack('<hh', int(l * 32767), int(r * 32767))
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(frames))
print('audio ok', out, f'{DUR}s')
