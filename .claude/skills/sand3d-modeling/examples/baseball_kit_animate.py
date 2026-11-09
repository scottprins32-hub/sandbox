"""Animate the baseball kit by posing its joints frame by frame, and render each frame.

Builds the kit once, then for each frame sets the six joints with `s3d.pose` and renders
with the same staging as scripts/render_preview.py. Join the frames with ffmpeg:

    python baseball_kit_animate.py FRAMES_DIR
    ffmpeg -framerate 24 -i FRAMES_DIR/%03d.png -pix_fmt yuv420p -crf 18 baseball_kit.mp4
"""
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))
sys.path.insert(0, HERE)

import sand3d as s3d                    # noqa: E402
import baseball_kit as kit              # noqa: E402
import render_preview as preview        # noqa: E402

FRAMES, AIM, PITCH = 90, 30, 30         # aim for 30 frames, then two pitches of 30


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def poses(f, flight=2300):
    aim = ease(f / AIM)
    pitch = ((f - AIM) % PITCH) / (PITCH - 1) if f >= AIM else 0.0
    lower = ease((f - AIM - PITCH) / PITCH)
    return {
        "swivel": 30 * (1 - aim),
        "tilt": 20 * (1 - aim),
        "tee_slide": 320 * aim - 200 * lower,
        "wheel_top_spin": 31.0 * f,                 # the bottom wheel follows it the other way
        "pitch_flight": flight * pitch,
    }


def main(out):
    os.makedirs(out, exist_ok=True)
    s3d.empty_scene()
    root = kit.baseball_kit().root
    scene = preview.stage(root, view=(238, 13), size=(960, 540), samples=24, ground="#b9805a", zoom=1.0,
                          look=(850, 0, 650))
    for f in range(FRAMES):
        for joint, value in poses(f).items():
            s3d.pose(root, value, joint=joint)
        scene.render.filepath = os.path.join(os.path.abspath(out), f"{f:03d}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "frames")
