"""A baseball practice kit written in sand3d: home plate, a batting tee that telescopes,
a bat, stitched baseballs and a two-wheel pitching machine. Six joints: the tee slides, the machine swivels and tilts,
its wheels counter-rotate, and the pitched ball travels from the wheels to the plate.

Millimetres; Z up; the pitcher's side is +X, so the machine throws toward -X.
Sizes are regulation where the rules give one (plate 17 in, ball 73.7 mm, bat 34 in)
and plausible otherwise. Built at rest: every joint at 0. Illustrative, not a product drawing.

    python baseball_kit.py out_dir        # writes .glb, .urdf, .usda and .stl
"""
import math
import sys

import sand3d as s3d

BALL_D = 73.7       # 2.9 in, mid-range of the rules' 2.86 to 2.94
PLATE_T = 20


def baseball_kit(machine_x=1900, stand_h=980, arm_h=330, bat_y=-420):
    plate = home_plate()
    tee = s3d.at(batting_tee(), z=PLATE_T)
    bat = s3d.at(baseball_bat(), x=-430, y=bat_y, z=25, ry=89.35, rz=-8)   # lying on its knob and barrel
    machine = s3d.at(pitching_machine(stand_h, arm_h), x=machine_x)

    nip_f = s3d.local(plate, x=machine_x, z=stand_h + arm_h - BALL_D / 2)  # between the wheels
    pitch = s3d.at(baseball("pitch"), on=nip_f)
    s3d.joint("pitch_flight", pitch, nip_f, kind="prismatic", axis="-X", range=(0, machine_x + 400))
    return s3d.assembly("baseball_kit", plate, tee, bat, machine, pitch)


def home_plate(w=431.8, t=PLATE_T, bevel=6):
    """17 in across the front, two 8.5 in sides, two 12 in edges to the point."""
    outline = s3d.poly([(w / 2, -w / 2), (w / 2, w / 2), (0, w / 2), (-w / 2, 0), (0, -w / 2)])
    plate = s3d.extrude("home_plate", outline, t)
    s3d.chamfer(plate, bevel, edges="top")
    s3d.material(plate, "rubber", color="#f3f1ea")
    return plate


def baseball(name="baseball", d=BALL_D, seam_d=1.8, stitches=88, stitch_d=9.6, sink=3.6):
    """A sphere, its seam a wire along the two-lobed curve, and a stitch ridge every few
    millimetres: discs set just under the leather, so each shows as a short tick."""
    ball = s3d.sphere(name, d)
    s3d.material(ball, "leather", color="#f4f1e8", roughness=0.6)
    seam = s3d.wire("seam", s3d.spline(seam_points(d / 2), loop=True), seam_d)
    ticks = s3d.at(s3d.cylinder("stitch", stitch_d, 1.1),
                   on=s3d.along(s3d.spline(seam_points(d / 2 - sink), loop=True), count=stitches))
    red = s3d.merge(seam, ticks)                                   # one mesh, no boolean: 89 fewer nodes to export
    s3d.material(red, "fabric", color="#c22026")
    return s3d.group(name + "_ball", ball, s3d.at(red, z=d / 2))   # the sphere sits on z = 0


def seam_points(r, a=0.4, n=72):
    """The seam of a ball of radius r, about its centre: the usual two-lobed curve."""
    pts = []
    for k in range(n):
        t = 4 * math.pi * k / n
        polar = math.pi / 2 - (math.pi / 2 - a) * math.cos(t)
        turn = t / 2 + a * math.sin(2 * t)
        pts.append((r * math.sin(polar) * math.cos(turn), r * math.sin(polar) * math.sin(turn), r * math.cos(polar)))
    return pts


def baseball_bat(length=864, barrel_d=66, handle_d=25, knob_d=50, grip_l=260):
    """34 in, turned in one piece: knob, handle, taper, barrel, rounded end."""
    b, h, k = barrel_d / 2, handle_d / 2, knob_d / 2
    side = s3d.spline([(k, 0), (k, 9), (h, 32), (h, 0.36 * length), (b, 0.72 * length), (b, length - 40), (0.75 * b, length - 7),
                       (0, length)], tangents=((0, 1), (-1, 0)))
    bat = s3d.revolve("bat", s3d.poly([(0, 0), side]))
    s3d.material(bat, "birch", color="#d8b784")
    grip = s3d.at(s3d.tube("grip", handle_d + 3, handle_d - 2, grip_l), z=34)
    s3d.material(grip, "rubber", color="#1b1b1d")
    band = s3d.at(s3d.tube("band", barrel_d + 1, barrel_d - 6, 14), z=0.74 * length)
    s3d.material(band, "painted_metal", color="#16335c")
    return s3d.group("baseball_bat", bat, grip, band)


def batting_tee(base_d=240, base_t=14, post_d=44, post_h=560, stem_d=34, stem_out=90, travel=380):
    """A weighted base, a post, and a stem that slides up out of it with the ball on its cup."""
    base = s3d.cylinder("tee_base", base_d, base_t)
    s3d.chamfer(base, 4, edges="top")
    post = s3d.at(s3d.tube("tee_post", post_d, stem_d + 1, post_h), z=base_t)
    fixed = s3d.group("tee_stand", base, post)
    s3d.material(fixed, "rubber", color="#1d1d1f")

    slide_f = s3d.local(fixed, z=base_t + post_h)                   # the post's mouth
    stem = s3d.at(tee_stem(stem_d, stem_out), on=slide_f)
    s3d.joint("tee_slide", stem, slide_f, kind="prismatic", axis="+Z", range=(0, travel))
    return s3d.assembly("batting_tee", fixed, stem)


def tee_stem(d=34, out=90, sunk=420, cup_h=36):
    rod = s3d.at(s3d.cylinder("stem_rod", d, sunk + out), z=-sunk)   # most of it inside the post
    cup = s3d.at(s3d.shell(s3d.cone("cup", d, cup_h, d2=d + 22), 3, open="top"), z=out)
    s3d.material([rod, cup], "rubber", color="#2b2b2e")
    ball = s3d.at(baseball("teed"), z=out + cup_h - 14, rz=35)       # nested a little into the cup
    return s3d.group("tee_stem", rod, cup, ball)


def pitching_machine(h=980, arm_h=330, wheel_d=270, gap=BALL_D - 4):
    """Four joints: the head swivels on the tripod and tilts in its yoke; the top wheel
    spins and the bottom one follows it the other way, which is what throws the ball."""
    stand = tripod(h)
    swivel_f = s3d.local(stand, z=h)
    fork = s3d.at(yoke(arm_h), on=swivel_f)
    s3d.joint("swivel", fork, swivel_f, axis="+Z", range=(-40, 40))

    tilt_f = s3d.local(fork, z=arm_h)
    head = s3d.at(cradle(wheel_d, gap), on=tilt_f)
    s3d.joint("tilt", head, tilt_f, axis="+Y", range=(-10, 25))      # positive lifts the nose

    reach = (wheel_d + gap) / 2
    top_f = s3d.local(head, z=reach, rx=90)                          # its normal is the axle
    top = s3d.at(wheel("wheel_top", wheel_d), on=top_f)
    s3d.joint("wheel_top_spin", top, top_f, kind="continuous")
    bottom_f = s3d.local(head, z=-reach, rx=90)
    bottom = s3d.at(wheel("wheel_bottom", wheel_d), on=bottom_f)
    s3d.joint("wheel_bottom_spin", bottom, bottom_f, kind="continuous", follows="wheel_top_spin", ratio=-1)
    return s3d.assembly("pitching_machine", stand, fork, head, top, bottom)


def tripod(h=980, spread=560, leg_d=34, hub_d=110, hub_h=130, foot_d=60):
    hub = s3d.at(s3d.cylinder("hub", hub_d, hub_h), z=h - hub_h)
    leg = s3d.wire("leg", [(hub_d / 2 - 12, 0, h - hub_h / 2), (spread, 0, foot_d / 4)], leg_d)
    foot = s3d.at(s3d.dome("foot", foot_d, foot_d / 2), x=spread)
    s3d.material(foot, "rubber")
    legs = s3d.at(s3d.group("leg_and_foot", leg, foot), on=s3d.ring(3, 0, start=60))
    stand = s3d.group("tripod", hub, legs)
    s3d.material(stand, "painted_metal", color="#2c2f33")
    return stand


def yoke(arm_h=330, span=330, bar=26, deck_d=150, deck_t=22):
    deck = s3d.cylinder("deck", deck_d, deck_t)
    cross = s3d.at(s3d.box("crossbar", bar, span + bar, bar), z=deck_t)
    arm = s3d.at(s3d.box("arm", 60, bar, arm_h + 40 - deck_t), y=span / 2, z=deck_t)
    s3d.fillet(arm, 10, edges="top")
    twin = s3d.transform(s3d.copy(arm), mirror="y")
    fork = s3d.join(deck, cross, arm, twin)
    s3d.material(fork, "painted_metal", color="#2c2f33")
    return fork


def cradle(wheel_d=270, gap=BALL_D - 4, plate_t=14, plate_w=200, motor_d=120, motor_l=110, span=330):
    """About the tilt axis: a spine plate behind the wheels, a motor per wheel, the
    trunnion that sits in the yoke, and the feed chute behind the nip."""
    reach = (wheel_d + gap) / 2
    back = s3d.Frame((0, 62, 0), normal=(0, 1, 0))                   # behind the wheels, looking +Y: its Y is up
    spine = s3d.extrude("spine", s3d.rect(plate_w, 2 * reach + 150, r=40), plate_t, on=back)
    s3d.material(spine, "painted_metal", color="#1f4e8c")
    behind = back.offset(plate_t)
    motors = s3d.at(s3d.cylinder("motor", motor_d, motor_l), on=[behind.move(y=reach), behind.move(y=-reach)])
    s3d.material(motors, "painted_metal", color="#3b3f45")
    pin = s3d.at(s3d.cylinder("trunnion", 30, span), on=s3d.Frame((0, -span / 2, 0), normal=(0, 1, 0)))
    s3d.material(pin, "steel")
    chute = s3d.at(s3d.tube("chute", BALL_D + 26, BALL_D + 12, 430), x=95, ry=76)
    s3d.material(chute, "aluminium")
    return s3d.group("cradle", spine, motors, pin, chute)


def wheel(name, d=270, w=58, hub_d=178, bolts=5):
    tyre = s3d.extrude("tyre", s3d.circle(d) - s3d.circle(hub_d - 2), w, both=True)
    s3d.fillet(tyre, 9, edges="top bottom")
    s3d.material(tyre, "rubber", color="#d6d2c4")
    hub = s3d.extrude("rim", s3d.circle(hub_d), w - 14, both=True)
    s3d.hole(hub, 34, on=s3d.ring(bolts, hub_d / 4 + 6))
    s3d.hole(hub, 22)
    s3d.material(hub, "aluminium")
    return s3d.group(name, tyre, hub)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    kit = baseball_kit()
    for ext in ("glb", "urdf", "usda", "stl"):
        s3d.export(kit, f"{out}/baseball_kit.{ext}")
