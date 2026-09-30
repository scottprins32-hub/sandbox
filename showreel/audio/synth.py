"""Soundtrack for the reel — synthesized from nothing but numpy.

128 BPM, F minor, 8 bars = exactly 15.000 s (one beat = 22 500 samples at
48 kHz, so the grid is sample-exact). Every visual event in src/ has a sound
here at the same beat position: ring ticks, tile clicks that ride each
rotation wave, letter stomps, glass bubbles, montage hits, the pre-drop
silence and the dot's four boops.

Output: assets/soundtrack.wav (48 kHz, stereo, float32)
"""
import os

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
BPM = 128
BEAT = 60 / BPM
DUR = 15.0
N = int(DUR * SR)
TAIL = SR * 4
rng = np.random.default_rng(20260926)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def B(x):
    return x * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def T(n):
    return np.arange(n) / SR


# ── buses ─────────────────────────────────────────────────────────────────
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + TAIL))

    def add(self, t, sig, pan=0.0, gain=1.0):
        sig = np.asarray(sig, dtype=np.float64)
        if sig.ndim == 1:
            a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        i0 = int(round(t * SR))
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        i1 = min(i0 + sig.shape[1], self.x.shape[1])
        if i1 > i0:
            self.x[:, i0:i1] += sig[:, : i1 - i0] * gain


drums, bass, music, fx, gapfx = Bus(), Bus(), Bus(), Bus(), Bus()
rev, dly = Bus(), Bus()  # sends


def send(bus_list, t, sig, pan=0.0, gain=1.0, rv=0.0, dl=0.0):
    for b_ in bus_list:
        b_.add(t, sig, pan, gain)
    if rv:
        rev.add(t, sig, pan, gain * rv)
    if dl:
        dly.add(t, sig, pan, gain * dl)


# ── dsp ───────────────────────────────────────────────────────────────────
def biquad(kind, f, q=0.707):
    f = float(np.clip(f, 10, SR * 0.45))
    w = 2 * np.pi * f / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if kind == "lp":
        b_ = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
    elif kind == "hp":
        b_ = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
    else:  # band-pass, 0 dB peak
        b_ = [al, 0, -al]
    a_ = [1 + al, -2 * cw, 1 - al]
    return np.array(b_) / a_[0], np.array(a_) / a_[0]


def shelf(kind, f, gain_db, q=0.8):
    """RBJ low/high shelf ('ls'/'hs') or peaking ('pk') biquad."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    cw, sw = np.cos(w), np.sin(w)
    if kind == "pk":
        al = sw / (2 * q)
        b_ = [1 + al * A, -2 * cw, 1 - al * A]
        a_ = [1 + al / A, -2 * cw, 1 - al / A]
    else:
        al = sw / np.sqrt(2)
        sA = 2 * np.sqrt(A) * al
        if kind == "ls":
            b_ = [A * ((A + 1) - (A - 1) * cw + sA), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sA)]
            a_ = [(A + 1) + (A - 1) * cw + sA, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sA]
        else:
            b_ = [A * ((A + 1) + (A - 1) * cw + sA), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sA)]
            a_ = [(A + 1) - (A - 1) * cw + sA, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sA]
    return np.array(b_) / a_[0], np.array(a_) / a_[0]


def eq(x, kind, f, gain_db, q=0.8):
    b_, a_ = shelf(kind, f, gain_db, q)
    return signal.lfilter(b_, a_, x, axis=-1)


def filt(x, kind, f, q=0.707):
    b_, a_ = biquad(kind, f, q)
    return signal.lfilter(b_, a_, x, axis=-1)


def sweep(x, kind, f0, f1, q=0.707, curve=None, block=128):
    """Time-varying biquad; cutoff moves f0→f1 (exponential) or along curve(u)."""
    x2 = np.atleast_2d(np.asarray(x, dtype=np.float64))
    out = np.zeros_like(x2)
    n = x2.shape[-1]
    nb = max(1, (n + block - 1) // block)
    zi = np.zeros((x2.shape[0], 2))
    for k in range(nb):
        u = k / max(nb - 1, 1)
        if curve is not None:
            u = curve(u)
        f = f0 * (f1 / f0) ** u
        b_, a_ = biquad(kind, f, q)
        seg = x2[:, k * block : (k + 1) * block]
        y, zi = signal.lfilter(b_, a_, seg, axis=-1, zi=zi)
        out[:, k * block : (k + 1) * block] = y
    return out if np.ndim(x) > 1 else out[0]


def noise(n):
    return rng.standard_normal(n)


def saw(f, n, ph0=None):
    f = np.broadcast_to(np.asarray(f, dtype=np.float64), (n,))
    ph = (np.cumsum(f) / SR + (rng.random() if ph0 is None else ph0)) % 1.0
    dt = np.maximum(f / SR, 1e-9)
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def sine(f, n, ph0=0.0):
    f = np.broadcast_to(np.asarray(f, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * (np.cumsum(f) / SR + ph0))


def fade(x, a=0.002, r=0.01):
    x = np.array(x, dtype=np.float64)
    n = x.shape[-1]
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na:
        x[..., :na] *= np.linspace(0, 1, na)
    if nr:
        x[..., n - nr :] *= np.linspace(1, 0, nr)
    return x


def env_ar(n, a, r_tau):
    t = T(n)
    return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / r_tau)


# ── instruments ───────────────────────────────────────────────────────────
def kick(punch=1.0, length=0.45, tone=48):
    n = int(length * SR)
    t = T(n)
    f = tone + 115 * np.exp(-t / 0.032) + 40 * np.exp(-t / 0.005)
    body = sine(f, n) * np.exp(-t / 0.2)
    click = filt(noise(n) * np.exp(-t / 0.0022), "hp", 1800) * 0.5 * punch
    return fade(np.tanh((body * 1.25 + click) * 1.3) * 0.92, 0.0005, 0.02)


def snare(level=1.0, tail=0.13):
    n = int(0.4 * SR)
    t = T(n)
    tone = sine(185 * (1 + 0.4 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.055) * 0.55
    nz = filt(filt(noise(n), "hp", 1500), "lp", 9000) * np.exp(-t / tail)
    return fade(np.tanh((tone + nz * 0.85) * 1.2) * 0.75 * level)


def clap(level=1.0):
    n = int(0.45 * SR)
    t = T(n)
    e = np.zeros(n)
    for d in (0.0, 0.0105, 0.021, 0.0325):
        td = np.clip(t - d, 0, None)
        e += (t >= d) * np.exp(-td / 0.0045)
    e += (t >= 0.0325) * np.exp(-np.clip(t - 0.0325, 0, None) / 0.11) * 0.8
    x = filt(filt(noise(n), "bp", 1400, 0.9), "hp", 700) * e
    return fade(x * 0.9 * level)


HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) * 1.9


def hat(open_=False, level=1.0):
    n = int((0.32 if open_ else 0.07) * SR)
    t = T(n)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + rng.random() * 6)) for f in HAT_F) / 6
    x = filt(filt(metal * 0.6 + noise(n) * 0.5, "bp", 9500, 0.8), "hp", 6500)
    x *= np.exp(-t / (0.1 if open_ else 0.022))
    return fade(x * 0.55 * level, 0.0005, 0.005)


def tom(f0=90, f1=52, decay=0.22, level=1.0):
    n = int(0.6 * SR)
    t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    x = sine(f, n) * np.exp(-t / decay) + filt(noise(n), "bp", 900, 1.2) * np.exp(-t / 0.02) * 0.4
    return fade(np.tanh(x * 1.4) * 0.8 * level)


def crash(length=2.4, level=1.0, bright=1.0):
    n = int(length * SR)
    t = T(n)
    metal = sum(np.sin(2 * np.pi * f * (3.1 + 0.4 * rng.random()) * t + rng.random() * 6) for f in HAT_F) / 6
    x = noise(n) * 0.7 + metal * 0.5
    x = sweep(x, "lp", 14000 * bright, 3000, 0.6)
    x = filt(x, "hp", 3200)
    x *= np.exp(-t / 0.75) * (1 - np.exp(-t / 0.002))
    return np.stack([x, np.roll(filt(x, "hp", 4000), 37)]) * 0.5 * level


def sub_boom(f0=72, f1=30, length=1.6, level=1.0):
    n = int(length * SR)
    t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = sine(f, n) * np.exp(-t / 0.55) * (1 - np.exp(-t / 0.003))
    return fade(np.tanh(x * 1.6) * 0.85 * level)


def supersaw(notes, n, detune=0.22, voices=7, spread=0.85):
    out = np.zeros((2, n))
    for m in notes:
        f0 = mtof(m)
        for v in range(voices):
            u = v / (voices - 1) - 0.5
            s = saw(f0 * 2 ** (u * detune / 12), n)
            a = (u * 2 * spread + 1) * np.pi / 4
            out[0] += s * np.cos(a)
            out[1] += s * np.sin(a)
    return out / (len(notes) * np.sqrt(voices))


def pluck(m, dur=0.32, bright=3800, level=1.0):
    n = int(dur * SR)
    t = T(n)
    x = saw(mtof(m), n) * 0.7 + saw(mtof(m) * 1.004, n) * 0.5
    x = sweep(x, "lp", bright, 380, 0.9, curve=lambda u: min(1.0, u * 3.2))
    return fade(x * np.exp(-t / 0.13) * 0.6 * level, 0.001, 0.02)


def bell(m, dur=2.8, index=2.2, ratio=3.5, level=1.0):
    n = int(dur * SR)
    t = T(n)
    f = mtof(m)
    I = index * np.exp(-t / 0.4)
    x = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t))
    x = x * np.exp(-t / 0.95) + np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t / 0.22) * 0.3
    return fade(x * (1 - np.exp(-t / 0.0015)) * 0.45 * level, 0.0005, 0.05)


def glass_clink(level=1.0):
    n = int(1.2 * SR)
    t = T(n)
    parts = [(2380, 0.35, 1.0), (3570, 0.22, 0.6), (5120, 0.14, 0.45), (7010, 0.08, 0.3)]
    x = sum(np.sin(2 * np.pi * f * t + rng.random()) * np.exp(-t / d) * a for f, d, a in parts)
    return fade(x * 0.35 * level, 0.0003, 0.05)


def boop(m, level=1.0, length=0.45):
    n = int(length * SR)
    t = T(n)
    f = mtof(m) * (1 + 0.6 * np.exp(-t / 0.011))
    x = sine(f, n) * np.exp(-t / 0.15) + sine(f * 2, n) * np.exp(-t / 0.05) * 0.25
    return fade(x * (1 - np.exp(-t / 0.0015)) * 0.5 * level)


def bloop(f0, f1, dur=0.14, level=1.0):
    n = int(dur * SR)
    t = T(n)
    f = f0 * (f1 / f0) ** np.clip(t / (dur * 0.35), 0, 1)
    x = sine(f, n) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6 * np.exp(-t / (dur * 0.5))
    return fade(x * 0.5 * level)


def blip(f, dur=0.05, f_end=None, level=1.0, square=False):
    n = int(dur * SR)
    t = T(n)
    fr = f if f_end is None else f * (f_end / f) ** (t / dur)
    x = np.sign(sine(fr, n)) * 0.5 if square else sine(fr, n)
    return fade(x * np.exp(-t / (dur * 0.35)) * 0.4 * level, 0.0005, 0.004)


def click(level=1.0, f=5200, q=2.0):
    n = int(0.012 * SR)
    t = T(n)
    x = filt(noise(n) * np.exp(-t / 0.0012), "bp", f, q)
    return x * 1.1 * level


def whoosh(dur, f0, f1, q=1.1, shape="rise", level=1.0, stereo=0.0):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = sweep(noise(n), "bp", f0, f1, q)
    env = {
        "rise": u ** 2.4,
        "fall": (1 - u) ** 2.2,
        "swell": np.sin(np.pi * u) ** 1.4,
        "hit": np.exp(-u * dur / 0.09) * (1 - np.exp(-u * dur / 0.004)),
    }[shape]
    x = x * env * level * 1.4
    if stereo:
        y = sweep(noise(n), "bp", f0, f1, q) * env * level * 1.4
        return np.stack([x * (1 - stereo * 0.5) + y * stereo * 0.5, x * (1 - stereo * 0.5) - y * stereo * 0.5])
    return x


def pan_sweep(sig, p0, p1):
    sig = np.asarray(sig)
    n = sig.shape[-1]
    p = np.linspace(p0, p1, n)
    a = (p + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)


def riser(dur, f0=180, f1=1600, level=1.0):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = sweep(noise(n), "bp", 400, 7000, 0.9) * 0.6
    ph = np.cumsum(f0 * (f1 / f0) ** u) / SR
    x += (np.sin(2 * np.pi * ph) + 0.4 * np.sin(4 * np.pi * ph * 1.004)) * 0.25
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * np.cumsum(4 + 22 * u ** 2) / SR)
    return x * u ** 2.2 * trem * level


def reverse_crash(dur=0.6, level=1.0):
    c = crash(dur + 0.4, level)[:, : int(dur * SR)]
    return c[:, ::-1] * np.linspace(0, 1, c.shape[1]) ** 1.5


def stab(notes, dur=0.4, level=1.0, bright=6500):
    n = int(dur * SR)
    t = T(n)
    x = supersaw(notes, n, detune=0.28)
    x = sweep(x, "lp", bright, 700, 0.8)
    return fade(x * np.exp(-t / 0.12) * 1.2 * level, 0.001, 0.03)


# ── harmony ───────────────────────────────────────────────────────────────
FM9 = [53, 56, 60, 63, 67]
DB9 = [49, 53, 56, 60, 63]
AB7 = [51, 56, 60, 63, 67]
EB69 = [51, 55, 58, 60, 65]
ROOTS = {"F": 29, "Db": 25, "Ab": 32, "Eb": 27}
# (start beat, end beat, chord, root)
PROG = [
    (0, 4, FM9, "F"), (4, 8, FM9, "F"), (8, 12, DB9, "Db"), (12, 16, AB7, "Ab"),
    (16, 20, EB69, "Eb"), (20, 24, FM9, "F"), (24, 26, DB9, "Db"), (26, 28, EB69, "Eb"),
    (28, 32, FM9, "F"),
]


def pad_layer():
    """Supersaw pad through a lowpass that opens with the energy curve."""
    cut = lambda beat: np.interp(beat, [0, 3.9, 4, 16, 16.01, 19.4, 20, 24, 27.4, 28, 30, 32],
                                 [260, 1500, 2100, 2600, 1800, 2400, 5200, 2600, 5200, 3200, 1600, 700])
    for b0, b1, ch, _ in PROG:
        n = int(B(b1 - b0) * SR) + int(0.35 * SR)
        x = supersaw(ch, n, detune=0.24)
        beats = b0 + np.arange(n) / SR / BEAT
        # block-wise lowpass following the automation curve
        y = np.zeros_like(x)
        zi = np.zeros((2, 2))
        blk = 256
        for k in range(0, n, blk):
            b_, a_ = biquad("lp", cut(beats[min(k, n - 1)]), 0.9)
            y[:, k : k + blk], zi = signal.lfilter(b_, a_, x[:, k : k + blk], axis=-1, zi=zi)
        env = np.ones(n)
        na = int(0.06 * SR)
        env[:na] = np.linspace(0, 1, na)
        env[-int(0.35 * SR):] = np.linspace(1, 0, int(0.35 * SR)) ** 2
        lvl = 0.42 if b0 == 0 else 0.55
        if b0 == 16:
            lvl = 0.7
        if b0 == 28:
            t = T(n)
            env *= np.exp(-np.clip(t - B(2.2), 0, None) / 0.55)
        send([music], B(b0), y * env, gain=lvl, rv=0.25)


def bass_layer():
    for b0, b1, _, r in PROG:
        root = ROOTS[r]
        if b0 in (0,):
            continue
        dur = B(b1 - b0)
        n = int(dur * SR)
        t = T(n)
        sub = sine(mtof(root + 12), n) * 0.55
        if b0 == 28:
            sub *= np.exp(-t / 1.3)
        sub = fade(sub, 0.004, 0.03)
        send([bass], B(b0), sub, gain=0.42)
        if b0 in (16, 28):
            continue
        # off-beat mid bass: the & of every beat, octave on the a
        for k in range(int(b1 - b0)):
            for off, oct_, ln in ((0.5, 12, 0.2), (0.75, 24, 0.12)):
                m = root + oct_ + 12
                nn = int(B(ln) * SR)
                tt = T(nn)
                x = saw(mtof(m), nn) + saw(mtof(m) * 1.007, nn) * 0.7
                x = sweep(x, "lp", 1500, 240, 1.0)
                x = fade(x * np.exp(-tt / 0.09) * 0.45, 0.002, 0.01)
                send([bass], B(b0 + k + off), x, gain=0.8)


def arp_layer():
    order = [0, 2, 4, 3, 1, 3, 4, 2]
    for b0, b1, ch, _ in PROG:
        if b0 not in (8, 12, 20, 24, 26):
            continue
        notes = [m + 12 for m in ch]
        steps = int((b1 - b0) * 4)
        for s in range(steps):
            m = notes[order[s % len(order)]]
            bright = 1800 + 2600 * (s / steps)
            pan = 0.45 * np.sin(s * 0.9)
            send([music], B(b0 + s / 4), pluck(m, bright=bright), pan=pan, gain=0.34, dl=0.35, rv=0.1)


def drums_layer():
    kicks = []
    # heartbeat under the intro
    for bt, lv in ((1, 0.5), (1.5, 0.28), (2, 0.55), (2.5, 0.3), (3, 0.6)):
        send([drums], B(bt), kick(0.3, 0.35, 40), gain=lv)
    four = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27]
    for bt in four:
        send([drums], B(bt), kick(), gain=0.95)
        kicks.append(B(bt))
    for bt in (16.0, 17.5, 18.75):
        send([drums], B(bt), kick(1.0, 0.6, 40), gain=0.95)
        kicks.append(B(bt))
    for bt in (28.0,):
        send([drums], B(bt), kick(1.2, 0.8, 38), gain=1.0)
        kicks.append(B(bt))
    for bt in (29.0, 30.0, 31.0):
        send([drums], B(bt), kick(0.7, 0.45, 42), gain=0.6)
        kicks.append(B(bt))
    # claps / snares
    for bt in (5, 7, 9, 11, 13, 15, 21, 23, 25, 27):
        send([drums], B(bt), clap(), gain=0.5, rv=0.18)
        send([drums], B(bt), snare(0.5), gain=0.3)
    send([drums], B(18.0), snare(1.0, 0.2), gain=0.55, rv=0.4)
    send([drums], B(18.0), clap(), gain=0.5, rv=0.4)
    # fills
    for k, bt in enumerate(np.arange(7.5, 8.0, 0.125)):
        send([drums], B(bt), snare(0.5 + k * 0.12), gain=0.35, rv=0.1)
    for k, bt in enumerate(np.arange(11.0, 12.0, 0.125)):
        send([drums], B(bt), snare(0.25 + k * 0.08), gain=0.3, rv=0.08)
    # hats
    for bt16 in range(8, 16 * 7 * 4 // 4):
        bt = bt16 / 4
        if bt < 2 or bt >= 27.5:
            continue
        if 16 <= bt < 20:  # half-time: sparse eighths
            if bt16 % 2:
                continue
            lv = 0.18
        elif bt < 4:
            lv = 0.05 + 0.12 * (bt - 2) / 2
        else:
            lv = (0.28 if bt16 % 4 == 2 else 0.16 if bt16 % 2 == 0 else 0.11)
        o = bt16 % 4 == 2 and bt >= 4 and not (16 <= bt < 20)
        send([drums], B(bt), hat(o, 1.0), pan=0.28, gain=lv * (0.9 if o else 1.0))
    for bt in np.arange(28.5, 31.6, 0.5):
        send([drums], B(bt), hat(False), pan=0.25, gain=0.12)
    return kicks


def impact(t, level=1.0, crash_len=2.2, boom=(72, 30, 1.6), wide=True):
    send([fx], t, sub_boom(*boom), gain=0.55 * level)
    send([fx], t, crash(crash_len, 1.0), gain=0.5 * level, rv=0.3)
    send([fx], t, whoosh(0.5, 3000, 400, 0.7, "hit", 1.0, stereo=0.8 if wide else 0), gain=0.55 * level, rv=0.3)


# ── scene by scene sound design ──────────────────────────────────────────
def s1_ignite():
    send([fx], 0.02, blip(1250, 0.09, 880), gain=0.7, rv=0.3)
    send([fx], 0.02, sub_boom(60, 38, 0.6), gain=0.25)
    # crosshair rulers shoot left and right
    for p in (-0.85, 0.85):
        send([fx], B(0.5), whoosh(0.34, 900, 6500, 1.0, "hit", 0.7), pan=p, gain=0.6, rv=0.2)
    # HUD boot chatter from each corner
    for (b0, b1, p) in ((0.6, 1.6, -0.8), (0.9, 1.7, 0.8), (1.2, 2.2, -0.6), (1.5, 2.5, 0.6)):
        for tt in np.sort(rng.uniform(B(b0), B(b1), 7)):
            send([fx], tt, blip(rng.choice([2400, 3100, 3700, 4400]), 0.018, square=True), pan=p, gain=0.12)
    # ring A: clockwise zip; ring B: dashed, falling
    n = int(B(0.55) * SR)
    u = np.linspace(0, 1, n)
    z = sine(620 * (1400 / 620) ** u, n) * np.sin(np.pi * u) ** 0.8 * 0.22
    send([fx], B(1.0), z, gain=0.8, rv=0.3, dl=0.2)
    send([fx], B(1.0), click(1.0, 3000), gain=0.6)
    n = int(B(0.55) * SR)
    u = np.linspace(0, 1, n)
    gate = (np.sin(2 * np.pi * 26 * u * B(0.55)) > 0).astype(float)
    z = sine(1500 * (700 / 1500) ** u, n) * np.sin(np.pi * u) ** 0.8 * gate * 0.18
    send([fx], B(1.5), filt(z, "lp", 6000), gain=0.8, rv=0.25)
    # ring C: 72 ticks sweep around the dial
    for i in range(72):
        a = i / 72 * 2 * np.pi - np.pi / 2
        major = i % 9 == 0
        send([fx], B(2.0) + (i / 72) * B(0.55), click(1.0 if major else 0.45, 6500 if major else 8000),
             pan=np.cos(a) * 0.75, gain=0.35)
    # phyllotaxis shimmer
    for k in range(64):
        tt = B(2.05) + (k / 64) * B(0.78) + rng.uniform(0, 0.01)
        f = 2200 * 2 ** (k / 64 * 1.6) * rng.choice([1, 1.5, 2])
        send([fx], tt, blip(f, 0.08), pan=rng.uniform(-0.8, 0.8), gain=0.1, rv=0.35, dl=0.2)
    # inhale, then the iris
    send([fx], B(3.0), whoosh(B(0.5), 5000, 350, 1.3, "rise", 0.8), gain=0.5, rv=0.2)
    send([fx], B(3.5), whoosh(B(0.5), 250, 6000, 0.9, "rise", 1.0, stereo=0.6), gain=0.75)
    send([fx], B(0.0), riser(B(4.0), 110, 900, 1.0), gain=0.22)


def s2_type():
    impact(B(4.0), 1.0)
    send([music], B(4.0), stab(FM9, 0.5), gain=0.5, rv=0.25)
    send([fx], B(4.72), whoosh(0.18, 3000, 300, 1.0, "fall"), gain=0.3)
    # FOLLOWS: letters snake in from the right
    w = whoosh(0.46, 1100, 2600, 1.2, "swell", 1.0)
    send([fx], B(5.0), pan_sweep(w, 0.85, -0.6), gain=0.55, rv=0.2)
    n = int(0.45 * SR)
    send([fx], B(5.0), pan_sweep(sine(420 * (230 / 420) ** np.linspace(0, 1, n), n) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.2, 0.8, -0.5), gain=0.6)
    z = blip(900, 0.16, 1900)
    send([fx], B(5.62), pan_sweep(z, -0.5, 0.6), gain=0.35)
    # MOTION: six letters stomp down
    for i in range(6):
        tt = B(6.0) + i * 0.055
        p = -0.7 + i * 0.28
        send([fx], tt, tom(95 - i * 4, 50, 0.2), pan=p, gain=0.6, rv=0.1)
        send([fx], tt, click(0.8, 3500), pan=p, gain=0.4)
    # the portal irises open
    n = int(B(0.3) * SR)
    u = np.linspace(0, 1, n)
    sh = sum(sine(f * (1.6 ** u), n) for f in (1320, 1980, 2640)) / 3 * u ** 1.5 * 0.2
    send([fx], B(6.95), sh, gain=0.7, rv=0.5, dl=0.2)
    # the dive through the counter
    send([fx], B(7.25), whoosh(B(0.75), 180, 7000, 0.9, "rise", 1.0, stereo=0.7), gain=0.75, rv=0.1)
    send([fx], B(7.25), riser(B(0.75), 200, 1400, 1.0), gain=0.2)
    impact(B(8.0), 0.55, 1.4, (65, 34, 0.9))


def s3_geometry():
    import math
    T0, COLS = 192, 10
    tiles = []
    for j in range(6):
        for i in range(10):
            mx, my = i * T0 + T0 / 2, -36 + j * T0 + T0 / 2
            tiles.append((i, j, mx, math.hypot(mx - 960, my - 540)))
    pan = lambda mx: (mx / 1920) * 1.6 - 0.8
    waves = [
        (9.0, lambda i, j, d: (i + j) * 0.014 + 0.26, 5200),
        (9.5, lambda i, j, d: d * 0.00021 + 0.24, 4300),
        (10.5, lambda i, j, d: d * 0.00018 + 0.2, 6100),
    ]
    for bt, fn, f in waves:
        send([fx], B(bt), whoosh(0.4, 700, 3500, 1.0, "swell", 0.8, stereo=0.5), gain=0.3)
        for (i, j, mx, d) in tiles:
            send([fx], B(bt) + fn(i, j, d), click(0.6, f * rng.uniform(0.9, 1.1), 3.0), pan=pan(mx), gain=0.28)
    # the flip: card-snaps sweeping left → right
    for (i, j, mx, d) in tiles:
        if j % 2:
            continue
        tt = B(10.0) + i * 0.021 + 0.12
        send([fx], tt, filt(noise(int(0.03 * SR)) * np.exp(-T(int(0.03 * SR)) / 0.006), "bp", 2500, 1.5) * 0.4,
             pan=pan(mx), gain=0.5)
    # gather: plops, then everything is reeled in
    for (i, j, mx, d) in tiles[::2]:
        dn = min(1, d / 1100)
        m0 = B(11.0) + dn * 0.14
        send([fx], m0 + 0.05, bloop(500, 1300, 0.06), pan=pan(mx), gain=0.12)
        send([fx], m0 + 0.28, click(0.5, 7000), pan=pan(mx) * 0.3, gain=0.2)
    send([fx], B(11.0), whoosh(B(1.0), 4500, 300, 1.2, "rise", 1.0), gain=0.55, rv=0.2)
    send([fx], B(11.0), reverse_crash(B(1.0) - 0.01, 1.0), gain=0.4)


def s4_particles():
    impact(B(12.0), 1.35, 3.0, (80, 26, 2.2))
    send([fx], B(12.0), whoosh(0.9, 6000, 700, 0.6, "hit", 1.2, stereo=1.0), gain=0.6, rv=0.4)
    send([music], B(12.0), stab(AB7, 0.7), gain=0.45, rv=0.3)
    # galaxy swirl: a band of air that circles the listener
    n = int(B(1.6) * SR)
    u = np.linspace(0, 1, n)
    x = sweep(noise(n), "bp", 500, 2400, 2.0, curve=lambda v: 0.5 + 0.5 * np.sin(v * 14))
    env = np.sin(np.pi * u) ** 1.2
    ang = 2 * np.pi * np.cumsum(np.full(n, 2.2)) / SR
    a = (np.sin(ang) + 1) * np.pi / 4
    send([fx], B(12.4), np.stack([x * env * np.cos(a), x * env * np.sin(a)]) * 0.35, gain=0.9, rv=0.3)
    # the sphere assembles top to bottom: a descending sparkle run
    run = [99, 96, 92, 91, 87, 84, 80, 79, 75, 72, 68, 67]
    for k in range(24):
        tt = B(14.0) + (k / 24) * 0.42
        send([music], tt, bell(run[k % 12] - 12 * (k // 12), 0.8, 1.2, 2.0, 0.6), pan=rng.uniform(-0.7, 0.7), gain=0.12, dl=0.3, rv=0.3)
    send([fx], B(15.0), sub_boom(110, 60, 0.5, 0.6), gain=0.35)
    send([fx], B(15.3), reverse_crash(B(0.7) - 0.01, 1.0), gain=0.45)
    send([fx], B(15.3), riser(B(0.7), 300, 1200), gain=0.18)


def s5_glass():
    impact(B(16.0), 0.7, 2.0, (60, 30, 1.2))
    send([fx], B(16.0), glass_clink(1.0), gain=0.55, rv=0.5, dl=0.25)
    # jelly wobble after each hit
    for bt, amp in ((16.0, 1.0), (18.0, 0.85)):
        n = int(1.2 * SR)
        t = T(n)
        wob = np.exp(-3.2 * t) * np.sin(2 * np.pi * 2.6 * t)
        x = sine(150 * (1 + 0.18 * wob), n) * np.exp(-t / 0.45) * 0.35
        send([fx], B(bt), x, gain=0.55 * amp, rv=0.2)
    melody = [(16.0, [70, 75]), (17.0, [79]), (17.5, [77]), (18.0, [75, 82]), (19.0, [84])]
    for bt, ms in melody:
        for m in ms:
            send([music], B(bt), bell(m, 3.0, 2.4, 3.5), pan=rng.uniform(-0.4, 0.4), gain=0.32, dl=0.4, rv=0.45)
    for bt, p in ((16.45, -0.5), (16.62, 0.4), (16.85, 0.1), (18.3, 0.5), (18.45, -0.4), (18.62, 0.2)):
        send([fx], B(bt), bloop(320, 1100, 0.13), pan=p, gain=0.55, rv=0.3)
    send([fx], B(17.55), whoosh(B(0.45), 3000, 400, 1.3, "rise", 0.9), gain=0.35)
    send([fx], B(18.0), bloop(260, 90, 0.2, 1.4), gain=0.6, rv=0.2)
    for bt, p in ((19.35, 0.3), (19.45, -0.3), (19.55, 0.0)):
        send([fx], B(bt), bloop(900, 300, 0.12), pan=p, gain=0.45, rv=0.3)
    send([fx], B(19.35), whoosh(B(0.65), 250, 8000, 0.8, "rise", 1.0, stereo=0.8), gain=0.7)
    send([fx], B(19.35), riser(B(0.65), 240, 1700), gain=0.2)


def s6_shader():
    impact(B(20.0), 0.8, 1.8)
    for bt in (21.0, 22.0, 23.0):
        w = whoosh(0.26, 500, 8000, 1.0, "swell", 1.0)
        send([fx], B(bt), pan_sweep(w, -0.8, 0.8), gain=0.5)
        send([fx], B(bt), blip(2600, 0.1, 180), gain=0.35)
    # halftone: a dot-matrix printer chattering in sixteenths
    for k in range(16):
        tt = B(22.0 + k / 16 * 1.0)
        send([fx], tt, blip(rng.choice([1800, 2400, 3000, 3600]), 0.02, square=True), pan=rng.uniform(-0.6, 0.6), gain=0.1)
    # datamosh: glitch bleeps and a riser into the montage
    for k in range(22):
        tt = B(23.0) + rng.uniform(0, B(1.0))
        send([fx], tt, blip(rng.uniform(300, 4000), rng.uniform(0.01, 0.04), rng.uniform(100, 6000), square=True),
             pan=rng.uniform(-0.9, 0.9), gain=0.12)
    send([fx], B(23.0), riser(B(1.0), 300, 2400), gain=0.3)


def s7_montage():
    impact(B(24.0), 0.8, 1.2)
    send([music], B(24.0), stab(DB9, 0.35), gain=0.55, rv=0.2)
    for i, p in enumerate((-0.7, 0.0, 0.7)):
        send([fx], B(24.5) + i * 0.035, whoosh(0.2, 600, 3500, 1.0, "hit", 1.0), pan=p, gain=0.45)
    send([fx], B(24.5), tom(120, 70, 0.15), gain=0.4)
    send([music], B(25.0), stab([m + 5 for m in DB9], 0.3), gain=0.55, rv=0.2)
    send([drums], B(25.0), clap(), gain=0.35)
    for i, p in enumerate((-0.6, 0.6, -0.6, 0.6)):
        send([fx], B(25.5) + i * 0.03, bloop(400 + i * 120, 1300, 0.07), pan=p, gain=0.4)
    send([music], B(26.0), stab(EB69, 0.35), gain=0.6, rv=0.2)
    for i in range(4):
        send([fx], B(26.0) + i * 0.028, whoosh(0.16, 900, 3000, 1.0, "hit", 1.0), pan=-0.6 + i * 0.4, gain=0.35)
    send([fx], B(26.5), glass_clink(0.8), gain=0.45, rv=0.3)
    cuts = [26.5, 26.75, 27.0, 27.125, 27.25, 27.375]
    for k, bt in enumerate(cuts):
        send([drums], B(bt), snare(0.7 + k * 0.08, 0.1), gain=0.42, rv=0.1)
    for bt in np.arange(26.5, 27.5, 0.0625):
        send([drums], B(bt), snare(0.3 + (bt - 26.5) * 0.5, 0.06), gain=0.18)
    send([fx], B(27.0), whoosh(0.3, 5000, 800, 0.8, "hit", 1.0, stereo=1.0), gain=0.4)
    send([fx], B(26.0), riser(B(1.5), 250, 2600, 1.0), gain=0.32)
    # the gap: silence, the dot, the inhale
    send([gapfx], B(27.5) + 0.02, blip(1250, 0.09, 900), gain=0.6, rv=0.0)
    send([gapfx], B(27.75), blip(1000, 0.08, 800, 0.8), gain=0.45)
    send([gapfx], B(27.75), sub_boom(62, 40, 0.3, 0.8), gain=0.3)
    send([gapfx], B(27.6), reverse_crash(B(0.4), 1.0), gain=0.55)


def s8_ident():
    impact(B(28.0), 1.5, 3.2, (78, 25, 2.6))
    send([fx], B(28.0), whoosh(1.1, 7000, 500, 0.6, "hit", 1.3, stereo=1.0), gain=0.6, rv=0.5)
    n = int(2.6 * SR)
    t = T(n)
    ch = supersaw([m for m in FM9] + [41, 48], n, detune=0.3)
    ch = sweep(ch, "lp", 7000, 900, 0.8)
    send([music], B(28.0), ch * np.exp(-t / 0.9) * 1.1, gain=0.55, rv=0.35)
    send([drums], B(28.0), clap(1.2), gain=0.55, rv=0.4)
    # sparks crackle
    for k in range(70):
        tt = B(28.0) + rng.uniform(0, 0.55) ** 1.8
        send([fx], tt, click(rng.uniform(0.2, 0.8), rng.uniform(3000, 9000), 2.5), pan=rng.uniform(-0.9, 0.9), gain=0.3)
    for i, p in enumerate((0.0, 0.2, -0.2, 0.45, -0.45, 0.7)):
        send([fx], B(28.0) + i * 0.035, whoosh(0.35, 1500, 400, 1.0, "fall", 0.7), pan=p, gain=0.25)
    # the dot launches, then boops across C, A, D and lands as the full stop
    n = int(0.3 * SR)
    send([fx], B(28.05), sine(380 * (1200 / 380) ** np.linspace(0, 1, n), n) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.12, pan=-0.3, gain=0.8)
    hops = [(28.75, 77, -0.6), (29.0, 80, -0.15), (29.25, 84, 0.35)]
    for bt, m, p in hops:
        send([fx], B(bt), boop(m), pan=p, gain=0.6, rv=0.25, dl=0.2)
        send([fx], B(bt), tom(70, 48, 0.1, 0.6), pan=p, gain=0.3)
    send([fx], B(29.625), boop(89, 1.1, 0.6), pan=0.6, gain=0.6, rv=0.3, dl=0.3)
    send([music], B(29.625), bell(96, 2.6, 1.8, 3.5), pan=0.6, gain=0.35, rv=0.5, dl=0.35)
    send([fx], B(29.625), tom(60, 42, 0.18, 0.7), pan=0.6, gain=0.3)
    # rule, subtitle, credit, final ripple
    n = int(B(0.6) * SR)
    send([fx], B(29.5), sine(700 * (1600 / 700) ** np.linspace(0, 1, n), n) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.06, gain=0.6, rv=0.3)
    send([fx], B(29.625), whoosh(0.9, 1800, 6000, 0.7, "swell", 0.9, stereo=0.8), gain=0.25, rv=0.5)
    for k in range(10):
        tt = B(30.0) + k * 0.032
        send([fx], tt, blip(rng.choice([2800, 3300, 3900]), 0.015, square=True), pan=(k / 10 - 0.5) * 0.8, gain=0.07)
    for m in (65, 72, 77):
        send([music], B(31.0), bell(m, 2.2, 1.5, 3.5), gain=0.2, rv=0.55, dl=0.3)
    n = int(0.6 * SR)
    t = T(n)
    wub = sweep(supersaw([41, 53, 60], n, 0.2), "lp", 300, 2200, 1.4, curve=lambda u: np.sin(np.pi * u))
    send([music], B(31.0), wub * np.exp(-t / 0.3) * 1.2, gain=0.3, rv=0.3)


# ── mix ───────────────────────────────────────────────────────────────────
def make_ir(rt60=1.8, dur=2.6, pre=0.018):
    n = int(dur * SR)
    t = T(n)
    ir = rng.standard_normal((2, n)) * np.exp(-6.91 * t / rt60)
    dark = filt(ir, "lp", 2200)
    w = np.clip(t / (rt60 * 0.6), 0, 1)
    ir = ir * (1 - w) + dark * w
    ir = filt(filt(ir, "lp", 7500), "hp", 200)
    for d, g in ((0.011, 0.5), (0.019, 0.38), (0.027, 0.3), (0.041, 0.22)):
        ir[0, int(d * SR)] += g
        ir[1, int(d * SR * 1.07)] += g * 0.9
    ir = np.concatenate([np.zeros((2, int(pre * SR))), ir], axis=1)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def pingpong(x, delay, fb=0.42, reps=6):
    out = np.zeros_like(x)
    d = int(delay * SR)
    cur = (x[0] + x[1]) * 0.5
    for k in range(1, reps + 1):
        cur = filt(cur, "lp", 5200)
        ch = k % 2
        if k * d < out.shape[1]:
            out[ch, k * d :] += cur[: out.shape[1] - k * d] * fb ** (k - 1)
    return out


def sidechain(kicks, depth=0.62, rel=0.13):
    g = np.ones(N + TAIL)
    for tk in kicks:
        i = int(tk * SR)
        n = int(0.5 * SR)
        e = 1 - depth * np.exp(-T(n) / rel)
        seg = g[i : i + n]
        g[i : i + n] = np.minimum(seg, e[: len(seg)])
    return uniform_filter1d(g, int(0.003 * SR))


def stutter(x):
    """Beat-repeat roll over the last half beat before the montage."""
    y = x.copy()
    t0 = B(23.5)
    pattern = [(0.125, 2), (0.0625, 2), (0.03125, 4)]
    pos = t0
    for ln, reps in pattern:
        n = int(B(ln) * SR)
        src = x[:, int(t0 * SR) : int(t0 * SR) + n].copy()
        src = fade(src, 0.001, 0.002)
        for r in range(reps):
            i = int(pos * SR)
            y[:, i : i + n] = src * (0.9 + 0.1 * r)
            pos += B(ln)
    return y


def crush(x, t0, t1, bits=5, hold=4):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    seg = x[:, i0:i1]
    q = 2 ** bits
    held = np.repeat(seg[:, ::hold], hold, axis=1)[:, : seg.shape[1]]
    c = np.round(held * q) / q
    mix = np.linspace(0, 0.8, seg.shape[1])
    x[:, i0:i1] = seg * (1 - mix) + c * mix
    return x


def limiter(x, ceiling=0.89, look=0.004, rel=0.08):
    """Look-ahead brick-wall: instant attack (pre-empted by the look-ahead), smooth release."""
    peak = np.max(np.abs(x), axis=0)
    g = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = int(look * SR)
    g = minimum_filter1d(g, 2 * la + 1)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, gi in enumerate(g.tolist()):
        cur = gi if gi < cur else gi + (cur - gi) * a
        out[i] = cur
    return x * uniform_filter1d(out, la)


def main():
    s1_ignite(); s2_type(); s3_geometry(); s4_particles()
    s5_glass(); s6_shader(); s7_montage(); s8_ident()
    pad_layer(); bass_layer(); arp_layer()
    kicks = drums_layer()

    duck = sidechain(kicks)
    groove = drums.x + (bass.x * 1.0 + music.x) * duck
    groove = stutter(groove)
    groove = crush(groove, B(23.0), B(24.0))

    ir = make_ir()
    wet = np.stack([signal.fftconvolve(rev.x[c], ir[c])[: N + TAIL] for c in range(2)])
    echo = pingpong(dly.x, B(0.75))
    mix = groove + fx.x + wet * 0.55 + echo * 0.45

    # the gap before the drop: everything stops except the dot
    g = np.ones(N + TAIL)
    i0, i1 = int(B(27.5) * SR), int(B(28.0) * SR)
    g[i0:i1] = 0
    g = uniform_filter1d(g, int(0.004 * SR))
    mix = mix * g + gapfx.x + np.stack([signal.fftconvolve(gapfx.x[c], ir[c])[: N + TAIL] for c in range(2)]) * 0.25

    mix = mix[:, :N]
    mix = filt(mix, "hp", 30)
    # master EQ: tame the sub so small speakers get the music, add presence and air
    mix = eq(mix, "ls", 110, -6.0)
    mix = eq(mix, "pk", 2800, 1.5, 0.7)
    mix = eq(mix, "hs", 8000, 0.5)
    # loudness: BS.1770 integrated −14 LUFS (the streaming reference), then a
    # brick-wall with enough headroom that inter-sample peaks stay under −1 dBTP
    meter = pyln.Meter(SR)
    for _ in range(3):
        L = meter.integrated_loudness(limiter(np.tanh(mix * 0.9) / 0.9, 0.82).T)
        mix *= 10 ** ((-14.0 - L) / 20)
    mix = np.tanh(mix * 0.9) / 0.9
    mix = limiter(mix, 0.82)
    print(f"integrated loudness {meter.integrated_loudness(mix.T):.2f} LUFS")
    # end clean: the last beat breathes out to silence
    n_out = int(0.6 * SR)
    mix[:, -n_out:] *= np.linspace(1, 0, n_out) ** 2
    mix[:, :64] *= np.linspace(0, 1, 64)

    out = os.path.join(ROOT, "assets", "soundtrack.wav")
    wavfile.write(out, SR, mix.T.astype(np.float32))
    peak = 20 * np.log10(np.max(np.abs(mix)))
    rmsdb = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
    print(f"wrote {out}  peak {peak:.2f} dBFS  rms {rmsdb:.2f} dBFS  {mix.shape[1] / SR:.3f}s")
    # per-bar levels, for a quick balance check
    for k in range(8):
        seg = mix[:, int(B(4 * k) * SR) : int(B(4 * k + 4) * SR)]
        print(f"  bar {k + 1}: rms {20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9):6.2f} dBFS  peak {20 * np.log10(np.max(np.abs(seg)) + 1e-9):6.2f}")


if __name__ == "__main__":
    main()
